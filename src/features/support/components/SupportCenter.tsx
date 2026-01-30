'use client'

import { useSupport } from '../hooks/useSupport'
import { TicketList } from './TicketList'
import { NewTicketForm } from './NewTicketForm'
import { TicketDetail } from './TicketDetail'

export function SupportCenter() {
  const {
    state,
    submitTicket,
    loadTicketDetail,
    sendMessage,
    rateTicket,
    escalateTicket,
    closeTicket,
    goBack,
    startCreating,
  } = useSupport()

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 md:py-8">
      {/* Loading State */}
      {state.phase === 'loading' && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Cargando tickets...</p>
          </div>
        </div>
      )}

      {/* List State */}
      {state.phase === 'list' && (
        <div className="relative">
          <TicketList
            tickets={state.tickets}
            onSelect={loadTicketDetail}
            onNew={startCreating}
          />

          {/* Floating Action Button */}
          <button
            onClick={startCreating}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-full hover:from-teal-600 hover:to-cyan-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 flex items-center gap-2 z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Nuevo Ticket</span>
          </button>
        </div>
      )}

      {/* Creating State */}
      {state.phase === 'creating' && (
        <NewTicketForm
          onSubmit={submitTicket}
          onCancel={goBack}
          saving={state.saving}
        />
      )}

      {/* Detail State */}
      {state.phase === 'detail' && state.activeTicket && (
        <TicketDetail
          ticket={state.activeTicket}
          agentResponding={state.agentResponding}
          onSendMessage={sendMessage}
          onRate={rateTicket}
          onEscalate={escalateTicket}
          onClose={closeTicket}
          onBack={goBack}
        />
      )}

      {/* Error State */}
      {state.error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-full mx-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl shadow-lg z-20">
          <p className="text-red-400 text-sm text-center">{state.error}</p>
        </div>
      )}
    </div>
  )
}
