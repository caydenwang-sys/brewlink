'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Notification = {
  id: number
  user_id: string
  type: string
  title: string
  message: string
  related_user_id: string | null
  related_match_id: number | null
  related_message_id: string | null
  is_read: boolean
  created_at: string
}

export default function NotificationBell() {
  const router = useRouter()

  const [userId, setUserId] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // ============================================
  // LOAD UNREAD NOTIFICATIONS
  // ============================================

  async function loadUnreadCount(currentUserId: string) {
    const supabase = createClient()

    const {
      count,
      error,
    } = await supabase
      .from('notifications')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('user_id', currentUserId)
      .eq('is_read', false)

    if (error) {
      console.error(
        'NOTIFICATIONS - Could not load unread count:',
        error
      )
      return
    }

    setUnreadCount(count || 0)
  }

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    async function initialize() {
      const supabase = createClient()

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return
      }

      setUserId(user.id)

      await loadUnreadCount(user.id)
    }

    initialize()
  }, [])

  // ============================================
  // REALTIME NOTIFICATIONS
  // ============================================

  useEffect(() => {
    if (!userId) {
      return
    }

    const supabase = createClient()

    const channel = supabase
      .channel(
        `notifications-${userId}`
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log(
            'NOTIFICATIONS REALTIME INSERT:',
            payload
          )

          const notification =
            payload.new as Notification

          if (
            notification.user_id === userId &&
            !notification.is_read
          ) {
            setUnreadCount(
              (current) => current + 1
            )
          }

          await loadUnreadCount(userId)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log(
            'NOTIFICATIONS REALTIME UPDATE:',
            payload
          )

          await loadUnreadCount(userId)
        }
      )
      .subscribe((status, error) => {
        console.log(
          'NOTIFICATIONS REALTIME STATUS:',
          status
        )

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
        ) {
          console.error(
            'NOTIFICATIONS REALTIME ERROR:',
            error
          )
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // ============================================
  // OPEN NOTIFICATIONS
  // ============================================

  function openNotifications() {
    router.push('/notifications')
  }

  // ============================================
  // BELL
  // ============================================

  return (
    <button
      onClick={openNotifications}
      aria-label="Notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-lg transition hover:bg-gray-100"
    >
      <span>
        🔔
      </span>

      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99
            ? '99+'
            : unreadCount}
        </span>
      )}
    </button>
  )
}