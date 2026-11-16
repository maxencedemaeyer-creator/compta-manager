import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMotus } from '../../hooks/useMotus.js'
import {
  MOTUS_ESSAIS_MAX,
  PARAMETRES_DEFAUT,
  STATS_VIDES,
  chargerDictionnaire,
  chargerLexique,
  chercherDefinition,
  etatClavier,
  evaluer,
  formaterDuree,
  lettresConnues,
  libelleCategorie,
  lienWiktionnaire,
  moyenneCoups,
  normaliser,
  nouvellePartie,
  propositionValide,
  statsApresPartie,
  textePartagePartie,
  textePartageStats,
  tirerMot,
} from '../../utils/motus.js'

// =============================================================
//  MOTUS — Game Center de Maxence
//  Trouver un mot français (nom commun, adjectif ou verbe, 5 à 12
//  lettres) en 6 essais, la 1re lettre étant donnée. Parties
//  illimitées, définition du mot affichée en fin de partie.
//  Données (partie, stats, réglages) sur Firebase : jeux/motus.
// =============================================================

const CLAVIERS = {
  azerty: ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'],
  qwerty: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'],
}
const VOLUMES = { coupe: 0, faible: 0.04, normal: 0.12 }
const ACCENT = '#d7f23c'
const DUREE_CASE = 500 // retournement d'une case (ms)
const DECALAGE = 250 // décalage d'une case à l'autre (ms)

