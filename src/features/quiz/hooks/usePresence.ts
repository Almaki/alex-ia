'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OnlinePilot } from '../types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UserInfo {
  full_name: string | null
  fleet: string | null
  position: string | null
  elo_rating: number
}

export function usePresence(
  userId: string | null,
  userInfo: UserInfo | null
) {
  const [onlinePilots, setOnlinePilots] = useState<OnlinePilot[]>([])

  useEffect(() => {
    // Only setup if user is authenticated
    if (!userId || !userInfo) {
      setOnlinePilots([])
      return
    }

    const supabase = createClient()
    let channel: RealtimeChannel

    const setupPresence = async () => {
      // Create channel with presence config
      channel = supabase.channel('quiz-online', {
        config: {
          presence: {
            key: userId,
          },
        },
      })

      // Handle presence state changes
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()

          // Convert presence state to OnlinePilot array
          const pilots: OnlinePilot[] = []

          Object.keys(state).forEach((presenceKey) => {
            // Exclude current user
            if (presenceKey === userId) return

            const presences = state[presenceKey]
            if (presences && presences.length > 0) {
              const presence = presences[0] as unknown as {
                id: string
                full_name: string | null
                fleet: string | null
                position: string | null
                elo_rating: number
              }

              pilots.push({
                id: presence.id,
                full_name: presence.full_name,
                elo_rating: presence.elo_rating,
                fleet: presence.fleet,
                position: presence.position,
              })
            }
          })

          setOnlinePilots(pilots)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track user presence
            await channel.track({
              id: userId,
              full_name: userInfo.full_name,
              fleet: userInfo.fleet,
              position: userInfo.position,
              elo_rating: userInfo.elo_rating,
            })
          }
        })
    }

    setupPresence()

    // Cleanup on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      setOnlinePilots([])
    }
  }, [userId, userInfo])

  return { onlinePilots }
}
