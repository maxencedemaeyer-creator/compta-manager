import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileUp, GitBranch, Loader2, Trash2, Users } from 'lucide-react'
import { useArbresGenealogiques } from '../../hooks/useGenealogie.js'
import { lireFichierTexte } from '../../utils/gedcom.js'

export default function GenealogieListeView() {
  const { arbres, loading, importerArbre, supprimerArbre } = useArbresGenealogiques()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState('')
  const [survol, setSurvol] = useState(false)

  async function importer(file) {
    if (!file) return
    if (!/\.ged$/i.test(file.name)) {
      setMessage('Choisis un fichier GEDCOM (extension .ged).')
      return
    }
    setEnCours(true)
    setMessage('')
    try {
      const texte = await lireFichierTexte(file)
      const nom = file.name.replace(/\.ged$/i, '').replace(/[_-]+/g, ' ')
      const id = await importerArbre(nom, texte)
      navigate(`/maxence/genealogie/${id}`)
    } catch (err) {
      console.error(err)
      setMessage(err.message || "L'import a échoué.")
    } finally {
      setEnCours(false)
    }
  }

  async function supprimer(e, arbre) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Supprimer l'arbre « ${arbre.nom} » et toutes ses photos ?`)) return
    await supprimerArbre(arbre.id)
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-white relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-0 w-96 h-96 rounded-full bg-rose-600/25 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
        <Link
          to="/maxence"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Maxence
        </Link>

        <div className="mt-8 mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400 flex items-center justify-center shadow-lg shrink-0">
            <GitBranch size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Arbre généalogique</h1>
            <p className="text-white/60 text-sm mt-1">Importe un fichier GEDCOM pour donner vie à ta famille.</p>
          </div>
        </div>

        {/* Zone d'import */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setSurvol(true)
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault()
            setSurvol(false)
            importer(e.dataTransfer.files?.[0])
          }}
          disabled={enCours}
          className={`w-full rounded-3xl border-2 border-dashed p-8 sm:p-10 flex flex-col items-center text-center transition-colors ${
            survol ? 'border-rose-400 bg-rose-500/10' : 'border-white/15 bg-white/[0.04] hover:bg-white/[0.07]'
          }`}
        >
          {enCours ? (
            <Loader2 size={32} className="animate-spin text-rose-300" />
          ) : (
            <FileUp size={32} className="text-rose-300" />
          )}
          <p className="font-medium mt-3">
            {enCours ? 'Import en cours…' : 'Importer un fichier GEDCOM (.ged)'}
          </p>
          <p className="text-xs text-white/50 mt-1">
            Geneanet, Heredis, MyHeritage… exporte ton arbre au format GEDCOM
          </p>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".ged,.GED"
          className="hidden"
          onChange={(e) => {
            importer(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {message && <p className="text-sm text-rose-300 mt-3">{message}</p>}

        {/* Arbres déjà importés */}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40 mt-10 mb-3">
          Mes arbres
        </h2>
        {loading ? (
          <p className="text-sm text-white/40">Chargement…</p>
        ) : arbres.length === 0 ? (
          <p className="text-sm text-white/40">Aucun arbre importé pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {arbres.map((a) => (
              <Link
                key={a.id}
                to={`/maxence/genealogie/${a.id}`}
                className="group rounded-2xl bg-white/[0.06] border border-white/10 p-4 hover:bg-white/[0.1] transition-colors flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Users size={20} className="text-rose-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate capitalize">{a.nom}</p>
                  <p className="text-xs text-white/50">
                    {a.nbPersonnes} personnes · {a.nbFamilles} familles
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => supprimer(e, a)}
                  className="p-2 rounded-lg text-white/30 hover:text-rose-300 hover:bg-white/10"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
