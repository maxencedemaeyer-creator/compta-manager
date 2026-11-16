import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw, Scissors } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat } from '../../components/labo/CadreJeu.jsx'

// =============================================================
//  A8 · Le scalpel
//  Dissection virtuelle couche par couche (schéma d'un bras, de
//  profil) : on « découpe » la peau du doigt, puis les muscles,
//  jusqu'aux os. Ensuite : l'aile de poulet, pour préparer (ou
//  revoir) la vraie dissection en classe.
//  Attendus 119, 120.
// =============================================================
const W = 360
const H = 500

const OS = `
  <line x1="180" y1="48" x2="180" y2="246" stroke="#EDE6D1" stroke-width="20" stroke-linecap="round"/>
  <circle cx="180" cy="48" r="17" fill="#EDE6D1"/>
  <line x1="172" y1="262" x2="170" y2="430" stroke="#EDE6D1" stroke-width="10" stroke-linecap="round"/>
  <line x1="190" y1="258" x2="192" y2="432" stroke="#D9D0B6" stroke-width="10" stroke-linecap="round"/>
  <circle cx="181" cy="252" r="13" fill="#E9F6FF" opacity=".8"/>
  <g stroke="#EDE6D1" stroke-width="5" stroke-linecap="round">
    <line x1="170" y1="446" x2="160" y2="485"/><line x1="178" y1="447" x2="176" y2="492"/>
    <line x1="186" y1="447" x2="190" y2="490"/><line x1="193" y1="445" x2="203" y2="482"/>
  </g>`

const fibres = (x1, y1, x2, y2, n) =>
  Array.from({ length: n }, (_, i) => {
    const k = (i - n / 2) * 4
    return `<line x1="${x1 + k}" y1="${y1}" x2="${x2 + k * 0.6}" y2="${y2}" stroke="#7D1F2B" stroke-width="1" opacity=".5"/>`
  }).join('')

const MUSCLES = `
  <path d="M199 92 Q232 170 200 262 Q188 175 199 92 Z" fill="#C8434F"/>${fibres(205, 110, 203, 245, 5)}
  <line x1="196" y1="40" x2="199" y2="95" stroke="#F4F6FF" stroke-width="5" stroke-linecap="round"/>
  <line x1="200" y1="258" x2="196" y2="285" stroke="#F4F6FF" stroke-width="6" stroke-linecap="round"/>
  <path d="M162 70 Q126 165 160 250 Q170 165 162 70 Z" fill="#B23A47"/>${fibres(155, 90, 156, 235, 5)}
  <line x1="160" y1="248" x2="166" y2="262" stroke="#F4F6FF" stroke-width="7" stroke-linecap="round"/>
  <path d="M190 290 Q212 350 194 420 Q184 350 190 290 Z" fill="#C8434F"/>
  <path d="M168 290 Q148 350 166 420 Q176 350 168 290 Z" fill="#B23A47"/>
  <g stroke="#F4F6FF" stroke-width="3" stroke-linecap="round"><line x1="194" y1="418" x2="192" y2="446"/><line x1="166" y1="418" x2="170" y2="446"/></g>`

const PEAU = `
  <path d="M150 30 Q180 10 214 30 Q236 150 222 262 Q218 350 214 440 Q216 470 205 495 L152 495 Q144 470 146 440 Q140 350 138 262 Q124 150 150 30 Z" fill="#E7B595"/>
  <path d="M150 30 Q140 150 146 262 Q150 350 152 440" fill="none" stroke="#C98E6E" stroke-width="6" opacity=".5"/>
  <path d="M210 40 Q226 150 216 262" fill="none" stroke="#F6D2BC" stroke-width="5" opacity=".7"/>`

