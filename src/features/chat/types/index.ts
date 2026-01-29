import type { SourceCitation } from '@/types/database'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceCitation[]
  isStreaming?: boolean
}

export interface ChatConversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export type ChatStatus = 'idle' | 'sending' | 'streaming' | 'error'

export interface ChatState {
  messages: ChatMessage[]
  status: ChatStatus
  conversationId: string | null
  error: string | null
}

export type ChatAction =
  | { type: 'ADD_USER_MESSAGE'; message: ChatMessage }
  | { type: 'START_STREAMING'; id: string }
  | { type: 'APPEND_CHUNK'; chunk: string }
  | { type: 'FINISH_STREAMING'; sources?: SourceCitation[] }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_CONVERSATION_ID'; id: string }
  | { type: 'LOAD_MESSAGES'; messages: ChatMessage[]; conversationId: string }
  | { type: 'RESET' }
