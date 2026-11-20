import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, FilePlus2, Pencil, Pointer, Trash2, Type, X } from 'lucide-react'
import { ajouterPage, majLecture, modifierTexte, supprimerLecture, useLecture } from '../../hooks/useLecture.js'
import { decouperMots, motALaPosition, phraseAutour } from '../../utils/lecture.js'
import { VITESSES, VOIX_DEFAUT } from '../../config/lectureVoix.js'
import TexteLisible from '../../components/lecture/TexteLisible.jsx'
import BarreLecture from '../../components/lecture/BarreLecture.jsx'
import BulleMot from '../../components/lecture/BulleMot.jsx'
import PanneauAffichage from '../../components/lecture/PanneauAffichage.jsx'
import PhotoPages from '../../components/lecture/PhotoPages.jsx'
import EcranAnalyse from '../../components/lecture/EcranAnalyse.jsx'
import Recadrage from '../../components/lecture/Recadrage.jsx'
import InterrupteurSons from '../../components/lecture/InterrupteurSons.jsx'
import { analyserTexte, chargerDictionnaireSons, sonsParMot } from '../../utils/phonemes.js'
import useLecteur from '../../components/lecture/useLecteur.js'
import { chargerPolices, useReglages } from '../../components/lecture/reglages.js'
import { MOTEUR_VOIX } from '../../config/lectureVoix.js'
import { ecouterPreparation, prechargerPiper } from '../../utils/voixPiper.js'

// =============================================================
//  Lis-moi — page de lecture
//  Photo (à gauche en paysage, en haut en portrait) + texte reconnu.
//  - Toucher / cliquer un mot : bulle (🔊 mot, phrase, ▶ d'ici, ✏️ corriger).
//  - Choisir un passage comme sur iPhone : souris = cliquer-glisser ;
//    doigt = appui court sur le 1er mot puis glisser. Bulle « ▶ Lire ».
//    ▶ de la barre lit le passage choisi (ou tout le texte).
//  - Pendant la lecture : phrase surlignée doucement, mot en jaune,
//    ⟲ revient à la phrase précédente.
//  - Aa : police, taille, interligne, espacement, fond doux, focus.
//  - « Sons en couleur » : les 8 sons des cartes de la classe (utils/phonemes.js), réglage mémorisé.
//  - Ordinateur, clavier : Espace (lire/pause), Échap (tout le texte), ← (revenir).
// =============================================================
const SANS_SELECTION = { a: null, b: null }
// Ordinateur (souris) ou tablette (doigt) : seulement pour adapter les petites phrases d'aide
const SOURIS = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches
const TOUCHE = SOURIS ? 'clique' : 'touche'

function BoutonOutil({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-indigo-800 shadow-sm ring-1 ring-indigo-950/5 transition active:bg-indigo-50"
    >
      {children}
    </button>
  )
}

