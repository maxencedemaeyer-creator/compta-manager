import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import Banc, { useBanc } from '../../../components/labo/electricite/Banc.jsx'
import { DefsComposants } from '../../../components/labo/electricite/Composants.jsx'
import { DessinObjet, OBJET, OBJETS } from '../../../components/labo/electricite/objets.jsx'
import { Bouton, Carte, Eclat } from '../../../components/labo/CadreJeu.jsx'
import { BLEU, PageElec, comp, fil } from './commun.jsx'

// =============================================================
//  E2 · Conducteur ou isolant ?
//  Un circuit testeur : pile, ampoule et deux pinces. L'élève
//  prédit, puis glisse l'objet entre les pinces : l'ampoule répond.
//  Attendus 113, 115.
// =============================================================
const H = 340
const CIRCUIT = {
  composants: [
    comp('p', 'pile', 180, 290, { fixe: true }),
    comp('a', 'ampoule', 82, 130, { fixe: true }),
    comp('o', 'objet', 272, 130, { fixe: true, materiau: 'isolant' }),
  ],
  fils: [fil('p:0', 'a:0', { fixe: true, couleur: '#E0384A' }), fil('a:1', 'o:0', { fixe: true, couleur: '#2F7DF6' }), fil('o:1', 'p:1', { fixe: true, couleur: '#1E2230' })],
}

function MiniObjet({ id }) {
  return (
    <svg viewBox="-46 -14 92 44" className="h-10 w-full" aria-hidden="true">
      <DefsComposants />
      <DessinObjet id={id} />
    </svg>
  )
}

const conduit = (o) => o.materiau !== 'isolant'

