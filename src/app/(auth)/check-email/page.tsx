import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm text-center">
        <h1 className="text-3xl font-bold text-white">Revisa tu email</h1>
        <p className="text-gray-400">
          Te enviamos un link de confirmacion. Revisa tu email para completar el registro.
        </p>
        <Link
          href="/login"
          className="inline-block text-purple-400 hover:text-purple-300 hover:underline"
        >
          Volver al login
        </Link>
      </div>
    </div>
  )
}