export default function LectureDetailView() {
  const { lectureId } = useParams()
  const navigate = useNavigate()
  const lecture = useLecture(lectureId)
  const { reglages, changer, taillePx, police, interligne, espacement, fond } = useReglages()
  const [selection, setSelection] = useState(SANS_SELECTION)
  const [bulle, setBulle] = useState(null) // { index, element }
  const [panneau, setPanneau] = useState(false)
  const [edition, setEdition] = useState(null) // texte complet en cours de correction
  const [enregistrement, setEnregistrement] = useState(false)
  const [recadrage, setRecadrage] = useState(null) // photo d'une nouvelle page
  const [analyse, setAnalyse] = useState(null)
  const nouvellePage = useRef(null)
  const derniere = useRef(null) // dernière lecture lancée { debut, fin } (pour ⟲)

  // Voix Piper : préparée dès l'ouverture (1re fois : téléchargement ~60 Mo, ensuite instantané)
  const [preparationVoix, setPreparationVoix] = useState(null)
  useEffect(() => {
    chargerPolices()
    if (MOTEUR_VOIX !== 'piper') return
    const arreter = ecouterPreparation((e) => setPreparationVoix(e.pret ? null : e.pourcent))
    prechargerPiper()
    return arreter
  }, [])

  const texte = lecture?.texte || ''
  const { paragraphes, mots } = useMemo(() => decouperMots(texte), [texte])
  const lecteur = useLecteur(texte)
  const enLecture = lecteur.position >= 0
  const motActif = !enLecture || mots.length === 0 ? -1 : motALaPosition(mots, lecteur.position)
  // « Sons en couleur » (spécification de Max) : réglage mémorisé sur l'appareil (éteint par défaut) ;
  // le dictionnaire des sons est chargé dès que le réglage est allumé
  const sonsActifs = !!reglages.couleursSons
  const [dicoSons, setDicoSons] = useState(null)
  const [chargementSons, setChargementSons] = useState(false)
  useEffect(() => {
    if (!sonsActifs || dicoSons) return
    let vivant = true
    setChargementSons(true)
    chargerDictionnaireSons()
      .then((d) => vivant && setDicoSons(d))
      .catch(() => {
        if (!vivant) return
        changer({ couleursSons: false })
        alert('Les sons en couleur ne sont pas disponibles pour le moment (connexion ?).')
      })
      .finally(() => vivant && setChargementSons(false))
    return () => {
      vivant = false
    }
  }, [sonsActifs, dicoSons, changer])
  const basculerSons = (actif) => changer({ couleursSons: actif })
  const sonsMots = useMemo(
    () => (sonsActifs && dicoSons ? sonsParMot(analyserTexte(texte, { sons: dicoSons }), mots) : null),
    [sonsActifs, dicoSons, texte, mots]
  )

  const listeDouteux = lecture?.douteux
  const douteux = useMemo(() => new Set(listeDouteux || []), [listeDouteux])
  const nbDouteux = useMemo(() => mots.filter((m) => douteux.has(m.texte)).length, [mots, douteux])
  const phraseActive = useMemo(() => (enLecture ? phraseAutour(texte, lecteur.position) : null), [enLecture, texte, lecteur.position])

  // Le texte change (correction, nouvelle page) : on repart de zéro
  useEffect(() => {
    lecteur.arreter()
    setSelection(SANS_SELECTION)
    setBulle(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texte])

  const fermerBulle = useCallback(() => setBulle(null), [])

  // Raccourcis clavier (ordinateur) : Espace = lire / pause, Échap = tout le texte, ← = revenir
  const raccourcis = useRef({})
  useEffect(() => {
    const touche = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return
      const r = raccourcis.current
      if (e.key === ' ' && r.play) {
        e.preventDefault()
        r.play()
      } else if (e.key === 'Escape' && r.effacer) r.effacer()
      else if (e.key === 'ArrowLeft' && r.revenir) r.revenir()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [])

  if (lecture === undefined) return <div className="min-h-[100dvh]" style={{ background: fond.page }} />
  if (lecture === null) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 text-indigo-950" style={{ background: fond.page }}>
        <p className="text-lg">Cette lecture n’existe plus.</p>
        <Link to="/lecture" className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white">Retour aux lectures</Link>
      </div>
    )
  }

  const options = () => {
    const v = VITESSES.find((x) => x.id === reglages.vitesse) || VITESSES[1]
    return { voix: VOIX_DEFAUT, vitesse: v.valeur, debit: v.debit } // pas de choix de voix pour l'élève
  }
  const lire = (debut, fin) => {
    derniere.current = { debut, fin }
    lecteur.lire(debut, fin, options())
  }

  // ---------- Sélection ----------
  // Toucher / cliquer un mot : ce mot + bulle (Mot, Phrase, D'ici, ✏️).
  // Glisser (souris, ou doigt après un appui court) : un passage + bulle « Lire ».
  const toucherMot = (i, element) => {
    if (lecteur.etat !== 'arret') lecteur.arreter()
    setSelection({ a: i, b: i })
    setBulle({ type: 'mot', index: i, element })
  }

  let debut = 0
  let fin = texte.length
  let resume = SOURIS
    ? 'Tout le texte · clique sur un mot et glisse pour choisir un passage'
    : 'Tout le texte · appuie sur un mot et glisse pour choisir un passage'
  if (selection.a !== null && mots[selection.a] && mots[selection.b ?? selection.a]) {
    const i = Math.min(selection.a, selection.b ?? selection.a)
    const j = Math.max(selection.a, selection.b ?? selection.a)
    debut = mots[i].debut
    fin = mots[j].fin
    const n = j - i + 1
    resume = n === 1 ? `Le mot « ${mots[i].texte} »` : `Passage choisi : ${n} mots`
  }

  const play = () => {
    setBulle(null)
    if (lecteur.etat === 'lecture') return lecteur.pause()
    if (lecteur.etat === 'pause') return lecteur.reprendre()
    if (lecteur.etat === 'chargement') return
    lire(debut, fin)
  }

  // ⟲ : début de la phrase en cours, ou phrase précédente si on vient de la commencer
  const revenir = () => {
    const d = derniere.current
    if (!d) return
    const pos = lecteur.position >= 0 ? lecteur.position : d.debut
    let ph = phraseAutour(texte, pos)
    if (pos - ph.debut < 12 && ph.debut > d.debut) ph = phraseAutour(texte, Math.max(0, ph.debut - 2))
    lire(Math.max(d.debut, ph.debut), d.fin)
  }

  const effacerSelection = () => {
    lecteur.arreter()
    setBulle(null)
    setSelection(SANS_SELECTION)
  }
  const choisirPlage = (a, b) => {
    if (lecteur.etat !== 'arret') lecteur.arreter()
    setBulle(null)
    setSelection({ a, b })
  }
  const finPlage = (a, b, element) => {
    setSelection({ a, b })
    setBulle(a === b ? { type: 'mot', index: a, element } : { type: 'passage', index: b, element })
  }
  raccourcis.current =
    edition === null && !panneau
      ? { play, effacer: effacerSelection, revenir: lecteur.etat !== 'arret' ? revenir : null }
      : {}

  // ---------- Bulle du mot ----------
  const motBulle = bulle ? mots[bulle.index] : null
  const ecouterMot = () => {
    setBulle(null)
    lire(motBulle.debut, motBulle.fin)
  }
  const lireDIci = () => {
    setBulle(null)
    setSelection(SANS_SELECTION)
    lire(motBulle.debut, texte.length)
  }
  const lirePassage = () => {
    setBulle(null)
    lire(debut, fin)
  }
  const lirePhrase = () => {
    const ph = phraseAutour(texte, motBulle.debut)
    const a = motALaPosition(mots, ph.debut)
    let b = motALaPosition(mots, Math.max(ph.debut, ph.fin - 1))
    if (b > a && mots[b].debut >= ph.fin) b-- // dernier mot de la phrase (pas le premier de la suivante)
    setSelection({ a, b })
    setBulle(null)
    lire(mots[a].debut, Math.max(mots[b].fin, ph.fin)) // avec le point final (bonne intonation)
  }
  const corrigerMot = async (nouveau) => {
    const m = motBulle
    setBulle(null)
    try {
      await modifierTexte(lecture.id, texte.slice(0, m.debut) + nouveau + texte.slice(m.fin), {
        douteux: (lecture.douteux || []).filter((d) => d !== m.texte),
      })
    } catch (e) {
      alert(e.message)
    }
  }

  // ---------- Outils ----------
  const enregistrer = async () => {
    setEnregistrement(true)
    try {
      await modifierTexte(lecture.id, edition.trim())
      setEdition(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setEnregistrement(false)
    }
  }

  const supprimer = async () => {
    if (!window.confirm('Supprimer cette lecture et sa photo ?')) return
    lecteur.arreter()
    try {
      await supprimerLecture(lecture)
      navigate('/lecture', { replace: true })
    } catch (e) {
      alert(e.message)
    }
  }

  const traiterPage = async (file) => {
    setAnalyse({ file, progression: 0, erreur: null })
    try {
      await ajouterPage(lecture, file, (p, etape) => setAnalyse((a) => (a ? { ...a, progression: p, etape: etape ?? a.etape } : a)))
      setAnalyse(null)
    } catch (e) {
      setAnalyse((a) => (a ? { ...a, erreur: e } : a))
    }
  }

  const aPhotos = (typeof lecture.pages === 'number' ? lecture.pages : 1) > 0
  const montrerAstuce = !reglages.astuceVue && selection.a === null && lecteur.etat === 'arret'

  return (
    <div
      className="min-h-[100dvh] text-indigo-950 transition-colors"
      style={{ fontFamily: "'Lexend', system-ui, sans-serif", background: fond.page }}
      onClick={(e) => {
        // toucher à côté d'un mot ferme la bulle
        if (bulle && !e.target.closest('[data-i]')) setBulle(null)
      }}
    >
      {/* En-tête */}
      <header
        className="sticky top-0 z-20 border-b border-indigo-950/5 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-5"
        style={{ background: `${fond.page}d9` }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Link
            to="/lecture"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-indigo-800 shadow-sm ring-1 ring-indigo-950/5"
            aria-label="Retour aux lectures"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="hidden min-w-0 flex-1 truncate px-1 text-lg font-semibold sm:block">{lecture.titre}</h1>
          <span className="flex-1 sm:hidden" />
          {edition === null ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <InterrupteurSons actif={sonsActifs} chargement={chargementSons} onChange={basculerSons} />
              <button
                onClick={() => {
                  setBulle(null)
                  setPanneau(true)
                }}
                className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-white/90 px-3 font-semibold text-indigo-800 shadow-sm ring-1 ring-indigo-950/5 sm:px-4"
                aria-label="Affichage du texte"
              >
                <Type size={18} /> <span className="hidden sm:inline">Aa</span>
              </button>
              <BoutonOutil
                label="Corriger tout le texte"
                onClick={() => {
                  lecteur.arreter()
                  setBulle(null)
                  setEdition(texte)
                }}
              >
                <Pencil size={18} />
              </BoutonOutil>
              <BoutonOutil label="Ajouter une page (photo)" onClick={() => nouvellePage.current?.click()}>
                <FilePlus2 size={19} />
              </BoutonOutil>
              <BoutonOutil label="Supprimer la lecture" onClick={supprimer}>
                <Trash2 size={18} className="text-rose-600" />
              </BoutonOutil>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => setEdition(null)} className="flex h-11 items-center gap-1.5 rounded-full bg-white px-4 font-semibold text-indigo-800 shadow-sm ring-1 ring-indigo-950/5">
                <X size={18} /> Annuler
              </button>
              <button
                onClick={enregistrer}
                disabled={enregistrement || !edition.trim()}
                className="flex h-11 items-center gap-1.5 rounded-full bg-indigo-600 px-4 font-semibold text-white shadow disabled:opacity-50"
              >
                <Check size={18} /> {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </header>
      <input
        ref={nouvellePage}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) setRecadrage(file)
        }}
      />

      {/* Le texte, au centre : c'est LÀ qu'on choisit ce qu'on lit. La photo d'origine
          n'est qu'un rappel (petite vignette « Voir la photo »). */}
      <main className="mx-auto max-w-3xl px-3 pt-4 sm:px-5">
        <section
          className="mb-48 rounded-[2rem] px-5 py-6 shadow-sm ring-1 ring-indigo-950/5 transition-colors sm:px-9 sm:py-8"
          style={{ background: fond.carte }}
        >
          {edition === null && (aPhotos || montrerAstuce) && (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              {aPhotos && <PhotoPages lectureId={lecture.id} pages={lecture.pages} miniature={lecture.miniature} />}
              {montrerAstuce && (
                <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-md shadow-indigo-600/20 sm:w-auto sm:flex-1">
                  <Pointer size={20} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    {SOURIS ? (
                      <>
                        <b>Clique sur un mot</b> et <b>glisse</b> jusqu’au dernier mot à lire — ou appuie sur ▶ pour tout lire.
                      </>
                    ) : (
                      <>
                        <b>Garde le doigt sur un mot</b>, puis <b>glisse</b> jusqu’au dernier mot à lire — ou appuie sur ▶ pour tout lire.
                      </>
                    )}
                  </span>
                  <button onClick={() => changer({ astuceVue: true })} className="shrink-0 rounded-full bg-white/20 px-3 py-1 font-semibold">
                    Compris
                  </button>
                </div>
              )}
            </div>
          )}
          {edition !== null ? (
            <>
              <p className="mb-3 text-sm text-indigo-950/55">
                Corrige les mots mal reconnus. Laisse une ligne vide entre deux paragraphes. (Pour un seul mot : touche-le, puis ✏️.)
              </p>
              <textarea
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                className="min-h-[50dvh] w-full resize-y rounded-2xl border border-indigo-100 bg-white/60 p-4 leading-relaxed outline-none focus:border-indigo-400"
                style={{ fontSize: Math.min(taillePx, 24), fontFamily: police.famille, color: fond.texte }}
              />
            </>
          ) : (
            <>
            {nbDouteux > 0 && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-900 ring-1 ring-orange-200/70">
                <span className="min-w-0 flex-1">
                  <b>{nbDouteux === 1 ? '1 mot à vérifier' : `${nbDouteux} mots à vérifier`}</b> (soulignés en pointillé) : {TOUCHE}-le, puis ✏️ s’il est mal écrit.
                </span>
                <button
                  onClick={() => majLecture(lecture.id, { douteux: [] }).catch(() => {})}
                  className="shrink-0 rounded-full bg-white px-3 py-1.5 font-semibold text-orange-800 shadow-sm"
                >
                  C’est bon
                </button>
              </div>
            )}
            <TexteLisible
              douteux={douteux}
              sonsMots={sonsMots}
              paragraphes={paragraphes}
              selection={selection}
              motActif={motActif}
              phraseActive={phraseActive}
              focus={reglages.focus}
              onToucherMot={toucherMot}
              onChoisirPlage={choisirPlage}
              onFinPlage={finPlage}
              taillePx={taillePx}
              famille={police.famille}
              interligne={interligne}
              espacement={espacement}
              couleur={fond.texte}
            />
            </>
          )}
        </section>
      </main>

      {edition === null && (
        <BarreLecture
          etat={lecteur.etat}
          resume={resume}
          aSelection={selection.a !== null}
          onEffacerSelection={effacerSelection}
          onPlay={play}
          onStop={lecteur.arreter}
          onRevenir={revenir}
          reglages={reglages}
          changer={changer}
          erreur={lecteur.erreur}
          preparationVoix={preparationVoix}
        />
      )}

      {bulle && motBulle && (
        <BulleMot
          key={`${bulle.type}-${bulle.index}`}
          passage={bulle.type === 'passage'}
          mot={motBulle}
          ancre={bulle.element}
          onLirePassage={lirePassage}
          onLireDIci={lireDIci}
          onEcouterMot={ecouterMot}
          onPhrase={lirePhrase}
          onCorriger={corrigerMot}
          onFermer={fermerBulle}
        />
      )}

      {panneau && (
        <PanneauAffichage
          reglages={reglages}
          changer={changer}
          onFermer={() => setPanneau(false)}
          sonsChargement={chargementSons}
        />
      )}

      {recadrage && (
        <Recadrage
          file={recadrage}
          onAnnuler={() => setRecadrage(null)}
          onValider={(f) => {
            setRecadrage(null)
            traiterPage(f)
          }}
        />
      )}

      {analyse && (
        <EcranAnalyse
          file={analyse.file}
          progression={analyse.progression}
          etape={analyse.etape}
          erreur={analyse.erreur}
          onFermer={() => setAnalyse(null)}
          onReprendre={() => {
            setAnalyse(null)
            nouvellePage.current?.click()
          }}
        />
      )}
    </div>
  )
}
