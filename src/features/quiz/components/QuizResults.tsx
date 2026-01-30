'use client'

import { useState } from 'react'
import type { QuizSession, QuizPlayerStats, QuizQuestion } from '../types'
import { ELO_RANKS } from '../types'

interface QuizResultsProps {
  session: QuizSession
  stats: QuizPlayerStats
  questions: QuizQuestion[]
  answers: number[]
  onPlayAgain: () => void
}

export function QuizResults({
  session,
  stats,
  questions,
  answers,
  onPlayAgain,
}: QuizResultsProps) {
  const [showReview, setShowReview] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const currentRank = [...ELO_RANKS]
    .reverse()
    .find((rank) => stats.elo_rating >= rank.min) || ELO_RANKS[0]

  const radius = 80
  const circumference = 2 * Math.PI * radius
  const scoreProgress = ((100 - session.score) / 100) * circumference

  if (showReview) {
    return (
      <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm">
        {/* Review Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowReview(false)}
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Revision de Respuestas</h2>
            <p className="text-sm text-gray-400">{session.correct_count}/{session.total_questions} correctas</p>
          </div>
        </div>

        {/* Questions Review List */}
        <div className="space-y-3">
          {questions.map((question, qIndex) => {
            const userAnswer = answers[qIndex] ?? -1
            const isCorrect = userAnswer === question.correct_index
            const isTimeout = userAnswer === -1
            const isExpanded = expandedIndex === qIndex

            return (
              <div
                key={question.id}
                className={`rounded-xl border transition-all ${
                  isCorrect
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                {/* Question Summary (clickable) */}
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : qIndex)}
                  className="w-full p-3 md:p-4 text-left flex items-start gap-3"
                >
                  {/* Status Icon */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                    isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}>
                    {isCorrect ? (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 font-medium">P{qIndex + 1}</span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed line-clamp-2">
                      {question.content}
                    </p>
                  </div>

                  <svg className={`w-4 h-4 text-gray-500 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-2.5">
                    {/* Options */}
                    <div className="space-y-1.5">
                      {question.options.map((option, optIdx) => {
                        const isUserChoice = optIdx === userAnswer
                        const isCorrectOption = optIdx === question.correct_index
                        let optionStyle = 'bg-white/5 border-white/10 text-gray-400'
                        if (isCorrectOption) {
                          optionStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        } else if (isUserChoice && !isCorrectOption) {
                          optionStyle = 'bg-red-500/10 border-red-500/30 text-red-300 line-through'
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${optionStyle}`}
                          >
                            {isCorrectOption && (
                              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                            )}
                            {isUserChoice && !isCorrectOption && (
                              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span>{option}</span>
                            {isUserChoice && (
                              <span className="ml-auto text-[10px] font-medium opacity-70">Tu respuesta</span>
                            )}
                          </div>
                        )
                      })}
                      {isTimeout && (
                        <div className="px-3 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 text-sm text-orange-300">
                          Tiempo agotado - no se selecciono respuesta
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-xs font-medium text-gray-400 mb-1">Explicacion:</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Back to Results */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => setShowReview(false)}
            className="w-full min-h-[48px] py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 active:scale-95 transition-all"
          >
            Ver Resultados
          </button>
          <button
            onClick={onPlayAgain}
            className="w-full min-h-[44px] py-2 text-sm text-gray-400 hover:text-white transition-colors text-center"
          >
            Jugar de nuevo
          </button>
        </div>
      </div>
    )
  }

  // Results Summary View
  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm">
      {/* Title */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Quiz Completado!</h2>
        <p className="text-sm md:text-base text-gray-400">Aqui estan tus resultados</p>
      </div>

      {/* Score Circle */}
      <div className="flex justify-center mb-6 md:mb-8">
        <div className="relative">
          <svg className="w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-white/10"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className={`${
                session.score >= 80 ? 'stroke-emerald-500' :
                session.score >= 60 ? 'stroke-yellow-500' :
                'stroke-red-500'
              }`}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={scoreProgress}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl sm:text-5xl font-bold ${
              session.score >= 80 ? 'text-emerald-500' :
              session.score >= 60 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {session.score}%
            </div>
            <div className="text-gray-400 text-xs sm:text-sm mt-1">Puntuacion</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-xl md:text-2xl font-bold text-white mb-1">
            {session.correct_count}/{session.total_questions}
          </div>
          <div className="text-xs md:text-sm text-gray-400">Correctas</div>
        </div>
        <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-xl md:text-2xl font-bold text-white mb-1">
            {session.score}
          </div>
          <div className="text-xs md:text-sm text-gray-400">Puntaje</div>
        </div>
        <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-xl md:text-2xl font-bold text-white mb-1">
            {stats.current_streak}
          </div>
          <div className="text-xs md:text-sm text-gray-400">Racha Final</div>
        </div>
        <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-xl md:text-2xl font-bold text-white mb-1">
            {stats.best_streak}
          </div>
          <div className="text-xs md:text-sm text-gray-400">Mejor Racha</div>
        </div>
      </div>

      {/* ELO Section */}
      <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Ranking ELO</div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {stats.elo_rating}
              </div>
              <div className={`px-2 sm:px-3 py-1 rounded-full bg-white/10 border ${currentRank.color} border-current`}>
                <span className={`text-xs sm:text-sm font-semibold ${currentRank.color}`}>
                  {currentRank.label}
                </span>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Precision Total</div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats.total_answered > 0
                ? Math.round((stats.total_correct / stats.total_answered) * 100)
                : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Review Answers Button */}
        {answers.length > 0 && (
          <button
            onClick={() => setShowReview(true)}
            className="w-full min-h-[48px] py-3 md:py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-base md:text-lg font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Revisar Respuestas
          </button>
        )}
        <button
          onClick={onPlayAgain}
          className="w-full min-h-[48px] py-3 md:py-4 px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-base md:text-lg font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/20"
        >
          Jugar de nuevo
        </button>
        <button
          onClick={onPlayAgain}
          className="w-full min-h-[44px] py-2 text-sm md:text-base text-gray-400 hover:text-white transition-colors duration-200 text-center"
        >
          Volver al lobby
        </button>
      </div>
    </div>
  )
}
