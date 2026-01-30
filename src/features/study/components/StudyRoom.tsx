'use client'

import { useState, useEffect } from 'react'
import { useStudyPlan } from '../hooks/useStudyPlan'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { checkIsAdmin } from '@/features/admin/services/admin-actions'
import { PlanCreator } from './PlanCreator'
import { PlanDashboard } from './PlanDashboard'

export function StudyRoom() {
  const { profile } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin)
  }, [])

  const {
    state,
    submitPlan,
    selectWeek,
    recordSession,
    handleCompletePlan,
    handleArchivePlan,
    handleDeletePlan,
    handleNewPlan,
    startCreating,
    cancelCreating,
  } = useStudyPlan()

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
        <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 sm:p-8 md:p-12 text-center backdrop-blur-sm">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
              Salon de Estudio
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-sm mx-auto mb-6">
              Organiza tu preparacion con un plan personalizado. AlexIA te guiara con quizzes, chat y seguimiento de progreso.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <svg className="w-6 h-6 text-amber-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-300 font-medium">Quizzes por tema</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <svg className="w-6 h-6 text-purple-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-xs text-gray-300 font-medium">Chat con AlexIA</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <svg className="w-6 h-6 text-emerald-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <p className="text-xs text-gray-300 font-medium">Seguimiento</p>
              </div>
            </div>
          </div>

          <button
            onClick={startCreating}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-lg font-bold rounded-xl hover:from-emerald-600 hover:to-green-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 flex items-center justify-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
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
          userFleet={profile?.fleet ?? null}
          isAdmin={isAdmin}
        />
      )}

      {/* Dashboard State */}
      {state.phase === 'dashboard' && state.plan && (
        <PlanDashboard
          plan={state.plan}
          selectedWeek={state.selectedWeek}
          onSelectWeek={selectWeek}
          onRecordSession={recordSession}
          onCompletePlan={handleCompletePlan}
          onArchivePlan={handleArchivePlan}
          onDeletePlan={handleDeletePlan}
          onNewPlan={handleNewPlan}
        />
      )}
    </div>
  )
}
