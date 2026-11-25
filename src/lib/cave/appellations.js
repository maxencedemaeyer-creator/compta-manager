import { STYLE_PAR_ID, COULEURS } from '../../data/cave/styles.js'
import frNordEst from '../../data/cave/fr-nord-est.js'
import frLoireRhone from '../../data/cave/fr-loire-rhone.js'
import frSud from '../../data/cave/fr-sud.js'
import itNord from '../../data/cave/it-nord.js'
import itCentre from '../../data/cave/it-centre.js'
import itSud from '../../data/cave/it-sud.js'

// =============================================================
//  Base des appellations (AOC/AOP françaises, DOC/DOCG italiennes)
//
//  Format d'une ligne des fichiers src/data/cave/fr-*.js et it-*.js :
//
//    Nom ; Région ; TYPE=style[,prix[,minGarde-maxGarde]][~cépage+cépage] ; TYPE=…
//
//    TYPE   : R rouge · B blanc · P rosé · E effervescent · D doux/liquoreux · F fortifié/oxydatif
//    style  : identifiant d'un style de src/data/cave/styles.js (ex. b-mineral, r-nebb)
//    prix   : prix moyen d'une bouteille en € (facultatif : prix du style par défaut)
//    garde  : années de garde après le millésime, ex. 3-12 (facultatif : garde du style)
//    cépages: séparés par « + » (facultatif)
//
//  Exemple :  Chablis;Bourgogne;B=b-mineral,22,2-8~Chardonnay
//  Les lignes vides ou qui commencent par # sont ignorées.
// =============================================================

