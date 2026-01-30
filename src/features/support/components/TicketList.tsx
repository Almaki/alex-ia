'use client'

import { SupportTicket, CATEGORY_OPTIONS, STATUS_LABELS, STATUS_BG } from '../types'

interface TicketListProps {
  tickets: SupportTicket[]
  onSelect: (ticketId: string) => void
  onNew: () => void
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'hace un momento'
  if (diffMins < 60) return `hace ${diffMins} min`
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  if (diffDays < 7) return `hace ${diffDays} dia${diffDays > 1 ? 's' : ''}`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export function TicketList({ tickets, onSelect, onNew }: TicketListProps) {
  const getCategoryLabel = (category: string) => {
    return CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Mis Tickets
        </h1>
        <button
          onClick={onNew}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 active:scale-95 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Ticket
        </button>
      </div>

      {/* Empty State */}
      {tickets.length === 0 && (
        <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-8 sm:p-12 text-center backdrop-blur-sm">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-3 text-white">
            No tienes tickets aun
          </h2>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">
            Crea un ticket para recibir soporte personalizado de AlexIA.
          </p>
          <button
            onClick={onNew}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 mx-auto inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Crear Primer Ticket
          </button>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length > 0 && (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const statusInfo = STATUS_LABELS[ticket.status]
            const statusBg = STATUS_BG[ticket.status]

            return (
              <button
                key={ticket.id}
                onClick={() => onSelect(ticket.id)}
                className="w-full bg-gray-900/50 border border-white/10 rounded-xl p-4 hover:bg-gray-900/70 hover:border-white/20 active:scale-[0.99] transition-all duration-200 text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusBg} mb-2`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`} />
                      <span className={`text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Subject */}
                    <h3 className="text-white font-semibold mb-1 truncate group-hover:text-cyan-400 transition-colors">
                      {ticket.subject}
                    </h3>

                    {/* Category & Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="text-xs px-2 py-0.5 rounded bg-white/5">
                        {getCategoryLabel(ticket.category)}
                      </span>
                      <span className="text-xs">
                        {formatTimeAgo(ticket.updated_at)}
                      </span>
                    </div>

                    {/* Satisfaction Rating */}
                    {ticket.satisfaction_rating && (
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= ticket.satisfaction_rating!
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-600'
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chevron */}
                  <svg
                    className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
