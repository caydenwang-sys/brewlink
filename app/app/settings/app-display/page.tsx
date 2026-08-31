'use client'

import {
  useEffect,
  useState,
} from 'react'
import {
  useRouter,
} from 'next/navigation'
import type {
  ThemePreference,
} from '@/app/components/ThemeController'
import {
  themeChangeEvent,
  themeStorageKey,
} from '@/app/components/ThemeController'

const displayOptions: {
  value: ThemePreference
  label: string
  description: string
  icon: string
}[] = [
  {
    value: 'light',
    label: 'Light',
    description:
      'Always use BrewLink’s light appearance.',
    icon: '☀️',
  },
  {
    value: 'dark',
    label: 'Dark',
    description:
      'Always use BrewLink’s dark appearance.',
    icon: '🌙',
  },
  {
    value: 'system',
    label: 'System',
    description:
      'Match your iPhone or device appearance.',
    icon: '⚙️',
  },
]

export default function AppDisplayPage() {
  const router = useRouter()

  const [
    theme,
    setTheme,
  ] =
    useState<ThemePreference>(
      'system'
    )

  const [
    isDarkMode,
    setIsDarkMode,
  ] =
    useState(false)

  useEffect(() => {
    const colorScheme =
      window.matchMedia(
        '(prefers-color-scheme: dark)'
      )

    const storedTheme =
      window.localStorage.getItem(
        themeStorageKey
      )

    const currentTheme:
      ThemePreference =
        storedTheme === 'light' ||
        storedTheme === 'dark' ||
        storedTheme === 'system'
          ? storedTheme
          : 'system'

    setTheme(currentTheme)

    setIsDarkMode(
      currentTheme === 'dark' ||
      (
        currentTheme ===
          'system' &&
        colorScheme.matches
      )
    )

    function handleSystemChange() {
      const savedTheme =
        window.localStorage.getItem(
          themeStorageKey
        )

      if (
        savedTheme === 'system' ||
        !savedTheme
      ) {
        setIsDarkMode(
          colorScheme.matches
        )
      }
    }

    colorScheme.addEventListener(
      'change',
      handleSystemChange
    )

    return () => {
      colorScheme.removeEventListener(
        'change',
        handleSystemChange
      )
    }
  }, [])

  function chooseTheme(
    nextTheme: ThemePreference
  ) {
    const systemIsDark =
      window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches

    const nextIsDark =
      nextTheme === 'dark' ||
      (
        nextTheme === 'system' &&
        systemIsDark
      )

    setTheme(nextTheme)
    setIsDarkMode(nextIsDark)

    window.localStorage.setItem(
      themeStorageKey,
      nextTheme
    )

    window.dispatchEvent(
      new CustomEvent(
        themeChangeEvent,
        {
          detail: nextTheme,
        }
      )
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-20">

      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push('/settings')
            }
            className="text-xl font-bold tracking-tight"
          >
            App Display
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/settings')
            }
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            Back
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Appearance
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Choose your theme.
          </h1>

          <p className="mt-3 max-w-xl leading-relaxed text-gray-500">
            Select how BrewLink looks on this device. Your choice is saved automatically.
          </p>
        </section>

        <section className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm">

          <div className="space-y-3">

            {displayOptions.map(
              (option) => {
                const selected =
                  theme ===
                  option.value

                const selectedBackground =
                  isDarkMode
                    ? '#223a60'
                    : '#eff6ff'

                const selectedText =
                  isDarkMode
                    ? '#ffffff'
                    : '#10233f'

                const selectedDescription =
                  isDarkMode
                    ? '#d6dfed'
                    : '#475569'

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      chooseTheme(
                        option.value
                      )
                    }
                    style={
                      selected
                        ? {
                            backgroundColor:
                              selectedBackground,
                            color:
                              selectedText,
                          }
                        : undefined
                    }
                    className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                      selected
                        ? 'border-blue-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl shadow-sm"
                      style={{
                        backgroundColor:
                          isDarkMode
                            ? '#152238'
                            : '#ffffff',
                      }}
                    >
                      {option.icon}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className="block font-semibold"
                        style={
                          selected
                            ? {
                                color:
                                  selectedText,
                              }
                            : undefined
                        }
                      >
                        {option.label}
                      </span>

                      <span
                        className="mt-1 block text-sm text-gray-500"
                        style={
                          selected
                            ? {
                                color:
                                  selectedDescription,
                              }
                            : undefined
                        }
                      >
                        {option.description}
                      </span>
                    </span>

                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selected
                        ? '✓'
                        : ''}
                    </span>
                  </button>
                )
              }
            )}

          </div>

        </section>

      </div>

    </main>
  )
}