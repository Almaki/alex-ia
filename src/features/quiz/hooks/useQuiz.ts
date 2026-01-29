'use client'

import { useReducer, useRef, useCallback, useEffect } from 'react'
import type { QuizState, QuizAction } from '../types'
import {
  getQuizQuestions,
  createQuizSession,
  submitAnswer,
  finishQuizSession,
  getPlayerStats,
} from '../services/quiz-actions'

const QUESTION_TIME_LIMIT = 30
const FEEDBACK_DURATION = 2500
const ELO_K_FACTOR = 32
const DEFAULT_ELO = 1500

const initialState: QuizState = {
  phase: 'lobby',
  session: null,
  questions: [],
  currentIndex: 0,
  selectedIndex: null,
  stats: null,
  timeRemaining: QUESTION_TIME_LIMIT,
  streak: 0,
  error: null,
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'LOAD_STATS':
      return { ...state, stats: action.stats }

    case 'START_QUIZ':
      return {
        ...state,
        phase: 'playing',
        session: action.session,
        questions: action.questions,
        currentIndex: 0,
        selectedIndex: null,
        streak: 0,
        timeRemaining: QUESTION_TIME_LIMIT,
        error: null,
      }

    case 'SELECT_ANSWER':
      if (state.selectedIndex !== null) return state
      return { ...state, selectedIndex: action.index }

    case 'SHOW_FEEDBACK': {
      if (!state.stats) return state

      const updatedStats = { ...state.stats }

      if (action.isCorrect) {
        updatedStats.elo_rating += action.eloChange
        updatedStats.total_correct += 1
        return {
          ...state,
          phase: 'feedback',
          stats: updatedStats,
          streak: state.streak + 1,
        }
      } else {
        updatedStats.elo_rating += action.eloChange
        return {
          ...state,
          phase: 'feedback',
          stats: updatedStats,
          streak: 0,
        }
      }
    }

    case 'NEXT_QUESTION':
      if (state.currentIndex + 1 >= state.questions.length) {
        return { ...state, phase: 'results' }
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        selectedIndex: null,
        timeRemaining: QUESTION_TIME_LIMIT,
        phase: 'playing',
      }

    case 'FINISH_QUIZ': {
      if (!state.session || !state.stats) return state

      const updatedSession = {
        ...state.session,
        correct_count: action.correctCount,
        score: action.score,
        finished_at: new Date().toISOString(),
      }

      const updatedStats = {
        ...state.stats,
        total_sessions: state.stats.total_sessions + 1,
        total_answered: state.stats.total_answered + state.questions.length,
        best_streak: Math.max(state.stats.best_streak, state.streak),
        current_streak: state.streak,
      }

      return {
        ...state,
        phase: 'results',
        session: updatedSession,
        stats: updatedStats,
      }
    }

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
      return { ...initialState, stats: state.stats }

    default:
      return state
  }
}

export function useQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialState)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const correctCountRef = useRef(0)

  const calculateEloChange = useCallback((
    isCorrect: boolean,
    difficulty: 1 | 2 | 3,
    currentElo: number
  ): number => {
    const expected = 1 / (1 + Math.pow(10, (DEFAULT_ELO - currentElo) / 400))
    const difficultyBonus = difficulty === 1 ? 0.8 : difficulty === 3 ? 1.3 : 1.0

    if (isCorrect) {
      return Math.round(ELO_K_FACTOR * (1 - expected) * difficultyBonus)
    } else {
      return -Math.round(ELO_K_FACTOR * expected * difficultyBonus)
    }
  }, [])

  const startQuiz = useCallback(async (
    difficulty: 1 | 2 | 3,
    category: string | null,
    aircraftType: string | null
  ) => {
    const questionsLimit = 10

    const { data: questions, error: questionsError } = await getQuizQuestions(
      difficulty,
      category,
      aircraftType,
      questionsLimit
    )

    if (questionsError || !questions || questions.length === 0) {
      dispatch({
        type: 'SET_ERROR',
        error: questionsError || 'No se encontraron preguntas disponibles'
      })
      return
    }

    const { data: session, error: sessionError } = await createQuizSession(
      difficulty,
      category,
      questionsLimit
    )

    if (sessionError || !session) {
      dispatch({
        type: 'SET_ERROR',
        error: sessionError || 'Error al crear la sesion de quiz'
      })
      return
    }

    correctCountRef.current = 0
    dispatch({ type: 'START_QUIZ', session, questions })
  }, [])

  const selectAnswer = useCallback(async (index: number) => {
    if (state.selectedIndex !== null || !state.session || !state.stats) return

    const currentQuestion = state.questions[state.currentIndex]
    if (!currentQuestion) return

    dispatch({ type: 'SELECT_ANSWER', index })

    const isCorrect = index === currentQuestion.correct_index
    const timeSpent = QUESTION_TIME_LIMIT - state.timeRemaining

    const submitError = await submitAnswer(
      state.session.id,
      currentQuestion.id,
      index,
      isCorrect,
      timeSpent
    )

    if (submitError.error) {
      console.error('Error submitting answer:', submitError.error)
    }

    const eloChange = calculateEloChange(
      isCorrect,
      currentQuestion.difficulty,
      state.stats.elo_rating
    )

    if (isCorrect) correctCountRef.current += 1
    dispatch({ type: 'SHOW_FEEDBACK', isCorrect, eloChange })

    feedbackTimeoutRef.current = setTimeout(async () => {
      const isLastQuestion = state.currentIndex + 1 >= state.questions.length

      if (isLastQuestion && state.session) {
        const correctCount = correctCountRef.current
        const score = Math.round((correctCount / state.questions.length) * 100)

        const { error: finishError } = await finishQuizSession(
          state.session.id,
          correctCount,
          state.questions.length,
          state.session.difficulty
        )

        if (finishError) {
          console.error('Error finishing quiz session:', finishError)
        }

        dispatch({ type: 'FINISH_QUIZ', correctCount, score })
      } else {
        dispatch({ type: 'NEXT_QUESTION' })
      }
    }, FEEDBACK_DURATION)
  }, [
    state.selectedIndex,
    state.session,
    state.stats,
    state.questions,
    state.currentIndex,
    state.timeRemaining,
    calculateEloChange,
  ])

  const playAgain = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = null
    }
    correctCountRef.current = 0
    dispatch({ type: 'RESET' })
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      const { data, error } = await getPlayerStats()
      if (data && !error) {
        dispatch({ type: 'LOAD_STATS', stats: data })
      }
    }

    loadStats()
  }, [])

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

  useEffect(() => {
    if (state.timeRemaining === 0 && state.selectedIndex === null) {
      dispatch({ type: 'TIME_UP' })
      selectAnswer(-1)
    }
  }, [state.timeRemaining, state.selectedIndex, selectAnswer])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  return {
    state,
    startQuiz,
    selectAnswer,
    playAgain,
  }
}
