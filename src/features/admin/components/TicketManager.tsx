'use client'

import { useEffect, useState } from 'react'
import {
  getAdminTickets,
  getAdminTicketMessages,
  addAdminMessage,
  updateTicketStatus,
  getTicketStats,
} from '../services/admin-actions'

interface Ticket {
  id: string
  user_id: string
  subject: string
  category: string
  status: string
  priority: string
  satisfaction_rating: number | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  user_name: string | null
  user_email: string | null
}

interface Message {
  id: string
  ticket_id: string
  sender_type: string
  content: string
  created_at: string
}

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'open', label: 'Abiertos' },
  { key: 'in_progress', label: 'En Proceso' },
  { key: 'escalated', label: 'Escalados' },
  { key: 'resolved', label: 'Resueltos' },
  { key: 'closed', label: 'Cerrados' },
]

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  escalated: 'bg-red-500/20 text-red-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
  closed: 'bg-gray-500/20 text-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Proceso',
  escalated: 'Escalado',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

export function TicketManager() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<{ status: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [statusFilter])

  async function loadData() {
    setLoading(true)
    const [ticketsData, statsData] = await Promise.all([
      getAdminTickets(statusFilter),
      getTicketStats(),
    ])
    setTickets(ticketsData)
    setStats(statsData)
    setLoading(false)
  }

  async function handleExpand(ticketId: string) {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null)
      return
    }

    setExpandedTicket(ticketId)

    if (!messages[ticketId]) {
      const msgs = await getAdminTicketMessages(ticketId)
      setMessages(prev => ({ ...prev, [ticketId]: msgs }))
    }
  }

  async function handleSendReply(ticketId: string) {
    const content = replyText[ticketId]?.trim()
    if (!content) return

    setSending(prev => ({ ...prev, [ticketId]: true }))
    const result = await addAdminMessage(ticketId, content)

    if (result.error) {
      alert(result.error)
    } else {
      const updatedMessages = await getAdminTicketMessages(ticketId)
      setMessages(prev => ({ ...prev, [ticketId]: updatedMessages }))
      setReplyText(prev => ({ ...prev, [ticketId]: '' }))
    }

    setSending(prev => ({ ...prev, [ticketId]: false }))
  }

  async function handleStatusChange(ticketId: string, newStatus: string) {
    const result = await updateTicketStatus(ticketId, newStatus)
    if (result.error) {
      alert(result.error)
    } else {
      await loadData()
    }
  }

  function renderStars(rating: number | null) {
    if (!rating) return <span className="text-gray-500">-</span>
    return (
      <span className="text-amber-400">
        {'★'.repeat(rating)}
        {'☆'.repeat(5 - rating)}
      </span>
    )
  }

  const getStatCount = (status: string) => {
    if (status === 'all') return tickets.length
    return stats.find(s => s.status === status)?.count ?? 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === filter.key
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {filter.label} ({getStatCount(filter.key)})
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-gray-900/50">
        {tickets.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            No hay tickets con este filtro
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {tickets.map(ticket => (
              <div key={ticket.id}>
                <div
                  onClick={() => handleExpand(ticket.id)}
                  className="cursor-pointer p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            STATUS_COLORS[ticket.status]
                          }`}
                        >
                          {STATUS_LABELS[ticket.status]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white mb-1">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{ticket.user_name || 'Usuario desconocido'}</span>
                        <span>{ticket.user_email}</span>
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {renderStars(ticket.satisfaction_rating)}
                      <span className="text-xs text-gray-500">
                        {expandedTicket === ticket.id ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedTicket === ticket.id && (
                  <div className="border-t border-white/10 bg-gray-800/50 p-4 space-y-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {messages[ticket.id]?.map(msg => (
                        <div
                          key={msg.id}
                          className={`rounded-lg p-3 ${
                            msg.sender_type === 'admin'
                              ? 'bg-blue-500/10 ml-8'
                              : 'bg-gray-700/50 mr-8'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-300">
                              {msg.sender_type === 'admin' ? 'Admin' : 'Usuario'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleString('es-ES')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-200">{msg.content}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <textarea
                        value={replyText[ticket.id] || ''}
                        onChange={e =>
                          setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))
                        }
                        placeholder="Escribe tu respuesta..."
                        className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleSendReply(ticket.id)}
                          disabled={sending[ticket.id]}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {sending[ticket.id] ? 'Enviando...' : 'Enviar'}
                        </button>
                        <select
                          value={ticket.status}
                          onChange={e => handleStatusChange(ticket.id, e.target.value)}
                          className="rounded-lg bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="open">Abierto</option>
                          <option value="in_progress">En Proceso</option>
                          <option value="escalated">Escalado</option>
                          <option value="resolved">Resuelto</option>
                          <option value="closed">Cerrado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
