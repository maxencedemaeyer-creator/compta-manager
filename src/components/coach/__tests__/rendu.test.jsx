// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import AujourdhuiTab from '../AujourdhuiTab.jsx'
import CalendrierTab from '../CalendrierTab.jsx'
import PlansTab from '../PlansTab.jsx'
import NutritionTab from '../NutritionTab.jsx'
import ProgresTab from '../ProgresTab.jsx'
import ProfilTab from '../ProfilTab.jsx'
import SourcesTab from '../SourcesTab.jsx'
import SeanceFenetre from '../SeanceFenetre.jsx'
import { BadgeSource } from '../ui.jsx'
import { PROFIL_PAR_DEFAUT } from '../../../data/coach/profil.js'
import { planCourse, planRenfo, planC25k } from '../../../lib/coach/plans.js'

// Écrans rendus sans erreur avec un vrai plan (profil de test de Max)
const profil = { ...PROFIL_PAR_DEFAUT, objectif: { ...PROFIL_PAR_DEFAUT.objectif, date: '2027-02-14' }, plusLongueDate: '2026-11-20' }
const plan = planCourse(profil, '2026-11-21')
const seances = plan.sessions.map((s, i) => ({ ...s, id: `s${i}`, planId: 'p', statut: i < 4 ? 'faite' : 'prevue', distanceReelleKm: i < 4 ? s.distanceKm : undefined, rpe: 5 }))
const planActif = { id: 'p', nom: 'Semi', type: 'course', resume: plan.resume, avertissements: plan.avertissements, actif: true }
const rendre = (el) => renderToString(<MemoryRouter>{el}</MemoryRouter>)

describe('écrans du Coach', () => {
  it('Aujourd’hui', () => {
    const html = rendre(<AujourdhuiTab profil={profil} seances={seances} planActif={planActif} onOuvrir={() => {}} onAjouterLibre={() => {}} allerA={() => {}} />)
    expect(html.replace(/<!-- -->/g, '')).toContain('Salut Max')
  })
  it('Aujourd’hui sans plan', () => {
    expect(rendre(<AujourdhuiTab profil={profil} seances={[]} planActif={null} onOuvrir={() => {}} onAjouterLibre={() => {}} allerA={() => {}} />)).toContain('Jour de repos')
  })
  it('Calendrier, Plans, Nutrition, Progrès', () => {
    expect(rendre(<CalendrierTab seances={seances} onOuvrir={() => {}} />)).toContain('lun')
    expect(rendre(<PlansTab profil={profil} plans={[planActif]} planActif={planActif} onGenerer={() => {}} onSupprimer={() => {}} allerA={() => {}} />)).toContain('Plan actif')
    expect(rendre(<NutritionTab profil={profil} seances={seances} />)).toContain('Glucides')
    expect(rendre(<ProgresTab seances={seances} />)).toContain('Kilomètres par semaine')
  })
  it('Profil et Sources', () => {
    expect(rendre(<ProfilTab profil={null} premiereFois onSauver={() => {}} />)).toContain('Bienvenue')
    const html = rendre(<SourcesTab />)
    expect(html).toContain('Sources')
  })
  it('Fiche de séance (course, renfo, avec spike)', () => {
    const longue = seances.find((s) => s.type === 'longue' && s.statut === 'prevue')
    expect(rendre(<SeanceFenetre seance={longue} seances={seances} profil={profil} onClose={() => {}} onMaj={() => {}} />)).toContain('Mon journal')
    const renfo = seances.find((s) => s.type === 'renfo')
    expect(rendre(<SeanceFenetre seance={renfo} seances={seances} profil={profil} onClose={() => {}} onMaj={() => {}} />)).toContain('Nordic')
  })
  it('Badge source', () => {
    expect(rendre(<BadgeSource regles={['spike-seance-10pct']} />)).toContain('Sources')
  })
  it('plans C25K et renfo se rendent', () => {
    for (const p of [planC25k(profil, '2026-11-21'), planRenfo(profil, '2026-11-21')]) {
      const s = p.sessions.map((x, i) => ({ ...x, id: `x${i}`, statut: 'prevue' }))
      expect(rendre(<CalendrierTab seances={s} onOuvrir={() => {}} />)).toBeTruthy()
    }
  })
})
