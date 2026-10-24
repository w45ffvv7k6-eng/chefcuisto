// Teste l'import sur de vrais sites (lancé par GitHub Actions, qui a accès à internet).
// Usage : node --experimental-strip-types scripts/tester-import.ts <url> [<url>…]
import { extraireRecette } from '../supabase/functions/importer-recette/extraire.ts'

const ENTETES = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-CH,fr;q=0.9,de;q=0.6,en;q=0.5',
}

let echecs = 0
for (const url of process.argv.slice(2)) {
  try {
    const r = await fetch(url, { headers: ENTETES, redirect: 'follow' })
    const html = await r.text()
    const recette = extraireRecette(html, url)
    const ok = Boolean(r.ok && recette && recette.ingredients.length && recette.etapes.length)
    if (!ok) echecs++
    console.log(`${ok ? 'OK ' : 'ÉCHEC'} ${r.status} ${url}`)
    console.log(JSON.stringify(recette, null, 1)?.slice(0, 1800))
    console.log(`::${ok ? 'notice' : 'warning'}::${r.status} ${recette?.methode ?? 'rien'} · ${recette?.ingredients.length ?? 0} ingr. · ${recette?.etapes.length ?? 0} étapes · prépa ${recette?.temps_preparation} · cuisson ${recette?.temps_cuisson} · ${recette?.portions} pers. · image ${recette?.image ? 'oui' : 'non'} · « ${recette?.titre} » — ${url}`)
  } catch (e) {
    echecs++
    console.log(`::warning::erreur ${(e as Error).message} — ${url}`)
  }
}
process.exit(echecs ? 1 : 0)
