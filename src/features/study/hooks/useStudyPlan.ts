'use client'

import { useReducer, useCallback, useEffect } from 'react'
import type {
  StudyState,
  StudyAction,
  StudyPlanWithTopics,
  CreatePlanForm,
  StudySession,
  StudyTopic,
} from '../types'
import {
  getActivePlan,
  createStudyPlan,
  updateTopicStatus,
  logStudySession,
  completePlan,
  archivePlan,
  deletePlan,
} from '../services/study-actions'

const initialState: StudyState = {
  phase: 'loading',
  plan: null,
  selectedWeek: null,
  error: null,
  saving: false,
}

function studyReducer(state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, phase: 'loading', error: null }

    case 'SET_NO_PLAN':
      return { ...state, phase: 'no_plan', plan: null, selectedWeek: null, error: null }

    case 'SET_CREATING':
      return { ...state, phase: 'creating', error: null }

    case 'LOAD_PLAN':
      return {
        ...state,
        phase: 'dashboard',
        plan: action.plan,
        error: null,
      }

    case 'SELECT_WEEK':
      return { ...state, selectedWeek: action.week }

    case 'UPDATE_TOPIC': {
      if (!state.plan) return state

      const updatedTopics = state.plan.topics.map((topic) =>
        topic.id === action.topicId
          ? { ...topic, ...action.updates }
          : topic
      )

      return {
        ...state,
        plan: {
          ...state.plan,
          topics: updatedTopics,
        },
      }
    }

    case 'ADD_SESSION': {
      if (!state.plan) return state

      const updatedTopics = state.plan.topics.map((topic) =>
        topic.id === action.topicId
          ? {
              ...topic,
              sessions: [action.session, ...topic.sessions],
            }
          : topic
      )

      return {
        ...state,
        plan: {
          ...state.plan,
          topics: updatedTopics,
        },
      }
    }

    case 'SET_SAVING':
      return { ...state, saving: action.saving }

    case 'SET_ERROR':
      return { ...state, error: action.error, saving: false }

    case 'COMPLETE_PLAN': {
      if (!state.plan) return state

      return {
        ...state,
        plan: {
          ...state.plan,
          status: 'completed',
        },
      }
    }

    case 'ARCHIVE_PLAN': {
      if (!state.plan) return state

      return {
        ...state,
        plan: {
          ...state.plan,
          status: 'archived',
        },
      }
    }

    default:
      return state
  }
}

