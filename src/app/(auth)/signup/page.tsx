import Link from 'next/link'
import { SignupForm } from '@/features/auth/components'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-2 text-gray-400">Comienza gratis con AlexIA</p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-gray-400">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 hover:underline">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  )
}
