'use client'

import {
  useEffect,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type MatchPreferences = {
  user_id: string
  same_major: boolean
  similar_career_interests: boolean
  outside_major: boolean
  upperclassmen: boolean
  mentors: boolean
  project_collaborators: boolean
  frequency: string
  match_style: string
}

const onboardingSteps = [
  { number: 1, title: 'Basic info', shortTitle: 'Basics' },
  { number: 2, title: 'Academic', shortTitle: 'Academic' },
  { number: 3, title: 'Career & about', shortTitle: 'Career' },
  { number: 4, title: 'Interests', shortTitle: 'Interests' },
  { number: 5, title: 'Clubs & organizations', shortTitle: 'Clubs' },
  { number: 6, title: 'Work experience', shortTitle: 'Work' },
  { number: 7, title: 'Projects', shortTitle: 'Projects' },
  { number: 8, title: 'Matching preferences', shortTitle: 'Matching' },
  { number: 9, title: 'Availability', shortTitle: 'Availability' },
  { number: 10, title: 'Privacy', shortTitle: 'Privacy' },
  { number: 11, title: 'Preview', shortTitle: 'Preview' },
]

export default function MatchingOnboardingPage() {
  const router = useRouter()

  const [userId, setUserId] =
    useState('')

  const [
    preferences,
    setPreferences,
  ] =
    useState<MatchPreferences>({
      user_id: '',
      same_major: false,
      similar_career_interests: false,
      outside_major: false,
      upperclassmen: false,
      mentors: false,
      project_collaborators: false,
      frequency: 'weekly',
      match_style: 'balanced',
    })

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const currentStep = 8

  const progress =
    Math.round(
      (
        currentStep /
        onboardingSteps.length
      ) * 100
    )

  useEffect(() => {
    async function loadPreferences() {
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
        data,
        error:
          preferencesError,
      } =
        await supabase
          .from(
            'match_preferences'
          )
          .select(`
            user_id,
            same_major,
            similar_career_interests,
            outside_major,
            upperclassmen,
            mentors,
            project_collaborators,
            frequency,
            match_style
          `)
          .eq(
            'user_id',
            user.id
          )
          .maybeSingle()

      if (preferencesError) {
        setError(
          `Could not load matching preferences: ${preferencesError.message}`
        )
        setLoading(false)
        return
      }

      setPreferences({
        user_id:
          user.id,
        same_major:
          data?.same_major ??
          false,
        similar_career_interests:
          data?.similar_career_interests ??
          false,
        outside_major:
          data?.outside_major ??
          false,
        upperclassmen:
          data?.upperclassmen ??
          false,
        mentors:
          data?.mentors ??
          false,
        project_collaborators:
          data?.project_collaborators ??
          false,
        frequency:
          data?.frequency ||
          'weekly',
        match_style:
          data?.match_style ||
          'balanced',
      })

      setLoading(false)
    }

    loadPreferences()
  }, [])

  async function saveAndContinue() {
    if (
      !userId ||
      saving
    ) {
      return
    }

    setError('')
    setMessage('')
    setSaving(true)

    const supabase =
      createClient()

    const {
      error:
        upsertError,
    } =
      await supabase
        .from(
          'match_preferences'
        )
        .upsert(
          {
            user_id:
              userId,
            same_major:
              preferences.same_major,
            similar_career_interests:
              preferences.similar_career_interests,
            outside_major:
              preferences.outside_major,
            upperclassmen:
              preferences.upperclassmen,
            mentors:
              preferences.mentors,
            project_collaborators:
              preferences.project_collaborators,
            frequency:
              preferences.frequency,
            match_style:
              preferences.match_style,
          },
          {
            onConflict:
              'user_id',
          }
        )

    if (upsertError) {
      setError(
        `Could not save matching preferences: ${upsertError.message}`
      )
      setSaving(false)
      return
    }

    setMessage(
      'Matching preferences saved.'
    )

    setSaving(false)

    router.push(
      '/onboarding/availability'
    )
  }

  function skipForNow() {
    router.push(
      '/onboarding/availability'
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            🎯
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading matching preferences...
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
                '/onboarding/projects'
              )
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
          </button>

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
            Step {currentStep} of{' '}
            {onboardingSteps.length}
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
                    {step.number}
                  </div>

                  <p
                    className={`mt-1 truncate text-[10px] font-medium ${
                      step.number ===
                      currentStep
                        ? 'text-black'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.shortTitle}
                  </p>

                </div>

              )
            )}

          </div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        <section className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Personalize your matches
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Matching Preferences
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            Tell BrewLink what kinds of people and connections you want to prioritize.
            You can select any combination, or leave everything open.
          </p>

        </section>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
            ✓ {message}
          </div>
        )}

        <section className="rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          {/* WHO TO PRIORITIZE */}

          <div>

            <p className="text-sm font-semibold text-gray-900">
              Who should BrewLink prioritize?
            </p>

            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Select as many or as few as you want. Leaving all options off means you are open to anyone.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">

              {[
                {
                  key: 'same_major',
                  title: 'Same major',
                  description:
                    'Prioritize students in your major.',
                },
                {
                  key: 'similar_career_interests',
                  title: 'Similar career interests',
                  description:
                    'Prioritize people pursuing similar career paths.',
                },
                {
                  key: 'outside_major',
                  title: 'Outside my major',
                  description:
                    'Meet people from different academic backgrounds.',
                },
                {
                  key: 'upperclassmen',
                  title: 'Upperclassmen',
                  description:
                    'Prioritize students further along in school.',
                },
                {
                  key: 'mentors',
                  title: 'Mentors',
                  description:
                    'Find people who may be able to guide or advise you.',
                },
                {
                  key: 'project_collaborators',
                  title: 'Project collaborators',
                  description:
                    'Find students who may want to build something together.',
                },
              ].map(
                (option) => {
                  const key =
                    option.key as
                      | 'same_major'
                      | 'similar_career_interests'
                      | 'outside_major'
                      | 'upperclassmen'
                      | 'mentors'
                      | 'project_collaborators'

                  const checked =
                    preferences[
                      key
                    ]

                  return (
                    <button
                      key={
                        option.key
                      }
                      type="button"
                      onClick={() => {
                        setMessage('')
                        setPreferences(
                          (current) => ({
                            ...current,
                            [key]:
                              !current[
                                key
                              ],
                          })
                        )
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        checked
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className={`text-sm font-semibold ${
                            checked
                              ? 'text-white'
                              : 'text-gray-900'
                          }`}>
                            {option.title}
                          </p>

                          <p className={`mt-1 text-xs leading-relaxed ${
                            checked
                              ? 'text-gray-300'
                              : 'text-gray-400'
                          }`}>
                            {option.description}
                          </p>

                        </div>

                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                          checked
                            ? 'border-white bg-white text-black'
                            : 'border-gray-300 text-transparent'
                        }`}>
                          ✓
                        </div>

                      </div>

                    </button>
                  )
                }
              )}

            </div>

          </div>

          {/* MATCH STYLE */}

          <div className="mt-8 border-t border-gray-100 pt-6">

            <p className="text-sm font-semibold text-gray-900">
              Matching style
            </p>

            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Choose how much BrewLink should favor compatibility versus variety.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">

              {[
                {
                  value:
                    'similar',
                  title:
                    'Similar',
                  description:
                    'Favor people most like your profile and preferences.',
                },
                {
                  value:
                    'balanced',
                  title:
                    'Balanced',
                  description:
                    'Mix compatibility with variety.',
                },
                {
                  value:
                    'explore',
                  title:
                    'Explore',
                  description:
                    'Show a wider variety of people and backgrounds.',
                },
              ].map(
                (option) => {
                  const selected =
                    preferences.match_style ===
                    option.value

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() => {
                        setMessage('')
                        setPreferences(
                          (current) => ({
                            ...current,
                            match_style:
                              option.value,
                          })
                        )
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >

                      <p className={`text-sm font-semibold ${
                        selected
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}>
                        {option.title}
                      </p>

                      <p className={`mt-1 text-xs leading-relaxed ${
                        selected
                          ? 'text-gray-300'
                          : 'text-gray-400'
                      }`}>
                        {option.description}
                      </p>

                    </button>
                  )
                }
              )}

            </div>

          </div>

          {/* FREQUENCY */}

          <div className="mt-8 border-t border-gray-100 pt-6">

            <label className="text-sm font-semibold">
              How often do you want new matches?
            </label>

            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              You can change this later from your Profile page.
            </p>

            <select
              value={
                preferences.frequency
              }
              onChange={(event) => {
                setMessage('')
                setPreferences(
                  (current) => ({
                    ...current,
                    frequency:
                      event.target.value,
                  })
                )
              }}
              className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            >
              <option value="daily">
                Daily
              </option>

              <option value="twice_weekly">
                Twice a week
              </option>

              <option value="weekly">
                Weekly
              </option>

              <option value="biweekly">
                Every two weeks
              </option>

              <option value="monthly">
                Monthly
              </option>

              <option value="manual">
                Only when I choose
              </option>
            </select>

          </div>

          {/* NAVIGATION */}

          <div className="mt-8 border-t border-gray-100 pt-6">

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/onboarding/projects'
                  )
                }
                disabled={
                  saving
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                Back
              </button>

              <button
                type="button"
                onClick={
                  saveAndContinue
                }
                disabled={
                  saving
                }
                className="w-full flex-1 rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : 'Save & Continue'}
              </button>

            </div>

            <button
              type="button"
              onClick={
                skipForNow
              }
              disabled={
                saving
              }
              className="mt-4 w-full text-center text-sm font-semibold text-gray-400 transition hover:text-black disabled:opacity-50"
            >
              Skip for now
            </button>

          </div>

        </section>

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-5 shadow-sm">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Coming next
          </p>

          <p className="mt-2 text-sm font-semibold text-gray-700">
            Availability
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Add the days and times you are generally available for BrewLink conversations.
          </p>

        </section>

      </div>

    </main>
  )
}