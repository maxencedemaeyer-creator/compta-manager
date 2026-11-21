import { Fragment, memo, useEffect, useRef } from 'react'
import { COULEUR_PAR_ID } from '../../utils/phonemes.js'

// =============================================================
//  Appli « Lis-moi » : le texte, mot par mot
//  - toucher / cliquer un mot → onToucherMot(index, élément)
//  - choisir un passage, comme sur iPhone ou sur ordinateur :
//      souris : cliquer sur le premier mot et glisser jusqu'au dernier
//      doigt  : appui court sur le premier mot, puis glisser
//    → onChoisirPlage(a, b) pendant le glissement, onFinPlage(a, b, élément) à la fin
//  - sélection en bleu (bande continue)
//  - mots probablement mal reconnus : soulignés en pointillé orange
//  - « Sons en couleur » (interrupteur) : les 8 sons des cartes de la classe
//  - mise en page gardée : titres, listes (puce ou numéro en colonne), répliques ;
//    réglage « Texte simple » : tout à la suite, comme avant
//  - pendant la lecture : la phrase en cours est surlignée doucement,
//    le mot prononcé en jaune ; en mode Focus, le reste s'estompe.
//  (surlignages gérés directement dans la page : fluide même sur un long texte)
// =============================================================
// Contenu d'un mot : ses lettres, avec les sons en couleur s'il y en a
function lettresDuMot(texte, segments) {
  if (!segments) return texte
  const sortie = []
  let i = 0
  segments.forEach(([d, n, id], k) => {
    if (d > i) sortie.push(texte.slice(i, d))
    sortie.push(
      <span key={k} className="son" style={{ color: COULEUR_PAR_ID[id] }}>
        {texte.slice(d, d + n)}
      </span>
    )
    i = d + n
  })
  if (i < texte.length) sortie.push(texte.slice(i))
  return sortie
}

// Un morceau du texte (mot ou espace/ponctuation)
function Morceau({ m, k, morceaux, dansSel, debutSel, finSel, douteux, sonsMots, cache, affiche }) {
  if (!m.mot) {
    const lie = dansSel(morceaux[k - 1]) && dansSel(morceaux[k + 1])
    if (cache) return null
    return (
      <span data-d={m.debut} className={lie ? 'sel' : undefined}>
        {affiche ?? m.texte}
      </span>
    )
  }
  const dedans = dansSel(m)
  const bord = dedans && (m.index === debutSel || m.index === finSel)
  return (
    <span
      data-i={m.index}
      data-d={m.debut}
      className={`mot cursor-pointer rounded-[0.3em] transition-colors duration-150 ${dedans ? (bord ? 'sel sel-bord' : 'sel') : ''} ${
        douteux.has(m.texte) ? 'douteux' : ''
      }`}
    >
      {lettresDuMot(m.texte, sonsMots?.get(m.index))}
    </span>
  )
}

// Une ligne du texte, avec sa mise en page (titre, liste, réplique, texte).
// simple = « Texte simple » : pas de mise en page (titres et puces dans le texte).
const Ligne = memo(function Ligne({ morceaux, info, debutSel, finSel, douteux, sonsMots, simple }) {
  const dansSel = (x) => x?.mot && debutSel !== null && x.index >= debutSel && x.index <= finSel
  const type = info?.type || 'texte'
  const marqueFin = info?.marqueFin ?? -1
  const rendre = (m, k) => {
    const dansMarque = m.debut < marqueFin
    // « # » des titres : jamais affiché ; puce « * » affichée « • »
    const cache = !m.mot && dansMarque && type === 'titre'
    const affiche = !m.mot && dansMarque && type === 'liste' && !simple ? m.texte.replace(/^(\s*)\*/, '$1•') : undefined
    return <Morceau key={k} m={m} k={k} morceaux={morceaux} dansSel={dansSel} debutSel={debutSel} finSel={finSel} douteux={douteux} sonsMots={sonsMots} cache={cache} affiche={affiche} />
  }
  if (simple) return <>{morceaux.map(rendre)}</>

  const marge = info?.finBloc ? 'mb-[0.9em]' : type === 'titre' ? 'mb-[0.45em]' : 'mb-[0.3em]'
  if (type === 'titre')
    return (
      <p className={`${marge} last:mb-0`} style={{ fontSize: '1.3em', fontWeight: 700, lineHeight: 1.3 }}>
        {morceaux.map(rendre)}
      </p>
    )
  if (type === 'liste') {
    // puce ou numéro dans une colonne à gauche, lignes suivantes alignées sur le texte
    const k = morceaux.findIndex((m) => m.debut >= marqueFin)
    const marque = k === -1 ? morceaux : morceaux.slice(0, k)
    const reste = k === -1 ? [] : morceaux.slice(k)
    return (
      <p className={`${marge} last:mb-0`} style={{ paddingLeft: '1.6em', textIndent: '-1.6em' }}>
        <span className="inline-block" style={{ minWidth: '1.6em', textIndent: 0 }}>
          {marque.map(rendre)}
        </span>
        {reste.map((m, j) => rendre(m, j + marque.length))}
      </p>
    )
  }
  return <p className={`${marge} last:mb-0`}>{morceaux.map(rendre)}</p>
})

