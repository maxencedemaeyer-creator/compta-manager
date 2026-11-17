import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, Lock, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import Banc, { Vignette, nouvelId, useBanc } from '../../../components/labo/electricite/Banc.jsx'
import { COMPOSANTS, commandePar, enSerie, fonctionne, resoudre } from '../../../components/labo/electricite/circuit.js'
import { Eclat } from '../../../components/labo/CadreJeu.jsx'
import { BasculeVue, JAUNE, PageElec, RECEPTEURS, comp } from './commun.jsx'

// =============================================================
//  E1 · Le banc d'essai : l'atelier libre (carte blanche).
//  Un petit magasin de matériel ; l'élève construit ce qu'il veut :
//  circuits simples, en série, en dérivation, avec interrupteurs,
//  moteurs, sonnette, DEL… Le carnet note ses découvertes.
//  Attendus 111, 112, 116.
// =============================================================
const STOCK = { pile: 2, ampoule: 4, del: 2, moteur: 2, sonnette: 1, interrupteur: 3, poussoir: 2 }
const MAX = 10
const PLACES = [72, 180, 288].flatMap((x) => [120, 250, 380, 480].map((y) => [x, y])).sort((a, b) => a[1] - b[1] || a[0] - b[0])

const DECOUVERTES = [
  ['ampoule', 'Circuit fermé', 'L’ampoule brille : le courant sort par la borne + de la pile, traverse les fils et l’ampoule, puis revient par la borne −. Une boucle sans interruption, c’est un circuit fermé.'],
  ['interrupteur', 'Ouvert ou fermé', 'L’interrupteur ouvre ou ferme la boucle. Fermé, le courant passe ; ouvert, le circuit est coupé et tout s’arrête.'],
  ['moteur', 'Le moteur tourne', 'Le moteur est un récepteur : il transforme l’énergie électrique en mouvement.'],
  ['sens', 'Sens inversé', 'En inversant les branchements de la pile, le courant circule dans l’autre sens : le moteur tourne dans l’autre sens.'],
  ['sonnette', 'Drrring !', 'Dans la sonnette, un électroaimant attire puis relâche très vite un petit marteau qui frappe le timbre.'],
  ['del', 'La DEL s’allume', 'La DEL ne laisse passer le courant que dans un sens : sa patte longue (+) doit être du côté de la borne + de la pile.'],
  ['del-envers', 'DEL à l’envers', 'Branchée à l’envers, la DEL bloque le courant : la boucle est complète, mais rien ne passe.'],
  ['serie', 'Montage en série', 'Les récepteurs sont l’un après l’autre sur une seule boucle. On en retire un : tout s’arrête. Les ampoules brillent moins fort.'],
  ['derivation', 'Montage en dérivation', 'Chaque récepteur a sa propre boucle avec la pile. On en retire un : les autres continuent. Les ampoules brillent normalement.'],
  ['deux-piles', 'Deux piles en série', 'Deux piles de 4,5 V à la suite (+ de l’une contre − de l’autre) donnent 9 V : les récepteurs reçoivent plus d’énergie.'],
  ['grillee', 'Ampoule grillée', 'Trop de tension pour une ampoule de 4,5 V : le filament chauffe trop, fond et se coupe. Le circuit est ouvert. Touche l’ampoule pour la changer.'],
  ['court-circuit', 'Court-circuit !', 'Les deux bornes de la pile reliées par des fils, sans récepteur : le courant devient énorme, les fils et la pile chauffent. Danger : on débranche tout de suite.'],
  ['complexe', 'Circuit complexe', 'Trois récepteurs ou plus fonctionnent en même temps. Bravo, ingénieur !'],
]

