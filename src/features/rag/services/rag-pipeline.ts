import { generateEmbedding } from './embedding-service'
import { searchManualChunks } from './search-service'
import type { RagContext, RagSource } from '../types'

interface RagOptions {
  aircraftType?: string
  manualType?: string
  maxResults?: number
}

export async function executeRagPipeline(
  query: string,
  options: RagOptions = {}
): Promise<RagContext> {
  // 1. Generate embedding for the user query
  const { embedding } = await generateEmbedding(query)

  // 2. Search for relevant chunks
  const results = await searchManualChunks({
    query_embedding: embedding,
    match_count: options.maxResults ?? 5,
    match_threshold: 0.5,
    manual_type: options.manualType,
    aircraft_type: options.aircraftType,
  })

  // 3. If no results, return empty context
  if (results.length === 0) {
    return { results: [], formattedContext: '', sources: [] }
  }

  // 4. Build formatted context for LLM (no source identifiers to prevent leaks)
  const formattedContext = results
    .map((r, i) => `[Referencia ${i + 1}]\n${r.content}`)
    .join('\n\n---\n\n')

  // 5. Extract sources for citation
  const sources: RagSource[] = results.map((r) => ({
    chunk_id: r.id,
    manual_type: r.manual_type,
    aircraft_type: r.aircraft_type,
    section: r.section,
    page_number: r.page_number,
    similarity: r.similarity,
  }))

  return { results, formattedContext, sources }
}
