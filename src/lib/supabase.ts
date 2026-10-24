import { createClient } from '@supabase/supabase-js'

// En ligne, une variable absente arrive comme texte vide : on la traite comme manquante.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || undefined
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || undefined

// Vrai quand l'adresse et la clé Supabase ont été fournies (fichier .env.local
// en local, variables du dépôt GitHub en ligne).
export const supabaseConfigure = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost', key ?? 'absent', {
  auth: { persistSession: true, autoRefreshToken: true },
})
