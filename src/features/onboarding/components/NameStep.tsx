'use client'

interface NameStepProps {
  value: string
  onChange: (name: string) => void
}

export function NameStep({ value, onChange }: NameStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Bienvenido a AlexIA</h2>
        <p className="mt-1 text-gray-400">Tu asistente de aviacion con IA</p>
      </div>

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-200">
          Como te llamas?
        </label>
        <input
          id="full_name"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          placeholder="Tu nombre completo"
        />
      </div>
    </div>
  )
}