export default function TesteurView() {
  const banc = useBanc(CIRCUIT)
  const { composants, setComposants, resultat } = banc
  const [choix, setChoix] = useState(null) // objet en attente de pronostic
  const [resultats, setResultats] = useState({}) // id → { pronostic, bon }
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const dans = composants.find((c) => c.id === 'o')?.objet
  const fini = Object.keys(resultats).length === OBJETS.length
  const score = Object.values(resultats).filter((r) => r.bon).length

  function predire(pronostic) {
    const o = choix
    setComposants((l) => l.map((c) => (c.id === 'o' ? { ...c, objet: o.id, materiau: o.materiau } : c)))
    const bon = pronostic === conduit(o)
    setResultats((r) => ({ ...r, [o.id]: { pronostic, bon } }))
    setEclat((e) => ({ message: bon ? 'Bien vu !' : 'Surprise !', cle: e.cle + 1 }))
    setChoix(null)
  }

  const objetDans = dans && OBJET[dans]
  const eclatAmpoule = resultat.composants.a?.eclat ?? 0
  const verdict = useMemo(() => {
    if (!objetDans) return null
    if (objetDans.materiau === 'metal') return `L’ampoule brille : ${objetDans.nom.toLowerCase()} (${objetDans.matiere}) laisse passer le courant. C’est un conducteur.`
    if (objetDans.materiau === 'graphite') return `L’ampoule brille, mais faiblement : le graphite de la mine conduit le courant, moins bien qu’un métal. C’est quand même un conducteur !`
    return `L’ampoule reste éteinte : ${objetDans.matiere} ne laisse pas passer le courant. La boucle est coupée : c’est un isolant.`
  }, [objetDans])

  const tableau = (
    <div className="grid grid-cols-2 gap-2">
      {[
        [true, 'Conducteurs', '#FFE45E'],
        [false, 'Isolants', '#8A93B8'],
      ].map(([c, nom, couleur]) => (
        <div key={nom} className="rounded-2xl border p-2" style={{ borderColor: `${couleur}55`, background: 'rgba(11,17,34,.85)' }}>
          <p className="labo-mono text-[11px]" style={{ color: couleur }}>
            {nom.toUpperCase()}
          </p>
          <ul className="mt-1 space-y-0.5">
            {OBJETS.filter((o) => resultats[o.id] && conduit(o) === c).map((o) => (
              <li key={o.id} className="text-[12px] text-[#E8ECFF]">
                {resultats[o.id].bon ? '✓' : '✗'} {o.nom}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )

  return (
    <PageElec code="E2" titre="Conducteur ou isolant ?" attendus={[113, 115]} couleur={BLEU} large resultat={resultat}>
      <Eclat message={eclat.message} cle={eclat.cle} couleur={BLEU} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_340px] tab:min-h-0 tab:flex-1 tab:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3 tab:min-h-0">
          <div className="flex justify-center tab:min-h-0 tab:flex-1">
            <Banc banc={banc} vue="photo" editable={false} cablage={false} hauteur={H} style={{ '--r': 360 / H }} className="mx-auto w-full max-w-[540px] tab:h-[calc(100dvh-93px)] tab:w-[calc((100dvh-93px)*var(--r))] tab:max-w-full" />
          </div>
          {verdict && (
            <Carte couleur={eclatAmpoule > 0.6 ? 'rgba(255,228,94,.6)' : eclatAmpoule > 0 ? 'rgba(255,184,107,.6)' : 'rgba(138,147,184,.5)'}>
              <p className="labo-titre text-base font-bold text-white">{objetDans.nom}</p>
              <p className="mt-1 text-[14px] leading-snug text-[#DDE2F7]">{verdict}</p>
            </Carte>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3 tab:min-h-0 tab:overflow-y-auto">
          {fini ? (
            <Carte couleur="rgba(62,201,255,.5)">
              <p className="labo-titre text-xl font-black text-white">
                {score}/{OBJETS.length} pronostics justes
              </p>
              <p className="mt-2 text-[14px] leading-snug text-[#DDE2F7]">
                <b>À retenir :</b> les <b>métaux</b> (fer, acier, cuivre, aluminium…) conduisent le courant électrique. Le <b>graphite</b> de la mine de crayon aussi, mais moins bien. Le plastique, le bois sec, le verre, le papier, le caoutchouc, le liège et la laine sont des <b>isolants</b> : ils ne laissent pas passer le courant.
              </p>
              <Bouton
                className="mt-3 w-full"
                couleur={BLEU}
                onClick={() => {
                  setResultats({})
                  banc.charger(CIRCUIT.composants, CIRCUIT.fils)
                }}
              >
                <RotateCcw size={18} /> Recommencer
              </Bouton>
            </Carte>
          ) : (
            <div className="rounded-3xl border border-[#3EC9FF]/35 bg-[#0E1428]/90 p-3">
              <div className="flex items-baseline justify-between">
                <p className="labo-mono text-[11px] tracking-[.1em] text-[#3EC9FF]">LA BOÎTE D’OBJETS</p>
                <p className="labo-mono text-[11px] text-[#8A93B8]">
                  {Object.keys(resultats).length}/{OBJETS.length} testés
                </p>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 tab:grid-cols-4 tab:gap-1.5">
                {OBJETS.map((o) => {
                  const r = resultats[o.id]
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => (r ? setComposants((l) => l.map((c) => (c.id === 'o' ? { ...c, objet: o.id, materiau: o.materiau } : c))) : setChoix(o))}
                      className="flex flex-col items-center gap-1 rounded-2xl border bg-[#141B2E] px-1 py-2 active:scale-95"
                      style={{ borderColor: dans === o.id ? BLEU : r ? (r.bon ? '#9DFF8A66' : '#FF8A9566') : 'rgba(255,255,255,.1)' }}
                    >
                      <MiniObjet id={o.id} />
                      <span className="text-center text-[11px] font-bold leading-tight text-[#E8ECFF]">{o.nom}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {Object.keys(resultats).length > 0 && tableau}
        </div>
      </div>

      {choix && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={() => setChoix(null)}>
          <div className="labo-apparait w-full max-w-sm rounded-3xl border border-[#3EC9FF]/60 bg-[#0E1428] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-48">
              <MiniObjet id={choix.id} />
            </div>
            <p className="labo-titre mt-2 text-center text-lg font-bold text-white">{choix.nom}</p>
            <p className="mt-1 text-center text-[14px] text-[#B9C1E3]">Ton pronostic : laissera-t-il passer le courant ?</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Bouton couleur="#FFE45E" onClick={() => predire(true)}>
                Conducteur
              </Bouton>
              <Bouton variante="secondaire" onClick={() => predire(false)}>
                Isolant
              </Bouton>
            </div>
          </div>
        </div>
      )}
    </PageElec>
  )
}
