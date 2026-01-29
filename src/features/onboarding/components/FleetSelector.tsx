'use client'

import { FLEET_OPTIONS, type FleetType } from '@/types/database'

interface FleetSelectorProps {
  selected: FleetType | null
  onSelect: (fleet: FleetType) => void
}

export function FleetSelector({ selected, onSelect }: FleetSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Selecciona tu flota</h2>
        <p className="mt-1 text-gray-400">Elige el tipo de aeronave con la que operas</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FLEET_OPTIONS.map((fleet) => (
          <button
            key={fleet.value}
            type="button"
            onClick={() => onSelect(fleet.value)}
            className={`rounded-xl border p-4 text-left transition-all ${
              selected === fleet.value
                ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold text-white">{fleet.label}</p>
            <p className="text-sm text-gray-400">{fleet.manufacturer}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
