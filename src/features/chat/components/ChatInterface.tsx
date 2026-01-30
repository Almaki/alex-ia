'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useChat } from '../hooks/useChat'
import { getMessages } from '../services/chat-actions'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ConversationList } from './ConversationList'
import type { ChatMessage } from '../types'

const STUDY_CATEGORY_LABELS: Record<string, string> = {
  systems: 'Sistemas',
  aerodynamics: 'Aerodinamica',
  meteorology: 'Meteorologia',
  regulations: 'Regulaciones',
  procedures: 'Procedimientos',
  performance: 'Performance',
  navigation: 'Navegacion',
  human_factors: 'Factores Humanos',
  emergency: 'Emergencias',
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Basico',
  2: 'Intermedio',
  3: 'Avanzado',
}

const PLAN_TYPE_PROMPTS: Record<string, string> = {
  simulator_prep: 'Enfocate en procedimientos normales, anormales y de emergencia. Incluye rutas de decision ante fallas de sistemas, consejos de CRM y factor humano. Menciona memory items relevantes.',
  line_check: 'Enfocate en teoria operativa, procedimientos normales, memory items y regulaciones. Incluye aspectos de performance y navegacion que se evaluan en un line check.',
  proficiency_check: 'Cubre todos los aspectos tecnicos y operativos de forma integral. Incluye limitaciones, procedimientos y conceptos fundamentales.',
  type_rating: 'Enfocate en conocimiento profundo de sistemas de aeronave, limitaciones, performance y procedimientos especificos del tipo.',
  recurrent: 'Haz un repaso general cubriendo las areas mas importantes. Incluye actualizaciones recientes y puntos clave de seguridad.',
}

export function ChatInterface() {
  const { messages, status, conversationId, error, responseMode, sendMessage, stopStreaming, loadConversation, newChat, setResponseMode } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const studyAutoSentRef = useRef(false)

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Read study_topic from sessionStorage and auto-send contextual message
  useEffect(() => {
    if (studyAutoSentRef.current) return

    const raw = sessionStorage.getItem('study_topic')
    if (!raw) return

    try {
      const topic = JSON.parse(raw) as { topicId: string; category: string; difficulty: number; planType?: string }
      sessionStorage.removeItem('study_topic')
      studyAutoSentRef.current = true

      const categoryLabel = STUDY_CATEGORY_LABELS[topic.category] || topic.category
      const difficultyLabel = DIFFICULTY_LABELS[topic.difficulty] || 'Intermedio'
      const planContext = topic.planType ? PLAN_TYPE_PROMPTS[topic.planType] || '' : ''

      const prompt = `Estoy estudiando "${categoryLabel}" a nivel ${difficultyLabel} como parte de mi plan de estudio. Explicame los conceptos clave y puntos importantes que debo dominar sobre este tema para mi operacion como piloto.${planContext ? ` ${planContext}` : ''}`

      setTimeout(() => sendMessage(prompt), 300)
    } catch {
      // ignore malformed data
    }
  }, [sendMessage])

  const handleSelectConversation = useCallback(async (id: string) => {
    const msgs = await getMessages(id)
    loadConversation(msgs as ChatMessage[], id)
  }, [loadConversation])

  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      {/* Sidebar - Conversation history */}
      <div className="hidden w-64 shrink-0 border-r border-white/10 bg-gray-950/50 md:block">
        <ConversationList
          activeId={conversationId}
          onSelect={handleSelectConversation}
          onNew={newChat}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-gray-950/80 backdrop-blur-sm px-3 py-2.5 md:px-4 md:py-3">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xs md:text-sm font-bold text-white">
            A
          </div>
          <div>
            <h2 className="text-xs md:text-sm font-semibold text-white">AlexIA</h2>
            <p className="text-xs text-gray-500">Tu copiloto digital de aviacion</p>
          </div>

          {/* Response Mode Selector */}
          <div className="flex items-center gap-0.5 ml-auto bg-gray-800/60 rounded-lg p-0.5 border border-white/10">
            {([
              { mode: 'concise' as const, label: 'Directa' },
              { mode: 'detailed' as const, label: 'Detallada' },
              { mode: 'procedure' as const, label: 'SOP' },
            ]).map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setResponseMode(mode)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  responseMode === mode
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
                  <svg className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Hola, soy AlexIA</h3>
                <p className="text-sm text-gray-400">
                  Tu copiloto digital de aviacion. Preguntame sobre procedimientos,
                  limitaciones, sistemas o cualquier tema tecnico de tu flota.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {[
                    'Crosswind limit pista mojada?',
                    'Como reseteo el FWC?',
                    'Fuel imbalance limit A320',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {error && (
            <div className="mx-auto max-w-md rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} onStop={stopStreaming} status={status} />
      </div>
    </div>
  )
}
