import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookAudio, Camera, FileText, Image as ImageIcon, X } from 'lucide-react'
import { usePin } from '../../context/PinContext.jsx'
import { creerLecture, useLectures } from '../../hooks/useLecture.js'
import { ACCEPT_DOCUMENT } from '../../utils/document.js'
import { nettoyerMemoireVoix, useQuotaVoix } from '../../utils/voixQuota.js'
import EcranAnalyse from '../../components/lecture/EcranAnalyse.jsx'
import Recadrage from '../../components/lecture/Recadrage.jsx'
import { chargerPolices } from '../../components/lecture/reglages.js'

// =============================================================
//  Lis-moi — écran d'accueil (public, pour les tablettes de la classe)
//  Deux choix :
//   - Photo    → « Prendre une photo » ou « Choisir dans la galerie »
//   - Document → fichier de la tablette / de l'ordinateur (PDF, Word, texte)
//  En dessous : l'historique des lectures de la classe.
// =============================================================
function dateCourte(ts) {
  const d = ts?.toDate?.()
  if (!d) return ''
  return d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
}

const ETIQUETTE_SOURCE = { pdf: 'PDF', word: 'Word', texte: 'Texte' }

function GrandChoix({ onClick, icone: Icone, titre, detail, couleur }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-5 overflow-hidden rounded-[2rem] bg-gradient-to-br ${couleur} px-6 py-7 text-left text-white shadow-xl transition active:scale-[0.98]`}
    >
      <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
        <Icone size={34} />
      </span>
      <span className="relative">
        <span className="block text-2xl font-bold">{titre}</span>
        <span className="block text-white/80">{detail}</span>
      </span>
    </button>
  )
}

export default function LectureView() {
  const { lectures, chargement } = useLectures()
  const { profilId, unlocked } = usePin()
  const quota = useQuotaVoix()
  const navigate = useNavigate()
  const entrees = { camera: useRef(null), galerie: useRef(null), document: useRef(null) }
  const [menuPhoto, setMenuPhoto] = useState(false)
  const [analyse, setAnalyse] = useState(null) // { file, origine, progression, erreur }
  const [recadrage, setRecadrage] = useState(null) // { file, origine } : photo à recadrer avant lecture

  useEffect(() => {
    chargerPolices()
    nettoyerMemoireVoix().catch(() => {})
  }, [])

  const ouvrir = (origine) => {
    setMenuPhoto(false)
    entrees[origine].current?.click()
  }

  const traiter = async (file, origine) => {
    if (!file) return
    setAnalyse({ file, origine, progression: 0, erreur: null })
    try {
      const id = await creerLecture(file, (p, etape) => setAnalyse((a) => (a ? { ...a, progression: p, etape: etape ?? a.etape } : a)))
      navigate(`/lecture/${id}`)
    } catch (e) {
      setAnalyse((a) => (a ? { ...a, erreur: e } : a))
    }
  }

  const entree = (origine, props) => (
    <input
      ref={entrees[origine]}
      type="file"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        // Une photo passe d'abord par le recadrage ; un document est lu directement
        if (origine === 'document') traiter(file, origine)
        else setRecadrage({ file, origine })
      }}
      {...props}
    />
  )

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#fbf7f0] text-indigo-950" style={{ fontFamily: "'Lexend', system-ui, sans-serif" }}>
      <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-64 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8">
        {profilId && unlocked && (
          <Link to={`/${profilId}`} className="inline-flex items-center gap-1.5 text-sm text-indigo-950/50 hover:text-indigo-950">
            <ArrowLeft size={16} /> Mon espace
          </Link>
        )}

        <header className="mt-4 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/30">
            <BookAudio size={30} />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Lis-moi</h1>
            <p className="text-indigo-950/55">Une photo ou un document : je te le lis.</p>
          </div>
        </header>

        {/* Les deux choix */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <GrandChoix
            onClick={() => setMenuPhoto(true)}
            icone={Camera}
            titre="Photo"
            detail="Prendre une photo ou choisir dans la galerie"
            couleur="from-indigo-500 via-indigo-600 to-violet-600 shadow-indigo-600/30"
          />
          <GrandChoix
            onClick={() => ouvrir('document')}
            icone={FileText}
            titre="Document"
            detail="PDF, Word ou texte, depuis l’appareil"
            couleur="from-sky-500 via-sky-600 to-indigo-600 shadow-sky-600/30"
          />
        </div>
        {entree('camera', { accept: 'image/*', capture: 'environment' })}
        {entree('galerie', { accept: 'image/*' })}
        {entree('document', { accept: ACCEPT_DOCUMENT })}

        {/* Historique de la classe */}
        <h2 className="mb-4 mt-12 text-lg font-semibold text-indigo-950/70">Lectures de la classe</h2>
        {chargement ? (
          <p className="py-10 text-center text-indigo-950/40">Chargement…</p>
        ) : lectures.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-indigo-200 bg-white/60 px-6 py-12 text-center">
            <p className="text-5xl">📖</p>
            <p className="mt-3 text-lg font-semibold">Pas encore de lecture</p>
            <p className="mt-1 text-sm text-indigo-950/55">Choisis « Photo » ou « Document » pour commencer.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {lectures.map((l) => (
              <li key={l.id}>
                <Link
                  to={`/lecture/${l.id}`}
                  className="block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-indigo-950/5 transition active:scale-[0.98] hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-indigo-50">
                    {l.miniature ? (
                      <img src={l.miniature} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-100 text-indigo-400">
                        <FileText size={44} />
                      </div>
                    )}
                    {ETIQUETTE_SOURCE[l.source] && (
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 shadow-sm">
                        {ETIQUETTE_SOURCE[l.source]}
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <p className="line-clamp-2 min-h-[2.75em] font-semibold leading-snug">{l.titre}</p>
                    <p className="mt-1 text-xs text-indigo-950/45">
                      {dateCourte(l.creeLe)}
                      {l.pages > 1 ? ` · ${l.pages} pages` : ''}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Jauge de la voix gratuite du mois */}
        {quota.pourcent !== null && (
          <div className="mx-auto mt-12 max-w-sm text-center text-xs text-indigo-950/45">
            <p>Voix gratuite ce mois-ci : {quota.pourcent} % utilisés</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-indigo-100">
              <div
                className={`h-full rounded-full ${quota.pourcent >= 90 ? 'bg-rose-500' : quota.pourcent >= 70 ? 'bg-amber-400' : 'bg-indigo-400'}`}
                style={{ width: `${Math.max(2, quota.pourcent)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Menu « Photo » */}
      {menuPhoto && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-indigo-950/30 p-3 backdrop-blur-sm sm:items-center" onClick={() => setMenuPhoto(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[2rem] bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              <p className="text-lg font-bold">Photo</p>
              <button onClick={() => setMenuPhoto(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-700" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-2">
              <button onClick={() => ouvrir('camera')} className="flex items-center gap-4 rounded-3xl bg-indigo-50 px-5 py-5 text-left active:bg-indigo-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <Camera size={24} />
                </span>
                <span>
                  <span className="block text-lg font-semibold">Prendre une photo</span>
                  <span className="block text-sm text-indigo-950/55">Photographie le texte bien à plat</span>
                </span>
              </button>
              <button onClick={() => ouvrir('galerie')} className="flex items-center gap-4 rounded-3xl bg-indigo-50 px-5 py-5 text-left active:bg-indigo-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white">
                  <ImageIcon size={24} />
                </span>
                <span>
                  <span className="block text-lg font-semibold">Choisir dans la galerie</span>
                  <span className="block text-sm text-indigo-950/55">Une photo déjà prise</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {recadrage && (
        <Recadrage
          file={recadrage.file}
          onAnnuler={() => setRecadrage(null)}
          onValider={(f) => {
            const { origine } = recadrage
            setRecadrage(null)
            traiter(f, origine)
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
            const origine = analyse.origine
            setAnalyse(null)
            entrees[origine].current?.click()
          }}
        />
      )}
    </div>
  )
}
