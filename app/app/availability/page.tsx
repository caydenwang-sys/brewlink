'use client'

import {
  useEffect,
  useState,
} from 'react'
import {
  createClient,
} from '@/lib/supabase/client'
import {
  useRouter,
} from 'next/navigation'

type Availability = {
  id: number
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

type Day = {
  value: number
  name: string
}

const days: Day[] = [
  {
    value: 0,
    name: 'Sunday',
  },
  {
    value: 1,
    name: 'Monday',
  },
  {
    value: 2,
    name: 'Tuesday',
  },
  {
    value: 3,
    name: 'Wednesday',
  },
  {
    value: 4,
    name: 'Thursday',
  },
  {
    value: 5,
    name: 'Friday',
  },
  {
    value: 6,
    name: 'Saturday',
  },
]

export default function AvailabilityPage() {
  const router = useRouter()

  const [currentUserId, setCurrentUserId] =
    useState('')

  const [availability, setAvailability] =
    useState<Availability[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  // ============================================
  // FORM STATE
  // ============================================

  const [selectedDay, setSelectedDay] =
    useState(1)

  const [startTime, setStartTime] =
    useState('09:00')

  const [endTime, setEndTime] =
    useState('17:00')

  // ============================================
  // LOAD AVAILABILITY
  // ============================================

  async function loadAvailability() {
    const supabase = createClient()

    setLoading(true)
    setError('')

    // ============================================
    // GET CURRENT USER
    // ============================================

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/login')
      return
    }

    setCurrentUserId(user.id)

    // ============================================
    // LOAD AVAILABILITY
    // ============================================

    const {
      data,
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
        .eq(
          'user_id',
          user.id
        )
        .order(
          'day_of_week',
          {
            ascending: true,
          }
        )
        .order(
          'start_time',
          {
            ascending: true,
          }
        )

    if (availabilityError) {
      console.error(
        'Could not load availability:',
        availabilityError
      )

      setError(
        'Could not load your availability.'
      )

      setLoading(false)
      return
    }

    setAvailability(
      data || []
    )

    setLoading(false)
  }

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    loadAvailability()
  }, [router])

  // ============================================
  // ADD AVAILABILITY
  // ============================================

  async function addAvailability() {
    setError('')
    setSuccess('')

    // ============================================
    // VALIDATE TIMES
    // ============================================

    if (
      !startTime ||
      !endTime
    ) {
      setError(
        'Please choose a start and end time.'
      )

      return
    }

    if (
      startTime >= endTime
    ) {
      setError(
        'End time must be after start time.'
      )

      return
    }

    if (!currentUserId) {
      setError(
        'You must be logged in.'
      )

      return
    }

    setSaving(true)

    const supabase = createClient()

    // ============================================
    // INSERT
    // ============================================

    const {
      data,
      error: insertError,
    } =
      await supabase
        .from('availability')
        .insert({
          user_id:
            currentUserId,

          day_of_week:
            selectedDay,

          start_time:
            startTime,

          end_time:
            endTime,
        })
        .select(`
          id,
          user_id,
          day_of_week,
          start_time,
          end_time
        `)
        .single()

    if (insertError) {
      console.error(
        'Could not add availability:',
        insertError
      )

      setError(
        'Could not save this availability block.'
      )

      setSaving(false)
      return
    }

    // ============================================
    // UPDATE LOCAL STATE
    // ============================================

    setAvailability(
      (current) =>
        [
          ...current,
          data,
        ].sort(
          (a, b) => {
            if (
              a.day_of_week !==
              b.day_of_week
            ) {
              return (
                a.day_of_week -
                b.day_of_week
              )
            }

            return a.start_time.localeCompare(
              b.start_time
            )
          }
        )
    )

    setSuccess(
      'Availability added.'
    )

    setSaving(false)
  }

  // ============================================
  // DELETE AVAILABILITY
  // ============================================

  async function deleteAvailability(
    availabilityId: number
  ) {
    setError('')
    setSuccess('')

    const supabase = createClient()

    const {
      error: deleteError,
    } =
      await supabase
        .from('availability')
        .delete()
        .eq(
          'id',
          availabilityId
        )
        .eq(
          'user_id',
          currentUserId
        )

    if (deleteError) {
      console.error(
        'Could not delete availability:',
        deleteError
      )

      setError(
        'Could not delete this availability block.'
      )

      return
    }

    setAvailability(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            availabilityId
        )
    )

    setSuccess(
      'Availability removed.'
    )
  }

  // ============================================
  // FORMAT TIME
  // ============================================

  function formatTime(
    time: string
  ) {
    const [hours, minutes] =
      time.split(':').map(Number)

    const date =
      new Date()

    date.setHours(
      hours,
      minutes,
      0,
      0
    )

    return date.toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    )
  }

  // ============================================
  // GET DAY NAME
  // ============================================

  function getDayName(
    dayValue: number
  ) {
    return (
      days.find(
        (day) =>
          day.value ===
          dayValue
      )?.name ||
      'Unknown'
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
            🗓️
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your availability...
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

      {/* ======================================== */}
      {/* HEADER */}
      {/* ======================================== */}

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

      {/* ======================================== */}
      {/* MAIN */}
      {/* ======================================== */}

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        {/* ====================================== */}
        {/* TITLE */}
        {/* ====================================== */}

        <section className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            BrewLink
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Availability
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500">
            Tell BrewLink when you're available
            to meet with your connections.
          </p>

        </section>

        {/* ====================================== */}
        {/* ERROR */}
        {/* ====================================== */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ====================================== */}
        {/* SUCCESS */}
        {/* ====================================== */}

        {success && (
          <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ====================================== */}
        {/* ADD AVAILABILITY */}
        {/* ====================================== */}

        <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-6">

            <h2 className="text-lg font-bold">
              Add availability
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add a time block when you're
              normally available.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-3">

            {/* DAY */}

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Day
              </label>

              <select
                value={selectedDay}
                onChange={(event) =>
                  setSelectedDay(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              >

                {days.map(
                  (day) => (
                    <option
                      key={
                        day.value
                      }
                      value={
                        day.value
                      }
                    >
                      {day.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* START */}

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Start time
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />

            </div>

            {/* END */}

            <div>

              <label className="mb-2 block text-sm font-semibold">
                End time
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />

            </div>

          </div>

          <button
            type="button"
            onClick={addAvailability}
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? 'Saving...'
              : '+ Add availability'}
          </button>

        </section>

        {/* ====================================== */}
        {/* CURRENT AVAILABILITY */}
        {/* ====================================== */}

        <section className="mt-8">

          <div className="mb-4">

            <h2 className="text-lg font-bold">
              Your weekly availability
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              These are the times BrewLink can
              use when finding meeting times.
            </p>

          </div>

          {availability.length === 0 ? (

            <div className="rounded-3xl border border-gray-200/70 bg-white p-8 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                🗓️
              </div>

              <h3 className="mt-4 font-semibold">
                No availability yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                Add some times above so BrewLink
                can find overlapping availability
                with your connections.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {days.map(
                (day) => {

                  const dayAvailability =
                    availability.filter(
                      (item) =>
                        item.day_of_week ===
                        day.value
                    )

                  return (
                    <div
                      key={
                        day.value
                      }
                      className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm"
                    >

                      <div className="flex items-center justify-between">

                        <h3 className="font-bold">
                          {day.name}
                        </h3>

                        {dayAvailability.length === 0 && (
                          <span className="text-xs text-gray-400">
                            No availability
                          </span>
                        )}

                      </div>

                      {dayAvailability.length > 0 && (

                        <div className="mt-3 space-y-2">

                          {dayAvailability.map(
                            (item) => (

                              <div
                                key={
                                  item.id
                                }
                                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                              >

                                <span className="text-sm font-medium">
                                  {formatTime(
                                    item.start_time
                                  )}
                                  {' – '}
                                  {formatTime(
                                    item.end_time
                                  )}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteAvailability(
                                      item.id
                                    )
                                  }
                                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  Remove
                                </button>

                              </div>

                            )
                          )}

                        </div>

                      )}

                    </div>
                  )
                }
              )}

            </div>

          )}

        </section>

        {/* ====================================== */}
        {/* NEXT STEP */}
        {/* ====================================== */}

        <div className="mt-8 rounded-3xl border border-gray-200/70 bg-gray-100 p-6">

          <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
            Coming next
          </p>

          <h3 className="mt-2 text-lg font-bold">
            Find overlapping availability
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Once both users have entered their
            availability, BrewLink will find
            the times that work for both people.
          </p>

        </div>

      </div>

      {/* ======================================== */}
      {/* BOTTOM NAV */}
      {/* ======================================== */}

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