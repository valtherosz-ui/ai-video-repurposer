import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

let supabaseClient: SupabaseClient<Database> | null = null

export const getSupabaseClient = () => {
  // Only create client in browser environment with valid env vars
  if (typeof window === 'undefined') {
    // Return a mock client during SSR/build that won't throw
    return null as unknown as SupabaseClient<Database>
  }

  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.warn('Supabase environment variables not configured')
      return null as unknown as SupabaseClient<Database>
    }

    supabaseClient = createBrowserClient<Database>(url, key)
  }
  return supabaseClient
}