const svg = (contenu, fond = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}">${fond}${contenu}</svg>`
const versImage = (s) =>
  new Promise((ok) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`
  })

const COUCHES = [
  { id: 'peau', nom: 'la peau', apres: 'Sous la peau : les muscles, rouges, faits de longues fibres. Remarque leurs extrémités blanches et brillantes : les tendons.' },
  { id: 'muscles', nom: 'les muscles', apres: 'Voici les os ! Chaque muscle était accroché par ses tendons à deux os différents, de part et d’autre du coude.' },
]

const QUESTIONS = [
  { q: 'Les parties blanches et brillantes au bout des muscles sont…', r: ['les tendons', 'les nerfs', 'des os'], bon: 0 },
  { q: 'Le muscle de devant (biceps) est attaché…', r: ['à l’humérus seulement', 'à deux os différents', 'à la peau'], bon: 1 },
  { q: 'Entre l’humérus et les os de l’avant-bras, on trouve…', r: ['un muscle', 'une articulation : le coude', 'un tendon'], bon: 1 },
]

export default function DissectionView() {
  const haut = useRef(null)
  const milieu = useRef(null)
  const [couche, setCouche] = useState(0)
  const [pourcent, setPourcent] = useState(0)
  const [question, setQuestion] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })
  const [partie, setPartie] = useState(0)
  const dessine = useRef(false)
  const dernierPoint = useRef(null)

  useEffect(() => {
    let annule = false
    ;(async () => {
      const [imgMuscles, imgPeau] = await Promise.all([versImage(svg(MUSCLES)), versImage(svg(PEAU))])
      if (annule) return
      for (const [ref, img] of [[milieu, imgMuscles], [haut, imgPeau]]) {
        const c = ref.current
        c.width = W * 2
        c.height = H * 2
        const ctx = c.getContext('2d')
        ctx.globalCompositeOperation = 'source-over'
        ctx.clearRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0, c.width, c.height)
      }
      setCouche(0)
      setPourcent(0)
    })()
    return () => {
      annule = true
    }
  }, [partie])

  const actif = couche === 0 ? haut : milieu

  function couper(e) {
    if (couche > 1) return
    const c = actif.current
    const rect = c.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * c.width
    const y = ((e.clientY - rect.top) / rect.height) * c.height
    const ctx = c.getContext('2d')
    ctx.globalCompositeOperation = 'destination-out'
    // Trait continu depuis le point précédent (pas de trous si le doigt va vite)
    const avant = dernierPoint.current && e.type !== 'pointerdown' ? dernierPoint.current : { x, y }
    ctx.lineCap = 'round'
    ctx.lineWidth = 76
    ctx.beginPath()
    ctx.moveTo(avant.x, avant.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    dernierPoint.current = { x, y }
  }

  function mesurer() {
    const c = actif.current
    const ctx = c.getContext('2d')
    const { data } = ctx.getImageData(0, 0, c.width, c.height)
    let plein = 0
    let total = 0
    for (let i = 3; i < data.length; i += 4 * 97) {
      total++
      if (data[i] > 20) plein++
    }
    // Part de la couche qui reste (la forme n'occupe pas tout le cadre)
    return plein / total
  }

  const reference = useRef({ 0: null, 1: null })
  function finTrait() {
    dessine.current = false
    if (couche > 1) return
    if (reference.current[couche] === null) reference.current[couche] = 1
    const reste = mesurer()
    if (!reference.current.base) reference.current.base = {}
    if (!reference.current.base[couche]) reference.current.base[couche] = reste + 0.0001
    const p = Math.max(0, Math.min(1, 1 - reste / reference.current.base[couche]))
    setPourcent(p)
  }

  // La première mesure (avant toute coupe) sert de référence
  useEffect(() => {
    reference.current = { base: {} }
    const t = setTimeout(() => {
      if (haut.current) reference.current.base[0] = mesurer() + 0.0001
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partie])

  function couchesuivante() {
    const c = actif.current
    c.style.transition = 'opacity .6s'
    c.style.opacity = '0'
    setEclat((x) => ({ message: `Tu as retiré ${COUCHES[couche].nom} !`, sous: COUCHES[couche].apres, cle: x.cle + 1 }))
    const prochaine = couche + 1
    setCouche(prochaine)
    setPourcent(0)
    if (prochaine === 1 && milieu.current) reference.current.base[1] = null
  }

  useEffect(() => {
    if (couche === 1 && milieu.current) {
      const t = setTimeout(() => {
        reference.current.base[1] = mesurer() + 0.0001
      }, 50)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couche])

  function recommencer() {
    for (const r of [haut, milieu]) if (r.current) r.current.style.opacity = '1'
    setQuestion(0)
    setReponse(null)
    setPartie((p) => p + 1)
  }

  const q = QUESTIONS[question]

  return (
    <CadreJeu code="A8" titre="Le scalpel" attendus={[119, 120]} couleur="#FF8A95">
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur="#FF8A95" />
      <Carte couleur="rgba(255,138,149,.45)">
        <p className="labo-mono text-[11px] text-[#FF8A95]">
          {couche < 2 ? `COUCHE ${couche + 1} / 2 · ${COUCHES[couche].nom.toUpperCase()}` : 'DISSECTION TERMINÉE'}
        </p>
        <p className="mt-1 text-[15px] text-[#E8ECFF]">
          {couche < 2 ? (
            <>
              <Scissors size={16} className="mr-1 inline text-[#FF8A95]" />
              Passe ton doigt sur le bras pour retirer {COUCHES[couche].nom}.
            </>
          ) : (
            'Os, articulation, muscles, tendons : tu as vu tout ce qui permet au bras de bouger.'
          )}
        </p>
        {couche < 2 && (
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#FF8A95]" style={{ width: `${Math.round(pourcent * 100)}%` }} />
            </div>
            {pourcent > 0.55 && (
              <button type="button" onClick={couchesuivante} className="rounded-xl bg-[#FF8A95] px-3 py-2 text-sm font-bold text-[#2A070C]">
                Retirer
              </button>
            )}
          </div>
        )}
      </Carte>

      <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-3xl border border-white/10 bg-[#0B1224]" style={{ aspectRatio: `${W} / ${H}` }}>
        <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: svg(OS).replace(`width="${W * 2}" height="${H * 2}"`, 'width="100%" height="100%"') }} />
        <canvas ref={milieu} className="absolute inset-0 h-full w-full" />
        <canvas
          ref={haut}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ pointerEvents: couche === 0 ? 'auto' : 'none' }}
          onPointerDown={(e) => { dessine.current = true; couper(e) }}
          onPointerMove={(e) => dessine.current && couper(e)}
          onPointerUp={finTrait}
          onPointerLeave={() => dessine.current && finTrait()}
        />
        {couche === 1 && (
          <div
            className="absolute inset-0 touch-none"
            onPointerDown={(e) => { dessine.current = true; couper(e) }}
            onPointerMove={(e) => dessine.current && couper(e)}
            onPointerUp={finTrait}
            onPointerLeave={() => dessine.current && finTrait()}
          />
        )}
        {couche >= 2 && (
          <div className="pointer-events-none absolute inset-0 text-[11px] font-bold">
            <span className="absolute left-[56%] top-[22%] rounded bg-black/60 px-1.5 text-[#EDE6D1]">humérus</span>
            <span className="absolute left-[56%] top-[48%] rounded bg-black/60 px-1.5 text-[#FFD27A]">coude</span>
            <span className="absolute left-[58%] top-[68%] rounded bg-black/60 px-1.5 text-[#EDE6D1]">radius</span>
            <span className="absolute left-[18%] top-[68%] rounded bg-black/60 px-1.5 text-[#EDE6D1]">cubitus</span>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-[#8A93B8]">Schéma d’un bras droit vu de profil (devant à droite) : biceps devant, triceps derrière.</p>

      {couche >= 2 && question < QUESTIONS.length && (
        <Carte couleur="rgba(255,138,149,.45)">
          <p className="labo-mono text-[11px] text-[#FF8A95]">
            OBSERVATION {question + 1} / {QUESTIONS.length}
          </p>
          <p className="labo-titre mt-1 text-lg font-bold text-white">{q.q}</p>
          <div className="mt-2 grid gap-2">
            {q.r.map((r, i) => (
              <button
                key={r}
                type="button"
                disabled={reponse !== null}
                onClick={() => {
                  setReponse(i)
                  setTimeout(() => {
                    setReponse(null)
                    setQuestion((n) => n + 1)
                  }, 1300)
                }}
                className="min-h-[48px] rounded-2xl border-2 px-3 text-left text-[15px] font-bold"
                style={{
                  borderColor: reponse === null ? 'rgba(232,236,255,.18)' : i === q.bon ? '#9DFF8A' : reponse === i ? '#FF8A95' : 'rgba(232,236,255,.1)',
                  background: 'rgba(18,26,48,.85)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </Carte>
      )}

      {couche >= 2 && question >= QUESTIONS.length && (
        <Carte couleur="rgba(255,138,149,.45)">
          <p className="labo-mono text-[11px] text-[#FF8A95]">ET DANS UNE AILE DE POULET ?</p>
          <p className="mt-1 text-[15px] leading-relaxed text-[#E8ECFF]">
            L’aile d’un oiseau est construite comme ton bras : on y retrouve un humérus, puis un radius et un cubitus, des muscles, et des tendons blancs et brillants qui les accrochent aux os.
          </p>
          <svg viewBox="0 0 320 120" className="mt-3 w-full" role="img" aria-label="Os de l’aile de poulet : humérus, radius, cubitus">
            <line x1="20" y1="60" x2="130" y2="40" stroke="#EDE6D1" strokeWidth="11" strokeLinecap="round" />
            <line x1="138" y1="36" x2="250" y2="58" stroke="#EDE6D1" strokeWidth="5" strokeLinecap="round" />
            <line x1="138" y1="46" x2="250" y2="66" stroke="#D9D0B6" strokeWidth="7" strokeLinecap="round" />
            <line x1="256" y1="62" x2="305" y2="72" stroke="#EDE6D1" strokeWidth="5" strokeLinecap="round" />
            <circle cx="134" cy="40" r="8" fill="#070B16" stroke="#FFD27A" strokeWidth="3" />
            <text x="60" y="80" fontSize="12" fill="#B9C1E3">humérus</text>
            <text x="170" y="30" fontSize="12" fill="#B9C1E3">radius</text>
            <text x="170" y="90" fontSize="12" fill="#B9C1E3">cubitus</text>
            <text x="268" y="95" fontSize="12" fill="#B9C1E3">« main »</text>
          </svg>
          <p className="labo-mono mt-3 text-[11px] text-[#FF8A95]">LA VRAIE DISSECTION EN CLASSE</p>
          <ul className="mt-1 space-y-1.5 text-sm text-[#E8ECFF]">
            {[
              'Une aile de poulet crue du commerce, des gants, des ciseaux à bouts ronds, un plateau.',
              'Retirer la peau : observer les muscles (la viande) et leurs fibres.',
              'Tirer doucement sur un muscle : l’aile bouge ! Repérer ses tendons, blancs et brillants.',
              'Repérer l’articulation du « coude » : les os y sont recouverts de cartilage lisse.',
              'Se laver les mains au savon et nettoyer le matériel : la viande crue peut contenir des microbes.',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Check size={16} className="mt-0.5 flex-none text-[#9DFF8A]" />
                {t}
              </li>
            ))}
          </ul>
          <Bouton variante="secondaire" className="mt-3 w-full" onClick={recommencer}>
            <RotateCcw size={16} /> Recommencer la dissection
          </Bouton>
        </Carte>
      )}
    </CadreJeu>
  )
}
