'use client'

import type { StudyTopicWithSessions } from '../types'

interface WeekTimelineProps {
  totalWeeks: number
  currentWeek: number
  topics: StudyTopicWithSessions[]
  selectedWeek: number | null
  onSelectWeek: (week: number | null) => void
}

export function WeekTimeline({
  totalWeeks,
  currentWeek,
  topics,
  selectedWeek,
  onSelectWeek,
}: WeekTimelineProps) {
  // Calculate week status based on topics
  const getWeekStatus = (weekNumber: number) => {
    const weekTopics = topics.filter((topic) => topic.week_number === weekNumber)
    if (weekTopics.length === 0) return 'empty'

    const allCompleted = weekTopics.every((topic) => topic.status === 'completed')
    if (allCompleted) return 'completed'

    const someInProgress = weekTopics.some((topic) => topic.status === 'in_progress')
    if (someInProgress) return 'in_progress'

    if (weekNumber > currentWeek) return 'future'

    return 'pending'
  }

  const getWeekStyles = (weekNumber: number) => {
    const isSelected = selectedWeek === weekNumber
    const isCurrent = weekNumber === currentWeek
    const status = getWeekStatus(weekNumber)

    if (isSelected) {
      return 'bg-amber-500 text-white border-amber-500'
    }

    if (isCurrent) {
      return 'border-amber-500 text-amber-400 bg-transparent'
    }

    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'future':
      case 'empty':
        return 'bg-gray-800 text-gray-500 border-gray-700'
      default:
        return 'bg-gray-800/50 text-gray-400 border-gray-700/50'
    }
  }

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-2">
        {/* "Todas" pill */}
        <button
          onClick={() => onSelectWeek(null)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap
            ${selectedWeek === null
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
            }
          `}
        >
          Todas
        </button>

        {/* Week pills */}
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNumber) => (
          <button
            key={weekNumber}
            onClick={() => onSelectWeek(weekNumber)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap
              ${getWeekStyles(weekNumber)}
            `}
          >
            S{weekNumber}
          </button>
        ))}
      </div>
    </div>
  )
}
