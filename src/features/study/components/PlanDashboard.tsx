'use client'

import type { StudyPlanWithTopics } from '../types'
import { PLAN_TYPE_OPTIONS } from '../types'
import { TopicCard } from './TopicCard'
import { WeekTimeline } from './WeekTimeline'
import { StudyProgress } from './StudyProgress'

interface PlanDashboardProps {
  plan: StudyPlanWithTopics
  selectedWeek: number | null
  onSelectWeek: (week: number | null) => void
  onRecordSession: (topicId: string, activityType: string) => void
  onCompletePlan: () => void
  onArchivePlan: () => void
  onDeletePlan: () => void
  onNewPlan: () => void
}

export function PlanDashboard({
  plan,
  selectedWeek,
  onSelectWeek,
  onRecordSession,
  onCompletePlan,
  onArchivePlan,
  onDeletePlan,
  onNewPlan,
}: PlanDashboardProps) {
  const planType = PLAN_TYPE_OPTIONS.find((type) => type.value === plan.plan_type)

  // Calculate days remaining and current week
  const today = new Date()
  const targetDate = new Date(plan.target_date)
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const createdDate = new Date(plan.created_at)
  const currentWeek = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 7))

  // Calculate total weeks needed
  const totalWeeks = Math.max(...plan.topics.map((topic) => topic.week_number))

  // Calculate overall progress (average of all topic progress values)
  const totalTopics = plan.topics.length
  const overallProgress = totalTopics > 0
    ? Math.round(plan.topics.reduce((sum, t) => sum + t.progress, 0) / totalTopics)
    : 0

  // Filter topics by selected week
  const filteredTopics = selectedWeek !== null
    ? plan.topics.filter((topic) => topic.week_number === selectedWeek)
    : plan.topics

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{plan.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {planType && (
                <span className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {planType.label}
                </span>
              )}
              {plan.aircraft_type && (
                <span className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {plan.aircraft_type}
                </span>
              )}
              <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                daysRemaining < 0
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : daysRemaining <= 7
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {daysRemaining < 0
                  ? `Vencido hace ${Math.abs(daysRemaining)} dias`
                  : daysRemaining === 0
                  ? 'Vence hoy'
                  : daysRemaining === 1
                  ? 'Vence manana'
                  : `${daysRemaining} dias restantes`
                }
              </span>
            </div>
          </div>
        </div>

        {plan.description && (
          <p className="text-gray-400 mb-4">{plan.description}</p>
        )}

        {/* Overall Progress Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Progreso General</span>
            <span className="text-sm font-bold text-amber-400">{overallProgress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Week Timeline */}
      <WeekTimeline
        totalWeeks={totalWeeks}
        currentWeek={currentWeek}
        topics={plan.topics}
        selectedWeek={selectedWeek}
        onSelectWeek={onSelectWeek}
      />

      {/* Onboarding Hint */}
      {plan.topics.every((t) => t.sessions.length === 0) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 md:p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-300">
            Selecciona un tema y practica con <strong>Quiz</strong> o <strong>Chat</strong> para registrar tu progreso. Cada sesion de estudio aumenta tu avance automaticamente.
          </p>
        </div>
      )}

      {/* Topics Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            {selectedWeek !== null ? `Semana ${selectedWeek}` : 'Todos los Topics'}
          </h2>
          <span className="text-sm text-gray-400">
            {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filteredTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onRecordSession={onRecordSession}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-8 md:p-12 text-center backdrop-blur-sm">
            <p className="text-sm md:text-base text-gray-400">No hay topics para esta semana</p>
          </div>
        )}
      </div>

      {/* Study Progress Component */}
      <StudyProgress plan={plan} />

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onNewPlan}
            className="flex-1 min-h-[48px] py-3 md:py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-base md:text-lg font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-amber-500/20"
          >
            Nuevo Plan
          </button>
          <button
            onClick={onCompletePlan}
            className="flex-1 min-h-[48px] py-3 md:py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-base md:text-lg font-semibold rounded-xl hover:from-emerald-600 hover:to-green-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20"
          >
            Completar Plan
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onArchivePlan}
            className="flex-1 min-h-[48px] px-6 py-3 md:py-4 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 active:scale-95 transition-all"
          >
            Archivar
          </button>
          <button
            onClick={onDeletePlan}
            className="flex-1 min-h-[48px] px-6 py-3 md:py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/20 active:scale-95 transition-all"
          >
            Eliminar Plan
          </button>
        </div>
      </div>
    </div>
  )
}
