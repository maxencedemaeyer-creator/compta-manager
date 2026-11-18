import { useEffect, useRef, useState } from 'react'
import { ArrowDownUp, Check, Ear, LineChart, RotateCcw, Volume2 } from 'lucide-react'
import { Bouton, Carte, Eclat, melanger } from '../../../components/labo/CadreJeu.jsx'
import { Consigne, Onglets, PageCirc, boumTac, contexteAudio, tic } from './commun.jsx'

// =============================================================
//  C7 · Les cœurs du monde
//  Le rythme cardiaque de quelques animaux, au repos (ordres de
//  grandeur), de la musaraigne étrusque (2 g) à la baleine bleue
//  (≈ 100 tonnes). Chaque cœur bat à l'écran à sa vraie vitesse et
//  on peut l'écouter. Jeu : les classer du plus lent au plus rapide.
//  Puis le graphique : plus l'animal est petit, plus son cœur bat vite.
//  Sources (affichées dans la pastille « Infos » du pied de page, PiedLabo.jsx) :
//  manuels de physiologie animale ; baleine bleue : Goldbogen et al.,
//  PNAS, 2019 ; musaraigne étrusque : Jürgens et al., 1996.
//  Attendu 68 (interpréter un rythme cardiaque).
// =============================================================
const ANIMAUX = [
  { id: 'baleine', emoji: '🐋', nom: 'Baleine bleue', masse: 100000, bpm: 8, texte: 'entre 2 (en plongée) et 37', note: 'Son cœur pèse environ 180 kg ! En plongée, il ralentit jusqu’à 2 battements par minute.' },
  { id: 'elephant', emoji: '🐘', nom: 'Éléphant d’Afrique', masse: 5000, bpm: 30, texte: 'environ 25 à 35' },
  { id: 'cheval', emoji: '🐴', nom: 'Cheval', masse: 500, bpm: 36, texte: 'environ 28 à 44' },
  { id: 'adulte', emoji: '🧑', nom: 'Humain adulte', masse: 70, bpm: 70, texte: 'environ 60 à 80' },
  { id: 'enfant', emoji: '🧒', nom: 'Enfant de 10 ans', masse: 32, bpm: 85, texte: 'environ 70 à 110', note: 'C’est toi ! Mesure ton propre rythme à l’activité « Pouls » (C4).' },
  { id: 'chien', emoji: '🐕', nom: 'Chien moyen', masse: 20, bpm: 95, texte: 'environ 70 à 120' },
  { id: 'bebe', emoji: '👶', nom: 'Bébé humain', masse: 3.5, bpm: 140, texte: 'environ 120 à 160', note: 'Même espèce que nous, mais plus petit : son cœur bat deux fois plus vite.' },
  { id: 'chat', emoji: '🐈', nom: 'Chat', masse: 4, bpm: 150, texte: 'environ 120 à 180' },
  { id: 'souris', emoji: '🐭', nom: 'Souris', masse: 0.02, bpm: 600, texte: 'environ 500 à 700' },
  { id: 'colibri', emoji: '🐦', nom: 'Colibri', masse: 0.004, bpm: 250, horsClassement: true, texte: 'environ 250 au repos, jusqu’à 1 200 en vol', note: 'En vol, son cœur peut battre 20 fois par seconde. Au repos, il bat moins vite que celui d’une souris : les oiseaux ont un cœur plus gros que les mammifères de même taille.' },
  { id: 'musaraigne', emoji: '🐁', nom: 'Musaraigne étrusque', masse: 0.002, bpm: 1100, texte: 'jusqu’à 1 500 environ', note: 'Un des plus petits mammifères du monde : 2 grammes, moins qu’un morceau de sucre.' },
]

const masseTexte = (m) => (m >= 1000 ? `${(m / 1000).toLocaleString('fr-BE')} tonnes` : m >= 1 ? `${m.toLocaleString('fr-BE')} kg` : `${Math.round(m * 1000)} g`)

// Battements entendus : « boum-tac » pour les cœurs lents, petits « tic » pour les rapides
function useEcoute() {
  const minuteur = useRef(null)
  const [ecoute, setEcoute] = useState(null)
  function arreter() {
    clearInterval(minuteur.current)
    setEcoute(null)
  }
  function ecouter(a) {
    clearInterval(minuteur.current)
    if (ecoute === a.id) return arreter()
    setEcoute(a.id)
    contexteAudio() // réveille le son (clic de l'élève = autorisation du navigateur)
    const coup = a.bpm > 220 ? () => tic(1) : () => boumTac(1, Math.min(0.32, 22 / a.bpm))
    coup()
    const debut = Date.now()
    minuteur.current = setInterval(() => {
      if (Date.now() - debut > 8000) return arreter()
      coup()
    }, 60000 / a.bpm)
  }
  useEffect(() => () => clearInterval(minuteur.current), [])
  return { ecoute, ecouter }
}