export function normaliser(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[’'`´\-–—_/.,;:!?()«»"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function lireType(brut) {
  const [gauche, droite = ''] = brut.split('~')
  const egal = gauche.indexOf('=')
  if (egal < 1) return null
  const code = gauche.slice(0, egal).trim()
  const [styleId, prix, garde] = gauche
    .slice(egal + 1)
    .split(',')
    .map((s) => s.trim())
  const style = STYLE_PAR_ID[styleId]
  if (!COULEURS[code] || !style) return { erreur: `${code}=${styleId}` }
  let gardeMinMax = style.garde
  const m = /^(\d+)-(\d+)$/.exec(garde || '')
  if (m) gardeMinMax = [Number(m[1]), Number(m[2])]
  return {
    code,
    style: style.id,
    prix: prix ? Number(prix) : style.prix,
    garde: gardeMinMax,
    cepages: droite
      .split('+')
      .map((c) => c.trim())
      .filter(Boolean),
  }
}

// Texte brut → liste d'appellations. `erreurs` reçoit les lignes invalides (utilisé par les tests).
export function lireAppellations(texte, pays, erreurs = []) {
  const resultat = []
  for (const ligne of texte.split('\n')) {
    const l = ligne.trim()
    if (!l || l.startsWith('#')) continue
    const [nom, region, ...tokens] = l.split(';').map((s) => s.trim())
    const types = []
    for (const t of tokens) {
      const type = lireType(t)
      if (!type || type.erreur) erreurs.push(`${nom} : ${type?.erreur || t}`)
      else if (!types.some((x) => x.code === type.code)) types.push(type)
    }
    if (!nom || !region || types.length === 0) {
      erreurs.push(`ligne invalide : ${l}`)
      continue
    }
    resultat.push({
      id: `${pays.toLowerCase()}:${normaliser(nom).replace(/ /g, '-')}`,
      nom,
      region,
      pays,
      types,
      cle: normaliser(nom),
      cleRegion: normaliser(region),
    })
  }
  return resultat
}

export const SOURCES = [
  [frNordEst, 'FR'],
  [frLoireRhone, 'FR'],
  [frSud, 'FR'],
  [itNord, 'IT'],
  [itCentre, 'IT'],
  [itSud, 'IT'],
]

export const APPELLATIONS = SOURCES.flatMap(([texte, pays]) => lireAppellations(texte, pays))

const PAR_ID = new Map(APPELLATIONS.map((a) => [a.id, a]))
const PAR_CLE = new Map(APPELLATIONS.map((a) => [a.cle, a]))

export const trouverAppellationParId = (id) => PAR_ID.get(id) || null
export const trouverAppellationParNom = (nom) => PAR_CLE.get(normaliser(nom)) || null

export const PAYS = { FR: { nom: 'France', drapeau: '🇫🇷' }, IT: { nom: 'Italie', drapeau: '🇮🇹' } }

// Recherche tolérante (sans accents, tous les mots doivent apparaître dans le nom ou la région)
export function chercherAppellations(requete, limite = 12) {
  const mots = normaliser(requete).split(' ').filter(Boolean)
  if (mots.length === 0) return []
  const scores = []
  for (const a of APPELLATIONS) {
    const cible = `${a.cle} ${a.cleRegion}`
    if (!mots.every((m) => cible.includes(m))) continue
    let score = 0
    if (a.cle === mots.join(' ')) score += 100
    if (a.cle.startsWith(mots.join(' '))) score += 40
    if (mots.every((m) => a.cle.includes(m))) score += 20
    score -= a.cle.length / 20
    scores.push([score, a])
  }
  return scores
    .sort((x, y) => y[0] - x[0])
    .slice(0, limite)
    .map(([, a]) => a)
}

// Toutes les « entrées » vin possibles : une par appellation et par type (sert aux suggestions hors cave)
export const ENTREES = APPELLATIONS.flatMap((a) =>
  a.types.map((t) => ({
    appellationId: a.id,
    nom: a.nom,
    region: a.region,
    cleRegion: a.cleRegion,
    pays: a.pays,
    code: t.code,
    style: STYLE_PAR_ID[t.style],
    prix: t.prix,
    garde: t.garde,
    cepages: t.cepages,
  }))
)

export function entreeDe(appellationId, code) {
  const a = PAR_ID.get(appellationId)
  const t = a?.types.find((x) => x.code === code)
  if (!a || !t) return null
  return ENTREES.find((e) => e.appellationId === appellationId && e.code === code) || null
}

export const REGIONS = [...new Set(APPELLATIONS.map((a) => `${a.pays}|${a.region}`))]
  .map((s) => {
    const [pays, region] = s.split('|')
    return { pays, region }
  })
  .sort((a, b) => a.pays.localeCompare(b.pays) || a.region.localeCompare(b.region, 'fr'))

// Appellations que tout le monde connaît : à score égal, on les propose avant les confidentielles
const CELEBRES_TEXTE = `champagne;chablis;petit chablis;chablis premier cru;sancerre;pouilly-fumé;muscadet;muscadet sèvre-et-maine;vouvray;chinon;bourgueil;saumur-champigny;savennières;coteaux du layon;alsace;alsace grand cru;crémant d'alsace;bourgogne;mâcon-villages;pouilly-fuissé;saint-véran;meursault;puligny-montrachet;chassagne-montrachet;gevrey-chambertin;chambolle-musigny;nuits-saint-georges;vosne-romanée;pommard;volnay;beaune;mercurey;givry;rully;santenay;beaujolais;beaujolais-villages;brouilly;fleurie;morgon;moulin-à-vent;juliénas;côtes du rhône;côtes du rhône villages;châteauneuf-du-pape;gigondas;vacqueyras;crozes-hermitage;saint-joseph;hermitage;côte-rôtie;cornas;condrieu;lirac;tavel;côtes de provence;bandol;cassis;coteaux d'aix-en-provence;languedoc;pic saint-loup;saint-chinian;faugères;minervois;corbières;fitou;picpoul de pinet;banyuls;maury;rivesaltes;muscat de beaumes-de-venise;cahors;madiran;jurançon;bergerac;monbazillac;gaillac;bordeaux;bordeaux supérieur;médoc;haut-médoc;margaux;pauillac;saint-julien;saint-estèphe;pessac-léognan;graves;saint-émilion;saint-émilion grand cru;pomerol;sauternes;entre-deux-mers;côtes de bourg;fronsac;arbois;château-chalon;patrimonio;crémant de loire;crémant de bourgogne;blanquette de limoux;clairette de die;touraine;anjou;menetou-salon;quincy;barolo;barbaresco;barbera d'alba;barbera d'asti;dolcetto d'alba;langhe;gavi;asti;moscato d'asti;chianti;chianti classico;brunello di montalcino;rosso di montalcino;vino nobile di montepulciano;morellino di scansano;bolgheri;vernaccia di san gimignano;montepulciano d'abruzzo;trebbiano d'abruzzo;verdicchio dei castelli di jesi;orvieto;orvieto classico;frascati;soave;soave classico;valpolicella;valpolicella ripasso;amarone della valpolicella;bardolino;prosecco;prosecco conegliano valdobbiadene;franciacorta;trento;alto adige;alto adige gewürztraminer;lugana;collio;lambrusco di sorbara;lambrusco grasparossa di castelvetro;taurasi;fiano di avellino;greco di tufo;falanghina del sannio;primitivo di manduria;salice salentino;aglianico del vulture;etna;cerasuolo di vittoria;marsala;cannonau di sardegna;vermentino di gallura;cinque terre;rossese di dolceacqua;pigato;montefalco sagrantino;rosso conero;vin santo del chianti;moscato di pantelleria;passito di pantelleria;recioto della valpolicella;roero arneis;nebbiolo d'alba;sicilia;maremma toscana;romagna sangiovese`
export const CELEBRES = new Set(CELEBRES_TEXTE.split(';').map(normaliser))
