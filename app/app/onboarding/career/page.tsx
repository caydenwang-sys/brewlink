'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const careerGoals = [
  'Product Management',
  'Software Engineering',
  'Investment Banking',
  'Consulting',
  'Entrepreneurship',
  'Venture Capital',
  'Private Equity',
  'Data Science',
  'Research',
  'Marketing',
  'UX Design',
  'Medicine',
  'Law',
  'Not sure yet',
]

export default function CareerPage() {
  const router = useRouter()

  const [careerGoal, setCareerGoal] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!careerGoal) {
      setError('Please select a career goal.')
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

    if (userError) {
      setError(`Authentication error: ${userError.message}`)
      setLoading(false)
      return
    }

    if (!user) {
      setError('You must be logged in to continue.')
      setLoading(false)
      return
    }

    // Update the user's profile
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({
        career_goal: careerGoal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()

    if (updateError) {
      setError(`Could not save career goal: ${updateError.message}`)
      setLoading(false)
      return
    }

    // Make sure Supabase actually updated a row
    if (!data || data.length === 0) {
      setError(
        'Your profile could not be updated. Please make sure your profile exists.'
      )
      setLoading(false)
      return
    }

    setLoading(false)

    router.push('/onboarding/availability')
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">

      <div className="mx-auto max-w-2xl">

        {/* Progress */}
        <div className="mb-10">
          <div className="mb-2 flex justify-between text-sm text-gray-500">
            <span>Step 3 of 5</span>
            <span>Career goals</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-3/5 rounded-full bg-black" />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            What are you hoping to do?
          </h1>

          <p className="mt-3 text-gray-600">
            Choose the career path you're most interested in.
            You can always change this later.
          </p>
        </div>

        {/* Career options */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          {careerGoals.map((goal) => {
            const selected = careerGoal === goal

            return (
              <button
                key={goal}
                type="button"
                onClick={() => {
                  setCareerGoal(goal)
                  setError('')
                }}
                className={`rounded-2xl border px-5 py-4 text-left font-medium transition ${
                  selected
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                }`}
              >
                {selected && '✓ '}
                {goal}
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