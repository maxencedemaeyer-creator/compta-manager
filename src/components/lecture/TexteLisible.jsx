import { memo, useEffect, useRef } from 'react'

// =============================================================
//  Appli « Lis-moi » : le texte reconnu, mot par mot
//  - toucher un mot → onToucherMot(index)
//  - les mots de la sélection sont colorés en bleu
//  - le mot prononcé est surligné en jaune (géré directement dans
//    la page pour rester fluide, même sur un long texte)
// =============================================================
const Paragraphe = memo(function Paragraphe({ morceaux, debutSel, finSel }) {
  return (
    <p className="mb-[0.9em] last:mb-0">
      {morceaux.map((m, k) => {
        const dansSel = (x) => x?.mot && debutSel !== null && x.index >= debutSel && x.index <= finSel
        if (!m.mot) {
          // espace / ponctuation entre deux mots choisis : coloré aussi (bande continue)
          const lie = dansSel(morceaux[k - 1]) && dansSel(morceaux[k + 1])
          return (
            <span key={k} className={lie ? 'bg-sky-200/80' : undefined}>
              {m.texte}
            </span>
          )
        }
        const dedans = dansSel(m)
        const bord = dedans && (m.index === debutSel || m.index === finSel)
        return (
          <span
            key={k}
            data-i={m.index}
            className={`mot cursor-pointer rounded-[0.3em] px-[0.06em] -mx-[0.06em] transition-colors duration-150 ${
              dedans ? (bord ? 'bg-sky-300/80' : 'bg-sky-200/80') : 'hover:bg-indigo-100/70'
            }`}
          >
            {m.texte}
          </span>
        )
      })}
    </p>
  )
})

export default function TexteLisible({ paragraphes, selection, motActif, onToucherMot, taillePx, famille }) {
  const boite = useRef(null)
  const precedent = useRef(null)

  // Bornes de la sélection (dans l'ordre)
  let debutSel = null
  let finSel = null
  if (selection.a !== null) {
    debutSel = selection.b === null ? selection.a : Math.min(selection.a, selection.b)
    finSel = selection.b === null ? selection.a : Math.max(selection.a, selection.b)
  }

  // Mot prononcé : surlignage + défilement pour qu'il reste visible
  useEffect(() => {
    precedent.current?.classList.remove('mot-actif')
    precedent.current = null
    if (motActif < 0 || !boite.current) return
    const el = boite.current.querySelector(`[data-i="${motActif}"]`)
    if (!el) return
    el.classList.add('mot-actif')
    precedent.current = el
    const r = el.getBoundingClientRect()
    const marge = 160 // laisse de la place pour la barre de lecture en bas
    if (r.top < 80 || r.bottom > window.innerHeight - marge) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [motActif])

  return (
    <div
      ref={boite}
      onClick={(e) => {
        const el = e.target.closest('[data-i]')
        if (el) onToucherMot(Number(el.dataset.i))
      }}
      className="select-none leading-[1.75] text-[#1f1d36]"
      style={{ fontSize: taillePx, fontFamily: famille, WebkitTouchCallout: 'none', wordSpacing: '0.08em' }}
    >
      <style>{`.mot-actif{background:#fcd34d !important;box-shadow:0 0 0 0.12em #fcd34d;}`}</style>
      {paragraphes.map((morceaux, i) => (
        <Paragraphe key={i} morceaux={morceaux} debutSel={debutSel} finSel={finSel} />
      ))}
    </div>
  )
}
