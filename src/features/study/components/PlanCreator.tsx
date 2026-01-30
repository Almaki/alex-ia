'use client'

import { useState, useEffect } from 'react'
import type { CreatePlanForm } from '../types'
import { PLAN_TYPE_OPTIONS, STUDY_CATEGORIES, SYSTEM_SUBCATEGORIES } from '../types'
import { FLEET_OPTIONS as BASE_FLEET_OPTIONS } from '@/types/database'

interface PlanCreatorProps {
  onSubmit: (form: CreatePlanForm) => Promise<void>
  onCancel: () => void
  saving: boolean
  userFleet: string | null
  isAdmin: boolean
}

const FLEET_OPTIONS = [
  { value: '', label: 'Sin especificar' },
  ...BASE_FLEET_OPTIONS.map(o => ({ value: o.value, label: o.label })),
]

const PLAN_TYPE_ICONS: Record<string, React.ReactNode> = {
  sim: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  ),
  line: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  prof: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
  type: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1 3.04a.75.75 0 01-1.07-.83l1.35-5.65L1.72 7.3a.75.75 0 01.46-1.28l5.73-.5L10.34.88a.75.75 0 011.32 0l2.43 4.64 5.73.5a.75.75 0 01.46 1.28l-4.38 4.43 1.35 5.65a.75.75 0 01-1.07.83l-5.1-3.04z" />
    </svg>
  ),
  recur: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  ),
}

