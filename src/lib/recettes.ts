// Lecture et modification des recettes dans Supabase.
import { supabase } from './supabase'
import type { Photo, Recette } from './types'

// Deux liens existent entre recettes et photos (les photos d'une recette, et sa photo principale) :
// on précise lequel suivre.
export type RecetteComplete = Recette & { photos: Photo[] }

const BUCKET = 'photos'

export function urlPhoto(chemin: string | null | undefined): string | undefined {
  if (!chemin) return undefined
  return supabase.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl
}

// Photo principale d'une recette (ou la première photo du plat, à défaut).
export function photoPrincipale(r: RecetteComplete): Photo | undefined {
  return r.photos.find((p) => p.id === r.photo_principale)
    ?? [...r.photos].sort((a, b) => a.ordre - b.ordre)[0]
}

export async function chargerRecettes(): Promise<RecetteComplete[]> {
  const { data, error } = await supabase
    .from('recettes')
    .select('*, photos!photos_recette_id_fkey(*)')
    .order('modifie_le', { ascending: false })
  if (error) throw error
  return data as RecetteComplete[]
}

export async function chargerRecette(id: string): Promise<RecetteComplete | null> {
  const { data, error } = await supabase.from('recettes').select('*, photos!photos_recette_id_fkey(*)').eq('id', id).maybeSingle()
  if (error) throw error
  if (data) (data as RecetteComplete).photos.sort((a, b) => a.ordre - b.ordre)
  return data as RecetteComplete | null
}

export async function modifierRecette(id: string, champs: Partial<Recette>) {
  const { error } = await supabase.from('recettes').update(champs).eq('id', id)
  if (error) throw error
}
