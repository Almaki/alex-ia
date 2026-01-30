'use client'

import { motion } from 'motion/react'

interface ChallengeWaitingProps {
  opponentName: string
  onCancel: () => void
}

export function ChallengeWaiting({ opponentName, onCancel }: ChallengeWaitingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Animated Icon */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
          <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Esperando a {opponentName}...
        </h2>
        <p className="text-gray-400 text-sm md:text-base">
          El desafío expira en 2 minutos
        </p>
      </motion.div>

      {/* Loading Dots */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
            className="w-3 h-3 rounded-full bg-purple-500"
          />
        ))}
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="min-h-[48px] px-6 py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-all"
      >
        Cancelar Desafío
      </button>
    </div>
  )
}
