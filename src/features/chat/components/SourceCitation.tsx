'use client'

import type { SourceCitation as SourceCitationType } from '@/types/database'

interface SourceCitationProps {
  sources: SourceCitationType[]
}

export function SourceCitation({ sources }: SourceCitationProps) {
  if (sources.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((source, i) => (
        <span
          key={source.chunk_id || i}
          className="inline-flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300"
          title={`Relevancia: ${Math.round(source.similarity * 100)}%`}
        >
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="font-medium">{source.manual_type}</span>
          {source.section && <span className="text-purple-400">| {source.section}</span>}
          {source.page_number && <span className="text-purple-400">p.{source.page_number}</span>}
          <span className="text-purple-500">{Math.round(source.similarity * 100)}%</span>
        </span>
      ))}
    </div>
  )
}