export function PlanCreator({ onSubmit, onCancel, saving, userFleet, isAdmin }: PlanCreatorProps) {
  const [formData, setFormData] = useState<CreatePlanForm>({
    title: '',
    description: '',
    targetDate: '',
    aircraftType: null,
    planType: '',
    selectedCategories: [],
    selectedSubsystems: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<1 | 2>(1)

  // Auto-set aircraft for non-admin users
  useEffect(() => {
    if (!isAdmin && userFleet) {
      setFormData(prev => ({ ...prev, aircraftType: userFleet }))
    }
  }, [isAdmin, userFleet])

  // Auto-suggest categories when plan type changes
  useEffect(() => {
    if (!formData.planType) return
    const planOption = PLAN_TYPE_OPTIONS.find(p => p.value === formData.planType)
    if (planOption && formData.selectedCategories.length === 0) {
      setFormData(prev => ({
        ...prev,
        selectedCategories: [...planOption.recommendedCategories],
      }))
    }
  }, [formData.planType]) // eslint-disable-line react-hooks/exhaustive-deps

  const validateStep1 = (): boolean => {
    if (!formData.planType) {
      setErrors({ planType: 'Selecciona un tipo de preparacion' })
      return false
    }
    setErrors({})
    return true
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'El titulo es requerido'
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'La fecha objetivo es requerida'
    } else {
      const targetDate = new Date(formData.targetDate)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      if (targetDate < tomorrow) {
        newErrors.targetDate = 'La fecha debe ser al menos manana'
      }
    }

    if (formData.selectedCategories.length === 0) {
      newErrors.categories = 'Selecciona al menos una categoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      if (!formData.title) {
        const planLabel = PLAN_TYPE_OPTIONS.find(p => p.value === formData.planType)?.label || ''
        const aircraft = formData.aircraftType || ''
        setFormData(prev => ({
          ...prev,
          title: `${planLabel}${aircraft ? ` ${aircraft}` : ''}`,
        }))
      }
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    await onSubmit(formData)
  }

  const handleCategoryToggle = (categoryValue: string) => {
    setFormData((prev) => {
      if (categoryValue === 'systems' && prev.selectedCategories.includes('systems')) {
        return {
          ...prev,
          selectedCategories: prev.selectedCategories.filter((cat) => cat !== categoryValue),
          selectedSubsystems: [],
        }
      }
      return {
        ...prev,
        selectedCategories: prev.selectedCategories.includes(categoryValue)
          ? prev.selectedCategories.filter((cat) => cat !== categoryValue)
          : [...prev.selectedCategories, categoryValue],
      }
    })
    if (errors.categories) {
      setErrors((prev) => ({ ...prev, categories: '' }))
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const selectedPlanType = PLAN_TYPE_OPTIONS.find(p => p.value === formData.planType)

  // Step 1: Select preparation type
  if (step === 1) {
    return (
      <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
            Que vas a preparar?
          </h2>
          <p className="text-sm md:text-base text-gray-400">Selecciona el tipo de preparacion y AlexIA personalizara tu plan de estudio</p>
        </div>

        <div className="space-y-3 mb-6">
          {PLAN_TYPE_OPTIONS.map((option) => {
            const isSelected = formData.planType === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, planType: option.value, selectedCategories: [] }))}
                disabled={saving}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all duration-200 text-left active:scale-[0.98]
                  ${isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'
                  }`}>
                    {PLAN_TYPE_ICONS[option.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-base font-semibold mb-1 ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                      {option.label}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {errors.planType && <p className="mb-4 text-sm text-red-400 text-center">{errors.planType}</p>}

        {/* Aircraft selection - admin gets dropdown, users see their assigned fleet */}
        {isAdmin ? (
          <div className="mb-6">
            <label htmlFor="aircraft" className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Aeronave (opcional)
            </label>
            <select
              id="aircraft"
              value={formData.aircraftType || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, aircraftType: e.target.value || null }))}
              disabled={saving}
              className="w-full min-h-[44px] px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            >
              {FLEET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : userFleet ? (
          <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            <div>
              <p className="text-xs text-gray-400">Aeronave asignada</p>
              <p className="text-sm text-white font-medium">{userFleet}</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleNext}
            disabled={!formData.planType || saving}
            className="flex-1 min-h-[52px] py-3 md:py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-base md:text-lg font-semibold rounded-xl hover:from-emerald-600 hover:to-green-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continuar
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="min-h-[48px] px-6 py-3 md:py-4 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Configure details
  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm">
      <div className="mb-6 md:mb-8">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Cambiar tipo
        </button>

        {selectedPlanType && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              {PLAN_TYPE_ICONS[selectedPlanType.icon]}
            </div>
            <div>
              <div className="text-sm font-semibold text-emerald-400">{selectedPlanType.label}</div>
              {formData.aircraftType && (
                <span className="text-xs text-gray-400">{formData.aircraftType}</span>
              )}
            </div>
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Configura tu plan
        </h2>
        <p className="text-sm text-gray-400 mt-1">Las categorias recomendadas ya estan seleccionadas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Titulo del Plan *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full min-h-[44px] px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            placeholder="ej: Preparacion Simulator A320"
            disabled={saving}
          />
          {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="targetDate" className="block text-sm font-medium text-gray-300 mb-2">
            Fecha Objetivo *
          </label>
          <input
            id="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, targetDate: e.target.value }))}
            min={minDate}
            disabled={saving}
            className="w-full min-h-[44px] px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
          {errors.targetDate && <p className="mt-1 text-sm text-red-400">{errors.targetDate}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-300">
              Areas de Estudio *
            </label>
            {selectedPlanType && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, selectedCategories: [...selectedPlanType.recommendedCategories] }))}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Restaurar recomendadas
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STUDY_CATEGORIES.map((category) => {
              const isSelected = formData.selectedCategories.includes(category.value)
              const isRecommended = selectedPlanType?.recommendedCategories.includes(category.value)
              return (
                <label
                  key={category.value}
                  className={`
                    flex items-center gap-3 min-h-[44px] p-3 rounded-xl border cursor-pointer transition-all active:scale-95
                    ${isSelected
                      ? `border-emerald-500/50 ${category.bg}`
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }
                    ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category.value)}
                    disabled={saving}
                    className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500/50 flex-shrink-0"
                  />
                  <span className={`text-sm ${isSelected ? category.color : 'text-gray-300'}`}>
                    {category.label}
                  </span>
                  {isRecommended && !isSelected && (
                    <span className="ml-auto text-[10px] text-emerald-500/60 font-medium">REC</span>
                  )}
                </label>
              )
            })}
          </div>
          {errors.categories && <p className="mt-2 text-sm text-red-400">{errors.categories}</p>}

          {formData.selectedCategories.includes('systems') && (
            <div className="mt-3 p-3 md:p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <label className="block text-sm font-medium text-blue-300 mb-3">
                Sistemas especificos (opcional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SYSTEM_SUBCATEGORIES.map((sub) => {
                  const isSelected = formData.selectedSubsystems.includes(sub.value)
                  return (
                    <label
                      key={sub.value}
                      className={`
                        flex items-center gap-2 min-h-[40px] p-2 rounded-lg border cursor-pointer transition-all active:scale-95
                        ${isSelected
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }
                        ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            selectedSubsystems: prev.selectedSubsystems.includes(sub.value)
                              ? prev.selectedSubsystems.filter((s) => s !== sub.value)
                              : [...prev.selectedSubsystems, sub.value],
                          }))
                        }}
                        disabled={saving}
                        className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500/50 flex-shrink-0"
                      />
                      <span className={`text-xs ${isSelected ? 'text-blue-300' : 'text-gray-400'}`}>
                        {sub.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            disabled={saving}
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
            placeholder="Areas de enfoque, objetivos especificos..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 min-h-[52px] py-3 md:py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-base md:text-lg font-bold rounded-xl hover:from-emerald-600 hover:to-green-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Iniciar Plan de Estudio
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="min-h-[48px] px-6 py-3 md:py-4 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
