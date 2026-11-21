import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Carte, Etiquette, FicheSource, BlocRegle } from './ui.jsx'
import { CREDITS, NIVEAUX, SOURCES } from '../../data/coach/sources.js'
import { CHOIX_APPLI, RULES } from '../../data/coach/rules.js'

const MODULES = { training: 'Entraînement', nutrition: 'Nutrition', prevention: 'Prévention', progress: 'Progrès' }

export default function SourcesTab() {
  const [vue, setVue] = useState('regles')
  const groupes = {}
  for (const r of RULES) (groupes[r.module] ||= []).push(r)

  return (
    <div className="space-y-4">
      <Carte className="border-sky-200 bg-sky-50/60">
        <p className="text-base font-bold text-sky-900">Sources &amp; méthode</p>
        <p className="mt-1 text-sm leading-relaxed text-sky-900/80">
          Chaque règle de l’appli a au moins une source (un test automatique le vérifie). Quand c’est un choix de l’appli et pas de la science, c’est écrit « sans source ». Rien n’est donné « de mémoire » : ce qui n’a pas pu être vérifié est marqué « À vérifier ».
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.values(NIVEAUX).map((n) => (
            <Etiquette key={n.code} couleur={{ A: 'emerald', B: 'sky', C: 'violet', D: 'amber' }[n.code]}>
              {n.code} · {n.nom}
            </Etiquette>
          ))}
        </div>
      </Carte>

      <div className="flex gap-2">
        {[
          ['regles', `Règles (${RULES.length})`],
          ['sources', `Sources (${SOURCES.length})`],
          ['choix', 'Choix de l’appli'],
        ].map(([id, nom]) => (
          <button key={id} onClick={() => setVue(id)} className={`rounded-full px-3.5 py-2 text-sm font-semibold ${vue === id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {nom}
          </button>
        ))}
      </div>

      {vue === 'regles' &&
        Object.entries(groupes).map(([mod, liste]) => (
          <section key={mod} className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{MODULES[mod] || mod}</h3>
            {liste.map((r) => (
              <Carte key={r.id}>
                <BlocRegle regle={r} />
              </Carte>
            ))}
          </section>
        ))}

      {vue === 'sources' && (
        <div className="space-y-3">
          {SOURCES.map((s) => (
            <FicheSource key={s.id} source={s} />
          ))}
        </div>
      )}

      {vue === 'choix' && (
        <div className="space-y-3">
          <p className="px-1 text-sm text-slate-500">Ces choix rendent l’appli utilisable, mais ne sont pas des résultats scientifiques.</p>
          {CHOIX_APPLI.map((c) => (
            <Carte key={c.id}>
              <Etiquette couleur="slate">Sans source</Etiquette>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{c.texteFr}</p>
            </Carte>
          ))}
        </div>
      )}

      <Carte>
        <p className="mb-2 text-sm font-bold text-slate-800">Contenus réutilisés et licences</p>
        <ul className="space-y-2.5">
          {CREDITS.map((c) => (
            <li key={c.id} className="text-sm leading-relaxed text-slate-600">
              <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-sky-600">
                {c.nom} <ExternalLink size={13} />
              </a>
              <br />
              {c.note}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Coach est un outil d’information, pas un avis médical. Aucune donnée n’est vendue ; tes données sont dans ta base Firebase.
        </p>
      </Carte>
    </div>
  )
}
