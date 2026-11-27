#!/usr/bin/env python3
"""
Génère src/data/atlas-monde.json (données de l'application ATLAS, série « Monde »).

Source : Natural Earth 1:50m (domaine public), via le paquet npm « world-atlas »
(scripts/atlas/sources/pays-monde-50m.topo.json, 241 pays et territoires).

Les pays sont regroupés en continents. Le programme belge compte 6 continents (Europe, Asie, Amérique,
Afrique, Océanie, Antarctique) : on garde aussi l'Amérique du Nord et l'Amérique du Sud, pour pouvoir
les distinguer. Quelques cas particuliers sont tranchés à la main :
  - Russie et Kazakhstan : la partie à l'ouest de l'Oural est en Europe, le reste en Asie ;
  - Indonésie : entièrement en Asie (la frontière avec la Papouasie-Nouvelle-Guinée, à 141° E,
    est donc aussi la limite entre l'Asie et l'Océanie) ;
  - territoires d'outre-mer (France, Espagne, États-Unis, Chili) : classés selon leur position.
Frontières : lignes communes à deux pays (« contestees » : celles dont le tracé n'est pas reconnu
de tous : Sahara occidental, Somaliland, nord de Chypre, Palestine).
Tout est en longitude / latitude : la projection est calculée dans l'application (d3-geo).

Nécessite shapely (pip install shapely).
Lancer :  python3 -I scripts/atlas/generer-atlas-monde.py
"""
import json
import os
import sys

from shapely import set_precision
from shapely.geometry import MultiPolygon, Polygon, box, shape
from shapely.geometry.polygon import orient
from shapely.affinity import translate
from shapely.ops import linemerge, unary_union

RACINE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SOURCE = os.path.join(RACINE, 'scripts', 'atlas', 'sources', 'pays-monde-50m.topo.json')
SORTIE = os.path.join(RACINE, 'src', 'data', 'atlas-monde.json')

CONTINENTS = ['amerique-nord', 'amerique-sud', 'europe', 'afrique', 'asie', 'oceanie', 'antarctique']
# Frontières dont le tracé est contesté : dessinées en pointillés
CONTESTEES = [{'W. Sahara', 'Morocco'}, {'Somaliland', 'Somalia'}, {'N. Cyprus', 'Cyprus'}, {'Palestine', 'Israel'}]

PAR_CONTINENT = {
    'amerique-nord': """Anguilla|Antigua and Barb.|Aruba|Bahamas|Barbados|Belize|Bermuda|British Virgin Is.|Canada|Cayman Is.|Costa Rica|Cuba|Curaçao|Dominica|Dominican Rep.|El Salvador|Greenland|Grenada|Guatemala|Haiti|Honduras|Jamaica|Mexico|Montserrat|Nicaragua|Panama|Puerto Rico|Saint Lucia|Sint Maarten|St-Barthélemy|St-Martin|St. Kitts and Nevis|St. Pierre and Miquelon|St. Vin. and Gren.|Trinidad and Tobago|Turks and Caicos Is.|U.S. Virgin Is.|United States of America""",
    'amerique-sud': """Argentina|Bolivia|Brazil|Chile|Colombia|Ecuador|Falkland Is.|Guyana|Paraguay|Peru|S. Geo. and the Is.|Suriname|Uruguay|Venezuela""",
    'europe': """Albania|Andorra|Austria|Belarus|Belgium|Bosnia and Herz.|Bulgaria|Croatia|Czechia|Denmark|Estonia|Faeroe Is.|Finland|France|Germany|Greece|Guernsey|Hungary|Iceland|Ireland|Isle of Man|Italy|Jersey|Kosovo|Latvia|Liechtenstein|Lithuania|Luxembourg|Macedonia|Malta|Moldova|Monaco|Montenegro|Netherlands|Norway|Poland|Portugal|Romania|San Marino|Serbia|Slovakia|Slovenia|Spain|Sweden|Switzerland|Ukraine|United Kingdom|Vatican|Åland""",
    'afrique': """Algeria|Angola|Benin|Botswana|Br. Indian Ocean Ter.|Burkina Faso|Burundi|Cabo Verde|Cameroon|Central African Rep.|Chad|Comoros|Congo|Côte d'Ivoire|Dem. Rep. Congo|Djibouti|Egypt|Eq. Guinea|Eritrea|Ethiopia|Gabon|Gambia|Ghana|Guinea|Guinea-Bissau|Kenya|Lesotho|Liberia|Libya|Madagascar|Malawi|Mali|Mauritania|Mauritius|Morocco|Mozambique|Namibia|Niger|Nigeria|Rwanda|S. Sudan|Saint Helena|Senegal|Seychelles|Sierra Leone|Somalia|Somaliland|South Africa|Sudan|São Tomé and Principe|Tanzania|Togo|Tunisia|Uganda|W. Sahara|Zambia|Zimbabwe|eSwatini""",
    'asie': """Afghanistan|Armenia|Azerbaijan|Bahrain|Bangladesh|Bhutan|Brunei|Cambodia|China|Cyprus|Georgia|Hong Kong|India|Indian Ocean Ter.|Indonesia|Iran|Iraq|Israel|Japan|Jordan|Kazakhstan|Kuwait|Kyrgyzstan|Laos|Lebanon|Macao|Malaysia|Maldives|Mongolia|Myanmar|N. Cyprus|Nepal|North Korea|Oman|Pakistan|Palestine|Philippines|Qatar|Russia|Saudi Arabia|Siachen Glacier|Singapore|South Korea|Sri Lanka|Syria|Taiwan|Tajikistan|Thailand|Timor-Leste|Turkey|Turkmenistan|United Arab Emirates|Uzbekistan|Vietnam|Yemen""",
    'oceanie': """American Samoa|Ashmore and Cartier Is.|Australia|Cook Is.|Fiji|Fr. Polynesia|Guam|Kiribati|Marshall Is.|Micronesia|N. Mariana Is.|Nauru|New Caledonia|New Zealand|Niue|Norfolk Island|Palau|Papua New Guinea|Pitcairn Is.|Samoa|Solomon Is.|Tonga|Vanuatu|Wallis and Futuna Is.""",
    'antarctique': """Antarctica|Fr. S. Antarctic Lands|Heard I. and McDonald Is.""",
}
CONTINENT_DU_PAYS = {nom: c for c, noms in PAR_CONTINENT.items() for nom in noms.split('|')}

