'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Club = {
  id: number
  name: string
  description: string | null
}

const onboardingSteps = [
  {
    number: 1,
    title: 'Basic info',
    shortTitle: 'Basics',
  },
  {
    number: 2,
    title: 'Academic',
    shortTitle: 'Academic',
  },
  {
    number: 3,
    title: 'Career & about',
    shortTitle: 'Career',
  },
  {
    number: 4,
    title: 'Interests',
    shortTitle: 'Interests',
  },
  {
    number: 5,
    title: 'Clubs & organizations',
    shortTitle: 'Clubs',
  },
  {
    number: 6,
    title: 'Work experience',
    shortTitle: 'Work',
  },
  {
    number: 7,
    title: 'Projects',
    shortTitle: 'Projects',
  },
  {
    number: 8,
    title: 'Matching preferences',
    shortTitle: 'Matching',
  },
  {
    number: 9,
    title: 'Availability',
    shortTitle: 'Availability',
  },
  {
    number: 10,
    title: 'Privacy',
    shortTitle: 'Privacy',
  },
  {
    number: 11,
    title: 'Preview',
    shortTitle: 'Preview',
  },
]

export default function ClubsPage() {
  const router = useRouter()

  const [userId, setUserId] =
    useState('')

  const [allClubs, setAllClubs] =
    useState<Club[]>([])

  const [
    selectedClubs,
    setSelectedClubs,
  ] =
    useState<Club[]>([])

  const [query, setQuery] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [
    actionClubId,
    setActionClubId,
  ] =
    useState<number | null>(null)

  const [
    creatingClub,
    setCreatingClub,
  ] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const currentStep = 5

  const progress =
    Math.round(
      (
        currentStep /
        onboardingSteps.length
      ) * 100
    )

  useEffect(() => {
    async function loadClubs() {
      const supabase =
        createClient()

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser()

      if (
        userError ||
        !user
      ) {
        setError(
          'You must be logged in to continue.'
        )
        setLoading(false)
        return
      }

      setUserId(
        user.id
      )

      const {
        data: clubData,
        error: clubError,
      } =
        await supabase
          .from('clubs')
          .select(`
            id,
            name,
            description
          `)
          .order(
            'name',
            {
              ascending: true,
            }
          )

      if (clubError) {
        setError(
          `Could not load clubs: ${clubError.message}`
        )
        setLoading(false)
        return
      }

      const {
        data: selectedRows,
        error: selectedError,
      } =
        await supabase
          .from(
            'user_clubs'
          )
          .select(`
            club_id
          `)
          .eq(
            'user_id',
            user.id
          )

      if (selectedError) {
        setError(
          `Could not load your clubs: ${selectedError.message}`
        )
        setLoading(false)
        return
      }

      const loadedClubs =
        (clubData ||
          []) as Club[]

      const selectedIds =
        new Set(
          (
            selectedRows ||
            []
          ).map(
            (row) =>
              row.club_id
          )
        )

      setAllClubs(
        loadedClubs
      )

      setSelectedClubs(
        loadedClubs.filter(
          (club) =>
            selectedIds.has(
              club.id
            )
        )
      )

      setLoading(false)
    }

    loadClubs()
  }, [])

  function normalize(
    value: string
  ) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
  }

  function matchesQuery(
    club: Club,
    value: string
  ) {
    const normalizedQuery =
      normalize(
        value
      )

    if (!normalizedQuery) {
      return true
    }

    const name =
      normalize(
        club.name
      )

    const description =
      normalize(
        club.description ||
          ''
      )

    if (
      name.includes(
        normalizedQuery
      ) ||
      description.includes(
        normalizedQuery
      )
    ) {
      return true
    }

    const queryWords =
      normalizedQuery.split(
        ' '
      )

    const targetWords =
      `${name} ${description}`
        .split(' ')
        .filter(Boolean)

    return queryWords.every(
      (queryWord) =>
        targetWords.some(
          (targetWord) =>
            targetWord.startsWith(
              queryWord
            ) ||
            (
              queryWord.length >= 4 &&
              targetWord.includes(
                queryWord
              )
            )
        )
    )
  }

  const filteredClubs =
    useMemo(() => {
      const selectedIds =
        new Set(
          selectedClubs.map(
            (club) =>
              club.id
          )
        )

      return allClubs
        .filter(
          (club) =>
            !selectedIds.has(
              club.id
            )
        )
        .filter(
          (club) =>
            matchesQuery(
              club,
              query
            )
        )
        .slice(0, 14)
    }, [
      allClubs,
      selectedClubs,
      query,
    ])

  const normalizedQuery =
    normalize(
      query
    )

  const exactClub =
    allClubs.find(
      (club) =>
        normalize(
          club.name
        ) ===
        normalizedQuery
    )

  const exactClubSelected =
    exactClub
      ? selectedClubs.some(
          (club) =>
            club.id ===
            exactClub.id
        )
      : false

  async function addClub(
    club: Club
  ) {
    if (
      !userId ||
      actionClubId !==
        null ||
      creatingClub
    ) {
      return
    }

    setError('')
    setMessage('')
    setActionClubId(
      club.id
    )

    const supabase =
      createClient()

    const {
      error: insertError,
    } =
      await supabase
        .from(
          'user_clubs'
        )
        .insert({
          user_id:
            userId,
          club_id:
            club.id,
        })

    if (insertError) {
      setError(
        `Could not add club: ${insertError.message}`
      )
      setActionClubId(
        null
      )
      return
    }

    setSelectedClubs(
      (current) =>
        [...current, club]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    setQuery('')
    setMessage(
      `${club.name} added.`
    )

    setActionClubId(
      null
    )
  }

  async function removeClub(
    club: Club
  ) {
    if (
      !userId ||
      actionClubId !==
        null ||
      creatingClub
    ) {
      return
    }

    setError('')
    setMessage('')
    setActionClubId(
      club.id
    )

    const supabase =
      createClient()

    const {
      error: deleteError,
    } =
      await supabase
        .from(
          'user_clubs'
        )
        .delete()
        .eq(
          'user_id',
          userId
        )
        .eq(
          'club_id',
          club.id
        )

    if (deleteError) {
      setError(
        `Could not remove club: ${deleteError.message}`
      )
      setActionClubId(
        null
      )
      return
    }

    setSelectedClubs(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            club.id
        )
    )

    setMessage(
      `${club.name} removed.`
    )

    setActionClubId(
      null
    )
  }

  async function createCustomClub() {
    const cleanedName =
      query
        .trim()
        .replace(/\s+/g, ' ')

    if (
      !cleanedName ||
      !userId ||
      creatingClub ||
      actionClubId !==
        null
    ) {
      return
    }

    if (
      exactClub &&
      !exactClubSelected
    ) {
      await addClub(
        exactClub
      )
      return
    }

    if (
      exactClubSelected
    ) {
      setMessage(
        `${exactClub?.name} is already selected.`
      )
      return
    }

    setError('')
    setMessage('')
    setCreatingClub(
      true
    )

    const supabase =
      createClient()

    const {
      data: createdClub,
      error: createError,
    } =
      await supabase
        .from('clubs')
        .insert({
          name:
            cleanedName,
          description:
            null,
        })
        .select(`
          id,
          name,
          description
        `)
        .single()

    if (createError) {
      const {
        data: refreshed,
        error: refreshError,
      } =
        await supabase
          .from('clubs')
          .select(`
            id,
            name,
            description
          `)
          .order(
            'name',
            {
              ascending: true,
            }
          )

      if (refreshError) {
        setError(
          `Could not create club: ${createError.message}`
        )
        setCreatingClub(
          false
        )
        return
      }

      const refreshedClubs =
        (refreshed ||
          []) as Club[]

      setAllClubs(
        refreshedClubs
      )

      const matchingClub =
        refreshedClubs.find(
          (club) =>
            normalize(
              club.name
            ) ===
            normalize(
              cleanedName
            )
        )

      if (!matchingClub) {
        setError(
          `Could not create club: ${createError.message}`
        )
        setCreatingClub(
          false
        )
        return
      }

      const alreadySelected =
        selectedClubs.some(
          (club) =>
            club.id ===
            matchingClub.id
        )

      if (
        !alreadySelected
      ) {
        const {
          error: linkError,
        } =
          await supabase
            .from(
              'user_clubs'
            )
            .insert({
              user_id:
                userId,
              club_id:
                matchingClub.id,
            })

        if (linkError) {
          setError(
            `Club exists, but could not be added to your profile: ${linkError.message}`
          )
          setCreatingClub(
            false
          )
          return
        }

        setSelectedClubs(
          (current) =>
            [
              ...current,
              matchingClub,
            ].sort(
              (a, b) =>
                a.name.localeCompare(
                  b.name
                )
            )
        )
      }

      setQuery('')
      setMessage(
        `${matchingClub.name} added.`
      )
      setCreatingClub(false)
      return
    }

    const newClub =
      createdClub as Club

    setAllClubs(
      (current) =>
        [...current, newClub]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    const {
      error: linkError,
    } =
      await supabase
        .from(
          'user_clubs'
        )
        .insert({
          user_id:
            userId,
          club_id:
            newClub.id,
        })

    if (linkError) {
      setError(
        `Club was created, but could not be added to your profile: ${linkError.message}`
      )
      setCreatingClub(false)
      return
    }

    setSelectedClubs(
      (current) =>
        [...current, newClub]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    setQuery('')
    setMessage(
      `${newClub.name} created and added.`
    )

    setCreatingClub(false)
  }

  function goNext() {
    router.push(
      '/onboarding/work'
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            👥
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading clubs...
          </p>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">

      {/* HEADER */}

      <header className="border-b border-gray-200/70 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/onboarding/interests'
              )
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
          </button>

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
            Step {currentStep} of{' '}
            {
              onboardingSteps.length
            }
          </span>

        </div>

      </header>

      {/* PROGRESS */}

      <div className="border-b border-gray-200/70 bg-white">

        <div className="mx-auto max-w-5xl px-5 pb-4 sm:px-6">

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">

            <div
              className="h-full rounded-full bg-black transition-all"
              style={{
                width:
                  `${progress}%`,
              }}
            />

          </div>

          <div className="mt-3 hidden grid-cols-11 gap-1 lg:grid">

            {onboardingSteps.map(
              (step) => (

                <div
                  key={
                    step.number
                  }
                  className="text-center"
                >

                  <div
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                      step.number ===
                      currentStep
                        ? 'bg-black text-white'
                        : step.number <
                          currentStep
                          ? 'bg-gray-300 text-white'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {
                      step.number
                    }
                  </div>

                  <p
                    className={`mt-1 truncate text-[10px] font-medium ${
                      step.number ===
                      currentStep
                        ? 'text-black'
                        : 'text-gray-400'
                    }`}
                  >
                    {
                      step.shortTitle
                    }
                  </p>

                </div>

              )
            )}

          </div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        {/* INTRO */}

        <section className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Your communities
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Clubs & Organizations
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            Add none, one, or as many groups as you want.
            These can help other students discover shared
            communities and experiences.
          </p>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* EDITOR */}

        <section className="rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          {/* SELECTED */}

          <div>

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>

                <p className="text-sm font-semibold text-gray-900">
                  Your clubs
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {selectedClubs.length}{' '}
                  {selectedClubs.length === 1
                    ? 'club'
                    : 'clubs'} selected
                  • no limit
                </p>

              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                Saved automatically
              </span>

            </div>

            {selectedClubs.length === 0 ? (

              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

                <p className="text-sm font-semibold text-gray-700">
                  No clubs selected yet
                </p>

                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  That&apos;s completely fine. Search below,
                  create a missing organization, or skip this step.
                </p>

              </div>

            ) : (

              <div className="mt-4 flex flex-wrap gap-2">

                {selectedClubs.map(
                  (club) => (

                  <button
                    key={
                      club.id
                    }
                    type="button"
                    onClick={() =>
                      removeClub(
                        club
                      )
                    }
                    disabled={
                      actionClubId !==
                        null ||
                      creatingClub
                    }
                    className="group flex max-w-full items-center gap-2 rounded-full bg-black px-3 py-2 text-left text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <span className="break-words">
                      {club.name}
                    </span>

                    <span className="text-gray-300 transition group-hover:text-white">
                      ×
                    </span>

                  </button>

                ))}

              </div>

            )}

          </div>

          {/* SEARCH */}

          <div className="mt-7 border-t border-gray-100 pt-6">

            <label className="text-sm font-semibold">
              Find or add a club
            </label>

            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Search existing organizations by name or description.
              If yours is missing, create it.
            </p>

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100">

              <span className="shrink-0 text-lg">
                🔎
              </span>

              <input
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(
                    event.target.value
                  )
                  setMessage('')
                  setError('')
                }}
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    'Enter'
                  ) {
                    event.preventDefault()

                    if (
                      exactClub &&
                      !exactClubSelected
                    ) {
                      addClub(
                        exactClub
                      )
                      return
                    }

                    if (
                      normalizedQuery &&
                      !exactClub
                    ) {
                      createCustomClub()
                    }
                  }
                }}
                placeholder="Try AI Club, consulting, tennis..."
                maxLength={100}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              />

              {query && (
                <button
                  type="button"
                  onClick={() =>
                    setQuery('')
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-black"
                  aria-label="Clear club search"
                >
                  ×
                </button>
              )}

            </div>

            {message && (
              <p className="mt-3 text-sm font-medium text-green-700">
                ✓ {message}
              </p>
            )}

            {/* RESULTS */}

            <div className="mt-4">

              {query.trim() ? (

                <>

                  {filteredClubs.length > 0 && (

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                        Suggestions
                      </p>

                      <div className="mt-3 space-y-2">

                        {filteredClubs.map(
                          (club) => (

                          <button
                            key={
                              club.id
                            }
                            type="button"
                            onClick={() =>
                              addClub(
                                club
                              )
                            }
                            disabled={
                              actionClubId !==
                                null ||
                              creatingClub
                            }
                            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >

                            <div className="min-w-0">

                              <p className="break-words text-sm font-semibold text-gray-900">
                                {club.name}
                              </p>

                              {club.description && (
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">
                                  {
                                    club.description
                                  }
                                </p>
                              )}

                            </div>

                            <span className="shrink-0 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
                              {actionClubId ===
                              club.id
                                ? 'Adding...'
                                : '+ Add'}
                            </span>

                          </button>

                        ))}

                      </div>

                    </div>

                  )}

                  {!exactClub &&
                    normalizedQuery && (

                    <div className="mt-4 rounded-2xl bg-gray-50 p-4">

                      <p className="text-sm font-semibold text-gray-800">
                        Don&apos;t see your organization?
                      </p>

                      <p className="mt-1 break-words text-sm text-gray-500">
                        Create “{query.trim()}” and add it to
                        your profile.
                      </p>

                      <button
                        type="button"
                        onClick={
                          createCustomClub
                        }
                        disabled={
                          creatingClub ||
                          actionClubId !==
                            null
                        }
                        className="mt-3 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {creatingClub
                          ? 'Creating...'
                          : `+ Create "${query.trim()}"`}
                      </button>

                    </div>

                  )}

                  {exactClubSelected && (

                    <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                      {exactClub?.name} is already selected.
                    </div>

                  )}

                </>

              ) : (

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Browse clubs
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {filteredClubs
                      .slice(0, 12)
                      .map(
                        (club) => (

                        <button
                          key={
                            club.id
                          }
                          type="button"
                          onClick={() =>
                            addClub(
                              club
                            )
                          }
                          disabled={
                            actionClubId !==
                              null ||
                            creatingClub
                          }
                          className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          + {club.name}
                        </button>

                      )
                    )}

                  </div>

                </div>

              )}

            </div>

          </div>

          {/* NAVIGATION */}

          <div className="mt-8 border-t border-gray-100 pt-6">

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/onboarding/interests'
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 font-semibold text-gray-600 transition hover:bg-gray-50 sm:w-auto"
              >
                Back
              </button>

              <button
                type="button"
                onClick={
                  goNext
                }
                className="w-full flex-1 rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Continue
              </button>

            </div>

            <button
              type="button"
              onClick={
                goNext
              }
              className="mt-4 w-full text-center text-sm font-semibold text-gray-400 transition hover:text-black"
            >
              Skip for now
            </button>

          </div>

        </section>

        {/* NEXT */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-5 shadow-sm">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Coming next
          </p>

          <p className="mt-2 text-sm font-semibold text-gray-700">
            Work Experience
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Add internships, jobs, research roles, or other
            experience — or skip if you do not have any yet.
          </p>

        </section>

      </div>

    </main>
  )
}