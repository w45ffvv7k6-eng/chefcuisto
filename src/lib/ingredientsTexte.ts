// Conversion entre le texte libre (« 250 g de farine, tamisée ») et la liste d'Ingredient.
// Sert au formulaire (une ligne par ingrédient) et à l'import depuis une URL.
import type { Ingredient } from './types'

const FRACTIONS_UNICODE: Record<string, number> = {
  '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅕': 0.2, '⅛': 0.125,
}

// Chaque unité reconnue, avec ses façons courantes de l'écrire. L'ordre compte : les plus longues d'abord.
const UNITES: [string, RegExp][] = [
  ['c. à s.', /^(?:c\.?\s?à\.?\s?s\.?|cs|c\.s\.|cuill?(?:ère|ere|\.)?s?\s+à\s+soupe|cas|tbsp|el)(?=\s|$|\b)/i],
  ['c. à c.', /^(?:c\.?\s?à\.?\s?c\.?|cc|c\.c\.|cuill?(?:ère|ere|\.)?s?\s+à\s+café|cac|tsp|kl)(?=\s|$|\b)/i],
  ['pincée', /^pincées?(?=\s|$)/i],
  ['sachet', /^sachets?(?=\s|$)/i],
  ['tranche', /^tranches?(?=\s|$)/i],
  ['boîte', /^bo[iî]tes?(?=\s|$)/i],
  ['verre', /^verres?(?=\s|$)/i],
  ['tasse', /^tasses?(?=\s|$)/i],
  ['bouquet', /^bouquets?(?=\s|$)/i],
  ['brin', /^brins?(?=\s|$)/i],
  ['kg', /^(?:kg|kilos?|kilogrammes?)(?=\s|$)/i],
  ['mg', /^mg(?=\s|$)/i],
  ['g', /^(?:g|gr|grammes?)(?=\s|$)/i],
  ['ml', /^ml(?=\s|$)/i],
  ['cl', /^cl(?=\s|$)/i],
  ['dl', /^dl(?=\s|$)/i],
  ['l', /^(?:l|litres?)(?=\s|$)/i],
]

// Lit un nombre au début du texte : 2 · 1,5 · 1/2 · 1 1/2 · ½ · 1½. Renvoie [valeur, longueur lue].
function lireNombre(t: string): [number, number] | null {
  const m = t.match(/^(\d+)?\s*([¼½¾⅓⅔⅕⅛])/) // 1½, ½
  if (m) return [(m[1] ? Number(m[1]) : 0) + FRACTIONS_UNICODE[m[2]], m[0].length]
  const mixte = t.match(/^(\d+)\s+(\d+)\/(\d+)/) // 1 1/2
  if (mixte) return [Number(mixte[1]) + Number(mixte[2]) / Number(mixte[3]), mixte[0].length]
  const frac = t.match(/^(\d+)\/(\d+)/)
  if (frac) return [Number(frac[1]) / Number(frac[2]), frac[0].length]
  const dec = t.match(/^\d+(?:[.,]\d+)?/)
  if (dec) return [Number(dec[0].replace(',', '.')), dec[0].length]
  return null
}

export function lireIngredient(ligne: string, groupe?: string): Ingredient {
  let t = ligne.trim().replace(/^[-•*–]\s*/, '')
  let quantite: number | null = null
  let quantite_max: number | null = null

  const n = lireNombre(t)
  if (n) {
    quantite = n[0]
    t = t.slice(n[1]).trimStart()
    const fourchette = t.match(/^(?:-|–|à)\s*/)
    if (fourchette) {
      const n2 = lireNombre(t.slice(fourchette[0].length))
      if (n2) {
        quantite_max = n2[0]
        t = t.slice(fourchette[0].length + n2[1]).trimStart()
      }
    }
  }

  let unite = ''
  // L'unité n'est cherchée qu'après une quantité, ou pour « pincée » seule.
  for (const [nom, re] of UNITES) {
    if (quantite === null && nom !== 'pincée') continue
    const m = t.match(re)
    if (m) {
      unite = nom
      t = t.slice(m[0].length).trimStart()
      break
    }
  }

  t = t.replace(/^(?:de |d['’]\s?)/i, '')
  // Sans quantité (« Sel, poivre »), toute la ligne est le nom.
  const virgule = quantite === null ? -1 : t.indexOf(',')
  const nom = (virgule >= 0 ? t.slice(0, virgule) : t).trim()
  const precision = virgule >= 0 ? t.slice(virgule + 1).trim() : ''

  const ing: Ingredient = { quantite, unite, nom }
  if (quantite_max != null) ing.quantite_max = quantite_max
  if (precision) ing.precision = precision
  if (groupe) ing.groupe = groupe
  return ing
}

// Une ligne qui finit par « : » ouvre un groupe (« Pour la pâte : »).
export function lireIngredients(texte: string): Ingredient[] {
  const liste: Ingredient[] = []
  let groupe: string | undefined
  for (const brute of texte.split('\n')) {
    const ligne = brute.trim()
    if (!ligne) continue
    if (ligne.endsWith(':')) {
      groupe = ligne.slice(0, -1).trim() || undefined
      continue
    }
    liste.push(lireIngredient(ligne, groupe))
  }
  return liste
}

function nombreEnTexte(n: number): string {
  return String(Math.round(n * 1000) / 1000).replace('.', ',')
}

export function ingredientEnTexte(ing: Ingredient): string {
  const morceaux: string[] = []
  if (ing.quantite != null) {
    morceaux.push(nombreEnTexte(ing.quantite) + (ing.quantite_max != null ? `-${nombreEnTexte(ing.quantite_max)}` : ''))
  }
  if (ing.unite) morceaux.push(ing.unite)
  morceaux.push(ing.nom)
  return morceaux.join(' ') + (ing.precision ? `, ${ing.precision}` : '')
}

export function ingredientsEnTexte(liste: Ingredient[]): string {
  const lignes: string[] = []
  let groupe: string | undefined
  for (const ing of liste) {
    if ((ing.groupe ?? undefined) !== groupe) {
      groupe = ing.groupe ?? undefined
      if (lignes.length) lignes.push('')
      if (groupe) lignes.push(`${groupe} :`)
    }
    lignes.push(ingredientEnTexte(ing))
  }
  return lignes.join('\n')
}
