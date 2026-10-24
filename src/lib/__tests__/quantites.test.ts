import { describe, expect, it } from 'vitest'
import { enFraction, formaterDuree, formaterQuantite } from '../quantites'

describe('quantités', () => {
  it('affiche des fractions', () => {
    expect(enFraction(1.5)).toBe('1 ½')
    expect(enFraction(0.25)).toBe('¼')
    expect(enFraction(2 / 3)).toBe('⅔')
    expect(enFraction(3)).toBe('3')
    expect(enFraction(2.98)).toBe('3')
  })

  it('ajuste selon les portions', () => {
    const farine = { quantite: 250, unite: 'g', nom: 'farine' }
    expect(formaterQuantite(farine, 6 / 4)).toBe('375 g')
    expect(formaterQuantite(farine, 1 / 3)).toBe('83 g')
    const oeufs = { quantite: 3, unite: '', nom: 'œufs' }
    expect(formaterQuantite(oeufs, 0.5)).toBe('1 ½')
    const sucre = { quantite: 1, unite: 'c. à s.', nom: 'sucre' }
    expect(formaterQuantite(sucre, 0.5)).toBe('½ c. à s.')
    const lait = { quantite: 2, unite: 'dl', nom: 'lait' }
    expect(formaterQuantite(lait, 0.75)).toBe('1,5 dl')
  })

  it('gère les fourchettes et les quantités absentes', () => {
    expect(formaterQuantite({ quantite: 3, quantite_max: 4, unite: '', nom: 'échalotes' }, 2)).toBe('6 à 8')
    expect(formaterQuantite({ quantite: null, unite: 'pincée', nom: 'sel' })).toBe('pincée')
    expect(formaterQuantite({ quantite: null, unite: '', nom: 'poivre' })).toBe('')
  })

  it('affiche les durées', () => {
    expect(formaterDuree(40)).toBe('40 min')
    expect(formaterDuree(75)).toBe('1 h 15')
    expect(formaterDuree(120)).toBe('2 h')
    expect(formaterDuree(null)).toBe('')
  })
})
