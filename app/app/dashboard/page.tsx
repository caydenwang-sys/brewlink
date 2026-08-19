'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

type Profile = {
  first_name: string | null
  last_name: string | null
}

type Match = {
  id: number
  user_1_id: string
  user_2_id: string
  status: string | null
}

type Meeting = {
  id: number
  match_id: number | null
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  status: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [connectionCount, setConnectionCount] =
    useState(0)

  const [unreadNotifications, setUnreadNotifications] =
    useState(0)

  const [upcomingMeetings, setUpcomingMeetings] =
    useState<Meeting[]>([])

  const [matches, setMatches] =
    useState<Match[]>([])

  const [chatProfiles, setChatProfiles] =
    useState<Record<string, Profile>>({})

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [userId, setUserId] =
    useState('')

  // ============================================
  // LOAD UPCOMING MEETINGS
  // ============================================

  const loadUpcomingMeetings = useCallback(
    async (currentUserId: string) => {

      // ------------------------------------------
      // GET USER'S MATCHES
      // ------------------------------------------

      const {
        data: matchData,
        error: matchError,
      } =
        await supabase
          .from('matches')
          .select(`
            id,
            user_1_id,
            user_2_id,
            status
          `)
          .or(
            `user_1_id.eq.${currentUserId},user_2_id.eq.${currentUserId}`
          )
          .eq('status', 'active')

      if (matchError) {
        console.error(
          'Could not load matches:',
          matchError
        )

        setError(
          'Could not load your upcoming coffee chats.'
        )

        return
      }

      const loadedMatches =
        (matchData || []) as Match[]

      setMatches(loadedMatches)

      // ------------------------------------------
      // GET MATCH IDS
      // ------------------------------------------

      const matchIds =
        loadedMatches.map(
          (match) => match.id
        )

      if (matchIds.length === 0) {
        setUpcomingMeetings([])
        setChatProfiles({})
        return
      }

      // ------------------------------------------
      // GET MEETINGS
      // ------------------------------------------

      const {
        data: meetingData,
        error: meetingError,
      } =
        await supabase
          .from('meetings')
          .select(`
            id,
            match_id,
            scheduled_date,
            start_time,
            end_time,
            location,
            status
          `)
          .in('match_id', matchIds)
          .neq('status', 'cancelled')
          .order('scheduled_date', {
            ascending: true,
          })
          .order('start_time', {
            ascending: true,
          })
          .limit(20)

      if (meetingError) {
        console.error(
          'Could not load meetings:',
          meetingError
        )

        setError(
          'Could not load your upcoming coffee chats.'
        )

        return
      }

      // ------------------------------------------
      // ONLY KEEP FUTURE MEETINGS
      // ------------------------------------------

      const now = new Date()

      const upcoming =
        (meetingData ?? []).filter(
          (meeting) => {

            if (
              !meeting.scheduled_date ||
              !meeting.start_time
            ) {
              return false
            }

            const meetingDateTime =
              new Date(
                `${meeting.scheduled_date}T${meeting.start_time}`
              )

            return meetingDateTime >= now
          }
        ) as Meeting[]

      setUpcomingMeetings(
        upcoming.slice(0, 3)
      )

      // ------------------------------------------
      // GET OTHER USERS
      // ------------------------------------------

      const otherUserIds: string[] = []

      upcoming.forEach(
        (meeting) => {

          const match =
            loadedMatches.find(
              (item) =>
                item.id ===
                meeting.match_id
            )

          if (!match) {
            return
          }

          const otherUserId =
            match.user_1_id ===
            currentUserId
              ? match.user_2_id
              : match.user_1_id

          otherUserIds.push(
            otherUserId
          )
        }
      )

      const uniqueOtherUserIds =
        [...new Set(otherUserIds)]

      if (
        uniqueOtherUserIds.length === 0
      ) {
        setChatProfiles({})
        return
      }

      // ------------------------------------------
      // GET PROFILES
      // ------------------------------------------

      const {
        data: profileData,
        error: profileError,
      } =
        await supabase
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

      if (profileError) {
        console.error(
          'Could not load meeting profiles:',
          profileError
        )

        return
      }

      const profileMap:
        Record<string, Profile> = {}

      ;(profileData ?? []).forEach(
        (profile) => {
          profileMap[
            profile.id
          ] = profile
        }
      )

      setChatProfiles(
        profileMap
      )
    },
    [supabase]
  )

  // ============================================
  // LOAD DASHBOARD DATA
  // ============================================

  const loadDashboardData =
    useCallback(
      async (
        currentUserId: string
      ) => {

        setError('')

        // ========================================
        // PROFILE
        // ========================================

        const {
          data: profileData,
          error: profileError,
        } =
          await supabase
            .from('profiles')
            .select(
              'first_name, last_name'
            )
            .eq(
              'id',
              currentUserId
            )
            .single()

        if (profileError) {
          console.error(
            'Could not load profile:',
            profileError
          )
        } else {
          setProfile(
            profileData
          )
        }

        // ========================================
        // CONNECTIONS
        // ========================================

        const {
          data: connections,
          error: connectionsError,
        } =
          await supabase
            .from('connections')
            .select('id')
            .or(
              `sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
            )
            .eq(
              'status',
              'accepted'
            )

        if (connectionsError) {
          console.error(
            'Could not load connections:',
            connectionsError
          )
        } else {
          setConnectionCount(
            connections?.length ?? 0
          )
        }

        // ========================================
        // NOTIFICATIONS
        // ========================================

        const {
          data: notifications,
          error: notificationsError,
        } =
          await supabase
            .from('notifications')
            .select('id')
            .eq(
              'user_id',
              currentUserId
            )
            .eq(
              'is_read',
              false
            )

        if (notificationsError) {
          console.error(
            'Could not load notifications:',
            notificationsError
          )
        } else {
          setUnreadNotifications(
            notifications?.length ?? 0
          )
        }

        // ========================================
        // MEETINGS
        // ========================================

        await loadUpcomingMeetings(
          currentUserId
        )

        setLoading(false)
      },
      [
        supabase,
        loadUpcomingMeetings,
      ]
    )

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {

    async function initialize() {

      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser()

      if (
        userError ||
        !user
      ) {
        router.push('/login')
        return
      }

      setUserId(
        user.id
      )

      await loadDashboardData(
        user.id
      )
    }

    initialize()

  }, [
    router,
    supabase,
    loadDashboardData,
  ])

  // ============================================
  // REALTIME DASHBOARD UPDATES
  // ============================================

  useEffect(() => {

    if (!userId) {
      return
    }

    console.log(
      `Starting dashboard realtime listeners for ${userId}`
    )

    // ==========================================
    // NOTIFICATIONS
    // ==========================================

    const notificationChannel =
      supabase
        .channel(
          `dashboard-notifications-${userId}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter:
              `user_id=eq.${userId}`,
          },
          async () => {

            const {
              data,
              error,
            } =
              await supabase
                .from('notifications')
                .select('id')
                .eq(
                  'user_id',
                  userId
                )
                .eq(
                  'is_read',
                  false
                )

            if (error) {
              console.error(
                'Could not refresh notifications:',
                error
              )

              return
            }

            setUnreadNotifications(
              data?.length ?? 0
            )
          }
        )
        .subscribe()

    // ==========================================
    // CONNECTIONS
    // ==========================================

    const connectionChannel =
      supabase
        .channel(
          `dashboard-connections-${userId}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'connections',
          },
          async () => {

            const {
              data,
              error,
            } =
              await supabase
                .from('connections')
                .select('id')
                .or(
                  `sender_id.eq.${userId},receiver_id.eq.${userId}`
                )
                .eq(
                  'status',
                  'accepted'
                )

            if (error) {
              console.error(
                'Could not refresh connections:',
                error
              )

              return
            }

            setConnectionCount(
              data?.length ?? 0
            )
          }
        )
        .subscribe()

    // ==========================================
    // MEETINGS
    // ==========================================

    const meetingChannel =
      supabase
        .channel(
          `dashboard-meetings-${userId}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meetings',
          },
          async () => {

            console.log(
              'Dashboard meeting changed'
            )

            await loadUpcomingMeetings(
              userId
            )
          }
        )
        .subscribe()

    // ==========================================
    // CLEANUP
    // ==========================================

    return () => {

      console.log(
        'Removing dashboard realtime listeners'
      )

      supabase.removeChannel(
        notificationChannel
      )

      supabase.removeChannel(
        connectionChannel
      )

      supabase.removeChannel(
        meetingChannel
      )
    }

  }, [
    userId,
    supabase,
    loadUpcomingMeetings,
  ])

  // ============================================
  // GET MEETING PARTNER
  // ============================================

  function getMeetingPartner(
    meeting: Meeting
  ) {

    const match =
      matches.find(
        (item) =>
          item.id ===
          meeting.match_id
      )

    if (!match) {
      return null
    }

    const otherUserId =
      match.user_1_id === userId
        ? match.user_2_id
        : match.user_1_id

    return (
      chatProfiles[
        otherUserId
      ] || null
    )
  }

  function getMeetingPartnerName(
    meeting: Meeting
  ) {

    const partner =
      getMeetingPartner(
        meeting
      )

    if (!partner) {
      return 'BrewLink match'
    }

    const fullName =
      (
        `${partner.first_name || ''} ` +
        `${partner.last_name || ''}`
      ).trim()

    return (
      fullName ||
      'BrewLink match'
    )
  }

  // ============================================
  // FORMAT MEETING DATE
  // ============================================

  function formatMeetingDate(
    scheduledDate: string | null,
    startTime: string | null,
    endTime: string | null
  ) {

    if (
      !scheduledDate ||
      !startTime
    ) {
      return 'Time not scheduled'
    }

    const dateTime =
      new Date(
        `${scheduledDate}T${startTime}`
      )

    const formattedDate =
      dateTime.toLocaleDateString(
        [],
        {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }
      )

    const formattedStart =
      dateTime.toLocaleTimeString(
        [],
        {
          hour: 'numeric',
          minute: '2-digit',
        }
      )

    let formattedEnd = ''

    if (endTime) {

      const endDateTime =
        new Date(
          `${scheduledDate}T${endTime}`
        )

      formattedEnd =
        endDateTime.toLocaleTimeString(
          [],
          {
            hour: 'numeric',
            minute: '2-digit',
          }
        )
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
    profile?.first_name ||
    'there'

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
              router.push(
                '/dashboard'
              )
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
          </button>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                router.push(
                  '/notifications'
                )
              }
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-lg transition hover:bg-gray-100"
            >
              🔔

              {unreadNotifications >
                0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
                  {unreadNotifications >
                  9
                    ? '9+'
                    : unreadNotifications}
                </span>
              )}

            </button>

            <button
              onClick={() =>
                router.push(
                  '/settings'
                )
              }
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              Settings
            </button>

            <button
              onClick={() =>
                router.push(
                  '/profile'
                )
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
              router.push(
                '/discover'
              )
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
              router.push(
                '/connections'
              )
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
              router.push(
                '/notifications'
              )
            }
            className="rounded-2xl border border-gray-200/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
              router.push(
                '/coffee-chats?view=calendar'
              )
            }
            className="col-span-2 rounded-2xl border border-gray-200/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-1"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              📅
            </div>

            <p className="mt-5 text-3xl font-bold">
              {
                upcomingMeetings.length
              }
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
                router.push(
                  '/coffee-chats?view=calendar'
                )
              }
              className="text-sm font-semibold text-gray-500 transition hover:text-black"
            >
              View all →
            </button>

          </div>

          {upcomingMeetings.length ===
          0 ? (

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
                      router.push(
                        '/discover'
                      )
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

              {upcomingMeetings.map(
                (meeting) => (

                  <button
                    key={meeting.id}
                    onClick={() =>
                      router.push(
                        '/coffee-chats?view=calendar'
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl">
                        ☕
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="font-semibold">
                          Coffee chat with{' '}
                          {getMeetingPartnerName(
                            meeting
                          )}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatMeetingDate(
                            meeting.scheduled_date,
                            meeting.start_time,
                            meeting.end_time
                          )}
                        </p>

                        {meeting.location && (
                          <p className="mt-1 text-xs text-gray-400">
                            📍{' '}
                            {meeting.location}
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
                router.push(
                  '/connections'
                )
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
                router.push(
                  '/chats'
                )
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
                router.push(
                  '/schedule'
                )
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
                router.push(
                  '/notifications'
                )
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

                    {unreadNotifications >
                      0 && (
                      <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">
                        {
                          unreadNotifications
                        }
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

      <BottomNav />

    </main>
  )
}