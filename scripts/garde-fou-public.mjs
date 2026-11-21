// =============================================================
//  Garde-fou du stockage Vercel
//  Vercel garde une copie complète de public/ à CHAQUE déploiement.
//  Ce script échoue (et nomme les fichiers) si :
//   - public/ dépasse 25 Mo au total ;
//   - un fichier de public/ dépasse 2 Mo.
//  Lancé automatiquement à chaque envoi (GitHub Actions) et à la
//  main avec : node scripts/garde-fou-public.mjs
//  Fichier trop lourd ? Le mettre sur la branche « medias »
//  (voir src/config/medias.js), pas dans public/.
// =============================================================
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RACINE = new URL('../public', import.meta.url).pathname
const MAX_TOTAL = 25 * 1024 * 1024
const MAX_FICHIER = 2 * 1024 * 1024

function lister(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? lister(join(dossier, e.name)) : [{ chemin: relative(RACINE, join(dossier, e.name)), taille: statSync(join(dossier, e.name)).size }],
  )
}

const mo = (n) => (n / 1048576).toFixed(2) + ' Mo'
const fichiers = lister(RACINE)
const total = fichiers.reduce((s, f) => s + f.taille, 0)
const trop = fichiers.filter((f) => f.taille > MAX_FICHIER).sort((a, b) => b.taille - a.taille)
const plusGros = [...fichiers].sort((a, b) => b.taille - a.taille).slice(0, 5)

console.log(`public/ : ${mo(total)} sur ${mo(MAX_TOTAL)} autorisés (${fichiers.length} fichiers)`)
console.log('Les plus gros :')
plusGros.forEach((f) => console.log(`  ${mo(f.taille).padStart(9)}  ${f.chemin}`))

let erreur = false
if (total > MAX_TOTAL) {
  erreur = true
  console.error(`\n❌ public/ fait ${mo(total)} : maximum ${mo(MAX_TOTAL)}.`)
}
if (trop.length) {
  erreur = true
  console.error(`\n❌ Fichier(s) de plus de ${mo(MAX_FICHIER)} dans public/ :`)
  trop.forEach((f) => console.error(`  ${mo(f.taille).padStart(9)}  public/${f.chemin}`))
}
if (erreur) {
  console.error('\n→ Compresser le fichier, ou le mettre sur la branche « medias » (voir src/config/medias.js).')
  process.exit(1)
}
console.log('\n✅ public/ est dans les limites.')
