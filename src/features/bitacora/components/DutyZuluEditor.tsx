'use client'

import { useState, useMemo } from 'react'
import { formatHHMM, getAirportUtcOffset, localToZulu, DEFAULT_MEXICO_UTC_OFFSET } from '../utils/date-helpers'

interface DutyZuluEditorProps {
  entryId: string
  checkIn: string | null
  checkOut: string | null
  dutyStartZulu: string | null
  dutyEndZulu: string | null
  /** First flight origin IATA — C/I is in this airport's local time */
  originIATA: string | null
  /** Last flight destination IATA — C/O is in this airport's local time */
  destinationIATA: string | null
  onSave: (entryId: string, updates: { duty_start_zulu: string | null; duty_end_zulu: string | null }) => Promise<boolean>
}

export function DutyZuluEditor({
  entryId,
  checkIn,
  checkOut,
  dutyStartZulu,
  dutyEndZulu,
  originIATA,
  destinationIATA,
  onSave,
}: DutyZuluEditorProps) {
  // Auto-compute Zulu from local times + each airport's UTC offset
  // C/I local → Zulu using ORIGIN offset (fallback to Mexico Centro UTC-6)
  // C/O local → Zulu using DESTINATION offset (fallback to origin or default)
  const autoZulu = useMemo(() => {
    const originOffset = originIATA ? getAirportUtcOffset(originIATA) : DEFAULT_MEXICO_UTC_OFFSET
    const destOffset = destinationIATA ? getAirportUtcOffset(destinationIATA) : originOffset
    return {
      start: localToZulu(checkIn, originOffset),
      end: localToZulu(checkOut, destOffset),
    }
  }, [checkIn, checkOut, originIATA, destinationIATA])

  // Use saved values if available, otherwise auto-computed
  const effectiveStart = dutyStartZulu ? formatHHMM(dutyStartZulu) : (autoZulu.start ?? '--:--')
  const effectiveEnd = dutyEndZulu ? formatHHMM(dutyEndZulu) : (autoZulu.end ?? '--:--')
  const isAuto = !dutyStartZulu && !dutyEndZulu && (autoZulu.start || autoZulu.end)

  const [editing, setEditing] = useState(false)
  const [startZ, setStartZ] = useState(effectiveStart)
  const [endZ, setEndZ] = useState(effectiveEnd)
  const [saving, setSaving] = useState(false)

  const hasValues = effectiveStart !== '--:--' || effectiveEnd !== '--:--'

  const handleEdit = () => {
    // Pre-fill with effective values (saved or auto-computed)
    setStartZ(effectiveStart)
    setEndZ(effectiveEnd)
    setEditing(true)
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    const startVal = startZ && startZ !== '--:--' ? startZ : null
    const endVal = endZ && endZ !== '--:--' ? endZ : null
    const ok = await onSave(entryId, { duty_start_zulu: startVal, duty_end_zulu: endVal })
    setSaving(false)
    if (ok) setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={handleEdit}
        className="flex items-center gap-1.5 text-[11px] group"
      >
        {/* Green pencil icon */}
        <svg className="w-3 h-3 text-emerald-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        {hasValues ? (
          <>
            <span className={`font-mono ${isAuto ? 'text-emerald-400/50' : 'text-emerald-400'}`}>
              {effectiveStart}Z
            </span>
            <span className="text-gray-600">-</span>
            <span className={`font-mono ${isAuto ? 'text-emerald-400/50' : 'text-emerald-400'}`}>
              {effectiveEnd}Z
            </span>
            {isAuto && (
              <span className="text-gray-600 text-[9px] italic ml-0.5">auto</span>
            )}
          </>
        ) : (
          <span className="text-gray-600 italic group-hover:text-emerald-500/70 transition-colors">
            Zulu
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-emerald-500 font-sans font-medium">Z</span>
      <input
        type="time"
        value={startZ !== '--:--' ? startZ : ''}
        onChange={(e) => setStartZ(e.target.value || '--:--')}
        className="w-[80px] bg-gray-800/80 border border-emerald-500/30 rounded px-1.5 py-0.5 text-emerald-400 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
      />
      <span className="text-gray-600">-</span>
      <input
        type="time"
        value={endZ !== '--:--' ? endZ : ''}
        onChange={(e) => setEndZ(e.target.value || '--:--')}
        className="w-[80px] bg-gray-800/80 border border-emerald-500/30 rounded px-1.5 py-0.5 text-emerald-400 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-medium hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
      >
        {saving ? '...' : 'OK'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="px-1.5 py-0.5 text-gray-500 hover:text-gray-300 text-[10px] transition-colors"
      >
        X
      </button>
    </div>
  )
}
