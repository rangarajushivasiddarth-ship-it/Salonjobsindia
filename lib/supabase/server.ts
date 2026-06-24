import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  // For API routes, try to use service role key if available (more powerful)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key!
  )
}
