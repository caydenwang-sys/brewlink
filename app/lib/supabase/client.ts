import {
  createClient as createSupabaseClient,
  SupabaseClient,
} from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

let supabase: SupabaseClient | null = null

const serverStorage = {
  async getItem(_key: string) {
    return null
  },

  async setItem(
    _key: string,
    _value: string
  ) {
    // No persistent storage during server-side rendering.
  },

  async removeItem(_key: string) {
    // No persistent storage during server-side rendering.
  },
}

const nativeStorage = {
  async getItem(key: string) {
    const { value } = await Preferences.get({
      key,
    })

    return value
  },

  async setItem(
    key: string,
    value: string
  ) {
    await Preferences.set({
      key,
      value,
    })
  },

  async removeItem(key: string) {
    await Preferences.remove({
      key,
    })
  },
}

export function createClient() {
  if (supabase) {
    return supabase
  }

  const storage =
    typeof window === 'undefined'
      ? serverStorage
      : nativeStorage

  supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage,
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

  return supabase
}