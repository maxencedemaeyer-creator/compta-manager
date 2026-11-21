import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Droplets, Flame, Wheat, Beef } from 'lucide-react'
import { Carte, BadgeSource, Etiquette, couleurType, km1, formatDuree } from './ui.jsx'
import { macrosDuJour, planRavitaillement, CLASSES_CHARGE } from '../../lib/coach/nutrition.js'
import { aujourdhui, ajouterJours, formatLong } from '../../lib/coach/dates.js'

function Tuile({ icone: Icone, titre, valeur, detail, couleur, regles }) {
  return (
    <Carte className="!p-3.5">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${couleur}`}>
          <Icone size={18} />
        </span>
        <BadgeSource regles={regles} />
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{titre}</p>
      <p className="text-xl font-extrabold leading-tight text-slate-900">{valeur}</p>
      <p className="mt-0.5 text-xs leading-snug text-slate-500">{detail}</p>
    </Carte>
  )
}

export default function NutritionTab({ profil, seances }) {
  const [jour, setJour] = useState(aujourdhui())
  const duJour = useMemo(() => seances.filter((s) => s.date === jour && s.statut !== 'sautee'), [seances, jour])
  const m = useMemo(() => macrosDuJour({ profil, seances: duJour }), [profil, duJour])
  const classe = CLASSES_CHARGE[m.classe]
  const longues = duJour.map((s) => ({ s, p: planRavitaillement(s) })).filter((x) => x.p)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setJour(ajouterJours(jour, -1))} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Jour précédent">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-base font-bold capitalize text-slate-800">{jour === aujourdhui() ? 'Aujourd’hui' : formatLong(jour)}</p>
          <p className="text-xs text-slate-400">
            {classe.nom} · {classe.detail}
          </p>
        </div>
        <button onClick={() => setJour(ajouterJours(jour, 1))} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Jour suivant">
          <ChevronRight size={20} />
        </button>
      </div>

      {duJour.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {duJour.map((s) => (
            <span key={s.id} className={`rounded-full px-3 py-1 text-xs font-semibold ${couleurType(s.type).fond} ${couleurType(s.type).texte}`}>
              {s.titre}
              {s.dureeMin ? ` · ${formatDuree(s.dureeMin)}` : ''}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Tuile
          icone={Flame}
          titre="Énergie"
          valeur={`≈ ${m.energie.total.toLocaleString('fr-BE')} kcal`}
          detail={`Base ${m.energie.base.toLocaleString('fr-BE')} + séances ${m.energie.seances.toLocaleString('fr-BE')}`}
          couleur="bg-orange-100 text-orange-700"
          regles={['bmr-mifflin', 'depense-met']}
        />
        <Tuile
          icone={Wheat}
          titre="Glucides"
          valeur={`${m.glucides.grammes[0]}-${m.glucides.grammes[1]} g`}
          detail={`${m.glucides.gkg[0]} à ${m.glucides.gkg[1]} g par kg`}
          couleur="bg-amber-100 text-amber-700"
          regles={['glucides-jour']}
        />
        <Tuile
          icone={Beef}
          titre="Protéines"
          valeur={`${m.proteines.grammes[0]}-${m.proteines.grammes[1]} g`}
          detail={`Par prise : environ ${m.proteines.parPriseCibleG} g`}
          couleur="bg-rose-100 text-rose-700"
          regles={['proteines-jour']}
        />
        <Tuile
          icone={Droplets}
          titre="Eau"
          valeur={`Perte < ${km1(m.eau.perteMaxKg)} kg`}
          detail="Pèse-toi avant et après une séance : plus de 2 % perdus = bois davantage"
          couleur="bg-sky-100 text-sky-700"
          regles={['hydratation']}
        />
      </div>

      {longues.map(({ s, p }) => (
        <Carte key={s.id} className="border-sky-100 bg-sky-50/60">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-sky-900">Ravitaillement · {s.titre}</p>
            <BadgeSource regles={p.regles} />
          </div>
          <p className="mt-1 text-sm text-sky-900">
            {p.glucidesGh[0]} à {p.glucidesGh[1]} g de glucides par heure, soit {p.totalG[0]} à {p.totalG[1]} g sur la séance.
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-sky-900/80">
            {p.conseils.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Carte>
      ))}

      <Carte>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">Comment c’est calculé</p>
          <Etiquette couleur="amber">Estimation</Etiquette>
        </div>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">
          <li>
            Métabolisme de base : <strong>{m.energie.bmr.toLocaleString('fr-BE')} kcal</strong> (formule de Mifflin-St Jeor).
          </li>
          <li>
            × {m.energie.facteur} pour la vie de tous les jours = <strong>{m.energie.base.toLocaleString('fr-BE')} kcal</strong>.
          </li>
          <li>
            Séances : <strong>{m.energie.seances.toLocaleString('fr-BE')} kcal</strong> (valeurs MET, estimation à ± plusieurs centaines de kcal).
          </li>
          <li>Les glucides dépendent de la charge du jour ; les protéines de ton poids ({profil.poidsKg} kg).</li>
        </ul>
        <p className="mt-2 text-xs text-slate-400">Repères généraux pour adulte en bonne santé, pas un avis diététique ou médical. Le journal alimentaire (table Ciqual) n’est pas encore là.</p>
      </Carte>
    </div>
  )
}
