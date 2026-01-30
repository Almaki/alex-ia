'use client'

import { useState } from 'react'
import type { QuizPlayerStats } from '../types'
import { QUIZ_CATEGORIES, DIFFICULTY_OPTIONS, ELO_RANKS } from '../types'

interface QuizLobbyProps {
  stats: QuizPlayerStats | null
  onStart: (difficulty: 1 | 2 | 3, category: string | null) => void
  error: string | null
  onlinePilotsCount?: number
  onStartChallenge?: () => void
}

export function QuizLobby({ stats, onStart, error, onlinePilotsCount = 0, onStartChallenge }: QuizLobbyProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<1 | 2 | 3>(2)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const currentRank = stats
    ? [...ELO_RANKS]
        .reverse()
        .find((rank) => stats.elo_rating >= rank.min) || ELO_RANKS[0]
    : ELO_RANKS[0]

  const accuracy = stats && stats.total_answered > 0
    ? Math.round((stats.total_correct / stats.total_answered) * 100)
    : 0

  const handleStart = () => {
    onStart(selectedDifficulty, selectedCategory === 'all' ? null : selectedCategory)
  }

  const difficultyStyles: Record<string, { selected: string; text: string }> = {
    green: {
      selected: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20',
      text: 'text-emerald-500',
    },
    yellow: {
      selected: 'border-yellow-500 bg-yellow-500/10 ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/20',
      text: 'text-yellow-500',
    },
    red: {
      selected: 'border-red-500 bg-red-500/10 ring-2 ring-red-500/50 shadow-lg shadow-red-500/20',
      text: 'text-red-500',
    },
  }

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Quiz Arena
        </h1>
        <p className="text-sm md:text-base text-gray-400">Pon a prueba tus conocimientos de aviacion</p>
        {onlinePilotsCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">
              {onlinePilotsCount} piloto{onlinePilotsCount > 1 ? 's' : ''} en linea
            </span>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 p-3 md:p-4 bg-white/5 rounded-xl border border-white/5">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{stats.elo_rating}</div>
            <div className={`text-xs md:text-sm ${currentRank.color} font-medium`}>
              {currentRank.label}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{stats.total_sessions}</div>
            <div className="text-xs md:text-sm text-gray-400">Sesiones</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{accuracy}%</div>
            <div className="text-xs md:text-sm text-gray-400">Precision</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{stats.best_streak}</div>
            <div className="text-xs md:text-sm text-gray-400">Mejor Racha</div>
          </div>
        </div>
      )}

      {/* Difficulty Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Dificultad
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {DIFFICULTY_OPTIONS.map((option) => {
            const isSelected = selectedDifficulty === option.value
            const styles = difficultyStyles[option.color]

            return (
              <button
                key={option.value}
                onClick={() => setSelectedDifficulty(option.value)}
                className={`
                  min-h-[60px] p-2 sm:p-3 md:p-4 rounded-xl border-2 transition-all duration-200 text-center overflow-hidden
                  ${isSelected
                    ? styles.selected
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }
                `}
              >
                <div className={`text-sm sm:text-base md:text-lg font-bold truncate ${isSelected ? styles.text : 'text-white'}`}>
                  {option.label}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">
                  {option.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Categoria
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
        >
          {QUIZ_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value} className="bg-gray-900">
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Start Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleStart}
          className="w-full min-h-[48px] py-3 md:py-4 px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-base md:text-lg font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/20"
        >
          Iniciar Quiz
        </button>

        {onlinePilotsCount > 0 && onStartChallenge && (
          <button
            onClick={onStartChallenge}
            className="w-full min-h-[48px] py-3 md:py-4 px-6 border-2 border-purple-500/40 bg-purple-500/10 text-purple-300 text-base md:text-lg font-semibold rounded-xl hover:border-purple-500/60 hover:bg-purple-500/20 active:scale-95 transition-all duration-200"
          >
            Desafiar Piloto
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  )
}
