'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
}

type CoffeeChat = {
  id: string
  match_id: number
  organizer_id: string
  participant_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  location: string
  status: string
  otherUser: Profile | null
}

export default function CoffeeChatsPage() {
  const router = useRouter()

  const [coffeeChats, setCoffeeChats] = useState<CoffeeChat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cancellingId, setCancellingId] =
    useState<string | null>(null)

  // ============================================
  // LOAD COFFEE CHATS
  // ============================================

  async function loadCoffeeChats() {
    const supabase = createClient()

    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/login')
      return
    }

    const {
      data: chats,
      error: chatsError,
    } = await supabase
      .from('coffee_chats')
      .select(`
        id,
        match_id,
        organizer_id,
        participant_id,
        scheduled_date,
        start_time,
        end_time,
        location,
        status
      `)
      .or(
        `organizer_id.eq.${user.id},participant_id.eq.${user.id}`
      )
      .order('scheduled_date', {
        ascending: true,
      })
      .order('start_time', {
        ascending: true,
      })

    if (chatsError) {
      console.error(
        'Could not load coffee chats:',
        chatsError
      )

      setError(
        'Could not load your coffee chats.'
      )

      setLoading(false)
      return
    }

    if (!chats || chats.length === 0) {
      setCoffeeChats([])
      setLoading(false)
      return
    }

    // ============================================
    // FIND OTHER USERS
    // ============================================

    const otherUserIds = chats.map((chat) =>
      chat.organizer_id === user.id
        ? chat.participant_id
        : chat.organizer_id
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
      .in('id', uniqueOtherUserIds)

    if (profilesError) {
      console.error(
        'Could not load coffee chat profiles:',
        profilesError
      )

      setError(
        'Could not load your coffee chats.'
      )

      setLoading(false)
      return
    }

    // ============================================
    // COMBINE CHAT + PROFILE
    // ============================================

    const formattedChats: CoffeeChat[] =
      chats.map((chat) => {
        const otherUserId =
          chat.organizer_id === user.id
            ? chat.participant_id
            : chat.organizer_id

        const profile =
          profiles?.find(
            (p) => p.id === otherUserId
          ) || null

        return {
          ...chat,
          otherUser: profile,
        }
      })

    setCoffeeChats(formattedChats)
    setLoading(false)
  }

  useEffect(() => {
    loadCoffeeChats()
  }, [router])

  // ============================================
  // FORMATTERS
  // ============================================

  function formatTime(time: string) {
    const [hours, minutes] =
      time.split(':').map(Number)

    const date = new Date()

    date.setHours(
      hours,
      minutes,
      0,
      0
    )

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function formatDate(dateString: string) {
    const [
      year,
      month,
      day,
    ] = dateString
      .split('-')
      .map(Number)

    const date = new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0
    )

    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  function isUpcoming(chat: CoffeeChat) {
    const [
      year,
      month,
      day,
    ] = chat.scheduled_date
      .split('-')
      .map(Number)

    const [
      hours,
      minutes,
    ] = chat.start_time
      .split(':')
      .map(Number)

    const dateTime = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes
    )

    return dateTime >= new Date()
  }

  // ============================================
  // CANCEL COFFEE CHAT
  // ============================================

  async function cancelCoffeeChat(
    chat: CoffeeChat
  ) {
    if (cancellingId) {
      return
    }

    if (chat.status === 'cancelled') {
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel your coffee chat with ${
        chat.otherUser?.first_name ||
        'this person'
      }?`
    )

    if (!confirmed) {
      return
    }

    const supabase = createClient()

    setCancellingId(chat.id)
    setError('')
    setSuccess('')

    // ============================================
    // GET CURRENT USER
    // ============================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/login')
      setCancellingId(null)
      return
    }

    // ============================================
    // VERIFY USER IS PART OF THE CHAT
    // ============================================

    const isInvolved =
      chat.organizer_id === user.id ||
      chat.participant_id === user.id

    if (!isInvolved) {
      setError(
        'You do not have permission to cancel this coffee chat.'
      )

      setCancellingId(null)
      return
    }

    // ============================================
    // UPDATE STATUS
    // ============================================

    const {
      error: cancelError,
    } = await supabase
      .from('coffee_chats')
      .update({
        status: 'cancelled',
      })
      .eq('id', chat.id)

    if (cancelError) {
      console.error(
        'Could not cancel coffee chat:',
        cancelError
      )

      setError(
        'Could not cancel the coffee chat. Please try again.'
      )

      setCancellingId(null)
      return
    }

    // ============================================
    // FIND OTHER USER
    // ============================================

    const otherUserId =
      chat.organizer_id === user.id
        ? chat.participant_id
        : chat.organizer_id

    // ============================================
    // CREATE NOTIFICATION
    // ============================================

    const currentUserName =
      `${user.user_metadata?.first_name || ''} ${
        user.user_metadata?.last_name || ''
      }`.trim()

    const displayName =
      currentUserName ||
      'Your connection'

    const {
      error: notificationError,
    } = await supabase
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: 'coffee_chat_cancelled',
        title: 'Coffee chat cancelled',
        message:
          `${displayName} cancelled your coffee chat scheduled for ${formatDate(
            chat.scheduled_date
          )} at ${formatTime(
            chat.start_time
          )}.`,
        related_user_id: user.id,
        related_match_id: chat.match_id,
        related_message_id: null,
        is_read: false,
      })

    if (notificationError) {
      console.error(
        'Coffee chat was cancelled, but notification could not be created:',
        notificationError
      )
    }

    // ============================================
    // UPDATE LOCAL STATE
    // ============================================

    setCoffeeChats((currentChats) =>
      currentChats.map((currentChat) =>
        currentChat.id === chat.id
          ? {
              ...currentChat,
              status: 'cancelled',
            }
          : currentChat
      )
    )

    setSuccess(
      'Coffee chat cancelled successfully.'
    )

    setCancellingId(null)
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            ☕
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your coffee chats...
          </p>

        </div>
      </main>
    )
  }

  // ============================================
  // SPLIT UPCOMING / PAST
  // ============================================

  const upcomingChats = coffeeChats.filter(
    (chat) =>
      chat.status !== 'cancelled' &&
      isUpcoming(chat)
  )

  const pastChats = coffeeChats.filter(
    (chat) =>
      chat.status === 'cancelled' ||
      !isUpcoming(chat)
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

      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 sm:py-12">

        {/* TITLE */}

        <section className="mb-10">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            BrewLink
          </p>

          {/* TEMPORARY ROUTE TEST */}

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            TEST 123
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500">
            Keep track of your upcoming meetings
            and past coffee chats.
          </p>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ============================================
            UPCOMING
        ============================================ */}

        <section>

          <div className="mb-4 flex items-center justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Upcoming
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Your next chats
              </h2>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push('/schedule')
              }
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              + Schedule
            </button>

          </div>

          {upcomingChats.length === 0 ? (

            <div className="rounded-3xl border border-gray-200/70 bg-white p-8 shadow-sm">

              <div className="text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  ☕
                </div>

                <h3 className="mt-4 text-lg font-semibold">
                  No upcoming coffee chats
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                  Connect with someone and schedule
                  a coffee chat to start building
                  your network.
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

            <div className="space-y-4">

              {upcomingChats.map((chat) => (

                <div
                  key={chat.id}
                  className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >

                  {/* TOP */}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* PERSON */}

                    <div className="flex items-center gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-700">
                        {(
                          chat.otherUser
                            ?.first_name || '?'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                          Coffee chat with
                        </p>

                        <h3 className="mt-1 text-xl font-bold">
                          {chat.otherUser
                            ?.first_name ||
                            'Unknown'}{' '}
                          {chat.otherUser
                            ?.last_name ||
                            ''}
                        </h3>

                      </div>

                    </div>

                    {/* STATUS */}

                    <div
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        chat.status === 'confirmed'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {chat.status === 'confirmed'
                        ? 'Confirmed'
                        : 'Scheduled'}
                    </div>

                  </div>

                  {/* DETAILS */}

                  <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                        Date
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDate(
                          chat.scheduled_date
                        )}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                        Time
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatTime(
                          chat.start_time
                        )}
                        {' – '}
                        {formatTime(
                          chat.end_time
                        )}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                        Location
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {chat.location}
                      </p>

                    </div>

                  </div>

                  {/* CANCEL */}

                  <div className="mt-5 border-t border-gray-100 pt-5">

                    <button
                      type="button"
                      onClick={() =>
                        cancelCoffeeChat(chat)
                      }
                      disabled={
                        cancellingId === chat.id
                      }
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {cancellingId === chat.id
                        ? 'Cancelling...'
                        : 'Cancel coffee chat'}
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* ============================================
            HISTORY
        ============================================ */}

        {pastChats.length > 0 && (

          <section className="mt-12">

            <div className="mb-4">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                History
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Past coffee chats
              </h2>

            </div>

            <div className="space-y-3">

              {pastChats.map((chat) => (

                <div
                  key={chat.id}
                  className="rounded-2xl border border-gray-200/70 bg-white p-5"
                >

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="font-semibold">
                        {chat.otherUser
                          ?.first_name ||
                          'Unknown'}{' '}
                        {chat.otherUser
                          ?.last_name ||
                          ''}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {formatDate(
                          chat.scheduled_date
                        )}{' '}
                        ·{' '}
                        {formatTime(
                          chat.start_time
                        )}
                      </p>

                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        chat.status ===
                        'cancelled'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {chat.status ===
                      'cancelled'
                        ? 'Cancelled'
                        : 'Completed'}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          </section>

        )}

      </div>

      {/* BOTTOM NAV */}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">

        <div className="mx-auto flex max-w-3xl justify-around px-3 py-4">

          <button
            type="button"
            onClick={() =>
              router.push('/dashboard')
            }
            className="flex flex-col items-center gap-1 px-3 text-xs text-gray-500 transition hover:text-black"
          >
            <span className="text-base">
              🏠
            </span>
            Home
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/discover')
            }
            className="flex flex-col items-center gap-1 px-3 text-xs text-gray-500 transition hover:text-black"
          >
            <span className="text-base">
              ✨
            </span>
            Discover
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/connections')
            }
            className="flex flex-col items-center gap-1 px-3 text-xs text-gray-500 transition hover:text-black"
          >
            <span className="text-base">
              👥
            </span>
            Connections
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/chats')
            }
            className="flex flex-col items-center gap-1 px-3 text-xs font-semibold text-black"
          >
            <span className="text-base">
              💬
            </span>
            Chats
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/profile')
            }
            className="flex flex-col items-center gap-1 px-3 text-xs text-gray-500 transition hover:text-black"
          >
            <span className="text-base">
              👤
            </span>
            Profile
          </button>

        </div>

      </nav>

    </main>
  )
}