'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

type ScoredProfile = {
  profile: Profile
  score: number
  reasons: string[]
}

export default function DiscoverPage() {
  const router = useRouter()

  const [profiles, setProfiles] =
    useState<ScoredProfile[]>([])

  const [currentIndex, setCurrentIndex] =
    useState(0)

  const [loading, setLoading] =
    useState(true)

  const [sending, setSending] =
    useState(false)

  const [error, setError] =
    useState('')

  const [userId, setUserId] =
    useState('')

  // ============================================
  // LOAD PROFILES
  // ============================================

  useEffect(() => {
    async function loadProfiles() {
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

      // ========================================
      // GET YOUR PROFILE
      // ========================================

      const {
        data: myProfile,
        error: myProfileError,
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
        .eq('id', user.id)
        .single()

      if (myProfileError || !myProfile) {
        setError(
          `Could not load your profile: ${
            myProfileError?.message ||
            'Profile not found'
          }`
        )

        setLoading(false)
        return
      }

      // ========================================
      // GET EXISTING CONNECTIONS
      // ========================================

      const {
        data: connections,
        error: connectionsError,
      } = await supabase
        .from('connections')
        .select(
          'sender_id, receiver_id, status'
        )
        .or(
          `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
        )

      if (connectionsError) {
        setError(
          `Could not load connections: ${connectionsError.message}`
        )

        setLoading(false)
        return
      }

      // ========================================
      // EXCLUDE CONNECTED / PENDING USERS
      // ========================================

      const excludedUserIds = new Set<string>()

      for (const connection of connections || []) {
        const otherUserId =
          connection.sender_id === user.id
            ? connection.receiver_id
            : connection.sender_id

        if (
          connection.status === 'accepted' ||
          connection.status === 'pending'
        ) {
          excludedUserIds.add(otherUserId)
        }
      }

      // ========================================
      // GET OTHER STUDENTS
      // ========================================

      const {
        data: allProfiles,
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
        .neq('id', user.id)

      if (profilesError) {
        setError(
          `Could not load students: ${profilesError.message}`
        )

        setLoading(false)
        return
      }

      const availableProfiles =
        (allProfiles || []).filter(
          (profile) =>
            !excludedUserIds.has(profile.id)
        )

      // ========================================
      // SCORE PROFILES
      // ========================================

      const scoredProfiles: ScoredProfile[] =
        availableProfiles.map((profile) => {
          let score = 0
          const reasons: string[] = []

          // Same career goal
          if (
            myProfile.career_goal &&
            profile.career_goal &&
            myProfile.career_goal
              .trim()
              .toLowerCase() ===
              profile.career_goal
                .trim()
                .toLowerCase()
          ) {
            score += 3
            reasons.push(
              'Same career interest'
            )
          }

          // Same major
          if (
            myProfile.major &&
            profile.major &&
            myProfile.major
              .trim()
              .toLowerCase() ===
              profile.major
                .trim()
                .toLowerCase()
          ) {
            score += 2
            reasons.push('Same major')
          }

          // Same academic year
          if (
            myProfile.academic_year &&
            profile.academic_year &&
            myProfile.academic_year
              .trim()
              .toLowerCase() ===
              profile.academic_year
                .trim()
                .toLowerCase()
          ) {
            score += 1
            reasons.push(
              'Same academic year'
            )
          }

          return {
            profile,
            score,
            reasons,
          }
        })

      // Highest compatibility first
      scoredProfiles.sort(
        (a, b) => b.score - a.score
      )

      setProfiles(scoredProfiles)
      setLoading(false)
    }

    loadProfiles()
  }, [router])

  const currentMatch =
    profiles[currentIndex]

  const currentProfile =
    currentMatch?.profile

  // ============================================
  // SEND CONNECTION REQUEST
  // ============================================

  async function sendConnectionRequest() {
    if (
      !currentProfile ||
      !userId ||
      sending
    ) {
      return
    }

    setSending(true)
    setError('')

    const supabase = createClient()

    // ========================================
    // CHECK FOR EXISTING CONNECTION
    // ========================================

    const {
      data: existingConnection,
      error: existingError,
    } = await supabase
      .from('connections')
      .select(
        'id, sender_id, receiver_id, status'
      )
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${currentProfile.id}),and(sender_id.eq.${currentProfile.id},receiver_id.eq.${userId})`
      )
      .maybeSingle()

    if (existingError) {
      setError(
        `Could not check connection: ${existingError.message}`
      )

      setSending(false)
      return
    }

    if (existingConnection) {
      if (
        existingConnection.status ===
        'accepted'
      ) {
        setError(
          'You are already connected with this student.'
        )
      } else if (
        existingConnection.status ===
        'pending'
      ) {
        setError(
          'A connection request already exists between you and this student.'
        )
      } else {
        setError(
          `A previous connection has status: ${existingConnection.status}.`
        )
      }

      setSending(false)
      return
    }

    // ========================================
    // CREATE CONNECTION REQUEST
    // ========================================

    const {
      error: insertError,
    } = await supabase
      .from('connections')
      .insert({
        sender_id: userId,
        receiver_id: currentProfile.id,
        status: 'pending',
      })

    if (insertError) {
      setError(
        `Could not send connection request: ${insertError.message}`
      )

      setSending(false)
      return
    }

    // ========================================
    // CREATE NOTIFICATION
    // ========================================

    const senderName =
      `${currentProfile ? '' : ''}`

    const {
      data: senderProfile,
    } = await supabase
      .from('profiles')
      .select(
        'first_name, last_name'
      )
      .eq('id', userId)
      .maybeSingle()

    const firstName =
      senderProfile?.first_name?.trim() ||
      'Someone'

    const lastName =
      senderProfile?.last_name?.trim() ||
      ''

    const fullName =
      `${firstName} ${lastName}`.trim()

    const {
      error: notificationError,
    } = await supabase
      .from('notifications')
      .insert({
        user_id: currentProfile.id,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${fullName} wants to connect with you on BrewLink.`,
        related_user_id: userId,
        is_read: false,
      })

    if (notificationError) {
      console.error(
        'Could not create notification:',
        notificationError.message
      )
    }

    // ========================================
    // MOVE TO NEXT PROFILE
    // ========================================

    setCurrentIndex(
      (current) => current + 1
    )

    setSending(false)
  }

  // ============================================
  // SKIP
  // ============================================

  function skipProfile() {
    if (
      currentIndex <
      profiles.length
    ) {
      setCurrentIndex(
        (current) => current + 1
      )

      setError('')
    }
  }

  // ============================================
  // MATCH PERCENTAGE
  // ============================================

  function getMatchPercentage(
    score: number
  ) {
    return Math.round(
      (score / 6) * 100
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
            ☕
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Finding students for you...
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
            onClick={() =>
              router.push('/dashboard')
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
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

      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-xl px-5 py-8 sm:px-6 sm:py-12">

        {/* TITLE */}

        <div className="mb-8">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Discover
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                Find your people.
              </h1>

            </div>

            {profiles.length > 0 &&
              currentProfile && (
                <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm">
                  {currentIndex + 1} / {profiles.length}
                </div>
              )}

          </div>

          <p className="mt-3 max-w-md leading-relaxed text-gray-500">
            Meet students with similar
            interests, goals, and ambitions.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">

            <span className="mt-0.5">
              ⚠️
            </span>

            <p>{error}</p>

          </div>
        )}

        {/* EMPTY */}

        {!currentProfile ? (
          <div className="rounded-[2rem] border border-gray-200/70 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-4xl">
              ☕
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              You&apos;re all caught up.
            </h2>

            <p className="mx-auto mt-2 max-w-sm leading-relaxed text-gray-500">
              You&apos;ve gone through everyone
              currently available. Check back
              later for more students.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <button
                onClick={() =>
                  router.push('/connections')
                }
                className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:opacity-90"
              >
                View Connections
              </button>

              <button
                onClick={() =>
                  router.push('/chats')
                }
                className="rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold transition hover:bg-gray-50"
              >
                View Chats
              </button>

            </div>

          </div>
        ) : (
          <>

            {/* PROFILE CARD */}

            <div className="group overflow-hidden rounded-[2rem] border border-gray-200/70 bg-white shadow-sm transition duration-300 hover:shadow-md">

              {/* PHOTO */}

              <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-gray-100">

                {currentProfile.profile_photo_url ? (
                  <img
                    src={
                      currentProfile.profile_photo_url
                    }
                    alt={`${currentProfile.first_name || 'Student'} profile`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <span className="text-7xl">
                      👤
                    </span>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                {/* MATCH BADGE */}

                <div className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm backdrop-blur">
                  ✨ {getMatchPercentage(currentMatch.score)}% Match
                </div>

                {/* NAME */}

                <div className="absolute bottom-6 left-5 right-5 text-white">

                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {currentProfile.first_name}{' '}
                    {currentProfile.last_name}
                  </h2>

                  <p className="mt-2 text-sm font-medium text-white/90">
                    {currentProfile.major ||
                      'Major not listed'}

                    {currentProfile.academic_year
                      ? ` • ${currentProfile.academic_year}`
                      : ''}
                  </p>

                </div>

              </div>

              {/* INFO */}

              <div className="p-6 sm:p-7">

                {/* WHY YOU MATCH */}

                {currentMatch.reasons.length > 0 && (
                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                      Why you match
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">

                      {currentMatch.reasons.map(
                        (reason) => (
                          <span
                            key={reason}
                            className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                          >
                            {reason}
                          </span>
                        )
                      )}

                    </div>

                  </div>
                )}

                {/* CAREER */}

                {currentProfile.career_goal && (
                  <div
                    className={
                      currentMatch.reasons.length > 0
                        ? 'mt-6'
                        : ''
                    }
                  >

                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                      Career interest
                    </p>

                    <div className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-800">
                      {currentProfile.career_goal}
                    </div>

                  </div>
                )}

                {/* BIO */}

                {currentProfile.bio && (
                  <div
                    className={
                      currentProfile.career_goal ||
                      currentMatch.reasons.length > 0
                        ? 'mt-6'
                        : ''
                    }
                  >

                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                      About
                    </p>

                    <p className="mt-2 leading-relaxed text-gray-600">
                      {currentProfile.bio}
                    </p>

                  </div>
                )}

                {/* FALLBACK */}

                {!currentProfile.bio &&
                  !currentProfile.career_goal &&
                  currentMatch.reasons.length === 0 && (
                    <p className="text-sm text-gray-400">
                      This student hasn&apos;t added
                      additional information yet.
                    </p>
                  )}

              </div>

            </div>

            {/* ACTIONS */}

            <div className="mt-5 grid grid-cols-2 gap-3">

              <button
                onClick={skipProfile}
                disabled={sending}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-4 font-semibold shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="mr-2">
                  ✕
                </span>

                Skip
              </button>

              <button
                onClick={
                  sendConnectionRequest
                }
                disabled={sending}
                className="rounded-2xl bg-black px-5 py-4 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="mr-2">
                  ☕
                </span>

                {sending
                  ? 'Sending...'
                  : 'Connect'}
              </button>

            </div>

            {/* HELPER TEXT */}

            <p className="mt-5 text-center text-xs text-gray-400">
              Connect if you&apos;d like to meet
              for coffee or start a conversation.
            </p>

          </>
        )}

      </div>

      {/* BOTTOM NAV */}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">

        <div className="mx-auto flex max-w-3xl justify-around px-3 py-4">

          <button
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
            onClick={() =>
              router.push('/discover')
            }
            className="flex flex-col items-center gap-1 px-3 text-xs font-semibold"
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