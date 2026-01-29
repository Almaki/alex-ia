export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600 rounded-full animate-blob blur-[150px] opacity-[0.07]" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-pink-600 rounded-full animate-blob animation-delay-2000 blur-[150px] opacity-[0.05]" />
        <div className="absolute bottom-0 left-1/2 w-[700px] h-[400px] bg-cyan-500 rounded-full animate-blob animation-delay-4000 blur-[150px] opacity-[0.06]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