function CoeurQuiBat({ bpm, taille = 34, couleur = '#FF4D6D' }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: taille, height: taille }}>
      <svg viewBox="0 0 24 24" width={taille} height={taille} style={{ animation: `circ-bat ${60 / bpm}s ease-out infinite` }}>
        <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z" fill={couleur} />
      </svg>
    </span>
  )
}

export default function AnimauxView() {
  const [mode, setMode] = useState('ecouter')
  const { ecoute, ecouter } = useEcoute()

  return (
    <PageCirc code="C7" titre="Les cœurs du monde" attendus={[68]} large ecran>
      <style>{'@keyframes circ-bat { 0% { transform: scale(1); } 12% { transform: scale(1.28); } 30% { transform: scale(.96); } 45%, 100% { transform: scale(1); } }'}</style>
      <Onglets
        valeur={mode}
        onChange={setMode}
        couleur="#9DE7C2"
        options={[
          ['ecouter', Ear, 'Écouter'],
          ['classer', ArrowDownUp, 'Classer'],
          ['graphique', LineChart, 'Graphique'],
        ]}
      />
      {mode === 'ecouter' && <Ecouter ecoute={ecoute} ecouter={ecouter} />}
      {mode === 'classer' && <Classer />}
      {mode === 'graphique' && <Graphique />}
    </PageCirc>
  )
}

function Ecouter({ ecoute, ecouter }) {
  return (
    <>
      <Consigne couleur="#9DE7C2">Chaque cœur bat ici à sa vraie vitesse. Touche une carte pour l’écouter (monte le son).</Consigne>
      <div className="grid grid-cols-2 gap-2 tab:grid-cols-4">
        {ANIMAUX.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => ecouter(a)}
            className="flex flex-col gap-1 rounded-2xl border p-3 text-left active:scale-[.98]"
            style={{ borderColor: ecoute === a.id ? '#9DE7C2' : 'rgba(255,255,255,.12)', background: ecoute === a.id ? 'rgba(157,231,194,.12)' : 'rgba(18,26,48,.85)' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center text-[28px] leading-none" aria-hidden="true">
                {a.emoji}
              </span>
              <CoeurQuiBat bpm={a.bpm} />
              {ecoute === a.id && <Volume2 size={16} className="flex-none text-[#9DE7C2]" />}
              <span className="labo-mono ml-auto whitespace-nowrap text-[12px] font-bold text-[#C9D2F0]">{masseTexte(a.masse)}</span>
            </div>
            <span className="text-[14px] font-bold leading-tight text-white">{a.nom}</span>
            <span className="text-[12px] leading-snug text-[#FFB3C0]">{a.texte} battements / min</span>
            {a.note && ecoute === a.id && <span className="labo-apparait text-[12px] leading-snug text-[#DDE2F7]">{a.note}</span>}
          </button>
        ))}
      </div>
    </>
  )
}

const SERIE_CLASSER = 6
function tirageClasser() {
  // des rythmes bien différents pour que le classement ait un sens
  const l = melanger(ANIMAUX.filter((a) => !a.horsClassement))
  const choisis = []
  for (const a of l) if (choisis.every((b) => Math.abs(Math.log(b.bpm / a.bpm)) > 0.18)) choisis.push(a)
  return choisis.slice(0, SERIE_CLASSER)
}

function Classer() {
  const [liste, setListe] = useState(tirageClasser)
  const [ordre, setOrdre] = useState([])
  const [verifie, setVerifie] = useState(false)
  const [eclat, setEclat] = useState({ message: '', cle: 0 })
  const bon = [...liste].sort((a, b) => a.bpm - b.bpm)
  const juste = verifie && ordre.every((id, i) => id === bon[i].id)

  function toucher(a) {
    if (verifie) return
    setOrdre((o) => (o.includes(a.id) ? o.filter((x) => x !== a.id) : [...o, a.id]))
  }
  function verifier() {
    setVerifie(true)
    if (ordre.every((id, i) => id === bon[i].id)) setEclat((x) => ({ message: 'Parfait !', cle: x.cle + 1 }))
  }
  function rejouer() {
    setListe(tirageClasser())
    setOrdre([])
    setVerifie(false)
  }

  return (
    <>
      <Eclat message={eclat.message} cle={eclat.cle} couleur="#9DE7C2" />
      <Consigne couleur="#9DE7C2">
        Touche les animaux dans l’ordre, du cœur le plus <b>lent</b> au cœur le plus <b>rapide</b>. Indice : regarde leur masse !
      </Consigne>
      <div className="flex flex-col gap-2">
        {liste.map((a) => {
          const rang = ordre.indexOf(a.id)
          const bonRang = bon.findIndex((b) => b.id === a.id)
          const couleur = !verifie ? (rang >= 0 ? '#9DE7C2' : 'rgba(255,255,255,.12)') : rang === bonRang ? '#9DFF8A' : '#FF6B7A'
          return (
            <button key={a.id} type="button" onClick={() => toucher(a)} className="flex min-h-[56px] items-center gap-3 rounded-2xl border-2 bg-[#121A30]/90 px-3 text-left" style={{ borderColor: couleur }}>
              <span className="labo-titre flex h-9 w-9 flex-none items-center justify-center rounded-xl text-lg font-black" style={{ background: rang >= 0 ? '#9DE7C2' : 'rgba(255,255,255,.06)', color: '#06261A' }}>
                {rang >= 0 ? rang + 1 : ''}
              </span>
              <span className="flex h-9 w-9 flex-none items-center justify-center text-[28px] leading-none" aria-hidden="true">
                {a.emoji}
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold text-white">{a.nom}</span>
                <span className="labo-mono text-[11px] text-[#8A93B8]">{masseTexte(a.masse)}</span>
              </span>
              {verifie && <span className="labo-mono text-[12px] text-[#FFB3C0]">≈ {a.bpm}/min</span>}
            </button>
          )
        })}
      </div>
      {!verifie ? (
        <Bouton couleur="#9DE7C2" disabled={ordre.length < liste.length} onClick={verifier}>
          <Check size={17} /> Vérifier
        </Bouton>
      ) : (
        <>
          <p className="text-center text-[14px] text-[#DDE2F7]">{juste ? 'Bravo : plus l’animal est petit, plus son cœur bat vite !' : `Le bon ordre : ${bon.map((b) => b.nom).join(' → ')}.`}</p>
          <Bouton couleur="#9DE7C2" onClick={rejouer}>
            <RotateCcw size={16} /> Nouvelle série
          </Bouton>
        </>
      )}
    </>
  )
}

