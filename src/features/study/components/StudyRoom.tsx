'use client'

import { useCallback } from 'react'
import { useStudyPlan } from '../hooks/useStudyPlan'
import { PlanCreator } from './PlanCreator'
import { PlanDashboard } from './PlanDashboard'

export function StudyRoom() {
  const {
    state,
    submitPlan,
    selectWeek,
    markTopicProgress,
    handleCompletePlan,
    handleArchivePlan,
    handleDeletePlan,
    handleNewPlan,
    startCreating,
    cancelCreating,
  } = useStudyPlan()

  const markTopicComplete = useCallback(
    (topicId: string) => markTopicProgress(topicId, 'completed', 100),
    [markTopicProgress]
  )

  const startTopicProgress = useCallback(
    (topicId: string) => markTopicProgress(topicId, 'in_progress', 0),
    [markTopicProgress]
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Loading State */}
      {state.phase === 'loading' && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Cargando plan de estudio...</p>
          </div>
        </div>
      )}

      {/* No Plan State */}
      {state.phase === 'no_plan' && (
        <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Salon de Estudio
            </h2>
            <p className="text-gray-400 mb-8">
              Crea tu plan de estudio personalizado para organizar tu preparacion
            </p>
          </div>

          <button
            onClick={startCreating}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-amber-500/20"
          >
            Crear Plan de Estudio
          </button>

          {state.error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
              <p className="text-red-400 text-sm">{state.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Creating State */}
      {state.phase === 'creating' && (
        <PlanCreator
          onSubmit={submitPlan}
          onCancel={cancelCreating}
          saving={state.saving}
        />
      )}

      {/* Dashboard State */}
      {state.phase === 'dashboard' && state.plan && (
        <PlanDashboard
          plan={state.plan}
          selectedWeek={state.selectedWeek}
          onSelectWeek={selectWeek}
          onMarkComplete={markTopicComplete}
          onStartProgress={startTopicProgress}
          onCompletePlan={handleCompletePlan}
          onArchivePlan={handleArchivePlan}
          onDeletePlan={handleDeletePlan}
          onNewPlan={handleNewPlan}
        />
      )}
    </div>
  )
}
