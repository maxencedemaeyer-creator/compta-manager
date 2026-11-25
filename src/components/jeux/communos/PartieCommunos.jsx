import { useEffect, useMemo, useRef, useState } from 'react'
import { Flag, Map as IconeCarte, ArrowDownUp, Flame, Snowflake, Sparkles, BookA } from 'lucide-react'
import CarteCommunos from '../CarteCommunos.jsx'
import { Confettis, Fenetre, Index } from './Communs.jsx'
import {
  autreNom,
  couleurChaleur,
  COULEUR_REVELEE,
  COULEUR_TROUVEE,
  distanceKm,
  formatKm,
  nom,
  suggestions as chercherSuggestions,
  trouverCommune,
} from '../../../utils/communos.js'

// =============================================================
//  Plateau de jeu COMMUNOS (saisie, carte, essais, légende)
//  Utilisé par le défi du jour et par les parties d'entraînement.
//
//  - cle        : identifiant de la partie (change à chaque nouvelle partie)
//  - zone       : null (toute la Belgique) ou une province (voir listeProvinces)
//  - idsEssais  : essais enregistrés sur Firebase
//  - onEnregistrer(nouveauxIds, trouve) / onAbandonner()
//  - finPartie  : contenu affiché quand la partie est terminée
// =============================================================
export default function PartieCommunos({ carte, cle, cible, zone, idsEssaisFirebase, abandonFirebase, onEnregistrer, onAbandonner, finPartie, infoZone = null }) {
  const [saisie, setSaisie] = useState('')
  const [message, setMessage] = useState(null) // { texte, ton }
  const [tremble, setTremble] = useState(false)
  const [triDistance, setTriDistance] = useState(true)
  const [reperes, setReperes] = useState(true)
  const [selection, setSelection] = useState(null)
  const [dernier, setDernier] = useState(null)
  const [fenetre, setFenetre] = useState(null) // 'index' | 'abandon'
  const [fete, setFete] = useState(false)
  const [erreurSauvegarde, setErreurSauvegarde] = useState(null)
  const [essaisLocaux, setEssaisLocaux] = useState(null) // affichage immédiat avant confirmation Firebase
  const [abandonLocal, setAbandonLocal] = useState(null)
  const champ = useRef(null)

  // Nouvelle partie : on repart de zéro
  useEffect(() => {
    setSaisie('')
    setMessage(null)
    setSelection(null)
    setDernier(null)
    setEssaisLocaux(null)
    setAbandonLocal(null)
    setErreurSauvegarde(null)
  }, [cle])

  const idsEssais = essaisLocaux?.cle === cle && essaisLocaux.ids.length > idsEssaisFirebase.length ? essaisLocaux.ids : idsEssaisFirebase
  const echelle = zone?.echelle || 200
  const communesZone = zone ? zone.communes : carte.communes
  const statut =
    cible && idsEssais.includes(cible.id) ? 'trouve' : abandonFirebase || abandonLocal === cle ? 'abandon' : 'en-cours'
  const fini = statut !== 'en-cours'

  const essais = useMemo(() => {
    if (!cible) return []
    return idsEssais
      .map((id, ordre) => {
        const c = carte.parId.get(id)
        return c ? { id, c, ordre, km: distanceKm(carte, c, cible) } : null
      })
      .filter(Boolean)
  }, [carte, cible, idsEssais])

  const essaisTries = useMemo(
    () => (triDistance ? [...essais].sort((a, b) => a.km - b.km || a.ordre - b.ordre) : [...essais].reverse()),
    [essais, triDistance]
  )
  const plusProche = essais.filter((e) => e.id !== cible?.id).reduce((m, e) => (m && m.km <= e.km ? m : e), null)
  const dejaEssayes = useMemo(() => new Set(idsEssais), [idsEssais])
  const exclus = useMemo(() => {
    if (!zone) return dejaEssayes
    const s = new Set(dejaEssayes)
    for (const c of carte.communes) if (!zone.ids.has(c.id)) s.add(c.id)
    return s
  }, [dejaEssayes, zone, carte])
  const propositions = useMemo(
    () => (!fini ? chercherSuggestions(carte, saisie, exclus) : []),
    [carte, saisie, exclus, fini]
  )

  function refuser(texte) {
    setMessage({ texte, ton: 'erreur' })
    setTremble(true)
    setTimeout(() => setTremble(false), 400)
  }

  async function proposer(commune) {
    if (fini || !cible) return
    const c = commune || trouverCommune(carte, saisie)
    if (!c) return refuser(saisie.trim() ? `« ${saisie.trim()} » n’est pas une commune belge` : 'Écris le nom d’une commune')
    if (zone && !zone.ids.has(c.id)) return refuser(`${nom(c)} n’est pas dans la zone : ${zone.court}`)
    if (dejaEssayes.has(c.id)) return refuser(`${nom(c)} : déjà essayé !`)

    const km = distanceKm(carte, c, cible)
    const nouveaux = [...idsEssais, c.id]
    const meilleurAvant = essais.length ? Math.min(...essais.map((e) => e.km)) : null
    const trouve = c.id === cible.id

    if (trouve) {
      setMessage({ texte: `🎉 Bravo ! La commune mystère était ${nom(c)} !`, ton: 'gagne' })
      setFete(true)
      setTimeout(() => setFete(false), 5000)
    } else if (km === 0) {
      setMessage({ texte: `🔥 Brûlant ! ${nom(c)} touche la commune mystère`, ton: 'chaud' })
    } else if (meilleurAvant === null) {
      setMessage({ texte: `${nom(c)} est à ${formatKm(km)} de la commune mystère`, ton: 'neutre' })
    } else if (km < meilleurAvant) {
      setMessage({ texte: `${nom(c)} : plus chaud ! (${formatKm(km)})`, ton: 'chaud' })
    } else if (km > meilleurAvant) {
      setMessage({ texte: `${nom(c)} : plus froid… (${formatKm(km)})`, ton: 'froid' })
    } else {
      setMessage({ texte: `${nom(c)} : aussi proche (${formatKm(km)})`, ton: 'neutre' })
    }

    setSaisie('')
    setDernier(c.id)
    setSelection(null)
    setEssaisLocaux({ cle, ids: nouveaux })
    setErreurSauvegarde(null)
    try {
      await onEnregistrer(nouveaux, trouve)
    } catch (e) {
      setErreurSauvegarde(e.message)
    }
  }

  async function abandonner() {
    setFenetre(null)
    setAbandonLocal(cle)
    setMessage({ texte: `La commune mystère était ${nom(cible)}.`, ton: 'revele' })
    try {
      await onAbandonner(idsEssais)
    } catch (e) {
      setErreurSauvegarde(e.message)
    }
  }

  const tonMessage = {
    erreur: 'text-rose-300',
    chaud: 'text-orange-300',
    froid: 'text-sky-300',
    gagne: 'text-emerald-300',
    revele: 'text-violet-300',
    neutre: 'text-white/80',
  }
  const iconeMessage = message?.ton === 'chaud' ? <Flame size={16} /> : message?.ton === 'froid' ? <Snowflake size={16} /> : null

  return (
    <>
      {fete && <Confettis />}

      {/* Bandeau de fin (fourni par le mode de jeu) */}
      {fini && cible && (
        <div className="mt-4">{finPartie({ statut, nbEssais: essais.length })}</div>
      )}

      {/* Carte */}
      <div className="mt-4 rounded-3xl p-[1.5px] bg-gradient-to-br from-fuchsia-500/60 via-indigo-500/30 to-cyan-400/60 shadow-2xl shadow-indigo-900/40">
        <div className="rounded-[22px] overflow-hidden bg-[radial-gradient(ellipse_at_center,#141a3a_0%,#0a0c22_70%)] p-2 sm:p-3">
          <CarteCommunos
            carte={carte}
            essais={essais}
            cible={cible}
            statut={statut}
            dernier={dernier}
            reperes={reperes}
            selection={selection}
            cadre={zone?.boite}
            actives={zone?.ids}
            echelle={echelle}
            onToucher={(id) => setSelection(id && (dejaEssayes.has(id) || (fini && id === cible?.id)) ? id : null)}
          />
        </div>
      </div>

      {/* Saisie */}
      {!fini && (
        <form
          className={`mt-3 relative ${tremble ? 'cm-tremble' : ''}`}
          onSubmit={(e) => {
            e.preventDefault()
            proposer(propositions.length === 1 ? propositions[0] : null)
          }}
        >
          <div className="flex gap-2">
            <input
              ref={champ}
              value={saisie}
              onChange={(e) => { setSaisie(e.target.value); setMessage(null) }}
              placeholder={essais.length ? 'Une autre commune…' : zone ? `Une commune · ${zone.court}` : 'Nom d’une commune belge'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="flex-1 min-w-0 rounded-2xl bg-white/[0.07] border border-white/15 px-4 py-3 text-base placeholder:text-white/35 outline-none focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-500/30 transition"
            />
            <button type="submit" className="rounded-2xl px-5 font-bold bg-gradient-to-r from-fuchsia-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30 active:scale-95 transition">
              Valider
            </button>
          </div>
          {propositions.length > 0 && (
            <ul className="absolute z-30 left-0 right-0 bottom-full mb-2 rounded-2xl bg-[#130f33] border border-white/15 shadow-2xl overflow-hidden">
              {propositions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => { proposer(c); champ.current?.focus() }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 active:bg-white/15 flex items-baseline gap-2"
                  >
                    <span className="font-semibold">{nom(c)}</span>
                    {autreNom(c) && <span className="text-sm text-white/45 truncate">{autreNom(c)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      )}

      {/* Message */}
      {message && (
        <div className="mt-3 min-h-[2.75rem] flex items-center justify-center text-center px-2">
          <p key={message.texte} className={`cm-apparait text-sm sm:text-base font-semibold inline-flex items-center gap-1.5 ${tonMessage[message.ton]}`}>
            {iconeMessage}
            {message.texte}
          </p>
        </div>
      )}

      {/* Options de la carte */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setReperes((r) => !r)}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 border transition ${reperes ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/10 text-white/50'}`}
        >
          <IconeCarte size={15} />
          Repères
        </button>
        <button type="button" onClick={() => setFenetre('index')} className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 border bg-white/10 border-white/20">
          <BookA size={15} />
          Index
        </button>
        {infoZone && <div className="flex-1 min-w-0 flex justify-end">{infoZone}</div>}
      </div>

      {erreurSauvegarde && (
        <p className="mt-3 rounded-2xl bg-rose-500/15 border border-rose-400/30 px-4 py-3 text-sm text-rose-200">
          Essai non enregistré : {erreurSauvegarde}
        </p>
      )}

      {/* Essais */}
      {essais.length > 0 && (
        <div className="mt-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="font-mono text-xs tracking-[0.25em] text-white/50">ESSAIS · {essais.length}</p>
              {plusProche && (
                <p className="text-sm mt-1">
                  Frontière la plus proche : <b className="text-orange-300">{formatKm(plusProche.km)}</b>
                </p>
              )}
            </div>
            <button type="button" onClick={() => setTriDistance((t) => !t)} className="inline-flex items-center gap-1.5 text-xs rounded-xl px-3 py-2 bg-white/[0.06] border border-white/10 hover:bg-white/10">
              <ArrowDownUp size={14} />
              {triDistance ? 'Par distance' : 'Par ordre'}
            </button>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {essaisTries.map((e) => {
              const estCible = e.id === cible?.id
              const couleur = estCible ? COULEUR_TROUVEE : couleurChaleur(e.km, echelle)
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setSelection(e.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left border transition ${
                      selection === e.id ? 'bg-white/[0.12] border-white/30' : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-md shrink-0 ring-1 ring-black/30" style={{ background: couleur, boxShadow: `0 0 12px ${couleur}` }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{nom(e.c)}</span>
                      <span className="block text-[11px] text-white/40 truncate">{e.c.prov}</span>
                    </span>
                    <span className={`text-sm font-bold tabular-nums ${estCible ? 'text-emerald-300' : 'text-white/70'}`}>
                      {estCible ? <Sparkles size={16} /> : e.km === 0 ? 'touche' : formatKm(e.km)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Légende */}
      <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/10 p-3">
        <div
          className="h-2.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${[0, 0.025, 0.075, 0.175, 0.35, 0.6, 1].map((f) => couleurChaleur(f * echelle, echelle)).join(',')})` }}
        />
        <div className="flex justify-between text-[11px] text-white/50 mt-1.5">
          <span>🔥 touche</span>
          <span>~{Math.round(echelle * 0.175)} km</span>
          <span>🧊 {Math.round(echelle)} km</span>
        </div>
        <div className="flex gap-4 text-[11px] text-white/50 mt-2">
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COULEUR_TROUVEE }} />Trouvée</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COULEUR_REVELEE }} />Révélée</span>
        </div>
      </div>

      {/* Abandonner : rarement utilisé, donc tout en bas */}
      {!fini && essais.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={() => setFenetre('abandon')} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-white/40 hover:text-white/75 border border-white/10 hover:border-white/20">
            <Flag size={14} />
            Abandonner la partie
          </button>
        </div>
      )}

      {fenetre === 'index' && (
        <Index
          communes={communesZone}
          essais={essais}
          cible={cible}
          fini={fini}
          echelle={echelle}
          onFermer={() => setFenetre(null)}
          onChoisir={(n) => {
            setSaisie(n)
            setMessage(null)
            setFenetre(null)
            setTimeout(() => champ.current?.focus(), 50)
          }}
        />
      )}
      {fenetre === 'abandon' && (
        <Fenetre titre="Abandonner ?" onFermer={() => setFenetre(null)}>
          <p className="text-white/70">La commune mystère sera révélée et la partie comptera comme perdue.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setFenetre(null)} className="rounded-2xl py-3 font-bold bg-white/10 hover:bg-white/15">
              Je continue
            </button>
            <button type="button" onClick={abandonner} className="rounded-2xl py-3 font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500">
              Révéler
            </button>
          </div>
        </Fenetre>
      )}
    </>
  )
}
