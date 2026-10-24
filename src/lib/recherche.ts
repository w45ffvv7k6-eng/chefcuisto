// Recherche et filtres de la galerie. Tout se fait sur le téléphone, sans attendre le serveur.
import type { RecetteComplete } from './recettes'
import type { Categorie, Origine } from './types'

export interface Filtres {
  texte: string
  categorie: Categorie | null
  origine: Origine | null
  tag: string | null
  favoris: boolean
}

export const filtresVides: Filtres = { texte: '', categorie: null, origine: null, tag: null, favoris: false }

// « Crème brûlée » → « creme brulee » : la recherche ignore accents et majuscules.
export function normaliser(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').toLowerCase()
}

function correspond(r: RecetteComplete, mots: string[]): boolean {
  const titre = normaliser(r.titre)
  const reste = normaliser([r.description, r.tags.join(' '), r.notes, ...r.ingredients.map((i) => i.nom)].join(' '))
  return mots.every((m) => titre.includes(m) || reste.includes(m))
}

export function filtrer(recettes: RecetteComplete[], f: Filtres): RecetteComplete[] {
  const mots = normaliser(f.texte).split(/\s+/).filter(Boolean)
  return recettes.filter((r) =>
    (!f.categorie || r.categorie === f.categorie)
    && (!f.origine || r.origine === f.origine)
    && (!f.tag || r.tags.includes(f.tag))
    && (!f.favoris || r.favori)
    && (!mots.length || correspond(r, mots)),
  ).sort((a, b) => {
    // Les recettes dont le titre contient la recherche passent en premier.
    if (!mots.length) return 0
    const ta = mots.every((m) => normaliser(a.titre).includes(m)) ? 0 : 1
    const tb = mots.every((m) => normaliser(b.titre).includes(m)) ? 0 : 1
    return ta - tb
  })
}

export function filtresActifs(f: Filtres): number {
  return Number(Boolean(f.categorie)) + Number(Boolean(f.origine)) + Number(Boolean(f.tag)) + Number(f.favoris)
}
