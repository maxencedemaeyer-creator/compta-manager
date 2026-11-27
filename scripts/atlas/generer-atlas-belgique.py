#!/usr/bin/env python3
"""
Génère src/data/atlas-belgique.json (données de l'application ATLAS, série « Belgique »).

Rien n'est dessiné à la main :
  - frontières des régions, communautés et provinces : calculées à partir des 565
    communes de src/data/communos-communes.json (Statbel, utilisé aussi par COMMUNOS).
    Un tronçon de frontière = une arête commune à deux communes de groupes différents.
  - rivières : tracés OpenStreetMap (© les contributeurs d'OpenStreetMap, ODbL),
    copiés de l'appli INTERFACE-ELEVES (scripts/atlas/sources/cours-eau-osm.geojson),
    reprojetés dans le repère des communes.
  - villes : positions des communes (jief/zipcode-belgium, via INTERFACE-ELEVES).
  - projection : polynôme (lon, lat) → repère de la carte, ajusté sur les 565 communes.

Lancer :  python3 -I scripts/atlas/generer-atlas-belgique.py
"""
import json
import math
import os
import sys
from collections import defaultdict

import numpy as np

RACINE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SOURCES = os.path.join(RACINE, 'scripts', 'atlas', 'sources')
COMMUNES = os.path.join(RACINE, 'src', 'data', 'communos-communes.json')
SORTIE = os.path.join(RACINE, 'src', 'data', 'atlas-belgique.json')

# Les 9 communes de la Communauté germanophone (codes Statbel)
COMMUNES_DG = {'63001', '63012', '63013', '63023', '63040', '63048', '63061', '63067', '63087'}

def decoder(r):
    pts, x, y = [], 0, 0
    for i in range(0, len(r), 2):
        x += r[i]
        y += r[i + 1]
        pts.append((x, y))
    return pts


def centroide(pts):
    a = cx = cy = 0.0
    for i in range(len(pts)):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % len(pts)]
        f = x0 * y1 - x1 * y0
        a += f
        cx += (x0 + x1) * f
        cy += (y0 + y1) * f
    return abs(a), (cx / (3 * a), cy / (3 * a))


def chemin(polylignes):
    """Polylignes d'entiers → chemin SVG compact (« Mx y x y … »)."""
    parts = []
    for p in polylignes:
        if len(p) < 2:
            continue
        parts.append('M' + ' '.join(f'{x} {y}' for x, y in p))
    return ''.join(parts)


# ---------------------------------------------------------------- données de base
data = json.load(open(COMMUNES))
positions = json.load(open(os.path.join(SOURCES, 'positions-communes.json')))
communes = data['communes']
UNITE = data['unite']  # km par unité
par_id = {c['id']: c for c in communes}
par_nom = {c['fr']: c for c in communes}
for c in communes:
    c['anneaux'] = [decoder(r) for r in c['r']]
    c['centre'] = max((centroide(a) for a in c['anneaux']), key=lambda t: t[0])[1]

# ---------------------------------------------------------------- projection lon/lat → carte
DEG = 4


def feats(lat, lon):
    u, v = (lon - 4.5) / 2, (lat - 50.6)
    return [u ** i * v ** j for i in range(DEG + 1) for j in range(DEG + 1 - i)]


ids = [i for i in par_id if i in positions]
A = np.array([feats(*positions[i]) for i in ids])
X = np.array([par_id[i]['centre'] for i in ids])
garde = np.ones(len(ids), bool)
for _ in range(6):  # ajustement robuste : on écarte les communes dont le centre est loin de la position
    co, *_ = np.linalg.lstsq(A[garde], X[garde], rcond=None)
    err = np.hypot(*(A @ co - X).T) * UNITE
    seuil = max(2.0, 2.5 * np.median(err[garde]))
    garde = err < seuil
print(f'projection : {garde.sum()}/{len(ids)} communes retenues, erreur médiane {np.median(err[garde]):.2f} km')
COEF = co


def projeter(lat, lon):
    return tuple(np.array(feats(lat, lon)) @ COEF)


