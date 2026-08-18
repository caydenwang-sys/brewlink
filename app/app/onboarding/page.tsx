'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [major, setMajor] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError('')

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

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        major,
        academic_year: year,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding/interests')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-lg">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            Tell us about yourself
          </h1>

          <p className="mt-3 text-gray-600">
            This helps us find better connections for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium">
              First name
            </label>

            <input
              type="text"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Cayden"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Last name
            </label>

            <input
              type="text"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Wang"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Major
            </label>

            <select
              required
              value={major}
              onChange={(event) => setMajor(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
            >
              <option value="">Select your major</option>
              <option value="Cognitive Science">Cognitive Science</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Data Science">Data Science</option>
              <option value="Economics">Economics</option>
              <option value="Business">Business</option>
              <option value="Engineering">Engineering</option>
              <option value="Biology">Biology</option>
              <option value="Psychology">Psychology</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Academic year
            </label>

            <select
              required
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
            >
              <option value="">Select your year</option>
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Graduate">Graduate</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>

        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Step 1 of 5
        </div>

      </div>
    </main>
  )
}