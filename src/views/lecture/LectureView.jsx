import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookAudio, Camera, Images } from 'lucide-react'
import { usePin } from '../../context/PinContext.jsx'
import { creerLecture, useLectures } from '../../hooks/useLecture.js'
import EcranAnalyse from '../../components/lecture/EcranAnalyse.jsx'
import { chargerPolices } from '../../components/lecture/reglages.js'

// =============================================================
//  Lis-moi — écran d'accueil (public, pour les tablettes de la classe)
//  « Nouvelle lecture » = photo → texte reconnu → page de lecture.
//  En dessous : l'historique des lectures de la classe.
// =============================================================
function dateCourte(ts) {
  const d = ts?.toDate?.()
  if (!d) return ''
  return d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
}

export default function LectureView() {
  const { lectures, chargement } = useLectures()
  const { profilId, unlocked } = usePin()
  const navigate = useNavigate()
  const photo = useRef(null)
  const galerie = useRef(null)
  const [analyse, setAnalyse] = useState(null) // { file, progression, erreur }

  useEffect(() => {
    chargerPolices()
  }, [])

  const traiter = async (file) => {
    if (!file) return
    setAnalyse({ file, progression: 0, erreur: null })
    try {
      const id = await creerLecture(file, (p) => setAnalyse((a) => (a ? { ...a, progression: p } : a)))
      navigate(`/lecture/${id}`)
    } catch (e) {
      setAnalyse((a) => (a ? { ...a, erreur: e } : a))
    }
  }

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
            <p className="text-indigo-950/55">Prends un texte en photo, je te le lis.</p>
          </div>
        </header>

        {/* Nouvelle lecture */}
        <div className="mt-8 grid gap-3 sm:grid-cols-[2fr_1fr]">
          <button
            onClick={() => photo.current?.click()}
            className="group relative flex items-center gap-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 px-6 py-7 text-left text-white shadow-xl shadow-indigo-600/30 transition active:scale-[0.98]"
          >
            <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Camera size={34} />
            </span>
            <span>
              <span className="block text-2xl font-bold">Nouvelle lecture</span>
              <span className="block text-white/75">Prendre une photo du texte</span>
            </span>
          </button>
          <button
            onClick={() => galerie.current?.click()}
            className="flex items-center justify-center gap-3 rounded-[2rem] bg-white px-6 py-5 font-semibold text-indigo-800 shadow-sm ring-1 ring-indigo-950/5 transition active:scale-[0.98]"
          >
            <Images size={22} /> Choisir une image
          </button>
        </div>
        <input ref={photo} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
          traiter(e.target.files?.[0])
          e.target.value = ''
        }} />
        <input ref={galerie} type="file" accept="image/*" className="hidden" onChange={(e) => {
          traiter(e.target.files?.[0])
          e.target.value = ''
        }} />

        {/* Historique de la classe */}
        <h2 className="mb-4 mt-12 text-lg font-semibold text-indigo-950/70">Lectures de la classe</h2>
        {chargement ? (
          <p className="py-10 text-center text-indigo-950/40">Chargement…</p>
        ) : lectures.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-indigo-200 bg-white/60 px-6 py-12 text-center">
            <p className="text-5xl">📖</p>
            <p className="mt-3 text-lg font-semibold">Pas encore de lecture</p>
            <p className="mt-1 text-sm text-indigo-950/55">Touche « Nouvelle lecture » et photographie un texte.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {lectures.map((l) => (
              <li key={l.id}>
                <Link
                  to={`/lecture/${l.id}`}
                  className="block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-indigo-950/5 transition active:scale-[0.98] hover:shadow-md"
                >
                  <div className="aspect-[4/3] bg-indigo-50">
                    {l.miniature && <img src={l.miniature} alt="" className="h-full w-full object-cover" loading="lazy" />}
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
      </div>

      {analyse && (
        <EcranAnalyse
          file={analyse.file}
          progression={analyse.progression}
          erreur={analyse.erreur}
          onFermer={() => setAnalyse(null)}
          onReprendre={() => {
            setAnalyse(null)
            photo.current?.click()
          }}
        />
      )}
    </div>
  )
}
