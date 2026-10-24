import { createClient } from '@supabase/supabase-js'

// En ligne, une variable absente arrive comme texte vide : on la traite comme manquante.
// On garde seulement https://xxxx.supabase.co, même si une fin comme /rest/v1/ a été collée avec.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  .replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '') || undefined
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || undefined

// Vrai quand l'adresse et la clé Supabase ont été fournies (fichier .env.local
// en local, variables du dépôt GitHub en ligne).
export const supabaseConfigure = Boolean(url && key)

export const supabaseUrl = url ?? 'http://localhost'
export const supabaseCle = key ?? 'absent'

export const supabase = createClient(supabaseUrl, supabaseCle, {
  auth: { persistSession: true, autoRefreshToken: true },
})
