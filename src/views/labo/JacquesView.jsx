import { useEffect, useRef, useState } from 'react'
import { Languages, Play, RotateCcw, ShieldCheck, Volume2 } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat, melanger } from '../../components/labo/CadreJeu.jsx'
import { COULEUR_GENRE, LANGUES, MOT, avecArticle, parler } from '../../components/labo/vocabulaire/corps.js'
import PlateauCorps from '../../components/labo/vocabulaire/PlateauCorps.jsx'
import { cadreDe, estJuste } from '../../components/labo/vocabulaire/zonesCorps.js'

// =============================================================
//  A12 · Jacques a dit ! (vocabulaire du corps, élèves allophones)
//  Jacques est un vrai squelette 3D (os de BodyParts3D). La tablette
//  DIT et ÉCRIT la consigne (« Touche ton nez ») : on touche la bonne
//  partie de Jacques. La caméra zoome sur la tête ou la main quand il
//  le faut, le mot se colle sur Jacques, et Jacques fait une petite
//  danse quand c'est juste. Niveau 3 : le vrai « Jacques a dit », avec
//  des pièges. Sans caméra : rien n'est enregistré ni envoyé.
// =============================================================
const CYAN = '#6FEFFF'
const TOURS = 10
const TOUS = ['tete', 'yeux', 'nez', 'bouche', 'oreille', 'cou', 'epaule', 'bras', 'coude', 'main', 'doigt', 'ventre', 'jambe', 'genou', 'pied']
const NIVEAUX = [
  { n: 1, titre: 'Ma tête', texte: 'tête, yeux, nez, bouche, oreille, cou, épaule', ids: ['tete', 'yeux', 'nez', 'bouche', 'oreille', 'cou', 'epaule'] },
  { n: 2, titre: 'Tout le corps', texte: '+ bras, coude, main, doigt, ventre, jambe, genou, pied', ids: TOUS },
  { n: 3, titre: 'Jacques a dit !', texte: 'Attention : sans « Jacques a dit », on ne touche pas !', ids: TOUS },
]

// Petites danses de Jacques quand la réponse est juste (angles en degrés)
const DANSES = [
  (o) => ({ epaule_d: { abd: 145 + 15 * o }, epaule_g: { abd: 145 - 15 * o }, coude_d: 12, coude_g: 12 }),
  (o) => ({ epaule_g: { abd: 150 }, coude_g: 35 + 35 * o, epaule_d: { abd: 8 } }),
  (o) => ({ hanche_d: Math.max(0, o) * 55, genou_d: Math.max(0, o) * 75, hanche_g: Math.max(0, -o) * 55, genou_g: Math.max(0, -o) * 75, epaule_d: { abd: 12 }, epaule_g: { abd: 12 } }),
  (o) => ({ epaule_d: { abd: 95 + 45 * o }, epaule_g: { abd: 95 - 45 * o }, coude_d: 25, coude_g: 25 }),
]

function tirage(ids) {
  const l = []
  while (l.length < TOURS) l.push(...melanger(ids))
  return l.slice(0, TOURS)
}

function nouvellePartie(niveau) {
  const n = NIVEAUX.find((x) => x.n === niveau)
  return { niveau, liste: tirage(n.ids), tour: 0, score: 0, collees: [], statut: 'consigne', erreurs: 0, indice: false, touche: null, piege: false, cible: null, depart: 0 }
}

function preparerTour(j, i) {
  const cible = j.liste[i]
  const piege = j.niveau === 3 && i > 0 && Math.random() < 0.3
  return { ...j, tour: i, cible, piege, statut: 'consigne', erreurs: 0, indice: false, touche: null, depart: Date.now() }
}

const texteConsigne = (j) => (j.niveau === 3 && !j.piege ? `Jacques a dit : ${MOT[j.cible].consigne.toLowerCase()}\u00A0!` : `${MOT[j.cible].consigne}\u00A0!`)

