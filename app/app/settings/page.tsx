'use client'

import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-28">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-xl font-bold tracking-tight"
          >
            BrewLink
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
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
            Account
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Settings
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500">
            Manage your BrewLink account, profile, matching
            preferences, availability, notifications, and privacy.
          </p>

        </section>

        <div className="space-y-6">

          {/* Profile */}
          <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold">
              Profile
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage the information other students see about you.
            </p>

            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="mt-5 flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-4 text-left transition hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">
                  Edit profile
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Name, major, academic year, bio, career goals, and photo.
                </p>
              </div>

              <span className="text-gray-400">
                →
              </span>
            </button>

          </section>

          {/* Matching */}
          <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold">
              Matching & Discovery
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Control how BrewLink finds people for you.
            </p>

            <button
              type="button"
              onClick={() => router.push('/settings/matching')}
              className="mt-5 flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-4 text-left transition hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">
                  Matching preferences
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Same major, career interests, mentors, collaborators, and more.
                </p>
              </div>

              <span className="text-gray-400">
                →
              </span>
            </button>

          </section>

          {/* Availability */}
          <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold">
              Availability & Scheduling
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage when you are available for coffee chats.
            </p>

            <button
              type="button"
              onClick={() => router.push('/availability')}
              className="mt-5 flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-4 text-left transition hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">
                  Manage availability
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Add, edit, or remove your available days and times.
                </p>
              </div>

              <span className="text-gray-400">
                →
              </span>
            </button>

          </section>

          {/* Notifications */}
          <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold">
              Notifications
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose which BrewLink activity you want to hear about.
            </p>

            <button
              type="button"
              onClick={() => router.push('/settings/notifications')}
              className="mt-5 flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-4 text-left transition hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">
                  Notification preferences
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Messages, connections, matches, and coffee-chat reminders.
                </p>
              </div>

              <span className="text-gray-400">
                →
              </span>
            </button>

          </section>

          {/* Privacy */}
          <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold">
              Privacy & Safety
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Control your visibility and safety on BrewLink.
            </p>

            <button
              type="button"
              onClick={() => router.push('/settings/privacy')}
              className="mt-5 flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-4 text-left transition hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">
                  Privacy settings
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Profile visibility, discoverability, blocked users, and more.
                </p>
              </div>

              <span className="text-gray-400">
                →
              </span>
            </button>

          </section>

          {/* Account */}
          <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold">
              Account
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage login, security, and account controls.
            </p>

            <div className="mt-5 space-y-3">

              <button
                type="button"
                onClick={() => router.push('/settings/account')}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-4 text-left transition hover:bg-gray-50"
              >
                <span className="font-semibold">
                  Account & Security
                </span>

                <span className="text-gray-400">
                  →
                </span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/settings/delete-account')}
                className="flex w-full items-center justify-between rounded-2xl border border-red-100 px-4 py-4 text-left text-red-600 transition hover:bg-red-50"
              >
                <span className="font-semibold">
                  Delete account
                </span>

                <span>
                  →
                </span>
              </button>

            </div>

          </section>

        </div>

      </div>

    </main>
  )
}