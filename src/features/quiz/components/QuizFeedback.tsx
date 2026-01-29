'use client'

import { useEffect, useState } from 'react'
import type { QuizQuestion } from '../types'

interface QuizFeedbackProps {
  question: QuizQuestion
  selectedIndex: number
  isCorrect: boolean
  streak: number
}

export function QuizFeedback({
  question,
  selectedIndex,
  isCorrect,
  streak,
}: QuizFeedbackProps) {
  const [progress, setProgress] = useState(100)
  const isTimeout = selectedIndex === -1

  useEffect(() => {
    const duration = 2500
    const interval = 50
    const decrement = (100 / duration) * interval

    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrement))
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
      {/* Feedback Icon & Message */}
      <div className="text-center mb-8">
        {isCorrect ? (
          <>
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 mb-4 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-emerald-500 mb-2">Correcto!</h2>
            {streak > 1 && (
              <div className="flex items-center justify-center gap-2 text-orange-500">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                <span className="text-lg font-semibold">Racha de {streak}!</span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Error Icon */}
            <div className="mx-auto w-20 h-20 mb-4 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-red-500 mb-2">
              {isTimeout ? 'Tiempo agotado' : 'Incorrecto'}
            </h2>
            {!isTimeout && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Respuesta correcta:</p>
                <p className="text-emerald-400 font-medium">
                  {question.options[question.correct_index]}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Explanation */}
      <div className="p-4 bg-white/5 border border-white/5 rounded-xl mb-6">
        <p className="text-gray-300 leading-relaxed">
          {question.explanation}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-50 ${
            isCorrect ? 'bg-emerald-500' : 'bg-red-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-center text-gray-400 text-sm mt-2">
        Siguiente pregunta...
      </p>
    </div>
  )
}
