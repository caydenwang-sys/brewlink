'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GlobalMessageListener() {
  useEffect(() => {
    const supabase = createClient()

    let channel: ReturnType<typeof supabase.channel> | null = null
    let mounted = true

    async function startListener() {
      // ============================================
      // GET CURRENT USER
      // ============================================

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !mounted) {
        return
      }

      console.log(
        'Starting global message listener for:',
        user.id
      )

      // ============================================
      // CREATE UNIQUE CHANNEL
      // ============================================

      const channelName =
        `global-messages-${user.id}-${crypto.randomUUID()}`

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            if (!mounted) {
              return
            }

            const newMessage = payload.new as {
              id: number
              match_id: number
              sender_id: string
              message: string
              created_at: string
              read_at: string | null
            }

            // ========================================
            // IGNORE OUR OWN MESSAGES
            // ========================================

            if (
              newMessage.sender_id === user.id
            ) {
              return
            }

            console.log(
              'Global new message received:',
              newMessage
            )

            // ========================================
            // NOTIFY OTHER COMPONENTS
            // ========================================

            window.dispatchEvent(
              new CustomEvent(
                'brewlink:new-message',
                {
                  detail: newMessage,
                }
              )
            )
          }
        )
        .subscribe((status, error) => {
          if (!mounted) {
            return
          }

          console.log(
            'Global message listener status:',
            status
          )

          if (status === 'SUBSCRIBED') {
            console.log(
              'Global message listener connected'
            )
          }

          if (status === 'CHANNEL_ERROR') {
            console.error(
              'Global message listener channel error:',
              error
            )
          }

          if (status === 'TIMED_OUT') {
            console.error(
              'Global message listener timed out:',
              error
            )
          }
        })
    }

    startListener()

    // ============================================
    // CLEANUP
    // ============================================

    return () => {
      mounted = false

      if (channel) {
        console.log(
          'Removing global message listener'
        )

        supabase.removeChannel(channel)
      }
    }
  }, [])

  return null
}