'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  major: string | null
  profile_photo_url: string | null
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
  created_at: string
  updated_at: string
}

export default function RequestsPage() {
  const router = useRouter()

  const [userId, setUserId] = useState('')
  const [requests, setRequests] = useState<CoffeeChat[]>([])
  const [profiles, setProfiles] =
    useState<Record<string, Profile>>({})

  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] =
    useState<string | null>(null)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // ============================================
  // LOAD REQUESTS
  // ============================================

  async function loadRequests(
    currentUserId?: string
  ) {
    const supabase = createClient()

    let currentUserIdValue =
      currentUserId

    // ----------------------------------------
    // GET CURRENT USER IF NEEDED
    // ----------------------------------------

    if (!currentUserIdValue) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      currentUserIdValue = user.id
      setUserId(user.id)
    }

    // ----------------------------------------
    // LOAD PENDING REQUESTS
    // ----------------------------------------

    const {
      data: requestData,
      error: requestError,
    } = await supabase
      .from('coffee_chats')
      .select('*')
      .eq(
        'participant_id',
        currentUserIdValue
      )
      .eq('status', 'pending')
      .order('scheduled_date', {
        ascending: true,
      })
      .order('start_time', {
        ascending: true,
      })

    if (requestError) {
      setError(
        `Could not load requests: ${requestError.message}`
      )
      return
    }

    const loadedRequests =
      (requestData || []) as CoffeeChat[]

    setRequests(loadedRequests)

    // ----------------------------------------
    // LOAD ORGANIZER PROFILES
    // ----------------------------------------

    const organizerIds = Array.from(
      new Set(
        loadedRequests.map(
          (request) =>
            request.organizer_id
        )
      )
    )

    if (organizerIds.length === 0) {
      setProfiles({})
      return
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(
        'id, first_name, last_name, major, profile_photo_url'
      )
      .in('id', organizerIds)

    if (profileError) {
      setError(
        `Could not load profiles: ${profileError.message}`
      )
      return
    }

    const profileMap: Record<
      string,
      Profile
    > = {}

    for (const profile of profileData || []) {
      profileMap[profile.id] =
        profile as Profile
    }

    setProfiles(profileMap)
  }

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    async function initialize() {
      setLoading(true)
      setError('')

      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      await loadRequests(user.id)

      setLoading(false)
    }

    initialize()
  }, [router])

  // ============================================
  // REALTIME UPDATES
  // ============================================

  useEffect(() => {
    if (!userId) {
      return
    }

    const supabase = createClient()

    const channel = supabase
      .channel(
        `coffee-chat-requests-${userId}`
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'coffee_chats',
          filter: `participant_id=eq.${userId}`,
        },
        async (payload) => {
          console.log(
            'REQUESTS REALTIME UPDATE:',
            payload
          )

          const updatedChat =
            payload.new as CoffeeChat

          // ------------------------------------
          // REQUEST WAS NO LONGER PENDING
          // ------------------------------------

          if (
            updatedChat.status !== 'pending'
          ) {
            setRequests((current) =>
              current.filter(
                (request) =>
                  request.id !==
                  updatedChat.id
              )
            )

            // Refresh from database to make
            // absolutely sure UI matches DB.
            await loadRequests(userId)
          }
        }
      )
      .subscribe((status) => {
        console.log(
          'REQUESTS REALTIME STATUS:',
          status
        )
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // ============================================
  // FORMAT DATE
  // ============================================

  function formatDate(
    dateString: string
  ) {
    return new Date(
      `${dateString}T12:00:00`
    ).toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  // ============================================
  // FORMAT TIME
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

  // ============================================
  // ACCEPT REQUEST
  // ============================================

  async function acceptRequest(
    requestId: string
  ) {
    setError('')
    setMessage('')
    setProcessingId(requestId)

    const supabase = createClient()

    console.log(
      'REQUESTS - Accepting request:',
      requestId
    )

    // ----------------------------------------
    // UPDATE REQUEST
    // ----------------------------------------

    const {
      data: updatedRows,
      error: updateError,
    } = await supabase
      .from('coffee_chats')
      .update({
        status: 'confirmed',
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('participant_id', userId)
      .eq('status', 'pending')
      .select()

    // ----------------------------------------
    // DATABASE ERROR
    // ----------------------------------------

    if (updateError) {
      console.error(
        'REQUESTS - Accept error:',
        updateError
      )

      setError(
        `Could not accept request: ${updateError.message}`
      )

      setProcessingId(null)
      return
    }

    console.log(
      'REQUESTS - Accept result:',
      updatedRows
    )

    // ----------------------------------------
    // CRITICAL CHECK
    // ----------------------------------------
    //
    // If Supabase returns zero rows,
    // the UPDATE did not actually modify
    // the request.
    //
    // This commonly means an RLS policy
    // prevented the update.
    // ----------------------------------------

    if (
      !updatedRows ||
      updatedRows.length === 0
    ) {
      console.error(
        'REQUESTS - UPDATE RETURNED ZERO ROWS'
      )

      setError(
        'The request could not be updated. No rows were changed. Please check the coffee_chats UPDATE policy in Supabase.'
      )

      setProcessingId(null)
      return
    }

    // ----------------------------------------
    // SUCCESS
    // ----------------------------------------

    const updatedChat =
      updatedRows[0] as CoffeeChat

    console.log(
      'REQUESTS - Request confirmed:',
      updatedChat
    )

    // Remove immediately from UI.
    setRequests((current) =>
      current.filter(
        (request) =>
          request.id !== requestId
      )
    )

    setMessage(
      'Coffee chat confirmed! You are all set.'
    )

    setProcessingId(null)

    // Reload from database.
    await loadRequests(userId)
  }

  // ============================================
  // DECLINE REQUEST
  // ============================================

  async function declineRequest(
    requestId: string
  ) {
    setError('')
    setMessage('')
    setProcessingId(requestId)

    const supabase = createClient()

    console.log(
      'REQUESTS - Declining request:',
      requestId
    )

    // ----------------------------------------
    // UPDATE REQUEST
    // ----------------------------------------

    const {
      data: updatedRows,
      error: updateError,
    } = await supabase
      .from('coffee_chats')
      .update({
        status: 'cancelled',
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('participant_id', userId)
      .eq('status', 'pending')
      .select()

    // ----------------------------------------
    // DATABASE ERROR
    // ----------------------------------------

    if (updateError) {
      console.error(
        'REQUESTS - Decline error:',
        updateError
      )

      setError(
        `Could not decline request: ${updateError.message}`
      )

      setProcessingId(null)
      return
    }

    console.log(
      'REQUESTS - Decline result:',
      updatedRows
    )

    // ----------------------------------------
    // CHECK WHETHER UPDATE ACTUALLY HAPPENED
    // ----------------------------------------

    if (
      !updatedRows ||
      updatedRows.length === 0
    ) {
      console.error(
        'REQUESTS - DECLINE UPDATE RETURNED ZERO ROWS'
      )

      setError(
        'The request could not be declined. No rows were changed. Please check the coffee_chats UPDATE policy in Supabase.'
      )

      setProcessingId(null)
      return
    }

    // ----------------------------------------
    // SUCCESS
    // ----------------------------------------

    console.log(
      'REQUESTS - Request declined successfully'
    )

    setRequests((current) =>
      current.filter(
        (request) =>
          request.id !== requestId
      )
    )

    setMessage(
      'Coffee chat request declined.'
    )

    setProcessingId(null)

    await loadRequests(userId)
  }

  // ============================================
  // REQUEST CARD
  // ============================================

  function renderRequestCard(
    request: CoffeeChat
  ) {
    const person =
      profiles[request.organizer_id]

    const firstName =
      person?.first_name?.trim() || ''

    const lastName =
      person?.last_name?.trim() || ''

    const name =
      `${firstName} ${lastName}`.trim() ||
      'BrewLink connection'

    const major =
      person?.major?.trim() ||
      'Major not listed'

    const processing =
      processingId === request.id

    return (
      <div
        key={request.id}
        className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm"
      >

        {/* PERSON */}

        <div className="flex items-start gap-4">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">

            {person?.profile_photo_url ? (
              <img
                src={
                  person.profile_photo_url
                }
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl">
                👤
              </span>
            )}

          </div>

          <div className="flex-1">

            <p className="text-lg font-bold">
              {name}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {major}
            </p>

          </div>

          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            Pending
          </span>

        </div>

        {/* CHAT DETAILS */}

        <div className="mt-5 rounded-2xl bg-gray-50 p-4">

          <p className="text-sm font-semibold">
            ☕ Coffee Chat Request
          </p>

          <p className="mt-3 text-sm text-gray-600">
            📅{' '}
            {formatDate(
              request.scheduled_date
            )}
          </p>

          <p className="mt-2 text-sm text-gray-600">
            🕐{' '}
            {formatTime(
              request.start_time
            )}
            {' → '}
            {formatTime(
              request.end_time
            )}
          </p>

          <p className="mt-2 text-sm text-gray-600">
            📍 {request.location}
          </p>

        </div>

        {/* EXPLANATION */}

        <div className="mt-5 rounded-2xl bg-blue-50 p-4">

          <p className="text-sm font-semibold text-blue-800">
            🔔 Your response is needed
          </p>

          <p className="mt-1 text-sm text-blue-700">
            {firstName ||
              'Your connection'}{' '}
            would like to meet with you
            for a coffee chat.
          </p>

        </div>

        {/* BUTTONS */}

        <div className="mt-5 grid grid-cols-2 gap-3">

          <button
            onClick={() =>
              declineRequest(
                request.id
              )
            }
            disabled={processing}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          >
            {processing
              ? 'Please wait...'
              : 'Decline'}
          </button>

          <button
            onClick={() =>
              acceptRequest(
                request.id
              )
            }
            disabled={processing}
            className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {processing
              ? 'Please wait...'
              : 'Accept'}
          </button>

        </div>

      </div>
    )
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <div className="text-4xl">
            ☕
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Loading requests...
          </p>

        </div>

      </main>
    )
  }

  // ============================================
  // PAGE
  // ============================================

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-24">

      {/* HEADER */}

      <header className="border-b border-gray-200/70 bg-white">

        <div className="mx-auto max-w-2xl px-6 py-6">

          <button
            onClick={() => router.back()}
            className="mb-5 text-sm text-gray-500 transition hover:text-black"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold tracking-tight">
            Coffee Chat Requests
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review requests from your
            BrewLink connections.
          </p>

        </div>

      </header>

      <div className="mx-auto max-w-2xl px-5">

        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
            ✓ {message}
          </div>
        )}

        {/* REQUESTS */}

        <section className="mt-6">

          {requests.length === 0 ? (

            <div className="rounded-3xl border border-gray-200/70 bg-white p-10 text-center shadow-sm">

              <div className="text-5xl">
                ☕
              </div>

              <h2 className="mt-5 text-xl font-bold">
                You're all caught up
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                New coffee chat requests will
                appear here.
              </p>

              <button
                onClick={() =>
                  router.push('/schedule')
                }
                className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Back to Schedule
              </button>

            </div>

          ) : (

            <>

              <div className="mb-4 px-1">

                <h2 className="text-xl font-bold">
                  Requests waiting for you
                </h2>

                <p className="mt-1 text-sm text-gray-500">

                  {requests.length}{' '}

                  {requests.length === 1
                    ? 'request'
                    : 'requests'}{' '}

                  need
                  {requests.length === 1
                    ? 's'
                    : ''}{' '}

                  your response.

                </p>

              </div>

              <div className="space-y-4">

                {requests.map(
                  renderRequestCard
                )}

              </div>

            </>

          )}

        </section>

        {/* BACK TO SCHEDULE */}

        <button
          onClick={() =>
            router.push('/schedule')
          }
          className="mt-8 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          ← Back to Schedule
        </button>

      </div>

    </main>
  )
}
