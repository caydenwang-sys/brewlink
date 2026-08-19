'use client'

import { useEffect, useState } from 'react'
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

export default function MatchingSettingsPage() {
  const router = useRouter()

  const [selected, setSelected] = useState({
    same_major: false,
    similar_career_interests: false,
    outside_major: false,
    upperclassmen: false,
    mentors: false,
    project_collaborators: false,
  })

  const [frequency, setFrequency] = useState('monthly')
  const [matchStyle, setMatchStyle] = useState('similar')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadPreferences() {
      const supabase = createClient()

      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const {
        data,
        error: preferencesError,
      } = await supabase
        .from('match_preferences')
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
        .eq('user_id', user.id)
        .single()

      if (preferencesError) {
        setError(
          `Could not load matching preferences: ${preferencesError.message}`
        )
        setLoading(false)
        return
      }

      const preferences = data as MatchPreferences

      setSelected({
        same_major: preferences.same_major,
        similar_career_interests:
          preferences.similar_career_interests,
        outside_major: preferences.outside_major,
        upperclassmen: preferences.upperclassmen,
        mentors: preferences.mentors,
        project_collaborators:
          preferences.project_collaborators,
      })

      setFrequency(preferences.frequency || 'monthly')
      setMatchStyle(preferences.match_style || 'similar')

      setLoading(false)
    }

    loadPreferences()
  }, [router])

  function togglePreference(
    key: keyof typeof selected
  ) {
    setSelected((current) => ({
      ...current,
      [key]: !current[key],
    }))

    setSuccess('')
    setError('')
  }

  async function savePreferences() {
    if (saving) {
      return
    }

    const hasPreference = Object.values(selected).some(
      (value) => value === true
    )

    if (!hasPreference) {
      setError(
        'Please select at least one matching preference.'
      )
      setSuccess('')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setSaving(false)
      router.push('/login')
      return
    }

    const { error: updateError } = await supabase
      .from('match_preferences')
      .update({
        same_major: selected.same_major,
        similar_career_interests:
          selected.similar_career_interests,
        outside_major: selected.outside_major,
        upperclassmen: selected.upperclassmen,
        mentors: selected.mentors,
        project_collaborators:
          selected.project_collaborators,
        frequency,
        match_style: matchStyle,
      })
      .eq('user_id', user.id)

    if (updateError) {
      setError(
        `Could not save matching preferences: ${updateError.message}`
      )
      setSaving(false)
      return
    }

    setSuccess('Matching preferences saved.')
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            ☕
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading matching preferences...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-20">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            type="button"
            onClick={() => router.push('/settings')}
            className="text-xl font-bold tracking-tight"
          >
            BrewLink
          </button>

          <button
            type="button"
            onClick={() => router.push('/settings')}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            Back
          </button>

        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        {/* Title */}
        <section className="mb-10">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Matching
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Matching preferences
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500">
            Update the same preferences you selected during onboarding.
          </p>

        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Connection preferences */}
        <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Connection preferences
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose the kinds of people BrewLink should prioritize.
          </p>

          <div className="mt-6 space-y-3">

            <button
              type="button"
              onClick={() =>
                togglePreference('same_major')
              }
              className={`w-full rounded-2xl border p-5 text-left transition ${
                selected.same_major
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">
                {selected.same_major ? '✓ ' : ''}
                Same major
              </div>

              <p
                className={`mt-1 text-sm ${
                  selected.same_major
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}
              >
                Prioritize students studying the same major.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                togglePreference(
                  'similar_career_interests'
                )
              }
              className={`w-full rounded-2xl border p-5 text-left transition ${
                selected.similar_career_interests
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">
                {selected.similar_career_interests
                  ? '✓ '
                  : ''}
                Similar career interests
              </div>

              <p
                className={`mt-1 text-sm ${
                  selected.similar_career_interests
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}
              >
                Prioritize students with similar career goals.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                togglePreference('outside_major')
              }
              className={`w-full rounded-2xl border p-5 text-left transition ${
                selected.outside_major
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">
                {selected.outside_major ? '✓ ' : ''}
                Outside my major
              </div>

              <p
                className={`mt-1 text-sm ${
                  selected.outside_major
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}
              >
                Help me meet people from different academic backgrounds.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                togglePreference('upperclassmen')
              }
              className={`w-full rounded-2xl border p-5 text-left transition ${
                selected.upperclassmen
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">
                {selected.upperclassmen ? '✓ ' : ''}
                Upperclassmen
              </div>

              <p
                className={`mt-1 text-sm ${
                  selected.upperclassmen
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}
              >
                Prioritize students who are further along in college.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                togglePreference('mentors')
              }
              className={`w-full rounded-2xl border p-5 text-left transition ${
                selected.mentors
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">
                {selected.mentors ? '✓ ' : ''}
                Mentors
              </div>

              <p
                className={`mt-1 text-sm ${
                  selected.mentors
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}
              >
                Connect me with students who can provide advice and guidance.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                togglePreference(
                  'project_collaborators'
                )
              }
              className={`w-full rounded-2xl border p-5 text-left transition ${
                selected.project_collaborators
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">
                {selected.project_collaborators
                  ? '✓ '
                  : ''}
                Project collaborators
              </div>

              <p
                className={`mt-1 text-sm ${
                  selected.project_collaborators
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}
              >
                Find students who may want to work on projects together.
              </p>
            </button>

          </div>

        </section>

        {/* Frequency */}
        <section className="mt-6 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Match frequency
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose how often you want BrewLink to create new introductions.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">

            {[
              { value: 'weekly', label: 'Weekly' },
              { value: 'biweekly', label: 'Biweekly' },
              { value: 'monthly', label: 'Monthly' },
            ].map((option) => {

              const isSelected =
                frequency === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFrequency(option.value)
                    setSuccess('')
                    setError('')
                  }}
                  className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}
                  {option.label}
                </button>
              )
            })}

          </div>

        </section>

        {/* Match style */}
        <section className="mt-6 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Match style
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose whether BrewLink should favor similarity or new perspectives.
          </p>

          <div className="mt-5 space-y-3">

            {[
              {
                value: 'similar',
                title: 'Similar interests',
                description:
                  'Prioritize people with similar interests.',
              },
              {
                value: 'balanced',
                title: 'Balanced',
                description:
                  'Mix familiar connections with new perspectives.',
              },
              {
                value: 'different',
                title: 'New perspectives',
                description:
                  'Prioritize people with different interests.',
              },
            ].map((option) => {

              const isSelected =
                matchStyle === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setMatchStyle(option.value)
                    setSuccess('')
                    setError('')
                  }}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">
                    {isSelected ? '✓ ' : ''}
                    {option.title}
                  </div>

                  <p
                    className={`mt-1 text-sm ${
                      isSelected
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    }`}
                  >
                    {option.description}
                  </p>
                </button>
              )
            })}

          </div>

        </section>

        {/* Save */}
        <button
          type="button"
          onClick={savePreferences}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-black px-5 py-4 font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? 'Saving...'
            : 'Save matching preferences'}
        </button>

      </div>

    </main>
  )
}