'use client'

import {
  useEffect,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

export default function PrivacyOnboardingPage() {
  const router = useRouter()

  const [userId, setUserId] =
    useState('')

  const [
    isDiscoverable,
    setIsDiscoverable,
  ] =
    useState(true)

  const [
    showAcademicInfo,
    setShowAcademicInfo,
  ] =
    useState(true)

  const [
    showCareerGoal,
    setShowCareerGoal,
  ] =
    useState(true)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const currentStep = 10

  const progress =
    Math.round(
      (
        currentStep /
        onboardingSteps.length
      ) * 100
    )

  useEffect(() => {
    async function loadPrivacySettings() {
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
          profileError,
      } =
        await supabase
          .from('profiles')
          .select(`
            is_discoverable,
            show_academic_info,
            show_career_goal
          `)
          .eq(
            'id',
            user.id
          )
          .single()

      if (profileError) {
        setError(
          `Could not load privacy settings: ${profileError.message}`
        )
        setLoading(false)
        return
      }

      setIsDiscoverable(
        data.is_discoverable ??
        true
      )

      setShowAcademicInfo(
        data.show_academic_info ??
        true
      )

      setShowCareerGoal(
        data.show_career_goal ??
        true
      )

      setLoading(false)
    }

    loadPrivacySettings()
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
        updateError,
    } =
      await supabase
        .from('profiles')
        .update({
          is_discoverable:
            isDiscoverable,
          show_academic_info:
            showAcademicInfo,
          show_career_goal:
            showCareerGoal,
        })
        .eq(
          'id',
          userId
        )

    if (updateError) {
      setError(
        `Could not save privacy settings: ${updateError.message}`
      )
      setSaving(false)
      return
    }

    setMessage(
      'Privacy settings saved.'
    )

    setSaving(false)

    router.push(
      '/onboarding/preview'
    )
  }

  function skipForNow() {
    router.push(
      '/onboarding/preview'
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            🔒
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading privacy settings...
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
                '/onboarding/availability'
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
            Control your visibility
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy & Discovery
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            Decide whether other students can discover you and which profile details they can see.
            You can change these settings later from your Profile page.
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

          <div className="space-y-4">

            {/* DISCOVERABILITY */}

            <button
              type="button"
              onClick={() => {
                setMessage('')
                setIsDiscoverable(
                  (current) =>
                    !current
                )
              }}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                isDiscoverable
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className={`text-sm font-semibold ${
                    isDiscoverable
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}>
                    Appear in Search & Discovery
                  </p>

                  <p className={`mt-1 text-xs leading-relaxed ${
                    isDiscoverable
                      ? 'text-gray-300'
                      : 'text-gray-400'
                  }`}>
                    {isDiscoverable
                      ? 'Other BrewLink students can discover your profile.'
                      : 'You will be hidden from new Search and Discovery results. Existing connections are not removed.'}
                  </p>

                </div>

                <div className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  isDiscoverable
                    ? 'bg-white'
                    : 'bg-gray-200'
                }`}>

                  <div className={`h-5 w-5 rounded-full transition ${
                    isDiscoverable
                      ? 'translate-x-5 bg-black'
                      : 'translate-x-0 bg-white'
                  }`} />

                </div>

              </div>

            </button>

            {/* ACADEMIC INFO */}

            <button
              type="button"
              onClick={() => {
                setMessage('')
                setShowAcademicInfo(
                  (current) =>
                    !current
                )
              }}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                showAcademicInfo
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm font-semibold text-gray-900">
                    Show academic information
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    Controls whether your major and academic year are visible to other students.
                  </p>

                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    Currently: {showAcademicInfo
                      ? 'Visible'
                      : 'Hidden'}
                  </p>

                </div>

                <div className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  showAcademicInfo
                    ? 'bg-black'
                    : 'bg-gray-200'
                }`}>

                  <div className={`h-5 w-5 rounded-full bg-white transition ${
                    showAcademicInfo
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`} />

                </div>

              </div>

            </button>

            {/* CAREER GOAL */}

            <button
              type="button"
              onClick={() => {
                setMessage('')
                setShowCareerGoal(
                  (current) =>
                    !current
                )
              }}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                showCareerGoal
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm font-semibold text-gray-900">
                    Show career goal
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    Controls whether your primary career direction appears to other students.
                  </p>

                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    Currently: {showCareerGoal
                      ? 'Visible'
                      : 'Hidden'}
                  </p>

                </div>

                <div className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  showCareerGoal
                    ? 'bg-black'
                    : 'bg-gray-200'
                }`}>

                  <div className={`h-5 w-5 rounded-full bg-white transition ${
                    showCareerGoal
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`} />

                </div>

              </div>

            </button>

          </div>

          {/* SUMMARY */}

          <div className="mt-6 rounded-2xl bg-gray-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
              Privacy preview
            </p>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {isDiscoverable
                ? 'Your profile can appear to new people.'
                : 'Your profile is hidden from new discovery.'}
              {' '}
              {showAcademicInfo
                ? 'Academic info is visible.'
                : 'Academic info is hidden.'}
              {' '}
              {showCareerGoal
                ? 'Career goal is visible.'
                : 'Career goal is hidden.'}
            </p>

          </div>

          {/* NAVIGATION */}

          <div className="mt-8 border-t border-gray-100 pt-6">

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/onboarding/availability'
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
            Final Profile Preview
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Review your BrewLink profile exactly as other students will see it before finishing onboarding.
          </p>

        </section>

      </div>

    </main>
  )
}