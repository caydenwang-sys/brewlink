'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AccountSettingsPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(true)
  const [savingPassword, setSavingPassword] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient()

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      setEmail(user.email || '')
      setLoading(false)
    }

    loadAccount()
  }, [router])

  async function handleChangePassword() {
    if (savingPassword) {
      return
    }

    setError('')
    setSuccess('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSavingPassword(true)

    const supabase = createClient()

    const { error: updateError } =
      await supabase.auth.updateUser({
        password: newPassword,
      })

    if (updateError) {
      setError(`Could not change password: ${updateError.message}`)
      setSavingPassword(false)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setSuccess('Password changed successfully.')
    setSavingPassword(false)
  }

  async function handleLogout() {
    const supabase = createClient()

    const { error: logoutError } =
      await supabase.auth.signOut()

    if (logoutError) {
      setError(`Could not log out: ${logoutError.message}`)
      return
    }

    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <p className="text-sm text-gray-500">
          Loading account...
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
          Account
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Account & Security
        </h1>

        <p className="mt-3 text-gray-500">
          Manage your BrewLink login and account security.
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

          <h2 className="text-lg font-bold">
            Email address
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            The email associated with your BrewLink account.
          </p>

          <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-4">
            <p className="text-sm font-semibold">
              {email}
            </p>
          </div>

        </section>

        <section className="mt-6 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold">
            Change password
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose a new password for your BrewLink account.
          </p>

          <div className="mt-6 space-y-4">

            <div>
              <label className="text-sm font-semibold">
                New password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                placeholder="Enter a new password"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Confirm new password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Enter it again"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-black"
              />
            </div>

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="w-full rounded-2xl bg-black px-5 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPassword
                ? 'Changing password...'
                : 'Change password'}
            </button>

          </div>

        </section>

        <section className="mt-6 rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold">
            Session
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Sign out of your BrewLink account on this device.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 w-full rounded-2xl border border-red-200 bg-white px-5 py-4 font-semibold text-red-600 transition hover:bg-red-50"
          >
            Log Out
          </button>

        </section>

      </div>

    </main>
  )
}