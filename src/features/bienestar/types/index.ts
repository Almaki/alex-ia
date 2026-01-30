export interface WellnessMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export interface WellnessConversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export type WellnessStatus = 'idle' | 'sending' | 'streaming' | 'error'

export type ResponseMode = 'concise' | 'detailed'

export interface WellnessState {
  messages: WellnessMessage[]
  status: WellnessStatus
  conversationId: string | null
  error: string | null
  responseMode: ResponseMode
}

export type WellnessAction =
  | { type: 'ADD_USER_MESSAGE'; message: WellnessMessage }
  | { type: 'START_STREAMING'; id: string }
  | { type: 'APPEND_CHUNK'; chunk: string }
  | { type: 'FINISH_STREAMING' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_CONVERSATION_ID'; id: string }
  | { type: 'LOAD_MESSAGES'; messages: WellnessMessage[]; conversationId: string }
  | { type: 'SET_RESPONSE_MODE'; mode: ResponseMode }
  | { type: 'RESET' }
