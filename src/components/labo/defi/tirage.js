import { melanger } from '../CadreJeu.jsx'

// =============================================================
//  Tirage des questions des Défis (A11, E8, C8)
//  - paquet(liste) : « paquet de cartes » : on distribue TOUT le
//    paquet avant de le rebattre → jamais deux fois la même question
//    tant que le paquet n'est pas épuisé (même si on rejoue plusieurs
//    fois pendant la séance). La première carte du nouveau paquet est
//    toujours différente de la dernière tirée.
//  - questionVF : Vrai/Faux ÉQUILIBRÉ : une chance sur deux de tirer
//    une affirmation vraie, une chance sur deux une fausse (chaque
//    vue a deux paquets séparés : VRAIS et FAUX).
//  - questionQCM : question à choix, réponses mélangées.
//  Les paquets sont créés une seule fois par vue (au chargement du
//  fichier) : ils durent donc toute la séance de l'élève.
// =============================================================
export function paquet(liste) {
  let reste = []
  let derniere
  return () => {
    if (!reste.length) {
      reste = melanger(liste)
      // pop() prend la dernière carte : elle doit être différente de la précédente
      if (liste.length > 1 && reste[reste.length - 1] === derniere) {
        const [a] = reste.splice(0, 1)
        reste.push(a)
      }
    }
    derniere = reste.pop()
    return derniere
  }
}

// vrais / faux : listes de [activité, affirmation]
export function questionVF(tirerVrai, tirerFaux) {
  const vrai = Math.random() < 0.5
  const [act, texte] = (vrai ? tirerVrai : tirerFaux)()
  return { act, type: 'vf', texte, choix: ['vrai', 'faux'], bonne: vrai ? 'vrai' : 'faux' }
}

// liste : [activité, question, bonne réponse, [choix]]
export function questionQCM(tirer) {
  const [act, texte, bonne, choix] = tirer()
  return { act, type: 'qcm', texte, choix: melanger(choix), bonne }
}

// Choix d'une famille de questions selon des poids : [[poids, fonction], …]
export function famille(poids) {
  const total = poids.reduce((t, [p]) => t + p, 0)
  let r = Math.random() * total
  for (const [p, f] of poids) {
    r -= p
    if (r <= 0) return f()
  }
  return poids[poids.length - 1][1]()
}
