import { describe, expect, it } from 'vitest'
import { dureeEnMinutes, extraireRecette } from '../../../supabase/functions/importer-recette/extraire'

const page = (jsonld: unknown) => `<html><head><title>Ma page</title>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script></head><body></body></html>`

describe('extraction des recettes', () => {
  it('lit les durées ISO 8601', () => {
    expect(dureeEnMinutes('PT1H30M')).toBe(90)
    expect(dureeEnMinutes('PT20M')).toBe(20)
    expect(dureeEnMinutes('P0DT0H45M')).toBe(45)
    expect(dureeEnMinutes('PT0S')).toBeNull()
    expect(dureeEnMinutes('20 min')).toBeNull()
  })

  it('trouve une Recipe dans un @graph, avec sections et entités HTML', () => {
    const r = extraireRecette(page({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', name: 'x' },
        {
          '@type': ['Recipe'], name: 'Tarte &amp; pommes', description: '<p>Très <b>bonne</b></p>',
          image: [{ '@type': 'ImageObject', url: '/img/tarte.jpg' }],
          recipeIngredient: ['250 g de farine', '3 pommes'],
          recipeInstructions: [
            { '@type': 'HowToSection', name: 'La pâte', itemListElement: [{ '@type': 'HowToStep', text: 'Mélanger.' }] },
            { '@type': 'HowToStep', text: 'Cuire 30&nbsp;min.' },
          ],
          prepTime: 'PT20M', cookTime: 'PT30M', recipeYield: ['6', '6 personnes'],
          recipeCategory: 'Dessert', keywords: 'tarte, pommes, facile',
        },
      ],
    }), 'https://exemple.ch/recettes/tarte')!
    expect(r.methode).toBe('json-ld')
    expect(r.titre).toBe('Tarte & pommes')
    expect(r.description).toBe('Très bonne')
    expect(r.image).toBe('https://exemple.ch/img/tarte.jpg')
    expect(r.ingredients).toEqual(['250 g de farine', '3 pommes'])
    expect(r.etapes).toEqual([{ groupe: 'La pâte', texte: 'Mélanger.' }, { texte: 'Cuire 30 min.' }])
    expect([r.temps_preparation, r.temps_cuisson, r.portions]).toEqual([20, 30, 6])
    expect(r.mots_cles).toEqual(['tarte', 'pommes', 'facile'])
  })

  it('découpe des instructions données en un seul texte', () => {
    const r = extraireRecette(page({ '@type': 'Recipe', name: 'Soupe', recipeIngredient: ['1 courge'], recipeInstructions: '1. Couper. 2. Cuire. 3. Mixer.' }), 'https://a.ch')!
    expect(r.etapes.map((e) => e.texte)).toEqual(['Couper.', 'Cuire.', 'Mixer.'])
  })

  it('se rabat sur Open Graph sans données structurées', () => {
    const r = extraireRecette(`<html><head><meta property="og:title" content="Gâteau de Mamie">
      <meta property="og:image" content="https://a.ch/g.jpg"><meta name="description" content="Moelleux"></head>
      <body><li itemprop="recipeIngredient">200 g de sucre</li></body></html>`, 'https://a.ch')!
    expect(r).toMatchObject({ titre: 'Gâteau de Mamie', image: 'https://a.ch/g.jpg', description: 'Moelleux', ingredients: ['200 g de sucre'], methode: 'microdata' })
  })
})
