// =============================================================
//  /api/radio?article=Clavicle_fracture
//  Petit relais côté serveur (Vercel) pour le Service des urgences
//  du labo : trouve l'image principale de l'article Wikipédia,
//  vérifie sur Wikimedia Commons qu'elle est sous licence libre,
//  et renvoie { url, auteur, licence, page }. Résultat mis en cache.
// =============================================================
const ARTICLES = new Set(['Torus_fracture', 'Clavicle_fracture', 'Greenstick_fracture', 'Distal_radius_fracture', 'Ankle_fracture', 'Femoral_fracture'])
const UA = 'LaboDeSciences/1.0 (https://compta-manager-peach.vercel.app ; site pédagogique d’école primaire)'
const sansHtml = (h) => (h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA, Accept: 'application/json' } })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

async function infoFichier(hote, fichier) {
  const d = await json(
    `https://${hote}/w/api.php?action=query&titles=${encodeURIComponent('File:' + fichier)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&formatversion=2`
  )
  return d?.query?.pages?.[0]?.imageinfo?.[0] || null
}

export default async function handler(req, res) {
  const article = String(req.query.article || '')
  if (!ARTICLES.has(article)) return res.status(400).json({ erreur: 'article inconnu' })
  try {
    const resume = await json(`https://en.wikipedia.org/api/rest_v1/page/summary/${article}`)
    const source = resume.originalimage?.source || resume.thumbnail?.source
    if (!source) return res.status(404).json({ erreur: 'pas d’image' })
    const morceaux = source.split('/')
    const fichier = decodeURIComponent(source.includes('/thumb/') ? morceaux[morceaux.length - 2] : morceaux[morceaux.length - 1])
    const info = (await infoFichier('commons.wikimedia.org', fichier)) || (await infoFichier('en.wikipedia.org', fichier))
    const meta = info?.extmetadata || {}
    const licence = sansHtml(meta.LicenseShortName?.value)
    const libre = licence && !/fair use|non-free/i.test(licence) && meta.NonFree?.value !== 'true'
    if (!info || !libre) return res.status(404).json({ erreur: 'licence non libre', licence })
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400')
    return res.status(200).json({
      url: info.thumburl || info.url,
      auteur: sansHtml(meta.Artist?.value) || 'auteur inconnu',
      licence,
      page: info.descriptionurl,
      fichier,
    })
  } catch (e) {
    return res.status(502).json({ erreur: String(e.message || e) })
  }
}
