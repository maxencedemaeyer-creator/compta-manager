import csv, json, re, sys, unicodedata, collections
lex_path, dico_path, out = sys.argv[1:4]
def norm(w):
    w = unicodedata.normalize("NFD", w)
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return w.upper().replace("Œ","OE").replace("Æ","AE")
dico = set()
for w in json.load(open(dico_path)):
    n = norm(w)
    if re.fullmatch(r"[A-Z]{5,12}", n): dico.add(n)
# dictionnaire en minuscules accentuées pour vérifier l'orthographe exacte
dico_exact = set(w.lower() for w in json.load(open(dico_path)))
CAT = {"NOM": "N", "ADJ": "A", "VER": "V"}
freq = collections.defaultdict(float)   # (ortho, cat) -> freq
for row in csv.reader(open(lex_path, encoding="latin-1"), delimiter="\t"):
    if row[0] == "1_ortho": continue
    ortho, lemme, cgram = row[0], row[2], row[3]
    if cgram not in CAT or ortho != lemme: continue
    if ortho not in dico_exact: continue
    n = norm(ortho)
    if not re.fullmatch(r"[A-Z]{5,12}", n) or n not in dico: continue
    f = float(row[6].replace(",", ".") or 0) + float(row[7].replace(",", ".") or 0)
    freq[(ortho, CAT[cgram])] += f
par_mot = collections.defaultdict(lambda: {"ortho": collections.Counter(), "cat": collections.Counter()})
for (ortho, c), f in freq.items():
    e = par_mot[norm(ortho)]
    e["ortho"][ortho] += f + 1e-6
    e["cat"][c] += f + 1e-6
lignes = []
for n, e in sorted(par_mot.items()):
    orthos = [o for o, _ in e["ortho"].most_common()]
    cats = "".join(c for c, _ in e["cat"].most_common())
    lignes.append(f"{','.join(orthos)};{cats}")
open(out, "w").write("\n".join(lignes) + "\n")
c = collections.Counter(l.split(";")[1][0] for l in lignes)
print(len(lignes), "mots cibles", dict(c))
