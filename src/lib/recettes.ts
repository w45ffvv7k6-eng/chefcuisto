// Lecture et modification des recettes dans Supabase.
import { supabase } from './supabase'
import type { ImagePrete } from './images'
import type { Etape, Photo, Recette, TypePhoto } from './types'

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

// ---------- Enregistrement depuis le formulaire ----------

// Une photo telle que le formulaire la manipule : déjà enregistrée (id) ou nouvelle (image prête à envoyer).
export interface PhotoFormulaire {
  cle: string                 // identifiant local, stable pendant l'édition
  id?: string                 // présent si la photo existe déjà dans la base
  chemin?: string
  miniature?: string | null
  nouvelle?: ImagePrete
  apercu?: string             // adresse temporaire pour afficher une nouvelle photo
  type: TypePhoto
  legende: string
}

type ChampsRecette = Omit<Recette, 'id' | 'cree_le' | 'modifie_le' | 'photo_principale' | 'etapes'> & {
  etapes: (Omit<Etape, 'photo'> & { photo?: string | null })[]  // photo = clé locale d'une PhotoFormulaire
}

async function envoyerPhoto(userId: string, recetteId: string, p: PhotoFormulaire, ordre: number): Promise<string> {
  const img = p.nouvelle!
  const base = `${userId}/${recetteId}/${crypto.randomUUID()}`
  const grand = await supabase.storage.from(BUCKET).upload(`${base}.jpg`, img.blob, { contentType: 'image/jpeg' })
  if (grand.error) throw grand.error
  const petit = await supabase.storage.from(BUCKET).upload(`${base}-mini.jpg`, img.miniature, { contentType: 'image/jpeg' })
  if (petit.error) throw petit.error
  const { data, error } = await supabase.from('photos').insert({
    recette_id: recetteId, chemin: `${base}.jpg`, miniature: `${base}-mini.jpg`,
    type: p.type, legende: p.legende, ordre, largeur: img.largeur, hauteur: img.hauteur,
  }).select('id').single()
  if (error) throw error
  return data.id
}

// Crée ou met à jour une recette avec ses photos. Renvoie l'id de la recette.
export async function enregistrerRecette(
  id: string | undefined,
  champs: ChampsRecette,
  photos: PhotoFormulaire[],
  clePrincipale: string | null,
  photosSupprimees: Photo[],
): Promise<string> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user!.id
  const { etapes, ...reste } = champs

  let recetteId = id
  if (!recetteId) {
    const { data, error } = await supabase.from('recettes').insert({ ...reste, etapes: [] }).select('id').single()
    if (error) throw error
    recetteId = data.id as string
  }

  // Envoie les nouvelles photos et met à jour l'ordre, le type et la légende des anciennes.
  const idParCle = new Map<string, string>()
  for (const [ordre, p] of photos.entries()) {
    if (p.id) {
      const { error } = await supabase.from('photos').update({ ordre, type: p.type, legende: p.legende }).eq('id', p.id)
      if (error) throw error
      idParCle.set(p.cle, p.id)
    } else {
      idParCle.set(p.cle, await envoyerPhoto(userId, recetteId, p, ordre))
    }
  }

  if (photosSupprimees.length) {
    await supprimerFichiers(photosSupprimees)
    const { error } = await supabase.from('photos').delete().in('id', photosSupprimees.map((p) => p.id))
    if (error) throw error
  }

  const etapesFinales: Etape[] = etapes.map((e) => ({ ...e, photo: e.photo ? idParCle.get(e.photo) ?? null : null }))
  const photo_principale = clePrincipale ? idParCle.get(clePrincipale) ?? null : (idParCle.values().next().value ?? null)
  const { error } = await supabase.from('recettes').update({ ...reste, etapes: etapesFinales, photo_principale }).eq('id', recetteId)
  if (error) throw error
  return recetteId
}

async function supprimerFichiers(photos: Photo[]) {
  const chemins = photos.flatMap((p) => [p.chemin, p.miniature]).filter((c): c is string => Boolean(c))
  if (chemins.length) await supabase.storage.from(BUCKET).remove(chemins)
}

export async function supprimerRecette(r: RecetteComplete) {
  await supprimerFichiers(r.photos)
  const { error } = await supabase.from('recettes').delete().eq('id', r.id)
  if (error) throw error
}
