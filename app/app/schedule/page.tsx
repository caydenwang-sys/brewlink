'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  useRouter,
  useSearchParams,
} from 'next/navigation'

type Match = {
  id: number
  user_1_id: string
  user_2_id: string
  status: string | null
}

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  major: string | null
  career_goal: string | null
}

type Availability = {
  id: number
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
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

type OverlappingTime = {
  day_of_week: number
  start_time: string
  end_time: string
  date: string
}

// ============================================
// TIME HELPERS
// ============================================

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

// ============================================
// DATE HELPERS
// ============================================

function getNextDateForDay(dayOfWeek: number) {
  const today = new Date()

  // JavaScript:
  // Sunday = 0
  // Monday = 1
  // ...
  // Saturday = 6
  //
  // BrewLink:
  // Monday = 1
  // ...
  // Sunday = 7

  const currentDay =
    today.getDay() === 0
      ? 7
      : today.getDay()

  let difference =
    dayOfWeek - currentDay

  // Always use the next occurrence.
  // If availability is Monday and today is Monday,
  // use next Monday rather than today.
  if (difference <= 0) {
    difference += 7
  }

  const result = new Date(today)

  result.setDate(
    today.getDate() + difference
  )

  return result
}

function formatDate(dateString: string) {
  const date = new Date(
    `${dateString}T00:00:00`
  )

  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function dateToString(date: Date) {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, '0')}-` +
    `${String(date.getDate()).padStart(2, '0')}`
  )
}

// ============================================
// COMPONENT
// ============================================

export default function SchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const requestedMatch =
    searchParams.get('match')

  const requestedMatchId =
    requestedMatch
      ? Number(requestedMatch)
      : null

  const [userId, setUserId] =
    useState<string | null>(null)

  const [matches, setMatches] =
    useState<Match[]>([])

  const [profiles, setProfiles] =
    useState<Record<string, Profile>>({})

  const [availability, setAvailability] =
    useState<Availability[]>([])

  const [meetings, setMeetings] =
    useState<Meeting[]>([])

  const [selectedMatch, setSelectedMatch] =
    useState<Match | null>(null)

  const [overlappingTimes, setOverlappingTimes] =
    useState<OverlappingTime[]>([])

  const [loading, setLoading] =
    useState(true)

  const [loadingTimes, setLoadingTimes] =
    useState(false)

  const [scheduling, setScheduling] =
    useState(false)

  const [cancelling, setCancelling] =
    useState<number | null>(null)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [location, setLocation] =
    useState('')

  // ============================================
  // LOAD SCHEDULE DATA
  // ============================================

  useEffect(() => {
    async function loadSchedule() {
      const supabase = createClient()

      setLoading(true)
      setError('')

      // ------------------------------------------
      // GET CURRENT USER
      // ------------------------------------------

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // ------------------------------------------
      // GET MATCHES
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
            `user_1_id.eq.${user.id},user_2_id.eq.${user.id}`
          )
          .eq('status', 'active')

      if (matchError) {
        console.error(matchError)

        setError(
          `Could not load your matches: ${matchError.message}`
        )

        setLoading(false)
        return
      }

      const loadedMatches =
        (matchData || []) as Match[]

      setMatches(loadedMatches)

      // ------------------------------------------
      // GET OTHER USER IDS
      // ------------------------------------------

      const otherUserIds =
        loadedMatches.map((match) =>
          match.user_1_id === user.id
            ? match.user_2_id
            : match.user_1_id
        )

      // ------------------------------------------
      // GET PROFILES
      // ------------------------------------------

      if (otherUserIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } =
          await supabase
            .from('profiles')
            .select(`
              id,
              first_name,
              last_name,
              major,
              career_goal
            `)
            .in('id', otherUserIds)

        if (profileError) {
          console.error(profileError)

          setError(
            `Could not load your match profiles: ${profileError.message}`
          )

          setLoading(false)
          return
        }

        const profileMap:
          Record<string, Profile> = {}

        ;(profileData || []).forEach(
          (profile) => {
            profileMap[profile.id] =
              profile as Profile
          }
        )

        setProfiles(profileMap)
      }

      // ------------------------------------------
      // GET MY AVAILABILITY
      // ------------------------------------------

      const {
        data: myAvailability,
        error: availabilityError,
      } =
        await supabase
          .from('availability')
          .select(`
            id,
            user_id,
            day_of_week,
            start_time,
            end_time
          `)
          .eq('user_id', user.id)

      if (availabilityError) {
        console.error(
          availabilityError
        )

        setError(
          `Could not load your availability: ${availabilityError.message}`
        )

        setLoading(false)
        return
      }

      setAvailability(
        (myAvailability || []) as Availability[]
      )

      // ------------------------------------------
      // GET EXISTING MEETINGS
      // ------------------------------------------

      const matchIds =
        loadedMatches.map(
          (match) => match.id
        )

      if (matchIds.length > 0) {
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
            .order(
              'scheduled_date',
              {
                ascending: true,
              }
            )

        if (meetingError) {
          console.error(
            meetingError
          )

          setError(
            `Could not load your scheduled meetings: ${meetingError.message}`
          )

          setLoading(false)
          return
        }

        setMeetings(
          (meetingData || []) as Meeting[]
        )
      }

      setLoading(false)
    }

    loadSchedule()
  }, [router])

  // ============================================
  // GET OTHER USER
  // ============================================

  function getOtherUserId(match: Match) {
    if (!userId) {
      return null
    }

    return match.user_1_id === userId
      ? match.user_2_id
      : match.user_1_id
  }

  function getOtherProfile(match: Match) {
    const otherUserId =
      getOtherUserId(match)

    if (!otherUserId) {
      return null
    }

    return profiles[otherUserId] || null
  }

  function getProfileName(match: Match) {
    const profile =
      getOtherProfile(match)

    if (!profile) {
      return 'Your match'
    }

    return (
      `${profile.first_name || ''} ` +
      `${profile.last_name || ''}`
    ).trim() || 'Your match'
  }

  // ============================================
  // RELOAD MEETINGS
  // ============================================

  async function reloadMeetings() {
    if (matches.length === 0) {
      setMeetings([])
      return
    }

    const supabase = createClient()

    const matchIds =
      matches.map(
        (match) => match.id
      )

    const {
      data: updatedMeetings,
      error: updatedMeetingsError,
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
        .in(
          'match_id',
          matchIds
        )
        .order(
          'scheduled_date',
          {
            ascending: true,
          }
        )

    if (updatedMeetingsError) {
      console.error(
        'Could not reload meetings:',
        updatedMeetingsError
      )

      return
    }

    setMeetings(
      (updatedMeetings || []) as Meeting[]
    )
  }

  // ============================================
  // FIND OVERLAPPING AVAILABILITY
  // ============================================

  async function findOverlappingTimes(
    match: Match
  ) {
    if (!userId) {
      return
    }

    const otherUserId =
      getOtherUserId(match)

    if (!otherUserId) {
      return
    }

    const supabase = createClient()

    setLoadingTimes(true)
    setError('')
    setOverlappingTimes([])

    // ------------------------------------------
    // GET OTHER USER AVAILABILITY
    // ------------------------------------------

    const {
      data: otherAvailability,
      error: otherAvailabilityError,
    } =
      await supabase
        .from('availability')
        .select(`
          id,
          user_id,
          day_of_week,
          start_time,
          end_time
        `)
        .eq('user_id', otherUserId)

    if (otherAvailabilityError) {
      console.error(
        otherAvailabilityError
      )

      setError(
        `Could not load your match's availability: ${otherAvailabilityError.message}`
      )

      setLoadingTimes(false)
      return
    }

    const otherList =
      (otherAvailability || []) as Availability[]

    // ------------------------------------------
    // FIND OVERLAPS
    // ------------------------------------------

    const overlaps: OverlappingTime[] = []

    for (const mine of availability) {
      const matchesForDay =
        otherList.filter(
          (other) =>
            other.day_of_week ===
            mine.day_of_week
        )

      for (const other of matchesForDay) {
        const mineStart =
          timeToMinutes(
            mine.start_time
          )

        const mineEnd =
          timeToMinutes(
            mine.end_time
          )

        const otherStart =
          timeToMinutes(
            other.start_time
          )

        const otherEnd =
          timeToMinutes(
            other.end_time
          )

        const overlapStart =
          Math.max(
            mineStart,
            otherStart
          )

        const overlapEnd =
          Math.min(
            mineEnd,
            otherEnd
          )

        // Require at least one hour
        if (
          overlapEnd -
            overlapStart >=
          60
        ) {
          const date =
            getNextDateForDay(
              mine.day_of_week
            )

          overlaps.push({
            day_of_week:
              mine.day_of_week,

            start_time:
              minutesToTime(
                overlapStart
              ),

            end_time:
              minutesToTime(
                overlapEnd
              ),

            date:
              dateToString(date),
          })
        }
      }
    }

    // ------------------------------------------
    // REMOVE DUPLICATES
    // ------------------------------------------

    const uniqueOverlaps =
      overlaps.filter(
        (item, index, array) =>
          index ===
          array.findIndex(
            (other) =>
              other.date ===
                item.date &&
              other.start_time ===
                item.start_time &&
              other.end_time ===
                item.end_time
          )
      )

    // ------------------------------------------
    // REMOVE ALREADY BOOKED TIMES
    //
    // IMPORTANT:
    // cancelled meetings DO NOT block a slot.
    // ------------------------------------------

    const availableOverlaps =
      uniqueOverlaps.filter(
        (overlap) => {
          const alreadyBooked =
            meetings.some(
              (meeting) =>
                meeting.match_id ===
                  match.id &&
                meeting.scheduled_date ===
                  overlap.date &&
                meeting.status !==
                  'cancelled'
            )

          return !alreadyBooked
        }
      )

    // ------------------------------------------
    // SORT
    // ------------------------------------------

    availableOverlaps.sort(
      (a, b) => {
        if (
          a.date !== b.date
        ) {
          return a.date.localeCompare(
            b.date
          )
        }

        return (
          timeToMinutes(
            a.start_time
          ) -
          timeToMinutes(
            b.start_time
          )
        )
      }
    )

    setOverlappingTimes(
      availableOverlaps
    )

    setLoadingTimes(false)
  }

  // ============================================
  // SELECT MATCH
  // ============================================

  async function selectMatch(
    match: Match
  ) {
    setSelectedMatch(match)

    setLocation('')
    setError('')
    setSuccess('')

    await findOverlappingTimes(
      match
    )
  }

  // ============================================
  // AUTO-SELECT MATCH FROM URL
  // ============================================

  useEffect(() => {
    if (
      loading ||
      !userId ||
      !requestedMatchId ||
      Number.isNaN(requestedMatchId) ||
      selectedMatch
    ) {
      return
    }

    const requestedMatch =
      matches.find(
        (match) =>
          match.id === requestedMatchId
      )

    if (!requestedMatch) {
      return
    }

    selectMatch(requestedMatch)
  }, [
    loading,
    userId,
    requestedMatchId,
    matches,
    selectedMatch,
  ])

  // ============================================
  // SCHEDULE MEETING
  // ============================================

  async function scheduleMeeting(
    overlap: OverlappingTime
  ) {
    if (
      !selectedMatch ||
      scheduling
    ) {
      return
    }

    setError('')
    setSuccess('')
    setScheduling(true)

    const supabase = createClient()

    // ------------------------------------------
    // CHECK FOR EXISTING MEETING
    // ------------------------------------------

    const {
      data: existingMeeting,
      error: existingMeetingError,
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
        .eq(
          'match_id',
          selectedMatch.id
        )
        .eq(
          'scheduled_date',
          overlap.date
        )
        .neq(
          'status',
          'cancelled'
        )
        .maybeSingle()

    if (existingMeetingError) {
      console.error(
        existingMeetingError
      )

      setError(
        `Could not check for an existing meeting: ${existingMeetingError.message}`
      )

      setScheduling(false)
      return
    }

    if (existingMeeting) {
      setError(
        'You already have a meeting scheduled with this match on this date.'
      )

      setScheduling(false)

      await reloadMeetings()

      await findOverlappingTimes(
        selectedMatch
      )

      return
    }

    // ------------------------------------------
    // INSERT MEETING
    // ------------------------------------------

    const {
      data: newMeeting,
      error: meetingError,
    } =
      await supabase
        .from('meetings')
        .insert({
          match_id:
            selectedMatch.id,

          scheduled_date:
            overlap.date,

          start_time:
            `${overlap.start_time}:00`,

          end_time:
            `${overlap.end_time}:00`,

          location:
            location.trim() || null,

          status:
            'scheduled',
        })
        .select(`
          id,
          match_id,
          scheduled_date,
          start_time,
          end_time,
          location,
          status
        `)
        .single()

    if (meetingError) {
      console.error(
        'MEETING INSERT ERROR:',
        meetingError
      )

      setError(
        `Could not schedule this meeting: ${meetingError.message}`
      )

      setScheduling(false)
      return
    }

    // ------------------------------------------
    // UPDATE MEETINGS STATE
    // ------------------------------------------

    if (newMeeting) {
      setMeetings(
        (current) => [
          ...current,
          newMeeting as Meeting,
        ]
      )
    }

    // ------------------------------------------
    // REMOVE SCHEDULED SLOT
    // ------------------------------------------

    setOverlappingTimes(
      (current) =>
        current.filter(
          (item) =>
            !(
              item.date ===
                overlap.date &&
              item.start_time ===
                overlap.start_time
            )
        )
    )

    // ------------------------------------------
    // SUCCESS
    // ------------------------------------------

    setSuccess(
      `Coffee chat scheduled with ${getProfileName(
        selectedMatch
      )}!`
    )

    setScheduling(false)
  }

  // ============================================
  // CANCEL MEETING
  // ============================================

  async function cancelMeeting(
    meetingId: number
  ) {
    if (cancelling !== null) {
      return
    }

    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this coffee chat?'
      )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')
    setCancelling(meetingId)

    const supabase = createClient()

    // ------------------------------------------
    // UPDATE DATABASE
    // ------------------------------------------

    const {
      error: cancelError,
    } =
      await supabase
        .from('meetings')
        .update({
          status: 'cancelled',
        })
        .eq(
          'id',
          meetingId
        )

    if (cancelError) {
      console.error(
        'Could not cancel meeting:',
        cancelError
      )

      setError(
        `Could not cancel this meeting: ${cancelError.message}`
      )

      setCancelling(null)
      return
    }

    // ------------------------------------------
    // REMOVE FROM UPCOMING UI
    // ------------------------------------------

    setMeetings(
      (current) =>
        current.filter(
          (meeting) =>
            meeting.id !==
            meetingId
        )
    )

    // ------------------------------------------
    // SUCCESS
    // ------------------------------------------

    setSuccess(
      'Your coffee chat has been cancelled.'
    )

    setCancelling(null)

    // ------------------------------------------
    // REFRESH DATABASE STATE
    // ------------------------------------------

    await reloadMeetings()

    // ------------------------------------------
    // REFRESH AVAILABLE TIMES
    //
    // Because the meeting is now cancelled,
    // its previous time becomes available again.
    // ------------------------------------------

    if (selectedMatch) {
      await findOverlappingTimes(
        selectedMatch
      )
    }
  }

  // ============================================
  // UPCOMING MEETINGS
  // ============================================

  const upcomingMeetings =
    meetings.filter(
      (meeting) =>
        meeting.status !== 'cancelled'
    )

  // ============================================
  // LOADING SCREEN
  // ============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            ☕
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your schedule...
          </p>

        </div>
      </main>
    )
  }

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

        <section className="mb-10">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            BrewLink
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Schedule a coffee chat.
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500">
            Choose a match and find a time that works for both of you.
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

            <p>
              {success}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push('/coffee-chats')
              }
              className="mt-3 font-semibold underline transition hover:text-green-900"
            >
              View Coffee Chats →
            </button>

          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">

          {/* MATCHES */}

          <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Your matches
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Who do you want to meet?
            </h2>

            {matches.length === 0 ? (

              <div className="mt-6 rounded-2xl bg-gray-50 p-6 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                  👥
                </div>

                <h3 className="mt-4 font-semibold">
                  No active matches
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  Head to Discover to find people to connect with.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push('/discover')
                  }
                  className="mt-5 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
                >
                  Find matches →
                </button>

              </div>

            ) : (

              <div className="mt-6 space-y-3">

                {matches.map(
                  (match) => {

                    const profile =
                      getOtherProfile(
                        match
                      )

                    const isSelected =
                      selectedMatch?.id ===
                      match.id

                    return (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() =>
                          selectMatch(
                            match
                          )
                        }
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-black bg-white shadow-sm'
                            : 'border-gray-200/70 bg-gray-50 hover:bg-white'
                        }`}
                      >

                        <p className="font-semibold">
                          {getProfileName(
                            match
                          )}
                        </p>

                        {profile?.major && (
                          <p className="mt-1 text-sm text-gray-500">
                            {profile.major}
                          </p>
                        )}

                        {profile?.career_goal && (
                          <p className="mt-1 text-sm text-gray-400">
                            {profile.career_goal}
                          </p>
                        )}

                      </button>
                    )
                  }
                )}

              </div>

            )}

          </section>

          {/* SCHEDULING AREA */}

          <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

            {!selectedMatch ? (

              <div className="flex min-h-[400px] items-center justify-center text-center">

                <div>

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-2xl">
                    ☕
                  </div>

                  <h2 className="mt-5 text-2xl font-bold">
                    Pick a match
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                    Select someone from the left to find a time that works for both of you.
                  </p>

                </div>

              </div>

            ) : (

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Schedule with
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  {getProfileName(
                    selectedMatch
                  )}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  These are the times when your availability overlaps.
                </p>

                {/* LOCATION */}

                <div className="mt-6">

                  <label className="text-sm font-semibold text-gray-700">
                    Location
                  </label>

                  <input
                    type="text"
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="e.g. Geisel Library, Price Center, Zoom..."
                    maxLength={150}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    Add where you&apos;d like to meet. You can also enter an online meeting location.
                  </p>

                </div>

                {/* LOADING */}

                {loadingTimes && (
                  <div className="mt-8 rounded-2xl bg-gray-50 p-6 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                      🕐
                    </div>

                    <p className="mt-4 text-sm font-medium text-gray-500">
                      Finding overlapping times...
                    </p>

                  </div>
                )}

                {/* NO OVERLAPS */}

                {!loadingTimes &&
                  overlappingTimes.length === 0 && (
                    <div className="mt-8 rounded-2xl bg-gray-50 p-6 text-center">

                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                        🗓️
                      </div>

                      <h3 className="mt-4 font-semibold">
                        No available times
                      </h3>

                      <p className="mt-1 text-sm leading-relaxed text-gray-500">
                        You and your match don't currently have an available shared time.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            '/availability'
                          )
                        }
                        className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                      >
                        Manage my availability
                      </button>

                    </div>
                  )}

                {/* AVAILABLE TIMES */}

                {!loadingTimes &&
                  overlappingTimes.length > 0 && (
                    <div className="mt-8">

                      <p className="text-sm font-semibold text-gray-700">
                        Available times
                      </p>

                      <div className="mt-4 space-y-3">

                        {overlappingTimes.map(
                          (
                            overlap,
                            index
                          ) => (

                            <div
                              key={`${overlap.date}-${overlap.start_time}-${overlap.end_time}-${index}`}
                              className="rounded-2xl border border-gray-200/70 bg-gray-50 p-4"
                            >

                              <div className="flex items-start justify-between gap-4">

                                <div>

                                  <p className="font-semibold">
                                    {formatDate(
                                      overlap.date
                                    )}
                                  </p>

                                  <p className="mt-1 text-sm text-gray-500">
                                    {formatTime(
                                      overlap.start_time
                                    )}
                                    {' – '}
                                    {formatTime(
                                      overlap.end_time
                                    )}
                                  </p>

                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    scheduleMeeting(
                                      overlap
                                    )
                                  }
                                  disabled={
                                    scheduling
                                  }
                                  className="shrink-0 rounded-xl bg-black px-4 py-3 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {scheduling
                                    ? 'Scheduling...'
                                    : 'Schedule →'}
                                </button>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>
                  )}

                {/* MANAGE AVAILABILITY */}

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/availability'
                    )
                  }
                  className="mt-6 w-full rounded-2xl border border-gray-200 px-5 py-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Manage my availability
                </button>

              </div>

            )}

          </section>

        </div>

        {/* UPCOMING MEETINGS */}

        <section className="mt-8 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Upcoming
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Your scheduled chats
              </h2>

            </div>

            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
              {upcomingMeetings.length}
            </div>

          </div>

          {upcomingMeetings.length === 0 ? (

            <div className="mt-6 rounded-2xl bg-gray-50 p-6 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                📅
              </div>

              <h3 className="mt-4 font-semibold">
                No meetings scheduled
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Choose a match above to schedule your first coffee chat.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-3">

              {upcomingMeetings.map(
                (meeting) => {

                  const meetingMatch =
                    matches.find(
                      (match) =>
                        match.id ===
                        meeting.match_id
                    )

                  return (
                    <div
                      key={meeting.id}
                      className="rounded-2xl border border-gray-200/70 bg-gray-50 p-4"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="font-semibold">
                            {meetingMatch
                              ? getProfileName(
                                  meetingMatch
                                )
                              : 'BrewLink match'}
                          </p>

                          <p className="mt-2 font-medium">
                            {meeting.scheduled_date
                              ? formatDate(
                                  meeting.scheduled_date
                                )
                              : 'Date not set'}
                          </p>

                          {meeting.start_time && (
                            <p className="mt-1 text-sm text-gray-500">
                              {formatTime(
                                meeting.start_time
                              )}

                              {meeting.end_time &&
                                ` – ${formatTime(
                                  meeting.end_time
                                )}`}
                            </p>
                          )}

                          {meeting.location && (
                            <p className="mt-1 text-sm text-gray-500">
                              📍{' '}
                              {meeting.location}
                            </p>
                          )}

                          {meeting.status && (
                            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-green-600">
                              {meeting.status}
                            </p>
                          )}

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            cancelMeeting(
                              meeting.id
                            )
                          }
                          disabled={
                            cancelling ===
                            meeting.id
                          }
                          className="shrink-0 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {cancelling ===
                          meeting.id
                            ? 'Cancelling...'
                            : 'Cancel'}
                        </button>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </section>

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