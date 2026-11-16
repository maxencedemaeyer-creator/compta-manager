import json, re, os, sys, unicodedata, collections
dico_src, cibles_src, out = sys.argv[1:4]
EXCLUS = set("""bamboula bicot bordel branler branleur chier chiottes clitoris conasse connard couille dégueulasse enculer enculé enfoiré
fellation foutre gouine masturber merde merdeux nègre négresse négro nichon niquer orgasme partouze pénis pétasse pouffiasse putain
salaud salope sodomie sodomiser travelo youpin bougnoule chinetoque crouille niakoué tarlouze vagin bite pédé connasse
emmerder emmerdeur emmerdement putasse pute bordélique couillon couillonner morveux pisser branlette nibard nichons
""".split())
def norm(w):
    w = unicodedata.normalize("NFD", w)
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return w.upper().replace("Œ","OE").replace("Æ","AE")
lignes = []
for l in open(cibles_src).read().split("\n"):
    if not l: continue
    orthos = l.split(";")[0].split(",")
    if any(o in EXCLUS for o in orthos): continue
    lignes.append(l)
mots = set()
for w in json.load(open(dico_src)):
    n = norm(w)
    if re.fullmatch(r"[A-Z]{5,12}", n): mots.add(n)
for l in lignes: mots.add(norm(l.split(";")[0].split(",")[0]))
os.makedirs(os.path.join(out, "dico"), exist_ok=True)
groupes = collections.defaultdict(list)
for m in mots: groupes[m[0]+str(len(m))].append(m)
for k, v in groupes.items():
    open(os.path.join(out, "dico", k + ".txt"), "w").write("\n".join(sorted(v)))
open(os.path.join(out, "cibles.txt"), "w").write("\n".join(lignes) + "\n")
print(len(mots), "mots valides,", len(groupes), "fichiers,", len(lignes), "cibles")
