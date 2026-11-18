import { useState } from 'react'
import { ArrowRight, Footprints, RotateCcw, Shield, Building2 } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat, Duo } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'
import { NOMS } from '../../components/labo/anatomie.js'

// =============================================================
//  A6 · Mission protection
//  Pour chaque os : quelle(s) mission(s) ? Soutien, locomotion,
//  protection (un os peut en avoir plusieurs). Bonus : les côtes
//  bougent quand on respire (pont vers P5-P6).
//  Attendu 115.
// =============================================================
const FONCTIONS = {
  soutien: { nom: 'Soutien', icon: Building2, texte: 'Il porte le poids du corps, comme une charpente.' },
  locomotion: { nom: 'Locomotion', icon: Footprints, texte: 'Les muscles le tirent pour faire bouger le corps.' },
  protection: { nom: 'Protection', icon: Shield, texte: 'Il forme un bouclier autour d’organes fragiles.' },
}

// requis : missions indispensables ; acceptes : missions aussi justes
const CAS = [
  { os: 'crane', requis: ['protection'], acceptes: [], organe: 'cerveau', explication: 'Le crâne est une boîte d’os soudés qui protège le cerveau.' },
  { os: 'femur', requis: ['soutien', 'locomotion'], acceptes: [], explication: 'Le fémur porte le poids du corps et les muscles de la cuisse le tirent pour marcher, courir, sauter.' },
  { os: 'cotes', requis: ['protection'], acceptes: ['locomotion'], organe: 'coeur', explication: 'Les côtes forment une cage autour du cœur et des poumons. Elles bougent aussi à chaque respiration !' },
  { os: 'vertebres', requis: ['soutien', 'protection'], acceptes: ['locomotion'], explication: 'La colonne vertébrale tient le corps droit et protège la moelle épinière, le gros « câble » de nerfs qui descend du cerveau.' },
  { os: 'tibia', requis: ['soutien', 'locomotion'], acceptes: [], explication: 'Le tibia transmet le poids du corps jusqu’au pied et bouge à chaque pas.' },
  { os: 'humerus', requis: ['locomotion'], acceptes: ['soutien'], explication: 'Les muscles de l’épaule et du bras tirent sur l’humérus pour faire bouger le bras.' },
  { os: 'bassin', requis: ['soutien'], acceptes: ['protection', 'locomotion'], explication: 'Le bassin porte le haut du corps, accueille les fémurs et protège des organes du bas du ventre comme la vessie.' },
  { os: 'sternum', requis: ['protection'], acceptes: [], organe: 'coeur', explication: 'Le sternum ferme la cage thoracique devant le cœur.' },
]