def projeter_tab(latlon):
    F = np.array([feats(la, lo) for la, lo in latlon])
    return F @ COEF


# ---------------------------------------------------------------- arêtes et frontières internes
def groupe_region(c):
    return {'Région flamande': 'flandre', 'Région wallonne': 'wallonie', 'Région de Bruxelles-Capitale': 'bruxelles'}[c['reg']]


def groupe_communaute(c):
    if c['id'] in COMMUNES_DG:
        return 'germanophone'
    return {'flandre': 'flamande', 'wallonie': 'francaise', 'bruxelles': 'bruxelles'}[groupe_region(c)]


PROVINCES = {
    "Province d'Anvers": 'anvers', 'Province du Limbourg': 'limbourg',
    'Province de Flandre orientale': 'flandre-orientale', 'Province de Flandre occidentale': 'flandre-occidentale',
    'Province du Brabant flamand': 'brabant-flamand', 'Province du Brabant wallon': 'brabant-wallon',
    'Province du Hainaut': 'hainaut', 'Province de Namur': 'namur', 'Province de Liège': 'liege',
    'Province du Luxembourg': 'luxembourg', 'Région de Bruxelles-Capitale': 'bruxelles',
}


def groupe_province(c):
    return PROVINCES[c['prov']]


aretes = defaultdict(list)  # arête (non orientée) → communes qui la bordent
for c in communes:
    for a in c['anneaux']:
        for i in range(len(a)):
            p, q = a[i], a[(i + 1) % len(a)]
            if p != q:
                aretes[(p, q) if p < q else (q, p)].append(c)


def frontieres(fonction):
    """Arêtes séparant deux groupes différents, chaînées en polylignes."""
    garde = [e for e, cs in aretes.items() if len(cs) == 2 and fonction(cs[0]) != fonction(cs[1])]
    voisins = defaultdict(list)
    for e in garde:
        voisins[e[0]].append(e)
        voisins[e[1]].append(e)
    vus, lignes = set(), []

    def suivre(depart, arete):
        ligne = [depart]
        cur, e = depart, arete
        while True:
            vus.add(e)
            cur = e[1] if e[0] == cur else e[0]
            ligne.append(cur)
            if len(voisins[cur]) != 2:
                return ligne
            e = next(x for x in voisins[cur] if x not in vus) if any(x not in vus for x in voisins[cur]) else None
            if e is None:
                return ligne

    for sommet, es in voisins.items():  # d'abord les extrémités (carrefours et bouts)
        if len(es) != 2:
            for e in es:
                if e not in vus:
                    lignes.append(suivre(sommet, e))
    for e in garde:  # boucles fermées restantes
        if e not in vus:
            lignes.append(suivre(e[0], e))
    return lignes


frontieres_calculees = {
    'regions': frontieres(groupe_region),
    'communautes': frontieres(groupe_communaute),
    'provinces': frontieres(groupe_province),
}
for k, v in frontieres_calculees.items():
    print(f'frontières {k} : {len(v)} lignes, {sum(len(l) for l in v)} points')

# ---------------------------------------------------------------- contour du pays (test « dedans / dehors »)
anneaux_pays = [decoder(r) for r in data['pays']]


def distance_au_contour(points):
    """Distance minimale (en unités) de chaque point au contour du pays (par morceaux, pour limiter la mémoire)."""
    segs = []
    for a in anneaux_pays:
        P = np.array(a, float)
        segs.append(np.stack([P, np.roll(P, -1, 0)], 1))
    S = np.concatenate(segs)  # (n, 2, 2)
    out = np.empty(len(points))
    A_, B_ = S[:, 0], S[:, 1]
    D = B_ - A_
    L2 = (D ** 2).sum(1)
    L2[L2 == 0] = 1
    for i in range(0, len(points), 400):
        P = points[i:i + 400][:, None, :]
        t = np.clip(((P - A_) * D).sum(2) / L2, 0, 1)
        proj = A_ + t[..., None] * D
        out[i:i + 400] = np.sqrt(((P - proj) ** 2).sum(2)).min(1)
    return out


