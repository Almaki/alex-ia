'use client'

import { useMemo, useEffect, useRef } from 'react'
import { AnimatePresence } from 'motion/react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useQuiz } from '../hooks/useQuiz'
import { usePresence } from '../hooks/usePresence'
import { useChallenge } from '../hooks/useChallenge'
import { logStudySession } from '@/features/study/services/study-actions'
import { QUIZ_CATEGORIES } from '../types'
import { QuizLobby } from './QuizLobby'
import { QuizQuestion } from './QuizQuestion'
import { QuizFeedback } from './QuizFeedback'
import { QuizResults } from './QuizResults'
import { ChallengeArena } from './ChallengeArena'
import { ChallengeToast } from './ChallengeToast'

interface StudyTopicContext {
  topicId: string
  category: string
  difficulty: 1 | 2 | 3
}

export function QuizArena() {
  const { user, profile } = useAuth()
  const { state, startQuiz, selectAnswer, playAgain } = useQuiz()
  const studyTopicRef = useRef<StudyTopicContext | null>(null)
  const autoStartedRef = useRef(false)
  const sessionRecordedRef = useRef(false)

  // Read study topic from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem('study_topic')
    if (raw) {
      try {
        studyTopicRef.current = JSON.parse(raw)
        sessionStorage.removeItem('study_topic')
      } catch {
        // ignore malformed data
      }
    }
  }, [])

  // Auto-start quiz when coming from study plan
  useEffect(() => {
    if (
      studyTopicRef.current &&
      !autoStartedRef.current &&
      state.phase === 'lobby' &&
      state.stats
    ) {
      autoStartedRef.current = true
      const { category, difficulty } = studyTopicRef.current
      startQuiz(difficulty, category, null)
    }
  }, [state.phase, state.stats, startQuiz])

  // Record study session when quiz finishes
  useEffect(() => {
    if (state.phase === 'results' && studyTopicRef.current && state.session && !sessionRecordedRef.current) {
      sessionRecordedRef.current = true
      const topic = studyTopicRef.current
      const score = state.session.score ?? 0
      logStudySession(topic.topicId, 'quiz', undefined, score).catch(() => {})
    }
  }, [state.phase, state.session])

  const studyCategory = studyTopicRef.current
    ? QUIZ_CATEGORIES.find((c) => c.value === studyTopicRef.current?.category)?.label
    : null

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

  const handlePlayAgain = () => {
    studyTopicRef.current = null
    autoStartedRef.current = false
    sessionRecordedRef.current = false
    playAgain()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 md:py-8">
      {/* Study Plan Context Banner */}
      {studyCategory && state.phase !== 'lobby' && (
        <div className="mb-4 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-xs text-amber-300 font-medium">Plan de Estudio: {studyCategory}</span>
        </div>
      )}

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
          answers={state.answers}
          onPlayAgain={handlePlayAgain}
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
