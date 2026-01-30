'use client'

import { useRouter } from 'next/navigation'
import type { StudyTopicWithSessions } from '../types'
import { STUDY_CATEGORIES, TOPIC_STATUS_LABELS } from '../types'
import { DIFFICULTY_OPTIONS } from '@/features/quiz/types'

interface TopicCardProps {
  topic: StudyTopicWithSessions
  planType?: string
  onRecordSession: (topicId: string, activityType: string) => void
}

const ACTIVITY_LABELS: Record<string, string> = {
  quiz: 'Quiz',
  chat: 'Chat',
  review: 'Repaso',
  manual: 'Manual',
}

export function TopicCard({ topic, planType, onRecordSession }: TopicCardProps) {
  const router = useRouter()
  const category = STUDY_CATEGORIES.find((cat) => cat.value === topic.category)
  const difficulty = DIFFICULTY_OPTIONS.find((diff) => diff.value === topic.target_difficulty)
  const statusInfo = TOPIC_STATUS_LABELS[topic.status]

  const difficultyColorMap = {
    green: 'text-emerald-500 bg-emerald-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    red: 'text-red-500 bg-red-500/10',
  }

  const progressBarWidth = `${topic.progress}%`

  const handleQuiz = () => {
    sessionStorage.setItem(
      'study_topic',
      JSON.stringify({
        topicId: topic.id,
        category: topic.category,
        difficulty: topic.target_difficulty,
        planType: planType || null,
      })
    )
    router.push('/quiz')
  }

  const handleChat = () => {
    sessionStorage.setItem(
      'study_topic',
      JSON.stringify({
        topicId: topic.id,
        category: topic.category,
        difficulty: topic.target_difficulty,
        planType: planType || null,
      })
    )
    router.push('/chat')
  }

  const handleMarkStudied = () => {
    onRecordSession(topic.id, 'review')
  }

  const recentSessions = topic.sessions.slice(0, 3)

  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-3 md:p-4 hover:border-amber-500/20 transition-all backdrop-blur-sm">
      {/* Header with Category and Week */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          {category && (
            <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-xs font-medium ${category.color} ${category.bg}`}>
              {category.label}
            </span>
          )}
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-xs font-medium text-gray-400 bg-gray-800/50">
            Semana {topic.week_number}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {difficulty && (
            <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-xs font-medium ${difficultyColorMap[difficulty.color]} flex-shrink-0`}>
              {difficulty.label}
            </span>
          )}
          <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-xs font-medium ${statusInfo.color} ${statusInfo.bg} flex-shrink-0`}>
            {statusInfo.label}
          </span>
        </div>
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

      {/* Session History (compact) */}
      {recentSessions.length > 0 && (
        <div className="mb-3 space-y-1">
          <span className="text-xs text-gray-500 font-medium">Sesiones recientes</span>
          {recentSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between text-xs text-gray-400">
              <span>{ACTIVITY_LABELS[session.activity_type] || session.activity_type}</span>
              <span>{new Date(session.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
            </div>
          ))}
        </div>
      )}

      {/* Session Count */}
      <div className="mb-3 text-xs text-gray-500">
        {topic.sessions.length} {topic.sessions.length === 1 ? 'sesion' : 'sesiones'} registradas
      </div>

      {/* Action Buttons */}
      {topic.status === 'completed' ? (
        <div className="flex items-center justify-center py-2 text-xs text-emerald-400 font-medium">
          Tema completado
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleQuiz}
              className="flex-1 min-h-[44px] px-2 md:px-3 py-2.5 text-center text-xs md:text-sm font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quiz
            </button>
            <button
              onClick={handleChat}
              className="flex-1 min-h-[44px] px-2 md:px-3 py-2.5 text-center text-xs md:text-sm font-medium text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
          </div>
          <button
            onClick={handleMarkStudied}
            className="w-full min-h-[44px] px-3 py-2.5 text-xs md:text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:from-amber-600 hover:to-yellow-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Marcar como Estudiado
          </button>
        </div>
      )}
    </div>
  )
}
