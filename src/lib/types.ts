// Le modèle de données de Cuisto, tel qu'il est stocké dans Supabase.

export type Categorie =
  | 'apero' | 'entree' | 'plat' | 'accompagnement' | 'dessert'
  | 'patisserie' | 'boisson' | 'sauce' | 'autre'

export type Difficulte = 'facile' | 'moyen' | 'difficile'
export type Origine = 'maman' | 'web' | 'autre'
export type TypePhoto = 'plat' | 'etape' | 'manuscrit' | 'autre'

export interface Ingredient {
  quantite: number | null      // 1.5 pour « 1 ½ » ; null pour « sel »
  quantite_max?: number | null // 4 pour « 3 à 4 »
  unite: string                // g, kg, ml, cl, dl, l, c. à s., c. à c., pincée… ou ''
  nom: string
  precision?: string           // « tamisée »
  groupe?: string              // « Pour la pâte »
}

export interface Etape {
  texte: string
  photo?: string | null        // id d'une Photo
  groupe?: string
}

export interface Recette {
  id: string
  titre: string
  description: string
  categorie: Categorie
  tags: string[]
  temps_preparation: number | null
  temps_cuisson: number | null
  temps_repos: number | null
  difficulte: Difficulte
  portions: number
  origine: Origine
  source: string
  ingredients: Ingredient[]
  etapes: Etape[]
  notes: string
  favori: boolean
  note: number
  photo_principale: string | null
  cree_le: string
  modifie_le: string
}

export interface Photo {
  id: string
  recette_id: string
  chemin: string
  miniature: string | null
  type: TypePhoto
  legende: string
  ordre: number
  largeur: number | null
  hauteur: number | null
}

export const CATEGORIES: Record<Categorie, string> = {
  apero: 'Apéro',
  entree: 'Entrée',
  plat: 'Plat',
  accompagnement: 'Accompagnement',
  dessert: 'Dessert',
  patisserie: 'Pâtisserie',
  boisson: 'Boisson',
  sauce: 'Sauce',
  autre: 'Autre',
}

export const ORIGINES: Record<Origine, string> = {
  maman: 'Recette de Maman',
  web: 'Web',
  autre: 'Autre',
}

export const DIFFICULTES: Record<Difficulte, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
}
