// Fonction serveur Supabase : lit une page de recette à la place du navigateur
// (qui n'a pas le droit de le faire lui-même, à cause de la règle de sécurité « CORS »).
//   POST { url }         → la recette trouvée dans la page
//   POST { image: url }  → l'image, pour pouvoir l'enregistrer dans Cuisto
// Seul un utilisateur connecté peut l'appeler (Supabase vérifie le jeton de connexion).
import { extraireRecette } from './extraire.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Se présenter comme un navigateur ordinaire : certains sites refusent les robots.
const ENTETES = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'fr-CH,fr;q=0.9,de;q=0.6,en;q=0.5',
}

function reponse(corps: unknown, statut = 200) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

function adresseValide(brute: unknown): URL | null {
  try {
    const u = new URL(String(brute))
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return reponse({ erreur: 'Méthode non autorisée' }, 405)

  let demande: { url?: string; image?: string }
  try { demande = await req.json() } catch { return reponse({ erreur: 'Demande illisible' }, 400) }

  if (demande.image) {
    const u = adresseValide(demande.image)
    if (!u) return reponse({ erreur: 'Adresse d’image invalide' }, 400)
    const r = await fetch(u, { headers: { ...ENTETES, Accept: 'image/*' } })
    const type = r.headers.get('content-type') ?? ''
    if (!r.ok || !type.startsWith('image/')) return reponse({ erreur: `Image introuvable (${r.status})` }, 502)
    return new Response(r.body, { headers: { ...CORS, 'Content-Type': type } })
  }

  const u = adresseValide(demande.url)
  if (!u) return reponse({ erreur: 'Ce lien ne ressemble pas à une adresse web.' }, 400)

  let html: string
  try {
    const r = await fetch(u, { headers: ENTETES, redirect: 'follow' })
    if (!r.ok) return reponse({ erreur: `Le site a refusé la lecture de la page (erreur ${r.status}).` }, 502)
    html = await r.text()
  } catch (e) {
    return reponse({ erreur: `Impossible d’ouvrir la page : ${(e as Error).message}` }, 502)
  }

  const recette = extraireRecette(html, u.href)
  if (!recette) return reponse({ erreur: 'Aucune recette trouvée sur cette page.' }, 422)
  return reponse({ recette })
})
