import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Contrast, HeartPulse, Lightbulb, RotateCcw, Search, Siren } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat } from '../../components/labo/CadreJeu.jsx'

// =============================================================
//  A10 · Service des urgences
//  De VRAIES radiographies : l'image principale de l'article
//  Wikipédia de chaque fracture, chargée en direct, avec son
//  auteur et sa licence lus sur Wikimedia Commons. Une image sans
//  licence libre vérifiée n'est jamais affichée (le patient est sauté).
//  Parcours : dossier → zone à radiographier → négatoscope
//  (inverser, contraste, loupe, indices) → diagnostic → soins.
//  Attendus 112, 115.
// =============================================================
const ZONES = ['Épaule', 'Bras', 'Coude', 'Avant-bras et poignet', 'Hanche et cuisse', 'Genou', 'Jambe et cheville']
const OS_CHOIX = ['Clavicule', 'Humérus', 'Radius', 'Cubitus', 'Fémur', 'Tibia', 'Péroné']
const TYPES = ['En motte de beurre', 'En bois vert', 'Complète']

const PATIENTS = [
  {
    article: 'Torus_fracture',
    nom: 'Léo, 11 ans',
    motif: 'Chute de trottinette',
    recit: '« J’ai voulu me rattraper avec la main tendue. Mon poignet est gonflé et j’ai mal quand je le tourne. »',
    douleur: 6, pouls: 96,
    zone: 'Avant-bras et poignet', os: 'Radius', type: 'En motte de beurre',
    indices: ['Regarde l’os de l’avant-bras situé du côté du pouce.', 'Près du poignet, le bord de l’os fait un petit bourrelet.', 'L’os n’est pas cassé en deux : il s’est tassé, comme une motte de beurre écrasée.'],
    soins: { bon: 'Attelle', choix: ['Attelle', 'Opération', 'Rien du tout'] },
    apres: 'Chez l’enfant, les os sont plus souples : ils se tassent au lieu de casser net. Avec une attelle, l’os se répare en quelques semaines.',
  },
  {
    article: 'Clavicle_fracture',
    nom: 'Inès, 9 ans',
    motif: 'Chute de vélo sur l’épaule',
    recit: '« Je suis tombée sur le côté. J’ai très mal en haut de la poitrine, près du cou, et je n’arrive plus à lever le bras. »',
    douleur: 7, pouls: 102,
    zone: 'Épaule', os: 'Clavicule', type: 'Complète',
    indices: ['Regarde l’os horizontal qui va du sternum à l’épaule.', 'Suis cet os : à un endroit, il n’est plus continu.', 'Les deux morceaux sont séparés : la fracture est complète.'],
    soins: { bon: 'Écharpe', choix: ['Écharpe', 'Plâtre de la jambe', 'Béquilles'] },
    apres: 'La clavicule relie le bras au tronc. Bras soutenu par une écharpe, elle se ressoude le plus souvent toute seule.',
  },
  {
    article: 'Greenstick_fracture',
    nom: 'Noah, 10 ans',
    motif: 'Chute d’une cabane dans un arbre',
    recit: '« Mon avant-bras est un peu tordu et j’ai super mal, mais je peux encore bouger les doigts. »',
    douleur: 8, pouls: 108,
    zone: 'Avant-bras et poignet', os: 'Radius', type: 'En bois vert',
    indices: ['Les deux os de l’avant-bras sont à examiner.', 'L’os est plié, d’un côté seulement fendu, comme une branche verte.', 'Une branche verte plie et se fend sans se casser en deux : fracture en bois vert.'],
    soins: { bon: 'Plâtre', choix: ['Plâtre', 'Pansement', 'Rien du tout'] },
    apres: 'Fracture typique des enfants. Le médecin redresse l’os si besoin, puis un plâtre le maintient le temps qu’il se répare.',
  },
  {
    article: 'Distal_radius_fracture',
    nom: 'Josée, 74 ans',
    motif: 'Glissade sur le verglas',
    recit: '« Je suis tombée en arrière sur la main. Mon poignet a une drôle de forme. »',
    douleur: 8, pouls: 88,
    zone: 'Avant-bras et poignet', os: 'Radius', type: 'Complète',
    indices: ['Encore une chute sur la main tendue : quel os de l’avant-bras casse le plus souvent ?', 'Regarde le bout du radius, juste avant le poignet.', 'Chez les personnes âgées, les os sont plus fragiles : ils cassent net.'],
    soins: { bon: 'Plâtre', choix: ['Plâtre', 'Écharpe seule', 'Rien du tout'] },
    apres: 'Avec l’âge, les os deviennent plus fragiles. Si les morceaux sont bien en place, un plâtre suffit ; sinon, on opère.',
  },
  {
    article: 'Ankle_fracture',
    nom: 'Tom, 12 ans',
    motif: 'Cheville tordue au football',
    recit: '« Mon pied s’est retourné sous moi. La cheville a gonflé tout de suite et je ne peux plus poser le pied. »',
    douleur: 7, pouls: 98,
    zone: 'Jambe et cheville', os: 'Péroné', type: 'Complète',
    indices: ['Deux os de la jambe arrivent à la cheville.', 'Regarde l’os le plus fin, à l’extérieur de la jambe.', 'La bosse externe de la cheville est le bout du péroné : c’est lui qui a cédé.'],
    soins: { bon: 'Plâtre', choix: ['Plâtre', 'Écharpe', 'Rien du tout'] },
    apres: 'La cheville est l’articulation entre la jambe et le pied. Une botte plâtrée ou une attelle la maintient le temps que l’os se répare.',
  },
  {
    article: 'Femoral_fracture',
    nom: 'Samuel, 15 ans',
    motif: 'Grosse chute à ski',
    recit: '« Je suis tombé à pleine vitesse. Ma cuisse me fait horriblement mal, je ne peux pas bouger la jambe. »',
    douleur: 9, pouls: 118,
    zone: 'Hanche et cuisse', os: 'Fémur', type: 'Complète',
    indices: ['L’os le plus long du corps humain est en cause.', 'Il faut une énorme force pour casser cet os.', 'L’os de la cuisse est cassé en deux : fracture complète du fémur.'],
    soins: { bon: 'Opération', choix: ['Opération', 'Écharpe', 'Pansement'] },
    apres: 'Le fémur soutient tout le poids du corps. Le chirurgien place souvent une tige de métal à l’intérieur pour le maintenir pendant qu’il se répare.',
  },
]

