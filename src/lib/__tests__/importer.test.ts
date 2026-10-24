import { describe, expect, it } from 'vitest'
import { devinerCategorie, nettoyerTitre } from '../importer'

describe('import', () => {
  it('nettoie les titres des sites', () => {
    expect(nettoyerTitre('Tarte aux pommes : la meilleure recette')).toBe('Tarte aux pommes')
    expect(nettoyerTitre('Gratin dauphinois, la VRAIE recette')).toBe('Gratin dauphinois, la VRAIE recette')
    expect(nettoyerTitre('Gratin de pâtes')).toBe('Gratin de pâtes')
    expect(nettoyerTitre('navets caramélisés - Recette')).toBe('Navets caramélisés')
  })
  it('devine la catégorie', () => {
    expect(devinerCategorie('Dessert')).toBe('dessert')
    expect(devinerCategorie('Hauptgericht')).toBe('plat')
    expect(devinerCategorie('Plat principal')).toBe('plat')
    expect(devinerCategorie('Entrée')).toBe('entree')
    expect(devinerCategorie('')).toBe('plat')
  })
})
