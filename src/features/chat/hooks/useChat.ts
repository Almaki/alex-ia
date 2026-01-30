'use client'

import { useReducer, useRef, useCallback } from 'react'
import type { ChatState, ChatAction, ChatMessage, ResponseMode } from '../types'
import type { SourceCitation } from '@/types/database'

const initialState: ChatState = {
  messages: [],
  status: 'idle',
  conversationId: null,
  error: null,
  responseMode: 'detailed',
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return { ...state, messages: [...state.messages, action.message], status: 'sending', error: null }

    case 'START_STREAMING':
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: action.id, role: 'assistant', content: '', isStreaming: true },
        ],
        status: 'streaming',
      }

    case 'APPEND_CHUNK': {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant' && last.isStreaming) {
        msgs[msgs.length - 1] = { ...last, content: last.content + action.chunk }
      }
      return { ...state, messages: msgs }
    }

    case 'FINISH_STREAMING': {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, isStreaming: false, sources: action.sources }
      }
      return { ...state, messages: msgs, status: 'idle' }
    }

    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.error }

    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.id }

    case 'LOAD_MESSAGES':
      return { ...state, messages: action.messages, conversationId: action.conversationId }

    case 'SET_RESPONSE_MODE':
      return { ...state, responseMode: action.mode }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.status === 'streaming') return

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    }
    dispatch({ type: 'ADD_USER_MESSAGE', message: userMsg })

    // Start streaming placeholder
    const assistantId = crypto.randomUUID()
    dispatch({ type: 'START_STREAMING', id: assistantId })

    // Abort previous request if any
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversationId: state.conversationId,
          responseMode: state.responseMode,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error de conexion' }))
        dispatch({ type: 'SET_ERROR', error: err.error || 'Error del servidor' })
        // Remove the streaming message
        dispatch({ type: 'FINISH_STREAMING' })
        return
      }

      // Read SSE stream
      const reader = res.body?.getReader()
      if (!reader) {
        dispatch({ type: 'SET_ERROR', error: 'No se pudo leer la respuesta' })
        dispatch({ type: 'FINISH_STREAMING' })
        return
      }

      const decoder = new TextDecoder()
      let sources: SourceCitation[] | undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'chunk') {
                dispatch({ type: 'APPEND_CHUNK', chunk: parsed.content })
              } else if (parsed.type === 'sources') {
                sources = parsed.sources
              } else if (parsed.type === 'conversation_id') {
                dispatch({ type: 'SET_CONVERSATION_ID', id: parsed.id })
              } else if (parsed.type === 'error') {
                dispatch({ type: 'SET_ERROR', error: parsed.message })
              }
            } catch {
              // Non-JSON line, ignore
            }
          }
        }
      }

      dispatch({ type: 'FINISH_STREAMING', sources })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      dispatch({ type: 'SET_ERROR', error: 'Error de conexion con el servidor' })
      dispatch({ type: 'FINISH_STREAMING' })
    }
  }, [state.conversationId, state.status, state.responseMode])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    dispatch({ type: 'FINISH_STREAMING' })
  }, [])

  const loadConversation = useCallback((messages: ChatMessage[], conversationId: string) => {
    dispatch({ type: 'LOAD_MESSAGES', messages, conversationId })
  }, [])

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    dispatch({ type: 'RESET' })
  }, [])

  const setResponseMode = useCallback((mode: ResponseMode) => {
    dispatch({ type: 'SET_RESPONSE_MODE', mode })
  }, [])

  return {
    messages: state.messages,
    status: state.status,
    conversationId: state.conversationId,
    error: state.error,
    responseMode: state.responseMode,
    sendMessage,
    stopStreaming,
    loadConversation,
    newChat,
    setResponseMode,
  }
}
