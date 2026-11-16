import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { withTimeout } from '../utils/withTimeout.js'

// =============================================================
//  MOTUS — données du joueur sur Firebase (jamais en local)
//
//  Un seul document : jeux/motus
//  → { partie, stats, parametres, motsJoues, vuRegles, maj }
//  1 lecture à l'ouverture du jeu, 1 écriture au tirage d'un mot,
//  1 écriture par essai validé, 1 écriture par changement de réglage.
// =============================================================
const REF = () => doc(db, 'jeux', 'motus')

export function useMotus() {
  async function charger() {
    const snap = await withTimeout(getDoc(REF()))
    return snap.exists() ? snap.data() : {}
  }

  async function enregistrer(champs) {
    await withTimeout(setDoc(REF(), { ...champs, maj: serverTimestamp() }, { merge: true }))
  }

  return { charger, enregistrer }
}