const sansHtml = (h) => (h || '').replace(/<[^>]*>/g, '').trim()

// Vraie radio : demandée au relais du site (/api/radio), qui interroge
// Wikipédia et Wikimedia Commons et vérifie la licence libre.
// En secours, le navigateur fait la même chose lui-même.
async function chargerRadio(article) {
  let relais = ''
  try {
    const r = await fetch(`/api/radio?article=${article}`)
    if (r.ok) return await r.json()
    relais = `relais ${r.status} ${(await r.text()).slice(0, 120)}`
  } catch (e) {
    relais = `relais injoignable (${e?.message || e})`
  }
  let r
  try {
    r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${article}`)
  } catch (e) {
    throw new Error(`${relais} · Wikipédia injoignable (${e?.message || e})`)
  }
  if (!r.ok) throw new Error(`${relais} · Wikipédia ${r.status}`)
  const resume = await r.json()
  const source = resume.originalimage?.source || resume.thumbnail?.source
  if (!source) throw new Error('image')
  const morceaux = source.split('/')
  const fichier = decodeURIComponent(source.includes('/thumb/') ? morceaux[morceaux.length - 2] : morceaux[morceaux.length - 1])
  const c = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fichier)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&formatversion=2&origin=*`
  )
  const info = (await c.json())?.query?.pages?.[0]?.imageinfo?.[0]
  const meta = info?.extmetadata
  const licence = sansHtml(meta?.LicenseShortName?.value)
  if (!info || !licence || /fair use|non-free/i.test(licence)) throw new Error('licence')
  return { url: info.thumburl || info.url, auteur: sansHtml(meta?.Artist?.value) || 'auteur inconnu', licence, page: info.descriptionurl }
}

