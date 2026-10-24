// L'état du formulaire de recette (« brouillon »), et sa conversion depuis/vers une recette.
import { ingredientsEnTexte } from './ingredientsTexte'
import type { PhotoFormulaire, RecetteComplete } from './recettes'
import type { Categorie, Difficulte, Origine } from './types'

export interface EtapeBrouillon {
  cle: string
  texte: string
  photo: string | null   // clé d'une PhotoFormulaire
}

export interface Brouillon {
  titre: string
  description: string
  categorie: Categorie
  tags: string
  temps_preparation: string
  temps_cuisson: string
  temps_repos: string
  difficulte: Difficulte
  portions: string
  origine: Origine
  source: string
  ingredients: string
  etapes: EtapeBrouillon[]
  notes: string
  favori: boolean
  note: number
  photos: PhotoFormulaire[]
  principale: string | null
}

export const cle = () => crypto.randomUUID()

export function brouillonVide(): Brouillon {
  return {
    titre: '', description: '', categorie: 'plat', tags: '',
    temps_preparation: '', temps_cuisson: '', temps_repos: '',
    difficulte: 'facile', portions: '4', origine: 'maman', source: '',
    ingredients: '', etapes: [{ cle: cle(), texte: '', photo: null }],
    notes: '', favori: false, note: 0, photos: [], principale: null,
  }
}

const enTexte = (n: number | null) => (n == null ? '' : String(n))

export function brouillonDepuisRecette(r: RecetteComplete): Brouillon {
  const photos: PhotoFormulaire[] = r.photos.map((p) => ({
    cle: p.id, id: p.id, chemin: p.chemin, miniature: p.miniature, type: p.type, legende: p.legende,
  }))
  return {
    titre: r.titre, description: r.description, categorie: r.categorie, tags: r.tags.join(', '),
    temps_preparation: enTexte(r.temps_preparation), temps_cuisson: enTexte(r.temps_cuisson), temps_repos: enTexte(r.temps_repos),
    difficulte: r.difficulte, portions: String(r.portions), origine: r.origine, source: r.source,
    ingredients: ingredientsEnTexte(r.ingredients),
    etapes: r.etapes.map((e) => ({ cle: cle(), texte: e.texte, photo: e.photo ?? null })),
    notes: r.notes, favori: r.favori, note: r.note, photos, principale: r.photo_principale,
  }
}

export const enMinutes = (t: string) => {
  const n = parseInt(t, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}