# Partie « européenne » de la Russie et du Kazakhstan : à l'ouest de l'Oural, du fleuve Oural et de la Caspienne
EUROPE_OURAL = Polygon([
    (-35, 35), (-35, 85), (69.5, 85), (69.5, 71), (66.5, 69.5), (64, 65.5), (60.5, 62), (59.5, 58), (59.5, 56),
    (58.5, 52), (58.5, 51.0), (55.1, 51.7), (51.4, 51.2), (50.0, 49.5), (51.8, 47.1), (50.5, 46), (50.5, 40), (-35, 40),
])


def decoder_topo(topo):
    """Décode les arcs d'un TopoJSON (coordonnées quantifiées, codées en différences)."""
    sx, sy = topo['transform']['scale']
    tx, ty = topo['transform']['translate']
    arcs = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def anneau(indices):
        pts = []
        for i in indices:
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            pts.extend(a if not pts else a[1:])
        return pts

    def deplier(pts):
        """Longitudes continues : un anneau qui franchit l'antiméridien dépasse 180° (ou -180°) au lieu de sauter de 360°."""
        sortie = [pts[0]]
        for x, y in pts[1:]:
            ref = sortie[-1][0]
            while x - ref > 180:
                x -= 360
            while x - ref < -180:
                x += 360
            sortie.append((x, y))
        return sortie

    def polygones(rings):
        ext = anneau(rings[0])
        if all(y < -89 for _, y in ext):
            # Antarctique : la source donne la ligne du pôle comme anneau extérieur et la côte comme « trou »
            # (convention sphérique). On garde la côte, qu'on referme en passant par le pôle.
            if len(rings) < 2:
                return []
            cote = anneau(rings[1])
            return [Polygon(cote[:-1] + [(180, -90), (-180, -90)])]
        poly = Polygon(deplier(ext), [deplier(anneau(r)) for r in rings[1:]])
        if not poly.is_valid:
            poly = poly.buffer(0)
        # Découpe à ±180° : la partie qui dépasse est ramenée de l'autre côté de la carte
        morceaux = []
        for k in (-1, 0, 1):
            part = poly.intersection(box(-180 + 360 * k, -90, 180 + 360 * k, 90))
            if not part.is_empty:
                morceaux.extend(translate(g, xoff=-360 * k) for g in getattr(part, 'geoms', [part]) if g.geom_type == 'Polygon')
        return morceaux

    pays = []
    for g in topo['objects']['countries']['geometries']:
        liste = [g['arcs']] if g['type'] == 'Polygon' else g['arcs']
        polys = [m for rings in liste for m in polygones(rings)]
        pays.append((g['properties']['name'], polys))
    return pays


