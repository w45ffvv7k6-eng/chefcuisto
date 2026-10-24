// Repère les durées écrites dans une étape (« 35 minutes », « 1 h 15 », « 1h30 », « 2 à 3 min »)
// pour proposer un minuteur.

export interface DureeTrouvee {
  secondes: number
  libelle: string   // tel qu'écrit dans le texte
}

const RE = /(\d+(?:[.,]\d+)?)\s*(?:(?:à|-|–)\s*(\d+(?:[.,]\d+)?)\s*)?(h|heures?|hrs?|min(?:utes?)?\.?|mn|s(?:ec(?:ondes?)?)?)(?:\s*(\d{1,2})(?!\s*(?:°|g|kg|cm|ml|dl|cl|%)))?(?![a-zà-ÿ])/gi

export function detecterDurees(texte: string): DureeTrouvee[] {
  const trouvees: DureeTrouvee[] = []
  for (const m of texte.matchAll(RE)) {
    const unite = m[3].toLowerCase()
    // Pour « 2 à 3 min », on prend la durée la plus longue.
    const valeur = Number((m[2] ?? m[1]).replace(',', '.'))
    let secondes: number
    if (unite.startsWith('h')) secondes = valeur * 3600 + Number(m[4] ?? 0) * 60
    else if (unite.startsWith('m')) secondes = valeur * 60
    else secondes = valeur
    // « s » seul est souvent autre chose (« 2 s » rare en cuisine) : on exige au moins 10 secondes.
    if (secondes < 10 || secondes > 48 * 3600) continue
    trouvees.push({ secondes: Math.round(secondes), libelle: m[0].trim() })
  }
  return trouvees
}

// 2100 → « 35:00 », 4500 → « 1:15:00 »
export function formaterCompte(secondes: number): string {
  const s = Math.max(0, Math.ceil(secondes))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}
