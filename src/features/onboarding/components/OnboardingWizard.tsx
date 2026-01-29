'use client'

import { useState } from 'react'
import { NameStep } from './NameStep'
import { FleetSelector } from './FleetSelector'
import { PositionSelector } from './PositionSelector'
import { TermsStep } from './TermsStep'
import { completeOnboarding } from '../services/onboarding-actions'
import type { FleetType, PositionType } from '@/types/database'

const TOTAL_STEPS = 4

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [fleet, setFleet] = useState<FleetType | null>(null)
  const [position, setPosition] = useState<PositionType | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function canAdvance(): boolean {
    switch (step) {
      case 1: return fullName.trim().length >= 2
      case 2: return fleet !== null
      case 3: return position !== null
      case 4: return termsAccepted
      default: return false
    }
  }

  async function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }

    if (!fleet || !position) return

    setLoading(true)
    setError(null)

    const result = await completeOnboarding({
      full_name: fullName.trim(),
      fleet,
      position,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      {/* Progress bar */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < step ? 'bg-purple-500' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        {step === 1 && <NameStep value={fullName} onChange={setFullName} />}
        {step === 2 && <FleetSelector selected={fleet} onSelect={setFleet} />}
        {step === 3 && <PositionSelector selected={position} onSelect={setPosition} />}
        {step === 4 && <TermsStep accepted={termsAccepted} onToggle={setTermsAccepted} />}

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
            >
              Atras
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance() || loading}
            className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 transition-colors"
          >
            {loading
              ? 'Configurando...'
              : step === TOTAL_STEPS
                ? 'Comenzar'
                : 'Siguiente'}
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <p className="text-center text-xs text-gray-500">
        Paso {step} de {TOTAL_STEPS}
      </p>
    </div>
  )
}
