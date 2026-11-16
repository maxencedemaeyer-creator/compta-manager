import { Activity, Bone, Brain, Dumbbell, HeartPulse, Microscope, PersonStanding, ScanFace, Shield, Siren, Bird, Zap } from 'lucide-react'

// =============================================================
//  Le labo de sciences : l'expérience de la semaine et ses paillasses.
//  Référentiel P3-P4, « 5.2 Les forces de l'appareil moteur »,
//  attendus n° 111 à 121.
//  Pour ajouter une paillasse : un objet ici + sa route dans App.jsx.
// =============================================================
export const EXPERIENCE = {
  numero: '07',
  titre: 'Le système locomoteur',
  accroche: 'Os, muscles, tendons et articulations : comment ton corps bouge-t-il ?',
  attendus: '111 à 121',
}

export const ATTENDUS = {
  111: 'Repérer muscles, os et tendons et expliquer leur rôle dans la flexion d’un bras ou d’une jambe (représentation mobile)',
  112: 'Repérer quelques os sur un squelette',
  113: 'Repérer les articulations : hanche, genou, cheville, épaule, coude, poignet',
  114: 'Un mouvement peut être commandé par le cerveau ; l’information circule par les nerfs',
  115: 'Les fonctions du squelette : soutien, locomotion et protection',
  116: 'Utiliser le vocabulaire du système locomoteur',
  117: 'Un muscle doit être attaché à au moins deux os par des tendons pour qu’un membre bouge',
  118: 'Une mise en mouvement suppose une force qui s’exerce',
  119: 'Observer une dissection : relation entre os et muscles',
  120: 'Repérer les éléments d’une flexion ou d’une extension : muscles, tendons, os',
  121: 'Repérer le muscle responsable d’un mouvement du bras ou de la jambe',
}

export const PAILLASSES = [
  { id: 'miroir', code: 'A1', titre: 'Le miroir à rayons X', texte: 'Ton propre squelette, en direct', icon: ScanFace, couleur: '#6FEFFF', attendus: [112, 113, 120, 121], vedette: true },
  { id: 'puzzle', code: 'A2', titre: 'Squelette explosé', texte: 'Remonte les os et les articulations', icon: Bone, couleur: '#9DFF8A', attendus: [112, 113] },
  { id: 'bras', code: 'A3', titre: 'Le bras mécanique', texte: 'Accroche le muscle, fais bouger le bras', icon: Dumbbell, couleur: '#C9A3FF', attendus: [111, 117, 118, 120] },
  { id: 'qui-tire', code: 'A4', titre: 'Qui tire ?', texte: 'Trouve le muscle qui travaille', icon: Activity, couleur: '#FFB86B', attendus: [120, 121] },
  { id: 'pantin', code: 'A5', titre: 'Le pantin du savant fou', texte: 'Place les articulations… et danse', icon: PersonStanding, couleur: '#FF8AD8', attendus: [113, 120] },
  { id: 'protection', code: 'A6', titre: 'Mission protection', texte: 'Soutien, locomotion ou protection ?', icon: Shield, couleur: '#7CB8FF', attendus: [115] },
  { id: 'reflexes', code: 'A7', titre: 'Message express', texte: 'Du cerveau au muscle + test de réflexes', icon: Brain, couleur: '#FFD27A', attendus: [114] },
  { id: 'dissection', code: 'A8', titre: 'Le scalpel', texte: 'Dissèque couche par couche', icon: Microscope, couleur: '#FF8A95', attendus: [119, 120] },
  { id: 'cousins', code: 'A9', titre: 'Les cousins cachés', texte: 'Mêmes os chez l’oiseau, la baleine…', icon: Bird, couleur: '#9DE7C2', attendus: [112] },
  { id: 'urgences', code: 'A10', titre: 'Service des urgences', texte: 'De vraies radios de fractures', icon: Siren, couleur: '#FF6B7A', attendus: [112, 115] },
  { id: 'defi', code: 'A11', titre: 'Défi éclair', texte: '60 secondes, tableau des records', icon: Zap, couleur: '#FFE45E', attendus: [112, 113, 116] },
]

export const PAILLASSE = Object.fromEntries(PAILLASSES.map((p) => [p.id, p]))

// Icône d'en-tête du labo
export const IconeLabo = HeartPulse
