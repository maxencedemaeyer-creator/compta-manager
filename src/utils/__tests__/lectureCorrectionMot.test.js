import { describe, expect, it } from 'vitest'
import { remplacerMot } from '../lecture.js'

const pos = (texte, mot) => [texte.indexOf(mot), texte.indexOf(mot) + mot.length]

describe('remplacerMot (corriger ou supprimer un mot)', () => {
  it('corrige un mot', () => {
    const t = 'Oh là là ! soupire Papa. Ë Que s\'est-il passé ici ?'
    expect(remplacerMot(t, ...pos(t, 'Ë'), 'E')).toBe('Oh là là ! soupire Papa. E Que s\'est-il passé ici ?')
  })
  it('supprime un mot : case vide, sans double espace (demande de Max, 22/11)', () => {
    const t = 'Oh là là ! soupire Papa. Ë Que s\'est-il passé ici ?'
    expect(remplacerMot(t, ...pos(t, 'Ë'), '')).toBe('Oh là là ! soupire Papa. Que s\'est-il passé ici ?')
  })
  it('supprime un mot en fin de ligne : retire l\'espace avant, garde le retour à la ligne', () => {
    const t = 'Une fête Ë\nLigne suivante'
    expect(remplacerMot(t, ...pos(t, 'Ë'), '')).toBe('Une fête\nLigne suivante')
  })
  it('supprime un mot en début de texte', () => {
    const t = 'Ë Bonjour'
    expect(remplacerMot(t, 0, 1, '')).toBe('Bonjour')
  })
})
