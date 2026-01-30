'use client'

import { motion } from 'motion/react'

interface ChallengePlayProps {
  question: { content: string; options: string[] }
  questionIndex: number
  totalQuestions: number
  timeRemaining: number
  selectedIndex: number | null
  opponentProgress: number
  onSelectAnswer: (index: number) => void
}

export function ChallengePlay({
  question,
  questionIndex,
  totalQuestions,
  timeRemaining,
  selectedIndex,
  opponentProgress,
  onSelectAnswer
}: ChallengePlayProps) {
  const myProgress = ((questionIndex + 1) / totalQuestions) * 100
  const opponentProgressPercent = (opponentProgress / totalQuestions) * 100

  const radius = 32
  const circumference = 2 * Math.PI * radius
  const timePercent = (timeRemaining / 30) * 100
  const strokeDashoffset = circumference - (timePercent / 100) * circumference

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Progress Header */}
      <div className="mb-8 p-4 rounded-xl bg-gray-800/50 border border-white/10">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Tú</span>
              <span className="text-sm text-gray-400">{questionIndex + 1}/{totalQuestions}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${myProgress}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Oponente</span>
              <span className="text-sm text-gray-400">{opponentProgress}/{totalQuestions}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${opponentProgressPercent}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-700"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ${
                timeRemaining <= 5 ? 'text-red-500' : 'text-purple-500'
              }`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${
              timeRemaining <= 5 ? 'text-red-400' : 'text-white'
            }`}>
              {timeRemaining}
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 rounded-xl bg-gray-800/50 border border-white/10"
      >
        <p className="text-base md:text-lg text-white leading-relaxed">
          {question.content}
        </p>
      </motion.div>

      {/* Options */}
      <div className="grid gap-3">
        {question.options.map((option, index) => {
          const isSelected = selectedIndex === index
          const isDisabled = selectedIndex !== null

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !isDisabled && onSelectAnswer(index)}
              disabled={isDisabled}
              className={`min-h-[48px] px-6 py-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-purple-500/20 border-purple-500 text-white'
                  : 'bg-gray-800/30 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              } ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="font-medium">{option}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
