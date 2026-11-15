import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, Images, Loader2, Search, X } from 'lucide-react'
import { useArbre } from '../../hooks/useGenealogie.js'
import { compresserPhoto } from '../../utils/image.js'
import { dates, nomComplet, normaliserNomFichier } from '../../utils/gedcom.js'
import ArbreSablier from '../../components/genealogie/ArbreSablier.jsx'
import ArbreEventail from '../../components/genealogie/ArbreEventail.jsx'
import FichePersonne from '../../components/genealogie/FichePersonne.jsx'

function normaliser(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Petit compteur "− 3 +"
function Compteur({ icone: Icone, valeur, min, max, onChange, titre }) {
  return (
    <div className="flex items-center rounded-xl bg-white/[0.07] border border-white/10" title={titre}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, valeur - 1))}
        className="w-8 h-9 text-white/60 hover:text-white"
      >
        −
      </button>
      <span className="flex items-center gap-1 text-sm text-white min-w-[2.5rem] justify-center">
        {Icone && <Icone size={14} className="text-white/50" />}
        {valeur}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, valeur + 1))}
        className="w-8 h-9 text-white/60 hover:text-white"
      >
        +
      </button>
    </div>
  )
}

export default function GenealogieArbreView() {
  const { arbreId } = useParams()
  const { meta, arbre, chargement, erreur, photos, photoDe, definirRacine, enregistrerPhoto, supprimerPhoto } =
    useArbre(arbreId)

  const [racine, setRacine] = useState(null)
  const [selection, setSelection] = useState(null)
  const [vue, setVue] = useState('arbre')
  const [genHaut, setGenHaut] = useState(3)
  const [genBas, setGenBas] = useState(2)
  const [genEventail, setGenEventail] = useState(5)
  const [recherche, setRecherche] = useState('')
  const [rechercheOuverte, setRechercheOuverte] = useState(false)
  const [importPhotos, setImportPhotos] = useState(false)
  const [notification, setNotification] = useState('')
  const inputPhotos = useRef(null)

  // Personne de départ : celle enregistrée dans Firebase
  useEffect(() => {
    if (!racine && arbre && meta?.racineId && arbre.personnes[meta.racineId]) {
      setRacine(meta.racineId)
    } else if (!racine && arbre) {
      setRacine(Object.keys(arbre.personnes)[0] || null)
    }
  }, [arbre, meta, racine])

  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => setNotification(''), 5000)
    return () => clearTimeout(t)
  }, [notification])

  const resultats = useMemo(() => {
    const q = normaliser(recherche.trim())
    if (!arbre || q.length < 2) return []
    return Object.values(arbre.personnes)
      .filter((p) => normaliser(`${p.prenom} ${p.nom} ${p.nom} ${p.prenom}`).includes(q))
      .slice(0, 12)
  }, [arbre, recherche])

  function centrer(id) {
    setRacine(id)
    setSelection(id)
  }

  // Import de plusieurs photos : association par nom de fichier
  async function importerPhotos(fichiers) {
    if (!fichiers?.length || !arbre) return
    setImportPhotos(true)
    const parFichier = {}
    const parNom = {}
    for (const p of Object.values(arbre.personnes)) {
      p.fichiersPhotos.forEach((f) => {
        parFichier[normaliserNomFichier(f)] = p.id
      })
      parNom[normaliser(`${p.prenom} ${p.nom}`).replace(/[^a-z0-9]+/g, ' ').trim()] = p.id
      parNom[normaliser(`${p.nom} ${p.prenom}`).replace(/[^a-z0-9]+/g, ' ').trim()] = p.id
    }
    let ok = 0
    const ignores = []
    for (const f of Array.from(fichiers)) {
      const cle = normaliserNomFichier(f.name)
      const id = parFichier[cle] || parNom[cle]
      if (!id) {
        ignores.push(f.name)
        continue
      }
      try {
        await enregistrerPhoto(id, await compresserPhoto(f))
        ok++
      } catch {
        ignores.push(f.name)
      }
    }
    setImportPhotos(false)
    setNotification(
      `${ok} photo${ok > 1 ? 's' : ''} associée${ok > 1 ? 's' : ''}.` +
        (ignores.length
          ? ` ${ignores.length} non reconnue${ignores.length > 1 ? 's' : ''} (nomme-les « Prénom Nom.jpg » ou ajoute-les depuis la fiche).`
          : '')
    )
  }

  if (erreur) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-rose-300">Impossible de charger l'arbre.</p>
        <Link to="/maxence/genealogie" className="text-sm text-white/60 underline">
          Retour à mes arbres
        </Link>
      </div>
    )
  }

  if (meta === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3 p-6">
        <p>Cet arbre n'existe plus.</p>
        <Link to="/maxence/genealogie" className="text-sm text-white/60 underline">
          Retour à mes arbres
        </Link>
      </div>
    )
  }

  if (chargement || !arbre || !racine) {
    return (
      <div className="min-h-screen bg-slate-950 text-white/60 flex items-center justify-center gap-2 text-sm">
        <Loader2 size={18} className="animate-spin" />
        Chargement de l'arbre…
      </div>
    )
  }

  return (
    <div className="h-screen h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* ---------- Barre du haut ---------- */}
      <header className="relative z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur px-3 sm:px-5 py-2.5 flex flex-wrap items-center gap-2 sm:gap-3">
        <Link
          to="/maxence/genealogie"
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1 sm:flex-none sm:max-w-[220px]">
          <p className="font-semibold truncate capitalize leading-tight">{meta.nom}</p>
          <p className="text-[11px] text-white/40">{meta.nbPersonnes} personnes</p>
        </div>

        {/* Recherche */}
        <div className="relative order-last sm:order-none w-full sm:w-auto sm:flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value)
              setRechercheOuverte(true)
            }}
            onFocus={() => setRechercheOuverte(true)}
            placeholder="Rechercher une personne…"
            className="w-full rounded-xl bg-white/[0.07] border border-white/10 pl-9 pr-8 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/30"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
          {rechercheOuverte && resultats.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
              {resultats.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    centrer(p.id)
                    setRecherche('')
                    setRechercheOuverte(false)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/[0.07] flex justify-between gap-3"
                >
                  <span className="text-sm truncate">{nomComplet(p)}</span>
                  <span className="text-xs text-white/40 shrink-0">{dates(p)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Choix de la vue */}
          <div className="flex rounded-xl bg-white/[0.07] border border-white/10 p-0.5">
            {[
              ['arbre', 'Arbre'],
              ['eventail', 'Éventail'],
            ].map(([cle, label]) => (
              <button
                key={cle}
                type="button"
                onClick={() => setVue(cle)}
                className={`px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${
                  vue === cle ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => inputPhotos.current?.click()}
            disabled={importPhotos}
            className="flex items-center gap-1.5 rounded-xl bg-white/[0.07] border border-white/10 px-3 h-9 text-sm text-white/80 hover:bg-white/[0.12]"
            title="Importer plusieurs photos (associées par nom de fichier)"
          >
            {importPhotos ? <Loader2 size={15} className="animate-spin" /> : <Images size={15} />}
            <span className="hidden md:inline">Photos</span>
          </button>
          <input
            ref={inputPhotos}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              importerPhotos(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </header>

      {/* ---------- Zone de dessin ---------- */}
      <div
        className="relative flex-1 min-h-0"
        onPointerDown={() => setRechercheOuverte(false)}
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        {vue === 'arbre' ? (
          <ArbreSablier
            arbre={arbre}
            racineId={racine}
            genHaut={genHaut}
            genBas={genBas}
            photoDe={photoDe}
            selectionId={selection}
            onSelect={setSelection}
            onRecentrer={centrer}
          />
        ) : (
          <ArbreEventail
            arbre={arbre}
            racineId={racine}
            generations={genEventail}
            photoDe={photoDe}
            selectionId={selection}
            onSelect={setSelection}
          />
        )}

        {/* Réglage des générations */}
        <div className="absolute left-3 bottom-3 sm:left-5 sm:bottom-5 z-10 flex gap-2 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur p-1.5 shadow-xl">
          {vue === 'arbre' ? (
            <>
              <Compteur icone={ChevronUp} valeur={genHaut} min={0} max={8} onChange={setGenHaut} titre="Générations d'ancêtres" />
              <Compteur icone={ChevronDown} valeur={genBas} min={0} max={6} onChange={setGenBas} titre="Générations de descendants" />
            </>
          ) : (
            <Compteur valeur={genEventail} min={2} max={7} onChange={setGenEventail} titre="Générations affichées" />
          )}
        </div>

        {notification && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[90%] rounded-2xl bg-white text-slate-900 text-sm px-4 py-2.5 shadow-2xl">
            {notification}
          </div>
        )}

        {/* ---------- Fiche de la personne ---------- */}
        {selection && (
          <>
            <div className="sm:hidden absolute inset-0 z-30 bg-black/40" onClick={() => setSelection(null)} />
            <aside className="absolute z-40 inset-x-0 bottom-0 h-[72%] rounded-t-3xl overflow-hidden border-t border-white/10 shadow-2xl sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:h-auto sm:w-[380px] sm:rounded-none sm:border-t-0 sm:border-l">
              <FichePersonne
                arbre={arbre}
                personneId={selection}
                racineEnregistree={meta.racineId}
                photoDe={photoDe}
                aPhotoImportee={Boolean(photos[selection])}
                onSelect={setSelection}
                onFermer={() => setSelection(null)}
                onCentrer={(id) => {
                  setRacine(id)
                  if (window.innerWidth < 640) setSelection(null)
                }}
                onDefinirRacine={definirRacine}
                onPhoto={enregistrerPhoto}
                onSupprimerPhoto={supprimerPhoto}
              />
            </aside>
          </>
        )}
      </div>
    </div>
  )
}
