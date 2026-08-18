'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const preferences = [
  {
    key: 'same_major',
    title: 'Same major',
    description: 'Match me with students studying the same major.',
  },
  {
    key: 'similar_career_interests',
    title: 'Similar career interests',
    description:
      'Match me with students interested in similar careers.',
  },
  {
    key: 'outside_major',
    title: 'Outside my major',
    description:
      'Help me meet people from different academic backgrounds.',
  },
  {
    key: 'upperclassmen',
    title: 'Upperclassmen',
    description:
      'Prioritize students who are further along in college.',
  },
  {
    key: 'mentors',
    title: 'Mentors',
    description:
      'Connect me with students who can provide advice and guidance.',
  },
  {
    key: 'project_collaborators',
    title: 'Project collaborators',
    description:
      'Help me find students who might want to work on projects together.',
  },
]

export default function PreferencesPage() {
  const router = useRouter()

  const [selected, setSelected] = useState({
    same_major: true,
    similar_career_interests: true,
    outside_major: false,
    upperclassmen: false,
    mentors: false,
    project_collaborators: false,
  })

  const [frequency, setFrequency] = useState('monthly')
  const [matchStyle, setMatchStyle] = useState('similar')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function togglePreference(key: keyof typeof selected) {
    setSelected((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  async function handleContinue() {
    const hasPreference = Object.values(selected).some(
      (value) => value === true
    )

    if (!hasPreference) {
      setError('Please select at least one matching preference.')
      return
    }

    setError('')
    setLoading(true)

    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be logged in to continue.')
      setLoading(false)
      return
    }

    const { error: saveError } = await supabase
      .from('match_preferences')
      .upsert({
        user_id: user.id,

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

    if (saveError) {
      setError(
        `Could not save preferences: ${saveError.message}`
      )
      setLoading(false)
      return
    }

    setLoading(false)

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">

      <div className="mx-auto max-w-2xl">

        {/* Progress */}
        <div className="mb-10">

          <div className="mb-2 flex justify-between text-sm text-gray-500">
            <span>Step 5 of 5</span>
            <span>Match preferences</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-full rounded-full bg-black" />
          </div>

        </div>

        {/* Header */}
        <div className="mb-10">

          <h1 className="text-4xl font-bold tracking-tight">
            Who would you like to meet?
          </h1>

          <p className="mt-3 text-gray-600">
            Tell BrewLink what kinds of connections you're
            looking for.
          </p>

        </div>

        {/* Matching preferences */}
        <section className="mb-10">

          <h2 className="mb-2 text-lg font-semibold">
            Connection preferences
          </h2>

          <p className="mb-4 text-sm text-gray-500">
            Select everything that sounds useful to you.
          </p>

          <div className="space-y-3">

            {preferences.map((preference) => {

              const key =
                preference.key as keyof typeof selected

              const isSelected = selected[key]

              return (
                <button
                  key={preference.key}
                  type="button"
                  onClick={() => togglePreference(key)}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                  }`}
                >

                  <div className="flex items-start gap-3">

                    <div className="text-xl">
                      {isSelected ? '✓' : '○'}
                    </div>

                    <div>

                      <div className="font-semibold">
                        {preference.title}
                      </div>

                      <div
                        className={`mt-1 text-sm ${
                          isSelected
                            ? 'text-gray-300'
                            : 'text-gray-500'
                        }`}
                      >
                        {preference.description}
                      </div>

                    </div>

                  </div>

                </button>
              )
            })}

          </div>

        </section>

        {/* Frequency */}
        <section className="mb-10">

          <h2 className="mb-2 text-lg font-semibold">
            How often would you like to connect?
          </h2>

          <p className="mb-4 text-sm text-gray-500">
            This controls how frequently BrewLink creates
            new introductions.
          </p>

          <div className="grid grid-cols-3 gap-3">

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
                  onClick={() =>
                    setFrequency(option.value)
                  }
                  className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  {isSelected && '✓ '}
                  {option.label}
                </button>
              )
            })}

          </div>

        </section>

        {/* Match style */}
        <section className="mb-8">

          <h2 className="mb-2 text-lg font-semibold">
            What kind of matches do you prefer?
          </h2>

          <div className="space-y-3">

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
                  onClick={() =>
                    setMatchStyle(option.value)
                  }
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >

                  <div className="font-semibold">
                    {isSelected && '✓ '}
                    {option.title}
                  </div>

                  <div
                    className={`mt-1 text-sm ${
                      isSelected
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    }`}
                  >
                    {option.description}
                  </div>

                </button>
              )
            })}

          </div>

        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Finish */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="w-full rounded-xl bg-black px-4 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Finish Setup'}
        </button>

      </div>

    </main>
  )
}