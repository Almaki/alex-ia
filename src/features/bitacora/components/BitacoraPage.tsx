'use client'

import { useState, useRef, useCallback } from 'react'
import { useLogbook } from '../hooks/useLogbook'
import { YearlyComparisonChart } from './YearlyComparisonChart'
import { FlightDetailEditor } from './FlightDetailEditor'
import { DutyZuluEditor } from './DutyZuluEditor'
import { calculateDuration, formatDecimalHours, formatHHMM, formatZulu, isOvernightDuty } from '../utils/date-helpers'

export function BitacoraPage() {
  const { entries, uploads, stats, loading, uploading, error, month, year, setMonth, setYear, uploadRoster, saveFlight, saveEntry, yearlyCurrentData, yearlyPreviousData, yearlyLoading } = useLogbook()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null)

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

  const toggleFlight = useCallback((flightId: string) => {
    setExpandedFlightId((prev) => (prev === flightId ? null : flightId))
  }, [])

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

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

  // Find today's entry
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayEntry = entries.find((e) => e.entry_date === todayStr)
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear()

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
        className={`border-2 border-dashed rounded-2xl p-6 md:p-10 text-center cursor-pointer transition-all ${
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
          <div className="space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-white font-medium">Sube tu roster</p>
            <p className="text-sm text-gray-400">Arrastra una foto o PDF, o haz clic para seleccionar</p>
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

      {/* TODAY'S CARD - Highlighted */}
      {isCurrentMonth && todayEntry && (
        <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/40 rounded-2xl p-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-amber-400">{today.getDate()}</span>
            </div>
            <div>
              <span className="text-sm font-bold text-amber-300">Hoy - {dayNames[today.getDay()]}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-medium border ${activityColors[todayEntry.activity_type] || activityColors.other}`}>
                {activityLabels[todayEntry.activity_type] || todayEntry.activity_type}
              </span>
            </div>
          </div>

          {/* C/I and C/O (Local) + Jornada Programada */}
          <div className="flex items-center gap-4 mb-1 text-xs">
            {todayEntry.check_in && (
              <span className="text-gray-300 font-mono">
                <span className="text-gray-500 font-sans">C/I</span> {formatHHMM(todayEntry.check_in)}
                <span className="text-gray-600 text-[10px] ml-0.5">L</span>
              </span>
            )}
            {todayEntry.check_out ? (
              <span className="text-gray-300 font-mono">
                <span className="text-gray-500 font-sans">C/O</span> {formatHHMM(todayEntry.check_out)}
                <span className="text-gray-600 text-[10px] ml-0.5">L</span>
                {isOvernightDuty(todayEntry.check_in, todayEntry.check_out) && (
                  <span className="ml-1 text-amber-400/70 text-[10px] font-sans">+1d</span>
                )}
              </span>
            ) : todayEntry.check_in ? (
              <span className="text-amber-400/70 italic">
                <span className="text-gray-500">C/O</span> pendiente
              </span>
            ) : null}
            {todayEntry.check_in && todayEntry.check_out && (
              <span className="text-blue-400 font-mono text-[11px]">
                {formatDecimalHours(calculateDuration(formatHHMM(todayEntry.check_in), formatHHMM(todayEntry.check_out)))}h
                <span className="text-blue-400/50 font-sans text-[10px] ml-0.5">prog</span>
              </span>
            )}
          </div>

          {/* Zulu Duty Times (editable) - below local times */}
          {(todayEntry.check_in || todayEntry.duty_start_zulu) && (
            <div className="mb-3">
              <DutyZuluEditor
                entryId={todayEntry.id}
                checkIn={todayEntry.check_in}
                checkOut={todayEntry.check_out}
                dutyStartZulu={todayEntry.duty_start_zulu}
                dutyEndZulu={todayEntry.duty_end_zulu}
                originIATA={todayEntry.flights?.[0]?.origin || null}
                onSave={saveEntry}
              />
            </div>
          )}

          {/* Today's flights */}
          {todayEntry.flights && todayEntry.flights.length > 0 && (
            <div className="space-y-2">
              {todayEntry.flights.map((flight) => {
                const isExpanded = expandedFlightId === flight.id

                return (
                  <div key={flight.id}>
                    <button
                      onClick={() => toggleFlight(flight.id)}
                      className={`w-full bg-black/20 rounded-lg p-3 text-left transition-all ${
                        isExpanded ? 'ring-1 ring-amber-500/30' : 'hover:bg-black/30'
                      }`}
                    >
                      {/* Line 1: flight number + route + chevron */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                          {flight.flight_number || '-'}
                        </span>
                        <span className="text-sm font-bold text-white">{flight.origin}</span>
                        <svg className="w-3.5 h-3.5 text-amber-500/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="text-sm font-bold text-white">{flight.destination}</span>
                        <svg className={`w-4 h-4 text-gray-500 ml-auto shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {/* Line 2: Zulu times + block hours */}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                        <span className="font-mono text-gray-500">
                          {formatZulu(flight.std)}{flight.std && flight.sta && ' - '}{formatZulu(flight.sta)}
                        </span>
                        <span className="text-xs font-medium text-purple-400 ml-auto">
                          {flight.block_hours != null ? formatDecimalHours(flight.block_hours) : '--:--'}
                        </span>
                      </div>
                    </button>
                    {isExpanded && (
                      <FlightDetailEditor
                        flight={flight}
                        onSave={saveFlight}
                        onClose={() => setExpandedFlightId(null)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Crew */}
          {(todayEntry.crew_captain || todayEntry.crew_first_officer) && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
              {todayEntry.crew_captain && <span>CP: {todayEntry.crew_captain}</span>}
              {todayEntry.crew_first_officer && <span>FO: {todayEntry.crew_first_officer}</span>}
              {todayEntry.crew_purser && <span>PU: {todayEntry.crew_purser}</span>}
            </div>
          )}
        </div>
      )}

      {/* Today card when no entry */}
      {isCurrentMonth && !todayEntry && !loading && (
        <div className="bg-gray-900/30 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            Hoy {dayNames[today.getDay()]} {today.getDate()} - Sin actividad registrada
          </p>
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
          {entries.map((entry) => {
            const isToday = entry.entry_date === todayStr
            const entryDate = new Date(entry.entry_date + 'T12:00:00')

            return (
              <div
                key={entry.id}
                className={`bg-gray-900/50 border rounded-xl p-4 transition-all ${
                  isToday
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-white/10 hover:border-amber-500/20'
                }`}
              >
                {/* Entry Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center w-10">
                      <span className="text-lg font-bold text-white leading-none">{entryDate.getDate()}</span>
                      <span className="text-[10px] text-gray-500 uppercase">{entryDate.toLocaleDateString('es-MX', { weekday: 'short' })}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${activityColors[entry.activity_type] || activityColors.other}`}>
                      {activityLabels[entry.activity_type] || entry.activity_type}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                        HOY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {entry.check_in && (
                      <span className="font-mono">C/I {formatHHMM(entry.check_in)}<span className="text-[10px] ml-0.5">L</span></span>
                    )}
                    {entry.check_out ? (
                      <span className="font-mono">
                        C/O {formatHHMM(entry.check_out)}<span className="text-[10px] ml-0.5">L</span>
                        {isOvernightDuty(entry.check_in, entry.check_out) && (
                          <span className="ml-1 text-amber-400/70 text-[10px] font-sans">+1d</span>
                        )}
                      </span>
                    ) : entry.check_in ? (
                      <span className="text-amber-400/50 italic">C/O --:--</span>
                    ) : null}
                    {entry.check_in && entry.check_out && (
                      <span className="font-mono text-blue-400 text-[11px]">
                        {formatDecimalHours(calculateDuration(formatHHMM(entry.check_in), formatHHMM(entry.check_out)))}h
                      </span>
                    )}
                  </div>
                </div>

                {/* Zulu Duty Times (editable) - below */}
                {(entry.check_in || entry.duty_start_zulu) && (
                  <div className="mb-2 ml-[52px]">
                    <DutyZuluEditor
                      entryId={entry.id}
                      checkIn={entry.check_in}
                      checkOut={entry.check_out}
                      dutyStartZulu={entry.duty_start_zulu}
                      dutyEndZulu={entry.duty_end_zulu}
                      originIATA={entry.flights?.[0]?.origin || null}
                      onSave={saveEntry}
                    />
                  </div>
                )}

                {/* Flights */}
                {entry.flights && entry.flights.length > 0 && (
                  <div className="space-y-2">
                    {entry.flights.map((flight) => {
                      const isExpanded = expandedFlightId === flight.id

                      return (
                        <div key={flight.id}>
                          <button
                            onClick={() => toggleFlight(flight.id)}
                            className={`w-full bg-white/5 rounded-lg p-3 text-left transition-all ${
                              isExpanded ? 'ring-1 ring-amber-500/30' : 'hover:bg-white/10'
                            }`}
                          >
                            {/* Line 1: flight number + route + chevron */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                                {flight.flight_number || '-'}
                              </span>
                              <span className="text-sm font-bold text-white">{flight.origin}</span>
                              <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                              <span className="text-sm font-bold text-white">{flight.destination}</span>
                              {flight.aircraft_registration && (
                                <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
                                  {flight.aircraft_registration}
                                </span>
                              )}
                              <svg className={`w-4 h-4 text-gray-500 ml-auto shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            {/* Line 2: Zulu times + block hours */}
                            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                              <span className="font-mono text-gray-500">
                                {formatZulu(flight.std)}{flight.std && flight.sta && ' - '}{formatZulu(flight.sta)}
                              </span>
                              <span className="text-xs font-medium text-purple-400 ml-auto">
                                {flight.block_hours != null ? formatDecimalHours(flight.block_hours) : '--:--'}
                              </span>
                            </div>
                          </button>
                          {isExpanded && (
                            <FlightDetailEditor
                              flight={flight}
                              onSave={saveFlight}
                              onClose={() => setExpandedFlightId(null)}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Hotel */}
                {entry.hotel && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="text-gray-600">HTL:</span> {entry.hotel}
                  </div>
                )}

                {/* Crew */}
                {(entry.crew_captain || entry.crew_first_officer || entry.crew_purser) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
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
            )
          })}
        </div>
      )}

      {/* MONTHLY SUMMARY CARD - Dual Stats */}
      {stats && !loading && (
        <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 md:p-6">
          <h3 className="text-sm font-semibold text-white mb-2">
            Resumen {monthNames[month - 1]} {year}
          </h3>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-gray-500">Roster</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-gray-500">Real</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-gray-500">Proyeccion</span>
            </span>
          </div>

          <div className="space-y-3">
            {/* Flights count */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Vuelos</p>
                <p className="text-xl font-bold text-blue-400">{stats.totalFlights}</p>
              </div>
            </div>

            {/* Flight Hours: Roster vs Actual vs Projection */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-2">Horas de Vuelo</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{formatDecimalHours(stats.rosterFlightHours)}</p>
                  <p className="text-[10px] text-blue-400/60">Roster</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{formatDecimalHours(stats.actualFlightHours)}</p>
                  <p className="text-[10px] text-emerald-400/60">Real</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-400">{formatDecimalHours(stats.projectedFlightHours)}</p>
                  <p className="text-[10px] text-amber-400/60">Proyeccion</p>
                </div>
              </div>
              {/* Progress bar */}
              {stats.rosterFlightHours > 0 && (
                <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats.actualFlightHours / stats.rosterFlightHours) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Block Hours: Roster vs Actual */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-2">Horas Block</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{formatDecimalHours(stats.rosterBlockHours)}</p>
                  <p className="text-[10px] text-blue-400/60">Roster</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{formatDecimalHours(stats.actualBlockHours)}</p>
                  <p className="text-[10px] text-emerald-400/60">Real</p>
                </div>
              </div>
            </div>

            {/* Duty Hours: Roster vs Actual vs Projection */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-2">Horas de Jornada</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{formatDecimalHours(stats.rosterDutyHours)}</p>
                  <p className="text-[10px] text-blue-400/60">Roster</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{formatDecimalHours(stats.actualDutyHours)}</p>
                  <p className="text-[10px] text-emerald-400/60">Real</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-400">{formatDecimalHours(stats.projectedDutyHours)}</p>
                  <p className="text-[10px] text-amber-400/60">Proyeccion</p>
                </div>
              </div>
              {stats.rosterDutyHours > 0 && (
                <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats.actualDutyHours / stats.rosterDutyHours) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Night + PF row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-indigo-400">{stats.nightFlights}</p>
                <p className="text-[10px] text-gray-400">Nocturnos</p>
              </div>
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-pink-400">{stats.pfFlights}</p>
                <p className="text-[10px] text-gray-400">PF</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yearly Comparison Chart */}
      <YearlyComparisonChart
        currentYearData={yearlyCurrentData}
        previousYearData={yearlyPreviousData}
        currentYear={year}
        loading={yearlyLoading}
      />

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
