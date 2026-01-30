'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
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

const DIFFICULTY_HEX: Record<string, string> = {
  green: '#10b981',
  yellow: '#eab308',
  red: '#ef4444',
}

interface ChallengeToastProps {
  challengerName: string
  challengerElo: number
  difficulty: 1 | 2 | 3
  onAccept: () => void
  onDecline: () => void
  expiresAt: string
}

export function ChallengeToast({
  challengerName,
  challengerElo,
  difficulty,
  onAccept,
  onDecline,
  expiresAt
}: ChallengeToastProps) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000))
      setTimeLeft(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const getRank = (elo: number) => {
    for (let i = ELO_RANKS.length - 1; i >= 0; i--) {
      if (elo >= ELO_RANKS[i].min) {
        return ELO_RANKS[i]
      }
    }
    return ELO_RANKS[0]
  }

  const rank = getRank(challengerElo)
  const rankHex = RANK_HEX[rank.color] || '#9ca3af'
  const difficultyInfo = DIFFICULTY_OPTIONS.find(d => d.value === difficulty) || DIFFICULTY_OPTIONS[1]
  const diffHex = DIFFICULTY_HEX[difficultyInfo.color] || '#eab308'
  const progressPercent = (timeLeft / 120) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
    >
      <div className="rounded-xl bg-gray-900 border border-purple-500/50 shadow-2xl overflow-hidden">
        {/* Countdown Bar */}
        <div className="h-1 bg-gray-800">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          />
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Desafio Recibido!</h3>
              <p className="text-sm text-gray-400">Expira en {timeLeft}s</p>
            </div>
          </div>

          {/* Challenger Info */}
          <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">{challengerName}</span>
              <span
                className="px-2 py-1 rounded-full text-xs font-bold"
                style={{
                  background: `${rankHex}20`,
                  color: rankHex,
                  border: `1px solid ${rankHex}40`
                }}
              >
                {rank.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Dificultad:</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  background: `${diffHex}20`,
                  color: diffHex,
                }}
              >
                {difficultyInfo.label}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="flex-1 min-h-[48px] px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Aceptar
            </button>
            <button
              onClick={onDecline}
              className="flex-1 min-h-[48px] px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 font-semibold transition-all"
            >
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
