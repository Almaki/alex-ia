'use client'

import { useEffect, useState, useTransition } from 'react'
import type { ChatConversation } from '../types'
import { getConversations, deleteConversation } from '../services/chat-actions'

interface ConversationListProps {
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function ConversationList({ activeId, onSelect, onNew }: ConversationListProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [isPending, startTransition] = useTransition()

  const loadConversations = () => {
    startTransition(async () => {
      const data = await getConversations()
      setConversations(data)
    })
  }

  // Load on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadConversations() }, [])

  // Reload when active conversation changes (new message sent)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeId) loadConversations() }, [activeId])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const result = await deleteConversation(id)
    if (!result.error) {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) onNew()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* New chat button */}
      <button
        type="button"
        onClick={onNew}
        className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nueva conversacion
      </button>

      {/* Conversation list */}
      <div className="mt-3 flex-1 overflow-y-auto px-3 space-y-1">
        {isPending && conversations.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-500">Cargando...</p>
        )}

        {conversations.map((conv) => (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv.id)}
            className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              activeId === conv.id
                ? 'bg-purple-600/20 text-purple-300'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="flex-1 truncate">{conv.title || 'Sin titulo'}</span>
            <button
              type="button"
              onClick={(e) => handleDelete(e, conv.id)}
              className="hidden shrink-0 rounded p-0.5 text-gray-500 hover:bg-white/10 hover:text-red-400 group-hover:block"
              aria-label="Eliminar"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </button>
        ))}

        {!isPending && conversations.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-gray-600">
            Aun no tienes conversaciones. Hazle una pregunta a AlexIA.
          </p>
        )}
      </div>
    </div>
  )
}
