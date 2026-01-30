'use client'

import { useReducer, useCallback, useEffect } from 'react'
import type {
  SupportState,
  SupportAction,
  SupportTicket,
  SupportTicketWithMessages,
  SupportMessage,
  CreateTicketForm,
} from '../types'
import {
  getUserTickets,
  getTicketDetail,
  createTicket,
  addUserMessage,
  rateTicket as rateTicketAction,
  escalateTicket as escalateTicketAction,
  closeTicket as closeTicketAction,
} from '../services/support-actions'

const initialState: SupportState = {
  phase: 'loading',
  tickets: [],
  activeTicket: null,
  error: null,
  saving: false,
  agentResponding: false,
}

function supportReducer(state: SupportState, action: SupportAction): SupportState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, phase: 'loading', error: null }

    case 'LOAD_TICKETS':
      return { ...state, phase: 'list', tickets: action.payload, error: null }

    case 'LOAD_TICKET_DETAIL':
      return { ...state, phase: 'detail', activeTicket: action.payload }

    case 'SET_CREATING':
      return { ...state, phase: 'creating', error: null }

    case 'ADD_TICKET': {
      const newTicket = action.payload
      const initialMessage: SupportMessage = {
        id: crypto.randomUUID(),
        ticket_id: newTicket.id,
        sender_type: 'user',
        content: '',
        created_at: new Date().toISOString(),
      }

      return {
        ...state,
        phase: 'detail',
        tickets: [newTicket, ...state.tickets],
        activeTicket: {
          ...newTicket,
          messages: [initialMessage],
        },
        saving: false,
      }
    }

    case 'ADD_MESSAGE': {
      if (!state.activeTicket) return state

      return {
        ...state,
        activeTicket: {
          ...state.activeTicket,
          messages: [...state.activeTicket.messages, action.payload],
        },
      }
    }

    case 'UPDATE_TICKET': {
      if (!state.activeTicket) return state

      const updatedActiveTicket = {
        ...state.activeTicket,
        ...action.payload,
      }

      const updatedTickets = state.tickets.map((ticket) =>
        ticket.id === action.payload.id ? { ...ticket, ...action.payload } : ticket
      )

      return {
        ...state,
        activeTicket: updatedActiveTicket,
        tickets: updatedTickets,
      }
    }

    case 'APPEND_AGENT_CHUNK': {
      if (!state.activeTicket) return state

      const messages = [...state.activeTicket.messages]
      const lastMessage = messages[messages.length - 1]

      if (lastMessage && lastMessage.sender_type === 'agent') {
        messages[messages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + action.payload,
        }
      } else {
        messages.push({
          id: crypto.randomUUID(),
          ticket_id: state.activeTicket.id,
          sender_type: 'agent',
          content: action.payload,
          created_at: new Date().toISOString(),
        })
      }

      return {
        ...state,
        activeTicket: {
          ...state.activeTicket,
          messages,
        },
      }
    }

    case 'SET_SAVING':
      return { ...state, saving: action.payload }

    case 'SET_AGENT_RESPONDING':
      return { ...state, agentResponding: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, saving: false }

    case 'GO_BACK':
      return { ...state, phase: 'list', activeTicket: null }

    default:
      return state
  }
}

export function useSupport() {
  const [state, dispatch] = useReducer(supportReducer, initialState)

  const loadTickets = useCallback(async () => {
    dispatch({ type: 'SET_LOADING' })

    const { data, error } = await getUserTickets()

    if (error || !data) {
      dispatch({ type: 'SET_ERROR', payload: error || 'Error al cargar tickets' })
      return
    }

    dispatch({ type: 'LOAD_TICKETS', payload: data })
  }, [])

  const loadTicketDetail = useCallback(async (ticketId: string) => {
    dispatch({ type: 'SET_LOADING' })

    const { data, error } = await getTicketDetail(ticketId)

    if (error || !data) {
      dispatch({ type: 'SET_ERROR', payload: error || 'Error al cargar el ticket' })
      return
    }

    dispatch({ type: 'LOAD_TICKET_DETAIL', payload: data })
  }, [])

  const sendAgentResponse = useCallback(async (ticketId: string, message: string) => {
    dispatch({ type: 'SET_AGENT_RESPONDING', payload: true })

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, ticketId }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Error en la respuesta del agente')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              dispatch({ type: 'SET_AGENT_RESPONDING', payload: false })
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'chunk') {
                dispatch({ type: 'APPEND_AGENT_CHUNK', payload: parsed.content })
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in agent response:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error al obtener respuesta del agente' })
    } finally {
      dispatch({ type: 'SET_AGENT_RESPONDING', payload: false })
    }
  }, [])

  const submitTicket = useCallback(
    async (form: CreateTicketForm) => {
      dispatch({ type: 'SET_SAVING', payload: true })

      const { data, error } = await createTicket(form)

      if (error || !data) {
        dispatch({ type: 'SET_ERROR', payload: error || 'Error al crear el ticket' })
        return
      }

      dispatch({ type: 'ADD_TICKET', payload: data })
      await sendAgentResponse(data.id, form.message)
    },
    [sendAgentResponse]
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!state.activeTicket) return

      const userMessage: SupportMessage = {
        id: crypto.randomUUID(),
        ticket_id: state.activeTicket.id,
        sender_type: 'user',
        content,
        created_at: new Date().toISOString(),
      }

      dispatch({ type: 'ADD_MESSAGE', payload: userMessage })

      const { error } = await addUserMessage(state.activeTicket.id, content)

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error })
        return
      }

      await sendAgentResponse(state.activeTicket.id, content)
    },
    [state.activeTicket, sendAgentResponse]
  )

  const rateTicket = useCallback(
    async (rating: number) => {
      if (!state.activeTicket) return

      dispatch({ type: 'SET_SAVING', payload: true })

      const { error } = await rateTicketAction(state.activeTicket.id, rating)

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error })
        return
      }

      dispatch({
        type: 'UPDATE_TICKET',
        payload: { id: state.activeTicket.id, satisfaction_rating: rating },
      })
      dispatch({ type: 'SET_SAVING', payload: false })
    },
    [state.activeTicket]
  )

  const escalateTicket = useCallback(async () => {
    if (!state.activeTicket) return

    dispatch({ type: 'SET_SAVING', payload: true })

    const { error } = await escalateTicketAction(state.activeTicket.id)

    if (error) {
      dispatch({ type: 'SET_ERROR', payload: error })
      return
    }

    dispatch({
      type: 'UPDATE_TICKET',
      payload: { id: state.activeTicket.id, status: 'escalated' },
    })
    dispatch({ type: 'SET_SAVING', payload: false })
  }, [state.activeTicket])

  const closeTicket = useCallback(async () => {
    if (!state.activeTicket) return

    dispatch({ type: 'SET_SAVING', payload: true })

    const { error } = await closeTicketAction(state.activeTicket.id)

    if (error) {
      dispatch({ type: 'SET_ERROR', payload: error })
      return
    }

    dispatch({
      type: 'UPDATE_TICKET',
      payload: {
        id: state.activeTicket.id,
        status: 'closed',
        resolved_at: new Date().toISOString(),
      },
    })
    dispatch({ type: 'SET_SAVING', payload: false })
  }, [state.activeTicket])

  const startCreating = useCallback(() => {
    dispatch({ type: 'SET_CREATING' })
  }, [])

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' })
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  return {
    state,
    loadTickets,
    loadTicketDetail,
    submitTicket,
    sendMessage,
    rateTicket,
    escalateTicket,
    closeTicket,
    startCreating,
    goBack,
  }
}
