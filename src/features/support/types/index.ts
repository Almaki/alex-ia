// Type Aliases
export type TicketCategory = 'tecnico' | 'cuenta' | 'contenido' | 'sugerencia' | 'otro'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'escalated' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type MessageSenderType = 'user' | 'agent' | 'admin'

// Domain Interfaces
export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  satisfaction_rating: number | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_type: MessageSenderType
  content: string
  created_at: string
}

export interface SupportTicketWithMessages extends SupportTicket {
  messages: SupportMessage[]
}

export interface CreateTicketForm {
  subject: string
  category: TicketCategory
  message: string
}

// State Management Types
export type SupportPhase = 'loading' | 'list' | 'detail' | 'creating'

export interface SupportState {
  phase: SupportPhase
  tickets: SupportTicket[]
  activeTicket: SupportTicketWithMessages | null
  error: string | null
  saving: boolean
  agentResponding: boolean
}

export type SupportAction =
  | { type: 'SET_LOADING' }
  | { type: 'LOAD_TICKETS'; payload: SupportTicket[] }
  | { type: 'LOAD_TICKET_DETAIL'; payload: SupportTicketWithMessages }
  | { type: 'SET_CREATING' }
  | { type: 'ADD_TICKET'; payload: SupportTicket }
  | { type: 'ADD_MESSAGE'; payload: SupportMessage }
  | { type: 'UPDATE_TICKET'; payload: Partial<SupportTicket> & { id: string } }
  | { type: 'APPEND_AGENT_CHUNK'; payload: string }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_AGENT_RESPONDING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'GO_BACK' }

// Constants
export const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: 'tecnico', label: 'Problema Tecnico' },
  { value: 'cuenta', label: 'Cuenta / Facturacion' },
  { value: 'contenido', label: 'Calidad de Contenido' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'otro', label: 'Otro' },
]

export const STATUS_LABELS: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Abierto', color: 'text-blue-400' },
  in_progress: { label: 'En Proceso', color: 'text-amber-400' },
  resolved: { label: 'Resuelto', color: 'text-emerald-400' },
  escalated: { label: 'Escalado', color: 'text-red-400' },
  closed: { label: 'Cerrado', color: 'text-gray-400' },
}

export const STATUS_BG: Record<TicketStatus, string> = {
  open: 'bg-blue-500/10',
  in_progress: 'bg-amber-500/10',
  resolved: 'bg-emerald-500/10',
  escalated: 'bg-red-500/10',
  closed: 'bg-gray-500/10',
}
