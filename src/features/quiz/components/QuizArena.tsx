'use client'

import { useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useQuiz } from '../hooks/useQuiz'
import { usePresence } from '../hooks/usePresence'
import { useChallenge } from '../hooks/useChallenge'
import { QuizLobby } from './QuizLobby'
import { QuizQuestion } from './QuizQuestion'
import { QuizFeedback } from './QuizFeedback'
import { QuizResults } from './QuizResults'
import { ChallengeArena } from './ChallengeArena'
import { ChallengeToast } from './ChallengeToast'

export function QuizArena() {
  const { user, profile } = useAuth()
  const { state, startQuiz, selectAnswer, playAgain } = useQuiz()

  const presenceInfo = useMemo(() => {
    if (!profile) return null
    return {
      full_name: profile.full_name,
      fleet: profile.fleet,
      position: profile.position,
      elo_rating: state.stats?.elo_rating ?? 1500,
    }
  }, [profile, state.stats?.elo_rating])

  const { onlinePilots } = usePresence(user?.id ?? null, presenceInfo)
  const challenge = useChallenge(user?.id ?? null)

  const isChallengeActive = challenge.state.phase !== 'idle'

  // If a challenge is active, show the ChallengeArena
  if (isChallengeActive) {
    return (
      <ChallengeArena
        phase={challenge.state.phase}
        state={{ ...challenge.state, onlinePilots }}
        onSendChallenge={(pilotId, difficulty) => {
          const pilot = onlinePilots.find(p => p.id === pilotId)
          challenge.sendChallenge(pilotId, difficulty, null, pilot?.full_name || 'Piloto')
        }}
        onAcceptIncoming={challenge.acceptIncoming}
        onDeclineIncoming={challenge.declineIncoming}
        onCancelWaiting={challenge.cancelWaiting}
        onSelectAnswer={challenge.selectAnswer}
        onReset={challenge.reset}
        myId={user?.id || ''}
        myName={profile?.full_name || 'Piloto'}
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 md:py-8">
      {state.phase === 'lobby' && (
        <QuizLobby
          stats={state.stats}
          onStart={(difficulty, category) => startQuiz(difficulty, category, null)}
          error={state.error || challenge.state.error}
          onlinePilotsCount={onlinePilots.length}
          onStartChallenge={challenge.startSelecting}
        />
      )}

      {state.phase === 'playing' && state.questions[state.currentIndex] && (
        <QuizQuestion
          question={state.questions[state.currentIndex]}
          currentIndex={state.currentIndex}
          totalQuestions={state.questions.length}
          timeRemaining={state.timeRemaining}
          selectedIndex={state.selectedIndex}
          streak={state.streak}
          onSelect={selectAnswer}
        />
      )}

      {state.phase === 'feedback' && state.questions[state.currentIndex] && (
        <QuizFeedback
          question={state.questions[state.currentIndex]}
          selectedIndex={state.selectedIndex ?? -1}
          isCorrect={state.selectedIndex === state.questions[state.currentIndex].correct_index}
          streak={state.streak}
        />
      )}

      {state.phase === 'results' && state.session && state.stats && (
        <QuizResults
          session={state.session}
          stats={state.stats}
          questions={state.questions}
          onPlayAgain={playAgain}
        />
      )}

      {/* Incoming Challenge Toast */}
      <AnimatePresence>
        {challenge.state.incomingChallenge && (
          <ChallengeToast
            challengerName={challenge.state.incomingChallenge.challenger_name || 'Piloto'}
            challengerElo={challenge.state.incomingChallenge.challenger_elo ?? 1500}
            difficulty={challenge.state.incomingChallenge.difficulty as 1 | 2 | 3}
            onAccept={challenge.acceptIncoming}
            onDecline={challenge.declineIncoming}
            expiresAt={challenge.state.incomingChallenge.expires_at}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
