// =============================================================
//  Cave — les « styles » de vin (archétypes)
//  Une appellation pointe vers un style par type de vin (voir appellations*.js).
//  Le moteur d'accords (src/lib/cave/accord.js) ne lit QUE ces styles : en
//  ajouter ou en corriger un change l'accord de toutes les appellations liées.
//
//  Notes de 0 à 5 :  c corps · a acidité · t tanins · s sucre · b boisé
//                    r intensité aromatique · m minéralité / salinité
//  Couleurs : R rouge · B blanc sec · P rosé · E effervescent · D doux/liquoreux · F fortifié/oxydatif
// =============================================================

const COULEURS = {
  R: { nom: 'Rouge', emoji: '🍷', ordre: 1 },
  B: { nom: 'Blanc', emoji: '🥂', ordre: 2 },
  P: { nom: 'Rosé', emoji: '🌸', ordre: 3 },
  E: { nom: 'Effervescent', emoji: '🍾', ordre: 4 },
  D: { nom: 'Doux / liquoreux', emoji: '🍯', ordre: 5 },
  F: { nom: 'Fortifié / oxydatif', emoji: '🥃', ordre: 6 },
}
export { COULEURS }

function S(id, nom, couleur, notes, tags, prix, garde, temp, exemple) {
  const v = { c: 3, a: 3, t: 0, s: 0, b: 0, r: 3, m: 2 }
  for (const [, lettre, n] of notes.matchAll(/([a-z])(\d)/g)) v[lettre] = Number(n)
  return {
    id,
    nom,
    couleur,
    corps: v.c,
    acidite: v.a,
    tanins: v.t,
    sucre: v.s,
    boise: v.b,
    arome: v.r,
    mineral: v.m,
    bulles: couleur === 'E',
    tags: tags.split(' ').filter(Boolean),
    prix,
    garde, // [années min, années max] après le millésime
    temp, // température de service (°C)
    exemple,
  }
}