def dedans_pays(points):
    """Règle pair/impair sur tous les anneaux du pays."""
    x, y = points[:, 0], points[:, 1]
    inside = np.zeros(len(points), bool)
    for a in anneaux_pays:
        P = np.array(a, float)
        Q = np.roll(P, -1, 0)
        for (x0, y0), (x1, y1) in zip(P, Q):
            if y0 == y1:
                continue
            cond = ((y0 > y) != (y1 > y)) & (x < (x1 - x0) * (y - y0) / (y1 - y0) + x0)
            inside ^= cond
    return inside


def dp(points, tol):
    """Douglas-Peucker (itératif)."""
    pts = np.array(points, float)
    n = len(pts)
    if n < 3:
        return pts
    keep = np.zeros(n, bool)
    keep[0] = keep[-1] = True
    pile = [(0, n - 1)]
    while pile:
        i, j = pile.pop()
        if j <= i + 1:
            continue
        a, b = pts[i], pts[j]
        d = b - a
        l = math.hypot(*d)
        seg = pts[i + 1:j]
        dist = np.hypot(*(seg - a).T) if l == 0 else np.abs(d[0] * (seg[:, 1] - a[1]) - d[1] * (seg[:, 0] - a[0])) / l
        k = int(dist.argmax())
        if dist[k] > tol:
            m = i + 1 + k
            keep[m] = True
            pile += [(i, m), (m, j)]
    return pts[keep]


# ---------------------------------------------------------------- rivières
# Même règle que l'appli INTERFACE-ELEVES (scripts/generer-cours-eau.mjs) :
#  - les tronçons OSM d'un cours d'eau sont chaînés bout à bout (un trou de moins de 3 km est comblé) : pas d'interruption ;
#  - en Belgique : trait plein ; hors de Belgique : ~15 km de pointillés qui s'effacent (vers la source ou la mer) ;
#  - un court passage à l'étranger entre deux parties belges (la Meuse à Maastricht) : pointillés sans fondu.
KM = 1 / UNITE  # unités de carte par km
DEPASSE = 15 * KM
BORD_PAYS = 1.2 * KM  # un point à moins de 1,2 km du pays compte comme belge (rivière-frontière)
PROCHE = 0.05 * KM
SAUT = 3 * KM
LISSAGE = 1.2
# Pointillés plus longs, vers l'amont : la Meuse continue en France jusqu'un peu après la jonction avec la Semois
# (Monthermé, ~40 km en amont de la frontière à Givet) ; le trait garde toute son intensité sur 82 % de sa longueur.
# (longueur, part du trait à pleine intensité, seulement vers le sud ?) ; la Semois rejoint la Meuse à Monthermé.
EXTENSIONS = {'meuse': (48 * KM, 0.82, True), 'semois': (18.5 * KM, 0.9, False)}


def longueur(pts):
    return sum(math.hypot(*(pts[i + 1] - pts[i])) for i in range(len(pts) - 1))


def chainer(lignes):
    """Relie les morceaux bout à bout en partant du plus long (le plus proche d'abord, puis le plus long)."""
    restantes = sorted(lignes, key=longueur, reverse=True)
    chaine = restantes.pop(0)
    while True:
        meilleur = None
        for i, l in enumerate(restantes):
            debut, fin = chaine[0], chaine[-1]
            d_fl0, d_fll = np.hypot(*(fin - l[0])), np.hypot(*(fin - l[-1]))
            d_dll, d_dl0 = np.hypot(*(debut - l[-1])), np.hypot(*(debut - l[0]))
            essais = [
                (d_fl0, lambda l=l, d=d_fl0: np.vstack([chaine, l[1 if d < PROCHE else 0:]])),
                (d_fll, lambda l=l, d=d_fll: np.vstack([chaine, l[::-1][1 if d < PROCHE else 0:]])),
                (d_dll, lambda l=l, d=d_dll: np.vstack([l[:-1 if d < PROCHE else len(l)], chaine])),
                (d_dl0, lambda l=l, d=d_dl0: np.vstack([l[::-1][:-1 if d < PROCHE else len(l)], chaine])),
            ]
            for d, joindre in essais:
                if d <= SAUT and (meilleur is None or d < meilleur[0] or (d == meilleur[0] and longueur(l) > meilleur[1])):
                    meilleur = (d, longueur(l), i, joindre)
        if meilleur is None:
            break
        chaine = meilleur[3]()
        restantes.pop(meilleur[2])
    return chaine


