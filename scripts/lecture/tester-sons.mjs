// =============================================================
//  Lis-moi — tests des « Sons en couleur » (spécification de Max, 20/11/2026, étape A)
//  Lancer : npm run tester-sons
//  Chaque cas : le mot et ce qui doit être coloré, écrit comme les exceptions de
//  src/utils/phonemes.js : [lettres:son] ; un mot sans crochets = rien de coloré.
// =============================================================
import { readFileSync } from 'node:fs'
import { chargerSons } from '../../src/utils/decoupageSons.js'
import { analyserTexte } from '../../src/utils/phonemes.js'

const sons = chargerSons(readFileSync(new URL('../../public/lecture/sons.txt', import.meta.url), 'utf8'))

const rendu = (texte) => {
  let s = ''
  let i = 0
  for (const [d, n, id] of analyserTexte(texte, { sons })) {
    s += texte.slice(i, d) + `[${texte.slice(d, d + n)}:${id}]`
    i = d + n
  }
  return s + texte.slice(i)
}

const CAS = [
  // ——— Positifs attendus (spécification §6 A) ———
  'p[an:an]da', 't[am:an]b[ou:ou]r', 't[en:an]te', 'mam[an:an]', 'gr[an:an]d',
  'lap[in:in]', 't[im:in]bre', 'm[ain:in]', 'p[ein:in]ture', 'chem[in:in]', 'sap[in:in]',
  'bl[é:e_aigu]', 'pani[er:e_aigu]', 'n[ez:e_aigu]', 'ch[an:an]t[er:e_aigu]', 'roch[er:e_aigu]',
  'coch[on:on]', 'tr[om:on]pe', 'ball[on:on]', 'p[om:on]pi[er:e_aigu]',
  'fl[eu:eu]rs', 'n[œu:eu]d', 'p[eu:eu]r', 'bl[eu:eu]', 'c[œu:eu]r',
  'l[ou:ou]p', 'gen[ou:ou]', 'r[ou:ou]te', 'c[ou:ou]rir',
  'p[oi:oi]re', 'n[oi:oi]r', 'v[oi:oi]ture', 'fr[oi:oi]d',
  't[au:o_au_eau]pe', 'chap[eau:o_au_eau]', 'j[au:o_au_eau]ne', '[eau:o_au_eau]', '[oi:oi]s[eau:o_au_eau]',
  // ——— Pièges / exceptions ———
  'monsi[eu:eu]r', // « on » muet ; « eu » se prononce bien [ø]
  'il a eu', // participe passé [y] : jamais le son « eu »
  'image', 'imit[er:e_aigu]', 'femme', 'bien', 'chien', 'rien', 'mer', 'hiver', 'super', 'pomme', 'tonne',
  'laine', 'baleine', 'semaine', 'âne', 'amie', 'ann[é:e_aigu]e', // « année » : « an » se dit [a] → pas « an »
  'examen', '[eu:eu]rop[é:e_aigu]en', 'moyen', // « en » = [ɛ̃] : pas une graphie des cartes « in », jamais « an »
  'ca[ou:ou]tch[ou:ou]c', 'aorte', 'stoïque',
  // ——— Écarts assumés avec la liste de la spécification (prononciation réelle) ———
  'fromage', // « fro-mage » : aucun son « an » (exemple de la carte, mais le son n'est pas prononcé)
  '[em:an]men[er:e_aigu]', // « an-mener » : « em » se prononce bien « an »
  'li[on:on]', 'cami[on:on]', // « li-on », « cami-on » : le son « on » est prononcé
  // ——— Phrases (mots lus avec leurs voisins) ———
  'Il est à l\'est.', 'Six chats et six [an:an]s.', 'Les p[ou:ou]les du c[ou:ou]v[en:an]t.',
]

let echecs = 0
for (const attendu of CAS) {
  const texte = attendu.replace(/\[([^\]:]+):[a-z_]+\]/g, '$1')
  const obtenu = rendu(texte)
  if (obtenu !== attendu) {
    echecs++
    console.log(`✗ ${texte} → obtenu ${obtenu}, attendu ${attendu}`)
  }
}
console.log(`${CAS.length - echecs}/${CAS.length} cas justes`)
process.exit(echecs ? 1 : 0)