export default function JacquesView() {
  const [phase, setPhase] = useState('accueil')
  const [niveau, setNiveau] = useState(1)
  const [langue, setLangue] = useState('')
  const [j, setJ] = useState(null)
  const [eclat, setEclat] = useState({ message: '', sous: '', cle: 0 })
  const [t, setT] = useState(0)
  const jRef = useRef(null)
  jRef.current = j

  function demarrer() {
    const p = preparerTour(nouvellePartie(niveau), 0)
    setJ(p)
    setPhase('jeu')
    parler('C’est parti !')
  }

  // Dire la consigne au début de chaque tour
  const cleTour = j ? `${j.tour}-${j.cible}-${j.piege}` : ''
  useEffect(() => {
    if (!j || j.statut !== 'consigne') return
    const id = setTimeout(() => parler(texteConsigne(jRef.current)), 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleTour])

  // Minuteries : indice après 7 s, piège réussi si on ne bouge pas, passage au tour suivant
  const statut = j?.statut
  useEffect(() => {
    if (!j) return
    const ids = []
    if (statut === 'consigne') {
      if (!j.piege) ids.push(setTimeout(() => setJ((x) => (x && x.statut === 'consigne' ? { ...x, indice: true } : x)), 7000))
      else
        ids.push(
          setTimeout(() => {
            const x = jRef.current
            if (!x || x.statut !== 'consigne') return
            setJ({ ...x, statut: 'bravo', score: x.score + 2, touche: null })
            parler('Bien joué, tu n’as pas bougé !')
            setEclat((e) => ({ message: 'Bien joué !', sous: 'Jacques n’avait rien dit.', cle: e.cle + 1 }))
          }, 4500),
        )
    } else if (statut === 'bravo' || statut === 'rate') {
      ids.push(
        setTimeout(() => {
          const x = jRef.current
          if (!x) return
          if (x.tour + 1 >= TOURS) {
            setJ({ ...x, statut: 'fini' })
            parler('Fini ! Bravo !')
          } else setJ(preparerTour(x, x.tour + 1))
        }, 2200),
      )
    }
    return () => ids.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleTour, statut])

  // Danse de Jacques
  const danse = statut === 'bravo' ? DANSES[(j.tour || 0) % DANSES.length] : null
  useEffect(() => {
    if (!danse) return
    setT(0)
    const id = setInterval(() => setT((x) => x + 1), 150)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleTour, statut])
  const poses = danse ? danse(Math.sin(t * 0.8)) : null

  function toucher(id) {
    const x = jRef.current
    if (!x || x.statut !== 'consigne' || !id) return
    const ecoule = Date.now() - x.depart
    if (x.piege) {
      setJ({ ...x, statut: 'rate', touche: id })
      parler('Non ! Jacques n’a pas dit !')
      setEclat((e) => ({ message: 'Jacques n’a pas dit !', sous: 'Sans « Jacques a dit », on ne touche pas.', cle: e.cle + 1 }))
      return
    }
    if (estJuste(x.cible, id)) {
      setJ({ ...x, statut: 'bravo', score: x.score + (ecoule < 5000 ? 2 : 1), collees: x.collees.includes(x.cible) ? x.collees : [...x.collees, x.cible], touche: id })
      parler(`Bravo ! ${avecArticle(MOT[x.cible])}`)
      setEclat((e) => ({ message: 'Bravo !', sous: avecArticle(MOT[x.cible]), cle: e.cle + 1 }))
      return
    }
    // Mauvaise partie : on dit comment elle s'appelle (on apprend en explorant)
    setJ({ ...x, touche: id, erreurs: x.erreurs + 1, indice: x.indice || x.erreurs + 1 >= 2 })
    parler(avecArticle(MOT[id]))
  }

  // Le petit message « ça, c'est le nez » s'efface
  const toucheCle = j?.touche && j.statut === 'consigne' ? `${j.touche}-${j.erreurs}` : ''
  useEffect(() => {
    if (!toucheCle) return
    const id = setTimeout(() => setJ((x) => (x && x.statut === 'consigne' ? { ...x, touche: null } : x)), 1800)
    return () => clearTimeout(id)
  }, [toucheCle])

  useEffect(() => () => window.speechSynthesis?.cancel?.(), [])

  const fini = j?.statut === 'fini'
  const m = j && j.cible ? MOT[j.cible] : null
  const trad = langue && m?.tr[langue]
  const sensLangue = LANGUES.find((l) => l.id === langue)?.dir

  // Entourages sur le squelette
  const anneaux = []
  if (j && !fini) {
    if (j.statut === 'consigne' && j.indice && !j.piege) anneaux.push({ id: j.cible, couleur: '#FFE45E', tirets: true })
    if (j.touche && (j.statut === 'consigne' || j.statut === 'rate')) anneaux.push({ id: j.touche, couleur: '#FF8A98' })
  }

  return (
    <CadreJeu code="A12" titre="Jacques a dit !" couleur={CYAN} large>
      <Eclat message={eclat.message} sousTitre={eclat.sous} cle={eclat.cle} couleur={CYAN} />
      {phase === 'accueil' && (
        <>
          <Carte couleur={`${CYAN}66`}>
            <p className="text-[15px] leading-snug text-[#DDE2F7]">
              <b>Jacques</b> est un vrai squelette. La tablette <b>dit</b> et <b>écrit</b> une consigne : « Touche le nez ». Touche la bonne partie de Jacques : le mot se colle sur lui&nbsp;!
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#9DFF8A]">
              <ShieldCheck size={14} /> Pas de caméra : rien n’est filmé, rien n’est enregistré.
            </p>
          </Carte>
          <div className="grid gap-2 sm:grid-cols-3">
            {NIVEAUX.map((n) => (
              <button
                key={n.n}
                type="button"
                onClick={() => setNiveau(n.n)}
                className="rounded-2xl border-2 p-3 text-left"
                style={{ borderColor: niveau === n.n ? CYAN : 'rgba(255,255,255,.12)', background: niveau === n.n ? 'rgba(111,239,255,.1)' : 'rgba(18,26,48,.85)' }}
              >
                <p className="labo-mono text-[11px]" style={{ color: CYAN }}>
                  NIVEAU {n.n}
                </p>
                <p className="labo-titre text-base font-bold text-white">{n.titre}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-[#B9C1E3]">{n.texte}</p>
              </button>
            ))}
          </div>
          <Carte couleur="rgba(255,255,255,.15)">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#E8ECFF]">
              <Languages size={15} /> Aide dans ma langue
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {LANGUES.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLangue(l.id)}
                  className="min-h-[40px] rounded-full border px-3 text-[14px] font-bold"
                  style={langue === l.id ? { background: CYAN, color: '#04161A', borderColor: CYAN } : { borderColor: 'rgba(255,255,255,.18)', color: '#DDE2F7' }}
                >
                  {l.nom}
                </button>
              ))}
            </div>
          </Carte>
          <Bouton couleur={CYAN} onClick={demarrer}>
            <Play size={18} /> Jouer avec Jacques
          </Bouton>
        </>
      )}

      {phase === 'jeu' && j && (
        <>
          {!fini && m && (
            <div className="rounded-2xl border bg-[#070B16]/88 px-3 py-2 text-center" style={{ borderColor: j.statut === 'rate' ? '#FF6B7A' : j.statut === 'bravo' ? '#9DFF8A' : `${CYAN}66` }}>
              <div className="flex items-center justify-between text-[11px] text-[#8A93B8]">
                <span className="labo-mono">
                  {j.tour + 1}/{TOURS}
                </span>
                <span className="labo-mono text-[#FFE45E]">★ {j.score}</span>
              </div>
              <p className="labo-titre text-[22px] font-black leading-tight text-white sm:text-3xl">{texteConsigne(j)}</p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full px-3 py-0.5 text-lg font-black" style={{ background: `${COULEUR_GENRE[m.genre]}22`, color: COULEUR_GENRE[m.genre] }}>
                  {avecArticle(m)}
                </span>
                {trad && (
                  <span dir={sensLangue} className="rounded-full bg-white/10 px-3 py-0.5 text-lg font-bold text-white">
                    {trad}
                  </span>
                )}
                <button type="button" aria-label="Écouter" onClick={() => parler(texteConsigne(j))} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6FEFFF] text-[#04161A]">
                  <Volume2 size={18} />
                </button>
              </div>
              <p className="mt-1 min-h-[20px] text-[14px] font-bold" style={{ color: j.touche && j.statut === 'consigne' ? '#FFB3BC' : '#8A93B8' }}>
                {j.touche && j.statut === 'consigne' ? `Non… ça, c’est ${avecArticle(MOT[j.touche])}.` : j.piege ? 'Attention… Jacques n’a rien dit !' : 'Touche la bonne partie de Jacques.'}
              </p>
            </div>
          )}
          {fini && (
            <div className="rounded-3xl border border-[#9DFF8A]/60 bg-[#070B16]/90 p-4 text-center">
              <p className="labo-titre text-3xl font-black text-white">★ {j.score}</p>
              <p className="text-[14px] text-[#B9C1E3]">Regarde : tous les mots que tu as trouvés sont collés sur Jacques !</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Bouton couleur="#9DFF8A" onClick={() => setJ(preparerTour(nouvellePartie(niveau), 0))}>
                  <RotateCcw size={18} /> Rejouer
                </Bouton>
                <Bouton variante="secondaire" onClick={() => setPhase('accueil')}>
                  Changer de niveau
                </Bouton>
              </div>
            </div>
          )}
          <PlateauCorps
            className="h-[62dvh] w-full rounded-3xl border border-[#6FEFFF]/40 bg-[radial-gradient(circle_at_50%_38%,#17284F,#070B16_75%)]"
            cadre={fini || !j.cible ? 'corps' : cadreDe(j.cible)}
            trouves={j.collees}
            anneaux={anneaux}
            poses={poses}
            onToucher={toucher}
          />
          <p className="-mt-2 text-center text-[12px] text-[#8A93B8]">Le squelette est un vrai modèle 3D : la caméra zoome toute seule sur la tête ou la main.</p>
        </>
      )}
    </CadreJeu>
  )
}
