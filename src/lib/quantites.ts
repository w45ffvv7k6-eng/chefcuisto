// Affichage et ajustement des quantités d'ingrédients.

import type { Ingredient } from './types'

// Unités métriques : on les affiche en nombres décimaux (0,5 dl), pas en fractions.
const METRIQUES = new Set(['g', 'kg', 'mg', 'ml', 'cl', 'dl', 'l'])

const FRACTIONS: [number, string][] = [
  [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'],
]

// 1.5 → « 1 ½ », 0.333 → « ⅓ », 2.2 → « 2,2 »
export function enFraction(n: number): string {
  const entier = Math.floor(n + 1e-9)
  const reste = n - entier
  if (reste < 0.06) return String(entier)
  if (reste > 0.94) return String(entier + 1)
  for (const [valeur, symbole] of FRACTIONS) {
    if (Math.abs(reste - valeur) < 0.05) return entier ? `${entier} ${symbole}` : symbole
  }
  return enDecimal(n)
}

// Arrondi lisible : 333.33 g → 335 g, 12.4 → 12, 1.25 → 1,25
export function enDecimal(n: number): string {
  let arrondi: number
  if (n >= 100) arrondi = Math.round(n / 5) * 5
  else if (n >= 10) arrondi = Math.round(n)
  else arrondi = Math.round(n * 100) / 100
  return arrondi.toLocaleString('fr-CH', { maximumFractionDigits: 2 })
}

export function formaterNombre(n: number, unite: string): string {
  return METRIQUES.has(unite.trim().toLowerCase()) ? enDecimal(n) : enFraction(n)
}

// Texte de la quantité d'un ingrédient pour un facteur donné (portions voulues / portions de la recette).
export function formaterQuantite(ing: Ingredient, facteur = 1): string {
  if (ing.quantite == null) return ing.unite
  let texte = formaterNombre(ing.quantite * facteur, ing.unite)
  if (ing.quantite_max != null) texte += ` à ${formaterNombre(ing.quantite_max * facteur, ing.unite)}`
  return ing.unite ? `${texte} ${ing.unite}` : texte
}

// 75 → « 1 h 15 », 40 → « 40 min »
export function formaterDuree(minutes: number | null | undefined): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

export function tempsTotal(r: { temps_preparation: number | null; temps_cuisson: number | null; temps_repos: number | null }) {
  return (r.temps_preparation ?? 0) + (r.temps_cuisson ?? 0) + (r.temps_repos ?? 0)
}
