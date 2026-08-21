import {
  createClient as createSupabaseClient,
  SupabaseClient,
} from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

let supabase: SupabaseClient | null = null

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

  supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: nativeStorage,
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