'use client'

import { useState, useEffect, useRef } from 'react'
import { SupportTicketWithMessages, STATUS_LABELS, STATUS_BG, CATEGORY_OPTIONS } from '../types'
import { SatisfactionRating } from './SatisfactionRating'

interface TicketDetailProps {
  ticket: SupportTicketWithMessages
  agentResponding: boolean
  onSendMessage: (content: string) => void
  onRate: (rating: number) => void
  onEscalate: () => void
  onClose: () => void
  onBack: () => void
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function TicketDetail({
  ticket,
  agentResponding,
  onSendMessage,
  onRate,
  onEscalate,
  onClose,
  onBack,
}: TicketDetailProps) {
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const statusInfo = STATUS_LABELS[ticket.status]
  const statusBg = STATUS_BG[ticket.status]

  const getCategoryLabel = (category: string) => {
    return CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket.messages, agentResponding])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || agentResponding) return

    onSendMessage(messageInput.trim())
    setMessageInput('')
  }

  const isClosed = ticket.status === 'closed'
  const isResolved = ticket.status === 'resolved'
  const isEscalated = ticket.status === 'escalated'
  const canInteract = !isClosed

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2 break-words">
              {ticket.subject}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusBg}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`} />
                <span className={`text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                {getCategoryLabel(ticket.category)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {ticket.messages.map(message => {
          const isUser = message.sender_type === 'user'
          const isAgent = message.sender_type === 'agent'
          const isAdmin = message.sender_type === 'admin'

          return (
            <div
              key={message.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
                {!isUser && (
                  <p className="text-xs font-medium mb-1 px-1 text-gray-400">
                    {isAdmin ? 'Equipo AlexIA' : 'AlexIA Soporte'}
                  </p>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    isUser
                      ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-white'
                      : isAdmin
                      ? 'bg-amber-500/10 border border-amber-500/30 text-white'
                      : 'bg-gray-800/50 border border-white/10 text-gray-100'
                  }`}
                >
                  <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          )
        })}

        {/* Typing Indicator */}
        {agentResponding && (
          <div className="flex justify-start">
            <div className="max-w-[75%]">
              <p className="text-xs font-medium mb-1 px-1 text-gray-400">
                AlexIA Soporte
              </p>
              <div className="px-4 py-3 rounded-2xl bg-gray-800/50 border border-white/10">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Escalation Banner */}
      {isEscalated && (
        <div className="flex-shrink-0 mx-4 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-amber-300">
              Tu ticket fue escalado a nuestro equipo humano. Te responderemos pronto.
            </p>
          </div>
        </div>
      )}

      {/* Satisfaction Rating */}
      {(isResolved || isClosed) && (
        <div className="flex-shrink-0 mx-4 mb-4">
          <SatisfactionRating
            currentRating={ticket.satisfaction_rating}
            onRate={onRate}
          />
        </div>
      )}

      {/* Action Bar */}
      {canInteract && (
        <div className="flex-shrink-0 border-t border-white/10 p-4 bg-gray-950/50">
          <form onSubmit={handleSendMessage} className="flex gap-2 mb-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={agentResponding}
              className="flex-1 px-4 py-2.5 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || agentResponding}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>

          {/* Escalate Button */}
          {!isEscalated && (
            <button
              onClick={onEscalate}
              disabled={agentResponding}
              className="w-full px-4 py-2.5 bg-transparent border border-amber-500/30 text-amber-400 font-medium rounded-lg hover:bg-amber-500/10 hover:border-amber-500/50 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
              </svg>
              Escalar a equipo humano
            </button>
          )}
        </div>
      )}
    </div>
  )
}
