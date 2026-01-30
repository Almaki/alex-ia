'use client'

import { motion, AnimatePresence } from 'motion/react'
import type { ChallengePhase, ChallengeState } from '../types'
import { OnlinePilotsList } from './OnlinePilotsList'
import { ChallengeWaiting } from './ChallengeWaiting'
import { ChallengePlay } from './ChallengePlay'
import { ChallengeResults } from './ChallengeResults'

interface ChallengeArenaProps {
  phase: ChallengePhase
  state: ChallengeState
  onSendChallenge: (pilotId: string, difficulty: 1 | 2 | 3) => void
  onAcceptIncoming: () => void
  onDeclineIncoming: () => void
  onCancelWaiting: () => void
  onSelectAnswer: (index: number) => void
  onReset: () => void
  myId: string
  myName: string
}

export function ChallengeArena({
  phase,
  state,
  onSendChallenge,
  onAcceptIncoming,
  onDeclineIncoming,
  onCancelWaiting,
  onSelectAnswer,
  onReset,
  myId,
  myName
}: ChallengeArenaProps) {
  const renderPhase = () => {
    switch (phase) {
      case 'selecting':
        return (
          <OnlinePilotsList
            pilots={state.onlinePilots}
            onChallenge={onSendChallenge}
            onClose={onReset}
          />
        )

      case 'waiting':
        return (
          <ChallengeWaiting
            opponentName={state.opponentName || 'el oponente'}
            onCancel={onCancelWaiting}
          />
        )

      case 'countdown':
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                key={state.countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500"
              >
                {state.countdown}
              </motion.div>
              <p className="text-xl text-gray-400 mt-4">Prepárate...</p>
            </motion.div>
          </div>
        )

      case 'playing':
        if (!state.questions || state.currentIndex >= state.questions.length) {
          return null
        }

        return (
          <ChallengePlay
            question={state.questions[state.currentIndex]}
            questionIndex={state.currentIndex}
            totalQuestions={state.questions.length}
            timeRemaining={state.timeRemaining}
            selectedIndex={state.selectedIndex}
            opponentProgress={state.opponentProgress}
            onSelectAnswer={onSelectAnswer}
          />
        )

      case 'waiting_opponent':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mb-6"
            >
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Esperando al oponente...</h2>
            <p className="text-gray-400">Terminaste el quiz. El oponente aún está respondiendo.</p>
          </div>
        )

      case 'results':
        if (!state.challenge) {
          return null
        }

        const challengerName = state.challenge.challenger_id === myId ? myName : state.opponentName || 'Oponente'
        const opponentName = state.challenge.challenger_id === myId ? state.opponentName || 'Oponente' : myName

        return (
          <ChallengeResults
            challenge={state.challenge}
            myId={myId}
            challengerName={challengerName}
            opponentName={opponentName}
            onRematch={() => {
              // TODO: Implement rematch logic
              onReset()
            }}
            onBackToLobby={onReset}
          />
        )

      case 'idle':
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderPhase()}
        </motion.div>
      </AnimatePresence>

      {/* Error Display */}
      {state.error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold mb-1">Error</p>
                <p className="text-sm">{state.error}</p>
              </div>
              <button
                onClick={onReset}
                className="flex-shrink-0 text-red-400 hover:text-red-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
