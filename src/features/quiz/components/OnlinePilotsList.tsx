'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import type { OnlinePilot } from '../types'
import { ELO_RANKS, DIFFICULTY_OPTIONS } from '../types'

const RANK_HEX: Record<string, string> = {
  'text-gray-400': '#9ca3af',
  'text-green-400': '#4ade80',
  'text-blue-400': '#60a5fa',
  'text-purple-400': '#c084fc',
  'text-orange-400': '#fb923c',
  'text-red-400': '#f87171',
  'text-yellow-300': '#fde047',
}

const DIFFICULTY_STYLES: Record<string, { active: string; hex: string }> = {
  green: { active: 'bg-emerald-500 text-white border-emerald-600', hex: '#10b981' },
  yellow: { active: 'bg-yellow-500 text-white border-yellow-600', hex: '#eab308' },
  red: { active: 'bg-red-500 text-white border-red-600', hex: '#ef4444' },
}

interface OnlinePilotsListProps {
  pilots: OnlinePilot[]
  onChallenge: (pilotId: string, difficulty: 1 | 2 | 3) => void
  onClose: () => void
}

export function OnlinePilotsList({ pilots, onChallenge, onClose }: OnlinePilotsListProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Record<string, 1 | 2 | 3>>({})

  const getRank = (elo: number) => {
    for (let i = ELO_RANKS.length - 1; i >= 0; i--) {
      if (elo >= ELO_RANKS[i].min) {
        return ELO_RANKS[i]
      }
    }
    return ELO_RANKS[0]
  }

  const getDifficultyForPilot = (pilotId: string): 1 | 2 | 3 => {
    return selectedDifficulty[pilotId] ?? 2
  }

  const handleDifficultyChange = (pilotId: string, difficulty: 1 | 2 | 3) => {
    setSelectedDifficulty(prev => ({ ...prev, [pilotId]: difficulty }))
  }

  const handleChallenge = (pilotId: string) => {
    const difficulty = getDifficultyForPilot(pilotId)
    onChallenge(pilotId, difficulty)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-gray-900 border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <h2 className="text-2xl font-bold text-white">Pilotos en Linea</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pilots List */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {pilots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-lg text-gray-400 max-w-sm">
                No hay pilotos en linea. Vuelve pronto para desafiar a otros pilotos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pilots.map((pilot) => {
                const rank = getRank(pilot.elo_rating)
                const rankHex = RANK_HEX[rank.color] || '#9ca3af'
                const currentDifficulty = getDifficultyForPilot(pilot.id)

                return (
                  <motion.div
                    key={pilot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gray-800/50 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Pilot Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {pilot.full_name || 'Piloto Anonimo'}
                          </h3>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                              background: `${rankHex}20`,
                              color: rankHex,
                              border: `1px solid ${rankHex}40`
                            }}
                          >
                            {rank.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {pilot.fleet && pilot.position ? `${pilot.fleet} - ${pilot.position}` : 'Piloto'}
                        </p>
                      </div>

                      {/* Difficulty Selector */}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {DIFFICULTY_OPTIONS.map((diff) => {
                            const isActive = currentDifficulty === diff.value
                            const styles = DIFFICULTY_STYLES[diff.color]
                            return (
                              <button
                                key={diff.value}
                                onClick={() => handleDifficultyChange(pilot.id, diff.value as 1 | 2 | 3)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                  isActive
                                    ? styles.active
                                    : 'bg-gray-700/50 text-gray-400 border-white/10 hover:bg-gray-700'
                                }`}
                              >
                                {diff.label}
                              </button>
                            )
                          })}
                        </div>

                        {/* Challenge Button */}
                        <button
                          onClick={() => handleChallenge(pilot.id)}
                          className="min-h-[48px] px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
                        >
                          Desafiar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