export const STYLES = [
  // ----- Blancs secs
  S('b-leger', 'Blanc léger et neutre', 'B', 'c1a3t0r1m2', 'leger sec neutre', 8, [0, 2], 8, 'Pinot grigio, Soave, Entre-deux-Mers'),
  S('b-fruite', 'Blanc fruité et souple', 'B', 'c2a3t0r3m2', 'fruite souple sec', 11, [0, 3], 9, 'Vermentino, Pinot blanc, Côtes de Gascogne'),
  S('b-mineral', 'Blanc minéral et tendu', 'B', 'c2a4t0r2m4', 'mineral vif sec salin', 16, [1, 6], 9, 'Chablis, Muscadet, Petit Chablis'),
  S('b-sauv', 'Blanc vif et aromatique (Sauvignon)', 'B', 'c2a5t0r4m3', 'vif aromatique sec mineral', 15, [0, 4], 9, 'Sancerre, Pouilly-Fumé, Sauvignon'),
  S('b-salin', 'Blanc salin du Sud', 'B', 'c3a3t0r3m4', 'salin mediterraneen sec fruite', 14, [0, 4], 9, 'Fiano, Greco, Vermentino di Gallura, Cassis'),
  S('b-chenin', 'Chenin sec et tendu', 'B', 'c3a4t0r3m3', 'vif sec mineral rond', 18, [2, 12], 10, 'Savennières, Vouvray sec, Anjou blanc'),
  S('b-arom', 'Blanc aromatique sec (Riesling, Gewurz…)', 'B', 'c3a4t0r5m3', 'aromatique sec vif epice', 16, [1, 10], 9, 'Riesling, Gewurztraminer, Muscat sec'),
  S('b-rond', 'Blanc rond et beurré (Chardonnay)', 'B', 'c4a3t0b2r3m2', 'rond gras boise sec', 28, [2, 8], 11, 'Mâcon, Saint-Véran, Bourgogne blanc'),
  S('b-ample', 'Blanc ample et boisé', 'B', 'c5a3t0b4r4m3', 'ample gras boise puissant sec', 55, [4, 15], 12, 'Meursault, Pessac-Léognan, Chassagne'),
  S('b-rhone', 'Blanc solaire et gras (Rhône)', 'B', 'c4a2t0b1r4m2', 'gras solaire ample sec', 22, [1, 7], 11, 'Condrieu, Marsanne, Roussanne, Viognier'),
  // ----- Rosés
  S('p-leger', 'Rosé léger et vif', 'P', 'c2a3t0r3m2', 'leger vif fruite', 10, [0, 2], 8, 'Provence, Côtes de Provence'),
  S('p-gastro', 'Rosé de repas, charpenté', 'P', 'c3a3t1r3m2', 'charpente gastronomique', 14, [0, 3], 10, 'Tavel, Bandol rosé, Cerasuolo'),
  // ----- Rouges
  S('r-leger', 'Rouge léger et fruité', 'R', 'c2a3t1r3m1', 'leger fruite souple', 11, [0, 3], 13, 'Beaujolais, Bardolino, Valpolicella'),
  S('r-frais', 'Rouge frais et végétal (Cabernet franc)', 'R', 'c3a4t2r3m2', 'frais fruite vif', 15, [2, 8], 14, 'Chinon, Bourgueil, Saumur-Champigny'),
  S('r-pinot', 'Rouge élégant et soyeux (Pinot noir)', 'R', 'c3a4t2b1r4m2', 'elegant soyeux fruite', 32, [3, 12], 15, 'Bourgogne rouge, Gevrey, Chambolle'),
  S('r-souple', 'Rouge souple et rond', 'R', 'c3a2t2b1r3m1', 'souple rond fruite', 12, [1, 6], 16, 'Merlot, Côtes de Bordeaux, Montepulciano jeune'),
  S('r-sangio', 'Rouge Sangiovese (cerise, acidité)', 'R', 'c3a4t3b1r3m2', 'sangiovese acide tannique gastronomique', 18, [2, 10], 16, 'Chianti, Rosso di Montalcino, Morellino'),
  S('r-bordeaux', 'Rouge charpenté classique (Cabernet-Merlot)', 'R', 'c4a3t4b3r3m2', 'charpente tannique boise classique', 30, [5, 20], 17, 'Médoc, Saint-Émilion, Pessac'),
  S('r-syrah', 'Rouge épicé et poivré (Syrah)', 'R', 'c4a3t3b1r4m2', 'epice poivre charpente', 22, [3, 12], 16, 'Crozes-Hermitage, Saint-Joseph, Cornas'),
  S('r-gourmand', 'Rouge gourmand et chaleureux', 'R', 'c4a2t3b1r4m1', 'gourmand solaire chaleureux', 15, [2, 8], 16, 'Montepulciano, Nero d’Avola, Cannonau, Corbières'),
  S('r-sud', 'Rouge puissant et solaire', 'R', 'c5a2t3b2r4m1', 'puissant solaire epice', 28, [3, 12], 17, 'Châteauneuf-du-Pape, Primitivo, Gigondas'),
  S('r-tannique', 'Rouge rustique et tannique', 'R', 'c5a3t5b2r3m1', 'tannique rustique puissant charpente', 20, [4, 15], 17, 'Cahors, Madiran, Taurasi'),
  S('r-nebb', 'Rouge Nebbiolo (tanins fermes, acidité)', 'R', 'c4a4t5b2r4m2', 'nebbiolo tannique acide elegant puissant', 55, [8, 25], 17, 'Barolo, Barbaresco, Gattinara'),
  S('r-grand', 'Grand rouge puissant et concentré', 'R', 'c5a3t4b4r5m2', 'puissant concentre boise tannique grand', 70, [8, 30], 18, 'Amarone, Brunello, Sagrantino, grands crus'),
  // ----- Effervescents
  S('e-fruite', 'Mousseux fruité et léger', 'E', 'c2a3s1r3m2', 'mousseux fruite leger', 11, [0, 2], 7, 'Prosecco, Crémant, Blanquette, Lambrusco blanc'),
  S('e-brut', 'Mousseux brut, fin et vif', 'E', 'c3a4s0r3m3', 'mousseux vif brut fin', 32, [0, 8], 8, 'Champagne, Franciacorta, Trento, Crémant long élevage'),
  S('e-doux', 'Mousseux doux et aromatique', 'E', 'c1a2s3r4m1', 'mousseux doux aromatique leger', 9, [0, 2], 6, 'Asti, Moscato d’Asti, Clairette de Die'),
  S('e-rouge', 'Mousseux rouge (Lambrusco)', 'E', 'c2a3t2s1r3m1', 'mousseux rouge fruite', 9, [0, 2], 10, 'Lambrusco, Brachetto sec'),
  // ----- Doux et liquoreux
  S('d-moelleux', 'Moelleux tendu (Chenin, Riesling…)', 'D', 'c3a4s3r4m2', 'doux moelleux vif', 20, [3, 20], 9, 'Coteaux du Layon, Vouvray moelleux, Vendanges tardives'),
  S('d-muscat', 'Muscat doux et floral', 'D', 'c3a2s4r5m1', 'doux muscat aromatique floral', 14, [0, 5], 8, 'Muscat de Beaumes-de-Venise, Moscato passito, Muscat de Rivesaltes'),
  S('d-liquoreux', 'Liquoreux (botrytis)', 'D', 'c4a3s5b2r5m2', 'liquoreux doux botrytis', 38, [5, 40], 8, 'Sauternes, Barsac, Monbazillac, Cadillac'),
  S('d-passito', 'Passito et vin de paille', 'D', 'c4a3s4b1r5m1', 'doux passito noix', 32, [5, 30], 11, 'Vin Santo, Passito, Vin de paille'),
  S('d-recioto', 'Rouge doux (Recioto, Brachetto)', 'D', 'c3a3t2s3r4m1', 'doux rouge fruite', 22, [2, 15], 13, 'Recioto della Valpolicella, Brachetto d’Acqui'),
  // ----- Fortifiés et oxydatifs
  S('f-jaune', 'Vin jaune et vin oxydatif sec', 'F', 'c4a3t0s0b2r5m3', 'oxydatif noix sec jaune puissant', 50, [10, 60], 14, 'Vin jaune, Château-Chalon, Marsala sec'),
  S('f-vdn', 'Vin doux naturel / fortifié', 'F', 'c5a2t2s4b1r5m1', 'fortifie doux vdn puissant', 22, [3, 35], 14, 'Banyuls, Maury, Rivesaltes ambré'),
  S('f-marsala', 'Marsala et vin fortifié sicilien', 'F', 'c4a2s2b1r4m2', 'fortifie oxydatif', 18, [2, 30], 14, 'Marsala'),
]

export const STYLE_PAR_ID = Object.fromEntries(STYLES.map((s) => [s.id, s]))

// Tous les tags connus (sert à distinguer « tag de style » et « nom d'appellation » dans les affinités)
export const TAGS_STYLES = new Set(STYLES.flatMap((s) => s.tags))
