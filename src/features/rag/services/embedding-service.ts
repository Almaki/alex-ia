import { GoogleGenerativeAI } from '@google/generative-ai'
import type { EmbeddingResponse } from '../types'

const EMBEDDING_MODEL = 'text-embedding-004'
const EMBEDDING_DIMENSION = 768

let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

export async function generateEmbedding(text: string): Promise<EmbeddingResponse> {
  const client = getClient()
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL })

  const result = await model.embedContent(text)
  const embedding = result.embedding.values

  return { embedding, dimension: EMBEDDING_DIMENSION }
}

export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
  const client = getClient()
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL })

  const result = await model.batchEmbedContents({
    requests: texts.map((text) => ({ content: { parts: [{ text }], role: 'user' } })),
  })

  return result.embeddings.map((e) => ({
    embedding: e.values,
    dimension: EMBEDDING_DIMENSION,
  }))
}
