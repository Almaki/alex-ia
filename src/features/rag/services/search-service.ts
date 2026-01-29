import { createClient } from '@/lib/supabase/server'
import type { RawSearchResult, SearchResult } from '../types'

interface SearchOptions {
  query_embedding: number[]
  match_count?: number
  match_threshold?: number
  manual_type?: string
  aircraft_type?: string
}

function mapRawToSearchResult(raw: RawSearchResult): SearchResult {
  return {
    id: String(raw.id),
    content: raw.content,
    manual_type: raw.metadata?.manualType ?? 'unknown',
    aircraft_type: raw.metadata?.aircraftType ?? null,
    section: raw.metadata?.section ?? null,
    chapter: raw.metadata?.chapter ?? null,
    page_number: raw.metadata?.pageNumber ?? null,
    similarity: raw.similarity,
  }
}

export async function searchManualChunks(options: SearchOptions): Promise<SearchResult[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('search_aviation_manual', {
    query_embedding: JSON.stringify(options.query_embedding),
    match_count: options.match_count ?? 5,
    match_threshold: options.match_threshold ?? 0.5,
    manual_type: options.manual_type ?? null,
    aircraft_type: options.aircraft_type ?? null,
  })

  if (error) {
    console.error('Search RPC error:', error)
    return []
  }

  return ((data ?? []) as RawSearchResult[]).map(mapRawToSearchResult)
}
