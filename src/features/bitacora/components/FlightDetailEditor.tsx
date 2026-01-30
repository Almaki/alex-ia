'use client'

import { useState } from 'react'

type FlightUpdates = Partial<{
  aircraft_type: string | null
  aircraft_registration: string | null
  block_hours: number | null
  flight_hours: number | null
  is_pf: boolean
  is_night: boolean
  is_cat_ii_iii: boolean
  approach_type: string | null
  remarks: string | null
}>

interface FlightDetailEditorProps {
  flight: {
    id: string
    flight_number: string | null
    aircraft_type: string | null
    aircraft_registration: string | null
    origin: string
    destination: string
    std: string | null
    sta: string | null
    block_hours: number | null
    flight_hours: number | null
    is_pf: boolean
    is_night: boolean
    is_cat_ii_iii: boolean
    approach_type: string | null
    remarks: string | null
  }
  onSave: (flightId: string, updates: FlightUpdates) => Promise<boolean>
  onClose: () => void
}

const APPROACH_TYPES = ['ILS', 'RNAV', 'VOR', 'NDB', 'Visual', 'CAT II', 'CAT III'] as const

export function FlightDetailEditor({ flight, onSave, onClose }: FlightDetailEditorProps) {
  // Local state for form fields
  const [aircraftType, setAircraftType] = useState(flight.aircraft_type || '')
  const [aircraftReg, setAircraftReg] = useState(flight.aircraft_registration || '')
  const [blockHours, setBlockHours] = useState(flight.block_hours?.toString() || '')
  const [flightHours, setFlightHours] = useState(flight.flight_hours?.toString() || '')
  const [isPf, setIsPf] = useState(flight.is_pf)
  const [isNight, setIsNight] = useState(flight.is_night)
  const [isCatIIIII, setIsCatIIIII] = useState(flight.is_cat_ii_iii)
  const [approachType, setApproachType] = useState(flight.approach_type || '')
  const [remarks, setRemarks] = useState(flight.remarks || '')
  const [saving, setSaving] = useState(false)

  // Check if there are changes
  const hasChanges =
    aircraftType !== (flight.aircraft_type || '') ||
    aircraftReg !== (flight.aircraft_registration || '') ||
    blockHours !== (flight.block_hours?.toString() || '') ||
    flightHours !== (flight.flight_hours?.toString() || '') ||
    isPf !== flight.is_pf ||
    isNight !== flight.is_night ||
    isCatIIIII !== flight.is_cat_ii_iii ||
    approachType !== (flight.approach_type || '') ||
    remarks !== (flight.remarks || '')

  const handleSave = async () => {
    if (saving || !hasChanges) return

    const updates: FlightUpdates = {}

    if (aircraftType !== (flight.aircraft_type || '')) updates.aircraft_type = aircraftType || null
    if (aircraftReg !== (flight.aircraft_registration || '')) updates.aircraft_registration = aircraftReg || null
    if (blockHours !== (flight.block_hours?.toString() || '')) updates.block_hours = blockHours ? parseFloat(blockHours) : null
    if (flightHours !== (flight.flight_hours?.toString() || '')) updates.flight_hours = flightHours ? parseFloat(flightHours) : null
    if (isPf !== flight.is_pf) updates.is_pf = isPf
    if (isNight !== flight.is_night) updates.is_night = isNight
    if (isCatIIIII !== flight.is_cat_ii_iii) updates.is_cat_ii_iii = isCatIIIII
    if (approachType !== (flight.approach_type || '')) updates.approach_type = approachType || null
    if (remarks !== (flight.remarks || '')) updates.remarks = remarks || null

    setSaving(true)
    const success = await onSave(flight.id, updates)
    setSaving(false)

    if (success) {
      onClose()
    }
  }

  return (
    <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-4">
      {/* Aeronave Section */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">
          Aeronave
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={aircraftType}
            onChange={(e) => setAircraftType(e.target.value)}
            placeholder="Ej: A320"
            className="bg-gray-800/50 border border-white/10 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <input
            type="text"
            value={aircraftReg}
            onChange={(e) => setAircraftReg(e.target.value)}
            placeholder="Ej: XA-VLY"
            className="bg-gray-800/50 border border-white/10 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      {/* Horas Section */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">
          Horas
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              step="0.01"
              value={blockHours}
              onChange={(e) => setBlockHours(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <span className="text-[10px] text-gray-500 ml-1">Block</span>
          </div>
          <div>
            <input
              type="number"
              step="0.01"
              value={flightHours}
              onChange={(e) => setFlightHours(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <span className="text-[10px] text-gray-500 ml-1">Flight</span>
          </div>
        </div>
      </div>

      {/* Rol y Condiciones Section */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">
          Rol y Condiciones
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsPf(!isPf)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              isPf
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
          >
            PF
          </button>
          <button
            type="button"
            onClick={() => setIsNight(!isNight)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              isNight
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
          >
            Nocturno
          </button>
          <button
            type="button"
            onClick={() => setIsCatIIIII(!isCatIIIII)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              isCatIIIII
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
          >
            CAT II/III
          </button>
        </div>
      </div>

      {/* Tipo de Aproximación Section */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">
          Tipo de Aproximación
        </label>
        <div className="flex flex-wrap gap-2">
          {APPROACH_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setApproachType(approachType === type ? '' : type)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                approachType === type
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Notas Section */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">
          Notas
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Observaciones..."
          rows={2}
          className="w-full bg-gray-800/50 border border-white/10 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg text-sm hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
