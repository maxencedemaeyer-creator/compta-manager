// =============================================================
//  Fabrique l'icône et le manifeste de chaque appli installable
//  (liste : src/config/installables.js) dans public/icons/<id>/.
//
//  L'icône reprend exactement le bouton de l'appli dans le lanceur :
//  même pictogramme (lucide), même dégradé (classes « from-… to-… »
//  de src/config/apps.js), pictogramme blanc à 54 % du carré.
//
//  Lancer :  npx vite-node scripts/icones/generer-icones-applis.mjs
//  (nécessite `rsvg-convert`, présent dans l'environnement de travail)
// =============================================================
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import colors from 'tailwindcss/colors.js'
import { APPS } from '../../src/config/apps.js'
import { INSTALLABLES } from '../../src/config/installables.js'

const RACINE = new URL('../../public/icons/', import.meta.url).pathname

// « emerald-400 » → '#34d399'
function couleurTailwind(nom) {
  const [famille, nuance] = nom.split('-')
  const hex = colors[famille]?.[nuance]
  if (!hex) throw new Error(`Couleur Tailwind inconnue : ${nom}`)
  return hex
}

// « from-emerald-400 to-teal-600 » ou « from-pink-300 via-pink-400 to-rose-500 »
function degrade(classes) {
  const prises = {}
  for (const m of classes.matchAll(/\b(from|via|to)-([a-z]+-\d+)\b/g)) prises[m[1]] = couleurTailwind(m[2])
  if (!prises.from || !prises.to) throw new Error(`Dégradé illisible : ${classes}`)
  return [prises.from, prises.via, prises.to].filter(Boolean)
}

// Le pictogramme lucide sous forme de balises SVG (sans l'enveloppe <svg>)
function glyphe(Icone) {
  const svg = renderToStaticMarkup(createElement(Icone, { size: 24, strokeWidth: 2 }))
  const dedans = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  if (!dedans) throw new Error('Pictogramme vide')
  return dedans
}

function svgIcone({ couleurs, dedans, rayon }) {
  const arrets = couleurs
    .map((c, i) => `<stop offset="${couleurs.length === 1 ? 0 : i / (couleurs.length - 1)}" stop-color="${c}"/>`)
    .join('')
  const taille = 512 * 0.54
  const echelle = taille / 24
  const decalage = (512 - taille) / 2
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">` +
    `<defs><linearGradient id="fond" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="512" y2="512">${arrets}</linearGradient></defs>` +
    `<rect width="512" height="512"${rayon ? ` rx="${rayon}"` : ''} fill="url(#fond)"/>` +
    `<g transform="translate(${decalage} ${decalage}) scale(${echelle})" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${dedans}</g>` +
    `</svg>`
  )
}

function png(svg, sortie, taille) {
  execFileSync('rsvg-convert', ['-w', String(taille), '-h', String(taille), '-o', sortie], { input: svg })
}

for (const entree of INSTALLABLES) {
  const app = APPS.find((a) => a.id === entree.app)
  if (!app) throw new Error(`Appli « ${entree.app} » introuvable dans src/config/apps.js`)

  const dossier = join(RACINE, entree.id)
  mkdirSync(dossier, { recursive: true })

  const modele = { couleurs: degrade(app.couleur), dedans: glyphe(app.icon) }
  const carre = svgIcone({ ...modele, rayon: 0 }) // carré plein : le système arrondit lui-même
  const arrondi = svgIcone({ ...modele, rayon: 128 }) // pour l'onglet du navigateur

  writeFileSync(join(dossier, 'favicon.svg'), arrondi)
  png(arrondi, join(dossier, 'favicon-32.png'), 32)
  png(carre, join(dossier, 'icon-192.png'), 192)
  png(carre, join(dossier, 'icon-512.png'), 512)
  png(carre, join(dossier, 'apple-touch-icon.png'), 180)

  const manifeste = {
    id: entree.chemin,
    name: entree.nom,
    short_name: entree.nom,
    description: app.description,
    lang: 'fr',
    orientation: 'any',
    start_url: entree.chemin,
    scope: entree.chemin,
    display: 'standalone',
    background_color: entree.theme,
    theme_color: entree.theme,
    icons: [
      { src: `/icons/${entree.id}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `/icons/${entree.id}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `/icons/${entree.id}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  writeFileSync(join(dossier, 'site.webmanifest'), JSON.stringify(manifeste, null, 2) + '\n')
  console.log(`✓ ${entree.id}  ${entree.chemin}`)
}
