import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#10233f]">

      <header className="border-b border-gray-200/70 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-6">

          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            Brework
          </Link>

          <Link
            href="/support"
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            Support
          </Link>

        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-16">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
          Legal
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>

        <p className="mt-4 text-sm text-gray-500">
          Last updated: August 26, 2026
        </p>

        <div className="mt-10 space-y-10 leading-relaxed text-gray-600">

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              1. Overview
            </h2>

            <p className="mt-3">
              Brework helps students discover one another, build
              professional and social connections, exchange messages,
              and schedule coffee chats. This Privacy Policy explains
              what information Brework collects, why it is used, how
              it may be shared, and the choices available to you.
            </p>

            <p className="mt-3">
              By using Brework, you acknowledge the practices
              described in this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              2. Information we collect
            </h2>

            <div className="mt-4 space-y-5">

              <div>
                <h3 className="font-semibold text-[#10233f]">
                  Account information
                </h3>

                <p className="mt-1">
                  We collect information used to create and secure
                  your account, such as your email address, account
                  identifier, authentication information, and account
                  creation date. Passwords are handled by our
                  authentication provider and are not displayed to
                  other Brework users.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#10233f]">
                  Profile information
                </h3>

                <p className="mt-1">
                  You may provide your name, profile photo, major,
                  academic year, biography, career goals, interests,
                  clubs, work experience, projects, social or
                  professional links, contact email, and resume.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#10233f]">
                  Matching and availability information
                </h3>

                <p className="mt-1">
                  We collect your matching preferences, availability,
                  connection requests, accepted connections, blocked
                  users, and information used to recommend students
                  you may want to meet.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#10233f]">
                  Communications and scheduling
                </h3>

                <p className="mt-1">
                  We store messages you send through Brework,
                  meeting proposals, scheduled meetings, locations
                  you enter, notification status, and related
                  timestamps so these features can operate.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#10233f]">
                  Technical information
                </h3>

                <p className="mt-1">
                  Brework and its service providers may process
                  limited technical information needed to operate and
                  secure the service, such as session information,
                  application events, device or browser information,
                  network requests, error logs, and security records.
                </p>
              </div>

            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              3. How we use information
            </h2>

            <p className="mt-3">
              We use information to:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Create, authenticate, and maintain your account.</li>
              <li>Display your profile according to your privacy settings.</li>
              <li>Recommend students and calculate matching signals.</li>
              <li>Process connections, messages, notifications, and meetings.</li>
              <li>Store profile photos, resumes, and other content you upload.</li>
              <li>Maintain security, prevent abuse, and troubleshoot problems.</li>
              <li>Improve Brework’s usability, reliability, and features.</li>
              <li>Comply with applicable legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              4. How information is shared
            </h2>

            <p className="mt-3">
              Depending on your settings and how you use Brework,
              profile information may be visible to other
              authenticated users. Contact details, links, and
              resumes are displayed according to the visibility
              choices available in Brework.
            </p>

            <p className="mt-3">
              We use service providers to operate Brework, including
              Supabase for authentication, database, storage, and
              realtime features, and Vercel for website and server
              hosting. These providers process information on
              Brework’s behalf to deliver their services.
            </p>

            <p className="mt-3">
              We may disclose information when reasonably necessary
              to comply with law, protect users, investigate abuse or
              security incidents, or protect Brework’s rights and
              safety.
            </p>

            <p className="mt-3">
              Brework does not sell your personal information or use
              it for third-party targeted advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              5. Data retention
            </h2>

            <p className="mt-3">
              We retain information while your account is active and
              as reasonably necessary to provide Brework, maintain
              security, resolve disputes, and comply with legal
              obligations. Retention periods may vary depending on
              the type of information and why it is maintained.
            </p>

            <p className="mt-3">
              When an account is deleted, associated personal
              information is deleted or de-identified unless limited
              retention is reasonably necessary for security, legal,
              fraud-prevention, or backup purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              6. Your choices and controls
            </h2>

            <p className="mt-3">
              Brework provides controls that may allow you to edit
              your profile, manage discoverability, control certain
              profile visibility, update matching preferences, remove
              uploaded content, block users, and manage notifications.
            </p>

            <p className="mt-3">
              You can delete your account from within Brework by
              opening:
            </p>

            <p className="mt-3 rounded-2xl bg-white p-4 font-semibold text-[#10233f]">
              Profile → Settings → Account → Delete account
            </p>

            <p className="mt-3">
              Account deletion is permanent. You may also contact us
              regarding privacy questions or requests using the email
              address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              7. Security
            </h2>

            <p className="mt-3">
              We use reasonable administrative and technical
              safeguards designed to protect information. However,
              no online service or storage system can guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              8. Children
            </h2>

            <p className="mt-3">
              Brework is intended for college students and is not
              directed to children under 13. If you believe a child
              has provided personal information through Brework,
              please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              9. Changes to this policy
            </h2>

            <p className="mt-3">
              We may update this Privacy Policy as Brework evolves.
              The updated version will be posted on this page with a
              revised “Last updated” date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#10233f]">
              10. Contact us
            </h2>

            <p className="mt-3">
              For privacy questions, account concerns, or requests,
              contact:
            </p>

            <a
              href="mailto:caydenwang@gmail.com"
              className="mt-3 inline-block font-semibold text-blue-600 underline underline-offset-2"
            >
              caydenwang@gmail.com
            </a>
          </section>

        </div>

        <div className="mt-14 border-t border-gray-200 pt-8">
          <Link
            href="/support"
            className="font-semibold text-blue-600 underline underline-offset-2"
          >
            Visit Brework Support
          </Link>
        </div>

      </article>

    </main>
  )
}