// =============================================================
//  Mon jardin : emoji et fond de chaque jardin (au choix de Max)
//  Les classes Tailwind sont écrites en entier pour être gardées au build.
// =============================================================
export const EMOJI_PAR_DEFAUT = '🌳'

export const EMOJIS = [
  '🌳', '🌲', '🌿', '🌱', '🍀', '🌷', '🌻', '🌹', '🌸', '🌺',
  '🪴', '🌵', '🌴', '🍎', '🍋', '🍊', '🍅', '🥕', '🍓', '🍇',
  '🏡', '🏠', '🏫', '🏢', '⛲', '🪵', '🐝', '🦋', '🐦', '🐓',
]

export const THEME_PAR_DEFAUT = 'vert'

export const THEMES = {
  vert: { nom: 'Vert', swatch: 'bg-emerald-400', tuile: 'bg-emerald-200', carte: 'bg-emerald-50 border-emerald-200', page: 'from-emerald-100 via-emerald-50 to-white' },
  menthe: { nom: 'Menthe', swatch: 'bg-teal-400', tuile: 'bg-teal-200', carte: 'bg-teal-50 border-teal-200', page: 'from-teal-100 via-teal-50 to-white' },
  citron: { nom: 'Citron', swatch: 'bg-lime-400', tuile: 'bg-lime-200', carte: 'bg-lime-50 border-lime-200', page: 'from-lime-100 via-lime-50 to-white' },
  soleil: { nom: 'Soleil', swatch: 'bg-yellow-300', tuile: 'bg-yellow-200', carte: 'bg-yellow-50 border-yellow-200', page: 'from-yellow-100 via-yellow-50 to-white' },
  peche: { nom: 'Pêche', swatch: 'bg-orange-300', tuile: 'bg-orange-200', carte: 'bg-orange-50 border-orange-200', page: 'from-orange-100 via-orange-50 to-white' },
  rose: { nom: 'Rose', swatch: 'bg-pink-300', tuile: 'bg-pink-200', carte: 'bg-pink-50 border-pink-200', page: 'from-pink-100 via-pink-50 to-white' },
  lilas: { nom: 'Lilas', swatch: 'bg-violet-300', tuile: 'bg-violet-200', carte: 'bg-violet-50 border-violet-200', page: 'from-violet-100 via-violet-50 to-white' },
  ciel: { nom: 'Ciel', swatch: 'bg-sky-300', tuile: 'bg-sky-200', carte: 'bg-sky-50 border-sky-200', page: 'from-sky-100 via-sky-50 to-white' },
  sable: { nom: 'Sable', swatch: 'bg-amber-200', tuile: 'bg-amber-100', carte: 'bg-amber-50 border-amber-200', page: 'from-amber-100 via-amber-50 to-white' },
  ardoise: { nom: 'Ardoise', swatch: 'bg-slate-300', tuile: 'bg-slate-200', carte: 'bg-slate-50 border-slate-200', page: 'from-slate-200 via-slate-50 to-white' },
}

export const themeDe = (jardin) => THEMES[jardin?.fond] || THEMES[THEME_PAR_DEFAUT]
export const emojiDe = (jardin) => jardin?.emoji || EMOJI_PAR_DEFAUT

// Garde le premier « caractère visible » tapé (un emoji), ou '' si ce n'est pas un emoji
export function premierEmoji(texte) {
  const t = (texte || '').trim()
  if (!t) return ''
  let premier
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    for (const { segment } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t)) {
      premier = segment
      break
    }
  } else {
    premier = Array.from(t)[0]
  }
  return /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(premier || '') ? premier : ''
}
