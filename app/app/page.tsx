import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="text-2xl font-bold">
          BrewLink
        </div>

        <Link
          href="/login"
          className="rounded-xl px-4 py-2 text-sm font-semibold transition hover:bg-gray-100"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <div className="mb-6 inline-block rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
            Built for UCSD students
          </div>

          {/* Main heading */}
          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            Meet people who
            <br />
            <span className="text-gray-500">
              move you forward.
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 md:text-xl">
            BrewLink helps you discover UCSD students who share your
            interests, career goals, projects, and ambitions.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

            <Link
              href="/signup"
              className="w-full rounded-xl bg-black px-8 py-4 text-center font-semibold text-white transition hover:opacity-90 sm:w-auto"
            >
              Get Started
            </Link>

            <Link
              href="/login"
              className="w-full rounded-xl border border-gray-300 px-8 py-4 text-center font-semibold text-gray-900 transition hover:bg-gray-50 sm:w-auto"
            >
              I already have an account
            </Link>

          </div>

          {/* Features */}
          <div className="mt-16 grid gap-6 text-left md:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 p-6">
              <div className="mb-3 text-2xl">
                🤝
              </div>

              <h3 className="font-semibold">
                Find your people
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Discover students with similar interests,
                majors, and career goals.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6">
              <div className="mb-3 text-2xl">
                ☕
              </div>

              <h3 className="font-semibold">
                Make the connection
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Turn an online connection into a real conversation.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6">
              <div className="mb-3 text-2xl">
                🚀
              </div>

              <h3 className="font-semibold">
                Keep connecting
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Build a habit of meeting new people throughout college.
              </p>
            </div>

          </div>

        </div>
      </section>

    </main>
  )
}