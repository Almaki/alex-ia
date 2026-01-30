'use client'

import { useState, useEffect } from 'react'
import { getProfile, updateProfile, deleteAccount } from '@/features/settings/services/settings-actions'
import { FLEET_OPTIONS, POSITION_OPTIONS } from '@/types/database'

interface ProfileData {
  id: string
  email: string
  full_name: string | null
  fleet: string | null
  position: string | null
}

export function SettingsPage() {
  // State management
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [fleet, setFleet] = useState<string | null>(null)
  const [position, setPosition] = useState<string | null>(null)

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Fetch profile on mount
  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setError(null)

      const result = await getProfile()

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setProfile(result.data)
        setFullName(result.data.full_name || '')
        setFleet(result.data.fleet)
        setPosition(result.data.position)
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  // Handle profile update
  async function handleSave() {
    if (!fullName.trim()) {
      setError('El nombre completo es requerido')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    const result = await updateProfile({
      fullName: fullName.trim(),
      fleet,
      position,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setProfile(result.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setSaving(false)
  }

  // Handle account deletion
  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'ELIMINAR') {
      setError('Por favor escribe "ELIMINAR" para confirmar')
      return
    }

    setDeleting(true)
    setError(null)

    const result = await deleteAccount()

    if (result.error) {
      setError(result.error)
      setDeleting(false)
    } else if (result.success) {
      // Redirect to login
      window.location.href = '/login'
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-purple-500" />
          <p className="text-sm text-gray-400">Cargando configuracion...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!profile && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-md rounded-2xl bg-gray-900 p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Configuracion</h1>
          <p className="mt-1 text-sm text-gray-400 md:text-base">
            Gestiona tu perfil y preferencias
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
            <p className="text-sm text-green-400">Perfil actualizado correctamente</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Profile Section */}
        <div className="rounded-2xl bg-gray-900 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Informacion Personal</h2>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">El email no se puede modificar</p>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-200">
              Nombre Completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Ej: Juan Perez"
            />
          </div>

          {/* Fleet Selector */}
          <div>
            <label htmlFor="fleet" className="block text-sm font-medium text-gray-200">
              Flota
            </label>
            <select
              id="fleet"
              value={fleet || ''}
              onChange={(e) => setFleet(e.target.value || null)}
              className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Selecciona una flota</option>
              {FLEET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.manufacturer}
                </option>
              ))}
            </select>
          </div>

          {/* Position Selector */}
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-200">
              Posicion
            </label>
            <select
              id="position"
              value={position || ''}
              onChange={(e) => setPosition(e.target.value || null)}
              className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Selecciona una posicion</option>
              {POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl bg-gray-900 border-2 border-red-500/30 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-red-400">Zona de Peligro</h2>
            <p className="mt-1 text-sm text-gray-400">
              Esta accion es permanente y no se puede deshacer
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
          >
            Eliminar Cuenta
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white">Confirmar Eliminacion</h3>
            <p className="mt-2 text-sm text-gray-300">
              Esta accion eliminara permanentemente tu cuenta y todos tus datos. No se puede deshacer.
            </p>

            <div className="mt-4">
              <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-200">
                Escribe <span className="font-mono font-bold text-red-400">ELIMINAR</span> para confirmar
              </label>
              <input
                id="confirmDelete"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="ELIMINAR"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                  setError(null)
                }}
                disabled={deleting}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'ELIMINAR'}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
