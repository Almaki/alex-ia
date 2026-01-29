'use client'

import Link from 'next/link'
import type { StudyTopicWithSessions } from '../types'
import { STUDY_CATEGORIES, TOPIC_STATUS_LABELS } from '../types'
import { DIFFICULTY_OPTIONS } from '@/features/quiz/types'

interface TopicCardProps {
  topic: StudyTopicWithSessions
  onMarkComplete: (topicId: string) => void
  onStartProgress: (topicId: string) => void
}

export function TopicCard({ topic, onMarkComplete, onStartProgress }: TopicCardProps) {
  const category = STUDY_CATEGORIES.find((cat) => cat.value === topic.category)
  const difficulty = DIFFICULTY_OPTIONS.find((diff) => diff.value === topic.target_difficulty)
  const statusInfo = TOPIC_STATUS_LABELS[topic.status]

  const difficultyColorMap = {
    green: 'text-emerald-500 bg-emerald-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    red: 'text-red-500 bg-red-500/10',
  }

  const progressBarWidth = `${topic.progress}%`

  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 hover:border-amber-500/20 transition-all backdrop-blur-sm">
      {/* Header with Category and Week */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {category && (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${category.color} ${category.bg}`}>
              {category.label}
            </span>
          )}
          <span className="px-2 py-1 rounded-lg text-xs font-medium text-gray-400 bg-gray-800/50">
            Semana {topic.week_number}
          </span>
        </div>
        {difficulty && (
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${difficultyColorMap[difficulty.color]}`}>
            {difficulty.label}
          </span>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-3">
        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Progreso</span>
          <span className="text-xs text-gray-300 font-medium">{topic.progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500"
            style={{ width: progressBarWidth }}
          />
        </div>
      </div>

      {/* Session Count */}
      <div className="mb-4 text-sm text-gray-400">
        <span>{topic.sessions.length} sesiones</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Link
          href="/quiz"
          className="flex-1 px-3 py-2 text-center text-sm font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all"
        >
          Quiz
        </Link>
        <Link
          href="/chat"
          className="flex-1 px-3 py-2 text-center text-sm font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all"
        >
          Chat
        </Link>
        {topic.status === 'pending' ? (
          <button
            onClick={() => onStartProgress(topic.id)}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all"
          >
            Iniciar
          </button>
        ) : topic.status !== 'completed' && (
          <button
            onClick={() => onMarkComplete(topic.id)}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all"
          >
            Completar
          </button>
        )}
      </div>
    </div>
  )
}