def couper(pts, l):
    """Les `l` premières unités d'une ligne (dernier point interpolé)."""
    res, reste = [pts[0]], l
    for i in range(1, len(pts)):
        d = math.hypot(*(pts[i] - pts[i - 1]))
        if d >= reste:
            t = reste / d if d else 0
            res.append(pts[i - 1] + t * (pts[i] - pts[i - 1]))
            return np.array(res)
        res.append(pts[i])
        reste -= d
    return np.array(res)


def en_belgique(pts):
    return dedans_pays(pts) | (distance_au_contour(pts) <= BORD_PAYS)


RIVIERES = [
    # id, nom, genre, fraction du tracé où poser le nom
    ('meuse', 'Meuse', 'fleuve', 0.30),
    ('escaut', 'Escaut', 'fleuve', 0.80),
    ('yser', 'Yser', 'fleuve', 0.50),
    ('lys', 'Lys', 'riviere', 0.45),
    ('dendre', 'Dendre', 'riviere', 0.55),
    ('sambre', 'Sambre', 'riviere', 0.45),
    ('rupel', 'Rupel', 'riviere', 0.5),
    ('ourthe', 'Ourthe', 'riviere', 0.5),
    ('semois', 'Semois', 'riviere', 0.5),
    ('senne', 'Senne', 'riviere', 0.5),
    ('dyle', 'Dyle', 'riviere', 0.5),
    ('demer', 'Demer', 'riviere', 0.5),
    ('nete', 'Nète', 'riviere', 0.5),
    ('ambleve', 'Amblève', 'riviere', 0.5),
    ('haine', 'Haine', 'riviere', 0.5),
]
osm = {f['properties']['id']: f['geometry'] for f in json.load(open(os.path.join(SOURCES, 'cours-eau-osm.geojson')))['features']}
# Dendre : absente des données OSM récupérées (Overpass injoignable) → tracé approché, remplacé dès qu'un tracé OSM 'dendre' existe
if 'dendre' not in osm:
    osm['dendre'] = {'type': 'LineString', 'coordinates': json.load(open(os.path.join(SOURCES, 'dendre-approchee.json')))['coordinates']}

# Fenêtre de travail : la Belgique et 25 km autour (on n'a besoin de rien de plus loin)
tous_les_points = np.concatenate([np.array(a, float) for a in anneaux_pays])
fx0, fy0 = tous_les_points.min(0) - 25 * KM
fx1, fy1 = tous_les_points.max(0) + 25 * KM


def dans_fenetre(xy):
    return (xy[:, 0] >= fx0) & (xy[:, 0] <= fx1) & (xy[:, 1] >= fy0) & (xy[:, 1] <= fy1)


def net(pts):
    return [(int(round(x)), int(round(y))) for x, y in dp(pts, LISSAGE)]


