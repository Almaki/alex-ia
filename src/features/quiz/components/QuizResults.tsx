'use client'

import type { QuizSession, QuizPlayerStats, QuizQuestion } from '../types'
import { ELO_RANKS } from '../types'

interface QuizResultsProps {
  session: QuizSession
  stats: QuizPlayerStats
  questions: QuizQuestion[]
  onPlayAgain: () => void
}

export function QuizResults({
  session,
  stats,
  questions,
  onPlayAgain,
}: QuizResultsProps) {
  const currentRank = [...ELO_RANKS]
    .reverse()
    .find((rank) => stats.elo_rating >= rank.min) || ELO_RANKS[0]

  // Calculate circular progress for score
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const scoreProgress = ((100 - session.score) / 100) * circumference

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Quiz Completado!</h2>
        <p className="text-gray-400">Aqui estan tus resultados</p>
      </div>

      {/* Score Circle */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r={radius}
              className="stroke-white/10"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
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
            <div className={`text-5xl font-bold ${
              session.score >= 80 ? 'text-emerald-500' :
              session.score >= 60 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {session.score}%
            </div>
            <div className="text-gray-400 text-sm mt-1">Puntuacion</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {session.correct_count}/{session.total_questions}
          </div>
          <div className="text-sm text-gray-400">Correctas</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {session.score}
          </div>
          <div className="text-sm text-gray-400">Puntaje</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {stats.current_streak}
          </div>
          <div className="text-sm text-gray-400">Racha Final</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {stats.best_streak}
          </div>
          <div className="text-sm text-gray-400">Mejor Racha</div>
        </div>
      </div>

      {/* ELO Section */}
      <div className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">Ranking ELO</div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-white">
                {stats.elo_rating}
              </div>
              <div className={`px-3 py-1 rounded-full bg-white/10 border ${currentRank.color} border-current`}>
                <span className={`text-sm font-semibold ${currentRank.color}`}>
                  {currentRank.label}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Precision Total</div>
            <div className="text-2xl font-bold text-white">
              {stats.total_answered > 0
                ? Math.round((stats.total_correct / stats.total_answered) * 100)
                : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/20"
        >
          Jugar de nuevo
        </button>
        <button
          onClick={onPlayAgain}
          className="w-full py-2 text-gray-400 hover:text-white transition-colors duration-200 text-center"
        >
          Volver al lobby
        </button>
      </div>
    </div>
  )
}
