import { Suspense } from 'react'

export default function ConversationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
              💬
            </div>

            <p className="mt-4 text-sm font-medium text-gray-500">
              Loading conversation...
            </p>
          </div>
        </main>
      }
    >
      {children}
    </Suspense>
  )
}