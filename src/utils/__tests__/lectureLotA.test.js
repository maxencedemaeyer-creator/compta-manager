// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { motProche } from '../motProche.js'
import { useReglages } from '../../components/lecture/reglages.js'

// ---------- Lis-moi, lot A : sélection un peu à côté du mot, sons en couleur jamais mémorisés ----------

// Faux bloc de texte : deux lignes de mots (24 px), sans vrai navigateur
function fauxBloc() {
  const mot = (i, left, top, largeur) => ({
    dataset: { i: String(i) },
    getBoundingClientRect: () => ({ left, right: left + largeur, top, bottom: top + 30, height: 30 }),
  })
  const mots = [mot(0, 100, 100, 60), mot(1, 170, 100, 60), mot(2, 100, 150, 80), mot(3, 190, 150, 40)]
  return { querySelectorAll: () => mots }
}

describe('motProche (sélection tolérante)', () => {
  beforeEach(() => {
    globalThis.getComputedStyle = () => ({ fontSize: '24px' }) // tolérance = 21,6 px
  })

  it('un point un peu à gauche du premier mot de la ligne choisit ce mot', () => {
    expect(motProche(fauxBloc(), 85, 112)?.dataset.i).toBe('0') // 15 px à gauche
    expect(motProche(fauxBloc(), 85, 162)?.dataset.i).toBe('2') // 2e ligne
  })

  it('un point trop loin à gauche ne choisit rien', () => {
    expect(motProche(fauxBloc(), 60, 112)).toBeNull() // 40 px
  })

  it('un point entre deux mots choisit le plus proche', () => {
    expect(motProche(fauxBloc(), 163, 112)?.dataset.i).toBe('0')
    expect(motProche(fauxBloc(), 167, 112)?.dataset.i).toBe('1')
  })

  it('un point dans l\'espace entre deux lignes reste sur la ligne la plus proche', () => {
    expect(motProche(fauxBloc(), 130, 134)?.dataset.i).toBe('0') // juste sous la ligne 1
    expect(motProche(fauxBloc(), 130, 146)?.dataset.i).toBe('2') // juste au-dessus de la ligne 2
  })

  it('à droite de la dernière phrase de la ligne : le dernier mot', () => {
    expect(motProche(fauxBloc(), 245, 112)?.dataset.i).toBe('1')
  })

  it('sans bloc : rien', () => {
    expect(motProche(null, 10, 10)).toBeNull()
  })
})

describe('réglages : « Sons en couleur » jamais mémorisé', () => {
  function lireReglages() {
    let r
    function Test() {
      r = useReglages().reglages
      return null
    }
    renderToString(createElement(Test))
    return r
  }
  beforeEach(() => {
    const memoire = {}
    globalThis.localStorage = {
      getItem: (k) => memoire[k] ?? null,
      setItem: (k, v) => (memoire[k] = v),
    }
  })

  it('éteint par défaut', () => {
    expect(lireReglages().couleursSons).toBe(false)
  })

  it('éteint même si une ancienne valeur « allumé » traîne sur la tablette', () => {
    localStorage.setItem('lisMoi_reglages', JSON.stringify({ couleursSons: true, taille: 3, vitesse: 'lent' }))
    const r = lireReglages()
    expect(r.couleursSons).toBe(false)
    // les autres réglages de l'appareil sont gardés
    expect(r.taille).toBe(3)
    expect(r.vitesse).toBe('lent')
  })
})
