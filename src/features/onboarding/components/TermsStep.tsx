'use client'

interface TermsStepProps {
  accepted: boolean
  onToggle: (accepted: boolean) => void
}

export function TermsStep({ accepted, onToggle }: TermsStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Terminos y privacidad</h2>
        <p className="mt-1 text-gray-400">Antes de continuar, revisa nuestros terminos</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300 max-h-48 overflow-y-auto dark-scrollbar space-y-3">
        <p>
          <strong className="text-white">Aviso importante:</strong> AlexIA es una herramienta de
          referencia y apoyo al estudio con fines de entretenimiento. En ningun momento se busca
          reemplazar el estudio, la lectura o las directrices de ningun operador aereo.
          No pertenecemos ni estamos ligados a operador o aerolinea alguna.
        </p>
        <p>
          <strong className="text-white">Uso responsable:</strong> No tomes decisiones operacionales
          basandote unicamente en las respuestas de AlexIA. Siempre consulta la documentacion
          oficial aprobada por tu operador.
        </p>
        <p>
          <strong className="text-white">Privacidad:</strong> Tus datos personales se manejan conforme
          a la LFPDPPP. No almacenamos informacion de vuelos reales ni credenciales de aerolineas.
          Solo procesamos informacion tecnica de manuales.
        </p>
        <p>
          <strong className="text-white">Derechos ARCO:</strong> Puedes acceder, rectificar, cancelar
          u oponerte al tratamiento de tus datos en cualquier momento.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
        />
        <span className="text-sm text-gray-300">
          He leido y acepto los terminos de uso y el aviso de privacidad de AlexIA.
        </span>
      </label>
    </div>
  )
}
