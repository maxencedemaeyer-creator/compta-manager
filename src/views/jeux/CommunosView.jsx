import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, HelpCircle, Flag, Trophy, RotateCcw } from 'lucide-react'
import Chargement from '../../components/Chargement.jsx'
import PartieCommunos from '../../components/jeux/communos/PartieCommunos.jsx'
import { BoutonIcone, Compteur, EnTete, Fenetre, FondPage, OngletsModes, Regles, useCarte, useMaintenant } from '../../components/jeux/communos/Communs.jsx'
import { useCommunos, useCommunosLibres } from '../../hooks/useCommunos.js'
import { communeDuJour, dateDuJour, nomComplet, statistiques } from '../../utils/communos.js'

// =============================================================
//  COMMUNOS · mode Belgique : la commune du jour (façon Globle)
//  Une commune parmi les 565, la même toute la journée.
//  Parties enregistrées sur Firebase (collection « communos »).
// =============================================================

function Stats({ stats, onFermer }) {
  const max = Math.max(1, ...stats.tranches.map((t) => t.n))
  const cases = [
    { v: stats.jouees, l: 'Jouées' },
    { v: `${stats.pourcentage}%`, l: 'Réussites' },
    { v: stats.serie, l: 'Série' },
    { v: stats.meilleureSerie, l: 'Meilleure série' },
  ]
  return (
    <Fenetre titre="Statistiques · défi du jour" onFermer={onFermer}>
      <div className="grid grid-cols-4 gap-2 text-center">
        {cases.map((c) => (
          <div key={c.l} className="rounded-2xl bg-white/[0.05] py-3">
            <p className="text-2xl font-black">{c.v}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/45 leading-tight mt-0.5">{c.l}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-white/[0.05] py-3">
          <p className="text-2xl font-black">{stats.record ?? '—'}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/45">Record d’essais</p>
        </div>
        <div className="rounded-2xl bg-white/[0.05] py-3">
          <p className="text-2xl font-black">{stats.moyenne ? stats.moyenne.toFixed(1).replace('.', ',') : '—'}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/45">Moyenne d’essais</p>
        </div>
      </div>
      <h3 className="mt-5 mb-2 font-mono text-xs tracking-[0.25em] text-white/60">ESSAIS POUR TROUVER</h3>
      <div className="space-y-1.5">
        {stats.tranches.map((t) => (
          <div key={t.label} className="flex items-center gap-2 text-sm">
            <span className="w-12 text-white/60 tabular-nums">{t.label}</span>
            <div className="flex-1 h-6 rounded-lg bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-400 flex items-center justify-end px-2 text-xs font-bold"
                style={{ width: `${Math.max(t.n ? 12 : 0, (t.n / max) * 100)}%` }}
              >
                {t.n > 0 ? t.n : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Fenetre>
  )
}

export default function CommunosView() {
  const navigate = useNavigate()
  const { carte, erreur } = useCarte()
  const { parties, loading, enregistrer } = useCommunos()
  const { libres, loading: chargeLibres } = useCommunosLibres()
  const maintenant = useMaintenant(30000)
  const date = dateDuJour(maintenant)
  const [fenetre, setFenetre] = useState(null) // 'regles' | 'stats'
  const reglesVues = useRef(false)

  const partie = parties.find((p) => p.id === date)
  const cible = carte ? communeDuJour(carte, date) : null
  const stats = useMemo(() => statistiques(parties, date), [parties, date])

  // Règles affichées automatiquement à la toute première partie
  useEffect(() => {
    if (!loading && !chargeLibres && carte && !reglesVues.current) {
      reglesVues.current = true
      if (parties.length === 0 && libres.length === 0) setFenetre('regles')
    }
  }, [loading, chargeLibres, carte, parties.length, libres.length])

  if (erreur) {
    return <FondPage><p className="text-center py-20">Impossible de charger la carte. Vérifie ta connexion et recharge la page.</p></FondPage>
  }
  if (!carte || loading) return <Chargement message="Chargement de la carte de Belgique…" />

  return (
    <FondPage>
      <EnTete retour="/maxence/jeux" sousTitre="LA COMMUNE DU JOUR">
        <BoutonIcone label="Règles" onClick={() => setFenetre('regles')}><HelpCircle size={18} /></BoutonIcone>
        <BoutonIcone label="Statistiques" onClick={() => setFenetre('stats')}><BarChart3 size={18} /></BoutonIcone>
      </EnTete>
      <OngletsModes actif="belgique" />

      <PartieCommunos
        carte={carte}
        cle={date}
        cible={cible}
        zone={null}
        idsEssaisFirebase={partie?.essais || []}
        abandonFirebase={!!partie?.abandon}
        onEnregistrer={(essais, trouve) => enregistrer(date, { cible: cible.id, essais, trouve, abandon: false })}
        onAbandonner={(essais) => enregistrer(date, { cible: cible.id, essais, trouve: false, abandon: true })}
        finPartie={({ statut, nbEssais }) => (
          <div className={`cm-apparait mb-4 rounded-3xl p-[2px] bg-gradient-to-r ${statut === 'trouve' ? 'from-emerald-400 via-cyan-400 to-fuchsia-500' : 'from-violet-500 to-fuchsia-500'}`}>
            <div className="rounded-[22px] bg-[#0d0a24] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${statut === 'trouve' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500/20 text-violet-300'}`}>
                  {statut === 'trouve' ? <Trophy size={24} /> : <Flag size={22} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    {statut === 'trouve' ? `Trouvée en ${nbEssais} essai${nbEssais > 1 ? 's' : ''}` : 'Commune révélée'}
                  </p>
                  <p className="text-xl font-black truncate">{nomComplet(cible)}</p>
                  <p className="text-sm text-white/55 truncate">{cible.prov}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-2.5 text-sm">
                <span className="text-white/60">Prochain défi dans</span>
                <span className="font-bold text-cyan-300"><Compteur /></span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/maxence/jeux/communos/libre')}
                className="mt-3 w-full rounded-2xl py-3 font-bold bg-gradient-to-r from-fuchsia-500 to-indigo-500 shadow-lg shadow-fuchsia-500/30 active:scale-[0.98] transition inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Rejouer (partie libre)
              </button>
            </div>
          </div>
        )}
      />

      {fenetre === 'regles' && <Regles carte={carte} onFermer={() => setFenetre(null)} />}
      {fenetre === 'stats' && <Stats stats={stats} onFermer={() => setFenetre(null)} />}
    </FondPage>
  )
}
