interface ChartCardProps {
  title: string
  subtitle: string
  accentColor: 'purple' | 'cyan'
}

const accents = {
  purple: {
    blobColor: 'rgb(168, 85, 247)',
    gradientFrom: 'rgb(168, 85, 247)',
    gradientTo: 'rgb(236, 72, 153)',
  },
  cyan: {
    blobColor: 'rgb(6, 182, 212)',
    gradientFrom: 'rgb(6, 182, 212)',
    gradientTo: 'rgb(59, 130, 246)',
  },
}

const chartData = [35, 55, 42, 70, 60, 85, 75, 90, 65, 80, 95, 72]
const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

export function ChartCard({ title, subtitle, accentColor }: ChartCardProps) {
  const accent = accents[accentColor]
  const maxVal = Math.max(...chartData)

  return (
    <div className="relative p-6 rounded-2xl bg-gray-900/60 backdrop-blur-sm border border-white/5 overflow-hidden">
      {/* Gradient accent */}
      <div
        className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-15"
        style={{ backgroundColor: accent.blobColor, filter: 'blur(60px)' }}
      />

      <div className="relative z-10">
        <div className="mb-6">
          <h3 className="text-white font-semibold">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-end gap-2 h-40">
          {chartData.map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                style={{
                  height: `${(value / maxVal) * 100}%`,
                  background: `linear-gradient(to top, ${accent.gradientFrom}, ${accent.gradientTo})`,
                }}
              />
              <span className="text-[10px] text-gray-600">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
