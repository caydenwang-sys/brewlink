'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
}

type Conversation = {
  matchId: number
  otherUser: Profile | null
  latestMessage: string | null
  latestMessageTime: string | null
  unreadCount: number
}

type Message = {
  id: number
  match_id: number
  sender_id: string
  message: string
  created_at: string
  read_at: string | null
}

export default function ChatsPage() {
  const router = useRouter()

  const [conversations, setConversations] =
    useState<Conversation[]>([])

  const [currentUserId, setCurrentUserId] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // ============================================
  // SORT CONVERSATIONS
  // ============================================

  function sortConversations(
    conversationList: Conversation[]
  ) {
    return [...conversationList].sort(
      (a, b) => {
        if (!a.latestMessageTime) {
          return 1
        }

        if (!b.latestMessageTime) {
          return -1
        }

        return (
          new Date(
            b.latestMessageTime
          ).getTime() -
          new Date(
            a.latestMessageTime
          ).getTime()
        )
      }
    )
  }

  // ============================================
  // LOAD CONVERSATIONS
  // ============================================

  async function loadConversations() {
    const supabase = createClient()

    setLoading(true)
    setError('')

    // ============================================
    // GET CURRENT USER
    // ============================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/login')
      return
    }

    setCurrentUserId(user.id)

    // ============================================
    // LOAD MATCHES
    // ============================================

    const {
      data: matches,
      error: matchesError,
    } = await supabase
      .from('matches')
      .select(`
        id,
        user_1_id,
        user_2_id,
        status,
        created_at
      `)
      .or(
        `user_1_id.eq.${user.id},user_2_id.eq.${user.id}`
      )
      .eq('status', 'active')
      .order('created_at', {
        ascending: false,
      })

    if (matchesError) {
      console.error(
        'Could not load matches:',
        matchesError
      )

      setError(
        'Could not load your conversations.'
      )

      setLoading(false)
      return
    }

    if (!matches || matches.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    // ============================================
    // FIND OTHER USERS
    // ============================================

    const otherUserIds = matches.map((match) =>
      match.user_1_id === user.id
        ? match.user_2_id
        : match.user_1_id
    )

    const uniqueOtherUserIds = [
      ...new Set(otherUserIds),
    ]

    const {
      data: profiles,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name
      `)
      .in(
        'id',
        uniqueOtherUserIds
      )

    if (profilesError) {
      console.error(
        'Could not load profiles:',
        profilesError
      )

      setError(
        'Could not load your conversations.'
      )

      setLoading(false)
      return
    }

    // ============================================
    // LOAD CONVERSATION DATA
    // ============================================

    const conversationResults =
      await Promise.all(
        matches.map(async (match) => {

          // ======================================
          // GET LATEST MESSAGE
          // ======================================

          const {
            data: latestMessage,
            error: latestMessageError,
          } = await supabase
            .from('messages')
            .select(`
              id,
              match_id,
              sender_id,
              message,
              created_at,
              read_at
            `)
            .eq(
              'match_id',
              match.id
            )
            .order('created_at', {
              ascending: false,
            })
            .limit(1)
            .maybeSingle()

          if (latestMessageError) {
            console.error(
              `Could not load latest message for match ${match.id}:`,
              latestMessageError
            )
          }

          // ======================================
          // COUNT UNREAD MESSAGES
          // ======================================

          const {
            count: unreadCount,
            error: unreadError,
          } = await supabase
            .from('messages')
            .select(
              'id',
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
            .is(
              'read_at',
              null
            )

          if (unreadError) {
            console.error(
              `Could not load unread count for match ${match.id}:`,
              unreadError
            )
          }

          // ======================================
          // FIND OTHER USER
          // ======================================

          const otherUserId =
            match.user_1_id === user.id
              ? match.user_2_id
              : match.user_1_id

          const otherUser =
            profiles?.find(
              (profile) =>
                profile.id ===
                otherUserId
            ) || null

          return {
            matchId: match.id,

            otherUser,

            latestMessage:
              latestMessage?.message ||
              null,

            latestMessageTime:
              latestMessage?.created_at ||
              null,

            unreadCount:
              unreadCount || 0,
          }
        })
      )

    // ============================================
    // SORT
    // ============================================

    setConversations(
      sortConversations(
        conversationResults
      )
    )

    setLoading(false)
  }

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    loadConversations()
  }, [])

  // ============================================
  // REALTIME MESSAGE LISTENER
  // ============================================

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    const supabase = createClient()

    console.log(
      'Starting Chats Realtime listener'
    )

    const channel =
      supabase
        .channel(
          `chats-messages-${currentUserId}`
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {

            console.log(
              'New message received on Chats page:',
              payload
            )

            const newMessage =
              payload.new as Message

            setConversations(
              (currentConversations) => {

                // ==================================
                // FIND CONVERSATION
                // ==================================

                const conversation =
                  currentConversations.find(
                    (item) =>
                      item.matchId ===
                      newMessage.match_id
                  )

                // ==================================
                // NOT ONE OF OUR CONVERSATIONS
                // ==================================

                if (!conversation) {
                  return currentConversations
                }

                // ==================================
                // CHECK WHO SENT MESSAGE
                // ==================================

                const isFromCurrentUser =
                  newMessage.sender_id ===
                  currentUserId

                // ==================================
                // UPDATE CONVERSATION
                // ==================================

                const updatedConversation:
                  Conversation = {
                    ...conversation,

                    latestMessage:
                      newMessage.message,

                    latestMessageTime:
                      newMessage.created_at,

                    unreadCount:
                      isFromCurrentUser
                        ? conversation.unreadCount
                        : conversation.unreadCount + 1,
                  }

                // ==================================
                // REPLACE CONVERSATION
                // ==================================

                const updatedConversations =
                  currentConversations.map(
                    (item) =>
                      item.matchId ===
                      newMessage.match_id
                        ? updatedConversation
                        : item
                  )

                // ==================================
                // MOVE CHAT TO TOP
                // ==================================

                return sortConversations(
                  updatedConversations
                )
              }
            )
          }
        )

        // ==========================================
        // LISTEN FOR READ RECEIPTS
        // ==========================================

        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {

            console.log(
              'Message updated on Chats page:',
              payload
            )

            const updatedMessage =
              payload.new as Message

            // ======================================
            // ONLY CARE ABOUT READ RECEIPTS
            // ======================================

            if (!updatedMessage.read_at) {
              return
            }

            setConversations(
              (currentConversations) => {

                const conversation =
                  currentConversations.find(
                    (item) =>
                      item.matchId ===
                      updatedMessage.match_id
                  )

                if (!conversation) {
                  return currentConversations
                }

                // ==================================
                // IF THIS WAS THE LATEST MESSAGE,
                // UPDATE THE LOCAL STATE
                // ==================================

                const updatedConversations =
                  currentConversations.map(
                    (item) => {

                      if (
                        item.matchId !==
                        updatedMessage.match_id
                      ) {
                        return item
                      }

                      return {
                        ...item,
                        latestMessage:
                          updatedMessage.message,
                        latestMessageTime:
                          updatedMessage.created_at,
                      }
                    }
                  )

                return updatedConversations
              }
            )
          }
        )

        .subscribe((status) => {

          console.log(
            'Chats Realtime status:',
            status
          )

          if (status === 'SUBSCRIBED') {
            console.log(
              'Chats Realtime successfully connected'
            )
          }

          if (status === 'CHANNEL_ERROR') {
            console.error(
              'Chats Realtime channel error'
            )
          }

          if (status === 'TIMED_OUT') {
            console.error(
              'Chats Realtime connection timed out'
            )
          }
        })

    // ============================================
    // CLEANUP
    // ============================================

    return () => {

      console.log(
        'Removing Chats Realtime listener'
      )

      supabase.removeChannel(
        channel
      )
    }
  }, [currentUserId])

  // ============================================
  // FORMAT TIME
  // ============================================

  function formatMessageTime(
    timestamp: string | null
  ) {
    if (!timestamp) {
      return ''
    }

    const date =
      new Date(timestamp)

    const now =
      new Date()

    const sameDay =
      date.toDateString() ===
      now.toDateString()

    if (sameDay) {
      return date.toLocaleTimeString(
        [],
        {
          hour: 'numeric',
          minute: '2-digit',
        }
      )
    }

    return date.toLocaleDateString(
      [],
      {
        month: 'short',
        day: 'numeric',
      }
    )
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            💬
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your messages...
          </p>

        </div>

      </main>
    )
  }

  // ============================================
  // TOTAL UNREAD
  // ============================================

  const totalUnread =
    conversations.reduce(
      (total, conversation) =>
        total +
        conversation.unreadCount,
      0
    )

  // ============================================
  // PAGE
  // ============================================

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-28">

      {/* HEADER */}

      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/90 backdrop-blur">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push('/dashboard')
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/dashboard')
            }
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            Home
          </button>

        </div>

      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        {/* TITLE */}

        <section className="mb-8">

          <div className="flex items-center gap-3">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                BrewLink
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                Messages
              </h1>

            </div>

            {totalUnread > 0 && (
              <div className="mt-6 flex h-7 min-w-7 items-center justify-center rounded-full bg-black px-2 text-xs font-bold text-white">
                {totalUnread}
              </div>
            )}

          </div>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500">
            Continue your conversations with
            your BrewLink connections.
          </p>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* CONVERSATIONS */}

        {conversations.length === 0 ? (

          <div className="rounded-3xl border border-gray-200/70 bg-white p-8 shadow-sm">

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                💬
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                No conversations yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                Connect with someone in Discover
                to start a conversation.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push('/discover')
                }
                className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                Discover students →
              </button>

            </div>

          </div>

        ) : (

          <div className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm">

            {conversations.map(
              (
                conversation,
                index
              ) => {

                const firstName =
                  conversation.otherUser
                    ?.first_name ||
                  'Unknown'

                const lastName =
                  conversation.otherUser
                    ?.last_name ||
                  ''

                const initials =
                  `${firstName.charAt(0)}${lastName.charAt(0)}`
                    .toUpperCase()

                const hasUnread =
                  conversation.unreadCount >
                  0

                return (
                  <button
                    key={
                      conversation.matchId
                    }
                    type="button"
                    onClick={() => {
                      router.push(
                        `/chats/${conversation.matchId}`
                      )
                    }}
                    className={`flex w-full items-center gap-4 p-5 text-left transition hover:bg-gray-50 ${
                      index !==
                      conversations.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >

                    {/* AVATAR */}

                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        hasUnread
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {initials}
                    </div>

                    {/* MESSAGE PREVIEW */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center justify-between gap-3">

                        <h2
                          className={`truncate ${
                            hasUnread
                              ? 'font-bold text-black'
                              : 'font-semibold'
                          }`}
                        >
                          {firstName}{' '}
                          {lastName}
                        </h2>

                        <div className="flex shrink-0 items-center gap-2">

                          {conversation.latestMessageTime && (
                            <span
                              className={`text-xs ${
                                hasUnread
                                  ? 'font-semibold text-black'
                                  : 'text-gray-400'
                              }`}
                            >
                              {formatMessageTime(
                                conversation.latestMessageTime
                              )}
                            </span>
                          )}

                          {hasUnread && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-bold text-white">
                              {conversation.unreadCount}
                            </span>
                          )}

                        </div>

                      </div>

                      <p
                        className={`mt-1 truncate text-sm ${
                          hasUnread
                            ? 'font-medium text-gray-800'
                            : 'text-gray-500'
                        }`}
                      >
                        {conversation.latestMessage ||
                          'Start a conversation...'}
                      </p>

                    </div>

                    {/* ARROW */}

                    <span
                      className={`shrink-0 ${
                        hasUnread
                          ? 'text-black'
                          : 'text-gray-300'
                      }`}
                    >
                      →
                    </span>

                  </button>
                )
              }
            )}

          </div>

        )}

      </div>

      {/* BOTTOM NAV */}

      <BottomNav />

    </main>
  )
}