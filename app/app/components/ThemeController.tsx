'use client'

import {
  useEffect,
  useState,
} from 'react'
import {
  Capacitor,
} from '@capacitor/core'
import {
  StatusBar,
  Style,
} from '@capacitor/status-bar'

export type ThemePreference =
  | 'light'
  | 'dark'
  | 'system'

export const themeStorageKey =
  'brewlink-theme'

export const themeChangeEvent =
  'brewlink:theme-change'

function isThemePreference(
  value: string | null
): value is ThemePreference {
  return (
    value === 'light' ||
    value === 'dark' ||
    value === 'system'
  )
}

export default function ThemeController() {
  const [
    preference,
    setPreference,
  ] =
    useState<ThemePreference>(
      'system'
    )

  useEffect(() => {
    const storedPreference =
      window.localStorage.getItem(
        themeStorageKey
      )

    if (
      isThemePreference(
        storedPreference
      )
    ) {
      setPreference(
        storedPreference
      )
    }

    function handleThemeChange(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<ThemePreference>

      if (
        isThemePreference(
          customEvent.detail
        )
      ) {
        setPreference(
          customEvent.detail
        )
      }
    }

    window.addEventListener(
      themeChangeEvent,
      handleThemeChange
    )

    return () => {
      window.removeEventListener(
        themeChangeEvent,
        handleThemeChange
      )
    }
  }, [])

  useEffect(() => {
    const colorScheme =
      window.matchMedia(
        '(prefers-color-scheme: dark)'
      )

    async function applyTheme() {
      const resolvedTheme =
        preference === 'system'
          ? colorScheme.matches
            ? 'dark'
            : 'light'
          : preference

      document.documentElement.dataset.theme =
        resolvedTheme

      document.documentElement.style.colorScheme =
        resolvedTheme

      const themeColor =
        resolvedTheme === 'dark'
          ? '#0b1424'
          : '#f8f7f4'

      let themeColorMeta =
        document.querySelector<HTMLMetaElement>(
          'meta[name="theme-color"]'
        )

      if (!themeColorMeta) {
        themeColorMeta =
          document.createElement(
            'meta'
          )

        themeColorMeta.name =
          'theme-color'

        document.head.appendChild(
          themeColorMeta
        )
      }

      themeColorMeta.content =
        themeColor

      if (
        Capacitor.isNativePlatform()
      ) {
        await StatusBar.setOverlaysWebView({
          overlay: false,
        })

        await StatusBar.setBackgroundColor({
          color: themeColor,
        })

        await StatusBar.setStyle({
          style:
            resolvedTheme ===
            'dark'
              ? Style.Dark
              : Style.Light,
        })
      }
    }

    function handleSystemChange() {
      if (
        preference === 'system'
      ) {
        void applyTheme()
      }
    }

    void applyTheme()

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
  }, [preference])

  return null
}