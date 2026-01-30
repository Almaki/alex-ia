'use client'

import { motion } from 'motion/react'
import type { QuizChallenge } from '../types'

interface ChallengeResultsProps {
  challenge: QuizChallenge
  myId: string
  challengerName: string
  opponentName: string
  onRematch: () => void
  onBackToLobby: () => void
}

export function ChallengeResults({
  challenge,
  myId,
  challengerName,
  opponentName,
  onRematch,
  onBackToLobby
}: ChallengeResultsProps) {
  const isChallenger = myId === challenge.challenger_id

  const myScore = (isChallenger ? challenge.challenger_correct : challenge.opponent_correct) ?? 0
  const opponentScore = (isChallenger ? challenge.opponent_correct : challenge.challenger_correct) ?? 0

  const myTime = (isChallenger ? challenge.challenger_total_time : challenge.opponent_total_time) ?? 0
  const opponentTime = (isChallenger ? challenge.opponent_total_time : challenge.challenger_total_time) ?? 0

  const myEloChange = (isChallenger ? challenge.challenger_elo_change : challenge.opponent_elo_change) ?? 0
  const opponentEloChange = (isChallenger ? challenge.opponent_elo_change : challenge.challenger_elo_change) ?? 0

  const myName = isChallenger ? challengerName : opponentName
  const oppName = isChallenger ? opponentName : challengerName

  const iWon = challenge.winner_id === myId
  const isDraw = challenge.winner_id === null

  const resultText = isDraw ? 'Empate!' : iWon ? 'Victoria!' : 'Derrota'
  const resultColor = isDraw ? 'text-gray-400' : iWon ? 'text-emerald-400' : 'text-red-400'

  const totalScore = Math.max(myScore + opponentScore, 1)
  const myScorePercent = (myScore / totalScore) * 100
  const opponentScorePercent = (opponentScore / totalScore) * 100

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10">
          {iWon ? (
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Resultados del Desafío</h2>
        <p className={`text-2xl font-bold ${resultColor}`}>{resultText}</p>
      </motion.div>

      {/* Score Comparison */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 p-6 rounded-xl bg-gray-800/50 border border-white/10"
      >
        <div className="grid grid-cols-2 gap-8 mb-4">
          {/* My Stats */}
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Tú ({myName})</p>
            <p className="text-4xl font-bold text-white mb-1">{myScore}/10</p>
            <p className="text-xs text-gray-400 mb-3">{myTime.toFixed(1)}s total</p>
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
              myEloChange >= 0
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {myEloChange >= 0 ? '+' : ''}{myEloChange} ELO
            </div>
          </div>

          {/* Opponent Stats */}
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Oponente ({oppName})</p>
            <p className="text-4xl font-bold text-white mb-1">{opponentScore}/10</p>
            <p className="text-xs text-gray-400 mb-3">{opponentTime.toFixed(1)}s total</p>
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
              opponentEloChange >= 0
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {opponentEloChange >= 0 ? '+' : ''}{opponentEloChange} ELO
            </div>
          </div>
        </div>

        {/* Visual Score Bar */}
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${myScorePercent}%` }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-gradient-to-r from-purple-500 to-blue-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${opponentScorePercent}%` }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500"
          />
        </div>
      </motion.div>

      {/* Performance Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 grid grid-cols-2 gap-4"
      >
        <div className="p-4 rounded-lg bg-gray-800/30 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Precisión</p>
          <p className="text-2xl font-bold text-white">{((myScore / 10) * 100).toFixed(0)}%</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-800/30 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Tiempo Promedio</p>
          <p className="text-2xl font-bold text-white">{(myTime / 10).toFixed(1)}s</p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <button
          onClick={onRematch}
          className="flex-1 min-h-[48px] px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          Revancha
        </button>
        <button
          onClick={onBackToLobby}
          className="flex-1 min-h-[48px] px-6 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all"
        >
          Volver al Lobby
        </button>
      </motion.div>
    </div>
  )
}
