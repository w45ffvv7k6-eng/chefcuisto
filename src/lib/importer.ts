// Import d'une recette depuis une page web, via la fonction serveur « importer-recette ».
import { cle, type Brouillon } from './brouillon'
import { preparerImage } from './images'
import type { PhotoFormulaire } from './recettes'
import { supabase, supabaseCle, supabaseUrl } from './supabase'
import type { Categorie } from './types'

// Ce que renvoie la fonction serveur (voir supabase/functions/importer-recette/extraire.ts).
interface RecetteImportee {
  titre: string
  description: string
  image: string | null
  ingredients: string[]
  etapes: { groupe?: string; texte: string }[]
  temps_preparation: number | null
  temps_cuisson: number | null
  temps_total: number | null
  portions: number | null
  categorie: string
  mots_cles: string[]
}

// Devine la catégorie Cuisto à partir de celle du site (en français ou en allemand).
export function devinerCategorie(texte: string): Categorie {
  const t = texte.toLowerCase()
  const regles: [Categorie, RegExp][] = [
    ['apero', /ap[ée]ro|amuse|fingerfood|snack/],
    ['entree', /entr[ée]e|vorspeise|starter|soupe|suppe/],
    ['accompagnement', /accompagnement|beilage|side/],
    ['patisserie', /p[âa]tisserie|boulangerie|g[âa]teau|cake|kuchen|backen|biscuit|pain|brot/],
    ['dessert', /dessert|sucr[ée]|süss/],
    ['boisson', /boisson|cocktail|getränk|drink/],
    ['sauce', /sauce|dip|vinaigrette/],
    ['plat', /plat|principal|hauptgericht|hauptspeise|main/],
  ]
  return regles.find(([, re]) => re.test(t))?.[0] ?? 'plat'
}

// « Tarte aux pommes : la meilleure recette » → « Tarte aux pommes »
export function nettoyerTitre(titre: string): string {
  return titre
    .replace(/\s*[:|–—-]\s*(la meilleure recette|la vraie recette|recette facile|recette)\s*$/i, '')
    .replace(/^recette (de |du |des |d['’])?/i, (m) => (m.length > 8 ? '' : m))
    .replace(/^\p{Ll}/u, (c) => c.toUpperCase())
    .trim()
}

async function message(error: unknown): Promise<string> {
  // L'erreur de la fonction contient la réponse du serveur, avec un message en français.
  const contexte = (error as { context?: Response }).context
  if (contexte && typeof contexte.json === 'function') {
    try { return (await contexte.json()).erreur ?? (error as Error).message } catch { /* rien */ }
  }
  return (error as Error).message
}

export async function importerDepuisUrl(url: string): Promise<Partial<Brouillon>> {
  const { data, error } = await supabase.functions.invoke('importer-recette', { body: { url } })
  if (error) throw new Error(await message(error))
  const r = data.recette as RecetteImportee

  const repos = r.temps_total && r.temps_total - (r.temps_preparation ?? 0) - (r.temps_cuisson ?? 0)
  const brouillon: Partial<Brouillon> = {
    titre: nettoyerTitre(r.titre),
    description: r.description.length > 300 ? r.description.slice(0, 297) + '…' : r.description,
    categorie: devinerCategorie(`${r.categorie} ${r.mots_cles.join(' ')}`),
    tags: r.mots_cles.slice(0, 5).join(', '),
    temps_preparation: r.temps_preparation ? String(r.temps_preparation) : '',
    temps_cuisson: r.temps_cuisson ? String(r.temps_cuisson) : '',
    temps_repos: repos && repos > 0 ? String(repos) : '',
    portions: r.portions ? String(r.portions) : '4',
    origine: 'web',
    source: url,
    ingredients: r.ingredients.join('\n'),
    etapes: r.etapes.length
      ? r.etapes.map((e) => ({ cle: cle(), texte: e.texte, photo: null }))
      : [{ cle: cle(), texte: '', photo: null }],
  }

  // La photo passe aussi par la fonction serveur, puis elle est réduite comme les autres.
  if (r.image) {
    try {
      // Appel direct (et non functions.invoke) pour recevoir l'image telle quelle.
      const { data: { session } } = await supabase.auth.getSession()
      const rep = await fetch(`${supabaseUrl}/functions/v1/importer-recette`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: supabaseCle, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: r.image }),
      })
      if (rep.ok && rep.headers.get('content-type')?.startsWith('image/')) {
        const prete = await preparerImage(await rep.blob())
        const photo: PhotoFormulaire = { cle: cle(), nouvelle: prete, apercu: URL.createObjectURL(prete.miniature), type: 'plat', legende: '' }
        brouillon.photos = [photo]
        brouillon.principale = photo.cle
      }
    } catch { /* pas de photo : ce n'est pas grave */ }
  }
  return brouillon
}