def continent_du_morceau(nom, poly):
    """Continent d'un morceau (île, territoire) d'un pays : le pays, sauf cas d'outre-mer."""
    c = poly.representative_point()
    x, y = c.x, c.y
    if nom == 'France':
        if -10 < x < 30 and y > 30:
            return 'europe'
        if -60 < x < -50 and y < 10:
            return 'amerique-sud'  # Guyane
        if -70 < x < -55 and y > 10:
            return 'amerique-nord'  # Guadeloupe, Martinique…
        return 'afrique'  # La Réunion, Mayotte
    if nom == 'Spain' and x < -12:
        return 'afrique'  # Canaries
    if nom == 'United States of America' and -162 < x < -154 and 18 < y < 23:
        return 'oceanie'  # Hawaï
    if nom == 'Chile' and x < -100:
        return 'oceanie'  # île de Pâques
    if nom == 'Netherlands' and x < -50:
        return 'amerique-nord'
    if nom == 'Norway' and y < 0:
        return 'antarctique'
    if nom == 'United Kingdom' and x < -20:
        return 'amerique-nord'
    return CONTINENT_DU_PAYS[nom]


def main():
    topo = json.load(open(SOURCE))
    morceaux = {c: [] for c in CONTINENTS}
    par_pays = {}
    for nom, polys in decoder_topo(topo):
        if nom not in CONTINENT_DU_PAYS:
            sys.exit(f'Pays sans continent : {nom}')
        for p in polys:
            if not p.is_valid:
                p = p.buffer(0)
            if nom != 'Antarctica':
                par_pays.setdefault(nom, []).append(p)
            if nom in ('Russia', 'Kazakhstan'):
                europe = p.intersection(EUROPE_OURAL)
                asie = p.difference(EUROPE_OURAL)
                if not europe.is_empty:
                    morceaux['europe'].append(europe)
                if not asie.is_empty:
                    morceaux['asie'].append(asie)
            else:
                morceaux[continent_du_morceau(nom, p)].append(p)

    sortie = []
    for c in CONTINENTS:
        g = unary_union([set_precision(m, 1e-4) for m in morceaux[c]])
        if c != 'antarctique':
            g = g.simplify(0.04, preserve_topology=True)
        g = set_precision(g, 0.01)
        polys = [g] if g.geom_type == 'Polygon' else [p for p in g.geoms if p.geom_type == 'Polygon']
        # Les petits îlots (< 0,03 deg²) alourdissent sans rien apporter à l'échelle d'un planisphère
        polys = [p for p in polys if p.area > 0.03]
        coords = []
        for p in polys:
            p = orient(p, sign=-1.0)  # d3-geo : anneau extérieur dans le sens horaire
            coords.append([[[round(x, 2), round(y, 2)] for x, y in r.coords] for r in [p.exterior, *p.interiors]])
        sortie.append({'id': c, 'polygones': coords})
        print(f'{c:15s} {len(coords):4d} polygones')

    # « Amérique » en un seul continent (programme belge) : les deux Amériques fusionnées, sans frontière entre elles
    amerique = unary_union([set_precision(m, 1e-4) for c in ('amerique-nord', 'amerique-sud') for m in morceaux[c]])
    amerique = set_precision(amerique.simplify(0.04, preserve_topology=True), 0.01)
    polys = [amerique] if amerique.geom_type == 'Polygon' else list(amerique.geoms)
    coords = [[[[round(x, 2), round(y, 2)] for x, y in r.coords] for r in [q.exterior, *q.interiors]] for q in (orient(q, sign=-1.0) for q in polys if q.area > 0.03)]
    sortie.append({'id': 'amerique', 'polygones': coords})
    print(f'{"amerique":15s} {len(coords):4d} polygones')

    # Frontières : parties communes aux contours de deux pays
    pays = {nom: set_precision(unary_union(ps), 1e-4) for nom, ps in par_pays.items()}
    noms = sorted(pays)
    def lignes_de(g):
        if g.geom_type == 'LineString':
            return [g]
        if g.geom_type in ('MultiLineString', 'GeometryCollection'):
            return [l for x in g.geoms for l in lignes_de(x)]
        return []
    ordinaires, contestees = [], []
    for i, a in enumerate(noms):
        for b in noms[i + 1:]:
            ga, gb = pays[a], pays[b]
            if not ga.intersects(gb):
                continue
            communes = lignes_de(ga.boundary.intersection(gb.boundary))
            (contestees if {a, b} in CONTESTEES else ordinaires).extend(communes)

    def vers_json(lignes):
        if not lignes:
            return []
        fusion = linemerge(lignes)
        fusion = [fusion] if fusion.geom_type == 'LineString' else list(fusion.geoms)
        return [[[round(x, 2), round(y, 2)] for x, y in l.simplify(0.04).coords] for l in fusion if l.length > 0.05]

    frontieres, frontieres_contestees = vers_json(ordinaires), vers_json(contestees)
    print(f'frontières : {len(frontieres)} lignes, {len(frontieres_contestees)} contestées')

    with open(SORTIE, 'w') as f:
        json.dump({'continents': sortie, 'frontieres': frontieres, 'contestees': frontieres_contestees}, f, separators=(',', ':'))
    print(f'{SORTIE} : {os.path.getsize(SORTIE) / 1024:.0f} Ko')


if __name__ == '__main__':
    main()
