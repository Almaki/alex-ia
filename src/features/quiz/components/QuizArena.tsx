'use client'

import { useQuiz } from '../hooks/useQuiz'
import { QuizLobby } from './QuizLobby'
import { QuizQuestion } from './QuizQuestion'
import { QuizFeedback } from './QuizFeedback'
import { QuizResults } from './QuizResults'

export function QuizArena() {
  const { state, startQuiz, selectAnswer, playAgain } = useQuiz()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {state.phase === 'lobby' && (
        <QuizLobby
          stats={state.stats}
          onStart={(difficulty, category) => startQuiz(difficulty, category, null)}
          error={state.error}
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
    </div>
  )
}
