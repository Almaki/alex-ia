'use client'

import { useState, useRef, useCallback } from 'react'
import { useLogbook } from '../hooks/useLogbook'

export function BitacoraPage() {
  const { entries, uploads, loading, uploading, error, month, year, setMonth, setYear, uploadRoster, refresh } = useLogbook()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    await uploadRoster(file)
  }, [uploadRoster])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [handleFile])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const activityColors: Record<string, string> = {
    flight: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    sim: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ground: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    standby: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    off: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    vacation: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    training: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medical: 'bg-red-500/20 text-red-400 border-red-500/30',
    other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  const activityLabels: Record<string, string> = {
    flight: 'Vuelo', sim: 'Simulador', ground: 'Tierra', standby: 'Standby',
    off: 'Libre', vacation: 'Vacaciones', training: 'Entrenamiento',
    medical: 'Medico', other: 'Otro',
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bitacora Digital</h1>
        <p className="mt-1 text-sm text-gray-400">
          Sube tu roster y llena tu bitacora automaticamente
        </p>
        <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Beta
        </span>
      </div>

      {/* Upload Section */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-amber-500 bg-amber-500/10'
            : uploading
            ? 'border-purple-500/50 bg-purple-500/5'
            : 'border-white/20 bg-gray-900/50 hover:border-amber-500/50 hover:bg-gray-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
            <p className="text-amber-400 font-medium">Procesando roster...</p>
            <p className="text-xs text-gray-500">Esto puede tardar unos segundos</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-white font-medium">Sube tu roster</p>
            <p className="text-sm text-gray-400">
              Arrastra una foto o PDF, o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-600">JPG, PNG, WebP o PDF</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-gray-900/50 border border-white/10 rounded-xl p-4">
        <button onClick={prevMonth} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 active:scale-95 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{monthNames[month - 1]} {year}</p>
          <p className="text-xs text-gray-500">{entries.length} entradas</p>
        </div>
        <button onClick={nextMonth} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 active:scale-95 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Entries List */}
      {!loading && entries.length === 0 && (
        <div className="bg-gray-900/50 border border-white/10 rounded-xl p-8 md:p-12 text-center">
          <p className="text-gray-400">No hay entradas para este mes</p>
          <p className="text-sm text-gray-600 mt-1">Sube un roster para comenzar</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-gray-900/50 border border-white/10 rounded-xl p-4 hover:border-amber-500/20 transition-all">
              {/* Entry Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">
                    {new Date(entry.entry_date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${activityColors[entry.activity_type] || activityColors.other}`}>
                    {activityLabels[entry.activity_type] || entry.activity_type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {entry.check_in && <span>C/I: {entry.check_in}</span>}
                  {entry.check_out && <span>C/O: {entry.check_out}</span>}
                </div>
              </div>

              {/* Flights */}
              {entry.flights && entry.flights.length > 0 && (
                <div className="space-y-2">
                  {entry.flights.map((flight, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                      <div className="text-xs font-mono font-bold text-amber-400 w-16 shrink-0">
                        {flight.flight_number || '-'}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-bold text-white">{flight.origin}</span>
                        <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="text-sm font-bold text-white">{flight.destination}</span>
                      </div>
                      <div className="text-xs text-gray-500 shrink-0 hidden sm:block">
                        {flight.std && <span>{flight.std}</span>}
                        {flight.std && flight.sta && <span> - </span>}
                        {flight.sta && <span>{flight.sta}</span>}
                      </div>
                      {flight.block_hours && (
                        <span className="text-xs font-medium text-purple-400 shrink-0">
                          {flight.block_hours}h
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Crew */}
              {(entry.crew_captain || entry.crew_first_officer || entry.crew_purser) && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  {entry.crew_captain && <span>CP: {entry.crew_captain}</span>}
                  {entry.crew_first_officer && <span>FO: {entry.crew_first_officer}</span>}
                  {entry.crew_purser && <span>PU: {entry.crew_purser}</span>}
                </div>
              )}

              {/* Notes */}
              {entry.notes && (
                <p className="mt-2 text-xs text-gray-500 italic">{entry.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent Uploads */}
      {uploads.length > 0 && (
        <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Uploads Recientes</h3>
          <div className="space-y-2">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-300 truncate max-w-[200px]">{upload.file_name}</span>
                <span className={`px-2 py-0.5 rounded ${
                  upload.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  upload.status === 'processing' ? 'bg-amber-500/20 text-amber-400' :
                  upload.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {upload.status === 'completed' ? 'Completado' :
                   upload.status === 'processing' ? 'Procesando' :
                   upload.status === 'failed' ? 'Error' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
