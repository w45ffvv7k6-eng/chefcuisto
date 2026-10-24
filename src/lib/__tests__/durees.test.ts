import { describe, expect, it } from 'vitest'
import { detecterDurees, formaterCompte } from '../durees'

const secondes = (t: string) => detecterDurees(t).map((d) => d.secondes)

describe('durées dans les étapes', () => {
  it.each([
    ['Enfourner 35 minutes à 180 °C.', [2100]],
    ['Cuire 1 h 15 à feu doux.', [4500]],
    ['Laisser reposer 1h30.', [5400]],
    ['Cuire 2 à 3 min de chaque côté.', [180]],
    ['Cuire 10 min, puis encore 5 minutes.', [600, 300]],
    ['Laisser lever 2 heures.', [7200]],
    ['Préchauffer le four à 200 °C.', []],
    ['Ajouter 250 g de farine et 3 œufs.', []],
    ['Cuire 1 h à 180 °C.', [3600]],
    ['Mixer 30 secondes.', [30]],
    ['Réserver 20mn au frais.', [1200]],
    ['Ajouter 2 hachis.', []],
  ])('%s', (texte, attendu) => {
    expect(secondes(texte)).toEqual(attendu)
  })

  it('affiche le compte à rebours', () => {
    expect(formaterCompte(2100)).toBe('35:00')
    expect(formaterCompte(4500)).toBe('1:15:00')
    expect(formaterCompte(9.2)).toBe('0:10')
  })
})
