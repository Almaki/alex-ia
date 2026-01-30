'use client'

import { useState } from 'react'

interface SatisfactionRatingProps {
  currentRating: number | null
  onRate: (rating: number) => void
}

export function SatisfactionRating({ currentRating, onRate }: SatisfactionRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const handleRate = (rating: number) => {
    if (currentRating !== null) return // Already rated
    onRate(rating)
  }

  const displayRating = hoverRating || currentRating || 0
  const isRated = currentRating !== null

  return (
    <div className="p-4 bg-gray-800/30 border border-white/10 rounded-xl">
      <p className="text-sm font-medium text-gray-300 mb-3 text-center">
        {isRated ? 'Gracias por tu feedback' : 'Como fue tu experiencia?'}
      </p>

      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map(star => {
          const isFilled = star <= displayRating

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleRate(star)}
              onMouseEnter={() => !isRated && setHoverRating(star)}
              onMouseLeave={() => !isRated && setHoverRating(null)}
              disabled={isRated}
              className={`transition-all duration-200 ${
                isRated
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-110 active:scale-95'
              }`}
            >
              <svg
                className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                  isFilled
                    ? 'text-amber-400'
                    : 'text-gray-600'
                }`}
                viewBox="0 0 20 20"
                fill={isFilled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={isFilled ? 0 : 1.5}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          )
        })}
      </div>

      {isRated && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Calificaste {currentRating} de 5 estrellas
        </p>
      )}
    </div>
  )
}
