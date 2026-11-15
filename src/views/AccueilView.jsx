import { useMemo } from 'react'
import { GraduationCap, Bike, BookOpen, Stethoscope, Users } from 'lucide-react'
import { useComptabilite } from '../hooks/useComptabilite.js'
import { useEleves } from '../hooks/useEleves.js'
import { useMedecinEntries } from '../hooks/useMedecin.js'
import { useRemboursementsEntries, SENS_DOIS_PAYER } from '../hooks/useRemboursements.js'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import HistoriqueMoisRow, { POSTES } from '../components/accueil/HistoriqueMoisRow.jsx'
import RecapVolet, { ChiffreCle, Info } from '../components/accueil/RecapVolet.jsx'
import { PastilleEleve } from '../components/cours/Eleves.jsx'
import { formatEuros, formatMoisLabel } from '../utils/format.js'

const jourFormatter = new Intl.DateTimeFormat('fr-BE', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})

// "aujourd'hui", "demain" ou "jeudi 19 nov."
function quand(date) {
  const d = date?.toDate ? date.toDate() : new Date(date)
  const aujourdhui = new Date()
  const demain = new Date()
  demain.setDate(demain.getDate() + 1)
  if (d.toDateString() === aujourdhui.toDateString()) return "aujourd'hui"
  if (d.toDateString() === demain.toDateString()) return 'demain'
  return jourFormatter.format(d)
}

function pluriel(n, mot) {
  return `${n} ${mot}${n > 1 ? 's' : ''}`
}