export function useStudyPlan() {
  const [state, dispatch] = useReducer(studyReducer, initialState)

  const startCreating = useCallback(() => {
    dispatch({ type: 'SET_CREATING' })
  }, [])

  const cancelCreating = useCallback(() => {
    dispatch({ type: 'SET_NO_PLAN' })
  }, [])

  const submitPlan = useCallback(async (form: CreatePlanForm) => {
    dispatch({ type: 'SET_SAVING', saving: true })

    const { data, error } = await createStudyPlan(form)

    if (error || !data) {
      dispatch({ type: 'SET_ERROR', error: error || 'Error al crear el plan de estudio' })
      return
    }

    dispatch({ type: 'LOAD_PLAN', plan: data })
    dispatch({ type: 'SET_SAVING', saving: false })
  }, [])

  const markTopicProgress = useCallback(async (
    topicId: string,
    status: string,
    progress: number
  ) => {
    dispatch({ type: 'SET_SAVING', saving: true })

    const { error } = await updateTopicStatus(topicId, status, progress)

    if (error) {
      dispatch({ type: 'SET_ERROR', error })
      return
    }

    dispatch({
      type: 'UPDATE_TOPIC',
      topicId,
      updates: { status: status as StudyTopic['status'], progress },
    })
    dispatch({ type: 'SET_SAVING', saving: false })
  }, [])

  const recordSession = useCallback(async (
    topicId: string,
    activityType: string,
    durationMinutes?: number,
    score?: number,
    notes?: string
  ) => {
    dispatch({ type: 'SET_SAVING', saving: true })

    const { data, error } = await logStudySession(
      topicId,
      activityType,
      durationMinutes,
      score,
      notes
    )

    if (error || !data) {
      dispatch({ type: 'SET_ERROR', error: error || 'Error al registrar la sesion' })
      return
    }

    dispatch({ type: 'ADD_SESSION', topicId, session: data })

    if (!state.plan) {
      dispatch({ type: 'SET_SAVING', saving: false })
      return
    }

    const topic = state.plan.topics.find((t) => t.id === topicId)
    if (!topic) {
      dispatch({ type: 'SET_SAVING', saving: false })
      return
    }

    const sessionsCount = topic.sessions.length + 1
    const newProgress = Math.min(100, sessionsCount * 25)
    const newStatus = newProgress >= 100
      ? 'completed'
      : topic.status === 'pending'
        ? 'in_progress'
        : topic.status

    dispatch({
      type: 'UPDATE_TOPIC',
      topicId,
      updates: { progress: newProgress, status: newStatus },
    })

    dispatch({ type: 'SET_SAVING', saving: false })
  }, [state.plan])

  const handleCompletePlan = useCallback(async () => {
    if (!state.plan) return

    dispatch({ type: 'SET_SAVING', saving: true })

    const { error } = await completePlan(state.plan.id)

    if (error) {
      dispatch({ type: 'SET_ERROR', error })
      return
    }

    dispatch({ type: 'COMPLETE_PLAN' })
    dispatch({ type: 'SET_SAVING', saving: false })
  }, [state.plan])

  const handleArchivePlan = useCallback(async () => {
    if (!state.plan) return

    dispatch({ type: 'SET_SAVING', saving: true })

    const { error } = await archivePlan(state.plan.id)

    if (error) {
      dispatch({ type: 'SET_ERROR', error })
      return
    }

    dispatch({ type: 'ARCHIVE_PLAN' })
    dispatch({ type: 'SET_SAVING', saving: false })
  }, [state.plan])

  const handleDeletePlan = useCallback(async () => {
    if (!state.plan) return

    dispatch({ type: 'SET_SAVING', saving: true })

    const { error } = await deletePlan(state.plan.id)

    if (error) {
      dispatch({ type: 'SET_ERROR', error })
      return
    }

    dispatch({ type: 'SET_NO_PLAN' })
    dispatch({ type: 'SET_SAVING', saving: false })
  }, [state.plan])

  const handleNewPlan = useCallback(async () => {
    if (!state.plan) {
      dispatch({ type: 'SET_CREATING' })
      return
    }

    // Archive current plan first, then go to creating
    dispatch({ type: 'SET_SAVING', saving: true })

    const { error } = await archivePlan(state.plan.id)

    if (error) {
      dispatch({ type: 'SET_ERROR', error })
      return
    }

    dispatch({ type: 'SET_SAVING', saving: false })
    dispatch({ type: 'SET_CREATING' })
  }, [state.plan])

  const selectWeek = useCallback((week: number | null) => {
    dispatch({ type: 'SELECT_WEEK', week })
  }, [])

  useEffect(() => {
    const loadPlan = async () => {
      dispatch({ type: 'SET_LOADING' })

      const { data, error } = await getActivePlan()

      if (error) {
        dispatch({ type: 'SET_ERROR', error })
        return
      }

      if (data) {
        dispatch({ type: 'LOAD_PLAN', plan: data })
      } else {
        dispatch({ type: 'SET_NO_PLAN' })
      }
    }

    loadPlan()
  }, [])

  return {
    state,
    startCreating,
    cancelCreating,
    submitPlan,
    markTopicProgress,
    recordSession,
    handleCompletePlan,
    handleArchivePlan,
    handleDeletePlan,
    handleNewPlan,
    selectWeek,
  }
}
