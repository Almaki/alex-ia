'use client'

import { useState } from 'react'
import type { CreatePlanForm } from '../types'
import { PLAN_TYPE_OPTIONS, STUDY_CATEGORIES } from '../types'

interface PlanCreatorProps {
  onSubmit: (form: CreatePlanForm) => Promise<void>
  onCancel: () => void
  saving: boolean
}

const FLEET_OPTIONS = [
  { value: '', label: 'Sin especificar' },
  { value: 'A320', label: 'Airbus A320' },
  { value: 'B737', label: 'Boeing 737' },
  { value: 'E190', label: 'Embraer 190' },
  { value: 'ATR72', label: 'ATR 72' },
  { value: 'A350', label: 'Airbus A350' },
  { value: 'B787', label: 'Boeing 787' },
  { value: 'CRJ', label: 'Bombardier CRJ' },
  { value: 'ERJ', label: 'Embraer ERJ' },
]

export function PlanCreator({ onSubmit, onCancel, saving }: PlanCreatorProps) {
  const [formData, setFormData] = useState<CreatePlanForm>({
    title: '',
    description: '',
    targetDate: '',
    aircraftType: null,
    planType: 'simulator_prep',
    selectedCategories: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSubmit(formData)
  }

  const handleCategoryToggle = (categoryValue: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryValue)
        ? prev.selectedCategories.filter((cat) => cat !== categoryValue)
        : [...prev.selectedCategories, categoryValue],
    }))
    // Clear category error when user makes a selection
    if (errors.categories) {
      setErrors((prev) => ({ ...prev, categories: '' }))
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
          Crear Plan de Estudio
        </h2>
        <p className="text-gray-400">Personaliza tu plan de preparacion</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Titulo del Plan *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            placeholder="ej: Preparacion Simulator A320"
            disabled={saving}
          />
          {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
        </div>

        {/* Plan Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Tipo de Plan *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PLAN_TYPE_OPTIONS.map((option) => {
              const isSelected = formData.planType === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, planType: option.value }))}
                  disabled={saving}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${isSelected
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/50'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }
                  `}
                >
                  <div className={`font-medium ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                    {option.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Aircraft Type */}
        <div>
          <label htmlFor="aircraft" className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Aeronave
          </label>
          <select
            id="aircraft"
            value={formData.aircraftType || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, aircraftType: e.target.value || null }))}
            disabled={saving}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          >
            {FLEET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Target Date */}
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
          {errors.targetDate && <p className="mt-1 text-sm text-red-400">{errors.targetDate}</p>}
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Categorias de Estudio * (selecciona al menos una)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {STUDY_CATEGORIES.map((category) => {
              const isSelected = formData.selectedCategories.includes(category.value)
              return (
                <label
                  key={category.value}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${isSelected
                      ? `border-amber-500/50 ${category.bg}`
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
                    className="w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500/50"
                  />
                  <span className={`text-sm ${isSelected ? category.color : 'text-gray-300'}`}>
                    {category.label}
                  </span>
                </label>
              )
            })}
          </div>
          {errors.categories && <p className="mt-2 text-sm text-red-400">{errors.categories}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Descripcion (opcional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            disabled={saving}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none"
            placeholder="Detalles adicionales sobre tu plan de estudio..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creando...' : 'Crear Plan de Estudio'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-6 py-4 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
