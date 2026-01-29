'use client'

import type { QuizQuestion as QuizQuestionType } from '../types'

interface QuizQuestionProps {
  question: QuizQuestionType
  currentIndex: number
  totalQuestions: number
  timeRemaining: number
  selectedIndex: number | null
  streak: number
  onSelect: (index: number) => void
}

export function QuizQuestion({
  question,
  currentIndex,
  totalQuestions,
  timeRemaining,
  selectedIndex,
  streak,
  onSelect,
}: QuizQuestionProps) {
  const isAnswered = selectedIndex !== null
  const letters = ['A', 'B', 'C', 'D']

  // Timer color based on remaining time
  const getTimerColor = () => {
    if (timeRemaining > 15) return 'text-emerald-500 stroke-emerald-500'
    if (timeRemaining > 5) return 'text-yellow-500 stroke-yellow-500'
    return 'text-red-500 stroke-red-500'
  }

  // Calculate circular progress
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const progress = (timeRemaining / 30) * circumference

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            Pregunta {currentIndex + 1} de {totalQuestions}
          </span>
          {streak > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/50 rounded-full">
              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              <span className="text-orange-500 font-semibold text-sm">Racha: {streak}</span>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="relative">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="stroke-white/10"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              className={getTimerColor()}
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${getTimerColor()}`}>
            {timeRemaining}
          </div>
        </div>
      </div>

      {/* Question Text */}
      <div className="py-6 mb-6 text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
          {question.content}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isCorrect = index === question.correct_index
          const isSelected = selectedIndex === index
          const showResult = isAnswered

          let buttonClasses = 'w-full p-4 rounded-xl border-2 text-left transition-all duration-200 '

          if (!showResult) {
            buttonClasses += 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
          } else if (isCorrect) {
            buttonClasses += 'border-emerald-500 bg-emerald-500/10'
          } else if (isSelected && !isCorrect) {
            buttonClasses += 'border-red-500 bg-red-500/10'
          } else {
            buttonClasses += 'border-white/10 bg-white/5'
          }

          return (
            <button
              key={index}
              onClick={() => onSelect(index)}
              disabled={isAnswered}
              className={buttonClasses}
            >
              <div className="flex items-center gap-3">
                <span className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${showResult && isCorrect ? 'bg-emerald-500 text-white' :
                    showResult && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                    'bg-white/10 text-gray-300'}
                `}>
                  {letters[index]}
                </span>
                <span className={`
                  ${showResult && isCorrect ? 'text-emerald-400 font-medium' :
                    showResult && isSelected && !isCorrect ? 'text-red-400' :
                    'text-white'}
                `}>
                  {option}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
