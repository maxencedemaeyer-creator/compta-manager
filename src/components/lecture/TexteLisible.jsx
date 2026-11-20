import { memo, useEffect, useRef } from 'react'

// =============================================================
//  Appli « Lis-moi » : le texte, mot par mot
//  - toucher un mot → onToucherMot(index, élément)
//  - sélection en bleu (bande continue)
//  - pendant la lecture : la phrase en cours est surlignée doucement,
//    le mot prononcé en jaune ; en mode Focus, le reste s'estompe.
//  (surlignages gérés directement dans la page : fluide même sur un long texte)
// =============================================================
const Paragraphe = memo(function Paragraphe({ morceaux, debutSel, finSel }) {
  const dansSel = (x) => x?.mot && debutSel !== null && x.index >= debutSel && x.index <= finSel
  return (
    <p className="mb-[0.9em] last:mb-0">
      {morceaux.map((m, k) => {
        if (!m.mot) {
          const lie = dansSel(morceaux[k - 1]) && dansSel(morceaux[k + 1])
          return (
            <span key={k} data-d={m.debut} className={lie ? 'sel' : undefined}>
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
            data-d={m.debut}
            className={`mot cursor-pointer rounded-[0.3em] transition-colors duration-150 ${dedans ? (bord ? 'sel sel-bord' : 'sel') : ''}`}
          >
            {m.texte}
          </span>
        )
      })}
    </p>
  )
})

const STYLES = `
.lis .mot:hover{background:rgba(99,102,241,.12)}
.lis .sel{background:rgba(125,211,252,.55)}
.lis .sel-bord{background:rgba(56,189,248,.65)}
.lis .phrase-active{background:rgba(253,230,138,.55)}
.lis .mot-actif{background:#fbbf24 !important;box-shadow:0 0 0 .12em #fbbf24;color:#1f1d36}
.lis.focus-actif span{opacity:.28;transition:opacity .25s}
.lis.focus-actif span.phrase-active{opacity:1}
`

export default function TexteLisible({
  paragraphes,
  selection,
  motActif,
  phraseActive,
  focus,
  onToucherMot,
  taillePx,
  famille,
  interligne,
  espacement,
  couleur,
}) {
  const boite = useRef(null)
  const precedent = useRef(null)

  let debutSel = null
  let finSel = null
  if (selection.a !== null) {
    debutSel = selection.b === null ? selection.a : Math.min(selection.a, selection.b)
    finSel = selection.b === null ? selection.a : Math.max(selection.a, selection.b)
  }

  // Phrase en cours
  const phDebut = phraseActive?.debut ?? -1
  const phFin = phraseActive?.fin ?? -1
  useEffect(() => {
    if (!boite.current) return
    boite.current.querySelectorAll('[data-d]').forEach((el) => {
      const d = Number(el.dataset.d)
      el.classList.toggle('phrase-active', d >= phDebut && d < phFin)
    })
  }, [phDebut, phFin, paragraphes])

  // Mot prononcé + défilement pour qu'il reste visible
  useEffect(() => {
    precedent.current?.classList.remove('mot-actif')
    precedent.current = null
    if (motActif < 0 || !boite.current) return
    const el = boite.current.querySelector(`[data-i="${motActif}"]`)
    if (!el) return
    el.classList.add('mot-actif')
    precedent.current = el
    const r = el.getBoundingClientRect()
    if (r.top < 90 || r.bottom > window.innerHeight - 190) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [motActif])

  return (
    <div
      ref={boite}
      onClick={(e) => {
        const el = e.target.closest('[data-i]')
        if (el) onToucherMot(Number(el.dataset.i), el)
      }}
      className={`lis select-none ${focus && phDebut >= 0 ? 'focus-actif' : ''}`}
      style={{
        fontSize: taillePx,
        fontFamily: famille,
        lineHeight: interligne,
        letterSpacing: espacement.lettres,
        wordSpacing: espacement.mots,
        color: couleur,
        WebkitTouchCallout: 'none',
      }}
    >
      <style>{STYLES}</style>
      {paragraphes.map((morceaux, i) => (
        <Paragraphe key={i} morceaux={morceaux} debutSel={debutSel} finSel={finSel} />
      ))}
    </div>
  )
}