// Graphique masse / rythme (échelles logarithmiques : chaque graduation = ×10)
function Graphique() {
  const W = 340
  const H = 260
  const x = (m) => 36 + ((Math.log10(m) + 3) / 8) * (W - 50) // de 1 g (10^-3 kg) à 100 t (10^5 kg)
  const y = (b) => H - 30 - ((Math.log10(b) - 0.5) / 2.8) * (H - 50) // de ~3 à ~2000
  const [choisi, setChoisi] = useState(null)
  return (
    <div className="flex flex-col gap-3 tab:grid tab:grid-cols-[minmax(0,1fr)_380px] tab:items-start">
      <Carte couleur="rgba(157,231,194,.4)">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full tab:max-h-[52dvh]">
          {[0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000, 100000].map((m) => (
            <g key={m}>
              <line x1={x(m)} y1="12" x2={x(m)} y2={H - 30} stroke="rgba(255,255,255,.07)" />
              {[0.001, 1, 1000, 100000].includes(m) && (
                <text x={x(m)} y={H - 16} textAnchor={m >= 100000 ? 'end' : 'middle'} fontSize="9" fill="#8A93B8">
                  {masseTexte(m)}
                </text>
              )}
            </g>
          ))}
          {[10, 100, 1000].map((b) => (
            <g key={b}>
              <line x1="36" y1={y(b)} x2={W - 10} y2={y(b)} stroke="rgba(255,255,255,.1)" />
              <text x="30" y={y(b) + 3} textAnchor="end" fontSize="9" fill="#8A93B8">
                {b}
              </text>
            </g>
          ))}
          <text x={W / 2} y={H - 3} textAnchor="middle" fontSize="9.5" fill="#B9C1E3">
            masse de l’animal →
          </text>
          <text x="10" y={H / 2} textAnchor="middle" fontSize="9.5" fill="#B9C1E3" transform={`rotate(-90 10 ${H / 2})`}>
            battements / min →
          </text>
          {/* tendance */}
          <line x1={x(0.002)} y1={y(1100)} x2={x(100000)} y2={y(8)} stroke="#9DE7C2" strokeDasharray="4 4" opacity=".55" />
          {ANIMAUX.map((a) => (
            <g key={a.id} onClick={() => setChoisi(a)} style={{ cursor: 'pointer' }}>
              <circle cx={x(a.masse)} cy={y(a.bpm)} r="12" fill="transparent" />
              <circle cx={x(a.masse)} cy={y(a.bpm)} r={choisi?.id === a.id ? 7 : 5} fill={a.id === 'enfant' ? '#FFD27A' : '#FF4D6D'} stroke="#fff" strokeWidth="1.5" />
            </g>
          ))}
        </svg>
        <p className="mt-1 text-[14px] leading-snug text-[#E8ECFF]">
          {choisi ? (
            <>
              <b>{choisi.nom}</b> : {masseTexte(choisi.masse)}, {choisi.texte} battements par minute.
            </>
          ) : (
            'Touche un point pour savoir de quel animal il s’agit.'
          )}
        </p>
      </Carte>
      <Consigne couleur="#9DE7C2">
        <b>Explication :</b> plus un animal est <b>petit</b>, plus son cœur bat <b>vite</b>. Un petit corps perd sa chaleur très vite : ses cellules doivent travailler sans arrêt, et le sang doit leur apporter du dioxygène et des nutriments plus souvent.
      </Consigne>
    </div>
  )
}
