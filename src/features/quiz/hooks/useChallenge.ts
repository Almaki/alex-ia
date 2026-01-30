'use client'

import { useReducer, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ChallengeState, ChallengeAction, QuizChallenge } from '../types'
import {
  createChallenge,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
  submitChallengeAnswer,
  finishChallengeParticipation,
  getQuestionsByIds,
  getChallengeDetails,
} from '../services/challenge-actions'

const QUESTION_TIME_LIMIT = 30
const CHALLENGE_EXPIRY_TIME = 2 * 60 * 1000

const initialState: ChallengeState = {
  phase: 'idle',
  challenge: null,
  questions: [],
  currentIndex: 0,
  selectedIndex: null,
  timeRemaining: QUESTION_TIME_LIMIT,
  myCorrect: 0,
  opponentProgress: 0,
  opponentCorrect: 0,
  onlinePilots: [],
  incomingChallenge: null,
  opponentName: null,
  countdown: 3,
  error: null,
}

function challengeReducer(state: ChallengeState, action: ChallengeAction): ChallengeState {
  switch (action.type) {
    case 'SET_ONLINE_PILOTS':
      return { ...state, onlinePilots: action.pilots }

    case 'INCOMING_CHALLENGE':
      return { ...state, incomingChallenge: action.challenge }

    case 'DISMISS_CHALLENGE':
      return { ...state, incomingChallenge: null }

    case 'START_SELECTING':
      return { ...state, phase: 'selecting', error: null }

    case 'CHALLENGE_SENT':
      return {
        ...state,
        phase: 'waiting',
        challenge: action.challenge,
        opponentName: action.opponentName,
        error: null,
      }

    case 'CHALLENGE_ACCEPTED':
      return {
        ...state,
        phase: 'countdown',
        challenge: action.challenge,
        questions: action.questions,
        opponentName: state.incomingChallenge?.challenger_name || state.opponentName,
        countdown: 3,
        incomingChallenge: null,
        error: null,
      }

    case 'OPPONENT_ACCEPTED':
      return {
        ...state,
        phase: 'countdown',
        challenge: action.challenge,
        questions: action.questions,
        countdown: 3,
        error: null,
      }

    case 'CHALLENGE_DECLINED':
      return {
        ...state,
        phase: 'idle',
        challenge: null,
        opponentName: null,
        error: 'El oponente rechazo el desafio',
      }

    case 'CHALLENGE_EXPIRED':
      return {
        ...state,
        phase: 'idle',
        challenge: null,
        opponentName: null,
        error: 'El desafio ha expirado',
      }

    case 'TICK_COUNTDOWN':
      return { ...state, countdown: Math.max(0, state.countdown - 1) }

    case 'START_PLAYING':
      return {
        ...state,
        phase: 'playing',
        currentIndex: 0,
        selectedIndex: null,
        timeRemaining: QUESTION_TIME_LIMIT,
        myCorrect: 0,
      }

    case 'SELECT_ANSWER':
      if (state.selectedIndex !== null) return state
      return { ...state, selectedIndex: action.index }

    case 'SHOW_FEEDBACK': {
      const updatedCorrect = action.isCorrect ? state.myCorrect + 1 : state.myCorrect
      return { ...state, myCorrect: updatedCorrect }
    }

    case 'NEXT_QUESTION':
      if (state.currentIndex + 1 >= state.questions.length) {
        return { ...state, phase: 'waiting_opponent' }
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        selectedIndex: null,
        timeRemaining: QUESTION_TIME_LIMIT,
      }

    case 'OPPONENT_PROGRESS':
      return {
        ...state,
        opponentProgress: action.questionsAnswered,
        opponentCorrect: action.correct,
      }

    case 'FINISH_MY_PART':
      return { ...state, phase: 'waiting_opponent' }

    case 'SHOW_RESULTS':
      return { ...state, phase: 'results', challenge: action.challenge }

    case 'TICK_TIMER':
      if (state.timeRemaining > 0) {
        return { ...state, timeRemaining: state.timeRemaining - 1 }
      }
      return state

    case 'TIME_UP':
      return { ...state, selectedIndex: -1 }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}

export function useChallenge(userId: string | null) {
  const [state, dispatch] = useReducer(challengeReducer, initialState)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const expiryRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const totalTimeRef = useRef(0)
  const myFinishedRef = useRef(false)
  const opponentFinishedRef = useRef(false)

  const cleanupTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (expiryRef.current) {
      clearTimeout(expiryRef.current)
      expiryRef.current = null
    }
  }, [])

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
  }, [])

  const setupBroadcastChannel = useCallback((challengeId: string) => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase.channel(`challenge:${challengeId}`)

    channel
      .on('broadcast', { event: 'challenge:accepted' }, async () => {
        // Challenger side: opponent accepted. Fetch questions and start countdown.
        const { data: updatedChallenge, error: fetchErr } = await getChallengeDetails(challengeId)
        if (fetchErr || !updatedChallenge) return

        const { data: questions, error: qErr } = await getQuestionsByIds(updatedChallenge.question_ids)
        if (qErr || !questions || questions.length === 0) return

        dispatch({ type: 'OPPONENT_ACCEPTED', challenge: updatedChallenge, questions })
      })
      .on('broadcast', { event: 'challenge:declined' }, () => {
        dispatch({ type: 'CHALLENGE_DECLINED' })
        cleanupChannel()
      })
      .on('broadcast', { event: 'challenge:progress' }, (payload: { payload: { questionsAnswered: number; correct: number } }) => {
        const { questionsAnswered, correct } = payload.payload
        dispatch({ type: 'OPPONENT_PROGRESS', questionsAnswered, correct })
      })
      .on('broadcast', { event: 'challenge:finished' }, async () => {
        opponentFinishedRef.current = true

        if (myFinishedRef.current) {
          const { data, error } = await getChallengeDetails(challengeId)
          if (data && !error) {
            dispatch({ type: 'SHOW_RESULTS', challenge: data })
            cleanupChannel()
          }
        }
      })
      .subscribe()

    channelRef.current = channel
  }, [userId, cleanupChannel])

  // Listen for incoming challenges via postgres_changes
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel('incoming-challenges')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_challenges',
          filter: `opponent_id=eq.${userId}`,
        },
        async (payload) => {
          const challenge = payload.new as QuizChallenge
          if (challenge.status !== 'pending') return

          // Fetch challenger name and ELO
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', challenge.challenger_id)
            .single()

          const { data: stats } = await supabase
            .from('quiz_player_stats')
            .select('elo_rating')
            .eq('user_id', challenge.challenger_id)
            .single()

          dispatch({
            type: 'INCOMING_CHALLENGE',
            challenge: {
              ...challenge,
              challenger_name: profile?.full_name || 'Piloto',
              challenger_elo: stats?.elo_rating ?? 1500,
            },
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Countdown timer effect
  useEffect(() => {
    if (state.phase !== 'countdown') return

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_COUNTDOWN' })
    }, 1000)

    return () => clearInterval(interval)
  }, [state.phase])

  // Transition from countdown to playing when countdown reaches 0
  useEffect(() => {
    if (state.phase === 'countdown' && state.countdown <= 0) {
      dispatch({ type: 'START_PLAYING' })
      totalTimeRef.current = 0
      myFinishedRef.current = false
      opponentFinishedRef.current = false
    }
  }, [state.phase, state.countdown])

  const sendChallenge = useCallback(async (
    opponentId: string,
    difficulty: 1 | 2 | 3,
    category: string | null,
    opponentName: string
  ) => {
    const { data: challenge, error } = await createChallenge(opponentId, difficulty, category)

    if (error || !challenge) {
      dispatch({ type: 'SET_ERROR', error: error || 'Error al crear el desafio' })
      return
    }

    dispatch({ type: 'CHALLENGE_SENT', challenge, opponentName })
    setupBroadcastChannel(challenge.id)

    expiryRef.current = setTimeout(() => {
      dispatch({ type: 'CHALLENGE_EXPIRED' })
      cleanupChannel()
    }, CHALLENGE_EXPIRY_TIME)
  }, [setupBroadcastChannel, cleanupChannel])

  const acceptIncoming = useCallback(async () => {
    if (!state.incomingChallenge) return

    const challengeId = state.incomingChallenge.id
    const { data: acceptedChallenge, error: acceptError } = await acceptChallenge(challengeId)

    if (acceptError || !acceptedChallenge) {
      dispatch({ type: 'SET_ERROR', error: acceptError || 'Error al aceptar el desafio' })
      dispatch({ type: 'DISMISS_CHALLENGE' })
      return
    }

    const { data: questions, error: questionsError } = await getQuestionsByIds(
      acceptedChallenge.question_ids
    )

    if (questionsError || !questions || questions.length === 0) {
      dispatch({ type: 'SET_ERROR', error: questionsError || 'No se pudieron cargar las preguntas' })
      dispatch({ type: 'DISMISS_CHALLENGE' })
      return
    }

    dispatch({ type: 'CHALLENGE_ACCEPTED', challenge: acceptedChallenge, questions })
    setupBroadcastChannel(challengeId)

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'challenge:accepted',
      })
    }
    // Countdown is handled by the useEffect watching state.phase === 'countdown'
  }, [state.incomingChallenge, setupBroadcastChannel])

  const declineIncoming = useCallback(async () => {
    if (!state.incomingChallenge) return

    const challengeId = state.incomingChallenge.id
    await declineChallenge(challengeId)

    // Setup broadcast channel briefly to send declined event
    const supabase = createClient()
    const tempChannel = supabase.channel(`challenge:${challengeId}`)
    await tempChannel.subscribe()
    await tempChannel.send({
      type: 'broadcast',
      event: 'challenge:declined',
    })
    supabase.removeChannel(tempChannel)

    dispatch({ type: 'DISMISS_CHALLENGE' })
  }, [state.incomingChallenge])

  const cancelWaiting = useCallback(async () => {
    if (!state.challenge) return

    await cancelChallenge(state.challenge.id)
    cleanupChannel()
    cleanupTimers()
    dispatch({ type: 'RESET' })
  }, [state.challenge, cleanupChannel, cleanupTimers])

  const selectAnswer = useCallback(async (index: number) => {
    if (state.selectedIndex !== null || !state.challenge) return

    const currentQuestion = state.questions[state.currentIndex]
    if (!currentQuestion) return

    dispatch({ type: 'SELECT_ANSWER', index })

    const isCorrect = index === currentQuestion.correct_index
    const timeSpent = QUESTION_TIME_LIMIT - state.timeRemaining
    totalTimeRef.current += timeSpent

    const submitError = await submitChallengeAnswer(
      state.challenge.id,
      currentQuestion.id,
      index,
      isCorrect,
      timeSpent
    )

    if (submitError.error) {
      console.error('Error submitting challenge answer:', submitError.error)
    }

    dispatch({ type: 'SHOW_FEEDBACK', isCorrect })

    const questionsAnswered = state.currentIndex + 1
    const currentCorrect = state.myCorrect + (isCorrect ? 1 : 0)

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'challenge:progress',
        payload: { questionsAnswered, correct: currentCorrect },
      })
    }

    setTimeout(async () => {
      const isLastQuestion = state.currentIndex + 1 >= state.questions.length

      if (isLastQuestion && state.challenge) {
        myFinishedRef.current = true

        await finishChallengeParticipation(
          state.challenge.id,
          currentCorrect,
          totalTimeRef.current
        )

        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'challenge:finished',
          })
        }

        if (opponentFinishedRef.current) {
          const { data, error } = await getChallengeDetails(state.challenge.id)
          if (data && !error) {
            dispatch({ type: 'SHOW_RESULTS', challenge: data })
            cleanupChannel()
          }
        } else {
          dispatch({ type: 'FINISH_MY_PART' })
        }
      } else {
        dispatch({ type: 'NEXT_QUESTION' })
      }
    }, 2500)
  }, [
    state.selectedIndex,
    state.challenge,
    state.questions,
    state.currentIndex,
    state.timeRemaining,
    state.myCorrect,
    cleanupChannel,
  ])

  const startSelecting = useCallback(() => {
    dispatch({ type: 'START_SELECTING' })
  }, [])

  const reset = useCallback(() => {
    cleanupTimers()
    cleanupChannel()
    totalTimeRef.current = 0
    myFinishedRef.current = false
    opponentFinishedRef.current = false
    dispatch({ type: 'RESET' })
  }, [cleanupTimers, cleanupChannel])

  // Question timer
  useEffect(() => {
    if (
      state.phase === 'playing' &&
      state.selectedIndex === null &&
      state.timeRemaining > 0
    ) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' })
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [state.phase, state.selectedIndex, state.timeRemaining])

  // Auto-submit on time up
  useEffect(() => {
    if (state.timeRemaining === 0 && state.selectedIndex === null) {
      dispatch({ type: 'TIME_UP' })
      selectAnswer(-1)
    }
  }, [state.timeRemaining, state.selectedIndex, selectAnswer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers()
      cleanupChannel()
    }
  }, [cleanupTimers, cleanupChannel])

  return {
    state,
    startSelecting,
    sendChallenge,
    acceptIncoming,
    declineIncoming,
    cancelWaiting,
    selectAnswer,
    reset,
  }
}
