'use client'

import { useState } from 'react'
import type { WellnessMessage as WellnessMessageType } from '../types'

const DETAIL_DELIMITER = '---DETALLE---'

interface WellnessMessageProps {
  message: WellnessMessageType
}

export function WellnessMessage({ message }: WellnessMessageProps) {
  const isUser = message.role === 'user'
  const [expanded, setExpanded] = useState(false)

  // Split content at delimiter (only for finished assistant messages)
  let conciseContent = message.content
  let detailContent: string | null = null

  if (!isUser && !message.isStreaming && message.content.includes(DETAIL_DELIMITER)) {
    const parts = message.content.split(DETAIL_DELIMITER)
    conciseContent = parts[0].trim()
    detailContent = parts.slice(1).join(DETAIL_DELIMITER).trim()
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isUser
            ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white'
            : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
        }`}
      >
        {isUser ? (
          'T'
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-emerald-600/20 border border-emerald-500/20 text-emerald-50 rounded-br-md'
              : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-md'
          }`}
        >
          {/* Concise part (always visible) */}
          <div className="whitespace-pre-wrap">{conciseContent}</div>

          {message.isStreaming && (
            <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-full bg-teal-400" />
          )}

          {/* Expandable detail section */}
          {detailContent && (
            <>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  expanded ? 'max-h-[5000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="border-t border-white/10 pt-3 whitespace-pre-wrap">
                  {detailContent}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {expanded ? 'Ocultar' : 'Ver mas'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