const VIDE = new Set()

// Indices des lignes regroupés par paragraphe (bloc)
function blocsDe(paragraphes, infos) {
  const blocs = []
  let bloc = []
  paragraphes.forEach((_, i) => {
    bloc.push(i)
    if (!infos || infos[i]?.finBloc !== false) {
      blocs.push(bloc)
      bloc = []
    }
  })
  if (bloc.length) blocs.push(bloc)
  return blocs
}

const STYLES = `
.lis .mot:hover{background:rgba(99,102,241,.12)}
.lis .douteux{text-decoration:underline dotted #f97316;text-decoration-thickness:.12em;text-underline-offset:.22em}
.lis .sel{background:rgba(125,211,252,.55)}
.lis .sel-bord{background:rgba(56,189,248,.65)}
.lis .phrase-active{background:rgba(253,230,138,.55)}
.lis .mot-actif{background:#fbbf24 !important;box-shadow:0 0 0 .12em #fbbf24;color:#1f1d36}
.lis.focus-actif [data-d]{opacity:.28;transition:opacity .25s}
.lis.focus-actif [data-d].phrase-active{opacity:1}
.lis .son{text-shadow:.025em 0 0 currentColor,-.025em 0 0 currentColor}
.lis .mot-actif .son{filter:brightness(.72)}
`

// Pendant un glissement, on fait défiler la page si on approche du haut ou du bas
function defilerSiBord(y) {
  if (y > window.innerHeight - 170) window.scrollBy(0, 14)
  else if (y < 110) window.scrollBy(0, -14)
}

