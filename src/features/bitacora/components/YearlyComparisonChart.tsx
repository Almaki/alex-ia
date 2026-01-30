'use client'

import { useState } from 'react'
import type { YearlyMonthStats } from '../services/bitacora-actions'

const MONTH_LABELS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

type Metric = 'blockHours' | 'flightHours' | 'flightCount'

const METRIC_OPTIONS: { key: Metric; label: string }[] = [
  { key: 'blockHours', label: 'Horas Block' },
  { key: 'flightHours', label: 'Horas Vuelo' },
  { key: 'flightCount', label: 'Vuelos' },
]

interface YearlyComparisonChartProps {
  currentYearData: YearlyMonthStats[]
  previousYearData: YearlyMonthStats[]
  currentYear: number
  loading: boolean
}

function formatValue(value: number, metric: Metric): string {
  if (metric === 'flightCount') return String(value)
  const h = Math.floor(value)
  const m = Math.round((value - h) * 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

export function YearlyComparisonChart({
  currentYearData,
  previousYearData,
  currentYear,
  loading,
}: YearlyComparisonChartProps) {
  const [metric, setMetric] = useState<Metric>('blockHours')
  const previousYear = currentYear - 1

  const currentValues = currentYearData.map((m) => m[metric])
  const previousValues = previousYearData.map((m) => m[metric])
  const allValues = [...currentValues, ...previousValues]
  const maxValue = Math.max(...allValues, 1)

  const currentTotal = currentValues.reduce((a, b) => a + b, 0)
  const previousTotal = previousValues.reduce((a, b) => a + b, 0)

  const hasData = allValues.some((v) => v > 0)

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-white">Comparativo Anual</h3>
          <p className="text-xs text-gray-500">{previousYear} vs {currentYear}</p>
        </div>

        {/* Metric Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMetric(opt.key)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                metric === opt.key
                  ? 'bg-purple-500/20 text-purple-300 font-medium'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-gray-500">No hay datos para {previousYear}-{currentYear}</p>
        </div>
      ) : (
        <>
          {/* Totals Row */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-500/60" />
              <span className="text-xs text-gray-400">
                {previousYear}: <span className="text-white font-medium">{formatValue(previousTotal, metric)}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-xs text-gray-400">
                {currentYear}: <span className="text-white font-medium">{formatValue(currentTotal, metric)}</span>
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="flex items-end gap-1 h-40 md:h-48">
            {MONTH_LABELS.map((label, i) => {
              const curVal = currentValues[i]
              const prevVal = previousValues[i]
              const curHeight = (curVal / maxValue) * 100
              const prevHeight = (prevVal / maxValue) * 100

              return (
                <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 group">
                  <div className="w-full flex items-end justify-center gap-[2px] h-full">
                    {/* Previous year bar */}
                    <div
                      className="flex-1 max-w-[10px] md:max-w-[14px] rounded-t-sm bg-gray-500/40 transition-all duration-300 group-hover:bg-gray-500/60"
                      style={{ height: `${Math.max(prevHeight, prevVal > 0 ? 3 : 0)}%` }}
                      title={`${previousYear}: ${formatValue(prevVal, metric)}`}
                    />
                    {/* Current year bar */}
                    <div
                      className="flex-1 max-w-[10px] md:max-w-[14px] rounded-t-sm transition-all duration-300"
                      style={{
                        height: `${Math.max(curHeight, curVal > 0 ? 3 : 0)}%`,
                        background: 'linear-gradient(to top, rgb(168, 85, 247), rgb(139, 92, 246))',
                      }}
                      title={`${currentYear}: ${formatValue(curVal, metric)}`}
                    />
                  </div>
                  <span className="text-[9px] md:text-[10px] text-gray-600">{label}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
