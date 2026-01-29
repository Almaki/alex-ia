export interface ChunkMetadata {
  manualType?: string
  aircraftType?: string
  section?: string
  chapter?: string
  pageNumber?: number
  [key: string]: unknown
}

export interface RawSearchResult {
  id: number
  content: string
  metadata: ChunkMetadata
  similarity: number
}

export interface SearchResult {
  id: string
  content: string
  manual_type: string
  aircraft_type: string | null
  section: string | null
  chapter: string | null
  page_number: number | null
  similarity: number
}

export interface RagContext {
  results: SearchResult[]
  formattedContext: string
  sources: RagSource[]
}

export interface RagSource {
  chunk_id: string
  manual_type: string
  aircraft_type: string | null
  section: string | null
  page_number: number | null
  similarity: number
}

export interface EmbeddingResponse {
  embedding: number[]
  dimension: number
}
