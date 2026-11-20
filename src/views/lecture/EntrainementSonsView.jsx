import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, Eraser, Pencil, SkipForward, Target, Undo2, X } from 'lucide-react'
import {
  annulerMotEntrainement,
  enregistrerCorrectionSon,
  marquerMotVerifie,
  useCorrectionsSons,
  useLectures,
  useProgressionEntrainement,
} from '../../hooks/useLecture.js'
import { SONS, analyserTexte, chargerDictionnaireSons, modeleDepuisLettres } from '../../utils/phonemes.js'
import { chargerPolices } from '../../components/lecture/reglages.js'

// =============================================================
//  Lis-moi — « Entraînement des sons » (Max, avec son code PIN)
//  Une longue liste de mots colorés par le moteur des « sons en couleur » :
//  ✓ Juste  ·  ✏️ À corriger (peindre les lettres avec le bon son)  ·  Passer.
//  Les corrections sont enregistrées dans Firebase et appliquées AUSSITÔT
//  partout dans Lis-moi (toutes les tablettes), sans redéployer le site.
//  Ordre : d'abord les mots des lectures de la classe, puis les 5 000 mots
//  français les plus fréquents (public/lecture/entrainement-mots.txt).
//  Clavier (ordinateur) : → ou Entrée = juste, C = corriger, ↓ = passer, ⌫ = annuler.
// =============================================================
const GRAPHIES = /(an|am|en|em|in|im|ain|ein|é|er|ez|on|om|eu|oeu|œu|ou|oi|au|eau)/
const COULEUR = Object.fromEntries(SONS.map((s) => [s.id, s.color]))

/** Couleur de chaque lettre d'un mot (null = pas de couleur). */
function couleursLettres(mot, dico) {
  const lettres = [...mot]
  const sons = lettres.map(() => null)
  for (const [d, n, id] of analyserTexte(mot, { sons: dico })) for (let k = d; k < d + n; k++) sons[k] = id
  return sons
}

function MotColore({ mot, sons, taille = 64 }) {
  return (
    <span className="font-semibold tracking-wide" style={{ fontSize: taille, fontFamily: "'Lexend', system-ui, sans-serif" }}>
      {[...mot].map((l, k) => (
        <span key={k} style={sons[k] ? { color: COULEUR[sons[k]], textShadow: '.025em 0 0 currentColor' } : undefined}>
          {l}
        </span>
      ))}
    </span>
  )
}

