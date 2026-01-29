'use client'

import { useEffect, useState, useTransition } from 'react'
import { getManualSources, toggleManualActive, deleteManual } from '../services/admin-actions'

interface ManualSource {
  source_file: string
  manual_type: string
  aircraft_type: string | null
  chunk_count: number
  is_active: boolean
  first_uploaded: string
}

export function ManualManager() {
  const [manuals, setManuals] = useState<ManualSource[]>([])
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    startTransition(async () => {
      const data = await getManualSources()
      setManuals(data)
    })
  }, [])

  const handleToggle = async (sourceFile: string, currentActive: boolean) => {
    const result = await toggleManualActive(sourceFile, !currentActive)
    if (!result.error) {
      setManuals((prev) =>
        prev.map((m) =>
          m.source_file === sourceFile ? { ...m, is_active: !currentActive } : m
        )
      )
    }
  }

  const handleDelete = async (sourceFile: string) => {
    const result = await deleteManual(sourceFile)
    if (!result.error) {
      setManuals((prev) => prev.filter((m) => m.source_file !== sourceFile))
    }
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Manuales cargados</h2>
          <p className="text-sm text-gray-400">Gestiona los manuales de la base de conocimiento</p>
        </div>
        <div className="text-sm text-gray-500">
          {manuals.length} manual{manuals.length !== 1 ? 'es' : ''}
        </div>
      </div>

      {isPending && manuals.length === 0 && (
        <p className="text-sm text-gray-500">Cargando manuales...</p>
      )}

      {!isPending && manuals.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-gray-400">No hay manuales cargados aun.</p>
          <p className="mt-1 text-sm text-gray-500">
            Usa el script para subir PDFs:
          </p>
          <code className="mt-2 block text-xs text-purple-400">
            npx tsx scripts/process-manual.ts --file manual.pdf --type FCOM --aircraft A320
          </code>
        </div>
      )}

      <div className="space-y-3">
        {manuals.map((manual) => (
          <div
            key={manual.source_file}
            className={`rounded-xl border p-4 transition-colors ${
              manual.is_active
                ? 'border-white/10 bg-white/5'
                : 'border-red-500/20 bg-red-500/5 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{manual.source_file}</span>
                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
                    {manual.manual_type}
                  </span>
                  {manual.aircraft_type && (
                    <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
                      {manual.aircraft_type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{manual.chunk_count} chunks</span>
                  <span>Subido: {new Date(manual.first_uploaded).toLocaleDateString('es-MX')}</span>
                  <span className={manual.is_active ? 'text-green-400' : 'text-red-400'}>
                    {manual.is_active ? 'Activo' : 'Desactivado'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(manual.source_file, manual.is_active)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    manual.is_active
                      ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                      : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                  }`}
                >
                  {manual.is_active ? 'Desactivar' : 'Activar'}
                </button>

                {confirmDelete === manual.source_file ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(manual.source_file)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/20"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(manual.source_file)}
                    className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
