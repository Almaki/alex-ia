interface StatCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  accentColor: 'purple' | 'pink' | 'cyan' | 'blue'
}

const accentColors = {
  purple: 'rgb(168, 85, 247)',
  pink: 'rgb(236, 72, 153)',
  cyan: 'rgb(6, 182, 212)',
  blue: 'rgb(59, 130, 246)',
}

export function StatCard({ title, value, change, changeType, accentColor }: StatCardProps) {
  const blobColor = accentColors[accentColor]

  return (
    <div className="relative p-6 rounded-2xl bg-gray-900/60 backdrop-blur-sm border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-300">
      {/* Mini gradient blob */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ backgroundColor: blobColor, filter: 'blur(40px)' }}
      />

      <div className="relative z-10">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</p>
        <div className="flex items-center gap-2 mt-3">
          <span
            className={
              changeType === 'positive'
                ? 'text-sm font-medium text-emerald-400'
                : changeType === 'negative'
                  ? 'text-sm font-medium text-red-400'
                  : 'text-sm font-medium text-gray-400'
            }
          >
            {change}
          </span>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      </div>
    </div>
  )
}
