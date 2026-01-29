'use client'

import { POSITION_OPTIONS, type PositionType } from '@/types/database'

interface PositionSelectorProps {
  selected: PositionType | null
  onSelect: (position: PositionType) => void
}

export function PositionSelector({ selected, onSelect }: PositionSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Tu posicion</h2>
        <p className="mt-1 text-gray-400">Selecciona tu rol en la tripulacion</p>
      </div>

      <div className="space-y-3">
        {POSITION_OPTIONS.map((pos) => (
          <button
            key={pos.value}
            type="button"
            onClick={() => onSelect(pos.value)}
            className={`w-full rounded-xl border p-4 text-left transition-all ${
              selected === pos.value
                ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold text-white">{pos.label}</p>
            <p className="text-sm text-gray-400">{pos.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
