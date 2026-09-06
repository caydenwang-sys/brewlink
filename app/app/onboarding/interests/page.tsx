'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Interest = {
  id: number
  name: string
  category: string | null
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

export default function InterestsPage() {
  const router = useRouter()

  const [userId, setUserId] =
    useState('')

  const [allInterests, setAllInterests] =
    useState<Interest[]>([])

  const [
    selectedInterests,
    setSelectedInterests,
  ] =
    useState<Interest[]>([])

  const [query, setQuery] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [
    actionInterestId,
    setActionInterestId,
  ] =
    useState<number | null>(null)

  const [
    creatingInterest,
    setCreatingInterest,
  ] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const currentStep = 4

  const progress =
    Math.round(
      (
        currentStep /
        onboardingSteps.length
      ) * 100
    )

  useEffect(() => {
    async function loadInterests() {
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
        data: interestData,
        error: interestError,
      } =
        await supabase
          .from('interests')
          .select(`
            id,
            name,
            category
          `)
          .order(
            'name',
            {
              ascending: true,
            }
          )

      if (interestError) {
        setError(
          `Could not load interests: ${interestError.message}`
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
            'user_interests'
          )
          .select(`
            interest_id
          `)
          .eq(
            'user_id',
            user.id
          )

      if (selectedError) {
        setError(
          `Could not load your interests: ${selectedError.message}`
        )
        setLoading(false)
        return
      }

      const loadedInterests =
        (interestData ||
          []) as Interest[]

      const selectedIds =
        new Set(
          (
            selectedRows ||
            []
          ).map(
            (row) =>
              row.interest_id
          )
        )

      setAllInterests(
        loadedInterests
      )

      setSelectedInterests(
        loadedInterests.filter(
          (interest) =>
            selectedIds.has(
              interest.id
            )
        )
      )

      setLoading(false)
    }

    loadInterests()
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
    interest: Interest,
    value: string
  ) {
    const normalizedQuery =
      normalize(
        value
      )

    if (
      !normalizedQuery
    ) {
      return true
    }

    const name =
      normalize(
        interest.name
      )

    const category =
      normalize(
        interest.category ||
          ''
      )

    if (
      name.includes(
        normalizedQuery
      ) ||
      category.includes(
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
      `${name} ${category}`
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

  const filteredInterests =
    useMemo(() => {
      const selectedIds =
        new Set(
          selectedInterests.map(
            (interest) =>
              interest.id
          )
        )

      return allInterests
        .filter(
          (interest) =>
            !selectedIds.has(
              interest.id
            )
        )
        .filter(
          (interest) =>
            matchesQuery(
              interest,
              query
            )
        )
        .slice(0, 14)
    }, [
      allInterests,
      selectedInterests,
      query,
    ])

  const normalizedQuery =
    normalize(
      query
    )

  const exactInterest =
    allInterests.find(
      (interest) =>
        normalize(
          interest.name
        ) ===
        normalizedQuery
    )

  const exactInterestSelected =
    exactInterest
      ? selectedInterests.some(
          (interest) =>
            interest.id ===
            exactInterest.id
        )
      : false

  async function addInterest(
    interest: Interest
  ) {
    if (
      !userId ||
      actionInterestId !==
        null ||
      creatingInterest
    ) {
      return
    }

    setError('')
    setMessage('')
    setActionInterestId(
      interest.id
    )

    const supabase =
      createClient()

    const {
      error: insertError,
    } =
      await supabase
        .from(
          'user_interests'
        )
        .insert({
          user_id:
            userId,
          interest_id:
            interest.id,
        })

    if (insertError) {
      setError(
        `Could not add interest: ${insertError.message}`
      )
      setActionInterestId(
        null
      )
      return
    }

    setSelectedInterests(
      (current) =>
        [...current, interest]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    setQuery('')
    setMessage(
      `${interest.name} added.`
    )

    setActionInterestId(
      null
    )
  }

  async function removeInterest(
    interest: Interest
  ) {
    if (
      !userId ||
      actionInterestId !==
        null ||
      creatingInterest
    ) {
      return
    }

    setError('')
    setMessage('')
    setActionInterestId(
      interest.id
    )

    const supabase =
      createClient()

    const {
      error: deleteError,
    } =
      await supabase
        .from(
          'user_interests'
        )
        .delete()
        .eq(
          'user_id',
          userId
        )
        .eq(
          'interest_id',
          interest.id
        )

    if (deleteError) {
      setError(
        `Could not remove interest: ${deleteError.message}`
      )
      setActionInterestId(
        null
      )
      return
    }

    setSelectedInterests(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            interest.id
        )
    )

    setMessage(
      `${interest.name} removed.`
    )

    setActionInterestId(
      null
    )
  }

  async function createCustomInterest() {
    const cleanedName =
      query
        .trim()
        .replace(/\s+/g, ' ')

    if (
      !cleanedName ||
      !userId ||
      creatingInterest ||
      actionInterestId !==
        null
    ) {
      return
    }

    if (
      exactInterest &&
      !exactInterestSelected
    ) {
      await addInterest(
        exactInterest
      )
      return
    }

    if (
      exactInterestSelected
    ) {
      setMessage(
        `${exactInterest?.name} is already selected.`
      )
      return
    }

    setError('')
    setMessage('')
    setCreatingInterest(
      true
    )

    const supabase =
      createClient()

    const {
      data: createdInterest,
      error: createError,
    } =
      await supabase
        .from(
          'interests'
        )
        .insert({
          name:
            cleanedName,
          category:
            'Other',
        })
        .select(`
          id,
          name,
          category
        `)
        .single()

    if (createError) {
      const {
        data: refreshed,
        error: refreshError,
      } =
        await supabase
          .from(
            'interests'
          )
          .select(`
            id,
            name,
            category
          `)
          .order(
            'name',
            {
              ascending: true,
            }
          )

      if (refreshError) {
        setError(
          `Could not create interest: ${createError.message}`
        )
        setCreatingInterest(
          false
        )
        return
      }

      const refreshedInterests =
        (refreshed ||
          []) as Interest[]

      setAllInterests(
        refreshedInterests
      )

      const matchingInterest =
        refreshedInterests.find(
          (interest) =>
            normalize(
              interest.name
            ) ===
            normalize(
              cleanedName
            )
        )

      if (
        !matchingInterest
      ) {
        setError(
          `Could not create interest: ${createError.message}`
        )
        setCreatingInterest(
          false
        )
        return
      }

      const alreadySelected =
        selectedInterests.some(
          (interest) =>
            interest.id ===
            matchingInterest.id
        )

      if (
        !alreadySelected
      ) {
        const {
          error: linkError,
        } =
          await supabase
            .from(
              'user_interests'
            )
            .insert({
              user_id:
                userId,
              interest_id:
                matchingInterest.id,
            })

        if (linkError) {
          setError(
            `Interest exists, but could not be added to your profile: ${linkError.message}`
          )
          setCreatingInterest(
            false
          )
          return
        }

        setSelectedInterests(
          (current) =>
            [
              ...current,
              matchingInterest,
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
        `${matchingInterest.name} added.`
      )
      setCreatingInterest(
        false
      )
      return
    }

    const newInterest =
      createdInterest as Interest

    setAllInterests(
      (current) =>
        [...current, newInterest]
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
          'user_interests'
        )
        .insert({
          user_id:
            userId,
          interest_id:
            newInterest.id,
        })

    if (linkError) {
      setError(
        `Interest was created, but could not be added to your profile: ${linkError.message}`
      )
      setCreatingInterest(
        false
      )
      return
    }

    setSelectedInterests(
      (current) =>
        [...current, newInterest]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    setQuery('')
    setMessage(
      `${newInterest.name} created and added.`
    )

    setCreatingInterest(
      false
    )
  }

  function goNext() {
    router.push(
      '/onboarding/clubs'
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            ✨
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading interests...
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
                '/onboarding'
              )
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            Brework
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
            Personalize your profile
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            What are you interested in?
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            Choose none, one, or as many as you want.
            Brework uses these to improve Search,
            Discovery, and compatibility ranking.
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
                  Your interests
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {selectedInterests.length}{' '}
                  {selectedInterests.length === 1
                    ? 'interest'
                    : 'interests'} selected
                  • no limit
                </p>

              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                Saved automatically
              </span>

            </div>

            {selectedInterests.length ===
            0 ? (

              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

                <p className="text-sm font-semibold text-gray-700">
                  No interests selected yet
                </p>

                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  That&apos;s okay. You can add some below
                  or skip this step entirely.
                </p>

              </div>

            ) : (

              <div className="mt-4 flex flex-wrap gap-2">

                {selectedInterests.map(
                  (interest) => (

                  <button
                    key={
                      interest.id
                    }
                    type="button"
                    onClick={() =>
                      removeInterest(
                        interest
                      )
                    }
                    disabled={
                      actionInterestId !==
                        null ||
                      creatingInterest
                    }
                    className="group flex max-w-full items-center gap-2 rounded-full bg-black px-3 py-2 text-left text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <span className="break-words">
                      {interest.name}
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
              Find or add an interest
            </label>

            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Search existing interests by name or category.
              If your interest is missing, create it.
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
                      exactInterest &&
                      !exactInterestSelected
                    ) {
                      addInterest(
                        exactInterest
                      )
                      return
                    }

                    if (
                      normalizedQuery &&
                      !exactInterest
                    ) {
                      createCustomInterest()
                    }
                  }
                }}
                placeholder="Try AI, finance, startups, research..."
                maxLength={80}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              />

              {query && (
                <button
                  type="button"
                  onClick={() =>
                    setQuery('')
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-black"
                  aria-label="Clear interest search"
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

                  {filteredInterests.length >
                    0 && (

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                        Suggestions
                      </p>

                      <div className="mt-3 space-y-2">

                        {filteredInterests.map(
                          (interest) => (

                          <button
                            key={
                              interest.id
                            }
                            type="button"
                            onClick={() =>
                              addInterest(
                                interest
                              )
                            }
                            disabled={
                              actionInterestId !==
                                null ||
                              creatingInterest
                            }
                            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >

                            <div className="min-w-0">

                              <p className="break-words text-sm font-semibold text-gray-900">
                                {interest.name}
                              </p>

                              {interest.category && (
                                <p className="mt-1 text-xs text-gray-400">
                                  {
                                    interest.category
                                  }
                                </p>
                              )}

                            </div>

                            <span className="shrink-0 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
                              {actionInterestId ===
                              interest.id
                                ? 'Adding...'
                                : '+ Add'}
                            </span>

                          </button>

                        ))}

                      </div>

                    </div>

                  )}

                  {!exactInterest &&
                    normalizedQuery && (

                    <div className="mt-4 rounded-2xl bg-gray-50 p-4">

                      <p className="text-sm font-semibold text-gray-800">
                        Don&apos;t see your interest?
                      </p>

                      <p className="mt-1 break-words text-sm text-gray-500">
                        Create “{query.trim()}” and add it to
                        your profile.
                      </p>

                      <button
                        type="button"
                        onClick={
                          createCustomInterest
                        }
                        disabled={
                          creatingInterest ||
                          actionInterestId !==
                            null
                        }
                        className="mt-3 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {creatingInterest
                          ? 'Creating...'
                          : `+ Create "${query.trim()}"`}
                      </button>

                    </div>

                  )}

                  {exactInterestSelected && (
                    <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                      {exactInterest?.name} is already selected.
                    </div>
                  )}

                </>

              ) : (

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Browse interests
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {filteredInterests
                      .slice(0, 12)
                      .map(
                        (interest) => (

                        <button
                          key={
                            interest.id
                          }
                          type="button"
                          onClick={() =>
                            addInterest(
                              interest
                            )
                          }
                          disabled={
                            actionInterestId !==
                              null ||
                            creatingInterest
                          }
                          className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          + {interest.name}
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
                    '/onboarding'
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
            Clubs & Organizations
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Add the groups, organizations, teams, and
            communities you&apos;re part of.
          </p>

        </section>

      </div>

    </main>
  )
}