import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AArrowDown, AArrowUp, ArrowLeft, Check, FilePlus2, Pencil, Trash2, Type, X } from 'lucide-react'
import { ajouterPage, modifierTexte, supprimerLecture, useLecture } from '../../hooks/useLecture.js'
import { decouperMots, motALaPosition } from '../../utils/lecture.js'
import { TAILLES_TEXTE, VITESSES } from '../../config/lectureVoix.js'
import TexteLisible from '../../components/lecture/TexteLisible.jsx'
import BarreLecture from '../../components/lecture/BarreLecture.jsx'
import PhotoPages from '../../components/lecture/PhotoPages.jsx'
import EcranAnalyse from '../../components/lecture/EcranAnalyse.jsx'
import useLecteur from '../../components/lecture/useLecteur.js'
import { POLICES, chargerPolices, useReglages } from '../../components/lecture/reglages.js'

// =============================================================
//  Lis-moi — page de lecture
//  Photo (à gauche en paysage, en haut en portrait) + texte reconnu.
//  Choisir un passage : toucher le premier mot, puis le dernier.
//  ▶ lit le passage (ou tout le texte), le mot prononcé est surligné.
// =============================================================
const SANS_SELECTION = { a: null, b: null }

function BoutonOutil({ onClick, label, children, actif = false }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
        actif ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-800 shadow-sm ring-1 ring-indigo-950/5 active:bg-indigo-50'
      }`}
    >
      {children}
    </button>
  )
}

export default function LectureDetailView() {
  const { lectureId } = useParams()
  const navigate = useNavigate()
  const lecture = useLecture(lectureId)
  const { reglages, changer, taillePx } = useReglages()
  const [selection, setSelection] = useState(SANS_SELECTION)
  const [edition, setEdition] = useState(null) // texte en cours de correction
  const [enregistrement, setEnregistrement] = useState(false)
  const [analyse, setAnalyse] = useState(null) // ajout d'une page
  const nouvellePage = useRef(null)

  useEffect(() => {
    chargerPolices()
  }, [])

  const texte = lecture?.texte || ''
  const { paragraphes, mots } = useMemo(() => decouperMots(texte), [texte])
  const lecteur = useLecteur(texte)
  const motActif = lecteur.position < 0 || mots.length === 0 ? -1 : motALaPosition(mots, lecteur.position)

  // Le texte change (correction, nouvelle page) : on repart de zéro
  useEffect(() => {
    lecteur.arreter()
    setSelection(SANS_SELECTION)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texte])

  if (lecture === undefined) {
    return <div className="min-h-[100dvh] bg-[#fbf7f0]" />
  }
  if (lecture === null) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#fbf7f0] text-indigo-950">
        <p className="text-lg">Cette lecture n’existe plus.</p>
        <Link to="/lecture" className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white">Retour aux lectures</Link>
      </div>
    )
  }

  // ---------- Sélection : premier mot, puis dernier mot ----------
  const toucherMot = (i) => {
    if (lecteur.etat !== 'arret') lecteur.arreter()
    setSelection((s) => {
      if (s.a === null) return { a: i, b: null }
      if (s.b === null) return { a: s.a, b: i }
      return { a: i, b: null }
    })
  }

  let debut = 0
  let fin = texte.length
  let resume = 'Tout le texte · touche un mot pour choisir un passage'
  if (selection.a !== null && mots[selection.a]) {
    if (selection.b === null) {
      debut = mots[selection.a].debut
      resume = `À partir de « ${mots[selection.a].texte} » · touche le dernier mot`
    } else {
      const i = Math.min(selection.a, selection.b)
      const j = Math.max(selection.a, selection.b)
      debut = mots[i].debut
      fin = mots[j].fin
      const n = j - i + 1
      resume = n === 1 ? `Le mot « ${mots[i].texte} »` : `Passage choisi : ${n} mots`
    }
  }

  const play = () => {
    if (lecteur.etat === 'lecture') return lecteur.pause()
    if (lecteur.etat === 'pause') return lecteur.reprendre()
    if (lecteur.etat === 'chargement') return
    const vitesse = VITESSES.find((v) => v.id === reglages.vitesse)?.valeur ?? -8
    lecteur.lire(debut, fin, { voix: reglages.voix, vitesse })
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
    if (!file) return
    setAnalyse({ file, progression: 0, erreur: null })
    try {
      await ajouterPage(lecture, file, (p) => setAnalyse((a) => (a ? { ...a, progression: p } : a)))
      setAnalyse(null)
    } catch (e) {
      setAnalyse((a) => (a ? { ...a, erreur: e } : a))
    }
  }

  const police = POLICES[reglages.police] || POLICES.lexend

  return (
    <div className="min-h-[100dvh] bg-[#fbf7f0] text-indigo-950" style={{ fontFamily: "'Lexend', system-ui, sans-serif" }}>
      {/* En-tête */}
      <header className="sticky top-0 z-20 border-b border-indigo-950/5 bg-[#fbf7f0]/85 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Link
            to="/lecture"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-indigo-800 shadow-sm ring-1 ring-indigo-950/5"
            aria-label="Retour aux lectures"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="hidden min-w-0 flex-1 truncate px-1 text-lg font-semibold sm:block">{lecture.titre}</h1>
          <span className="flex-1 sm:hidden" />
          {edition === null ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <BoutonOutil label="Texte plus petit" onClick={() => changer({ taille: Math.max(0, reglages.taille - 1) })}>
                <AArrowDown size={20} />
              </BoutonOutil>
              <BoutonOutil label="Texte plus grand" onClick={() => changer({ taille: Math.min(TAILLES_TEXTE.length - 1, reglages.taille + 1) })}>
                <AArrowUp size={20} />
              </BoutonOutil>
              <BoutonOutil
                label={`Police : ${police.nom}`}
                actif={reglages.police === 'andika'}
                onClick={() => changer({ police: reglages.police === 'andika' ? 'lexend' : 'andika' })}
              >
                <Type size={19} />
              </BoutonOutil>
              <span className="mx-0.5 hidden h-6 w-px bg-indigo-950/10 sm:block" />
              <BoutonOutil
                label="Corriger le texte"
                onClick={() => {
                  lecteur.arreter()
                  setEdition(texte)
                }}
              >
                <Pencil size={18} />
              </BoutonOutil>
              <BoutonOutil label="Ajouter une page" onClick={() => nouvellePage.current?.click()}>
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
        capture="environment"
        className="hidden"
        onChange={(e) => {
          traiterPage(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {/* Photo + texte */}
      <main className="mx-auto grid max-w-6xl gap-4 px-3 pt-4 sm:px-5 md:landscape:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <PhotoPages
          lectureId={lecture.id}
          pages={lecture.pages || 1}
          className="h-[26dvh] md:landscape:sticky md:landscape:top-[4.75rem] md:landscape:h-[calc(100dvh-6rem-9rem)] lg:sticky lg:top-[4.75rem] lg:h-[calc(100dvh-6rem-9rem)]"
        />

        <section className="rounded-[2rem] bg-white px-5 py-6 shadow-sm ring-1 ring-indigo-950/5 sm:px-8 sm:py-8 mb-44">
          {edition !== null ? (
            <>
              <p className="mb-3 text-sm text-indigo-950/55">Corrige les mots mal reconnus. Laisse une ligne vide entre deux paragraphes.</p>
              <textarea
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                className="min-h-[50dvh] w-full resize-y rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 leading-relaxed outline-none focus:border-indigo-400"
                style={{ fontSize: Math.min(taillePx, 24), fontFamily: police.famille }}
              />
            </>
          ) : (
            <TexteLisible
              paragraphes={paragraphes}
              selection={selection}
              motActif={motActif}
              onToucherMot={toucherMot}
              taillePx={taillePx}
              famille={police.famille}
            />
          )}
        </section>
      </main>

      {edition === null && (
        <BarreLecture
          etat={lecteur.etat}
          resume={resume}
          aSelection={selection.a !== null}
          onEffacerSelection={() => {
            lecteur.arreter()
            setSelection(SANS_SELECTION)
          }}
          onPlay={play}
          onStop={lecteur.arreter}
          reglages={reglages}
          changer={changer}
          erreur={lecteur.erreur}
        />
      )}

      {analyse && (
        <EcranAnalyse
          file={analyse.file}
          progression={analyse.progression}
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
