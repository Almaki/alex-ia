'use client'

import { useEffect } from 'react'
import { updateLastSeen } from '../services/admin-actions'

export function LastSeenTracker() {
  useEffect(() => {
    // Update immediately
    updateLastSeen()

    // Update every 2 minutes
    const interval = setInterval(() => {
      updateLastSeen()
    }, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null // Renders nothing
}
