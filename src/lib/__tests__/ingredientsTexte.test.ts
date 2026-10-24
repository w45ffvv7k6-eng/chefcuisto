import { describe, expect, it } from 'vitest'
import { ingredientsEnTexte, lireIngredient, lireIngredients } from '../ingredientsTexte'

describe('lecture des ingrédients', () => {
  it.each([
    ['250 g de farine', { quantite: 250, unite: 'g', nom: 'farine' }],
    ['250g farine tamisée', { quantite: 250, unite: 'g', nom: 'farine tamisée' }],
    ['1,5 dl de lait', { quantite: 1.5, unite: 'dl', nom: 'lait' }],
    ['1/2 l d’eau', { quantite: 0.5, unite: 'l', nom: 'eau' }],
    ['1 1/2 c. à s. de sucre', { quantite: 1.5, unite: 'c. à s.', nom: 'sucre' }],
    ['½ cuillère à café de sel', { quantite: 0.5, unite: 'c. à c.', nom: 'sel' }],
    ['2 cuillères à soupe d\'huile d\'olive', { quantite: 2, unite: 'c. à s.', nom: 'huile d\'olive' }],
    ['3 cs de crème', { quantite: 3, unite: 'c. à s.', nom: 'crème' }],
    ['3 œufs', { quantite: 3, unite: '', nom: 'œufs' }],
    ['3-4 échalotes', { quantite: 3, quantite_max: 4, unite: '', nom: 'échalotes' }],
    ['3 à 4 pommes, épluchées', { quantite: 3, quantite_max: 4, unite: '', nom: 'pommes', precision: 'épluchées' }],
    ['1 pincée de sel', { quantite: 1, unite: 'pincée', nom: 'sel' }],
    ['Sel, poivre', { quantite: null, unite: '', nom: 'Sel, poivre' }],
    ['2 gousses d\'ail', { quantite: 2, unite: '', nom: 'gousses d\'ail' }],
    ['1 litre de bouillon', { quantite: 1, unite: 'l', nom: 'bouillon' }],
    ['- 200 gr de chocolat noir', { quantite: 200, unite: 'g', nom: 'chocolat noir' }],
    ['1 sachet de sucre vanillé', { quantite: 1, unite: 'sachet', nom: 'sucre vanillé' }],
    ['1 lime', { quantite: 1, unite: '', nom: 'lime' }],
    ['1 gros oignon', { quantite: 1, unite: '', nom: 'gros oignon' }],
  ])('%s', (ligne, attendu) => {
    expect(lireIngredient(ligne)).toEqual(attendu)
  })

  it('gère les groupes et l’aller-retour en texte', () => {
    const texte = 'Pour la pâte :\n250 g farine\n1 pincée sel\n\nPour la garniture :\n3-4 pommes, épluchées'
    const liste = lireIngredients(texte)
    expect(liste).toHaveLength(3)
    expect(liste[2].groupe).toBe('Pour la garniture')
    expect(ingredientsEnTexte(liste)).toBe(texte)
    expect(lireIngredients(ingredientsEnTexte(liste))).toEqual(liste)
  })
})
