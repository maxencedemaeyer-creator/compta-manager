import { useEffect, useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import CadreJeu, { Bouton, Carte, Eclat } from '../../components/labo/CadreJeu.jsx'
import Corps3D from '../../components/labo/Corps3D.jsx'
import { NOMS, OS } from '../../components/labo/anatomie.js'

// =============================================================
//  A4 · Qui tire ? (vrais os et vrais muscles en 3D, BodyParts3D)
//  Le mouvement tourne en boucle ; le muscle qui travaille gonfle
//  et raccourcit. Observe, puis touche le muscle qui tire.
//  Attendus 120, 121.
// =============================================================
const SCENES = [
  {
    titre: 'Je lève mon verre', mouvement: 'Flexion du coude', cadrage: 'bras',
    articulation: 'coude_d', de: 5, a: 125, muscles: ['biceps', 'triceps'], bon: 'biceps',
    explication: 'Le biceps, devant le bras, se contracte : il raccourcit, gonfle et tire sur le radius. L’avant-bras monte. Le triceps se relâche.',
  },
  {
    titre: 'Je pousse une porte', mouvement: 'Extension du coude', cadrage: 'bras',
    articulation: 'coude_d', de: 120, a: 5, muscles: ['biceps', 'triceps'], bon: 'triceps',
    explication: 'Le triceps, derrière le bras, se contracte et tire sur la pointe du coude (le cubitus) : le bras se tend.',
  },
  {
    titre: 'Je shoote dans le ballon', mouvement: 'Extension du genou', cadrage: 'jambe',
    articulation: 'genou_d', de: 100, a: 0, autre: { hanche_d: 35 }, muscles: ['quadriceps', 'ischio_jambiers'], bon: 'quadriceps',
    explication: 'Le quadriceps, devant la cuisse, tire sur le tibia par le tendon qui passe sur la rotule : la jambe se tend.',
  },
  {
    titre: 'Je ramène mon talon vers mes fesses', mouvement: 'Flexion du genou', cadrage: 'jambe',
    articulation: 'genou_d', de: 0, a: 110, muscles: ['quadriceps', 'ischio_jambiers'], bon: 'ischio_jambiers',
    explication: 'Les ischio-jambiers, derrière la cuisse, se contractent et tirent le tibia et le péroné vers l’arrière.',
  },
  {
    titre: 'Je me mets sur la pointe des pieds', mouvement: 'Extension de la cheville', cadrage: 'pied',
    articulation: 'cheville_d', de: 0, a: 35, muscles: ['mollet', 'jambier_anterieur'], bon: 'mollet', extra: ['tendon_achille'],
    explication: 'Le mollet se contracte et tire sur l’os du talon par le tendon d’Achille, le tendon le plus solide du corps.',
  },
  {
    titre: 'Je relève la pointe du pied', mouvement: 'Flexion de la cheville', cadrage: 'pied',
    articulation: 'cheville_d', de: 5, a: -20, muscles: ['mollet', 'jambier_anterieur'], bon: 'jambier_anterieur', extra: ['tendon_achille'],
    explication: 'Le jambier antérieur, devant le tibia, tire le dessus du pied vers le haut. Le mollet se relâche.',
  },
]

export default function QuiTireView() {
  const [index, setIndex] = useState(0)
  const [reponse, setReponse] = useState(null)
  const [score, setScore] = useState(0)
  const [t, setT] = useState(0)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })

  useEffect(() => {
    let raf
    const debut = performance.now()
    const boucle = (m) => {
      setT(((m - debut) / 3200) % 1)
      raf = requestAnimationFrame(boucle)
    }
    raf = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(raf)
  }, [])

  const fini = index >= SCENES.length
  const scene = SCENES[Math.min(index, SCENES.length - 1)]
  // aller (contraction) · pause · retour lent (relâchement)
  const prog = t < 0.4 ? 0.5 - 0.5 * Math.cos((t / 0.4) * Math.PI) : t < 0.65 ? 1 : 0.5 + 0.5 * Math.cos(((t - 0.65) / 0.35) * Math.PI)
  const angle = scene.de + (scene.a - scene.de) * prog
  const autre = scene.muscles.find((m) => m !== scene.bon)
  const revele = reponse !== null

  const etats = {}
  if (revele) {
    etats[scene.bon] = 'contracte'
    etats[autre] = 'relache'
  }
  if (reponse && reponse !== scene.bon) etats[reponse] = 'erreur'

  function repondre(muscle) {
    if (revele || !scene.muscles.includes(muscle)) return
    setReponse(muscle)
    if (muscle === scene.bon) {
      setScore((s) => s + 1)
      setEclat((x) => ({ message: 'Bien observé !', cle: x.cle + 1 }))
    }
  }

  if (fini) {
    return (
      <CadreJeu code="A4" titre="Qui tire ?" attendus={[120, 121]} couleur="#FFB86B">
        <Carte couleur="rgba(255,184,107,.5)" className="text-center">
          <p className="labo-titre text-3xl font-black text-[#FFB86B]">
            {score} / {SCENES.length}
          </p>
          <p className="mt-2 text-[15px] text-[#E8ECFF]">
            À retenir : un muscle ne peut que tirer, jamais pousser. Autour de chaque articulation, il y a donc des muscles opposés : l’un plie, l’autre tend.
          </p>
          <Bouton className="mx-auto mt-4" couleur="#FFB86B" onClick={() => { setIndex(0); setScore(0); setReponse(null) }}>
            <RotateCcw size={18} /> Rejouer
          </Bouton>
        </Carte>
      </CadreJeu>
    )
  }

  return (
    <CadreJeu code="A4" titre="Qui tire ?" attendus={[120, 121]} couleur="#FFB86B" droite={<span className="labo-mono text-lg text-[#FFB86B]">{score}</span>}>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFB86B" />
      <Carte couleur="rgba(255,184,107,.45)">
        <p className="labo-mono text-[11px] text-[#FFB86B]">
          SCÈNE {index + 1} / {SCENES.length} · {scene.mouvement.toUpperCase()}
        </p>
        <p className="labo-titre mt-1 text-xl font-bold text-white">« {scene.titre} »</p>
        <p className="mt-1 text-sm text-[#B9C1E3]">Observe bien : quel muscle raccourcit et gonfle ? Touche-le, ou choisis ci-dessous.</p>
      </Carte>

      <div className="rounded-3xl border border-white/10 bg-[#070B16]/75">
        <Corps3D
          key={scene.cadrage}
          className="h-[52vh] max-h-[560px] w-full"
          vue="profil"
          cadrage={scene.cadrage}
          marge={1.25}
          afficher={[...OS, ...scene.muscles, ...(scene.extra || [])]}
          etats={etats}
          posesInstantanees
          poses={{ [scene.articulation]: angle, ...(scene.autre || {}) }}
          contractions={{ [`${scene.bon}_d`]: prog, [`${autre}_d`]: 0 }}
          onChoisir={(g) => repondre(g === 'tendon_achille' ? 'mollet' : g)}
        />
      </div>

      {!revele ? (
        <div className="grid grid-cols-2 gap-2">
          {scene.muscles.map((m) => (
            <Bouton key={m} variante="secondaire" onClick={() => repondre(m)}>
              {NOMS[m]}
            </Bouton>
          ))}
        </div>
      ) : (
        <Carte couleur={reponse === scene.bon ? 'rgba(157,255,138,.5)' : 'rgba(255,138,149,.5)'}>
          <p className={`labo-titre text-lg font-bold ${reponse === scene.bon ? 'text-[#9DFF8A]' : 'text-[#FF8A95]'}`}>
            {reponse === scene.bon ? 'Exact !' : `Non : c’est le ${NOMS[scene.bon].toLowerCase()} qui tire.`}
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-[#E8ECFF]">{scene.explication}</p>
          <p className="mt-1 text-xs text-[#B9C1E3]">En rouge vif : le muscle qui se contracte · en rose pâle : celui qui se relâche.</p>
          <Bouton className="mt-3 w-full" couleur="#FFB86B" onClick={() => { setReponse(null); setIndex((i) => i + 1) }}>
            Scène suivante <ArrowRight size={18} />
          </Bouton>
        </Carte>
      )}
      <p className="text-center text-xs text-[#8A93B8]">Vrais os et vrais muscles, vus de profil (devant à droite).</p>
    </CadreJeu>
  )
}