rivieres_out = []
etendue = [tous_les_points.min(0), tous_les_points.max(0)]
for rid, nom, genre, frac in RIVIERES:
    if rid not in osm:
        print('!! pas de données OSM pour', rid)
        continue
    g = osm[rid]
    brut = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
    lignes = []
    for l in brut:
        xy = projeter_tab([(lat, lon) for lon, lat in l])
        ok = dans_fenetre(xy)  # on coupe là où la ligne sort de la fenêtre
        cur = []
        for p, o in zip(xy, ok):
            if o:
                cur.append(p)
            elif cur:
                lignes.append(np.array(cur))
                cur = []
        if cur:
            lignes.append(np.array(cur))
    lignes = [l for l in lignes if len(l) > 1]
    pts = chainer(lignes)
    be = en_belgique(pts)
    # suites de points belges / étrangers ; chaque suite reprend le dernier point de la précédente
    suites = []
    for p, b_ in zip(pts, be):
        if suites and suites[-1]['be'] == b_:
            suites[-1]['pts'].append(p)
        else:
            suites.append({'be': b_, 'pts': [suites[-1]['pts'][-1], p] if suites else [p]})
    solides, pointilles = [], []
    for i, su in enumerate(suites):
        sp = np.array(su['pts'])
        if su['be']:
            solides.append(sp)
            continue
        avant = suites[i - 1]['be'] if i > 0 else False
        apres = suites[i + 1]['be'] if i + 1 < len(suites) else False
        if avant and apres and longueur(sp) <= 2 * DEPASSE:
            pointilles.append((sp, False, 0.0))
            continue
        for depart, sens in ((sp, avant), (sp[::-1], apres)):
            if not sens:
                continue
            long_, tenue = DEPASSE, 0.0
            # vers le sud (la France, pour la Meuse) : pointillés plus longs si prévu
            if rid in EXTENSIONS and (not EXTENSIONS[rid][2] or depart[-1][1] > depart[0][1] + 10 * KM):
                long_, tenue = EXTENSIONS[rid][:2]
            pointilles.append((couper(depart, long_), True, tenue))
    solides = [m for m in solides if len(m) > 1]
    if not solides:
        print('!! rivière sans passage en Belgique :', rid)
        continue
    for sp, _, _ in pointilles:
        etendue[0] = np.minimum(etendue[0], sp.min(0))
        etendue[1] = np.maximum(etendue[1], sp.max(0))

    # emplacements possibles du nom : sur le plus long morceau plein
    plus_long = max(solides, key=longueur)
    total = longueur(plus_long)

    def ancre_a(fraction):
        cible, acc = total * fraction, 0
        for i in range(len(plus_long) - 1):
            seg = math.hypot(*(plus_long[i + 1] - plus_long[i]))
            if acc + seg >= cible:
                t = (cible - acc) / seg if seg else 0
                p = plus_long[i] + t * (plus_long[i + 1] - plus_long[i])
                j0, j1 = i, i + 1  # tangente moyennée sur ~±6 km : angle stable
                while j0 > 0 and np.hypot(*(plus_long[j0] - p)) * UNITE < 6:
                    j0 -= 1
                while j1 < len(plus_long) - 1 and np.hypot(*(plus_long[j1] - p)) * UNITE < 6:
                    j1 += 1
                d = plus_long[j1] - plus_long[j0]
                ang = math.degrees(math.atan2(d[1], d[0]))
                if ang > 90:
                    ang -= 180
                if ang < -90:
                    ang += 180
                return [int(round(p[0])), int(round(p[1])), round(ang, 1)]
            acc += seg
        return [int(round(plus_long[-1][0])), int(round(plus_long[-1][1])), 0.0]

    fractions = sorted((round(0.08 + 0.05 * i, 2) for i in range(18)), key=lambda f: abs(f - frac))
    noms_possibles = [ancre_a(f) for f in fractions if total * UNITE * 0.08 > 1.0] or [ancre_a(frac)]
    rivieres_out.append({
        'id': rid, 'nom': nom, 'genre': genre,
        'd': chemin([net(m) for m in solides]),
        'dehors': [
            {'d': chemin([net(sp)]), 'fondu': fondu, 'tenue': tenue, 'a': [int(round(sp[0][0])), int(round(sp[0][1]))], 'b': [int(round(sp[-1][0])), int(round(sp[-1][1]))]}
            for sp, fondu, tenue in pointilles
        ],
        'noms': noms_possibles,
    })
    print(f'rivière {rid:8s} {len(solides)} morceau(x) plein(s), {len(pointilles)} pointillé(s), {longueur(pts) * UNITE:.0f} km')

# Cadre de la carte : le pays et les pointillés des rivières, avec une marge
MARGE_CADRE = 60
cadre = [int(etendue[0][0] - MARGE_CADRE), int(etendue[0][1] - MARGE_CADRE), int(etendue[1][0] + MARGE_CADRE), int(etendue[1][1] + MARGE_CADRE)]

