import { useMemo, useState } from 'react'
import { Bone, Brain, Droplet, HeartPulse, Waves } from 'lucide-react'
import { Carte, Duo } from '../../../components/labo/CadreJeu.jsx'
import Circulation3D from '../../../components/labo/circulation/Circulation3D.jsx'
import { COULEUR_PART, COULEUR_REVIENT, NOMS, fluxSens, sangRiche } from '../../../components/labo/circulation/modele.js'
import { FICHES, NATURES } from '../../../components/labo/circulation/fiches.js'
import { BLEU_SANG, PageCirc, ROUGE_SANG } from './commun.jsx'

// =============================================================
//  L'explorateur du système circulatoire : le vrai cœur, les
//  vraies artères et veines d'un adulte (BodyParts3D), avec des
//  calques (cœur, artères, veines, organes, squelette) et des
//  globules qui circulent. On touche pour savoir ce que c'est.
// =============================================================
const CALQUES = [
  ['coeur', HeartPulse, 'Cœur'],
  ['artere', Droplet, 'Artères'],
  ['veine', Waves, 'Veines'],
  ['organe', Brain, 'Organes'],
  ['os', Bone, 'Squelette'],
]

export default function ExplorateurCircView() {
  const [calques, setCalques] = useState(['coeur', 'artere', 'veine', 'os'])
  const [choisi, setChoisi] = useState(null)
  const [sens, setSens] = useState('aucun') // aucun | tout | artere | veine
  const [outils, setOutils] = useState(null)
  const flux = useMemo(() => (outils && sens !== 'aucun' ? fluxSens(outils.modele, { type: sens }) : []), [outils, sens])
  // En mode « sens du sang » : on montre seulement les vaisseaux concernés
  const etatsSens = sens === 'artere' ? { veine: 'attenue' } : sens === 'veine' ? { artere: 'attenue' } : {}

  const basculer = (c) => {
    setCalques((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]))
    setChoisi(null)
  }
  const riche = choisi ? sangRiche(choisi.groupe, choisi.nature) : null

  return (
    <PageCirc code="" titre="Le système circulatoire en 3D" attendus={[66, 70]} large ecran>
      <Duo
        commandes={
          <>
      <div className="flex flex-wrap gap-1.5">
        {CALQUES.map(([c, Icone, nom]) => {
          const actif = calques.includes(c)
          return (
            <button
              key={c}
              type="button"
              onClick={() => basculer(c)}
              className="flex h-10 items-center gap-1.5 rounded-2xl border px-3 text-[13px] font-bold"
              style={actif ? { background: '#FF4D6D', borderColor: '#FF4D6D', color: '#1A0508' } : { borderColor: 'rgba(255,255,255,.15)', color: '#B9C1E3', background: 'rgba(18,26,48,.85)' }}
            >
              <Icone size={15} /> {nom}
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-white/12 bg-[#0B1122]/90 p-2">
        <p className="labo-mono px-1 text-[10px] tracking-[.08em] text-[#B9C1E3]">VOIR LE SENS DU SANG</p>
        <div className="mt-1 grid grid-cols-4 gap-1">
          {[
            ['aucun', 'Non'],
            ['tout', 'Tout'],
            ['artere', 'Part du cœur'],
            ['veine', 'Revient au cœur'],
          ].map(([v, n]) => (
            <button
              key={v}
              type="button"
              onClick={() => setSens(v)}
              className="min-h-[40px] rounded-xl px-1 text-[12px] font-bold leading-tight"
              style={sens === v ? { background: v === 'artere' ? COULEUR_PART : v === 'veine' ? COULEUR_REVIENT : '#FF4D6D', color: '#140A0C' } : { color: '#B9C1E3' }}
            >
              {n}
            </button>
          ))}
        </div>
        {sens !== 'aucun' && (
          <p className="labo-apparait mt-2 px-1 text-[13px] leading-snug text-[#E8ECFF]">
            {sens !== 'veine' && (
              <>
                <b style={{ color: COULEUR_PART }}>● Globules jaunes</b> : le sang <b>part du cœur</b>, dans les <b>artères</b>.{' '}
              </>
            )}
            {sens !== 'artere' && (
              <>
                <b style={{ color: COULEUR_REVIENT }}>● Globules bleu clair</b> : le sang <b>revient au cœur</b>, dans les <b>veines</b>.
              </>
            )}
          </p>
        )}
      </div>

      <Carte couleur="rgba(255,77,109,.45)">
        {choisi ? (
          <>
            <p className="labo-mono text-[11px] tracking-[.08em]" style={{ color: riche === null ? '#FFB3C0' : riche ? ROUGE_SANG : '#8FB2FF' }}>
              {NATURES[choisi.nature]?.toUpperCase()}
              {riche !== null && ` · SANG ${riche ? 'RICHE' : 'PAUVRE'} EN DIOXYGÈNE`}
            </p>
            <p className="labo-titre mt-0.5 text-xl font-bold text-white">{NOMS[choisi.groupe]}</p>
            <p className="mt-1 text-[15px] leading-snug text-[#DDE2F7]">{FICHES[choisi.groupe]}</p>
          </>
        ) : (
          <p className="text-[15px] leading-snug text-[#E8ECFF]">
            Fais tourner le corps avec un doigt, zoome avec deux doigts et touche un vaisseau ou une partie du cœur. En{' '}
            <b style={{ color: ROUGE_SANG }}>rouge</b>, le sang riche en dioxygène ; en <b style={{ color: '#8FB2FF' }}>bleu</b>, le sang pauvre en dioxygène.
          </p>
        )}
      </Carte>

      <p className="text-center text-xs text-[#8A93B8]">
        Il y a environ 100 000 km de vaisseaux sanguins dans un corps adulte : le modèle montre les plus gros. Couleurs : <span style={{ color: ROUGE_SANG }}>rouge</span> /{' '}
        <span style={{ color: BLEU_SANG }}>bleu</span>, comme dans les livres de sciences (en vrai, le sang est toujours rouge, plus ou moins foncé).
      </p>
          </>
        }
      >
      <div className="rounded-3xl border border-white/10 bg-[#070B16]/75 tab:min-h-0 tab:flex-1">
        <Circulation3D
          className="h-[68vh] max-h-[760px] w-full tab:h-full tab:max-h-none"
          rotation
          afficher={calques}
          etats={{ ...etatsSens, ...(choisi ? { [`${choisi.groupe}_${choisi.cote}`]: 'actif' } : {}) }}
          flux={flux}
          fluxCle={`${sens}-${outils ? 1 : 0}`}
          tailleFlux={8}
          onPret={setOutils}
          onChoisir={(groupe, cote, nature) => setChoisi(groupe ? { groupe, cote, nature } : null)}
        />
      </div>
      </Duo>
    </PageCirc>
  )
}
