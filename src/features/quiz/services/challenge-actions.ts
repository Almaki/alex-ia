'use server'

import { createClient } from '@/lib/supabase/server'
import type { QuizChallenge, OnlinePilot, QuizQuestion } from '../types'

export async function getOnlinePilots(): Promise<{ data: OnlinePilot[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, fleet, position')
    .gt('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .neq('id', user.id)

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    return { data: [], error: null }
  }

  const userIds = data.map((p) => p.id)

  const { data: statsData, error: statsError } = await supabase
    .from('quiz_player_stats')
    .select('user_id, elo_rating')
    .in('user_id', userIds)

  const statsMap = new Map<string, number>()
  if (!statsError && statsData) {
    statsData.forEach((stat) => {
      statsMap.set(stat.user_id, stat.elo_rating)
    })
  }

  const pilots: OnlinePilot[] = data.map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    elo_rating: statsMap.get(profile.id) ?? 1200,
    fleet: profile.fleet,
    position: profile.position,
  }))

  return { data: pilots, error: null }
}

export async function createChallenge(
  opponentId: string,
  difficulty: 1 | 2 | 3,
  category: string | null
): Promise<{ data: QuizChallenge | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  let query = supabase
    .from('quiz_questions')
    .select('id')
    .eq('difficulty', difficulty)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: questions, error: questionsError } = await query.limit(30)

  if (questionsError) {
    return { data: null, error: questionsError.message }
  }

  if (!questions || questions.length < 10) {
    return { data: null, error: 'No hay suficientes preguntas disponibles para este desafio' }
  }

  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  const selectedQuestionIds = shuffled.slice(0, 10).map((q) => q.id)

  const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('quiz_challenges')
    .insert({
      challenger_id: user.id,
      opponent_id: opponentId,
      status: 'pending',
      difficulty,
      category: category === 'all' ? null : category,
      question_ids: selectedQuestionIds,
      challenger_correct: 0,
      challenger_total_time: 0,
      opponent_correct: 0,
      opponent_total_time: 0,
      challenger_elo_change: 0,
      opponent_elo_change: 0,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  const challenge: QuizChallenge = {
    id: data.id,
    challenger_id: data.challenger_id,
    opponent_id: data.opponent_id,
    status: data.status,
    difficulty: data.difficulty as 1 | 2 | 3,
    category: data.category,
    question_ids: data.question_ids,
    challenger_correct: data.challenger_correct,
    challenger_total_time: data.challenger_total_time,
    opponent_correct: data.opponent_correct,
    opponent_total_time: data.opponent_total_time,
    winner_id: data.winner_id,
    challenger_elo_change: data.challenger_elo_change,
    opponent_elo_change: data.opponent_elo_change,
    expires_at: data.expires_at,
    started_at: data.started_at,
    finished_at: data.finished_at,
    created_at: data.created_at,
  }

  return { data: challenge, error: null }
}

export async function acceptChallenge(
  challengeId: string
): Promise<{ data: QuizChallenge | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('quiz_challenges')
    .select()
    .eq('id', challengeId)
    .single()

  if (fetchError) {
    return { data: null, error: fetchError.message }
  }

  if (existing.opponent_id !== user.id) {
    return { data: null, error: 'No autorizado para aceptar este desafio' }
  }

  if (existing.status !== 'pending') {
    return { data: null, error: 'Este desafio ya no esta pendiente' }
  }

  const startedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('quiz_challenges')
    .update({
      status: 'playing',
      started_at: startedAt,
    })
    .eq('id', challengeId)
    .eq('opponent_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  const challenge: QuizChallenge = {
    id: data.id,
    challenger_id: data.challenger_id,
    opponent_id: data.opponent_id,
    status: data.status,
    difficulty: data.difficulty as 1 | 2 | 3,
    category: data.category,
    question_ids: data.question_ids,
    challenger_correct: data.challenger_correct,
    challenger_total_time: data.challenger_total_time,
    opponent_correct: data.opponent_correct,
    opponent_total_time: data.opponent_total_time,
    winner_id: data.winner_id,
    challenger_elo_change: data.challenger_elo_change,
    opponent_elo_change: data.opponent_elo_change,
    expires_at: data.expires_at,
    started_at: data.started_at,
    finished_at: data.finished_at,
    created_at: data.created_at,
  }

  return { data: challenge, error: null }
}

export async function declineChallenge(challengeId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('quiz_challenges')
    .select('opponent_id, status')
    .eq('id', challengeId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (existing.opponent_id !== user.id) {
    return { error: 'No autorizado para declinar este desafio' }
  }

  if (existing.status !== 'pending') {
    return { error: 'Este desafio ya no esta pendiente' }
  }

  const { error } = await supabase
    .from('quiz_challenges')
    .update({ status: 'declined' })
    .eq('id', challengeId)
    .eq('opponent_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function cancelChallenge(challengeId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('quiz_challenges')
    .select('challenger_id, status')
    .eq('id', challengeId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (existing.challenger_id !== user.id) {
    return { error: 'No autorizado para cancelar este desafio' }
  }

  if (existing.status !== 'pending') {
    return { error: 'Solo se pueden cancelar desafios pendientes' }
  }

  const { error } = await supabase
    .from('quiz_challenges')
    .update({ status: 'cancelled' })
    .eq('id', challengeId)
    .eq('challenger_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function submitChallengeAnswer(
  challengeId: string,
  questionId: string,
  selectedIndex: number,
  isCorrect: boolean,
  timeSeconds: number
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('quiz_challenge_answers')
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      question_id: questionId,
      selected_index: selectedIndex,
      is_correct: isCorrect,
      time_seconds: timeSeconds,
    })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

function calculateEloChange(
  myCorrect: number,
  opponentCorrect: number,
  myTime: number,
  opponentTime: number,
  myElo: number,
  opponentElo: number
): { myChange: number; opponentChange: number } {
  const K = 32

  let winner: 'me' | 'opponent' | 'draw'
  if (myCorrect > opponentCorrect) {
    winner = 'me'
  } else if (opponentCorrect > myCorrect) {
    winner = 'opponent'
  } else {
    winner = myTime < opponentTime ? 'me' : myTime > opponentTime ? 'opponent' : 'draw'
  }

  const expectedMe = 1 / (1 + Math.pow(10, (opponentElo - myElo) / 400))
  const expectedOpponent = 1 - expectedMe

  let actualMe = 0.5
  let actualOpponent = 0.5
  if (winner === 'me') {
    actualMe = 1
    actualOpponent = 0
  } else if (winner === 'opponent') {
    actualMe = 0
    actualOpponent = 1
  }

  const myChange = Math.round(K * (actualMe - expectedMe))
  const opponentChange = Math.round(K * (actualOpponent - expectedOpponent))

  return { myChange, opponentChange }
}

export async function finishChallengeParticipation(
  challengeId: string,
  correctCount: number,
  totalTime: number
): Promise<{ data: QuizChallenge | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data: challenge, error: fetchError } = await supabase
    .from('quiz_challenges')
    .select()
    .eq('id', challengeId)
    .single()

  if (fetchError) {
    return { data: null, error: fetchError.message }
  }

  const isChallenger = challenge.challenger_id === user.id
  const isOpponent = challenge.opponent_id === user.id

  if (!isChallenger && !isOpponent) {
    return { data: null, error: 'No eres participante de este desafio' }
  }

  const updateData: Record<string, number> = {}
  if (isChallenger) {
    updateData.challenger_correct = correctCount
    updateData.challenger_total_time = totalTime
  } else {
    updateData.opponent_correct = correctCount
    updateData.opponent_total_time = totalTime
  }

  const { data: updated, error: updateError } = await supabase
    .from('quiz_challenges')
    .update(updateData)
    .eq('id', challengeId)
    .select()
    .single()

  if (updateError) {
    return { data: null, error: updateError.message }
  }

  const challengerDone = updated.challenger_correct > 0 || updated.challenger_total_time > 0
  const opponentDone = updated.opponent_correct > 0 || updated.opponent_total_time > 0
  const bothDone = challengerDone && opponentDone

  if (bothDone) {
    const { data: challengerStats } = await supabase
      .from('quiz_player_stats')
      .select('elo_rating')
      .eq('user_id', updated.challenger_id)
      .single()

    const { data: opponentStats } = await supabase
      .from('quiz_player_stats')
      .select('elo_rating')
      .eq('user_id', updated.opponent_id)
      .single()

    const challengerElo = challengerStats?.elo_rating ?? 1200
    const opponentElo = opponentStats?.elo_rating ?? 1200

    const { myChange: challengerChange, opponentChange } = calculateEloChange(
      updated.challenger_correct,
      updated.opponent_correct,
      updated.challenger_total_time,
      updated.opponent_total_time,
      challengerElo,
      opponentElo
    )

    const newChallengerElo = Math.max(0, challengerElo + challengerChange)
    const newOpponentElo = Math.max(0, opponentElo + opponentChange)

    let winnerId: string | null = null
    if (updated.challenger_correct > updated.opponent_correct) {
      winnerId = updated.challenger_id
    } else if (updated.opponent_correct > updated.challenger_correct) {
      winnerId = updated.opponent_id
    } else {
      if (updated.challenger_total_time < updated.opponent_total_time) {
        winnerId = updated.challenger_id
      } else if (updated.opponent_total_time < updated.challenger_total_time) {
        winnerId = updated.opponent_id
      }
    }

    await supabase
      .from('quiz_player_stats')
      .upsert({
        user_id: updated.challenger_id,
        elo_rating: newChallengerElo,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })

    await supabase
      .from('quiz_player_stats')
      .upsert({
        user_id: updated.opponent_id,
        elo_rating: newOpponentElo,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })

    const finishedAt = new Date().toISOString()

    const { data: final, error: finalError } = await supabase
      .from('quiz_challenges')
      .update({
        status: 'completed',
        winner_id: winnerId,
        challenger_elo_change: challengerChange,
        opponent_elo_change: opponentChange,
        finished_at: finishedAt,
      })
      .eq('id', challengeId)
      .select()
      .single()

    if (finalError) {
      return { data: null, error: finalError.message }
    }

    const completedChallenge: QuizChallenge = {
      id: final.id,
      challenger_id: final.challenger_id,
      opponent_id: final.opponent_id,
      status: final.status,
      difficulty: final.difficulty as 1 | 2 | 3,
      category: final.category,
      question_ids: final.question_ids,
      challenger_correct: final.challenger_correct,
      challenger_total_time: final.challenger_total_time,
      opponent_correct: final.opponent_correct,
      opponent_total_time: final.opponent_total_time,
      winner_id: final.winner_id,
      challenger_elo_change: final.challenger_elo_change,
      opponent_elo_change: final.opponent_elo_change,
      expires_at: final.expires_at,
      started_at: final.started_at,
      finished_at: final.finished_at,
      created_at: final.created_at,
    }

    return { data: completedChallenge, error: null }
  }

  const partialChallenge: QuizChallenge = {
    id: updated.id,
    challenger_id: updated.challenger_id,
    opponent_id: updated.opponent_id,
    status: updated.status,
    difficulty: updated.difficulty as 1 | 2 | 3,
    category: updated.category,
    question_ids: updated.question_ids,
    challenger_correct: updated.challenger_correct,
    challenger_total_time: updated.challenger_total_time,
    opponent_correct: updated.opponent_correct,
    opponent_total_time: updated.opponent_total_time,
    winner_id: updated.winner_id,
    challenger_elo_change: updated.challenger_elo_change,
    opponent_elo_change: updated.opponent_elo_change,
    expires_at: updated.expires_at,
    started_at: updated.started_at,
    finished_at: updated.finished_at,
    created_at: updated.created_at,
  }

  return { data: partialChallenge, error: null }
}

export async function getQuestionsByIds(
  questionIds: string[]
): Promise<{ data: QuizQuestion[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  if (questionIds.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('id, content, options, correct_index, explanation, difficulty, category, aircraft_type')
    .in('id', questionIds)

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: [], error: null }
  }

  const questions: QuizQuestion[] = data.map((q) => ({
    id: q.id,
    content: q.content,
    options: q.options,
    correct_index: q.correct_index,
    explanation: q.explanation,
    difficulty: q.difficulty as 1 | 2 | 3,
    category: q.category,
    aircraft_type: q.aircraft_type,
  }))

  const orderedQuestions = questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is QuizQuestion => q !== undefined)

  return { data: orderedQuestions, error: null }
}

export async function getChallengeDetails(
  challengeId: string
): Promise<{ data: QuizChallenge | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('quiz_challenges')
    .select()
    .eq('id', challengeId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  const challenge: QuizChallenge = {
    id: data.id,
    challenger_id: data.challenger_id,
    opponent_id: data.opponent_id,
    status: data.status,
    difficulty: data.difficulty as 1 | 2 | 3,
    category: data.category,
    question_ids: data.question_ids,
    challenger_correct: data.challenger_correct,
    challenger_total_time: data.challenger_total_time,
    opponent_correct: data.opponent_correct,
    opponent_total_time: data.opponent_total_time,
    winner_id: data.winner_id,
    challenger_elo_change: data.challenger_elo_change,
    opponent_elo_change: data.opponent_elo_change,
    expires_at: data.expires_at,
    started_at: data.started_at,
    finished_at: data.finished_at,
    created_at: data.created_at,
  }

  return { data: challenge, error: null }
}