# ---------------------------------------------------------------- mer du Nord
# La mer = un grand rectangle bleu, sur lequel on pose la TERRE (Natural Earth 10 m, domaine public : côtes belge, française
# et néerlandaise, estuaire de l'Escaut compris), puis la Belgique par-dessus. On sort donc le seul tracé de la terre.
# Projection : Lambert conique conforme (comme la carte officielle belge) + transformation affine ajustée sur les communes,
# car elle se comporte bien loin de la Belgique, contrairement au polynôme utilisé plus haut.


def lcc(lat, lon, l1=49.8333, l2=51.1667, l0=50.7978, lo0=4.3593):
    r = math.radians
    l1, l2, l0, lo0, la, lo = map(r, (l1, l2, l0, lo0, lat, lon))
    n = math.log(math.cos(l1) / math.cos(l2)) / math.log(math.tan(math.pi / 4 + l2 / 2) / math.tan(math.pi / 4 + l1 / 2))
    F = math.cos(l1) * math.tan(math.pi / 4 + l1 / 2) ** n / n
    rho = 6371 * F / math.tan(math.pi / 4 + la / 2) ** n
    rho0 = 6371 * F / math.tan(math.pi / 4 + l0 / 2) ** n
    th = n * (lo - lo0)
    return rho * math.sin(th), rho0 - rho * math.cos(th)


Pl = np.array([lcc(*positions[i]) for i in ids])
Al = np.c_[Pl, np.ones(len(Pl))]
garde_l = np.ones(len(ids), bool)
for _ in range(6):
    co_l, *_ = np.linalg.lstsq(Al[garde_l], X[garde_l], rcond=None)
    err_l = np.hypot(*(Al @ co_l - X).T) * UNITE
    garde_l = err_l < max(2.0, 2.5 * np.median(err_l[garde_l]))
print(f'projection Lambert : erreur médiane {np.median(err_l[garde_l]):.2f} km')


def projeter_lcc(lat, lon):
    return tuple(np.array([*lcc(lat, lon), 1.0]) @ co_l)


def decouper(poly, x0, y0, x1, y1):
    """Sutherland-Hodgman : l'anneau (lon, lat) découpé par le rectangle."""
    def passe(pts, dedans, coupe):
        out = []
        for i, p in enumerate(pts):
            q = pts[i - 1]
            if dedans(p):
                if not dedans(q):
                    out.append(coupe(q, p))
                out.append(p)
            elif dedans(q):
                out.append(coupe(q, p))
        return out
    def inter_x(xc):
        return lambda q, p: (xc, q[1] + (p[1] - q[1]) * (xc - q[0]) / (p[0] - q[0]))
    def inter_y(yc):
        return lambda q, p: (q[0] + (p[0] - q[0]) * (yc - q[1]) / (p[1] - q[1]), yc)
    pts = [tuple(p) for p in poly]
    for dedans, coupe in (
        (lambda p: p[0] >= x0, inter_x(x0)), (lambda p: p[0] <= x1, inter_x(x1)),
        (lambda p: p[1] >= y0, inter_y(y0)), (lambda p: p[1] <= y1, inter_y(y1)),
    ):
        if not pts:
            break
        pts = passe(pts, dedans, coupe)
    return pts


terre = []
for anneau in json.load(open(os.path.join(SOURCES, 'ne_10m_land_extrait.json')))['anneaux']:
    morceau = decouper(anneau, 0.6, 48.9, 8.6, 53.3)
    if len(morceau) < 3:
        continue
    xy = np.array([projeter_lcc(la, lo) for lo, la in morceau])
    terre.append([(int(round(x)), int(round(y))) for x, y in dp(xy, 1.0)])
# le cadre inclut la mer jusqu'au-delà de l'embouchure de l'Escaut (Flessingue, 51,44° N) et la côte jusqu'à Dunkerque
cadre[1] = min(cadre[1], int(projeter_lcc(51.62, 3.2)[1]) - 20)
print(f'terre : {len(terre)} morceaux, {sum(len(t) for t in terre)} points')