const STYLES = `
.mt-jeu {
  --fond: #0d2236; --fenetre: #132f4c; --texte: #ffffff; --texte-doux: rgba(255,255,255,.65);
  --case: #1f5f99; --bord-case: rgba(255,255,255,.85);
  --touche: #17375a; --bord-touche: rgba(255,255,255,.85); --texte-touche: #ffffff; --touche-sp: #3b5574;
  --bien: #1fa84a; --texte-bien: #ffffff; --mal: #ffbd00; --texte-mal: #1a1a1a;
  position: fixed; inset: 0; z-index: 40; display: flex; flex-direction: column;
  background: var(--fond); color: var(--texte);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);
  overflow: hidden; touch-action: manipulation; -webkit-user-select: none; user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.mt-jeu *, .mt-jeu *::before, .mt-jeu *::after { box-sizing: border-box; }
.mt-jeu.mt-clair {
  --fond: #e8f0f8; --fenetre: #ffffff; --texte: #0d2236; --texte-doux: rgba(13,34,54,.65);
  --case: #2a6db0; --bord-case: rgba(255,255,255,.9);
  --touche: #ffffff; --bord-touche: #0d2236; --texte-touche: #0d2236; --touche-sp: #c9d6e3;
}
.mt-jeu.mt-daltonien { --bien: #f5793a; --texte-bien: #ffffff; --mal: #85c0f9; --texte-mal: #1a1a1a; }

.mt-entete { display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 8px 8px 4px; position: relative; }
.mt-groupe { display: flex; gap: 4px; z-index: 1; }
.mt-btn-ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; font-weight: 800; color: var(--texte); background: transparent; border: 1.5px solid transparent; cursor: pointer; }
.mt-btn-ico:hover { border-color: var(--bord-touche); }
.mt-titre { position: absolute; left: 0; right: 0; text-align: center; pointer-events: none;
  font-weight: 900; letter-spacing: .06em; font-size: clamp(1rem, 5.2vw, 1.5rem); color: ${ACCENT}; }
.mt-clair .mt-titre { color: #0d2236; }
@media (max-width: 359px) {
  .mt-btn-ico { width: 32px; height: 32px; font-size: .95rem; }
}
.mt-categorie { text-align: center; font-size: .85rem; color: var(--texte-doux); font-weight: 600; padding: 2px 8px 0; }

.mt-zone { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 4px 0; }
.mt-bandeau-zone { position: absolute; top: 2px; left: 0; right: 0; z-index: 5; display: flex; justify-content: center; padding: 0 8px; pointer-events: none; }
.mt-bandeau { background: #fff; color: #0d2236; text-align: center;
  font-weight: 800; font-size: .9rem; padding: 8px 14px; border-radius: 999px; box-shadow: 0 6px 20px rgba(0,0,0,.35); }
.mt-grille { display: flex; flex-direction: column; gap: 3px; }
.mt-ligne { display: flex; gap: 3px; }
.mt-case { width: var(--taille); height: var(--taille); background: var(--case); border: 1px solid var(--bord-case);
  position: relative; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: calc(var(--taille) * .55); color: #fff; text-transform: uppercase; line-height: 1; }
.mt-rond { position: absolute; inset: 6%; border-radius: 50%; }
.mt-case.mt-bien .mt-rond { background: var(--bien); }
.mt-case.mt-mal .mt-rond { background: var(--mal); }
.mt-case.mt-mal .mt-lettre { color: var(--texte-mal); }
.mt-case.mt-bien .mt-lettre { color: var(--texte-bien); }
.mt-lettre { position: relative; }
.mt-indice { position: relative; opacity: .35; }
.mt-coche { position: absolute; right: 8%; bottom: 4%; font-size: calc(var(--taille) * .26); color: #fff; font-weight: 900; }
@keyframes mt-flip { 0% { transform: rotateX(0); } 50% { transform: rotateX(90deg); } 100% { transform: rotateX(0); } }
@keyframes mt-revele { 0%, 49% { opacity: 0; } 50%, 100% { opacity: 1; } }
@keyframes mt-revele-lettre { 0%, 49% { color: #fff; } 50%, 100% { color: var(--texte-mal); } }
@keyframes mt-tremble { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-7px); } 40%,80% { transform: translateX(7px); } }
@keyframes mt-apparait { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
.mt-flip { animation: mt-flip ${DUREE_CASE}ms ease both; }
.mt-flip .mt-rond, .mt-flip .mt-coche { animation: mt-revele ${DUREE_CASE}ms both; animation-delay: inherit; }
.mt-flip.mt-mal .mt-lettre { animation: mt-revele-lettre ${DUREE_CASE}ms both; animation-delay: inherit; }
.mt-tremble { animation: mt-tremble 400ms ease; }
.mt-apparait { animation: mt-apparait .25s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .mt-flip, .mt-flip .mt-rond, .mt-flip .mt-coche, .mt-flip .mt-lettre, .mt-tremble, .mt-apparait { animation: none !important; }
}

.mt-actions { display: flex; gap: 8px; justify-content: center; padding: 6px 8px 0; min-height: 0; }
.mt-btn { border: none; border-radius: 999px; padding: 9px 18px; font-weight: 800; font-size: .95rem; cursor: pointer; }
.mt-btn-accent { background: ${ACCENT}; color: #0d2236; }
.mt-btn-ligne { background: transparent; color: var(--texte); border: 1.5px solid var(--bord-touche); }

.mt-clavier { padding: 8px 4px 8px; display: flex; flex-direction: column; gap: 6px; align-items: center; }
.mt-rangee { display: flex; gap: 4px; justify-content: center; width: 100%; max-width: 34rem; }
.mt-touche { flex: 1 1 0; max-width: 2.6rem; height: min(3.1rem, 7.2dvh); border-radius: 7px; cursor: pointer;
  background: var(--touche); color: var(--texte-touche); border: 1px solid var(--bord-touche);
  font-weight: 800; font-size: 1.05rem; display: flex; align-items: center; justify-content: center; padding: 0; }
.mt-touche.mt-large { flex: 1.5 1 0; max-width: 3.9rem; background: var(--touche-sp); border-color: transparent; font-size: 1.2rem; }
.mt-touche.mt-bien { background: var(--bien); color: var(--texte-bien); border-color: transparent; }
.mt-touche.mt-mal { background: var(--mal); color: var(--texte-mal); border-color: transparent; }
.mt-touche.mt-absent { opacity: .3; }

.mt-voile { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; padding: 12px; }
.mt-fenetre { background: var(--fenetre); color: var(--texte); width: 100%; max-width: 28rem; max-height: calc(100dvh - 24px);
  overflow-y: auto; border-radius: 20px; padding: 18px 18px 20px; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,.45);
  -webkit-user-select: text; user-select: text; }
.mt-fenetre h2 { font-size: 1.25rem; font-weight: 900; margin: 0 36px 12px 0; }
.mt-fenetre h3 { font-size: .95rem; font-weight: 800; margin: 16px 0 8px; display: flex; justify-content: space-between; align-items: baseline; }
.mt-fenetre p, .mt-fenetre li { font-size: .92rem; line-height: 1.45; }
.mt-fermer { position: absolute; top: 12px; right: 12px; }
.mt-lien { background: none; border: none; color: ${ACCENT}; font-weight: 800; cursor: pointer; font-size: .9rem; padding: 0; }
.mt-clair .mt-lien { color: #2a6db0; }
.mt-pastilles { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.mt-pastille { border-radius: 999px; padding: 6px 12px; font-weight: 700; font-size: .85rem; cursor: pointer;
  background: transparent; color: var(--texte); border: 1.5px solid var(--bord-touche); }
.mt-pastille.mt-actif { background: ${ACCENT}; color: #0d2236; border-color: ${ACCENT}; }
.mt-reglage { padding: 10px 0; border-bottom: 1px solid rgba(127,127,127,.25); font-weight: 700; font-size: .92rem; }
.mt-apercu { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; font-size: .85rem; line-height: 1.35;
  background: rgba(127,127,127,.12); border-radius: 12px; padding: 10px 12px; margin: 0; }
.mt-histo { display: flex; flex-direction: column; gap: 4px; }
.mt-histo-ligne { display: flex; align-items: center; gap: 8px; font-size: .85rem; font-weight: 700; }
.mt-histo-ligne span:first-child { width: 12px; text-align: center; }
.mt-barre { min-width: 22px; padding: 2px 6px; text-align: right; border-radius: 4px; background: #5b6b7c; color: #fff; font-size: .8rem; }
.mt-barre.mt-courante { background: #1fa84a; }
.mt-tuiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 12px; }
.mt-tuile { background: rgba(127,127,127,.14); border-radius: 12px; padding: 8px 4px; text-align: center; }
.mt-tuile b { display: block; font-size: 1.15rem; font-weight: 900; }
.mt-tuile small { display: block; font-size: .66rem; opacity: .7; line-height: 1.2; margin-top: 2px; }
.mt-mot-fin { font-size: 2rem; font-weight: 900; letter-spacing: .18em; color: ${ACCENT}; text-align: center; margin: 4px 0 2px; word-break: break-all; }
.mt-clair .mt-mot-fin { color: #2a6db0; }
.mt-mini { display: inline-flex; gap: 2px; vertical-align: middle; }
.mt-mini .mt-case { --taille: 1.9rem; }
.mt-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`

