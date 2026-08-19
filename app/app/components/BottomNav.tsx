'use client'

import {
  useEffect,
  useState,
} from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: '🏠',
  },
  {
    label: 'Discover',
    href: '/discover',
    icon: '✨',
  },
  {
    label: 'Search',
    href: '/search',
    icon: '🔎',
  },
  {
    label: 'Connections',
    href: '/connections',
    icon: '👥',
  },
  {
    label: 'Chats',
    href: '/chats',
    icon: '💬',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: '👤',
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  const [
    pendingConnections,
    setPendingConnections,
  ] = useState(0)

  const [
    unreadMessages,
    setUnreadMessages,
  ] = useState(0)

  useEffect(() => {
    let mounted = true

    const supabase = createClient()

    let connectionChannel:
      ReturnType<typeof supabase.channel> | null =
        null

    async function loadBadgeCounts() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser()

      if (
        !user ||
        !mounted
      ) {
        return
      }

      // ============================================
      // PENDING CONNECTION REQUESTS
      // ============================================

      const {
        count: pendingCount,
        error: pendingError,
      } =
        await supabase
          .from('connections')
          .select(
            '*',
            {
              count: 'exact',
              head: true,
            }
          )
          .eq(
            'receiver_id',
            user.id
          )
          .eq(
            'status',
            'pending'
          )

      if (
        !pendingError &&
        mounted
      ) {
        setPendingConnections(
          pendingCount || 0
        )
      }

      // ============================================
      // UNREAD MESSAGES
      // ============================================

      const {
        data: matchRows,
        error: matchError,
      } =
        await supabase
          .from('matches')
          .select(`
            id,
            user_1_id,
            user_2_id,
            user_1_last_read_at,
            user_2_last_read_at
          `)
          .or(
            `user_1_id.eq.${user.id},user_2_id.eq.${user.id}`
          )
          .eq(
            'status',
            'active'
          )

      if (
        matchError ||
        !matchRows
      ) {
        return
      }

      let totalUnread = 0

      for (
        const match of
        matchRows
      ) {
        const lastReadAt =
          match.user_1_id ===
          user.id
            ? match.user_1_last_read_at
            : match.user_2_last_read_at

        let query =
          supabase
            .from('messages')
            .select(
              '*',
              {
                count: 'exact',
                head: true,
              }
            )
            .eq(
              'match_id',
              match.id
            )
            .neq(
              'sender_id',
              user.id
            )

        if (lastReadAt) {
          query =
            query.gt(
              'created_at',
              lastReadAt
            )
        }

        const {
          count: unreadCount,
          error: unreadError,
        } =
          await query

        if (!unreadError) {
          totalUnread +=
            unreadCount || 0
        }
      }

      if (mounted) {
        setUnreadMessages(
          totalUnread
        )
      }
    }

    async function startRealtime() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser()

      if (
        !user ||
        !mounted
      ) {
        return
      }

      connectionChannel =
        supabase
          .channel(
            `bottom-nav-connections-${user.id}-${crypto.randomUUID()}`
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'connections',
              filter:
                `receiver_id=eq.${user.id}`,
            },
            () => {
              if (!mounted) {
                return
              }

              console.log(
                'New incoming connection request'
              )

              loadBadgeCounts()
            }
          )
          .subscribe(
            (status) => {
              console.log(
                'Connections realtime status:',
                status
              )
            }
          )
    }

    loadBadgeCounts()
    startRealtime()

    function handleNewMessage() {
      loadBadgeCounts()
    }

    function handleConnectionChange() {
      loadBadgeCounts()
    }

    window.addEventListener(
      'brewlink:new-message',
      handleNewMessage
    )

    window.addEventListener(
      'brewlink:connection-change',
      handleConnectionChange
    )

    return () => {
      mounted = false

      window.removeEventListener(
        'brewlink:new-message',
        handleNewMessage
      )

      window.removeEventListener(
        'brewlink:connection-change',
        handleConnectionChange
      )

      if (connectionChannel) {
        supabase.removeChannel(
          connectionChannel
        )
      }
    }
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl justify-around px-2 py-3">

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`)

          let badgeCount = 0

          if (
            item.href ===
            '/connections'
          ) {
            badgeCount =
              pendingConnections
          }

          if (
            item.href ===
            '/chats'
          ) {
            badgeCount =
              unreadMessages
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs transition ${
                isActive
                  ? 'font-bold text-black'
                  : 'font-medium text-gray-400 hover:text-black'
              }`}
            >
              <span className="relative">
                <span
                  className={`block text-base transition ${
                    isActive ? 'scale-110' : ''
                  }`}
                >
                  {item.icon}
                </span>

                {badgeCount > 0 && (
                  <span className="absolute -right-3 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                    {badgeCount > 99
                      ? '99+'
                      : badgeCount}
                  </span>
                )}
              </span>

              <span>
                {item.label}
              </span>
            </Link>
          )
        })}

      </div>
    </nav>
  )
}