# ---------------------------------------------------------------- villes
CHEFS_LIEUX = [
    ('Anvers', 'Anvers'), ('Hasselt', 'Hasselt'), ('Bruges', 'Bruges'), ('Gand', 'Gand'), ('Louvain', 'Louvain'),
    ('Wavre', 'Wavre'), ('Mons', 'Mons'), ('Namur', 'Namur'), ('Liège', 'Liège'), ('Arlon', 'Arlon'),
]
VILLES_IMPORTANTES = [
    'Ostende', 'Courtrai', 'Ypres', 'Roulers', 'Alost', 'Saint-Nicolas', 'Malines', 'Turnhout', 'Genk',
    'Saint-Trond', 'Nivelles', 'Charleroi', 'La Louvière', 'Tournai', 'Mouscron', 'Dinant', 'Verviers',
    'Huy', 'Eupen', 'Saint-Vith', 'Bastogne', 'Marche-en-Famenne', 'Bouillon', 'Virton', 'Spa',
]
# Position du nom : h = haut, b = bas, g = gauche, d = droite (par défaut : à droite)
PLACEMENT = {
    'Bruxelles': 'g', 'Anvers': 'h', 'Gand': 'g', 'Bruges': 'h', 'Louvain': 'd', 'Hasselt': 'h', 'Wavre': 'b', 'Mons': 'g',
    'Namur': 'g', 'Liège': 'h', 'Arlon': 'g', 'Ostende': 'h', 'Courtrai': 'g', 'Ypres': 'g', 'Roulers': 'g',
    'Alost': 'h', 'Saint-Nicolas': 'h', 'Malines': 'h', 'Turnhout': 'h', 'Genk': 'd', 'Saint-Trond': 'd', 'Nivelles': 'b',
    'Charleroi': 'b', 'La Louvière': 'g', 'Tournai': 'g', 'Mouscron': 'g', 'Dinant': 'g', 'Verviers': 'h', 'Huy': 'g',
    'Eupen': 'b', 'Saint-Vith': 'd', 'Bastogne': 'g', 'Marche-en-Famenne': 'b', 'Bouillon': 'b', 'Virton': 'b', 'Spa': 'd',
}


CENTRES = {  # latitude, longitude du centre-ville
    'Bruxelles': (50.8467, 4.3525), 'Anvers': (51.2194, 4.4025), 'Hasselt': (50.9307, 5.3378), 'Bruges': (51.2093, 3.2247),
    'Gand': (51.0543, 3.7174), 'Louvain': (50.8798, 4.7005), 'Wavre': (50.7172, 4.6008), 'Mons': (50.4542, 3.9523),
    'Namur': (50.4674, 4.8720), 'Liège': (50.6326, 5.5797), 'Arlon': (49.6833, 5.8167), 'Ostende': (51.2154, 2.9286),
    'Courtrai': (50.8279, 3.2649), 'Ypres': (50.8503, 2.8850), 'Roulers': (50.9453, 3.1236), 'Alost': (50.9378, 4.0356),
    'Saint-Nicolas': (51.1700, 4.1431), 'Malines': (51.0259, 4.4777), 'Turnhout': (51.3227, 4.9447), 'Genk': (50.9650, 5.5006),
    'Saint-Trond': (50.8164, 5.1864), 'Nivelles': (50.5980, 4.3280), 'Charleroi': (50.4108, 4.4446), 'La Louvière': (50.4786, 4.1861),
    'Tournai': (50.6055, 3.3880), 'Mouscron': (50.7456, 3.2133), 'Dinant': (50.2606, 4.9122), 'Verviers': (50.5896, 5.8629),
    'Huy': (50.5190, 5.2400), 'Eupen': (50.6280, 6.0360), 'Saint-Vith': (50.2800, 6.1280), 'Bastogne': (50.0000, 5.7167),
    'Marche-en-Famenne': (50.2270, 5.3440), 'Bouillon': (49.7917, 5.0667), 'Virton': (49.5667, 5.5333), 'Spa': (50.4920, 5.8630),
}


