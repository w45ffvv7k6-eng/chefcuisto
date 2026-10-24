// Extraction d'une recette depuis le HTML d'une page web.
// 1. On cherche les données structurées schema.org/Recipe (JSON-LD), que la plupart
//    des sites de recettes publient pour Google.
// 2. À défaut, on se rabat sur les balises « microdata » et Open Graph (titre, photo, description).
// Ce fichier n'utilise que du JavaScript standard : il tourne dans Supabase (Deno) et dans les tests (Node).

export interface RecetteImportee {
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
  methode: 'json-ld' | 'microdata' | 'basique'
}

type Json = any // eslint-disable-line @typescript-eslint/no-explicit-any

const ENTITES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', ecirc: 'ê',
  agrave: 'à', acirc: 'â', ccedil: 'ç', ocirc: 'ô', ucirc: 'û', ugrave: 'ù', icirc: 'î', iuml: 'ï',
  euml: 'ë', oelig: 'œ', deg: '°', frac12: '½', frac14: '¼', frac34: '¾', rsquo: '’', lsquo: '‘',
  laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—', auml: 'ä', ouml: 'ö', uuml: 'ü', szlig: 'ß',
}

export function decoderEntites(t: string): string {
  return t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITES[code.toLowerCase()] ?? m
  })
}

// Enlève les balises HTML et normalise les espaces.
export function texteBrut(t: unknown): string {
  if (typeof t !== 'string') return ''
  return decoderEntites(decoderEntites(t.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')))
    .replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim()
}

// Durée ISO 8601 (PT1H30M, P0DT0H20M) → minutes.
export function dureeEnMinutes(d: unknown): number | null {
  if (typeof d !== 'string') return null
  const m = d.match(/^P(?:(\d+)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+)S)?)?$/i)
  if (!m) return null
  const minutes = Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) + Math.round(Number(m[4] ?? 0) / 60)
  return minutes > 0 ? Math.round(minutes) : null
}

function enListe<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

function estRecette(o: Json): boolean {
  return o && typeof o === 'object' && enListe(o['@type']).some((t: unknown) => typeof t === 'string' && /(^|\/)Recipe$/i.test(t))
}

// Parcourt tous les objets d'un JSON-LD (tableaux, @graph, objets imbriqués) à la recherche d'une Recipe.
function trouverRecette(o: Json, profondeur = 0): Json | null {
  if (!o || typeof o !== 'object' || profondeur > 6) return null
  if (Array.isArray(o)) {
    for (const x of o) { const r = trouverRecette(x, profondeur + 1); if (r) return r }
    return null
  }
  if (estRecette(o)) return o
  for (const cle of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'item']) {
    const r = trouverRecette(o[cle], profondeur + 1)
    if (r) return r
  }
  return null
}

function premiereImage(img: Json): string | null {
  for (const x of enListe(img)) {
    if (typeof x === 'string' && x) return x
    if (x && typeof x === 'object') {
      const url = x.url ?? x.contentUrl ?? x['@id']
      if (typeof url === 'string' && url) return url
    }
  }
  return null
}

function lireEtapes(instr: Json): { groupe?: string; texte: string }[] {
  const etapes: { groupe?: string; texte: string }[] = []
  const visiter = (x: Json, groupe?: string) => {
    if (x == null) return
    if (typeof x === 'string') {
      // Un seul bloc de texte : on le découpe en paragraphes ou en lignes numérotées.
      for (const morceau of texteBrut(x).split(/\n+|(?=\b\d+[.)]\s)/)) {
        const t = morceau.replace(/^\d+[.)]\s*/, '').trim()
        if (t) etapes.push(groupe ? { groupe, texte: t } : { texte: t })
      }
      return
    }
    if (Array.isArray(x)) return x.forEach((y) => visiter(y, groupe))
    const types = enListe(x['@type'])
    if (types.includes('HowToSection') || (x.itemListElement && !x.text)) {
      return visiter(x.itemListElement, texteBrut(x.name) || groupe)
    }
    const t = texteBrut(x.text ?? x.description ?? x.name)
    if (t) etapes.push(groupe ? { groupe, texte: t } : { texte: t })
  }
  visiter(instr)
  return etapes
}

function lirePortions(y: Json): number | null {
  for (const x of enListe(y)) {
    const m = String(x).match(/\d+/)
    if (m) return Number(m[0])
  }
  return null
}

function motsCles(k: Json): string[] {
  const brut = enListe(k).flatMap((x) => String(x).split(','))
  return [...new Set(brut.map((x) => texteBrut(x).toLowerCase()).filter((x) => x && x.length < 30))].slice(0, 8)
}

function depuisJsonLd(r: Json, base: string): RecetteImportee {
  const image = premiereImage(r.image)
  return {
    titre: texteBrut(r.name),
    description: texteBrut(r.description),
    image: image ? new URL(image, base).href : null,
    ingredients: enListe(r.recipeIngredient ?? r.ingredients).map(texteBrut).filter(Boolean),
    etapes: lireEtapes(r.recipeInstructions),
    temps_preparation: dureeEnMinutes(r.prepTime),
    temps_cuisson: dureeEnMinutes(r.cookTime),
    temps_total: dureeEnMinutes(r.totalTime),
    portions: lirePortions(r.recipeYield),
    categorie: texteBrut(enListe(r.recipeCategory)[0]),
    mots_cles: motsCles(r.keywords),
    methode: 'json-ld',
  }
}

function meta(html: string, nom: string): string {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${nom}["'][^>]*content=["']([^"']*)["']`, 'i')
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${nom}["']`, 'i')
  return texteBrut((html.match(re1) ?? html.match(re2))?.[1] ?? '')
}

function itemprops(html: string, nom: string): string[] {
  const re = new RegExp(`<([a-z]+)[^>]*itemprop=["']${nom}["'][^>]*>([\\s\\S]*?)</\\1>`, 'gi')
  return [...html.matchAll(re)].map((m) => texteBrut(m[2])).filter(Boolean)
}

// Beaucoup de sites publient un JSON légèrement invalide (retours à la ligne dans les textes,
// virgules en trop, commentaires) : on le répare avant de le lire.
function lireJson(brut: string): Json {
  const t = brut.trim().replace(/^<!--|-->$/g, '').replace(/^\/\*<!\[CDATA\[\*\/|\/\*\]\]>\*\/$/g, '')
  try {
    return JSON.parse(t)
  } catch {
    return JSON.parse(t.replace(/[\u0000-\u001f]+/g, ' ').replace(/,\s*([}\]])/g, '$1'))
  }
}

export function extraireRecette(html: string, url: string): RecetteImportee | null {
  // 1. JSON-LD
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const r = trouverRecette(lireJson(m[1]))
      if (r) return depuisJsonLd(r, url)
    } catch { /* bloc JSON invalide : on essaie le suivant */ }
  }

  // 2. Microdata et Open Graph
  const titre = meta(html, 'og:title') || texteBrut(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1])
  if (!titre) return null
  const ingredients = itemprops(html, 'recipeIngredient').concat(itemprops(html, 'ingredients'))
  const etapes = itemprops(html, 'recipeInstructions').flatMap((t) => lireEtapes(t))
  const image = meta(html, 'og:image')
  return {
    titre,
    description: meta(html, 'og:description') || meta(html, 'description'),
    image: image ? new URL(image, url).href : null,
    ingredients,
    etapes,
    temps_preparation: null,
    temps_cuisson: null,
    temps_total: null,
    portions: null,
    categorie: '',
    mots_cles: [],
    methode: ingredients.length ? 'microdata' : 'basique',
  }
}
