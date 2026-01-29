import Link from 'next/link'
import { LoginForm } from '@/features/auth/components'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Bienvenido</h1>
          <p className="mt-2 text-gray-400">Inicia sesion en tu cuenta</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-gray-400">
          No tienes cuenta?{' '}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