function analyser(composants, fils, res, memoire) {
  const trouve = new Set()
  const marchent = composants.filter((c) => RECEPTEURS.includes(c.type) && fonctionne(res, c.id))
  for (const c of marchent) {
    if (c.type === 'ampoule') trouve.add('ampoule')
    if (c.type === 'moteur') {
      trouve.add('moteur')
      memoire.sens.add(Math.sign(res.composants[c.id].vitesse))
      if (memoire.sens.size >= 2) trouve.add('sens')
    }
    if (c.type === 'sonnette') trouve.add('sonnette')
    if (c.type === 'del') trouve.add('del')
    if (Math.abs(res.composants[c.id].tension) > 6) trouve.add('deux-piles')
  }
  if (marchent.length >= 3) trouve.add('complexe')
  if (res.courtCircuit) trouve.add('court-circuit')

  // DEL éteinte qui s'allumerait si on la retournait
  for (const d of composants.filter((c) => c.type === 'del' && !res.composants[c.id]?.allumee)) {
    const inverse = fils.map((f) => ({ ...f, a: inv(f.a, d.id), b: inv(f.b, d.id) }))
    if (resoudre(composants, inverse).composants[d.id]?.allumee) trouve.add('del-envers')
  }

  // série ou dérivation (sur deux récepteurs qui marchent)
  for (let i = 0; i < marchent.length; i++)
    for (let j = i + 1; j < marchent.length; j++) {
      const a = marchent[i].id
      const b = marchent[j].id
      const ab = enSerie(composants, fils, a, b)
      const ba = enSerie(composants, fils, b, a)
      if (ab && ba) trouve.add('serie')
      if (!ab && !ba) trouve.add('derivation')
    }

  // un interrupteur qui commande vraiment un récepteur
  const commandes = composants.filter((c) => c.type === 'interrupteur' || c.type === 'poussoir')
  const recepteurs = composants.filter((c) => RECEPTEURS.includes(c.type))
  outer: for (const s of commandes)
    for (const r of recepteurs)
      if (commandePar(composants, fils, s.id, r.id)) {
        trouve.add('interrupteur')
        break outer
      }
  return trouve
}
const inv = (cle, id) => (cle === `${id}:0` ? `${id}:1` : cle === `${id}:1` ? `${id}:0` : cle)

const DEPART = [comp('p1', 'pile', 180, 470), comp('a1', 'ampoule', 180, 250)]

