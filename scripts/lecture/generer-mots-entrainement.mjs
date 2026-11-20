// =============================================================
//  Lis-moi — liste des mots de l'« Entraînement des sons »
//  Les mots français les plus fréquents (Lexique 3.83, rangés par fréquence films + livres)
//  qui contiennent au moins une graphie des 8 cartes et que le dictionnaire des sons connaît.
//  Source : mots.txt du site INTERFACE-ELEVES (public/valise/lexique/mots.txt, CC BY-SA 4.0).
//  Lancer : node scripts/lecture/generer-mots-entrainement.mjs <chemin vers mots.txt> [nombre]
//  Écrit : public/lecture/entrainement-mots.txt (un mot par ligne, du plus fréquent au moins fréquent)
// =============================================================
import { readFileSync, writeFileSync } from 'node:fs'

const [, , source, nombre = '5000'] = process.argv
if (!source) {
  console.error('Usage : node scripts/lecture/generer-mots-entrainement.mjs <mots.txt> [nombre]')
  process.exit(1)
}
const connus = new Set(
  readFileSync(new URL('../../public/lecture/sons.txt', import.meta.url), 'utf8')
    .split('\n')
    .map((l) => l.split('\t')[0])
    .filter(Boolean)
)
const GRAPHIES = /(an|am|en|em|in|im|ain|ein|é|er|ez|on|om|eu|oeu|œu|ou|oi|au|eau)/
const mots = []
for (const mot of readFileSync(source, 'utf8').split('\n')) {
  if (mots.length >= Number(nombre)) break
  if (!/^\p{Ll}{2,}$/u.test(mot)) continue // mots d'au moins 2 lettres, sans majuscule ni trait d'union
  if (!connus.has(mot) || !GRAPHIES.test(mot.replace(/œ/g, 'oe'))) continue
  mots.push(mot)
}
writeFileSync(new URL('../../public/lecture/entrainement-mots.txt', import.meta.url), mots.join('\n') + '\n')
console.log(`${mots.length} mots écrits dans public/lecture/entrainement-mots.txt`)
