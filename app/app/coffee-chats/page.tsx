'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  useRouter,
  useSearchParams,
} from 'next/navigation'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
}

type Match = {
  id: number
  user_1_id: string
  user_2_id: string
  status: string | null
}

type CoffeeChat = {
  id: number
  match_id: number
  scheduled_date: string
  start_time: string
  end_time: string | null
  location: string | null
  status: string
  proposed_by: string | null
  responded_by: string | null
  responded_at: string | null
  otherUser: Profile | null
}

type ViewMode =
  | 'list'
  | 'calendar'

function CoffeeChatsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const requestedView =
    searchParams.get('view')

  const [coffeeChats, setCoffeeChats] = useState<CoffeeChat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [viewMode, setViewMode] =
    useState<ViewMode>(
      requestedView === 'calendar'
        ? 'calendar'
        : 'list'
    )

  const [calendarDate, setCalendarDate] =
    useState(() => new Date())

  const [cancellingId, setCancellingId] =
    useState<number | null>(null)

  const [respondingId, setRespondingId] =
    useState<number | null>(null)

  const [currentUserId, setCurrentUserId] =
    useState('')

  const [selectedChat, setSelectedChat] =
    useState<CoffeeChat | null>(null)

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

    setCurrentUserId(
      user.id
    )

    // ============================================
    // LOAD USER'S MATCHES
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
        status
      `)
      .or(
        `user_1_id.eq.${user.id},user_2_id.eq.${user.id}`
      )

    if (matchesError) {
      console.error(
        'Could not load matches:',
        matchesError
      )

      setError(
        'Could not load your coffee chats.'
      )

      setLoading(false)
      return
    }

    const userMatches =
      (matches || []) as Match[]

    if (userMatches.length === 0) {
      setCoffeeChats([])
      setLoading(false)
      return
    }

    const matchIds =
      userMatches.map(
        (match) => match.id
      )

    // ============================================
    // LOAD MEETINGS
    // ============================================

    const {
      data: meetings,
      error: meetingsError,
    } = await supabase
      .from('meetings')
      .select(`
        id,
        match_id,
        scheduled_date,
        start_time,
        end_time,
        location,
        status,
        proposed_by,
        responded_by,
        responded_at
      `)
      .in('match_id', matchIds)
      .order('scheduled_date', {
        ascending: true,
      })
      .order('start_time', {
        ascending: true,
      })

    if (meetingsError) {
      console.error(
        'Could not load meetings:',
        meetingsError
      )

      setError(
        'Could not load your coffee chats.'
      )

      setLoading(false)
      return
    }

    if (!meetings || meetings.length === 0) {
      setCoffeeChats([])
      setLoading(false)
      return
    }

    // ============================================
    // FIND OTHER USERS
    // ============================================

    const otherUserIds =
      userMatches.map((match) =>
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
    // COMBINE MEETING + MATCH + PROFILE
    // ============================================

    const formattedChats: CoffeeChat[] =
      meetings
        .filter(
          (meeting) =>
            meeting.match_id !== null &&
            meeting.scheduled_date !== null &&
            meeting.start_time !== null
        )
        .map((meeting) => {
          const match =
            userMatches.find(
              (item) =>
                item.id === meeting.match_id
            )

          let otherUser: Profile | null = null

          if (match) {
            const otherUserId =
              match.user_1_id === user.id
                ? match.user_2_id
                : match.user_1_id

            otherUser =
              profiles?.find(
                (profile) =>
                  profile.id === otherUserId
              ) || null
          }

          return {
            id: meeting.id,
            match_id: meeting.match_id as number,
            scheduled_date:
              meeting.scheduled_date as string,
            start_time:
              meeting.start_time as string,
            end_time:
              meeting.end_time,
            location:
              meeting.location,
            status:
              meeting.status || 'scheduled',
            proposed_by:
              meeting.proposed_by,
            responded_by:
              meeting.responded_by,
            responded_at:
              meeting.responded_at,
            otherUser,
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

  function getChatName(
    chat: CoffeeChat
  ) {
    const firstName =
      chat.otherUser?.first_name || ''

    const lastName =
      chat.otherUser?.last_name || ''

    return (
      `${firstName} ${lastName}`.trim() ||
      'Coffee chat'
    )
  }

  // ============================================
  // CALENDAR HELPERS
  // ============================================

  function dateToString(date: Date) {
    return (
      `${date.getFullYear()}-` +
      `${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-` +
      `${String(
        date.getDate()
      ).padStart(2, '0')}`
    )
  }

  function isToday(date: Date) {
    const today = new Date()

    return (
      date.getFullYear() ===
        today.getFullYear() &&
      date.getMonth() ===
        today.getMonth() &&
      date.getDate() ===
        today.getDate()
    )
  }

  function getCalendarDays() {
    const year =
      calendarDate.getFullYear()

    const month =
      calendarDate.getMonth()

    const firstDay =
      new Date(
        year,
        month,
        1
      )

    const lastDay =
      new Date(
        year,
        month + 1,
        0
      )

    const firstWeekday =
      firstDay.getDay()

    const totalDays =
      lastDay.getDate()

    const calendarDays:
      (Date | null)[] = []

    for (
      let i = 0;
      i < firstWeekday;
      i++
    ) {
      calendarDays.push(null)
    }

    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {
      calendarDays.push(
        new Date(
          year,
          month,
          day
        )
      )
    }

    while (
      calendarDays.length % 7 !== 0
    ) {
      calendarDays.push(null)
    }

    return calendarDays
  }

  function previousMonth() {
    setCalendarDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    )
  }

  function nextMonth() {
    setCalendarDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    )
  }

  function goToToday() {
    setCalendarDate(
      new Date()
    )
  }

  function getChatsForDate(
    date: Date
  ) {
    const dateString =
      dateToString(date)

    return upcomingChats.filter(
      (chat) =>
        chat.scheduled_date ===
        dateString
    )
  }

  // ============================================
  // RESPOND TO COFFEE CHAT REQUEST
  // ============================================

  async function respondToCoffeeChatRequest(
    chat: CoffeeChat,
    response: 'accepted' | 'declined'
  ) {
    if (
      respondingId !== null ||
      !currentUserId
    ) {
      return
    }

    if (
      chat.status !== 'pending' ||
      chat.proposed_by === currentUserId
    ) {
      return
    }

    const supabase = createClient()

    setRespondingId(chat.id)
    setError('')
    setSuccess('')

    const newStatus =
      response === 'accepted'
        ? 'scheduled'
        : 'declined'

    const {
      error: updateError,
    } = await supabase
      .from('meetings')
      .update({
        status: newStatus,
        responded_by: currentUserId,
        responded_at:
          new Date().toISOString(),
      })
      .eq('id', chat.id)
      .eq('match_id', chat.match_id)
      .eq('status', 'pending')

    if (updateError) {
      console.error(
        'Could not respond to coffee chat request:',
        updateError
      )

      setError(
        `Could not ${response === 'accepted' ? 'accept' : 'decline'} this coffee chat request. Please try again.`
      )

      setRespondingId(null)
      return
    }

    setCoffeeChats(
      (currentChats) =>
        currentChats.map(
          (currentChat) =>
            currentChat.id === chat.id
              ? {
                  ...currentChat,
                  status: newStatus,
                  responded_by:
                    currentUserId,
                  responded_at:
                    new Date().toISOString(),
                }
              : currentChat
        )
    )

    setSuccess(
      response === 'accepted'
        ? 'Coffee chat accepted. It is now confirmed and has been added to your upcoming chats.'
        : 'Coffee chat request declined.'
    )

    setRespondingId(null)
  }

  // ============================================
  // CANCEL COFFEE CHAT
  // ============================================

  async function cancelCoffeeChat(
    chat: CoffeeChat
  ) {
    if (cancellingId !== null) {
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
    // VERIFY USER BELONGS TO MATCH
    // ============================================

    const {
      data: match,
      error: matchError,
    } = await supabase
      .from('matches')
      .select(`
        id,
        user_1_id,
        user_2_id
      `)
      .eq('id', chat.match_id)
      .single()

    if (
      matchError ||
      !match ||
      (
        match.user_1_id !== user.id &&
        match.user_2_id !== user.id
      )
    ) {
      setError(
        'You do not have permission to cancel this coffee chat.'
      )

      setCancellingId(null)
      return
    }

    // ============================================
    // UPDATE MEETING STATUS
    // ============================================

    const {
      error: cancelError,
    } = await supabase
      .from('meetings')
      .update({
        status: 'cancelled',
      })
      .eq('id', chat.id)
      .eq('match_id', chat.match_id)

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
    // UPDATE LOCAL STATE
    // ============================================

    setCoffeeChats((currentChats) =>
      currentChats.map(
        (currentChat) =>
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

  const pendingIncomingChats =
    coffeeChats.filter(
      (chat) =>
        chat.status === 'pending' &&
        chat.proposed_by !== currentUserId &&
        isUpcoming(chat)
    )

  const upcomingChats =
    coffeeChats.filter(
      (chat) =>
        chat.status === 'scheduled' &&
        isUpcoming(chat)
    )

  const pastChats =
    coffeeChats.filter(
      (chat) =>
        chat.status === 'cancelled' ||
        chat.status === 'completed' ||
        (
          chat.status === 'scheduled' &&
          !isUpcoming(chat)
        )
    )

  const calendarDays =
    getCalendarDays()

  const calendarMonth =
    calendarDate.toLocaleDateString(
      [],
      {
        month: 'long',
        year: 'numeric',
      }
    )

  const weekdays = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ]

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

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-12">

        {/* TITLE */}

        <section className="mb-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                BrewLink
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                Coffee Chats
              </h1>

              <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500">
                Keep track of your upcoming meetings
                and past coffee chats.
              </p>

            </div>

            {/* VIEW TOGGLE */}

            <div className="flex w-fit rounded-xl border border-gray-200 bg-white p-1 shadow-sm">

              <button
                type="button"
                onClick={() =>
                  setViewMode('list')
                }
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-black text-white'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                ☰ List
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewMode('calendar')
                }
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  viewMode === 'calendar'
                    ? 'bg-black text-white'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                📅 Calendar
              </button>

            </div>

          </div>

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
            COFFEE CHAT REQUESTS
        ============================================ */}

        {pendingIncomingChats.length > 0 && (

          <section
            id="requests"
            className="mb-8 scroll-mt-24"
          >

            <div className="mb-5">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Requests
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                Coffee chat requests
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Review proposed coffee chats before they are added to your schedule.
              </p>

            </div>

            <div className="space-y-3">

              {pendingIncomingChats.map(
                (chat) => (

                  <div
                    key={chat.id}
                    className="overflow-hidden rounded-[1.5rem] border border-gray-200/80 bg-white shadow-sm"
                  >

                    <div className="p-5 sm:p-6">

                      <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                          ☕
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                            Coffee chat request from
                          </p>

                          <h3 className="mt-1 text-xl font-bold tracking-tight">
                            {getChatName(
                              chat
                            )}
                          </h3>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">

                            <div className="rounded-2xl bg-gray-50 p-3.5">

                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Date
                              </p>

                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                {formatDate(
                                  chat.scheduled_date
                                )}
                              </p>

                            </div>

                            <div className="rounded-2xl bg-gray-50 p-3.5">

                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Time
                              </p>

                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                {formatTime(
                                  chat.start_time
                                )}

                                {chat.end_time && (
                                  <>
                                    {' – '}
                                    {formatTime(
                                      chat.end_time
                                    )}
                                  </>
                                )}
                              </p>

                            </div>

                            <div className="rounded-2xl bg-gray-50 p-3.5">

                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Location
                              </p>

                              <p className="mt-2 break-words text-sm font-semibold text-gray-900">
                                {chat.location ||
                                  'Location not set'}
                              </p>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-gray-100 bg-gray-50/60 p-4 sm:px-6">

                      <button
                        type="button"
                        onClick={() =>
                          respondToCoffeeChatRequest(
                            chat,
                            'declined'
                          )
                        }
                        disabled={
                          respondingId ===
                          chat.id
                        }
                        className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {respondingId === chat.id
                          ? 'Updating...'
                          : 'Decline'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          respondToCoffeeChatRequest(
                            chat,
                            'accepted'
                          )
                        }
                        disabled={
                          respondingId ===
                          chat.id
                        }
                        className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {respondingId === chat.id
                          ? 'Updating...'
                          : 'Accept'}
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </section>

        )}

        {/* ============================================
            CALENDAR VIEW
        ============================================ */}

        {viewMode === 'calendar' && (

          <section>

            {/* CALENDAR HEADER */}

            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Calendar
                </p>

                <h2 className="mt-1 text-3xl font-bold tracking-tight">
                  {calendarMonth}
                </h2>

              </div>

              <div className="flex flex-wrap items-center gap-2">

                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Today
                </button>

                <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                  <button
                    type="button"
                    onClick={previousMonth}
                    className="flex h-10 w-10 items-center justify-center border-r border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-black"
                    aria-label="Previous month"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={nextMonth}
                    className="flex h-10 w-10 items-center justify-center text-gray-600 transition hover:bg-gray-50 hover:text-black"
                    aria-label="Next month"
                  >
                    →
                  </button>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push('/schedule')
                  }
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  + Schedule
                </button>

              </div>

            </div>

            {/* CALENDAR */}

            <div className="overflow-x-auto rounded-[1.75rem] border border-gray-200/80 bg-white shadow-sm">

              <div className="min-w-[760px]">

                {/* WEEK DAYS */}

                <div className="grid grid-cols-7 border-b border-gray-200 bg-[#fafaf9]">

                  {weekdays.map(
                    (weekday) => (
                      <div
                        key={weekday}
                        className="border-r border-gray-100 px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 last:border-r-0"
                      >
                        {weekday}
                      </div>
                    )
                  )}

                </div>

                {/* DAYS */}

                <div className="grid grid-cols-7">

                  {calendarDays.map(
                    (
                      date,
                      index
                    ) => {

                      if (!date) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="min-h-32 border-b border-r border-gray-100 bg-[#fafaf9]/70 p-2"
                          />
                        )
                      }

                      const chatsForDate =
                        getChatsForDate(date)

                      const today =
                        isToday(date)

                      return (
                        <div
                          key={
                            date.toISOString()
                          }
                          className={`min-h-32 border-b border-r border-gray-100 p-2.5 transition-colors ${
                            today
                              ? 'bg-gray-50/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]'
                              : 'bg-white hover:bg-gray-50/50'
                          }`}
                        >

                          {/* DAY NUMBER */}

                          <div className="flex items-center justify-between">

                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                                today
                                  ? 'bg-black text-white shadow-sm'
                                  : 'text-gray-600'
                              }`}
                            >
                              {date.getDate()}
                            </div>

                            {today && (
                              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                Today
                              </span>
                            )}

                          </div>

                          {/* EVENTS */}

                          <div className="mt-2.5 space-y-1.5">

                            {chatsForDate.map(
                              (chat) => (

                                <button
                                  key={chat.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedChat(
                                      chat
                                    )
                                  }
                                  className="group w-full rounded-xl border border-gray-200/80 bg-gray-50 px-2.5 py-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white hover:shadow-md"
                                >

                                  {/* TIME */}

                                  <div className="flex items-center gap-1.5">

                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black" />

                                    <p className="truncate text-[11px] font-bold text-gray-900">
                                      {formatTime(
                                        chat.start_time
                                      )}
                                    </p>

                                  </div>

                                  {/* PERSON */}

                                  <p className="mt-1 truncate text-[12px] font-semibold text-gray-700 transition group-hover:text-black">
                                    {getChatName(
                                      chat
                                    )}
                                  </p>

                                  {/* LOCATION */}

                                  {chat.location && (
                                    <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-gray-400">

                                      <span>
                                        📍
                                      </span>

                                      <span className="truncate">
                                        {chat.location}
                                      </span>

                                    </p>
                                  )}

                                </button>

                              )
                            )}

                          </div>

                        </div>
                      )
                    }
                  )}

                </div>

              </div>

            </div>

            {/* CALENDAR HELPER */}

            <div className="mt-4 flex items-center justify-between">

              <p className="text-xs text-gray-400">
                Click a coffee chat to view details.
              </p>

              <p className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-400 shadow-sm">
                {upcomingChats.length}{' '}
                upcoming
              </p>

            </div>

          </section>

        )}

        {/* ============================================
            LIST VIEW
        ============================================ */}

        {viewMode === 'list' && (
          <>

            {/* ============================================
                UPCOMING
            ============================================ */}

            <section>

              <div className="mb-5 flex items-end justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Upcoming
                  </p>

                  <h2 className="mt-1 text-3xl font-bold tracking-tight">
                    Your next chats
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Quickly see who you&apos;re meeting,
                    when, and where.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push('/schedule')
                  }
                  className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  + Schedule
                </button>

              </div>

              {upcomingChats.length === 0 ? (

                <div className="rounded-[1.75rem] border border-gray-200/80 bg-white p-10 shadow-sm">

                  <div className="text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-2xl">
                      ☕
                    </div>

                    <h3 className="mt-5 text-lg font-bold">
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
                        router.push('/connections')
                      }
                      className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                    >
                      View connections →
                    </button>

                  </div>

                </div>

              ) : (

                <div className="space-y-3">

                  {upcomingChats.map((chat) => (

                    <div
                      key={chat.id}
                      className="group overflow-hidden rounded-[1.5rem] border border-gray-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                    >

                      <div className="p-5 sm:p-6">

                        {/* TOP */}

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                          {/* PERSON */}

                          <div className="flex min-w-0 items-center gap-4">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-base font-bold text-gray-700">
                              {(
                                chat.otherUser
                                  ?.first_name || '?'
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">

                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                                Coffee chat with
                              </p>

                              <h3 className="mt-1 truncate text-xl font-bold tracking-tight">
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

                          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600">

                            <span className="h-1.5 w-1.5 rounded-full bg-black" />

                            Scheduled

                          </div>

                        </div>

                        {/* DETAILS */}

                        <div className="mt-5 grid gap-3 border-t border-gray-100 pt-5 sm:grid-cols-3">

                          {/* DATE */}

                          <div className="rounded-2xl bg-gray-50 p-3.5">

                            <div className="flex items-center gap-2">

                              <span className="text-sm">
                                📅
                              </span>

                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Date
                              </p>

                            </div>

                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              {formatDate(
                                chat.scheduled_date
                              )}
                            </p>

                          </div>

                          {/* TIME */}

                          <div className="rounded-2xl bg-gray-50 p-3.5">

                            <div className="flex items-center gap-2">

                              <span className="text-sm">
                                🕐
                              </span>

                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Time
                              </p>

                            </div>

                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              {formatTime(
                                chat.start_time
                              )}

                              {chat.end_time && (
                                <>
                                  {' – '}
                                  {formatTime(
                                    chat.end_time
                                  )}
                                </>
                              )}
                            </p>

                          </div>

                          {/* LOCATION */}

                          <div className="rounded-2xl bg-gray-50 p-3.5">

                            <div className="flex items-center gap-2">

                              <span className="text-sm">
                                📍
                              </span>

                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Location
                              </p>

                            </div>

                            <p className="mt-2 break-words text-sm font-semibold text-gray-900">
                              {chat.location ||
                                'Location not set'}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedChat(
                              chat
                            )
                          }
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                        >
                          View details
                        </button>

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/chats/${chat.match_id}`
                              )
                            }
                            className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:flex-none"
                          >
                            Message
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              cancelCoffeeChat(chat)
                            }
                            disabled={
                              cancellingId === chat.id
                            }
                            className="flex-1 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          >
                            {cancellingId === chat.id
                              ? 'Cancelling...'
                              : 'Cancel'}
                          </button>

                        </div>

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

                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    Past coffee chats
                  </h2>

                </div>

                <div className="space-y-2.5">

                  {pastChats.map((chat) => (

                    <div
                      key={chat.id}
                      className="rounded-2xl border border-gray-200/80 bg-white px-5 py-4 shadow-sm"
                    >

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600">
                            {(
                              chat.otherUser
                                ?.first_name || '?'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <p className="font-semibold text-gray-900">
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

                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-[11px] font-semibold ${
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

          </>
        )}

      </div>

      {/* ============================================
          CALENDAR EVENT POPUP
      ============================================ */}

      {selectedChat && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 backdrop-blur-[2px]"
          onClick={() =>
            setSelectedChat(null)
          }
        >

          <div
            className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* TOP */}

            <div className="p-6">

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base">
                      ☕
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Coffee chat
                    </p>

                  </div>

                  <h2 className="mt-4 truncate text-2xl font-bold tracking-tight">
                    {getChatName(
                      selectedChat
                    )}
                  </h2>

                  <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Scheduled
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedChat(null)
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-gray-200 hover:text-black"
                  aria-label="Close coffee chat details"
                >
                  ×
                </button>

              </div>

            </div>

            {/* DETAILS */}

            <div className="border-t border-gray-100 px-6 py-5">

              <div className="space-y-4">

                {/* DATE */}

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sm">
                    📅
                  </div>

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                      Date
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatDate(
                        selectedChat.scheduled_date
                      )}
                    </p>

                  </div>

                </div>

                {/* TIME */}

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sm">
                    🕐
                  </div>

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                      Time
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatTime(
                        selectedChat.start_time
                      )}

                      {selectedChat.end_time && (
                        <>
                          {' – '}
                          {formatTime(
                            selectedChat.end_time
                          )}
                        </>
                      )}
                    </p>

                  </div>

                </div>

                {/* LOCATION */}

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sm">
                    📍
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                      Location
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {selectedChat.location ||
                        'Location not set'}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="border-t border-gray-100 bg-gray-50/60 p-5">

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/chats/${selectedChat.match_id}`
                    )
                  }
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Message
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedChat(null)
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

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
            className="flex flex-col items-center gap-1 px-3 text-xs text-gray-500 transition hover:text-black"
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

export default function CoffeeChatsPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <CoffeeChatsPageContent />
    </Suspense>
  )
}
