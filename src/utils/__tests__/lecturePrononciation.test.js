import { describe, expect, it } from 'vitest'
import { prononciationVoix } from '../lecture.js'

describe('prononciationVoix (demande de Max : « p\'tit » se dit « pti »)', () => {
  it('remplace p\'tit avec l\'apostrophe droite ou typographique', () => {
    expect(prononciationVoix("Mais P'tit Loup se met à pleurer.")).toBe('Mais Pti Loup se met à pleurer.')
    expect(prononciationVoix('Mais P’tit Loup')).toBe('Mais Pti Loup')
    expect(prononciationVoix("le p'tit chat")).toBe('le pti chat')
  })
  it('garde le féminin et le pluriel', () => {
    expect(prononciationVoix("la p'tite, les p'tits et les p'tites")).toBe('la ptite, les ptis et les ptites')
  })
  it('ne touche pas aux autres mots', () => {
    expect(prononciationVoix("petit, l'petit, s'tit, tit, p'titan")).toBe("petit, l'petit, s'tit, tit, p'titan")
    expect(prononciationVoix('Oh là là ! soupire Papa.')).toBe('Oh là là ! soupire Papa.')
  })
})
