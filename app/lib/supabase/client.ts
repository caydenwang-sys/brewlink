import {
  createClient as createSupabaseClient,
  SupabaseClient,
} from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

const LAST_SESSION_KEY =
  'brewlink-last-session'

let initializedFromLastSession = false

export function createClient() {
  if (supabase) {
    return supabase
  }

  supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: {
          getItem(key: string) {
            if (typeof window === 'undefined') {
              return null
            }

            // ========================================
            // 1. USE THIS TAB'S OWN SESSION FIRST
            // ========================================

            const tabValue =
              window.sessionStorage.getItem(
                key
              )

            if (tabValue) {
              return tabValue
            }

            // ========================================
            // 2. NEW TAB:
            //    RESTORE MOST RECENT LOGIN
            // ========================================

            if (
              !initializedFromLastSession
            ) {
              const saved =
                window.localStorage.getItem(
                  LAST_SESSION_KEY
                )

              if (saved) {
                try {
                  const parsed =
                    JSON.parse(saved)

                  if (
                    parsed.storageKey ===
                      key &&
                    parsed.value
                  ) {
                    window.sessionStorage.setItem(
                      key,
                      parsed.value
                    )

                    initializedFromLastSession =
                      true

                    return parsed.value
                  }
                } catch {
                  window.localStorage.removeItem(
                    LAST_SESSION_KEY
                  )
                }
              }

              initializedFromLastSession =
                true
            }

            return null
          },

          setItem(
            key: string,
            value: string
          ) {
            if (
              typeof window ===
              'undefined'
            ) {
              return
            }

            // Always save auth state
            // only to THIS tab.
            window.sessionStorage.setItem(
              key,
              value
            )
          },

          removeItem(key: string) {
            if (
              typeof window ===
              'undefined'
            ) {
              return
            }

            // Logging out removes only
            // this tab's session.
            window.sessionStorage.removeItem(
              key
            )
          },
        },

        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,

        lock: async (
          _name,
          _acquireTimeout,
          fn
        ) => await fn(),
      },
    }
  )

  // ============================================
  // REMEMBER MOST RECENT EXPLICIT LOGIN
  // ============================================

  supabase.auth.onAuthStateChange(
    (event) => {
      if (
        typeof window ===
        'undefined'
      ) {
        return
      }

      if (event !== 'SIGNED_IN') {
        return
      }

      // Find Supabase's auth-token entry
      // inside this tab.
      const authKey =
        Object.keys(
          window.sessionStorage
        ).find(
          (key) =>
            key.startsWith('sb-') &&
            key.endsWith(
              '-auth-token'
            )
        )

      if (!authKey) {
        return
      }

      const value =
        window.sessionStorage.getItem(
          authKey
        )

      if (!value) {
        return
      }

      // Save a COPY for future NEW tabs.
      // Existing tabs continue using their
      // own sessionStorage session.
      window.localStorage.setItem(
        LAST_SESSION_KEY,
        JSON.stringify({
          storageKey: authKey,
          value,
        })
      )
    }
  )

  return supabase
}