// ── Sons (Web Audio, aucun fichier) ─────────────────────────────────────
let contexteAudio = null
function bip(frequence, volume, delai = 0, duree = 0.13) {
  if (!volume) return
  try {
    contexteAudio = contexteAudio || new (window.AudioContext || window.webkitAudioContext)()
    const t = contexteAudio.currentTime + delai
    const osc = contexteAudio.createOscillator()
    const gain = contexteAudio.createGain()
    osc.type = 'triangle'
    osc.frequency.value = frequence
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duree)
    osc.connect(gain).connect(contexteAudio.destination)
    osc.start(t)
    osc.stop(t + duree + 0.02)
  } catch {
    // pas de son disponible
  }
}

const NOMS_ETATS = { bien: 'bien placée', mal: 'mal placée', absent: 'absente' }

// ── Petits composants ───────────────────────────────────────────────────
function Case({ lettre, etat, indice, flip, delai, daltonien }) {
  const classes = ['mt-case', etat ? `mt-${etat}` : '', flip ? 'mt-flip' : ''].join(' ')
  const label = lettre ? `${lettre}${etat ? `, ${NOMS_ETATS[etat]}` : ''}` : indice ? `${indice}, déjà trouvée` : 'vide'
  return (
    <div className={classes} style={flip ? { animationDelay: `${delai}ms` } : undefined} aria-label={label} role="img">
      {(etat === 'bien' || etat === 'mal') && <span className="mt-rond" />}
      {lettre ? <span className="mt-lettre">{lettre}</span> : indice ? <span className="mt-indice">{indice}</span> : null}
      {daltonien && etat === 'bien' && <span className="mt-coche">✓</span>}
    </div>
  )
}

function Fenetre({ titre, onFermer, children }) {
  return (
    <div className="mt-voile" onClick={onFermer}>
      <div className="mt-fenetre mt-apparait" role="dialog" aria-modal="true" aria-label={titre} onClick={(e) => e.stopPropagation()}>
        <button className="mt-btn-ico mt-fermer" onClick={onFermer} aria-label="Fermer">✕</button>
        <h2>{titre}</h2>
        {children}
      </div>
    </div>
  )
}

