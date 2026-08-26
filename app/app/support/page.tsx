import Link from 'next/link'

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#10233f]">

      <header className="border-b border-gray-200/70 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-6">

          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            BrewLink
          </Link>

          <Link
            href="/privacy"
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            Privacy
          </Link>

        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-16">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
          Help Center
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          BrewLink Support
        </h1>

        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          Get help with your account, profile, connections, messages,
          coffee chats, privacy settings, or other BrewLink features.
        </p>

        <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Contact support
          </h2>

          <p className="mt-3 leading-relaxed text-gray-600">
            Email us with a description of the issue, the page where
            it occurred, and any relevant details. Do not send your
            password or other sensitive authentication information.
          </p>

          <a
            href="mailto:caydenwang@gmail.com?subject=BrewLink%20Support"
            className="mt-5 inline-flex rounded-xl bg-[#10233f] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Email caydenwang@gmail.com
          </a>

        </section>

        <div className="mt-10 space-y-5">

          <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold">
              Account access
            </h2>

            <p className="mt-3 leading-relaxed text-gray-600">
              Confirm your email address before signing in. If you
              cannot access your account, verify that you are using
              the same email address used during registration and
              contact support if the problem continues.
            </p>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold">
              Profile and privacy
            </h2>

            <p className="mt-3 leading-relaxed text-gray-600">
              You can update your profile, discoverability, contact
              visibility, matching preferences, availability, and
              notification settings from Profile and Settings inside
              BrewLink.
            </p>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold">
              Connections and messages
            </h2>

            <p className="mt-3 leading-relaxed text-gray-600">
              Connection requests appear in Connections. Messaging is
              available after a connection is accepted and an active
              match is created. If information appears outdated,
              close and reopen BrewLink and check your network
              connection.
            </p>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold">
              Coffee chats and scheduling
            </h2>

            <p className="mt-3 leading-relaxed text-gray-600">
              BrewLink uses the availability entered by both
              participants to identify possible meeting times.
              Scheduled, completed, and cancelled meetings can be
              reviewed through BrewLink’s scheduling features.
            </p>
          </section>

          <section className="rounded-3xl border border-red-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-red-600">
              Delete your account
            </h2>

            <p className="mt-3 leading-relaxed text-gray-600">
              You can permanently delete your BrewLink account from
              within the app:
            </p>

            <p className="mt-4 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
              Profile → Settings → Account → Delete account
            </p>

            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Account deletion cannot be undone. If you cannot access
              your account, contact support using the email above.
            </p>
          </section>

        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-gray-200 pt-8 sm:flex-row sm:items-center sm:justify-between">

          <Link
            href="/privacy"
            className="font-semibold text-blue-600 underline underline-offset-2"
          >
            Read the Privacy Policy
          </Link>

          <Link
            href="/"
            className="font-semibold text-gray-500 transition hover:text-black"
          >
            Return to BrewLink
          </Link>

        </div>

      </div>

    </main>
  )
}