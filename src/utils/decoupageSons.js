// =============================================================
//  Appli « Lis-moi » : moteur des « sons en couleur »
//  REPRIS TEL QUEL du site INTERFACE-ELEVES de Max (src/moteur/decoupage-sons.ts,
//  « Aide à la lecture » de la valise de Lola, 19/11/2026), converti en JavaScript.
//  Ne pas modifier ici sans le modifier là-bas (ou l'inverse) : même moteur.
//
//  Principe : la prononciation de chaque mot vient du dictionnaire Lexique 3.83
//  (public/lecture/sons.txt, découpé à l'avance, licence CC BY-SA 4.0, voir
//  public/lecture/LICENCE-lexique.txt). Un mot inconnu n'est JAMAIS coloré ;
//  un mot à plusieurs prononciations est lu d'après ses voisins, et quand on ne
//  peut pas trancher, seules les lettres qui se lisent pareil sont colorées.
//  → « en cas de doute, ne pas colorer plutôt que colorer à tort ».
// =============================================================
const COULEURS_SONS = {
  r: "ou (rouge)",
  n: "oi (noir)",
  b: "oin, ien (blanc)",
  j: "o, au, eau (jaune)",
  m: "on, om (brun)",
  c: "eu, oeu (bleu clair)",
  o: "an, am, en, em (orange)",
  v: "in, im, ain, ein (vert)",
  p: "\xE9, er, ez (rose)",
  l: "\xE8, \xEA, ai, ei, et (mauve)",
  g: "lettres pi\xE8ges et sons hors du m\xE9mo (gris fonc\xE9)",
  x: "lettre muette (gris clair, point dessous)"
};
const REGLES = [
  // Voyelles simples
  ["a", ["a"]],
  ["\xE0", ["a"]],
  ["\xE2", ["a"]],
  ["e", ["\xB0", "e", "E"]],
  ["e", ["a", "2", "9"], 1.6],
  ["\xE9", ["e", "E"]],
  ["\xE8", ["E", "e"]],
  ["\xEA", ["E", "e"]],
  ["\xEB", ["E", "e"]],
  ["i", ["i", "j"]],
  ["i", ["ij"], 1.3],
  ["\xEE", ["i"]],
  ["\xEF", ["i", "j"]],
  ["y", ["i", "j"]],
  ["y", ["ij"], 1.3],
  ["o", ["o", "O"]],
  ["\xF4", ["o", "O"]],
  ["u", ["y", "8"]],
  ["\xFB", ["y"]],
  ["\xF9", ["y"]],
  ["u", ["O", "u", "9"], 1.6],
  ["ue", ["9"], 1.3],
  // Voyelles du mémo
  ["ou", ["u", "w"]],
  ["o\xF9", ["u"]],
  ["o\xFB", ["u"]],
  ["oi", ["wa"]],
  ["o\xEE", ["wa"]],
  ["oi", ["O"], 1.6],
  ["oin", ["w5"]],
  ["ien", ["j5"]],
  ["au", ["o", "O"]],
  ["eau", ["o", "O"]],
  ["on", ["\xA7"]],
  ["om", ["\xA7"]],
  ["eu", ["2", "9"]],
  ["e\xFB", ["2"]],
  ["oeu", ["2", "9"]],
  ["oe", ["2", "9", "E", "e"], 1.3],
  ["eu", ["y"], 1.3],
  ["ai", ["\xB0"], 1.6],
  ["on", ["\xB0"], 1.6],
  ["ao\xFB", ["u"], 1.3],
  ["an", ["@"]],
  ["am", ["@"]],
  ["en", ["@", "5"]],
  ["em", ["@"]],
  ["aon", ["@"]],
  ["in", ["5"]],
  ["im", ["5"]],
  ["ain", ["5"]],
  ["aim", ["5"]],
  ["ein", ["5"]],
  ["yn", ["5"]],
  ["ym", ["5"]],
  ["un", ["1", "5"]],
  ["um", ["1", "5"]],
  ["\xE9", ["e"]],
  ["er", ["e", "E"]],
  ["ez", ["e", "E"]],
  ["ai", ["E", "e"]],
  ["a\xEE", ["E", "e"]],
  ["ei", ["E", "e"]],
  ["et", ["E", "e"]],
  ["ay", ["Ej", "ej", "ei", "Ei", "E"]],
  ["ey", ["E", "Ej"]],
  ["oy", ["waj", "wa"]],
  ["oo", ["u", "o", "O"]],
  // Consonnes
  ["b", ["b", "p"]],
  ["bb", ["b"]],
  ["c", ["k", "s"]],
  ["c", ["g"], 1.6],
  ["cc", ["k", "ks"]],
  ["\xE7", ["s"]],
  ["ch", ["S", "k"]],
  ["ck", ["k"]],
  ["cqu", ["k"]],
  ["sch", ["S"]],
  ["d", ["d", "t"]],
  ["dd", ["d"]],
  ["f", ["f"]],
  ["ff", ["f"]],
  ["ph", ["f"]],
  ["g", ["g", "Z"]],
  ["gg", ["g", "gZ"]],
  ["ge", ["Z"]],
  ["gu", ["g", "gw", "g8"]],
  ["gn", ["N", "nj"]],
  ["ng", ["G"]],
  ["j", ["Z", "dZ"]],
  ["k", ["k"]],
  ["l", ["l"]],
  ["ll", ["l", "j"]],
  ["il", ["j"]],
  ["ill", ["j", "ij"]],
  ["m", ["m"]],
  ["mm", ["m"]],
  ["n", ["n"]],
  ["nn", ["n"]],
  ["p", ["p"]],
  ["pp", ["p"]],
  ["q", ["k"]],
  ["qu", ["k", "kw"]],
  ["r", ["R"]],
  ["rr", ["R"]],
  ["s", ["s", "z"]],
  ["ss", ["s"]],
  ["sc", ["s"]],
  ["t", ["t"]],
  ["t", ["s"], 1.3],
  ["tt", ["t"]],
  ["th", ["t"]],
  ["v", ["v"]],
  ["w", ["w", "v"]],
  ["x", ["ks", "gz", "s", "z"]],
  ["z", ["z"]],
  ["zz", ["dz", "z"]]
];
const MUETTES = /* @__PURE__ */ new Set(["e", "h", "s", "t", "d", "x", "z", "p", "c", "g", "l", "r", "b", "m", "n", "f"]);
const PAR_DEBUT = /* @__PURE__ */ new Map();
for (const r of REGLES) {
  const k = r[0][0];
  if (!PAR_DEBUT.has(k)) PAR_DEBUT.set(k, []);
  PAR_DEBUT.get(k).push(r);
}
function decouper(mot, phon) {
  const L = mot.length;
  const P = phon.length;
  const prix = Array.from({ length: L + 1 }, () => Array(P + 1).fill(Infinity));
  const retour = Array.from({ length: L + 1 }, () => Array(P + 1).fill(null));
  prix[0][0] = 0;
  for (let i = 0; i < L; i++) {
    for (let j = 0; j <= P; j++) {
      const base = prix[i][j];
      if (base === Infinity) continue;
      const essayer = (n, son, cout) => {
        const i2 = i + n;
        const j2 = j + son.length;
        if (i2 > L || j2 > P || phon.slice(j, j2) !== son) return;
        if (base + cout < prix[i2][j2]) {
          prix[i2][j2] = base + cout;
          retour[i2][j2] = [i, j, { lettres: mot.slice(i, i2), son }];
        }
      };
      for (const [g, sons, cout = 1] of PAR_DEBUT.get(mot[i]) ?? []) {
        if (!mot.startsWith(g, i)) continue;
        for (const s of sons) essayer(g.length, s, cout);
      }
      if (MUETTES.has(mot[i])) essayer(1, "", mot[i] === "e" ? 1.1 : i === L - 1 ? 1.2 : 1.4);
      if (i + 3 === L && mot.endsWith("ent")) essayer(3, "", 1.1);
    }
  }
  if (prix[L][P] === Infinity) return null;
  const morceaux = [];
  for (let i = L, j = P; i > 0; ) {
    const [i0, j0, m] = retour[i][j];
    morceaux.unshift(m);
    i = i0;
    j = j0;
  }
  return morceaux;
}
const MEMO = [
  ["r", ["ou", "o\xF9", "o\xFB"], ["u"]],
  ["n", ["oi", "o\xEE"], ["wa"]],
  ["b", ["oin"], ["w5"]],
  ["b", ["ien"], ["j5"]],
  ["j", ["o", "\xF4", "au", "eau"], ["o", "O"]],
  ["m", ["on", "om"], ["\xA7"]],
  ["c", ["eu", "e\xFB", "oeu"], ["2", "9"]],
  ["o", ["an", "am", "en", "em", "aon"], ["@"]],
  ["v", ["in", "im", "ain", "aim", "ein", "yn", "ym", "en"], ["5"]],
  // Rose ou mauve selon le son vraiment prononcé (Max, 19/11 : « rigoureusement précis ») : « et », « j'ai » [e] en
  // rose ; « poulet », « maison », « tête » [ɛ] en mauve.
  ["p", ["\xE9", "er", "ez", "\xE8", "\xEA", "\xEB", "ai", "a\xEE", "ei", "et"], ["e"]],
  ["l", ["\xE8", "\xEA", "\xEB", "ai", "a\xEE", "ei", "et", "\xE9", "er", "ez"], ["E"]]
];
const PIEGES = [
  ["\xE7", null],
  ["c", ["s", "g"]],
  ["cc", null],
  ["ss", null],
  ["sc", null],
  ["t", ["s"]],
  ["s", ["z"]],
  ["x", null],
  ["ph", null],
  ["g", ["Z"]],
  ["ge", null],
  ["gg", null],
  ["gu", null],
  ["qu", null],
  ["cqu", null],
  ["ch", null],
  ["sch", null],
  ["ck", null],
  ["gn", null],
  ["ng", null],
  ["ll", ["j"]],
  ["il", null],
  ["ill", null],
  ["y", ["j", "ij"]],
  ["th", null],
  ["w", ["v"]],
  ["zz", null],
  // Sons absents du mémo (Max, 19/11 : gris foncé) : un, ay, oy…, et lettres qui ne font pas leur son habituel.
  ["un", null],
  ["um", null],
  ["ay", null],
  ["ey", null],
  ["oy", null],
  ["oo", null],
  ["oe", null],
  ["oi", ["O"]],
  ["u", ["O", "u", "9"]],
  ["ue", null],
  ["e", ["a", "2", "9"]],
  ["eu", ["y"]],
  ["ai", ["\xB0"]],
  ["on", ["\xB0"]],
  ["ao\xFB", null],
  ["i", ["ij"]]
];
function couleurMorceau(m) {
  if (m.son === "") {
    if (m.lettres === "ent") return "x";
    return m.lettres === "e" ? null : "x";
  }
  for (const [couleur, graphies, sons] of MEMO) if (graphies.includes(m.lettres) && sons.includes(m.son)) return couleur;
  for (const [g, sons] of PIEGES) if (g === m.lettres && (!sons || sons.includes(m.son))) return "g";
  return null;
}
function marquesMot(mot, phon) {
  const morceaux = decouper(mot, phon);
  if (!morceaux) return null;
  const marques = [];
  let i = 0;
  for (const m of morceaux) {
    const c = couleurMorceau(m);
    if (c) {
      const prec = marques[marques.length - 1];
      if (c === "x" && prec && prec[2] === "x" && prec[0] + prec[1] === i) prec[1] += m.lettres.length;
      else marques.push([i, m.lettres.length, c]);
    }
    i += m.lettres.length;
  }
  return marques;
}
const ligneSons = (mot, marques) => `${mot}	${marques.map(([d, n, c]) => `${d}.${n}.${c}`).join(",")}`;
const ligneVariantes = (mot, variantes) => `${mot}	~${variantes.map((v) => `${v.phon}:${v.natures.join("/")}`).join("|")}`;
const estVariantes = (e) => e.length > 0 && !Array.isArray(e[0]);
function chargerSons(texte) {
  const sons = /* @__PURE__ */ new Map();
  for (const ligne of texte.split("\n")) {
    const [mot, marques] = ligne.split("	");
    if (!mot || !marques) continue;
    if (marques.startsWith("~")) {
      sons.set(
        mot,
        marques.slice(1).split("|").map((v) => {
          const [phon, natures] = v.split(":");
          return { phon, natures: natures.split("/") };
        })
      );
      continue;
    }
    sons.set(
      mot,
      marques.split(",").map((m) => {
        const [d, n, c] = m.split(".");
        return [Number(d), Number(n), c];
      })
    );
  }
  return sons;
}
function formeLexique(mot) {
  let forme = "";
  const origine = [];
  [...mot].forEach((ch, k) => {
    const bas = ch.toLowerCase();
    const r = bas === "\u0153" ? "oe" : bas === "\xE6" ? "ae" : bas;
    for (const x of r) {
      forme += x;
      origine.push(k);
    }
  });
  return { forme, origine };
}
const LIAISONS = /* @__PURE__ */ new Set([
  "les",
  "des",
  "ces",
  "mes",
  "tes",
  "ses",
  "nos",
  "vos",
  "leurs",
  "aux",
  "deux",
  "trois",
  "quelques",
  "plusieurs",
  "certains",
  "certaines",
  "quels",
  "quelles",
  "toutes",
  "aucuns",
  "nous",
  "vous",
  "ils",
  "elles",
  "chez",
  "dans",
  "sans",
  "sous",
  "tr\xE8s",
  "quand",
  "petit",
  "petits",
  "grand",
  "grands",
  "gros",
  "mauvais",
  "beaux",
  "vieux",
  "nouveaux",
  "jolis",
  "petites",
  "grandes",
  "jolies"
]);
const SANS_LIAISON = /^(h(aricot|ibou|éros|ache|amster|amac|anche|all|aut|auteur|onte|ockey|utte|érisson|urler|omard|ousse|ublot|aie|arpe|âte|asard|aricots|iboux|éros|ollande|ongrie|uit|uitième)s?|onze|onzième|oui|yaourts?|ouistiti)$/;
const COMMENCE_PAR_VOYELLE = /^[aeiouyàâäéèêëîïôöùûüœæh]/;
const DETERMINANTS = /* @__PURE__ */ new Set(["le", "la", "l", "les", "un", "une", "des", "du", "au", "aux", "mon", "ton", "son", "ma", "ta", "sa", "mes", "tes", "ses", "notre", "votre", "nos", "vos", "leur", "leurs", "ce", "cet", "cette", "ces", "quel", "quelle", "quels", "quelles", "chaque", "plusieurs", "certains", "certaines"]);
const DET_SINGULIER = /* @__PURE__ */ new Set(["le", "l", "un", "du", "au", "mon", "ton", "son", "notre", "votre", "leur", "ce", "cet", "quel", "chaque"]);
const SUJETS_SINGULIER = /* @__PURE__ */ new Set(["je", "j", "tu", "il", "elle", "on"]);
const SUJETS_PLURIEL = /* @__PURE__ */ new Set(["ils", "elles"]);
const SUJETS_DOUBLES = /* @__PURE__ */ new Set(["nous", "vous"]);
const ENTRE_SUJET_VERBE = /* @__PURE__ */ new Set(["ne", "n", "me", "m", "te", "t", "se", "s", "le", "la", "l", "les", "lui", "leur", "y", "en", "nous", "vous"]);
const NOMBRES = /* @__PURE__ */ new Set(["z\xE9ro", "un", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "vingt", "trente", "quarante", "cinquante", "soixante", "septante", "huitante", "nonante", "cent", "mille"]);
const VOYELLE = /^[aeiouyàâäéèêëîïôöùûüœæ]/;
function sujet(avant) {
  for (let k = avant.length - 1; k >= 0; k--) {
    const t = avant[k];
    if (SUJETS_SINGULIER.has(t)) return "sg";
    if (SUJETS_PLURIEL.has(t)) return "pl";
    if (t === "qui") return "?";
    if (SUJETS_DOUBLES.has(t)) {
      const plusLoin = sujet(avant.slice(0, k));
      return plusLoin ?? "?";
    }
    if (!ENTRE_SUJET_VERBE.has(t)) return null;
  }
  return null;
}
const finPhrase = (c) => c.apres.length === 0;
const precedent = (c) => c.avant[c.avant.length - 1];
const suivant = (c) => c.apres[0];
const REGLES_MOTS = {
  // Nombres : « six » [sis], « six chats » [si], « six ans » [siz], « dix-sept » [dis], « dix-huit » [diz].
  six: (c) => nombreFinal(c, "si", "sis", "siz"),
  dix: (c) => nombreFinal(c, "di", "dis", "diz"),
  huit: (c) => nombreFinal(c, "8i", "8it", "8it"),
  neuf: (c) => ["ans", "heures", "hommes"].includes(suivant(c) ?? "") && !c.traitApres ? "n9v" : "n9f",
  // « vingt » [v5], « vingt-deux », « vingt et un » [v5t].
  vingt: (c) => c.traitApres || suivant(c) === "et" ? "v5t" : "v5",
  // « tous les jours » [tu], « ils sont tous. » [tus] ; « ils sont tous partis » : impossible à dire de l'écrit seul.
  tous: (c) => finPhrase(c) ? "tus" : DETERMINANTS.has(suivant(c) ?? "") || ["ceux", "celles", "deux", "trois", "quatre"].includes(suivant(c) ?? "") ? "tu" : null,
  // « En fait, … » [fEt] ; « il en fait » [fE].
  fait: (c) => precedent(c) === "en" && c.avant.length === 1 ? "fEt" : "fE",
  // « il est » [e], « l'est », « le nord-est » [Est] ; « il l'est » : verbe.
  est: (c) => {
    if (sujet(c.avant.slice(0, -1)) && precedent(c) === "l") return "e";
    if (precedent(c) === "l" || c.traitAvant && ["nord", "sud"].includes(precedent(c) ?? "")) return "Est";
    return "e";
  },
  // « ne… plus », « non plus » [ply] ; « en plus » (en fin de phrase), « deux plus trois » [plys] ; sinon on ne sait pas.
  plus: (c) => {
    if (c.avant.slice(-4).some((t) => t === "ne" || t === "n") || precedent(c) === "non") return "ply";
    if (precedent(c) === "en" && finPhrase(c)) return "plys";
    if (NOMBRES.has(precedent(c) ?? "") && NOMBRES.has(suivant(c) ?? "")) return "plys";
    return null;
  },
  // « tu as », « as-tu » [a] ; « un as » [as].
  as: (c) => precedent(c) === "tu" || c.traitApres && suivant(c) === "tu" ? "a" : DETERMINANTS.has(precedent(c) ?? "") ? "as" : null,
  // « je sens », « tu te sens » [s@] ; « le sens » [s@s].
  sens: (c) => sujet(c.avant) ? "s@" : DETERMINANTS.has(precedent(c) ?? "") ? "s@s" : null,
  // « mon fils », « le fils » [fis] ; « les fils » (fils électriques ?) : on ne sait pas.
  fils: (c) => DET_SINGULIER.has(precedent(c) ?? "") ? "fis" : null,
  // « fier » [fjER] ; « se fier » [fje].
  fier: (c) => ["se", "s", "me", "m", "te", "t", "nous", "vous"].includes(precedent(c) ?? "") ? "fje" : "fjER",
  chut: (c) => sujet(c.avant) ? "Sy" : "Syt",
  // « il convient » [k§vj5] ; « ils convient » (convier) [k§vi].
  convient: (c) => ({ sg: "k\xA7vj5", pl: "k\xA7vi", "?": null, null: "k\xA7vj5" })[String(sujet(c.avant))] ?? null,
  pressent: (c) => ({ sg: "pRes@", pl: "pRes", "?": null, null: null })[String(sujet(c.avant))] ?? null
};
function nombreFinal(c, devantConsonne, seul, devantVoyelle) {
  const s = suivant(c);
  if (c.traitApres) {
    if (!s) return seul;
    return VOYELLE.test(s) || s.startsWith("h") ? devantVoyelle : seul;
  }
  if (!s) return seul;
  if (s.startsWith("h")) return null;
  return VOYELLE.test(s) ? devantVoyelle : devantConsonne;
}
const estVerbe = (v) => v.natures.some((n) => n === "VER" || n === "AUX");
function choisirPrononciation(mot, variantes, c) {
  const regle = REGLES_MOTS[mot];
  if (regle) return regle(c);
  const verbes = variantes.filter(estVerbe);
  const autres = variantes.filter((v2) => !estVerbe(v2));
  if (verbes.length !== 1 || autres.length !== 1) return null;
  const [v] = verbes;
  const [n] = autres;
  if (sujet(c.avant)) return v.phon;
  if (DETERMINANTS.has(precedent(c) ?? "")) return n.phon;
  if (mot.endsWith("er") && v.phon.endsWith("e")) return v.phon;
  if (/(ent|ons)$/.test(mot)) return n.phon;
  return null;
}
function marquesCommunes(mot, phons) {
  const listes = phons.map((p) => marquesMot(mot, p)).filter((m) => m !== null);
  if (!listes.length) return [];
  const cle = (m) => m.join(".");
  return listes[0].filter((m) => listes.every((l) => l.some((x) => cle(x) === cle(m))));
}
function marquesForme(sons, forme, c) {
  const marques = marquesSansLiaison(sons, forme, c);
  if (!c.voyelleApres || !LIAISONS.has(forme)) return marques;
  return marques.flatMap((m) => {
    if (m[2] !== "x" || m[0] + m[1] !== forme.length) return [m];
    return m[1] > 1 ? [[m[0], m[1] - 1, "x"]] : [];
  });
}
function marquesSansLiaison(sons, forme, c) {
  const regle = REGLES_MOTS[forme];
  const entree = sons.get(forme);
  if (regle) {
    const phon2 = regle(c);
    if (phon2) return marquesMot(forme, phon2) ?? [];
    const toutes = Object.values(PRONONCIATIONS_REGLES[forme] ?? []);
    return marquesCommunes(forme, toutes.length ? toutes : entree && estVariantes(entree) ? entree.map((v) => v.phon) : []);
  }
  if (!entree) return [];
  if (!estVariantes(entree)) return entree;
  const phon = choisirPrononciation(forme, entree, c);
  if (phon) return marquesMot(forme, phon) ?? [];
  return marquesCommunes(forme, entree.map((v) => v.phon));
}
const PRONONCIATIONS_REGLES = {
  six: ["si", "sis", "siz"],
  dix: ["di", "dis", "diz"],
  huit: ["8i", "8it"],
  tous: ["tu", "tus"],
  plus: ["ply", "plys"],
  as: ["a", "as"],
  sens: ["s@", "s@s"],
  fils: ["fis", "fil"],
  pressent: ["pRes@", "pRes"],
  convient: ["k\xA7vj5", "k\xA7vi"]
};
const LIEN = /^[\s'’\-  ]*$/;
function marquesTexte(sons, texte) {
  const mots = [...texte.matchAll(/\p{L}+/gu)].map((m) => ({ ...formeLexique(m[0]), debut: m.index }));
  const sortie = [];
  mots.forEach((m, k) => {
    if (m.forme.length < 2) return;
    const avant = [];
    for (let j = k - 1; j >= 0; j--) {
      if (!LIEN.test(texte.slice(mots[j].debut + mots[j].origine[mots[j].origine.length - 1] + 1, mots[j + 1].debut))) break;
      avant.unshift(mots[j].forme);
    }
    const apres = [];
    for (let j = k + 1; j < mots.length; j++) {
      if (!LIEN.test(texte.slice(mots[j - 1].debut + mots[j - 1].origine[mots[j - 1].origine.length - 1] + 1, mots[j].debut))) break;
      apres.push(mots[j].forme);
    }
    const finMot = (j) => mots[j].debut + mots[j].origine[mots[j].origine.length - 1] + 1;
    const c = {
      avant,
      apres,
      traitAvant: k > 0 && avant.length > 0 && texte.slice(finMot(k - 1), m.debut).includes("-"),
      traitApres: apres.length > 0 && texte.slice(finMot(k), mots[k + 1].debut).includes("-"),
      voyelleApres: apres.length > 0 && /^[\s\u00a0\u202f]+$/.test(texte.slice(finMot(k), mots[k + 1].debut)) && COMMENCE_PAR_VOYELLE.test(apres[0]) && !SANS_LIAISON.test(apres[0])
    };
    for (const [d, n, couleur] of marquesForme(sons, m.forme, c)) {
      const debut = m.origine[d];
      const fin = m.origine[d + n - 1] + 1;
      sortie.push([m.debut + debut, fin - debut, couleur]);
    }
  });
  return sortie;
}
const marquesPage = (sons, mot) => marquesTexte(sons, mot);
export {
  COULEURS_SONS,
  chargerSons,
  choisirPrononciation,
  couleurMorceau,
  decouper,
  formeLexique,
  ligneSons,
  ligneVariantes,
  marquesForme,
  marquesMot,
  marquesPage,
  marquesTexte
};