function BlocStats({ stats, derniere }) {
  const max = Math.max(1, ...stats.distribution, stats.defaites)
  const lignes = [...stats.distribution.map((n, i) => ({ label: String(i + 1), n, i })), { label: '-', n: stats.defaites, i: 'X' }]
  const pct = stats.jouees ? Math.round((stats.gagnees / stats.jouees) * 100) : 0
  const tuiles = [
    { v: `${stats.gagnees} /${stats.jouees}`, l: 'Victoires' },
    { v: `${pct} %`, l: 'Réussite' },
    { v: moyenneCoups(stats), l: 'Moyenne coups' },
    { v: stats.serieActuelle, l: 'Série en cours' },
    { v: stats.meilleureSerie, l: 'Meilleure série' },
    { v: stats.lettresVertes, l: 'Lettres 🟢' },
    { v: stats.lettresJaunes, l: 'Lettres 🟡' },
    { v: stats.lettresBleues, l: 'Lettres 🟦' },
  ]
  return (
    <div>
      <div className="mt-histo">
        {lignes.map((l) => (
          <div key={l.label} className="mt-histo-ligne">
            <span>{l.label}</span>
            <div
              className={`mt-barre ${derniere === l.i ? 'mt-courante' : ''}`}
              style={{ width: `${Math.max(8, (l.n / max) * 100)}%` }}
            >
              {l.n}
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 10, fontWeight: 700 }}>Nombre total de parties jouées : {stats.jouees}</p>
      <div className="mt-tuiles">
        {tuiles.map((t) => (
          <div key={t.l} className="mt-tuile">
            <b>{t.v}</b>
            <small>{t.l}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pastilles({ valeur, options, onChange }) {
  return (
    <div className="mt-pastilles">
      {options.map(([v, l]) => (
        <button key={String(v)} className={`mt-pastille ${valeur === v ? 'mt-actif' : ''}`} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  )
}

// ── Jeu ─────────────────────────────────────────────────────────────────
export default function MotusView() {
  const navigate = useNavigate()
  const { charger, enregistrer } = useMotus()
  const [donnees, setDonnees] = useState(null) // { partie, stats, parametres, motsJoues, vuRegles }
  const [lexique, setLexique] = useState(null) // { liste, index }
  const [erreur, setErreur] = useState(null)
  const [saisie, setSaisie] = useState('') // lettres tapées après la 1re
  const [message, setMessage] = useState(null)
  const [tremble, setTremble] = useState(0)
  const [revelation, setRevelation] = useState(null) // n° de la ligne en cours de retournement
  const [fenetre, setFenetre] = useState(null) // regles | stats | parametres | fin
  const [verification, setVerification] = useState(false)
  const [annonce, setAnnonce] = useState('')
  const [chargeDef, setChargeDef] = useState(false)
  const debutRef = useRef(null)
  const donneesRef = useRef(null)
  donneesRef.current = donnees
  const minuterieMessage = useRef(null)

  // Le défilement de la page derrière le jeu est bloqué
  useEffect(() => {
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = avant
    }
  }, [])

  const sauver = useCallback(
    (champs) => {
      setDonnees((d) => ({ ...d, ...champs }))
      enregistrer(champs).catch(() => afficherMessage('Connexion perdue : non enregistré'))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Ouverture : données du joueur + lexique. Partie terminée (ou aucune)
  // → nouveau mot tiré et ENREGISTRÉ tout de suite (grille réservée).
  useEffect(() => {
    let actif = true
    Promise.all([charger(), chargerLexique()])
      .then(([doc, lex]) => {
        if (!actif) return
        const d = {
          partie: doc.partie || null,
          stats: { ...STATS_VIDES, ...(doc.stats || {}) },
          parametres: { ...PARAMETRES_DEFAUT, ...(doc.parametres || {}) },
          motsJoues: doc.motsJoues || [],
          vuRegles: !!doc.vuRegles,
        }
        if (!d.partie || d.partie.termine || !lex.index.has(d.partie.mot)) {
          const t = tirerMot(lex.liste, d.motsJoues, d.partie?.mot)
          d.partie = nouvellePartie(t.mot)
          d.motsJoues = t.motsJoues
          enregistrer({ partie: d.partie, motsJoues: d.motsJoues }).catch(() => {})
        } else {
          d.partie = { essais: [], ...d.partie }
        }
        debutRef.current = d.partie.debut || null
        chargerDictionnaire(d.partie.mot[0], d.partie.mot.length).catch(() => {})
        setLexique(lex)
        setDonnees(d)
        if (!d.vuRegles) setFenetre('regles')
      })
      .catch((e) => actif && setErreur(e))
    return () => {
      actif = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const partie = donnees?.partie
  const mot = partie?.mot || ''
  const N = mot.length
  const entree = lexique && mot ? lexique.index.get(mot) : null
  const parametres = donnees?.parametres || PARAMETRES_DEFAUT
  const stats = donnees?.stats || STATS_VIDES
  const volume = VOLUMES[parametres.volume] ?? 0
  const essais = partie?.essais || []
  const essaisVisibles = revelation !== null ? essais.slice(0, revelation) : essais
  const clavierEtats = useMemo(() => (mot ? etatClavier(mot, essaisVisibles) : {}), [mot, essaisVisibles])
  const connues = useMemo(() => (mot ? lettresConnues(mot, essaisVisibles) : []), [mot, essaisVisibles])
  const bloque = !partie || partie.termine || revelation !== null || verification

  function afficherMessage(texte, duree = 2600) {
    setMessage(texte)
    clearTimeout(minuterieMessage.current)
    minuterieMessage.current = setTimeout(() => setMessage(null), duree)
  }

  function vibrer(motif) {
    if (parametres.haptique && navigator.vibrate) navigator.vibrate(motif)
  }

  function refuser(raison) {
    afficherMessage(raison)
    setAnnonce(raison)
    setTremble((t) => t + 1)
    vibrer([40, 30, 40])
  }

  function tapeLettre(l) {
    if (bloque) return
    if (!debutRef.current) debutRef.current = Date.now()
    setSaisie((s) => {
      if (s.length === 0 && l === mot[0]) return s // 1re lettre tapée par réflexe : ignorée
      if (s.length >= N - 1) return s
      return s + l
    })
  }

  function effacer() {
    if (bloque) return
    setSaisie((s) => s.slice(0, -1))
  }

  async function valider() {
    if (bloque) return
    const proposition = mot[0] + saisie
    if (proposition.length < N) return refuser('Mot trop court')
    setVerification(true)
    const verdict = await propositionValide(proposition, mot, lexique?.index)
    setVerification(false)
    if (!verdict.ok) return refuser(verdict.raison)

    const resultat = evaluer(proposition, mot)
    const nouveaux = [...essais, proposition]
    const gagne = resultat.every((e) => e === 'bien')
    const termine = gagne || nouveaux.length >= MOTUS_ESSAIS_MAX
    const debut = partie.debut || debutRef.current || Date.now()
    const nouvelle = { ...partie, essais: nouveaux, gagne, termine, debut, fin: termine ? Date.now() : null }
    const champs = { partie: nouvelle }
    if (termine) champs.stats = statsApresPartie(stats, nouvelle)

    setSaisie('')
    setRevelation(nouveaux.length - 1)
    sauver(champs)

    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const pas = reduit ? 0 : DECALAGE
    resultat.forEach((etat, i) => {
      const f = etat === 'bien' ? 880 : etat === 'mal' ? 660 : 392
      bip(f, volume, (i * pas + DUREE_CASE / 2) / 1000, 0.1)
    })
    const nbBien = resultat.filter((e) => e === 'bien').length
    const nbMal = resultat.filter((e) => e === 'mal').length
    setAnnonce(`Essai ${nouveaux.length} : ${proposition}. ${nbBien} bien placée${nbBien > 1 ? 's' : ''}, ${nbMal} mal placée${nbMal > 1 ? 's' : ''}.`)

    const total = reduit ? 0 : (N - 1) * DECALAGE + DUREE_CASE
    setTimeout(() => {
      setRevelation(null)
      if (termine) {
        if (gagne) [523, 659, 784, 1047].forEach((f, i) => bip(f, volume, i * 0.13, 0.18))
        else [330, 247].forEach((f, i) => bip(f, volume, i * 0.22, 0.25))
        vibrer(gagne ? [60, 40, 60, 40, 120] : 200)
        setTimeout(() => setFenetre('fin'), 450)
      }
    }, total + 60)
  }

  function nouvellePartieJouer() {
    if (!lexique) return
    const t = tirerMot(lexique.liste, donnees.motsJoues, mot)
    const p = nouvellePartie(t.mot)
    debutRef.current = null
    setSaisie('')
    setFenetre(null)
    chargerDictionnaire(t.mot[0], t.mot.length).catch(() => {})
    sauver({ partie: p, motsJoues: t.motsJoues })
  }

  function changerParametre(cle, valeur) {
    const p = { ...parametres, [cle]: valeur }
    sauver({ parametres: p })
  }

  function fermerFenetre() {
    if (fenetre === 'regles' && !donnees?.vuRegles) sauver({ vuRegles: true })
    setFenetre(null)
  }

  async function partager(texte) {
    const mobile = window.matchMedia?.('(pointer: coarse)').matches
    if (mobile && navigator.share) {
      try {
        await navigator.share({ text: texte })
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(texte)
      afficherMessage('Copié dans le presse-papiers !')
    } catch {
      afficherMessage('Copie impossible')
    }
  }

  // Définition (Wiktionnaire) cherchée quand la partie est terminée, puis gardée dans la partie
  const definitionDemandee = useRef(null)
  useEffect(() => {
    if (!partie?.termine || partie.definition || !entree) return
    if (definitionDemandee.current === partie.mot) return
    definitionDemandee.current = partie.mot
    const motCherche = partie.mot
    setChargeDef(true)
    chercherDefinition(entree)
      .then((def) => {
        if (!def) return
        const actuelle = donneesRef.current?.partie
        if (actuelle?.mot !== motCherche) return
        sauver({ partie: { ...actuelle, definition: def } })
      })
      .catch(() => {})
      .finally(() => setChargeDef(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partie?.termine, partie?.mot, entree])

  // Clavier physique
  const toucheRef = useRef(null)
  toucheRef.current = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'Escape') {
      if (fenetre) fermerFenetre()
      else navigate('/maxence/jeux')
      return
    }
    if (fenetre) return
    if (e.key === 'Enter') {
      e.preventDefault()
      valider()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      effacer()
    } else if (e.key.length === 1) {
      const l = normaliser(e.key)
      if (/^[A-Z]$/.test(l)) tapeLettre(l)
    }
  }
  useEffect(() => {
    const ecoute = (e) => toucheRef.current(e)
    window.addEventListener('keydown', ecoute)
    return () => window.removeEventListener('keydown', ecoute)
  }, [])

  const classesJeu = ['mt-jeu', parametres.theme === 'clair' ? 'mt-clair' : '', parametres.daltonien ? 'mt-daltonien' : ''].join(' ')

  if (erreur) {
    return (
      <div className={classesJeu}>
        <style>{STYLES}</style>
        <div className="mt-zone" style={{ padding: 24, textAlign: 'center', gap: 16 }}>
          <p style={{ fontWeight: 800 }}>Impossible d’ouvrir MOTUS.</p>
          <p style={{ color: 'var(--texte-doux)' }}>{erreur.message}</p>
          <button className="mt-btn mt-btn-accent" onClick={() => window.location.reload()}>Réessayer</button>
          <button className="mt-btn mt-btn-ligne" onClick={() => navigate('/maxence/jeux')}>Retour au Game Center</button>
        </div>
      </div>
    )
  }

  if (!donnees || !lexique) {
    return (
      <div className={classesJeu}>
        <style>{STYLES}</style>
        <div className="mt-zone">
          <p className="mt-titre" style={{ position: 'static' }}>🔤 MOTUS</p>
          <p style={{ color: 'var(--texte-doux)', marginTop: 8 }}>Chargement…</p>
        </div>
      </div>
    )
  }

  const taille = `min(3.1rem, calc((100vw - 1.25rem) / ${N} - 3px), calc((100dvh - 22rem) / 6 - 3px))`
  const ligneCourante = partie.termine ? -1 : essais.length
  const numero = stats.jouees
  const derniereBarre = partie.termine ? (partie.gagne ? essais.length - 1 : 'X') : null

  return (
    <div className={classesJeu}>
      <style>{STYLES}</style>
      <div className="mt-sr" aria-live="polite">{annonce}</div>

      {/* En-tête */}
      <div className="mt-entete">
        <div className="mt-groupe">
          <button className="mt-btn-ico" onClick={() => setFenetre('regles')} aria-label="Comment jouer">?</button>
          <button className="mt-btn-ico" onClick={() => setFenetre('stats')} aria-label="Statistiques">📊</button>
        </div>
        <div className="mt-titre">🔤 MOTUS</div>
        <div className="mt-groupe">
          <button
            className="mt-btn-ico"
            onClick={() => changerParametre('volume', parametres.volume === 'coupe' ? 'normal' : 'coupe')}
            aria-label={parametres.volume === 'coupe' ? 'Activer le son' : 'Couper le son'}
          >
            {parametres.volume === 'coupe' ? '🔇' : '🔊'}
          </button>
          <button className="mt-btn-ico" onClick={() => setFenetre('parametres')} aria-label="Paramètres">⚙️</button>
          <button className="mt-btn-ico" onClick={() => navigate('/maxence/jeux')} aria-label="Quitter le jeu">✕</button>
        </div>
      </div>
      <div className="mt-categorie">
        {libelleCategorie(entree)} · {N} lettres
      </div>

      {/* Grille */}
      <div className="mt-zone">
        {message && (
          <div className="mt-bandeau-zone">
            <div className="mt-bandeau mt-apparait" role="status">{message}</div>
          </div>
        )}
        <div className="mt-grille" style={{ '--taille': taille }}>
          {Array.from({ length: MOTUS_ESSAIS_MAX }, (_, r) => {
            if (r < essais.length) {
              const ev = evaluer(essais[r], mot)
              const flip = r === revelation
              return (
                <div key={r} className="mt-ligne" aria-label={`Essai ${r + 1}`}>
                  {ev.map((etat, i) => (
                    <Case
                      key={i}
                      lettre={essais[r][i]}
                      etat={etat}
                      flip={flip}
                      delai={i * DECALAGE}
                      daltonien={parametres.daltonien}
                    />
                  ))}
                </div>
              )
            }
            if (r === ligneCourante) {
              return (
                <div key={`c${r}-${tremble}`} className={`mt-ligne ${tremble ? 'mt-tremble' : ''}`} aria-label="Ligne en cours">
                  {Array.from({ length: N }, (_, i) => {
                    const lettre = i === 0 ? mot[0] : saisie[i - 1]
                    return <Case key={i} lettre={lettre} indice={!lettre ? connues[i] : null} />
                  })}
                </div>
              )
            }
            return (
              <div key={r} className="mt-ligne">
                {Array.from({ length: N }, (_, i) => <Case key={i} />)}
              </div>
            )
          })}
        </div>
      </div>

      {/* Fin de partie : boutons sous la grille */}
      {partie.termine && revelation === null && (
        <div className="mt-actions">
          <button className="mt-btn mt-btn-accent" onClick={nouvellePartieJouer}>Nouvelle partie</button>
          <button className="mt-btn mt-btn-ligne" onClick={() => setFenetre('fin')}>Résultats</button>
        </div>
      )}

      {/* Clavier virtuel */}
      <div className="mt-clavier" role="group" aria-label="Clavier">
        {CLAVIERS[parametres.clavier].map((rangee, ri) => (
          <div key={ri} className="mt-rangee">
            {rangee.split('').map((l) => (
              <button
                key={l}
                className={`mt-touche ${clavierEtats[l] ? `mt-${clavierEtats[l]}` : ''}`}
                onClick={() => tapeLettre(l)}
                aria-label={`${l}${clavierEtats[l] ? `, ${NOMS_ETATS[clavierEtats[l]]}` : ''}`}
              >
                {l}
              </button>
            ))}
            {ri === CLAVIERS[parametres.clavier].length - 1 && (
              <>
                <button className="mt-touche mt-large" onClick={effacer} aria-label="Effacer">⌫</button>
                <button className="mt-touche mt-large" onClick={valider} aria-label="Valider">↲</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Fenêtres ── */}
      {fenetre === 'regles' && (
        <Fenetre titre="Comment jouer" onFermer={fermerFenetre}>
          <p>Trouve le <b>mot français</b> (nom commun, adjectif ou verbe, de 5 à 12 lettres) en <b>6 essais</b>. La première lettre est donnée.</p>
          <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
            <li>Chaque proposition doit être un mot qui existe (pluriels et conjugaisons acceptés).</li>
            <li>Un mot refusé ne te coûte pas d’essai.</li>
            <li>Parties illimitées : une partie terminée, un nouveau mot est tiré.</li>
            <li>À la fin, la définition du mot s’affiche.</li>
          </ul>
          <h3>Exemple</h3>
          <p style={{ marginBottom: 6 }}>Mot à trouver : <b>MAISON</b>, proposition : <b>MAMANS</b></p>
          <div className="mt-mini">
            {evaluer('MAMANS', 'MAISON').map((etat, i) => (
              <Case key={i} lettre={'MAMANS'[i]} etat={etat} daltonien={parametres.daltonien} />
            ))}
          </div>
          <p style={{ marginTop: 8 }}>
            <b>Rond vert</b> : lettre bien placée (M, A). <b>Rond jaune</b> : lettre présente mais mal placée (N, S). Les autres restent sur le
            fond bleu : le 2e M et le 2e A ne comptent pas, car MAISON n’a qu’un M et qu’un A. Une lettre n’est jamais signalée plus de
            fois qu’elle n’apparaît dans le mot.
          </p>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button className="mt-btn mt-btn-accent" onClick={fermerFenetre}>C’est parti !</button>
          </div>
        </Fenetre>
      )}

      {fenetre === 'stats' && (
        <Fenetre titre="Statistiques" onFermer={fermerFenetre}>
          <BlocStats stats={stats} derniere={derniereBarre} />
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button className="mt-btn mt-btn-accent" onClick={() => partager(textePartageStats(stats))}>Partager mes stats</button>
          </div>
        </Fenetre>
      )}

      {fenetre === 'parametres' && (
        <Fenetre titre="Paramètres" onFermer={fermerFenetre}>
          <div className="mt-reglage">
            Volume du son
            <Pastilles valeur={parametres.volume} options={[['coupe', 'Coupé'], ['faible', 'Faible'], ['normal', 'Normal']]} onChange={(v) => changerParametre('volume', v)} />
          </div>
          <div className="mt-reglage">
            Disposition du clavier
            <Pastilles valeur={parametres.clavier} options={[['azerty', 'AZERTY'], ['qwerty', 'QWERTY']]} onChange={(v) => changerParametre('clavier', v)} />
          </div>
          <div className="mt-reglage">
            Thème
            <Pastilles valeur={parametres.theme} options={[['sombre', 'Sombre'], ['clair', 'Clair']]} onChange={(v) => changerParametre('theme', v)} />
          </div>
          {'vibrate' in navigator && (
            <div className="mt-reglage">
              Retour haptique
              <Pastilles valeur={parametres.haptique} options={[[true, 'Oui'], [false, 'Non']]} onChange={(v) => changerParametre('haptique', v)} />
            </div>
          )}
          <div className="mt-reglage">
            Afficher le temps dans le résumé
            <Pastilles valeur={parametres.afficherTemps} options={[[true, 'Oui'], [false, 'Non']]} onChange={(v) => changerParametre('afficherTemps', v)} />
          </div>
          <div className="mt-reglage" style={{ borderBottom: 'none' }}>
            Mode daltonien
            <Pastilles valeur={parametres.daltonien} options={[[true, 'Oui'], [false, 'Non']]} onChange={(v) => changerParametre('daltonien', v)} />
          </div>
          <p style={{ marginTop: 10, color: 'var(--texte-doux)', fontSize: '.82rem' }}>
            Tes réglages et tes statistiques sont enregistrés sur ton profil : tu les retrouves sur tous tes appareils.
          </p>
        </Fenetre>
      )}

      {fenetre === 'fin' && partie.termine && (
        <Fenetre titre={partie.gagne ? 'Bravo, tu as gagné ! 🎉' : 'Raté !'} onFermer={fermerFenetre}>
          {!partie.gagne && <p style={{ textAlign: 'center' }}>Le mot était…</p>}
          <p className="mt-mot-fin">{mot}</p>
          <p style={{ textAlign: 'center', color: 'var(--texte-doux)', fontWeight: 700 }}>
            {entree && normaliser(entree.orthographes[0]) === mot && entree.orthographes[0].toUpperCase() !== mot && (
              <>« {entree.orthographes[0]} » · </>
            )}
            {libelleCategorie(entree)}
          </p>
          <div style={{ marginTop: 10 }}>
            {partie.definition?.definitions?.length ? (
              <>
                <ol style={{ paddingLeft: 20, margin: 0 }}>
                  {partie.definition.definitions.map((d, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                  ))}
                </ol>
                <a className="mt-lien" href={lienWiktionnaire(partie.definition.titre)} target="_blank" rel="noreferrer">
                  Voir sur le Wiktionnaire ↗
                </a>
              </>
            ) : chargeDef ? (
              <p style={{ color: 'var(--texte-doux)' }}>Recherche de la définition…</p>
            ) : (
              entree && (
                <a className="mt-lien" href={lienWiktionnaire(entree.orthographes[0])} target="_blank" rel="noreferrer">
                  Voir la définition sur le Wiktionnaire ↗
                </a>
              )
            )}
          </div>
          {parametres.afficherTemps && partie.debut && partie.fin && (
            <p style={{ marginTop: 8, fontWeight: 700 }}>⏱️ Temps : {formaterDuree(partie.fin - partie.debut)}</p>
          )}

          <h3>
            Résumé de la partie
            <button className="mt-lien" onClick={() => partager(textePartagePartie(partie, numero, parametres))}>Partager</button>
          </h3>
          <pre className="mt-apercu">{textePartagePartie(partie, numero, parametres)}</pre>

          <h3>
            Statistiques
            <button className="mt-lien" onClick={() => partager(textePartageStats(stats))}>Partager</button>
          </h3>
          <BlocStats stats={stats} derniere={derniereBarre} />

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="mt-btn mt-btn-accent" onClick={nouvellePartieJouer}>Nouvelle partie</button>
          </div>
        </Fenetre>
      )}
    </div>
  )
}