export default function BancView() {
  const banc = useBanc({ composants: DEPART, fils: [] })
  const { composants, setComposants, fils, resultat, grillees, charger } = banc
  const [vue, setVue] = useState('photo')
  const [son, setSon] = useState(true)
  const [carnet, setCarnet] = useState(() => new Set())
  const [eclat, setEclat] = useState({ message: '', sousTitre: '', cle: 0 })
  const memoire = useRef({ sens: new Set() })

  const restants = useMemo(() => {
    const r = { ...STOCK }
    for (const c of composants) if (r[c.type] != null) r[c.type]--
    return r
  }, [composants])

  useEffect(() => {
    const t = setTimeout(() => {
      const trouve = analyser(composants, fils, resultat, memoire.current)
      if (grillees > 0) trouve.add('grillee')
      const nouveaux = [...trouve].filter((x) => !carnet.has(x))
      if (!nouveaux.length) return
      setCarnet((s) => new Set([...s, ...nouveaux]))
      const d = DECOUVERTES.find((x) => x[0] === nouveaux[0])
      setEclat((e) => ({ message: d[1], sousTitre: 'Nouvelle découverte dans ton carnet', cle: e.cle + 1 }))
    }, 250)
    return () => clearTimeout(t)
  }, [composants, fils, resultat, grillees, carnet])

  function ajouter(type) {
    if (restants[type] <= 0 || composants.length >= MAX) return
    const libre = PLACES.find(([x, y]) => composants.every((c) => Math.hypot(c.x - x, c.y - y) > 70)) ?? [180, 260]
    setComposants((l) => [...l, comp(nouvelId(), type, libre[0], libre[1])])
  }

  const magasin = (
    <section className="rounded-3xl border border-[#FFE45E]/35 bg-[#0E1428]/90 p-3">
      <div className="flex items-baseline justify-between">
        <p className="labo-mono text-[11px] tracking-[.1em] text-[#FFE45E]">LE MAGASIN</p>
        <p className="text-[11px] text-[#8A93B8]">
          {composants.length}/{MAX} sur l’établi
        </p>
      </div>
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        {Object.keys(STOCK).map((type) => {
          const vide = restants[type] <= 0 || composants.length >= MAX
          return (
            <button
              key={type}
              type="button"
              onClick={() => ajouter(type)}
              disabled={vide}
              className="relative flex w-[84px] flex-none flex-col items-center rounded-2xl border border-white/10 px-1 pb-1.5 pt-1 active:scale-95 disabled:opacity-35 md:w-auto"
              style={{ background: vue === 'schema' ? '#F7F5EE' : '#141B2E' }}
            >
              <Vignette type={type} vue={vue} taille={60} />
              <span className="text-center text-[11px] font-bold leading-tight" style={{ color: vue === 'schema' ? '#151A26' : '#E8ECFF' }}>
                {COMPOSANTS[type].nom}
              </span>
              <span className="labo-mono absolute right-1.5 top-1 rounded-full bg-[#FFE45E] px-1.5 text-[10px] font-bold text-[#1A1500]">{restants[type]}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[12px] leading-snug text-[#8A93B8]">Touche un objet pour le poser. Pour brancher un fil, glisse d’une borne dorée à une autre (ou touche les deux bornes).</p>
    </section>
  )

  const carnetVue = (
    <section className="rounded-3xl border border-[#3EC9FF]/35 bg-[#0E1428]/90 p-3">
      <div className="flex items-baseline justify-between">
        <p className="labo-mono flex items-center gap-1.5 text-[11px] tracking-[.1em] text-[#3EC9FF]">
          <BookOpen size={13} /> CARNET DE DÉCOUVERTES
        </p>
        <p className="labo-mono text-[12px] font-bold text-[#3EC9FF]">
          {carnet.size}/{DECOUVERTES.length}
        </p>
      </div>
      <ul className="mt-2 space-y-1.5">
        {DECOUVERTES.map(([id, titre, texte]) => {
          const ok = carnet.has(id)
          return (
            <li key={id} className="flex gap-2 rounded-xl px-2 py-1.5" style={{ background: ok ? 'rgba(62,201,255,.1)' : 'rgba(255,255,255,.03)' }}>
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full" style={{ background: ok ? '#3EC9FF' : 'rgba(255,255,255,.08)', color: '#04121A' }}>
                {ok ? <Check size={13} strokeWidth={3} /> : <Lock size={11} className="text-[#8A93B8]" />}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold" style={{ color: ok ? '#F4F6FF' : '#8A93B8' }}>
                  {ok ? titre : '???'}
                </p>
                {ok && <p className="text-[12px] leading-snug text-[#B9C1E3]">{texte}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )

  return (
    <PageElec code="E1" titre="Le banc d’essai" attendus={[111, 112, 116]} couleur={JAUNE} large resultat={resultat}>
      <Eclat message={eclat.message} sousTitre={eclat.sousTitre} cle={eclat.cle} couleur={JAUNE} />
      <div className="flex flex-wrap items-center gap-2">
        <BasculeVue vue={vue} setVue={setVue} />
        <button type="button" aria-label={son ? 'Couper le son' : 'Activer le son'} onClick={() => setSon(!son)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-[#0B1122]/90 text-[#E8ECFF]">
          {son ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          type="button"
          onClick={() => {
            charger(DEPART, [])
            memoire.current.sens = new Set()
          }}
          className="flex h-11 items-center gap-1.5 rounded-2xl border border-white/15 bg-[#0B1122]/90 px-3 text-[13px] font-bold text-[#E8ECFF]"
        >
          <RotateCcw size={16} /> Tout débrancher
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 min-w-0 md:order-1">
          <Banc banc={banc} vue={vue} silence={!son} className="mx-auto w-full" style={{ maxWidth: 'min(540px, calc((100dvh - 120px) * 0.69))' }} />
        </div>
        <div className="order-1 flex min-w-0 flex-col gap-3 md:order-2">
          {magasin}
          <div className="hidden md:block">{carnetVue}</div>
        </div>
        <div className="order-3 md:hidden">{carnetVue}</div>
      </div>
    </PageElec>
  )
}
