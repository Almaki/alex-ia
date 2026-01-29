interface ActivityItem {
  id: string
  user: string
  action: string
  target: string
  time: string
  status: 'completed' | 'pending' | 'failed'
}

const activities: ActivityItem[] = [
  { id: '1', user: 'Ana M.', action: 'deployed', target: 'v2.4.0 to production', time: '2 min ago', status: 'completed' },
  { id: '2', user: 'Carlos R.', action: 'merged', target: 'PR #142 - Auth fix', time: '15 min ago', status: 'completed' },
  { id: '3', user: 'Elena S.', action: 'created', target: 'Issue #89 - UI bug', time: '1h ago', status: 'pending' },
  { id: '4', user: 'David L.', action: 'pushed', target: '3 commits to develop', time: '2h ago', status: 'completed' },
  { id: '5', user: 'Maria G.', action: 'failed', target: 'Build #567', time: '3h ago', status: 'failed' },
  { id: '6', user: 'Jorge P.', action: 'reviewed', target: 'PR #141 - API refactor', time: '4h ago', status: 'completed' },
]

const statusStyles = {
  completed: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  failed: 'bg-red-500/10 text-red-400',
}

export function ActivityTable() {
  return (
    <div className="relative rounded-2xl bg-gray-900/60 backdrop-blur-sm border border-white/5 overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-10" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold">Recent Activity</h3>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            View all
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {activity.user.charAt(0)}
                      </div>
                      <span className="text-sm text-white font-medium">
                        {activity.user}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300">
                      {activity.action}{' '}
                      <span className="text-gray-500">{activity.target}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[activity.status]}`}
                    >
                      {activity.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
