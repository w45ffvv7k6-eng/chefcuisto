import { describe, expect, it } from 'vitest'
import { CATEGORIES, ORIGINES } from '../types'

describe('modèle', () => {
  it('a des libellés français pour chaque origine', () => {
    expect(ORIGINES.maman).toBe('Recette de Maman')
    expect(Object.keys(CATEGORIES)).toContain('dessert')
  })
})