export default function AccueilView() {
  const {
    loading,
    cours,
    anneeCourante,
    moisActuel,
    annee,
    ceMois,
    historique,
    recapCours,
    recapVelo,
    recapEtudes,
  } = useComptabilite()
  const { profilDe } = useEleves(cours, loading)
  const { entries: soins } = useMedecinEntries()
  const { entries: remboursements } = useRemboursementsEntries()

  // Médecin : remboursements mutuelle encore attendus + coût réel de l'année
  const recapMedecin = useMemo(() => {
    let attendu = 0
    let nbAttendus = 0
    let coutAnnee = 0
    for (const s of soins) {
      if (!s.paye && s.montantMutuelle > 0) {
        attendu += s.montantMutuelle
        nbAttendus += 1
      }
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date)
      if (d.getFullYear() === anneeCourante) coutAnnee += s.montantPaye - (s.montantMutuelle || 0)
    }
    return { attendu, nbAttendus, coutAnnee }
  }, [soins, anneeCourante])

  // Perso : ce qu'on me doit / ce que je dois (lignes pas encore payées)
  const recapPerso = useMemo(() => {
    let onMeDoit = 0
    let jeDois = 0
    for (const r of remboursements) {
      if (r.paye) continue
      if (r.sens === SENS_DOIS_PAYER) jeDois += r.montant
      else onMeDoit += r.montant
    }
    return { onMeDoit, jeDois }
  }, [remboursements])

  const maxMois = Math.max(0, ...historique.map(([, v]) => v.total))
  const nomMoisActuel = formatMoisLabel(moisActuel).split(' ')[0]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-5">Accueil</h1>

      {/* Total de l'année */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-5 mb-6 shadow-soft">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-100">
          Gagné en {anneeCourante}
        </p>
        <p className="text-4xl font-bold tabular-nums mt-1">{formatEuros(annee.total)}</p>
        <p className="text-sm text-brand-100 mt-1">
          dont <span className="font-semibold text-white">{formatEuros(ceMois.total)}</span> en{' '}
          {nomMoisActuel.toLowerCase()}
          {annee.prevu > 0 && <> · {formatEuros(annee.prevu)} déjà prévus d'ici fin d'année</>}
        </p>

        {annee.total > 0 && (
          <>
            <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden flex">
              {POSTES.map((p) =>
                annee.parPoste[p.key] > 0 ? (
                  <div
                    key={p.key}
                    className={p.couleur}
                    style={{ width: `${(annee.parPoste[p.key] / annee.total) * 100}%` }}
                  />
                ) : null
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {POSTES.map((p) => (
                <div key={p.key}>
                  <p className="flex items-center gap-1.5 text-xs text-brand-100">
                    <span className={`w-2 h-2 rounded-full ${p.couleur}`} />
                    {p.label}
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatEuros(annee.parPoste[p.key])}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Récap par volet */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <RecapVolet
            to="/maxence/compta/cours"
            icon={GraduationCap}
            titre="Cours particuliers"
            teinte="bg-brand-50 text-brand-600"
          >
            <ChiffreCle
              alerte={recapCours.presteNonPaye > 0}
              montant={formatEuros(recapCours.presteNonPaye)}
              libelle={`déjà presté, pas encore payé (${pluriel(recapCours.nbPresteNonPaye, 'cours')})`}
              toutBon="Tous les cours donnés sont payés"
            />
            {recapCours.parEleve.length > 0 && (
              <div className="flex flex-col gap-1 mt-2">
                {recapCours.parEleve.map((e) => (
                  <div key={e.nom} className="flex items-center gap-2 text-sm">
                    <PastilleEleve eleve={profilDe(e.nom)} />
                    <span className="flex-1 truncate text-slate-700">{e.nom}</span>
                    <span className="text-xs text-slate-400">{pluriel(e.nombre, 'cours')}</span>
                    <span className="font-medium text-slate-800 tabular-nums">
                      {formatEuros(e.montant)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Info>
              {recapCours.prochain ? (
                <>
                  Prochain : <span className="font-medium text-slate-700">{recapCours.prochain.eleve}</span>{' '}
                  {quand(recapCours.prochain.date)}
                </>
              ) : (
                'Aucun cours prévu'
              )}
              {' · '}
              {pluriel(recapCours.nbCeMois, 'cours')} en {nomMoisActuel.toLowerCase()}
            </Info>
          </RecapVolet>

          <RecapVolet
            to="/maxence/compta/etudes"
            icon={BookOpen}
            titre="Études"
            teinte="bg-amber-50 text-amber-600"
          >
            <ChiffreCle
              alerte={recapEtudes.presteNonPaye > 0}
              montant={formatEuros(recapEtudes.presteNonPaye)}
              libelle={`déjà presté, pas encore payé (${pluriel(recapEtudes.nbPresteNonPaye, 'étude')})`}
              toutBon="Toutes les études passées sont payées"
            />
            <Info>
              {pluriel(recapEtudes.nbCeMois, 'étude')} en {nomMoisActuel.toLowerCase()}
              {recapEtudes.prochaine && <> · Prochaine {quand(recapEtudes.prochaine.date)}</>}
            </Info>
          </RecapVolet>

          <RecapVolet
            to="/maxence/compta/velo"
            icon={Bike}
            titre="Vélo"
            teinte="bg-emerald-50 text-emerald-600"
          >
            <ChiffreCle
              alerte={recapVelo.nonPayeTermine > 0}
              montant={formatEuros(recapVelo.nonPayeTermine)}
              libelle={`mois terminés pas encore payés (${recapVelo.moisNonPayes} mois)`}
              toutBon="Tous les mois terminés sont payés"
            />
            <Info>
              {recapVelo.ceMoisEntree ? (
                <>
                  {nomMoisActuel} : {recapVelo.ceMoisEntree.allersRetours}{' '}
                  {recapVelo.ceMoisEntree.allersRetours > 1 ? 'allers-retours' : 'aller-retour'} ·{' '}
                  {formatEuros(recapVelo.ceMoisEntree.montant)}
                </>
              ) : (
                <span className="text-amber-600 font-medium">{nomMoisActuel} pas encore encodé</span>
              )}
              {recapVelo.kmAnnee > 0 && (
                <> · 🚲 {Math.round(recapVelo.kmAnnee).toLocaleString('fr-BE')} km en {anneeCourante}</>
              )}
            </Info>
          </RecapVolet>

          <RecapVolet
            to="/maxence/compta/medecin"
            icon={Stethoscope}
            titre="Médecin"
            teinte="bg-rose-50 text-rose-600"
          >
            <ChiffreCle
              alerte={recapMedecin.attendu > 0}
              montant={formatEuros(recapMedecin.attendu)}
              libelle={`attendus de la mutuelle (${pluriel(recapMedecin.nbAttendus, 'soin')})`}
              toutBon="Rien en attente de la mutuelle"
            />
            <Info>
              Coût réel en {anneeCourante} :{' '}
              <span className="font-medium text-slate-700">{formatEuros(recapMedecin.coutAnnee)}</span>
            </Info>
          </RecapVolet>

          <RecapVolet
            to="/maxence/compta/perso"
            icon={Users}
            titre="Perso"
            teinte="bg-violet-50 text-violet-600"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xl font-bold text-emerald-600 tabular-nums">
                  {formatEuros(recapPerso.onMeDoit)}
                </p>
                <p className="text-xs text-slate-500">on me doit</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-600 tabular-nums">
                  {formatEuros(recapPerso.jeDois)}
                </p>
                <p className="text-xs text-slate-500">je dois rembourser</p>
              </div>
            </div>
          </RecapVolet>
        </div>
      )}

      {/* Total par mois */}
      <Card>
        <h2 className="font-semibold text-slate-800 mb-1">Total par mois</h2>
        <p className="text-xs text-slate-400 mb-1">Cours, vélo et études</p>

        {!loading && historique.length === 0 && (
          <EmptyState
            title="Pas encore de données"
            description="Ajoute des cours, des trajets vélo ou des études pour voir ton historique ici."
          />
        )}

        {historique.map(([moisKey, valeurs]) => (
          <HistoriqueMoisRow
            key={moisKey}
            moisKey={moisKey}
            valeurs={valeurs}
            max={maxMois}
            enCours={moisKey === moisActuel}
          />
        ))}
      </Card>
    </div>
  )
}