// ——— Correction : choisir un son puis toucher (ou glisser sur) les lettres ———
function Correcteur({ mot, sonsDepart, onEnregistrer, onAnnuler }) {
  const lettres = useMemo(() => [...mot], [mot])
  const [sons, setSons] = useState(sonsDepart)
  const [pinceau, setPinceau] = useState(SONS[0].id) // id d'un son, ou null = gomme
  const peint = useRef(false)

  const peindre = (k) =>
    setSons((s) => {
      const t = [...s]
      t[k] = pinceau
      return t
    })

  return (
    <div className="mt-6">
      <p className="text-center text-sm text-indigo-950/55">Choisis un son, puis touche (ou glisse sur) les lettres qui le font.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {SONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setPinceau(s.id)}
            className={`rounded-xl px-3 py-2 text-base font-bold ring-2 transition ${pinceau === s.id ? 'bg-white ring-indigo-600' : 'bg-white/70 ring-transparent'}`}
            style={{ color: s.color }}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setPinceau(null)}
          className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-indigo-950/70 ring-2 transition ${pinceau === null ? 'bg-white ring-indigo-600' : 'bg-white/70 ring-transparent'}`}
        >
          <Eraser size={16} /> Aucun son
        </button>
      </div>

      <div
        className="mt-5 flex touch-none select-none justify-center gap-1"
        onPointerUp={() => (peint.current = false)}
        onPointerLeave={() => (peint.current = false)}
      >
        {lettres.map((l, k) => (
          <button
            key={k}
            onPointerDown={(e) => {
              e.currentTarget.releasePointerCapture?.(e.pointerId)
              peint.current = true
              peindre(k)
            }}
            onPointerEnter={() => peint.current && peindre(k)}
            className="flex h-16 min-w-12 items-center justify-center rounded-2xl bg-white px-2 text-4xl font-semibold shadow-sm ring-1 ring-indigo-950/10"
            style={{ color: sons[k] ? COULEUR[sons[k]] : '#1f1d36', fontFamily: "'Lexend', system-ui, sans-serif" }}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button onClick={onAnnuler} className="flex h-12 items-center gap-2 rounded-2xl bg-white px-5 font-semibold text-indigo-800 shadow-sm">
          <X size={18} /> Annuler
        </button>
        <button
          onClick={() => onEnregistrer(modeleDepuisLettres(lettres, sons))}
          className="flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-5 font-semibold text-white shadow-lg shadow-indigo-600/30"
        >
          <Check size={18} /> Enregistrer la correction
        </button>
      </div>
    </div>
  )
}

export default function EntrainementSonsView() {
  const [dico, setDico] = useState(null)
  const [frequents, setFrequents] = useState(null)
  const [erreur, setErreur] = useState(null)
  const verifies = useProgressionEntrainement()
  const { version, modeles } = useCorrectionsSons()
  const { lectures } = useLectures()
  const [passes, setPasses] = useState(() => new Set()) // mots passés (cette séance seulement)
  const [historique, setHistorique] = useState([]) // dernières décisions (pour annuler)
  const [correction, setCorrection] = useState(false)
  const [voirCorrections, setVoirCorrections] = useState(false)
  const [occupe, setOccupe] = useState(false)

  useEffect(() => {
    chargerPolices()
    document.title = 'Entraînement des sons'
    Promise.all([
      chargerDictionnaireSons(),
      fetch('/lecture/entrainement-mots.txt').then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status)))),
    ])
      .then(([d, liste]) => {
        setDico(d)
        setFrequents(liste.split('\n').filter(Boolean))
      })
      .catch(() => setErreur('Impossible de charger les mots. Vérifie la connexion et recharge la page.'))
  }, [])

  // Mots des lectures de la classe (d'abord), puis mots fréquents
  const motsLectures = useMemo(() => {
    const vus = new Set()
    const liste = []
    for (const l of lectures) {
      for (const m of (l.texte || '').toLowerCase().match(/\p{L}+/gu) || []) {
        if (m.length < 2 || vus.has(m) || !GRAPHIES.test(m.replace(/œ/g, 'oe'))) continue
        vus.add(m)
        liste.push(m)
      }
    }
    return liste
  }, [lectures])

  const file = useMemo(() => {
    if (!frequents || !verifies) return null
    const deLecture = new Set(motsLectures)
    const tous = [...motsLectures, ...frequents.filter((m) => !deLecture.has(m))]
    return tous.filter((m) => !verifies[m] && !passes.has(m)).map((m) => ({ mot: m, lecture: deLecture.has(m) }))
  }, [frequents, verifies, motsLectures, passes])

  const actuel = file?.[0] || null
  const sonsActuels = useMemo(
    () => (actuel && dico ? couleursLettres(actuel.mot, dico) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actuel?.mot, dico, version]
  )

  const nbVerifies = verifies ? Object.keys(verifies).length : 0
  const nbCorriges = Object.keys(modeles).length

  const agir = useCallback(
    async (action) => {
      if (!actuel || occupe) return
      const mot = actuel.mot
      setOccupe(true)
      try {
        if (action === 'juste') {
          await marquerMotVerifie(mot)
          setHistorique((h) => [mot, ...h].slice(0, 30))
        } else if (action === 'passer') {
          setPasses((p) => new Set(p).add(mot))
        }
      } catch (e) {
        alert(e.message)
      } finally {
        setOccupe(false)
      }
    },
    [actuel, occupe]
  )

  const annulerDernier = useCallback(async () => {
    const [mot, ...reste] = historique
    if (!mot) return
    setHistorique(reste)
    await annulerMotEntrainement(mot).catch(() => {})
  }, [historique])

  const enregistrer = async (modele) => {
    const mot = actuel.mot
    setOccupe(true)
    try {
      // Même coloration que le moteur : c'était juste
      const sansChangement = modeleDepuisLettres([...mot], sonsActuels) === modele
      if (sansChangement) await marquerMotVerifie(mot)
      else await enregistrerCorrectionSon(mot, modele)
      setHistorique((h) => [mot, ...h].slice(0, 30))
      setCorrection(false)
    } catch (e) {
      alert(e.message)
    } finally {
      setOccupe(false)
    }
  }

  // Raccourcis clavier (ordinateur)
  useEffect(() => {
    const touche = (e) => {
      if (correction || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return
      if (e.key === 'ArrowRight' || e.key === 'Enter') agir('juste')
      else if (e.key === 'ArrowDown') agir('passer')
      else if (e.key.toLowerCase() === 'c') setCorrection(true)
      else if (e.key === 'Backspace') annulerDernier()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [agir, annulerDernier, correction])

  return (
    <div className="min-h-[100dvh] bg-[#fbf7f0] text-indigo-950" style={{ fontFamily: "'Lexend', system-ui, sans-serif" }}>
      <header className="sticky top-0 z-10 border-b border-indigo-950/5 bg-[#fbf7f0]/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link to="/lecture" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-indigo-800 shadow-sm ring-1 ring-indigo-950/5" aria-label="Retour à Lis-moi">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <Target size={20} className="text-violet-600" /> Entraînement des sons
            </h1>
            <p className="text-xs text-indigo-950/55">
              {nbVerifies} vérifiés · {nbCorriges} corrigés{file ? ` · ${file.length} à voir` : ''}
            </p>
          </div>
          <button
            onClick={annulerDernier}
            disabled={!historique.length}
            className="flex h-11 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-indigo-800 shadow-sm ring-1 ring-indigo-950/5 disabled:opacity-40"
            title="Annuler le dernier (⌫)"
          >
            <Undo2 size={17} /> <span className="hidden sm:inline">Annuler</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <p className="mb-5 text-center text-sm text-indigo-950/55">
          Le mot est-il bien coloré ? Seuls les sons <b>vraiment prononcés</b> doivent l’être (8 sons des cartes).
        </p>

        {erreur && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">{erreur}</p>}

        {!erreur && (!file || !dico) && <p className="py-16 text-center text-indigo-950/40">Chargement des mots…</p>}

        {file && dico && !actuel && (
          <div className="rounded-[2rem] bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-5xl">🎉</p>
            <p className="mt-3 text-xl font-bold">Tous les mots sont vérifiés !</p>
          </div>
        )}

        {actuel && dico && (
          <section className="rounded-[2rem] bg-white px-5 py-8 shadow-sm ring-1 ring-indigo-950/5 sm:px-10">
            {actuel.lecture && (
              <p className="mb-2 text-center">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">Mot d’une lecture de la classe</span>
              </p>
            )}
            {!correction ? (
              <>
                <p className="py-6 text-center">
                  <MotColore mot={actuel.mot} sons={sonsActuels} />
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => agir('juste')}
                    disabled={occupe}
                    className="flex h-16 min-w-40 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-xl font-bold text-white shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-60"
                  >
                    <Check size={24} /> Juste
                  </button>
                  <button
                    onClick={() => setCorrection(true)}
                    className="flex h-16 min-w-40 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 text-xl font-bold text-amber-950 shadow-lg shadow-amber-500/30 active:scale-95"
                  >
                    <Pencil size={22} /> À corriger
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <button onClick={() => agir('passer')} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-indigo-950/50 hover:bg-indigo-50">
                    <SkipForward size={16} /> Passer (je ne suis pas sûr)
                  </button>
                </div>
                <p className="mt-4 hidden text-center text-xs text-indigo-950/35 md:block">Clavier : → juste · C corriger · ↓ passer · ⌫ annuler</p>
              </>
            ) : (
              <>
                <p className="pt-2 text-center">
                  <MotColore mot={actuel.mot} sons={sonsActuels} taille={40} />
                </p>
                <Correcteur
                  key={actuel.mot}
                  mot={actuel.mot}
                  sonsDepart={sonsActuels}
                  onEnregistrer={enregistrer}
                  onAnnuler={() => setCorrection(false)}
                />
              </>
            )}
          </section>
        )}

        {/* Légende des 8 sons */}
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {SONS.map((s) => (
            <span key={s.id} className="rounded-lg bg-white px-2 py-0.5 text-sm font-bold shadow-sm" style={{ color: s.color }}>
              {s.label} <span className="font-normal text-indigo-950/40">({s.graphemes.join(', ')})</span>
            </span>
          ))}
        </div>

        {/* Corrections déjà faites */}
        {nbCorriges > 0 && (
          <div className="mt-8">
            <button onClick={() => setVoirCorrections((v) => !v)} className="mx-auto flex items-center gap-1.5 text-sm font-semibold text-indigo-800">
              Mes corrections ({nbCorriges}) <ChevronDown size={16} className={voirCorrections ? 'rotate-180' : ''} />
            </button>
            {voirCorrections && dico && (
              <ul className="mt-3 divide-y divide-indigo-950/5 rounded-2xl bg-white shadow-sm">
                {Object.keys(modeles)
                  .sort()
                  .map((mot) => (
                    <li key={mot} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <MotColore mot={mot} sons={couleursLettres(mot, dico)} taille={22} />
                      <button
                        onClick={() => annulerMotEntrainement(mot)}
                        className="rounded-full px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Retirer
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