def commune_contenant(x, y):
    for c in communes:
        for a in c['anneaux']:
            inside = False
            for i in range(len(a)):
                (x0, y0), (x1, y1) = a[i], a[(i + 1) % len(a)]
                if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0:
                    inside = not inside
            if inside:
                return c
    return None


def ville(nom, type_):
    x, y = projeter(*CENTRES[nom])
    c = commune_contenant(x, y)
    print(f'  ville {nom:18s} → commune {c["fr"] if c else "HORS DU PAYS !"}')
    return {'nom': nom, 'type': type_, 'x': int(round(x)), 'y': int(round(y)), 'place': PLACEMENT.get(nom, 'd')}


villes = [ville('Bruxelles', 'capitale')]
villes += [ville(n, 'chef-lieu') for _, n in CHEFS_LIEUX]
villes += [ville(n, 'ville') for n in VILLES_IMPORTANTES]

# ---------------------------------------------------------------- noms de zones (ancrés sur le centre d'une commune)
# (groupe, commune d'ancrage, décalage x, décalage y en unités)
ETIQUETTES = {
    'regions': {
        'flandre': ('Aarschot', 0, 0), 'wallonie': ('Ohey', 0, 0), 'bruxelles': ('Bruxelles', 0, 0),
    },
    'communautes': {
        'flamande': ('Aarschot', 0, 0), 'francaise': ('Ohey', 0, 0), 'germanophone': ('Saint-Vith', 0, 0), 'bruxelles': ('Bruxelles', 0, 0),
    },
    'provinces': {
        'anvers': ('Geel', 0, 0), 'limbourg': ('Bree', 0, 0), 'flandre-orientale': ('Zottegem', 0, 0), 'flandre-occidentale': ('Tielt', 0, 0),
        'brabant-flamand': ('Haacht', 0, 0), 'brabant-wallon': ('Perwez', 0, 0), 'hainaut': ('Ath', 0, 0), 'namur': ('Ciney', 0, 0),
        'liege': ('Hannut', 0, 0), 'luxembourg': ('Nassogne', 0, 0), 'bruxelles': ('Bruxelles', 0, 0),
    },
}
etiquettes_out = {}
for couche, groupes in ETIQUETTES.items():
    etiquettes_out[couche] = {}
    for g, (commune, dx, dy) in groupes.items():
        if commune not in par_nom:
            sys.exit(f'commune d’ancrage introuvable : {commune}')
        cx, cy = par_nom[commune]['centre']
        etiquettes_out[couche][g] = {'x': int(round(cx + dx)), 'y': int(round(cy + dy))}

# Pays voisins et mer (positions en lon/lat)
VOISINS = [
    ('Mer du Nord', 51.55, 2.70, 'mer'), ('France', 50.12, 2.62, 'pays'), ('Pays-Bas', 51.70, 5.35, 'pays'),
    ('Allemagne', 50.62, 6.55, 'pays'), ('Luxembourg', 49.56, 6.42, 'pays'),
]
voisins_out = []
for n, la, lo, t in VOISINS:
    x, y = projeter(la, lo)
    voisins_out.append({'nom': n, 'x': int(round(x)), 'y': int(round(y)), 'type': t})

sortie = {
    'source': "Frontières calculées depuis les communes Statbel (CC0) ; rivières © les contributeurs d'OpenStreetMap (ODbL) ; "
              "Voir scripts/atlas/generer-atlas-belgique.py",
    'communesDG': sorted(COMMUNES_DG),
    'frontieres': {k: chemin([[(int(x), int(y)) for x, y in l] for l in v]) for k, v in frontieres_calculees.items()},
    'rivieres': rivieres_out,
    'cadre': cadre,
    'terre': chemin(terre) + 'Z',
    'villes': villes,
    'etiquettes': etiquettes_out,
    'voisins': voisins_out,
}
with open(SORTIE, 'w') as f:
    json.dump(sortie, f, ensure_ascii=False, separators=(',', ':'))
print('écrit', SORTIE, os.path.getsize(SORTIE) // 1024, 'Ko')
