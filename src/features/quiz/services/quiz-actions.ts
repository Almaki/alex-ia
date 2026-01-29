'use server'

import { createClient } from '@/lib/supabase/server'
import type { QuizQuestion, QuizSession, QuizPlayerStats } from '../types'

export async function getQuizQuestions(
  difficulty: number,
  category: string | null,
  aircraftType: string | null,
  limit: number = 10
): Promise<{ data: QuizQuestion[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  let query = supabase
    .from('quiz_questions')
    .select('id, content, options, correct_index, explanation, difficulty, category, aircraft_type')
    .eq('difficulty', difficulty)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (aircraftType) {
    query = query.eq('aircraft_type', aircraftType)
  }

  const { data, error } = await query.limit(limit * 3)

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    return { data: null, error: 'No se encontraron preguntas para los criterios seleccionados' }
  }

  const shuffled = [...data].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(limit, shuffled.length))

  const questions: QuizQuestion[] = selected.map((q) => ({
    id: q.id,
    content: q.content,
    options: q.options,
    correct_index: q.correct_index,
    explanation: q.explanation,
    difficulty: q.difficulty as 1 | 2 | 3,
    category: q.category,
    aircraft_type: q.aircraft_type,
  }))

  return { data: questions, error: null }
}

export async function createQuizSession(
  difficulty: number,
  category: string | null,
  totalQuestions: number
): Promise<{ data: QuizSession | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: user.id,
      mode: 'practice',
      difficulty,
      category: category === 'all' ? null : category,
      total_questions: totalQuestions,
      correct_count: 0,
      score: 0,
      started_at: new Date().toISOString(),
    })
    .select('id, mode, difficulty, category, total_questions, correct_count, score, started_at, finished_at')
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  const session: QuizSession = {
    id: data.id,
    mode: 'practice',
    difficulty: data.difficulty as 1 | 2 | 3,
    category: data.category,
    total_questions: data.total_questions,
    correct_count: data.correct_count,
    score: data.score,
    started_at: data.started_at,
    finished_at: data.finished_at,
  }

  return { data: session, error: null }
}

export async function submitAnswer(
  sessionId: string,
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
    .from('quiz_answers')
    .insert({
      session_id: sessionId,
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

export async function finishQuizSession(
  sessionId: string,
  correctCount: number,
  totalQuestions: number,
  difficulty: number
): Promise<{ data: { eloChange: number; newElo: number } | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const score = correctCount * 100 * difficulty

  const { error: updateError } = await supabase
    .from('quiz_sessions')
    .update({
      correct_count: correctCount,
      score,
      finished_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (updateError) {
    return { data: null, error: updateError.message }
  }

  const { data: currentStats, error: statsError } = await supabase
    .from('quiz_player_stats')
    .select('elo_rating, total_sessions, total_correct, total_answered, best_streak, current_streak')
    .eq('user_id', user.id)
    .single()

  const currentElo = currentStats?.elo_rating ?? 1200
  const currentTotalSessions = currentStats?.total_sessions ?? 0
  const currentTotalCorrect = currentStats?.total_correct ?? 0
  const currentTotalAnswered = currentStats?.total_answered ?? 0
  const currentBestStreak = currentStats?.best_streak ?? 0
  const currentCurrentStreak = currentStats?.current_streak ?? 0

  let eloChange = 0
  const K = 32
  const difficultyMultiplier = difficulty

  for (let i = 0; i < totalQuestions; i++) {
    const isCorrect = i < correctCount
    const expected = 0.5

    if (isCorrect) {
      eloChange += Math.round(K * (1 - expected) * difficultyMultiplier)
    } else {
      eloChange -= Math.round(K * expected * difficultyMultiplier)
    }
  }

  const newElo = Math.max(0, currentElo + eloChange)

  const newCurrentStreak = correctCount === totalQuestions ? currentCurrentStreak + 1 : 0
  const newBestStreak = Math.max(currentBestStreak, newCurrentStreak)

  const { error: upsertError } = await supabase
    .from('quiz_player_stats')
    .upsert({
      user_id: user.id,
      elo_rating: newElo,
      total_sessions: currentTotalSessions + 1,
      total_correct: currentTotalCorrect + correctCount,
      total_answered: currentTotalAnswered + totalQuestions,
      best_streak: newBestStreak,
      current_streak: newCurrentStreak,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (upsertError) {
    return { data: null, error: upsertError.message }
  }

  return { data: { eloChange, newElo }, error: null }
}

export async function getPlayerStats(): Promise<{ data: QuizPlayerStats | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('quiz_player_stats')
    .select('elo_rating, total_sessions, total_correct, total_answered, best_streak, current_streak')
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        data: {
          elo_rating: 1200,
          total_sessions: 0,
          total_correct: 0,
          total_answered: 0,
          best_streak: 0,
          current_streak: 0,
        },
        error: null,
      }
    }
    return { data: null, error: error.message }
  }

  const stats: QuizPlayerStats = {
    elo_rating: data.elo_rating,
    total_sessions: data.total_sessions,
    total_correct: data.total_correct,
    total_answered: data.total_answered,
    best_streak: data.best_streak,
    current_streak: data.current_streak,
  }

  return { data: stats, error: null }
}
