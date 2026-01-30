'use client'

import { useState } from 'react'
import { CreateTicketForm, CATEGORY_OPTIONS } from '../types'

interface NewTicketFormProps {
  onSubmit: (form: CreateTicketForm) => Promise<void>
  onCancel: () => void
  saving: boolean
}

export function NewTicketForm({ onSubmit, onCancel, saving }: NewTicketFormProps) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<CreateTicketForm['category']>('tecnico')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!subject.trim()) {
      setError('El asunto es requerido')
      return
    }
    if (!message.trim()) {
      setError('El mensaje es requerido')
      return
    }

    try {
      await onSubmit({
        subject: subject.trim(),
        category,
        message: message.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear ticket')
    }
  }

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          disabled={saving}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-white">Nuevo Ticket</h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Subject Input */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
            Asunto
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Describe tu problema brevemente"
            disabled={saving}
            className="w-full px-4 py-3 bg-gray-950/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={100}
          />
        </div>

        {/* Category Select */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Categoria
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORY_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                disabled={saving}
                className={`px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  category === option.value
                    ? 'bg-cyan-500/20 border-2 border-cyan-500/50 text-cyan-400'
                    : 'bg-gray-950/50 border-2 border-white/10 text-gray-300 hover:border-white/20 hover:bg-gray-950/70'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Textarea */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
            Mensaje
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuentanos mas detalles..."
            disabled={saving}
            rows={5}
            className="w-full px-4 py-3 bg-gray-950/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1.5">
            {message.length}/1000 caracteres
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-600 active:scale-[0.99] transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                <span>Enviar Ticket</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-6 py-3 bg-transparent border border-white/10 text-gray-300 font-semibold rounded-xl hover:bg-white/5 hover:border-white/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
