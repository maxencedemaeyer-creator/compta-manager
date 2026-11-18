import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Brain, Dumbbell, RotateCcw, Star } from 'lucide-react'
import { Bouton, Carte, Eclat, Duo } from '../../../components/labo/CadreJeu.jsx'
import { BLEU_SANG, Consigne, PageCirc, ROUGE_SANG } from './commun.jsx'

// =============================================================
//  C5 · Le sang livreur
//  Le schéma de la double circulation, en jeu. Le joueur pilote une
//  goutte de sang : elle ne peut suivre que les vrais chemins
//  (cœur gauche → organes → cœur droit → poumons → cœur gauche).
//  Poumons : on rejette le dioxyde de carbone et on charge le dioxygène.
//  Intestin grêle : on charge des nutriments.
//  Cerveau et muscles : on livre dioxygène et nutriments, on emporte
//  le dioxyde de carbone. Le niveau est réussi quand toutes les
//  commandes sont livrées ET que le dioxyde de carbone est rejeté.
//  Attendus 67, 69.
// =============================================================
const ORGANES = {
  cerveau: { nom: 'Cerveau', x: 65, icone: Brain },
  intestin: { nom: 'Intestin grêle', x: 180, icone: null },
  muscles: { nom: 'Muscles', x: 295, icone: Dumbbell },
}
const POS = { G: [212, 222], D: [147, 222], P: [104, 92], cerveau: [65, 452], intestin: [180, 452], muscles: [295, 452] }

function chemin(de, a) {
  if (de === 'G' && ORGANES[a]) return `M212 222 L212 300 L212 365 L${ORGANES[a].x} 365 L${ORGANES[a].x} 452`
  if (ORGANES[de] && a === 'D') return `M${ORGANES[de].x} 452 L${ORGANES[de].x} 528 L18 528 L18 222 L147 222`
  if (de === 'D' && a === 'P') return 'M147 222 L147 285 L166 285 L166 150 L104 150 L104 92'
  if (de === 'P' && a === 'G') return 'M104 92 C130 50 230 50 256 92 L256 150 L212 150 L212 222'
  return null
}

const NIVEAUX = [
  { titre: 'Premier service', commandes: [{ organe: 'muscles', besoins: ['o2'] }], optimal: 3 },
  { titre: 'Double livraison', commandes: [{ organe: 'cerveau', besoins: ['o2'] }, { organe: 'muscles', besoins: ['o2'] }], optimal: 7 },
  { titre: 'Le grand repas', commandes: [{ organe: 'muscles', besoins: ['o2', 'n'] }, { organe: 'cerveau', besoins: ['o2', 'n'] }], optimal: 11 },
]
const NOM_BESOIN = { o2: 'dioxygène', n: 'nutriments' }

function depart(niveau) {
  return { lieu: 'G', o2: true, co2: false, n: 0, commandes: NIVEAUX[niveau].commandes.map((c) => ({ ...c, faite: false })), coups: 0 }
}