export default function UrgencesView() {
  const [radios, setRadios] = useState({})
  const [index, setIndex] = useState(0)
  const [etape, setEtape] = useState('dossier') // dossier | radio | diagnostic | soins | bilan
  const [points, setPoints] = useState(100)
  const [total, setTotal] = useState(0)
  const [indices, setIndices] = useState(0)
  const [message, setMessage] = useState('')
  const [osChoisi, setOsChoisi] = useState(null)
  const [typeChoisi, setTypeChoisi] = useState(null)
  const [soin, setSoin] = useState(null)
  const [inverse, setInverse] = useState(false)
  const [contraste, setContraste] = useState(1)
  const [loupe, setLoupe] = useState(null)
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })
  const imageRef = useRef(null)
  const erreurs = useRef({})

  useEffect(() => {
    PATIENTS.forEach((p) => {
      chargerRadio(p.article)
        .then((r) => setRadios((x) => ({ ...x, [p.article]: r })))
        .catch((e) => {
          erreurs.current[p.article] = String(e?.message || e)
          setRadios((x) => ({ ...x, [p.article]: false }))
        })
    })
  }, [])

  const disponibles = useMemo(() => PATIENTS.filter((p) => radios[p.article] !== false), [radios])
  const charges = Object.keys(radios).length === PATIENTS.length
  const patient = disponibles[index]
  const radio = patient ? radios[patient.article] : null

  function reinitPatient() {
    setEtape('dossier')
    setPoints(100)
    setIndices(0)
    setMessage('')
    setOsChoisi(null)
    setTypeChoisi(null)
    setSoin(null)
    setInverse(false)
    setContraste(1)
    setLoupe(null)
  }

  function choisirZone(z) {
    if (z === patient.zone) {
      setMessage('')
      setEtape('radio')
    } else {
      setPoints((p) => Math.max(0, p - 10))
      setMessage('Le chef de service : « Relis le dossier, la douleur n’est pas là. » (−10)')
    }
  }

  function demanderIndice() {
    if (indices >= 3) return
    setPoints((p) => Math.max(0, p - [10, 20, 30][indices]))
    setIndices((i) => i + 1)
  }

  function validerDiagnostic() {
    let p = points
    if (osChoisi !== patient.os) p -= 25
    if (typeChoisi !== patient.type) p -= 15
    setPoints(Math.max(0, p))
    setEtape('soins')
    if (osChoisi === patient.os && typeChoisi === patient.type) setEclat((x) => ({ message: 'Diagnostic exact !', sous: `${patient.os} · fracture ${patient.type.toLowerCase()}`, cle: x.cle + 1 }))
  }

  function choisirSoin(s) {
    if (soin) return
    setSoin(s)
    const final = Math.max(0, points - (s === patient.soins.bon ? 0 : 20))
    setPoints(final)
    setTotal((t) => t + final)
  }

  function suivant() {
    reinitPatient()
    setIndex((i) => i + 1)
  }

  const grade = total >= 450 ? 'Chef de clinique' : total >= 300 ? 'Médecin urgentiste' : total >= 150 ? 'Interne' : 'Stagiaire'

  if (!charges) {
    return (
      <CadreJeu code="A10" titre="Service des urgences" attendus={[112, 115]} couleur="#FF6B7A">
        <Carte couleur="rgba(255,107,122,.45)" className="text-center">
          <Siren className="mx-auto animate-pulse text-[#FF6B7A]" size={40} />
          <p className="mt-2 text-[#E8ECFF]">Le service des urgences ouvre : on sort les radios des archives…</p>
        </Carte>
      </CadreJeu>
    )
  }

  if (!patient) {
    return (
      <CadreJeu code="A10" titre="Service des urgences" attendus={[112, 115]} couleur="#FF6B7A">
        <Carte couleur="rgba(255,107,122,.45)" className="text-center">
          {disponibles.length === 0 ? (
            <>
              <p className="text-[#E8ECFF]">Les radios n’ont pas pu être chargées. Fais une capture de cet écran pour Claude :</p>
              <ul className="mt-3 space-y-1 text-left text-[11px] text-[#B9C1E3]">
                {Object.entries(erreurs.current).map(([a, e]) => (
                  <li key={a}>
                    <span className="text-[#FF9AA5]">{a}</span> : {e}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="labo-mono text-[11px] text-[#FF6B7A]">FIN DE LA GARDE</p>
              <p className="labo-titre mt-1 text-3xl font-black text-white">{total} points</p>
              <p className="mt-1 text-lg font-bold text-[#FFD27A]">Grade : {grade}</p>
              <p className="mt-2 text-sm text-[#B9C1E3]">{disponibles.length} patients soignés. Le squelette soutient et protège… mais un os cassé sait se réparer tout seul !</p>
              <Bouton className="mx-auto mt-4" couleur="#FF6B7A" onClick={() => { setIndex(0); setTotal(0); reinitPatient() }}>
                <RotateCcw size={18} /> Nouvelle garde
              </Bouton>
            </>
          )}
        </Carte>
      </CadreJeu>
    )
  }

  const progressionEtapes = ['dossier', 'radio', 'diagnostic', 'soins']

  return (
    <CadreJeu
      code="A10"
      titre="Service des urgences"
      attendus={[112, 115]}
      couleur="#FF6B7A"
      droite={
        <div className="text-right">
          <p className="labo-mono text-lg text-[#9DFF8A]">{points}</p>
          <p className="text-[10px] text-[#8A93B8]">points</p>
        </div>
      }
    >
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur="#FF6B7A" />
      <div className="flex gap-1.5">
        {progressionEtapes.map((e, i) => (
          <div key={e} className="h-1.5 flex-1 rounded-full" style={{ background: i <= progressionEtapes.indexOf(etape) ? '#6FEFFF' : 'rgba(232,236,255,.15)' }} />
        ))}
      </div>

      <Carte couleur="rgba(111,239,255,.35)">
        <div className="flex items-center justify-between">
          <span className="labo-mono text-[11px] text-[#6FEFFF]">
            PATIENT {index + 1} / {disponibles.length}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#FF9AA5]">
            <HeartPulse size={14} /> {patient.pouls} · douleur {patient.douleur}/10
          </span>
        </div>
        <p className="labo-titre mt-1 text-xl font-bold text-white">{patient.nom}</p>
        <p className="text-sm text-[#B9C1E3]">{patient.motif}</p>
        {etape === 'dossier' && <p className="mt-2 text-[15px] leading-relaxed text-[#DDE2F7]">{patient.recit}</p>}
      </Carte>

      {etape === 'dossier' && (
        <>
          <p className="labo-titre text-[15px] font-medium text-white">Quelle zone faut-il radiographier ?</p>
          <div className="grid grid-cols-2 gap-2">
            {ZONES.map((z) => (
              <Bouton key={z} variante="secondaire" className="text-sm" onClick={() => choisirZone(z)}>
                {z}
              </Bouton>
            ))}
          </div>
          {message && <p className="rounded-2xl bg-[#FF6B7A]/15 p-3 text-sm text-[#FFD0D5]">{message}</p>}
        </>
      )}

      {etape !== 'dossier' && radio && (
        <div className="rounded-3xl bg-[#DDF6FF] p-2">
          <div
            className="relative overflow-hidden rounded-2xl bg-black"
            onClick={(e) => {
              if (etape !== 'radio' && etape !== 'diagnostic') return
              const r = e.currentTarget.getBoundingClientRect()
              setLoupe((l) => (l ? null : { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }))
            }}
          >
            <img
              ref={imageRef}
              src={radio.url}
              alt={`Radiographie réelle : ${patient.motif}`}
              className="mx-auto max-h-[52vh] w-full object-contain transition-transform duration-300"
              style={{
                filter: `${inverse ? 'invert(1) ' : ''}contrast(${contraste})`,
                transform: loupe ? 'scale(2.6)' : 'none',
                transformOrigin: loupe ? `${loupe.x}% ${loupe.y}%` : 'center',
              }}
            />
            <span className="labo-scan opacity-50" style={{ background: '#B8F7FF' }} />
          </div>
          <p className="px-1 pt-1.5 text-[10px] leading-snug text-[#20313B]">
            Vraie radiographie · {radio.auteur} · {radio.licence} ·{' '}
            <a href={radio.page} target="_blank" rel="noreferrer" className="underline">
              Wikimedia Commons
            </a>
          </p>
        </div>
      )}

      {etape === 'radio' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Bouton variante="secondaire" onClick={() => setInverse((v) => !v)}>
              <Contrast size={18} /> Inverser
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setLoupe((l) => (l ? null : { x: 50, y: 50 }))}>
              <Search size={18} /> {loupe ? 'Dézoomer' : 'Loupe'}
            </Bouton>
          </div>
          <label className="block text-xs text-[#8A93B8]">
            Contraste
            <input type="range" min="0.6" max="2.2" step="0.05" value={contraste} onChange={(e) => setContraste(Number(e.target.value))} className="mt-1 w-full accent-[#6FEFFF]" />
          </label>
          <p className="text-center text-xs text-[#8A93B8]">Astuce : touche la radio pour zoomer à cet endroit.</p>
          <Carte couleur="rgba(255,210,122,.4)">
            <div className="flex items-center justify-between">
              <span className="labo-mono text-[11px] text-[#FFD27A]">INDICES DU CHEF DE SERVICE</span>
              <span className="text-xs text-[#8A93B8]">{indices} / 3</span>
            </div>
            {patient.indices.slice(0, indices).map((t) => (
              <p key={t} className="mt-1.5 flex gap-2 text-sm text-[#FFE6B0]">
                <Lightbulb size={16} className="mt-0.5 flex-none" /> {t}
              </p>
            ))}
            {indices < 3 && (
              <button type="button" onClick={demanderIndice} className="mt-2 h-11 w-full rounded-xl border border-dashed border-[#FFD27A]/60 text-sm text-[#FFD27A]">
                Indice {indices + 1} · −{[10, 20, 30][indices]} points
              </button>
            )}
          </Carte>
          <Bouton couleur="#6FEFFF" onClick={() => setEtape('diagnostic')}>
            Poser mon diagnostic <ArrowRight size={18} />
          </Bouton>
        </>
      )}

      {etape === 'diagnostic' && (
        <>
          <p className="labo-titre text-[15px] font-medium text-white">Quel os est cassé ?</p>
          <div className="flex flex-wrap gap-2">
            {OS_CHOIX.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOsChoisi(o)}
                className="h-11 rounded-xl border-2 px-3 text-sm font-bold"
                style={{ borderColor: osChoisi === o ? '#6FEFFF' : 'rgba(232,236,255,.18)', background: osChoisi === o ? 'rgba(111,239,255,.14)' : 'rgba(18,26,48,.85)' }}
              >
                {o}
              </button>
            ))}
          </div>
          <p className="labo-titre text-[15px] font-medium text-white">Quel type de fracture ?</p>
          <div className="grid gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeChoisi(t)}
                className="h-12 rounded-xl border-2 px-3 text-left text-sm font-bold"
                style={{ borderColor: typeChoisi === t ? '#6FEFFF' : 'rgba(232,236,255,.18)', background: typeChoisi === t ? 'rgba(111,239,255,.14)' : 'rgba(18,26,48,.85)' }}
              >
                {t}
                <span className="ml-2 font-normal text-[#8A93B8]">
                  {t === 'En motte de beurre' ? '· l’os s’est tassé' : t === 'En bois vert' ? '· plié et fendu d’un côté' : '· cassé de part en part'}
                </span>
              </button>
            ))}
          </div>
          <Bouton couleur="#6FEFFF" onClick={validerDiagnostic} disabled={!osChoisi || !typeChoisi}>
            Valider le diagnostic
          </Bouton>
        </>
      )}

      {etape === 'soins' && (
        <>
          <Carte couleur={osChoisi === patient.os && typeChoisi === patient.type ? 'rgba(157,255,138,.45)' : 'rgba(255,138,149,.45)'}>
            <p className="text-[15px] text-[#E8ECFF]">
              Diagnostic du chef : <strong>{patient.os}</strong>, fracture <strong>{patient.type.toLowerCase()}</strong>.
            </p>
          </Carte>
          <p className="labo-titre text-[15px] font-medium text-white">Quel soin pour {patient.nom.split(',')[0]} ?</p>
          <div className="grid gap-2">
            {patient.soins.choix.map((s) => (
              <button
                key={s}
                type="button"
                disabled={!!soin}
                onClick={() => choisirSoin(s)}
                className="h-12 rounded-xl border-2 px-3 text-left text-[15px] font-bold"
                style={{
                  borderColor: !soin ? 'rgba(232,236,255,.18)' : s === patient.soins.bon ? '#9DFF8A' : soin === s ? '#FF8A95' : 'rgba(232,236,255,.1)',
                  background: 'rgba(18,26,48,.85)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {soin && (
            <Carte couleur="rgba(157,255,138,.4)">
              <p className="text-[15px] leading-relaxed text-[#E8ECFF]">{patient.apres}</p>
              <p className="mt-2 text-sm text-[#B9C1E3]">
                Comment l’os se répare : autour de la cassure, il fabrique du nouvel os (le « cal osseux ») qui ressoude les morceaux. Le plâtre ou l’attelle garde les morceaux bien en place pendant ce temps.
              </p>
              <Bouton className="mt-3 w-full" couleur="#FF6B7A" onClick={suivant}>
                Patient suivant <ArrowRight size={18} />
              </Bouton>
            </Carte>
          )}
        </>
      )}
    </CadreJeu>
  )
}
