'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PrivacySettingsPage() {
  const router = useRouter()

  const [isDiscoverable, setIsDiscoverable] = useState(true)
  const [showAcademicInfo, setShowAcademicInfo] = useState(true)
  const [showCareerGoal, setShowCareerGoal] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadPrivacySettings() {
      const supabase = createClient()

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
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(`
          is_discoverable,
          show_academic_info,
          show_career_goal
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError(
          `Could not load privacy settings: ${profileError.message}`
        )
        setLoading(false)
        return
      }

      setIsDiscoverable(data.is_discoverable)
      setShowAcademicInfo(data.show_academic_info)
      setShowCareerGoal(data.show_career_goal)

      setLoading(false)
    }

    loadPrivacySettings()
  }, [router])

  async function savePrivacySettings() {
    if (saving) {
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
      .from('profiles')
      .update({
        is_discoverable: isDiscoverable,
        show_academic_info: showAcademicInfo,
        show_career_goal: showCareerGoal,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(
        `Could not save privacy settings: ${updateError.message}`
      )
      setSaving(false)
      return
    }

    setSuccess('Privacy settings saved.')
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <p className="text-sm text-gray-500">
          Loading privacy settings...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">

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

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
          Privacy
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Privacy settings
        </h1>

        <p className="mt-3 max-w-xl text-gray-500">
          Control how other students can discover and view your BrewLink profile.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <section className="mt-10 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between gap-6">

            <div>
              <h2 className="font-semibold">
                Appear in Discover
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Allow other students to see your profile while browsing Discover.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsDiscoverable((current) => !current)
                setSuccess('')
                setError('')
              }}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                isDiscoverable
                  ? 'bg-black'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  isDiscoverable
                    ? 'left-6'
                    : 'left-1'
                }`}
              />
            </button>

          </div>

          <div className="my-6 border-t border-gray-100" />

          <div className="flex items-center justify-between gap-6">

            <div>
              <h2 className="font-semibold">
                Show academic information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Show your major and academic year to other students.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAcademicInfo((current) => !current)
                setSuccess('')
                setError('')
              }}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                showAcademicInfo
                  ? 'bg-black'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  showAcademicInfo
                    ? 'left-6'
                    : 'left-1'
                }`}
              />
            </button>

          </div>

          <div className="my-6 border-t border-gray-100" />

          <div className="flex items-center justify-between gap-6">

            <div>
              <h2 className="font-semibold">
                Show career interests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Show your career goals and interests to other students.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCareerGoal((current) => !current)
                setSuccess('')
                setError('')
              }}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                showCareerGoal
                  ? 'bg-black'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  showCareerGoal
                    ? 'left-6'
                    : 'left-1'
                }`}
              />
            </button>

          </div>

        </section>

        <button
          type="button"
          onClick={savePrivacySettings}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-black px-5 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? 'Saving...'
            : 'Save privacy settings'}
        </button>

      </div>

    </main>
  )
}