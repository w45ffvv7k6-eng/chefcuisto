import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Vrai quand l'adresse et la clé Supabase ont été fournies (fichier .env.local
// en local, variables du dépôt GitHub en ligne).
export const supabaseConfigure = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost', key ?? 'absent', {
  auth: { persistSession: true, autoRefreshToken: true },
})
