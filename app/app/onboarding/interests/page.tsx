'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const interests = [
  'Artificial Intelligence',
  'Product Management',
  'Software Engineering',
  'Startups',
  'Entrepreneurship',
  'Finance',
  'Investment Banking',
  'Consulting',
  'Marketing',
  'UX Design',
  'Data Science',
  'Research',
  'Biotechnology',
  'Medicine',
  'Law',
  'Venture Capital',
  'Private Equity',
  'Machine Learning',
  'Cybersecurity',
  'Gaming',
]

export default function InterestsPage() {
  const router = useRouter()

  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleInterest(interest: string) {
    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        return current.filter((item) => item !== interest)
      }

      return [...current, interest]
    })
  }

  async function handleContinue() {
    // Require at least 3 interests
    if (selectedInterests.length < 3) {
      setError('Please select at least 3 interests.')
      return
    }

    setError('')
    setLoading(true)

    const supabase = createClient()

    // Get the currently logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be logged in to continue.')
      setLoading(false)
      return
    }

    // Find the database IDs for the selected interests
    const { data: interestRows, error: interestError } = await supabase
      .from('interests')
      .select('id, name')
      .in('name', selectedInterests)

    if (interestError) {
      setError(`Could not find interests: ${interestError.message}`)
      setLoading(false)
      return
    }

    // Make sure every selected interest exists in the database
    if (
      !interestRows ||
      interestRows.length !== selectedInterests.length
    ) {
      setError('Some selected interests could not be found.')
      setLoading(false)
      return
    }

    // Create the rows that connect the user to their interests
    const rows = interestRows.map((interest) => ({
      user_id: user.id,
      interest_id: interest.id,
    }))

    // Save the user's interests
    const { error: insertError } = await supabase
      .from('user_interests')
      .upsert(rows)

    if (insertError) {
      setError(`Could not save interests: ${insertError.message}`)
      setLoading(false)
      return
    }

    // Everything worked
    setLoading(false)

    router.push('/onboarding/career')
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">

      <div className="mx-auto max-w-2xl">

        {/* Progress */}
        <div className="mb-10">
          <div className="mb-2 flex justify-between text-sm text-gray-500">
            <span>Step 2 of 5</span>
            <span>{selectedInterests.length} selected</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{
                width: `${Math.min(
                  (selectedInterests.length / 6) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            What are you interested in?
          </h1>

          <p className="mt-3 text-gray-600">
            Choose the things you'd love to talk about with
            other students.
          </p>
        </div>

        {/* Interests */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

          {interests.map((interest) => {
            const selected = selectedInterests.includes(interest)

            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                  selected
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                }`}
              >
                {selected && '✓ '}
                {interest}
              </button>
            )
          })}

        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Continue */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-black px-4 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>

      </div>

    </main>
  )
}