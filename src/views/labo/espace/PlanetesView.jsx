import { useState } from 'react'
import { BookOpen, Gem, RefreshCcw, Ruler, Sun as SunIcon, Sparkles } from 'lucide-react'
import { Carte, Duo, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import { PLANETES, PLANETE, TYPE_COURT, TERRE, dureeAnnee, dureeJour, dureeLumiere, nombre, OR, ORANGE } from '../../../components/labo/espace/donnees.js'
import { FICHES, cameraFiche, construireFiche } from '../../../components/labo/espace/fiches.js'
import { Boule, Faits, Onglets, OrdreCartes, PageEspace, PasEchelle, Vue3D } from './commun.jsx'

// =============================================================
//  S7 · Planètes — les huit planètes du Système solaire.
//  Trois jeux : l'ordre depuis le Soleil, l'ordre des tailles, le type de planète.
//  (Pluton est une planète naine depuis 2006 — UAI.)
//  Attendus 100, 108 (voir le référentiel P5-P6 §3.1).
// =============================================================
const TAILLE_BOULE = 62
const visuel = (p, t = TAILLE_BOULE) => <Boule texture={p.texture} taille={t} anneaux={!!p.anneaux} duree={20 + (p.nom.length % 5) * 3} />
const cartes = PLANETES.map((p) => ({ id: p.id, nom: p.nom, couleur: p.couleur, visuel: visuel(p), sous: null }))
const ORDRE_DIST = PLANETES.map((p) => p.id)
const ORDRE_TAILLE = [...PLANETES].sort((a, b) => a.diamKm - b.diamKm).map((p) => p.id)

const TYPES = [
  { id: 'tellurique', nom: 'Rocheuse', texte: 'Un sol solide : roche et métal', couleur: '#E27B58' },
  { id: 'géante gazeuse', nom: 'Géante gazeuse', texte: 'Surtout de l’hydrogène et de l’hélium', couleur: '#FFD27A' },
  { id: 'géante de glaces', nom: 'Géante de glaces', texte: 'Eau, ammoniac, méthane en glace et en gaz', couleur: '#C9A3FF' },
]

function Resume({ ordre, mode, erreurs, onRejouer }) {
  const liste = ordre.map((id) => PLANETES.find((p) => p.id === id))
  return (
    <Carte couleur="rgba(255,226,122,.5)" className="!p-3">
      <p className="labo-jeu text-[24px] leading-tight" style={{ color: OR }}>{erreurs === 0 ? 'Parfait !' : erreurs < 4 ? 'Bravo !' : 'Bien joué !'}</p>
      <p className="text-[12px] text-[#B9C1E3]">{erreurs === 0 ? 'Aucune erreur.' : `${erreurs} erreur${erreurs > 1 ? 's' : ''}.`}</p>
      <ul className="mt-2 grid gap-1">
        {liste.map((p, i) => (
          <li key={p.id} className="flex items-center justify-between rounded-xl bg-[#0B0A1E]/80 px-2.5 py-1 text-[12.5px]">
            <span className="flex items-center gap-2"><b className="labo-jeu w-4 text-[#B9C1E3]">{i + 1}</b><span className="labo-jeu" style={{ color: p.couleur }}>{p.nom}</span></span>
            <span className="text-[#DDE2F7]">{mode === 'distance' ? `${nombre(p.distMkm, 1)} M km · lumière ${dureeLumiere(p.distMkm)}` : `${nombre(p.diamKm)} km`}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onRejouer} className="mt-3 min-h-[48px] w-full rounded-2xl text-[15px] font-bold active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>Rejouer</button>
    </Carte>
  )
}

function JeuType({ onFin }) {
  const [ordre] = useState(() => melanger(PLANETES))
  const [i, setI] = useState(0)
  const [rep, setRep] = useState(null)
  const [fautes, setFautes] = useState(0)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const p = ordre[i]
  function choisir(id) {
    if (rep) return
    setRep(id)
    const bon = id === p.type
    if (!bon) setFautes((f) => f + 1)
    else setEclat((c) => ({ message: 'Oui !', cle: c.cle + 1 }))
    setTimeout(() => {
      if (i + 1 >= ordre.length) onFin(fautes + (bon ? 0 : 1))
      else {
        setI(i + 1)
        setRep(null)
      }
    }, 1500)
  }
  return (
    <div className="flex flex-col gap-3 tab:min-h-0 tab:flex-1">
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFE27A" />
      <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-white/12 bg-[#05030f]/40 p-4 tab:flex-1">
        <p className="labo-mono text-[11px] text-[#B9C1E3]">PLANÈTE {i + 1} / {ordre.length}</p>
        <div key={p.id}>{visuel(p, 120)}</div>
        <p className="labo-jeu text-[34px] leading-none" style={{ color: p.couleur }}>{p.nom}</p>
        {rep && <p className="max-w-md text-center text-[13px] leading-snug text-[#E8ECFF]">{p.fait}</p>}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {TYPES.map((t) => {
          const bon = rep && t.id === p.type
          const mauvais = rep === t.id && t.id !== p.type
          return (
            <button key={t.id} type="button" onClick={() => choisir(t.id)} className={`flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-3xl border-2 p-2 text-center active:scale-95 ${mauvais ? 'espace-secoue' : ''}`} style={{ borderColor: bon ? '#9DFF8A' : mauvais ? '#FF6B7A' : `${t.couleur}88`, background: bon ? 'rgba(157,255,138,.15)' : 'rgba(11,10,30,.88)' }}>
              <span className="labo-jeu text-[17px] leading-tight" style={{ color: t.couleur }}>{t.nom}</span>
              <span className="text-[11px] leading-tight text-[#B9C1E3]">{t.texte}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Fiches : on choisit une planète, on la fait tourner / on zoome (3D), on lit sa fiche ----------
function PanneauFiches({ choix, setChoix }) {
  const p = PLANETE[choix]
  const f = FICHES[choix]
  const [n, setN] = useState(0)
  const rapport = p.diamKm / TERRE.diamKm
  const poids = Math.round(((30 * f.g) / 9.81) * 10) / 10
  const lunes = f.lunes.map((m) => m.nom)
  return (
    <>
      <div className="grid grid-cols-4 gap-1.5">
        {PLANETES.map((x) => (
          <button key={x.id} type="button" onClick={() => { setChoix(x.id); setN(0) }} aria-label={x.nom} className="flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-2xl border py-1 active:scale-95" style={choix === x.id ? { borderColor: ORANGE, background: 'rgba(255,162,77,.18)' } : { borderColor: 'rgba(232,236,255,.16)', background: 'rgba(11,10,30,.85)' }}>
            <Boule texture={x.texture} taille={28} anneaux={false} duree={24} />
            <span className="labo-jeu text-[11.5px] leading-none" style={{ color: choix === x.id ? ORANGE : x.couleur }}>{x.nom}</span>
          </button>
        ))}
      </div>
      <Carte couleur={`${p.couleur}88`} className="!p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="labo-jeu text-[30px] leading-none" style={{ color: p.couleur }}>{p.nom}</p>
          <p className="labo-mono text-[11px] text-[#B9C1E3]">{TYPE_COURT[p.type].toUpperCase()}</p>
        </div>
        <div className="mt-2 flex items-start gap-2">
          <Sparkles size={17} className="mt-0.5 flex-none" color="#FFD27A" />
          <p key={`${choix}${n}`} className="flex-1 text-[13.5px] leading-snug text-[#E8ECFF]">{f.faits[n % f.faits.length]}</p>
        </div>
        <button type="button" onClick={() => setN((v) => v + 1)} className="mt-2 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-2xl border text-[13px] font-bold active:scale-95" style={{ color: '#FFD9B0', borderColor: '#FFA24D66', background: 'rgba(11,10,30,.85)' }}>
          <RefreshCcw size={15} /> Une autre anecdote
        </button>
      </Carte>
      <Faits
        couleur={ORANGE}
        lignes={[
          ['DIAMÈTRE', `${nombre(p.diamKm)} km`, choix === 'terre' ? 'notre planète' : `${nombre(rapport, rapport < 10 ? 1 : 0)} fois la Terre`],
          ['DISTANCE AU SOLEIL', `${nombre(p.distMkm, 1)} M km`, `lumière : ${dureeLumiere(p.distMkm)}`],
          ['UNE ANNÉE', dureeAnnee(p.anneeJ), 'un tour autour du Soleil'],
          ['UN JOUR', dureeJour(p.jourH), 'un tour sur elle‑même'],
          ['INCLINAISON DE L’AXE', `${nombre(p.axe, 1)}°`, choix === 'terre' ? 'comme nos saisons' : choix === 'uranus' ? 'couchée sur le côté' : choix === 'venus' ? 'tourne à l’envers' : null],
          ['TEMPÉRATURE', f.temp, f.tempSous],
          ['PESANTEUR', `${nombre(f.g, 1)} m/s²`, `30 kg sur Terre → ${nombre(poids, 1)} kg`],
          ['LUNES', p.lunes, lunes.length ? lunes.join(', ') : 'aucune'],
        ]}
      />
      <Carte couleur="rgba(255,255,255,.12)" className="!p-3">
        <p className="labo-mono text-[10px] text-[#8A93B8]">ATMOSPHÈRE</p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#E8ECFF]">{f.atmo}</p>
      </Carte>
    </>
  )
}

export default function PlanetesView() {
  const [choix, setChoix] = useState('terre')
  const [mode, setMode] = useState('distance')
  const [cle, setCle] = useState(0)
  const [fin, setFin] = useState(null)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })

  function terminer(erreurs) {
    setFin({ erreurs })
    setEclat((c) => ({ message: erreurs === 0 ? 'Parfait !' : 'Bravo !', cle: c.cle + 1 }))
  }
  function changer(m) {
    setMode(m)
    setFin(null)
    setCle((c) => c + 1)
  }
  const consigne = { distance: 'Touche les planètes dans l’ordre, de la plus proche du Soleil à la plus lointaine.', taille: 'Touche les planètes de la plus petite à la plus grosse.', type: 'Quelle sorte de planète est‑ce ?' }[mode]
  const ordre = mode === 'distance' ? ORDRE_DIST : ORDRE_TAILLE

  return (
    <PageEspace code="S7" titre="Planètes" attendus={[100,108]} ecran large>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#FFE27A" />
      <Duo
        visuelDabord
        commandes={
          <>
            <Onglets valeur={mode} onChange={changer} couleur={ORANGE} options={[['distance', SunIcon, 'Distance'], ['taille', Ruler, 'Taille'], ['type', Gem, 'Type'], ['fiches', BookOpen, 'Fiches']]} />
            {mode === 'fiches' && <PanneauFiches choix={choix} setChoix={setChoix} />}
            {mode !== 'fiches' && (
              <Carte couleur="rgba(166,107,255,.4)" className="!p-3">
                <p className="labo-jeu text-[20px] leading-snug text-white">{consigne}</p>
              </Carte>
            )}
            {fin && mode !== 'type' && <Resume ordre={ordre} mode={mode} erreurs={fin.erreurs} onRejouer={() => changer(mode)} />}
            {fin && mode === 'type' && (
              <Carte couleur="rgba(255,226,122,.5)" className="!p-3">
                <p className="labo-jeu text-[24px]" style={{ color: OR }}>{fin.erreurs === 0 ? 'Parfait !' : 'Bravo !'}</p>
                <p className="text-[12px] text-[#B9C1E3]">{fin.erreurs === 0 ? 'Aucune erreur.' : `${fin.erreurs} erreur${fin.erreurs > 1 ? 's' : ''}.`}</p>
                <ul className="mt-2 grid gap-1">
                  {TYPES.map((t) => (
                    <li key={t.id} className="rounded-xl bg-[#0B0A1E]/80 px-2.5 py-1.5 text-[12.5px]">
                      <span className="labo-jeu" style={{ color: t.couleur }}>{t.nom}</span> : {PLANETES.filter((p) => p.type === t.id).map((p) => p.nom).join(', ')}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => changer('type')} className="mt-3 min-h-[48px] w-full rounded-2xl text-[15px] font-bold active:scale-95" style={{ background: ORANGE, color: '#12062A' }}>Rejouer</button>
              </Carte>
            )}
            {mode !== 'fiches' && <Carte couleur="rgba(255,255,255,.12)" className="!p-3">
              <div className="flex items-start gap-2 text-[12px] leading-snug text-[#B9C1E3]"><Sparkles size={16} className="mt-0.5 flex-none" color="#C9A3FF" /><p>Pluton n’est plus une planète : depuis 2006, c’est une <b className="text-white">planète naine</b> (trop petite pour avoir « nettoyé » son orbite).</p></div>
            </Carte>}
          </>
        }
      >
        {mode === 'fiches' ? (
          <Vue3D key={choix} construire={construireFiche} donnees={{ id: choix }} position={cameraFiche(choix).position} fov={40} orbite={{ min: 2.4, max: cameraFiche(choix).max }}>
            <PasEchelle texte={choix === 'saturne' ? 'Lunes et blocs des anneaux agrandis · pas à l’échelle' : FICHES[choix].lunes.length ? 'Lunes agrandies · distances pas à l’échelle' : 'Rotation symbolique'} />
          </Vue3D>
        ) : mode === 'type' ? (
          <JeuType key={cle} onFin={terminer} />
        ) : (
          <OrdreCartes
            key={cle}
            cartes={cartes}
            ordre={ordre}
            colonnes={4}
            onFin={terminer}
            depart={
              mode === 'distance' ? (
                <div className="flex min-w-[60px] flex-none flex-col items-center justify-center rounded-2xl px-1">
                  <SunIcon size={34} color="#FFB347" />
                  <span className="labo-jeu text-[12px] text-[#FFD27A]">Soleil</span>
                </div>
              ) : null
            }
          />
        )}
      </Duo>
    </PageEspace>
  )
}
