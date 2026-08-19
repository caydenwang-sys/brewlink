'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DeleteAccountPage() {
  const router = useRouter()

  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDeleteAccount() {
    if (deleting) {
      return
    }

    if (confirmation.trim().toUpperCase() !== 'DELETE') {
      setError('Type DELETE to confirm account deletion.')
      return
    }

    const confirmed = window.confirm(
      'This will permanently delete your BrewLink account and all associated data. This cannot be undone. Continue?'
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError('')

    const supabase = createClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      setError('You must be logged in to delete your account.')
      setDeleting(false)
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        setError(
          result.error ||
            'Could not delete your account. Please try again.'
        )
        setDeleting(false)
        return
      }

      // Clear the local Supabase session after deletion.
      await supabase.auth.signOut()

      router.push('/login')
      router.refresh()
    } catch (requestError) {
      console.error(
        'Could not delete account:',
        requestError
      )

      setError(
        'Could not delete your account. Please try again.'
      )

      setDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">

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
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-6 sm:py-12">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
          Danger zone
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Delete account
        </h1>

        <p className="mt-3 max-w-xl leading-relaxed text-gray-500">
          Permanently delete your BrewLink account and all associated
          profile, connection, message, scheduling, and preference data.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <section className="mt-10 rounded-3xl border border-red-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-red-600">
            This action cannot be undone
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Deleting your account permanently removes your BrewLink
            account and related data. You will need to create a new
            account if you want to use BrewLink again.
          </p>

          <div className="mt-6">

            <label className="text-sm font-semibold">
              Type DELETE to confirm
            </label>

            <input
              type="text"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value)
                setError('')
              }}
              placeholder="DELETE"
              disabled={deleting}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            />

          </div>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={
              deleting ||
              confirmation.trim().toUpperCase() !== 'DELETE'
            }
            className="mt-6 w-full rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting
              ? 'Deleting account...'
              : 'Permanently delete account'}
          </button>

        </section>

      </div>

    </main>
  )
}