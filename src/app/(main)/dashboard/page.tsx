import { DashboardHeader } from '@/features/dashboard/components/header'
import { StatCard } from '@/features/dashboard/components/stat-card'
import { ChartCard } from '@/features/dashboard/components/chart-card'
import { ActivityTable } from '@/features/dashboard/components/activity-table'

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <DashboardHeader />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value="$45,231"
          change="+20.1%"
          changeType="positive"
          accentColor="purple"
        />
        <StatCard
          title="Active Users"
          value="2,350"
          change="+15.3%"
          changeType="positive"
          accentColor="cyan"
        />
        <StatCard
          title="Conversion Rate"
          value="3.2%"
          change="-2.1%"
          changeType="negative"
          accentColor="pink"
        />
        <StatCard
          title="Avg. Session"
          value="4m 32s"
          change="+0.5%"
          changeType="neutral"
          accentColor="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly revenue for 2026"
          accentColor="purple"
        />
        <ChartCard
          title="User Growth"
          subtitle="New signups per month"
          accentColor="cyan"
        />
      </div>

      {/* Activity Table */}
      <ActivityTable />
    </div>
  )
}
