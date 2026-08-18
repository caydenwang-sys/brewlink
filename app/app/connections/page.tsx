'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Connection = {
  id: number
  sender_id: string
  receiver_id: string
  status: string
  created_at: string
}

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  major: string | null
  academic_year: string | null
  bio: string | null
  career_goal: string | null
  profile_photo_url: string | null
}

type ConnectionWithProfile = Connection & {
  person: Profile | null
}

export default function ConnectionsPage() {
  const router = useRouter()

  const [connections, setConnections] = useState<
    ConnectionWithProfile[]
  >([])

  const [pendingRequests, setPendingRequests] = useState<
    ConnectionWithProfile[]
  >([])

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function loadConnections() {
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

    const {
      data: connectionData,
      error: connectionsError,
    } = await supabase
      .from('connections')
      .select(
        'id, sender_id, receiver_id, status, created_at'
      )
      .or(
        `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
      )
      .order('created_at', {
        ascending: false,
      })

    if (connectionsError) {
      setError(
        `Could not load connections: ${connectionsError.message}`
      )
      setLoading(false)
      return
    }

    const accepted = (connectionData || []).filter(
      (connection) => connection.status === 'accepted'
    )

    const pending = (connectionData || []).filter(
      (connection) =>
        connection.status === 'pending' &&
        connection.receiver_id === user.id
    )

    const otherUserIds = (connectionData || []).map(
      (connection) =>
        connection.sender_id === user.id
          ? connection.receiver_id
          : connection.sender_id
    )

    const uniqueUserIds = [...new Set(otherUserIds)]

    let profileData: Profile[] = []

    if (uniqueUserIds.length > 0) {
      const {
        data,
        error: profilesError,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          major,
          academic_year,
          bio,
          career_goal,
          profile_photo_url
        `)
        .in('id', uniqueUserIds)

      if (profilesError) {
        setError(
          `Could not load profiles: ${profilesError.message}`
        )
        setLoading(false)
        return
      }

      profileData = data || []
    }

    const acceptedWithProfiles: ConnectionWithProfile[] =
      accepted.map((connection) => {
        const otherUserId =
          connection.sender_id === user.id
            ? connection.receiver_id
            : connection.sender_id

        return {
          ...connection,
          person:
            profileData.find(
              (profile) => profile.id === otherUserId
            ) || null,
        }
      })

    const pendingWithProfiles: ConnectionWithProfile[] =
      pending.map((connection) => ({
        ...connection,
        person:
          profileData.find(
            (profile) =>
              profile.id === connection.sender_id
          ) || null,
      }))

    setConnections(acceptedWithProfiles)
    setPendingRequests(pendingWithProfiles)
    setLoading(false)
  }

  useEffect(() => {
    loadConnections()
  }, [])

  async function handleRequestAction(
    connectionId: number,
    newStatus: 'accepted' | 'declined'
  ) {
    if (actionLoading !== null) return

    setActionLoading(connectionId)
    setError('')

    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setActionLoading(null)
      router.push('/login')
      return
    }

    const {
      data: connection,
      error: connectionFetchError,
    } = await supabase
      .from('connections')
      .select(
        'id, sender_id, receiver_id, status'
      )
      .eq('id', connectionId)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .single()

    if (connectionFetchError || !connection) {
      setError(
        connectionFetchError?.message ||
          'This request is no longer pending.'
      )
      setActionLoading(null)
      return
    }

    const { error: updateError } =
      await supabase
        .from('connections')
        .update({
          status: newStatus,
        })
        .eq('id', connectionId)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')

    if (updateError) {
      setError(
        `Could not update request: ${updateError.message}`
      )
      setActionLoading(null)
      return
    }

    // If accepted, create a match if one doesn't exist.
    if (newStatus === 'accepted') {
      const {
        data: existingMatch,
        error: existingMatchError,
      } = await supabase
        .from('matches')
        .select('id')
        .or(
          `and(user_1_id.eq.${connection.sender_id},user_2_id.eq.${connection.receiver_id}),and(user_1_id.eq.${connection.receiver_id},user_2_id.eq.${connection.sender_id})`
        )
        .maybeSingle()

      if (existingMatchError) {
        setError(
          `Connection accepted, but match check failed: ${existingMatchError.message}`
        )
        setActionLoading(null)
        await loadConnections()
        return
      }

      if (!existingMatch) {
        const { error: matchError } =
          await supabase
            .from('matches')
            .insert({
              user_1_id: connection.sender_id,
              user_2_id: connection.receiver_id,
            })

        if (matchError) {
          setError(
            `Connection accepted, but match creation failed: ${matchError.message}`
          )
        }
      }
    }

    setActionLoading(null)
    await loadConnections()
  }

  function getName(person: Profile | null) {
    if (!person) return 'Student'

    const name =
      `${person.first_name || ''} ${
        person.last_name || ''
      }`.trim()

    return name || 'Student'
  }

  function getInitials(person: Profile | null) {
    if (!person) return '?'

    const first =
      person.first_name?.charAt(0) || ''

    const last =
      person.last_name?.charAt(0) || ''

    return `${first}${last}`.toUpperCase() || '?'
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
            ☕
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Loading your network...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-28">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/90 backdrop-blur">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xl font-bold tracking-tight"
          >
            BrewLink
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            Profile
          </button>

        </div>

      </header>

      {/* Main */}
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        {/* Page heading */}
        <div className="flex items-start justify-between gap-4">

          <div>
            <div className="flex items-center gap-3">

              <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                Network
              </p>

              {pendingRequests.length > 0 && (
                <span className="rounded-full bg-black px-2.5 py-1 text-xs font-bold text-white">
                  {pendingRequests.length} new
                </span>
              )}

            </div>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Connections
            </h1>

            <p className="mt-3 max-w-lg text-gray-500">
              Build your network, meet interesting
              students, and start meaningful
              conversations.
            </p>
          </div>

          <button
            onClick={loadConnections}
            className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-gray-50"
          >
            Refresh
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <section className="mt-10">

            <div className="flex items-end justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  Connection Requests
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Students who want to connect with you.
                </p>
              </div>

              <span className="text-sm font-semibold text-gray-400">
                {pendingRequests.length}
              </span>

            </div>

            <div className="mt-5 space-y-4">

              {pendingRequests.map((connection) => {
                const person = connection.person
                const isLoading =
                  actionLoading === connection.id

                const name = getName(person)

                return (
                  <div
                    key={connection.id}
                    className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >

                    {/* Profile */}
                    <div className="flex items-start gap-4">

                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">

                        {person?.profile_photo_url ? (
                          <img
                            src={person.profile_photo_url}
                            alt={`${name} profile`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-400">
                            {getInitials(person)}
                          </span>
                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        <h3 className="text-lg font-bold">
                          {name}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {person?.major ||
                            'Major not listed'}

                          {person?.academic_year
                            ? ` • ${person.academic_year}`
                            : ''}
                        </p>

                      </div>

                      <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 sm:block">
                        Request
                      </span>

                    </div>

                    {/* Career */}
                    {person?.career_goal && (
                      <div className="mt-5">

                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                          Career interest
                        </p>

                        <p className="mt-1 font-semibold">
                          {person.career_goal}
                        </p>

                      </div>
                    )}

                    {/* Bio */}
                    {person?.bio && (
                      <div className="mt-5">

                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                          About
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-gray-600">
                          {person.bio}
                        </p>

                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 grid grid-cols-2 gap-3">

                      <button
                        onClick={() =>
                          handleRequestAction(
                            connection.id,
                            'declined'
                          )
                        }
                        disabled={isLoading}
                        className="rounded-xl border border-gray-200 px-4 py-3 font-semibold transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isLoading
                          ? 'Updating...'
                          : 'Decline'}
                      </button>

                      <button
                        onClick={() =>
                          handleRequestAction(
                            connection.id,
                            'accepted'
                          )
                        }
                        disabled={isLoading}
                        className="rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {isLoading
                          ? 'Updating...'
                          : 'Accept'}
                      </button>

                    </div>

                  </div>
                )
              })}

            </div>

          </section>
        )}

        {/* Your Connections */}
        <section className="mt-12">

          <div className="flex items-end justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                Your Connections
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Students you&apos;ve connected with.
              </p>
            </div>

            {connections.length > 0 && (
              <span className="text-sm font-semibold text-gray-400">
                {connections.length}
              </span>
            )}

          </div>

          {connections.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-gray-200/70 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-3xl">
                ☕
              </div>

              <h3 className="mt-5 text-lg font-bold">
                No connections yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                Discover students with similar
                interests and start building your
                network.
              </p>

              <button
                onClick={() => router.push('/discover')}
                className="mt-6 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Discover Students
              </button>

            </div>
          ) : (
            <div className="mt-5 space-y-4">

              {connections.map((connection) => {
                const person = connection.person

                if (!person) return null

                const name = getName(person)

                return (
                  <div
                    key={connection.id}
                    className="rounded-3xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                  >

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                      {/* Profile */}
                      <div className="flex min-w-0 flex-1 items-center gap-4">

                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">

                          {person.profile_photo_url ? (
                            <img
                              src={person.profile_photo_url}
                              alt={`${name} profile`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-gray-400">
                              {getInitials(person)}
                            </span>
                          )}

                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate text-lg font-bold">
                            {name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {person.major ||
                              'Major not listed'}

                            {person.academic_year
                              ? ` • ${person.academic_year}`
                              : ''}
                          </p>

                        </div>

                      </div>

                      {/* Message */}
                      <button
                        onClick={() =>
                          router.push(
                            `/chats?user=${person.id}`
                          )
                        }
                        className="w-full shrink-0 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
                      >
                        Message
                      </button>

                    </div>

                    {/* Career */}
                    {person.career_goal && (
                      <div className="mt-5 border-t border-gray-100 pt-4">

                        <p className="text-sm text-gray-600">

                          <span className="font-semibold text-gray-900">
                            Career:
                          </span>{' '}

                          {person.career_goal}

                        </p>

                      </div>
                    )}

                  </div>
                )
              })}

            </div>
          )}

        </section>

      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">

        <div className="mx-auto flex max-w-2xl justify-around px-4 py-4 sm:px-6">

          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 transition hover:text-black"
          >
            Home
          </button>

          <button
            onClick={() => router.push('/discover')}
            className="text-sm text-gray-500 transition hover:text-black"
          >
            Discover
          </button>

          <button
            onClick={() => router.push('/connections')}
            className="text-sm font-semibold"
          >
            Connections
          </button>

          <button
            onClick={() => router.push('/chats')}
            className="text-sm text-gray-500 transition hover:text-black"
          >
            Chats
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="text-sm text-gray-500 transition hover:text-black"
          >
            Profile
          </button>

        </div>

      </nav>

    </main>
  )
}