export default function ProtectionView() {
  const [index, setIndex] = useState(0)
  const [choix, setChoix] = useState([])
  const [valide, setValide] = useState(false)
  const [score, setScore] = useState(0)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })

  const fini = index >= CAS.length
  const cas = CAS[Math.min(index, CAS.length - 1)]
  const juste = cas.requis.every((f) => choix.includes(f)) && choix.every((f) => cas.requis.includes(f) || cas.acceptes.includes(f))

  function valider() {
    setValide(true)
    if (juste) {
      setScore((s) => s + 1)
      setEclat((x) => ({ message: 'Mission comprise !', cle: x.cle + 1 }))
    }
  }

  function suivant() {
    setIndex((i) => i + 1)
    setChoix([])
    setValide(false)
  }

  if (fini) {
    return (
      <CadreJeu code="A6" titre="Mission protection" attendus={[115]} couleur="#7CB8FF">
        <Carte couleur="rgba(124,184,255,.5)" className="text-center">
          <p className="labo-titre text-3xl font-black text-[#7CB8FF]">
            {score} / {CAS.length}
          </p>
          <p className="mt-2 text-[15px] text-[#E8ECFF]">Les trois missions du squelette : soutien, locomotion et protection.</p>
        </Carte>
        <Carte couleur="rgba(124,184,255,.5)">
          <p className="labo-mono text-[11px] text-[#7CB8FF]">BONUS · LA CAGE QUI RESPIRE</p>
          <p className="mt-1 text-[15px] text-[#E8ECFF]">
            Tes côtes ne font pas que protéger : à chaque inspiration, des muscles les soulèvent et le diaphragme descend. La cage
            thoracique s’agrandit et l’air entre dans les poumons. Pose tes mains sur tes côtes et respire fort : tu le sens !
          </p>
          <Bouton variante="secondaire" className="mt-3 w-full" onClick={() => { setIndex(0); setScore(0) }}>
            <RotateCcw size={16} /> Rejouer
          </Bouton>
        </Carte>
      </CadreJeu>
    )
  }

  return (
    <CadreJeu code="A6" titre="Mission protection" attendus={[115]} couleur="#7CB8FF" droite={<span className="labo-mono text-lg text-[#7CB8FF]">{score}</span>} ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#7CB8FF" />
      <Duo
        commandes={
          <>
      <Carte couleur="rgba(124,184,255,.45)">
        <p className="labo-mono text-[11px] text-[#7CB8FF]">
          OS {index + 1} / {CAS.length}
        </p>
        <p className="labo-titre mt-1 text-2xl font-black text-white">{NOMS[cas.os]}</p>
        <p className="mt-1 text-sm text-[#B9C1E3]">Quelle(s) mission(s) pour cet os ? Il peut y en avoir plusieurs.</p>
      </Carte>
      <div className="grid gap-2">
        {Object.entries(FONCTIONS).map(([id, f]) => {
          const actif = choix.includes(id)
          let bord = actif ? '#7CB8FF' : 'rgba(232,236,255,.18)'
          if (valide && cas.requis.includes(id)) bord = '#9DFF8A'
          else if (valide && actif && !cas.acceptes.includes(id)) bord = '#FF8A95'
          return (
            <button
              key={id}
              type="button"
              disabled={valide}
              onClick={() => setChoix((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))}
              className="flex min-h-[64px] items-center gap-3 rounded-2xl border-2 px-4 text-left transition"
              style={{ borderColor: bord, background: actif ? 'rgba(124,184,255,.14)' : 'rgba(18,26,48,.85)' }}
            >
              <f.icon size={26} className="flex-none text-[#7CB8FF]" />
              <span>
                <span className="labo-titre block text-base font-bold text-white">{f.nom}</span>
                <span className="block text-xs text-[#B9C1E3]">{f.texte}</span>
              </span>
            </button>
          )
        })}
      </div>

      {!valide ? (
        <Bouton couleur="#7CB8FF" onClick={valider} disabled={choix.length === 0}>
          Valider
        </Bouton>
      ) : (
        <Carte couleur={juste ? 'rgba(157,255,138,.5)' : 'rgba(255,138,149,.5)'}>
          <p className={`labo-titre text-lg font-bold ${juste ? 'text-[#9DFF8A]' : 'text-[#FF8A95]'}`}>{juste ? 'Exact !' : 'Pas tout à fait.'}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-[#E8ECFF]">
            {cas.explication} Missions : {cas.requis.map((f) => FONCTIONS[f].nom.toLowerCase()).join(' et ')}.
          </p>
          <Bouton className="mt-3 w-full" couleur="#7CB8FF" onClick={suivant}>
            Os suivant <ArrowRight size={18} />
          </Bouton>
        </Carte>
      )}
          </>
        }
      >
      <div className="rounded-3xl border border-white/10 bg-[#070B16]/70 tab:min-h-0 tab:flex-1">
        <Corps3D className="h-[34vh] w-full tab:h-full" etats={{ [cas.os]: 'actif', ...(cas.os === 'cotes' ? { cartilages: 'actif' } : {}) }} rotation tourner={!valide} marge={1.05} />
      </div>

      </Duo>
    </CadreJeu>
  )
}
