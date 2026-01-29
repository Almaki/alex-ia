import { UpdatePasswordForm } from '@/features/auth/components'

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Nuevo password</h1>
          <p className="mt-2 text-gray-400">Ingresa tu nuevo password</p>
        </div>

        <UpdatePasswordForm />
      </div>
    </div>
  )
}
