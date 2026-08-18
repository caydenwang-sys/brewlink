'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: '🏠',
  },
  {
    label: 'Discover',
    href: '/discover',
    icon: '✨',
  },
  {
    label: 'Connections',
    href: '/connections',
    icon: '👥',
  },
  {
    label: 'Chats',
    href: '/chats',
    icon: '💬',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: '👤',
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl justify-around px-3 py-3">

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition ${
                isActive
                  ? 'font-bold text-black'
                  : 'font-medium text-gray-400 hover:text-black'
              }`}
            >
              <span
                className={`text-base transition ${
                  isActive ? 'scale-110' : ''
                }`}
              >
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </Link>
          )
        })}

      </div>
    </nav>
  )
}