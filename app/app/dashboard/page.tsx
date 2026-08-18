'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Profile = {
  first_name: string | null
  last_name: string | null
}

type CoffeeChat = {
  id: number
  status: string
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
}

export default function DashboardPage() {
  const router = useRouter()

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [connectionCount, setConnectionCount] =
    useState(0)

  const [unreadNotifications, setUnreadNotifications] =
    useState(0)

  const [upcomingChats, setUpcomingChats] =
    useState<CoffeeChat[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // ============================================
  // LOAD DASHBOARD
  // ============================================

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()

      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      // ============================================
      // LOAD PROFILE
      // ============================================

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(`
          first_name,
          last_name
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error(
          'Could not load profile:',
          profileError
        )
      } else {
        setProfile(profileData)
      }

      // ============================================
      // LOAD CONNECTIONS
      // ============================================

      const {
        data: connections,
        error: connectionsError,
      } = await supabase
        .from('connections')
        .select('id')
        .or(
          `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
        )
        .eq('status', 'accepted')

      if (connectionsError) {
        console.error(
          'Could not load connections:',
          connectionsError
        )
      } else {
        setConnectionCount(
          connections?.length || 0
        )
      }

      // ============================================
      // LOAD UNREAD NOTIFICATIONS
      // ============================================

      const {
        data: notifications,
        error: notificationsError,
      } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (notificationsError) {
        console.error(
          'Could not load notifications:',
          notificationsError
        )
      } else {
        setUnreadNotifications(
          notifications?.length || 0
        )
      }

      // ============================================
      // LOAD UPCOMING COFFEE CHATS
      // ============================================

      const {
        data: chats,
        error: chatsError,
      } = await supabase
        .from('coffee_chats')
        .select(`
          id,
          status,
          scheduled_date,
          start_time,
          end_time,
          location
        `)
        .or(
          `organizer_id.eq.${user.id},participant_id.eq.${user.id}`
        )
        .in('status', [
          'scheduled',
          'accepted',
          'confirmed',
        ])
        .order('scheduled_date', {
          ascending: true,
        })
        .order('start_time', {
          ascending: true,
        })
        .limit(20)

      if (chatsError) {
        console.error(
          'Could not load coffee chats:',
          chatsError
        )

        setError(
          'Could not load your upcoming coffee chats.'
        )
      } else {
        // ============================================
        // FILTER TO ONLY UPCOMING CHATS
        // ============================================

        const now = new Date()

        const upcoming = (chats || []).filter(
          (chat) => {
            if (
              !chat.scheduled_date ||
              !chat.start_time
            ) {
              return false
            }

            const chatDateTime = new Date(
              `${chat.scheduled_date}T${chat.start_time}`
            )

            return chatDateTime >= now
          }
        )

        setUpcomingChats(
          upcoming.slice(0, 3) as CoffeeChat[]
        )
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router])

  // ============================================
  // FORMAT CHAT DATE
  // ============================================

  function formatChatDate(
    scheduledDate: string | null,
    startTime: string | null,
    endTime: string | null
  ) {
    if (!scheduledDate || !startTime) {
      return 'Time not scheduled'
    }

    const dateTime = new Date(
      `${scheduledDate}T${startTime}`
    )

    const formattedDate =
      dateTime.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })

    const formattedStart =
      dateTime.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })

    let formattedEnd = ''

    if (endTime) {
      const endDateTime = new Date(
        `${scheduledDate}T${endTime}`
      )

      formattedEnd =
        endDateTime.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        })
    }

    if (formattedEnd) {
      return `${formattedDate} · ${formattedStart}–${formattedEnd}`
    }

    return `${formattedDate} · ${formattedStart}`
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
            Loading BrewLink...
          </p>

        </div>
      </main>
    )
  }

  // ============================================
  // NAME
  // ============================================

  const firstName =
    profile?.first_name || 'there'

  // ============================================
  // PAGE
  // ============================================

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-28">

      {/* HEADER */}

      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/90 backdrop-blur">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            onClick={() =>
              router.push('/dashboard')
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
          </button>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                router.push('/notifications')
              }
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-lg transition hover:bg-gray-100"
            >
              🔔

              {unreadNotifications > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
                  {unreadNotifications > 9
                    ? '9+'
                    : unreadNotifications}
                </span>
              )}
            </button>

            <button
              onClick={() =>
                router.push('/profile')
              }
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              Profile
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-12">

        {/* WELCOME */}

        <section className="mb-10">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Your BrewLink
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Hey, {firstName}.
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500">
            Build meaningful connections with
            students who share your interests,
            goals, and ambitions.
          </p>

        </section>

        {/* DISCOVER CTA */}

        <section className="mb-8">

          <button
            onClick={() =>
              router.push('/discover')
            }
            className="group w-full overflow-hidden rounded-[2rem] bg-black p-7 text-left text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-9"
          >

            <div className="flex items-center justify-between gap-6">

              <div>

                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
                  Start connecting
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Find your people.
                </h2>

                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
                  Discover students matched to your
                  major, career interests, and academic
                  year.
                </p>

              </div>

              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 text-3xl transition group-hover:scale-110 sm:flex">
                ✨
              </div>

            </div>

            <div className="mt-7 inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition group-hover:bg-gray-100">
              Discover students
              <span className="ml-2">
                →
              </span>
            </div>

          </button>

        </section>

        {/* STATS */}

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">

          <button
            onClick={() =>
              router.push('/connections')
            }
            className="rounded-2xl border border-gray-200/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              👥
            </div>

            <p className="mt-5 text-3xl font-bold">
              {connectionCount}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Connections
            </p>

          </button>

          <button
            onClick={() =>
              router.push('/notifications')
            }
            className="relative rounded-2xl border border-gray-200/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              🔔
            </div>

            <p className="mt-5 text-3xl font-bold">
              {unreadNotifications}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Unread
            </p>

          </button>

          <button
            onClick={() =>
              router.push('/schedule')
            }
            className="col-span-2 rounded-2xl border border-gray-200/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-1"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              📅
            </div>

            <p className="mt-5 text-3xl font-bold">
              {upcomingChats.length}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Upcoming chats
            </p>

          </button>

        </section>

        {/* UPCOMING COFFEE CHATS */}

        <section className="mb-8">

          <div className="mb-4 flex items-end justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Your schedule
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Upcoming coffee chats
              </h2>

            </div>

            <button
              onClick={() =>
                router.push('/schedule')
              }
              className="text-sm font-semibold text-gray-500 transition hover:text-black"
            >
              View all →
            </button>

          </div>

          {upcomingChats.length === 0 ? (

            <div className="rounded-3xl border border-gray-200/70 bg-white p-7 shadow-sm">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl">
                  ☕
                </div>

                <div>

                  <h3 className="font-semibold">
                    No upcoming coffee chats
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    Connect with someone in Discover
                    and schedule a time to meet.
                  </p>

                  <button
                    onClick={() =>
                      router.push('/discover')
                    }
                    className="mt-4 text-sm font-bold transition hover:opacity-60"
                  >
                    Find someone →
                  </button>

                </div>

              </div>

            </div>

          ) : (

            <div className="space-y-3">

              {upcomingChats.map(
                (chat) => (

                  <button
                    key={chat.id}
                    onClick={() =>
                      router.push('/schedule')
                    }
                    className="w-full rounded-2xl border border-gray-200/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl">
                        ☕
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="font-semibold">
                          Coffee chat
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatChatDate(
                            chat.scheduled_date,
                            chat.start_time,
                            chat.end_time
                          )}
                        </p>

                        {chat.location && (
                          <p className="mt-1 text-xs text-gray-400">
                            📍 {chat.location}
                          </p>
                        )}

                      </div>

                      <span className="text-gray-400">
                        →
                      </span>

                    </div>

                  </button>

                )
              )}

            </div>

          )}

        </section>

        {/* EXPLORE */}

        <section>

          <div className="mb-4">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Explore BrewLink
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              What do you want to do?
            </h2>

          </div>

          <div className="grid gap-3 sm:grid-cols-2">

            <button
              onClick={() =>
                router.push('/connections')
              }
              className="rounded-2xl border border-gray-200/70 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                  👥
                </div>

                <div>

                  <h3 className="font-semibold">
                    Connections
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    See your network and requests.
                  </p>

                </div>

              </div>

            </button>

            <button
              onClick={() =>
                router.push('/chats')
              }
              className="rounded-2xl border border-gray-200/70 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                  💬
                </div>

                <div>

                  <h3 className="font-semibold">
                    Messages
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Continue your conversations.
                  </p>

                </div>

              </div>

            </button>

            <button
              onClick={() =>
                router.push('/schedule')
              }
              className="rounded-2xl border border-gray-200/70 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                  📅
                </div>

                <div>

                  <h3 className="font-semibold">
                    Schedule
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Plan and manage coffee chats.
                  </p>

                </div>

              </div>

            </button>

            <button
              onClick={() =>
                router.push('/notifications')
              }
              className="rounded-2xl border border-gray-200/70 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                  🔔
                </div>

                <div className="flex-1">

                  <div className="flex items-center gap-2">

                    <h3 className="font-semibold">
                      Notifications
                    </h3>

                    {unreadNotifications > 0 && (
                      <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">
                        {unreadNotifications}
                      </span>
                    )}

                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Stay up to date with BrewLink.
                  </p>

                </div>

              </div>

            </button>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">

        <div className="mx-auto flex max-w-3xl justify-around px-3 py-4">

          <button
            onClick={() =>
              router.push('/dashboard')
            }
            className="flex flex-col items-center gap-1 px-3 text-xs font-semibold"
          >
            <span className="text-base">
              🏠
            </span>
            Home
          </button>

          <button
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
            onClick={() =>
              router.push('/chats')
            }
            className="flex flex-col items-center gap-1 px-3 text-xs text-gray-500 transition hover:text-black"
          >
            <span className="text-base">
              💬
            </span>
            Chats
          </button>

          <button
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