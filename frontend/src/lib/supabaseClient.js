import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL || 'https://ujcxhvqxcfxuwjxffotc.supabase.co'
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY3hodnF4Y2Z4dXdqeGZmb3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODk1ODgsImV4cCI6MjA3MjU2NTU4OH0.EX5raf3ZmFRBlGFyW0Fh4C7h7nlI9mwJKcyPO_2jMIw'

if (!supabaseUrl) {
  throw new Error('supabaseUrl is required.')
}

if (!supabaseAnonKey) {
  throw new Error('supabaseAnonKey is required.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  }
})

// Helper function to set auth token from localStorage
export const setSupabaseAuth = () => {
  const token = localStorage.getItem('token')
  if (token) {
    supabase.auth.session = { access_token: token }
  }
}

// Call this after login
setSupabaseAuth()

