'use client'

import type { StudyPlanWithTopics } from '../types'
import { STUDY_CATEGORIES } from '../types'

interface StudyProgressProps {
  plan: StudyPlanWithTopics
}

export function StudyProgress({ plan }: StudyProgressProps) {
  // Calculate overall completion
  const totalTopics = plan.topics.length
  const completedTopics = plan.topics.filter((topic) => topic.status === 'completed').length
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  // Calculate total sessions
  const totalSessions = plan.topics.reduce((sum, topic) => sum + topic.sessions.length, 0)

  // Calculate days remaining
  const today = new Date()
  const targetDate = new Date(plan.target_date)
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Calculate current week
  const createdDate = new Date(plan.created_at)
  const currentWeek = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 7))

  // Circular progress SVG
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const progressOffset = ((100 - completionPercentage) / 100) * circumference

  // Category breakdown
  const categoryStats = STUDY_CATEGORIES.map((category) => {
    const categoryTopics = plan.topics.filter((topic) => topic.category === category.value)
    const categoryCompleted = categoryTopics.filter((topic) => topic.status === 'completed').length
    const categoryPercentage = categoryTopics.length > 0
      ? Math.round((categoryCompleted / categoryTopics.length) * 100)
      : 0

    return {
      ...category,
      total: categoryTopics.length,
      completed: categoryCompleted,
      percentage: categoryPercentage,
    }
  }).filter((stat) => stat.total > 0) // Only show categories with topics

  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white mb-6">Progreso General</h3>

      {/* Circular Progress */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-white/10"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-amber-500"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              style={{
                background: 'linear-gradient(to right, #f59e0b, #eab308)',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-amber-500">
              {completionPercentage}%
            </div>
            <div className="text-xs text-gray-400 mt-1">Completo</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {completedTopics}/{totalTopics}
          </div>
          <div className="text-sm text-gray-400">Topics</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {totalSessions}
          </div>
          <div className="text-sm text-gray-400">Sesiones</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className={`text-2xl font-bold mb-1 ${daysRemaining < 0 ? 'text-red-400' : 'text-white'}`}>
            {daysRemaining}
          </div>
          <div className="text-sm text-gray-400">Dias restantes</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {currentWeek}
          </div>
          <div className="text-sm text-gray-400">Semana actual</div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryStats.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Progreso por Categoria</h4>
          <div className="space-y-3">
            {categoryStats.map((stat) => (
              <div key={stat.value}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${stat.color}`}>{stat.label}</span>
                  <span className="text-xs text-gray-400">
                    {stat.completed}/{stat.total} ({stat.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