export default function TexteLisible({
  paragraphes,
  selection,
  motActif,
  phraseActive,
  focus,
  onToucherMot,
  onChoisirPlage,
  onFinPlage,
  taillePx,
  famille,
  interligne,
  espacement,
  couleur,
  douteux = VIDE,
  sonsMots = null,
  infos = null,
  simple = false,
}) {
  const boite = useRef(null)
  const precedent = useRef(null)
  const glisse = useRef(null) // { depart, dernier, bouge } : cliquer-glisser à la souris
  const ignorerClicJusqua = useRef(0)
  const rappels = useRef({})
  rappels.current = { onChoisirPlage, onFinPlage }

  let debutSel = null
  let finSel = null
  if (selection.a !== null) {
    debutSel = selection.b === null ? selection.a : Math.min(selection.a, selection.b)
    finSel = selection.b === null ? selection.a : Math.max(selection.a, selection.b)
  }

  // ---------- Au doigt : appui court sur un mot, puis glisser (comme sur iPhone) ----------
  // Un glissement direct fait défiler la page ; après ~0,25 s d'appui sur un mot,
  // le glissement choisit le passage (et la page ne défile plus).
  useEffect(() => {
    const el = boite.current
    if (!el) return
    let t = null
    const motSous = (x, y) => document.elementFromPoint(x, y)?.closest?.('[data-i]')
    const debut = (e) => {
      if (e.touches.length !== 1) return
      const mot = e.target.closest?.('[data-i]')
      if (!mot) return
      const i = Number(mot.dataset.i)
      const doigt = e.touches[0]
      t = { x: doigt.clientX, y: doigt.clientY, depart: i, dernier: i, element: mot, actif: false }
      t.minuteur = setTimeout(() => {
        if (!t) return
        t.actif = true
        navigator.vibrate?.(8)
        rappels.current.onChoisirPlage?.(i, i)
      }, 250)
    }
    const bouge = (e) => {
      if (!t) return
      const doigt = e.touches[0]
      if (!t.actif) {
        // le doigt bouge avant la fin de l'appui : c'est un défilement normal
        if (Math.hypot(doigt.clientX - t.x, doigt.clientY - t.y) > 10) {
          clearTimeout(t.minuteur)
          t = null
        }
        return
      }
      e.preventDefault() // la page ne défile pas pendant la sélection
      defilerSiBord(doigt.clientY)
      const m = motSous(doigt.clientX, doigt.clientY)
      if (!m || !el.contains(m)) return
      const i = Number(m.dataset.i)
      if (i === t.dernier) return
      t.dernier = i
      t.element = m
      rappels.current.onChoisirPlage?.(t.depart, i)
    }
    const fin = (e) => {
      if (!t) return
      clearTimeout(t.minuteur)
      if (t.actif) {
        e.preventDefault() // pas de « toucher » en plus à la fin
        ignorerClicJusqua.current = Date.now() + 500
        rappels.current.onFinPlage?.(t.depart, t.dernier, t.element)
      }
      t = null
    }
    el.addEventListener('touchstart', debut, { passive: true })
    el.addEventListener('touchmove', bouge, { passive: false })
    el.addEventListener('touchend', fin, { passive: false })
    el.addEventListener('touchcancel', fin, { passive: false })
    return () => {
      el.removeEventListener('touchstart', debut)
      el.removeEventListener('touchmove', bouge)
      el.removeEventListener('touchend', fin)
      el.removeEventListener('touchcancel', fin)
    }
  }, [])

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
      // ---------- À la souris : cliquer sur le premier mot et glisser jusqu'au dernier ----------
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return
        const el = e.target.closest('[data-i]')
        if (el) glisse.current = { depart: Number(el.dataset.i), dernier: Number(el.dataset.i), element: el, bouge: false }
      }}
      onPointerMove={(e) => {
        const g = glisse.current
        if (!g || e.pointerType !== 'mouse') return
        defilerSiBord(e.clientY)
        const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-i]')
        if (!el || !boite.current.contains(el)) return
        const i = Number(el.dataset.i)
        if (i === g.dernier) return
        g.dernier = i
        g.element = el
        g.bouge = true
        onChoisirPlage?.(g.depart, i)
      }}
      onPointerUp={(e) => {
        const g = glisse.current
        if (!g || e.pointerType !== 'mouse') return
        glisse.current = null
        if (g.bouge) {
          ignorerClicJusqua.current = Date.now() + 300
          onFinPlage?.(g.depart, g.dernier, g.element)
        }
      }}
      onClick={(e) => {
        if (Date.now() < ignorerClicJusqua.current) {
          e.stopPropagation() // fin d'un glissement : ce n'est pas un vrai clic (la bulle reste)
          return
        }
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
        WebkitUserSelect: 'none',
      }}
    >
      <style>{STYLES}</style>
      {simple
        ? // « Texte simple » : un paragraphe par bloc, ses lignes à la suite
          blocsDe(paragraphes, infos).map((bloc, b) => (
            <p key={b} className="mb-[0.9em] last:mb-0">
              {bloc.map((i, n) => (
                <Fragment key={i}>
                  {n > 0 && ' '}
                  <Ligne morceaux={paragraphes[i]} info={infos?.[i]} debutSel={debutSel} finSel={finSel} douteux={douteux} sonsMots={sonsMots} simple />
                </Fragment>
              ))}
            </p>
          ))
        : paragraphes.map((morceaux, i) => (
            <Ligne key={i} morceaux={morceaux} info={infos?.[i]} debutSel={debutSel} finSel={finSel} douteux={douteux} sonsMots={sonsMots} />
          ))}
    </div>
  )
}