export default function LivreurView() {
  const [niveau, setNiveau] = useState(0)
  const [jeu, setJeu] = useState(() => depart(0))
  const [message, setMessage] = useState({ texte: 'Tu es dans le cœur gauche, chargée de dioxygène. Touche une destination !', ton: 'info' })
  const [anim, setAnim] = useState(null) // { d, debut }
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const goutte = useRef(null)
  const trace = useRef(null)

  const gagne = jeu.commandes.every((c) => c.faite) && !jeu.co2

  // Animation de la goutte le long du vaisseau
  useEffect(() => {
    if (!anim) return
    let raf
    const p = trace.current
    const L = p.getTotalLength()
    const boucle = (t) => {
      const k = Math.min(1, (t - anim.debut) / (L * 4.2))
      const pt = p.getPointAtLength(k * L)
      goutte.current?.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
      if (k < 1) raf = requestAnimationFrame(boucle)
      else {
        setAnim(null)
        arriver(anim.a)
      }
    }
    raf = requestAnimationFrame((t) => {
      anim.debut = t
      boucle(t)
    })
    return () => cancelAnimationFrame(raf)
  }, [anim])

  function aller(a) {
    if (anim || gagne) return
    if (a === jeu.lieu) return
    const d = chemin(jeu.lieu, a)
    if (!d) {
      const raisons = {
        G: 'Depuis le cœur gauche, le sang part dans l’aorte vers les organes du corps (pas directement vers les poumons ni le cœur droit).',
        D: 'Le cœur droit envoie le sang pauvre en dioxygène vers un seul endroit : les poumons, par l’artère pulmonaire.',
        P: 'Des poumons, le sang revient d’abord au cœur gauche par les veines pulmonaires.',
      }
      setMessage({ texte: raisons[jeu.lieu] || 'Depuis un organe, le sang revient toujours au cœur droit par les veines. Il n’y a pas de raccourci d’un organe à l’autre !', ton: 'erreur' })
      return
    }
    setAnim({ d, a, debut: 0 })
    setJeu((j) => ({ ...j, coups: j.coups + 1 }))
  }

  function arriver(a) {
    {
      const j = jeu
      const n = { ...j, lieu: a, commandes: j.commandes.map((c) => ({ ...c })) }
      let texte = ''
      let ton = 'info'
      if (a === 'P') {
        texte = `${j.co2 ? 'Tu rejettes le dioxyde de carbone (il est expiré). ' : ''}Tu te recharges en dioxygène, au contact de l’air des alvéoles.`
        n.co2 = false
        n.o2 = true
      } else if (a === 'D') {
        texte = 'Retour au cœur droit (par une veine cave). Il ne peut t’envoyer que vers les poumons.'
      } else if (a === 'G') {
        texte = 'Cœur gauche : prête pour un nouveau départ par l’aorte.'
        if (n.commandes.every((c) => c.faite) && !n.co2) texte = 'Bravo !'
      } else if (a === 'intestin') {
        n.n = 2
        n.co2 = true
        texte = `${j.o2 ? 'Tu livres du dioxygène aux cellules de l’intestin. ' : ''}Tu te charges en nutriments absorbés par l’intestin grêle ! Tu emportes du dioxyde de carbone.`
        n.o2 = false
      } else {
        const c = n.commandes.find((x) => x.organe === a && !x.faite)
        if (c) {
          const manque = c.besoins.filter((b) => (b === 'o2' ? !j.o2 : j.n < 1))
          if (!manque.length) {
            c.faite = true
            if (c.besoins.includes('n')) n.n = j.n - 1
            texte = `Livraison réussie ${a === 'cerveau' ? 'au cerveau' : 'aux muscles'} ! Tu emportes le dioxyde de carbone qu’ils ont produit.`
            ton = 'ok'
          } else {
            texte = `Il manque : ${manque.map((b) => NOM_BESOIN[b]).join(' et ')}. ${manque.includes('n') ? 'Les nutriments se chargent à l’intestin grêle.' : 'Le dioxygène se charge dans les poumons.'}`
            ton = 'erreur'
          }
        } else texte = `${ORGANES[a].nom} : pas de commande ici, mais tu déposes ton dioxygène quand même.`
        n.o2 = false
        n.co2 = true
      }
      if (n.commandes.every((c) => c.faite) && !n.co2) {
        texte = 'Toutes les livraisons sont faites et le dioxyde de carbone est rejeté. Niveau réussi !'
        ton = 'ok'
        setEclat((x) => ({ message: 'Niveau réussi !', cle: x.cle + 1 }))
      } else if (ton === 'ok') setEclat((x) => ({ message: 'Livré !', cle: x.cle + 1 }))
      setMessage({ texte, ton })
      setJeu(n)
    }
  }

  function charger(nv) {
    setNiveau(nv)
    setJeu(depart(nv))
    setMessage({ texte: 'Tu es dans le cœur gauche, chargée de dioxygène. Touche une destination !', ton: 'info' })
  }

  const etoiles = gagne ? (jeu.coups <= NIVEAUX[niveau].optimal ? 3 : jeu.coups <= NIVEAUX[niveau].optimal + 4 ? 2 : 1) : 0
  const pos = POS[jeu.lieu]
  const couleurGoutte = jeu.o2 ? ROUGE_SANG : BLEU_SANG

  return (
    <PageCirc code="C5" titre="Le sang livreur" attendus={[67, 69]} ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#9DFF8A" />
      <Duo
        commandes={
          <>
      <div className="flex items-center justify-between">
        <span className="labo-mono text-[11px] text-[#9DFF8A]">
          NIVEAU {niveau + 1}/{NIVEAUX.length} · {NIVEAUX[niveau].titre.toUpperCase()}
        </span>
        <span className="labo-mono text-[11px] text-[#B9C1E3]">{jeu.coups} trajets</span>
      </div>

      {/* Commandes et chargement */}
      <div className="grid grid-cols-2 gap-2">
        <Carte couleur="rgba(157,255,138,.4)" className="!p-3">
          <p className="labo-mono text-[10px] text-[#9DFF8A]">COMMANDES</p>
          {jeu.commandes.map((c, i) => (
            <p key={i} className="mt-1 text-[13px] leading-tight" style={{ color: c.faite ? '#9DFF8A' : '#E8ECFF', textDecoration: c.faite ? 'line-through' : 'none' }}>
              {ORGANES[c.organe].nom} : {c.besoins.map((b) => NOM_BESOIN[b]).join(' + ')}
            </p>
          ))}
          <p className="mt-1 text-[13px] leading-tight" style={{ color: !jeu.co2 && jeu.commandes.every((c) => c.faite) ? '#9DFF8A' : '#B9C1E3' }}>
            Puis : rejeter le dioxyde de carbone
          </p>
        </Carte>
        <Carte couleur="rgba(255,255,255,.14)" className="!p-3">
          <p className="labo-mono text-[10px] text-[#B9C1E3]">MA GOUTTE TRANSPORTE</p>
          <Charge actif={jeu.o2} couleur="#FF4D5E" texte="Dioxygène" />
          <Charge actif={jeu.n > 0} couleur="#FFD27A" texte={`Nutriments${jeu.n > 1 ? ' ×2' : ''}`} />
          <Charge actif={jeu.co2} couleur="#A9B4CC" texte="Dioxyde de carbone" />
        </Carte>
      </div>

      <Consigne couleur={message.ton === 'erreur' ? '#FF6B7A' : message.ton === 'ok' ? '#9DFF8A' : '#4DA3FF'}>{message.texte}</Consigne>

      {gagne && (
        <Carte couleur="rgba(157,255,138,.5)" className="labo-apparait text-center">
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <Star key={i} size={30} className={i < etoiles ? 'fill-[#FFD27A] text-[#FFD27A]' : 'text-[#4A5375]'} />
            ))}
          </div>
          <p className="mt-1 text-[14px] text-[#DDE2F7]">
            {jeu.coups} trajets (record possible : {NIVEAUX[niveau].optimal}). Le sang a relié les systèmes <b>respiratoire</b> (poumons), <b>digestif</b> (intestin) et <b>circulatoire</b> !
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Bouton variante="secondaire" onClick={() => charger(niveau)}>
              <RotateCcw size={16} /> Rejouer
            </Bouton>
            {niveau + 1 < NIVEAUX.length ? (
              <Bouton couleur="#9DFF8A" onClick={() => charger(niveau + 1)}>
                Niveau suivant <ArrowRight size={17} />
              </Bouton>
            ) : (
              <Bouton couleur="#9DFF8A" onClick={() => charger(0)}>
                Recommencer
              </Bouton>
            )}
          </div>
        </Carte>
      )}
          </>
        }
      >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070B16]/85 tab:flex tab:min-h-0 tab:flex-1 tab:justify-center">
        <svg viewBox="0 0 360 560" className="w-full tab:h-[calc(100dvh-95px)] tab:w-auto" role="img" aria-label="Schéma de la double circulation">
          <defs>
            <pattern id="liv-capillaires" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M0 5 Q2.5 0 5 5 T10 5" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".8" />
            </pattern>
            <linearGradient id="liv-capi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={ROUGE_SANG} />
              <stop offset="1" stopColor={BLEU_SANG} />
            </linearGradient>
            <linearGradient id="liv-poumon" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={BLEU_SANG} />
              <stop offset="1" stopColor={ROUGE_SANG} />
            </linearGradient>
          </defs>

          {/* Vaisseaux */}
          <g fill="none" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" opacity=".9">
            {/* aorte et artères vers les organes */}
            <path d="M212 280 L212 365 M65 365 L295 365 M65 365 L65 425 M180 365 L180 425 M295 365 L295 425" stroke={ROUGE_SANG} />
            {/* veines des organes vers le cœur droit */}
            <path d="M65 485 L65 528 M180 485 L180 528 M295 485 L295 528 M295 528 L18 528 L18 222 L120 222" stroke={BLEU_SANG} />
            {/* artère pulmonaire */}
            <path d="M166 268 L166 150 L104 150 L104 118" stroke={BLEU_SANG} />
            {/* veine pulmonaire */}
            <path d="M256 118 L256 150 L212 150 L212 200" stroke={ROUGE_SANG} />
          </g>
          {/* flèches de sens */}
          <g fill="#fff" opacity=".85">
            <path d="M207 335 l5 8 l5 -8 z" />
            <path d="M13 380 l5 -8 l5 8 z" />
            <path d="M161 185 l5 -8 l5 8 z" />
            <path d="M251 125 l5 8 l5 -8 z" />
            <path d="M140 523 l-8 5 l8 5 z" />
          </g>
          <g className="labo-mono" fontSize="9.5" fill="#DDE2F7">
            <text x="218" y="356">aorte</text>
            <text x="24" y="300" transform="rotate(-90 24 300)">veines caves</text>
            <text x="112" y="165">artère pulmonaire</text>
            <text x="262" y="135">veine pulm.</text>
          </g>

          {/* Poumons */}
          <Station onClick={() => aller('P')} actif={jeu.lieu === 'P'}>
            <path d="M174 30 L174 70 M174 70 Q160 78 140 86 M186 30 L186 70 M186 70 Q200 78 220 86" stroke="#E7D7C3" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M150 52 C112 40 70 70 72 108 C74 132 96 138 120 130 C150 120 160 92 158 70 Z" fill="url(#liv-poumon)" opacity=".35" stroke="#E7D7C3" strokeWidth="1.5" />
            <path d="M210 52 C248 40 290 70 288 108 C286 132 264 138 240 130 C210 120 200 92 202 70 Z" fill="url(#liv-poumon)" opacity=".35" stroke="#E7D7C3" strokeWidth="1.5" />
            <rect x="80" y="62" width="200" height="66" fill="url(#liv-capillaires)" opacity=".7" />
            <text x="180" y="18" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">
              Poumons
            </text>
          </Station>

          {/* Cœur (vu de face : le côté droit de la personne est à gauche) */}
          <g>
            <path d="M120 200 Q120 186 134 186 L176 186 L176 296 Q148 312 128 292 Q120 284 120 270 Z" fill={BLEU_SANG} opacity=".85" />
            <path d="M184 186 L226 186 Q240 186 240 200 L240 270 Q240 300 206 314 Q192 318 184 300 Z" fill={ROUGE_SANG} opacity=".9" />
            <path d="M120 248 L176 248 M184 248 L240 248" stroke="#070B16" strokeWidth="3" />
            <rect x="176" y="186" width="8" height="124" fill="#B9454F" />
            <g fontSize="9" fontWeight="800" fill="#fff" textAnchor="middle">
              <text x="148" y="222">OD</text>
              <text x="148" y="275">VD</text>
              <text x="212" y="222">OG</text>
              <text x="212" y="275">VG</text>
            </g>
            <text x="148" y="338" textAnchor="middle" fontSize="10" fill="#9FB8FF">
              cœur droit
            </text>
            <text x="250" y="338" textAnchor="middle" fontSize="10" fill="#FF9AA6">
              cœur gauche
            </text>
            <rect x="116" y="182" width="64" height="134" fill="transparent" onClick={() => aller('D')} style={{ cursor: 'pointer' }} />
            <rect x="180" y="182" width="64" height="134" fill="transparent" onClick={() => aller('G')} style={{ cursor: 'pointer' }} />
            {(jeu.lieu === 'D' || jeu.lieu === 'G') && <rect x={jeu.lieu === 'D' ? 116 : 180} y="182" width="64" height="134" rx="14" fill="none" stroke="#9DFF8A" strokeWidth="2" strokeDasharray="5 4" />}
          </g>

          {/* Organes */}
          {Object.entries(ORGANES).map(([id, o]) => {
            const commande = jeu.commandes.find((c) => c.organe === id && !c.faite)
            return (
              <Station key={id} onClick={() => aller(id)} actif={jeu.lieu === id}>
                <rect x={o.x - 50} y="425" width="100" height="60" rx="14" fill="url(#liv-capi)" opacity=".28" stroke={commande ? '#FFD27A' : 'rgba(255,255,255,.3)'} strokeWidth={commande ? 2.5 : 1} />
                <rect x={o.x - 46} y="432" width="92" height="46" rx="10" fill="url(#liv-capillaires)" />
                <text x={o.x} y="460" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">
                  {o.nom}
                </text>
                {commande && (
                  <text x={o.x} y="417" textAnchor="middle" fontSize="10" fontWeight="800" fill="#FFD27A">
                    ★ commande
                  </text>
                )}
              </Station>
            )
          })}
          <text x="180" y="546" textAnchor="middle" fontSize="9" fill="#8A93B8">
            Dans chaque organe, de tout petits vaisseaux (les capillaires)
          </text>
          <text x="180" y="557" textAnchor="middle" fontSize="9" fill="#8A93B8">
            relient les artères aux veines.
          </text>

          {/* trajet en cours (invisible) + goutte */}
          <path ref={trace} d={anim?.d || 'M0 0'} fill="none" stroke="none" />
          <g ref={goutte} transform={`translate(${pos[0]} ${pos[1]})`} style={{ pointerEvents: 'none' }}>
            <circle r="13" fill={couleurGoutte} opacity=".3" className="labo-pulse" />
            <circle r="7.5" fill={couleurGoutte} stroke="#fff" strokeWidth="2" />
          </g>
        </svg>
      </div>

      </Duo>
    </PageCirc>
  )
}

function Station({ children, onClick, actif }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} opacity={actif ? 1 : 0.95}>
      {children}
    </g>
  )
}

function Charge({ actif, couleur, texte }) {
  return (
    <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: actif ? '#fff' : '#4A5375' }}>
      <span className="h-3 w-3 rounded-full" style={{ background: actif ? couleur : 'transparent', border: `2px solid ${actif ? couleur : '#4A5375'}` }} />
      {texte}
    </p>
  )
}
