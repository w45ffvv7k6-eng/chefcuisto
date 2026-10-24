import { describe, expect, it } from 'vitest'
import { filtrer, filtresVides } from '../recherche'
import type { RecetteComplete } from '../recettes'

const r = (champs: Partial<RecetteComplete>) => ({
  id: champs.titre, titre: '', description: '', categorie: 'plat', tags: [], notes: '', ingredients: [],
  origine: 'autre', favori: false, photos: [], ...champs,
}) as RecetteComplete

const recettes = [
  r({ titre: 'Crème brûlée', categorie: 'dessert', origine: 'maman', favori: true, ingredients: [{ quantite: 4, unite: '', nom: 'jaunes d’œufs' }] }),
  r({ titre: 'Gratin dauphinois', tags: ['hiver'], origine: 'web', ingredients: [{ quantite: 1, unite: 'kg', nom: 'pommes de terre' }, { quantite: 2, unite: 'dl', nom: 'crème' }] }),
  r({ titre: 'Tarte aux pommes', categorie: 'dessert', origine: 'maman' }),
]
const titres = (l: RecetteComplete[]) => l.map((x) => x.titre)

describe('recherche', () => {
  it('cherche sans accents dans le titre et les ingrédients, titre d’abord', () => {
    expect(titres(filtrer(recettes, { ...filtresVides, texte: 'creme' }))).toEqual(['Crème brûlée', 'Gratin dauphinois'])
    expect(titres(filtrer(recettes, { ...filtresVides, texte: 'pommes' }))).toEqual(['Tarte aux pommes', 'Gratin dauphinois'])
    expect(titres(filtrer(recettes, { ...filtresVides, texte: 'oeufs' }))).toEqual(['Crème brûlée'])
  })
  it('combine les filtres', () => {
    expect(titres(filtrer(recettes, { ...filtresVides, categorie: 'dessert', origine: 'maman' }))).toEqual(['Crème brûlée', 'Tarte aux pommes'])
    expect(titres(filtrer(recettes, { ...filtresVides, favoris: true }))).toEqual(['Crème brûlée'])
    expect(titres(filtrer(recettes, { ...filtresVides, tag: 'hiver' }))).toEqual(['Gratin dauphinois'])
  })
})
