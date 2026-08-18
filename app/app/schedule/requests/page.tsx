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
}

export default function ScheduleRequestsPage() {
  const router = useRouter()

  const [userId, setUserId] = useState('')
  const [requests, setRequests] = useState<CoffeeChat[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})

  const [loading, setLoading] = useState(true)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // ============================================
  // LOAD REQUESTS
  // ============================================

  useEffect(() => {
    async function loadRequests() {
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

      // ==========================================
      // LOAD INCOMING PENDING REQUESTS
      // ==========================================

      const {
        data: chatData,
        error: chatError,
      } = await supabase
        .from('coffee_chats')
        .select('*')
        .eq('participant_id', user.id)
        .eq('status', 'pending')
        .order('scheduled_date', {
          ascending: true,
        })

      if (chatError) {
        setError(
          `Could not load requests: ${chatError.message}`
        )
        setLoading(false)
        return
      }

      setRequests(chatData || [])

      // ==========================================
      // LOAD ORGANIZER PROFILES
      // ==========================================

      const organizerIds = (chatData || []).map(
        (chat) => chat.organizer_id
      )

      if (organizerIds.length > 0) {
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
          setLoading(false)
          return
        }

        const profileMap: Record<string, Profile> = {}

        for (const profile of profileData || []) {
          profileMap[profile.id] = profile
        }

        setProfiles(profileMap)
      }

      setLoading(false)
    }

    loadRequests()
  }, [router])

  // ============================================
  // RESPOND TO REQUEST
  // ============================================

  async function respondToRequest(
    chat: CoffeeChat,
    response: 'accepted' | 'declined'
  ) {
    if (!userId || respondingId) {
      return
    }

    setRespondingId(chat.id)
    setError('')
    setMessage('')

    const supabase = createClient()

    // ==========================================
    // CONVERT UI RESPONSE TO DATABASE STATUS
    // ==========================================

    const newStatus =
      response === 'accepted'
        ? 'confirmed'
        : 'cancelled'

    // ==========================================
    // SAVE / UPDATE RESPONSE
    // ==========================================
    //
    // We use UPSERT instead of INSERT because
    // coffee_chat_responses has a unique constraint
    // on:
    //
    // coffee_chat_id + user_id
    //
    // This prevents duplicate response errors if
    // the user responds more than once.
    // ==========================================

    const {
      error: responseError,
    } = await supabase
      .from('coffee_chat_responses')
      .upsert(
        {
          coffee_chat_id: chat.id,
          user_id: userId,
          response,
          responded_at: new Date().toISOString(),
        },
        {
          onConflict:
            'coffee_chat_id,user_id',
        }
      )

    if (responseError) {
      setError(
        `Could not save response: ${responseError.message}`
      )
      setRespondingId(null)
      return
    }

    // ==========================================
    // UPDATE COFFEE CHAT STATUS
    // ==========================================

    const {
      error: updateError,
    } = await supabase
      .from('coffee_chats')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chat.id)

    if (updateError) {
      setError(
        `Could not update request: ${updateError.message}`
      )
      setRespondingId(null)
      return
    }

    // ==========================================
    // REMOVE FROM PENDING REQUESTS
    // ==========================================

    setRequests((current) =>
      current.filter(
        (request) => request.id !== chat.id
      )
    )

    // ==========================================
    // SUCCESS MESSAGE
    // ==========================================

    const organizer =
      profiles[chat.organizer_id]

    const name =
      organizer?.first_name ||
      'your connection'

    if (response === 'accepted') {
      setMessage(
        `Coffee chat with ${name} accepted!`
      )
    } else {
      setMessage(
        `Coffee chat with ${name} declined.`
      )
    }

    setRespondingId(null)
  }

  // ============================================
  // FORMAT DATE
  // ============================================

  function formatDate(dateString: string) {
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

    date.setHours(hours, minutes, 0, 0)

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })
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
            className="mb-5 text-sm text-gray-500"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold tracking-tight">
            Coffee Chat Requests
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review requests from your connections.
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
            {message}
          </div>
        )}

        {/* REQUESTS */}

        {requests.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-gray-200/70 bg-white p-10 text-center shadow-sm">

            <div className="text-5xl">
              ☕
            </div>

            <h2 className="mt-5 text-xl font-bold">
              No pending requests
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              When someone wants to meet with you,
              their request will appear here.
            </p>

          </div>
        ) : (
          <div className="mt-6 space-y-4">

            {requests.map((chat) => {

              const organizer =
                profiles[chat.organizer_id]

              const name =
                `${organizer?.first_name || ''} ${
                  organizer?.last_name || ''
                }`.trim() ||
                'Your connection'

              const isResponding =
                respondingId === chat.id

              return (
                <div
                  key={chat.id}
                  className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm"
                >

                  {/* PERSON */}

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-100">

                      {organizer?.profile_photo_url ? (
                        <img
                          src={
                            organizer.profile_photo_url
                          }
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">
                          👤
                        </span>
                      )}

                    </div>

                    <div>
                      <h2 className="font-bold">
                        {name}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {organizer?.major ||
                          'Major not listed'}
                      </p>
                    </div>

                  </div>

                  {/* DETAILS */}

                  <div className="mt-6 rounded-2xl bg-gray-50 p-4">

                    <p className="font-semibold">
                      ☕ Coffee Chat
                    </p>

                    <p className="mt-3 text-sm text-gray-600">
                      📅 {formatDate(
                        chat.scheduled_date
                      )}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      🕐 {formatTime(
                        chat.start_time
                      )}{' '}
                      →{' '}
                      {formatTime(
                        chat.end_time
                      )}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      📍 {chat.location}
                    </p>

                  </div>

                  {/* BUTTONS */}

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <button
                      onClick={() =>
                        respondToRequest(
                          chat,
                          'declined'
                        )
                      }
                      disabled={isResponding}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isResponding
                        ? '...'
                        : 'Decline'}
                    </button>

                    <button
                      onClick={() =>
                        respondToRequest(
                          chat,
                          'accepted'
                        )
                      }
                      disabled={isResponding}
                      className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isResponding
                        ? '...'
                        : 'Accept'}
                    </button>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </div>

    </main>
  )
}