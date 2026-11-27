#!/usr/bin/env python3
"""
Génère src/data/atlas-europe.json (données de l'application ATLAS, série « Europe »).

Source : Natural Earth 1:10m « Admin 0 – Countries » (domaine public).
Le fichier complet fait 13 Mo : on n'en garde que ce qui touche le cadre de la carte
(scripts/atlas/sources/ne_10m_pays_europe_extrait.json). Pour refaire l'extrait :

    curl -O https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson
    python3 -I scripts/atlas/generer-atlas-europe.py --extraire ne_10m_admin_0_countries.geojson

Ce que fait le script :
  - regroupe quelques territoires avec leur État (Chypre du Nord et zone tampon avec Chypre, Gibraltar et les
    dépendances de la Couronne avec le Royaume-Uni, les Åland avec la Finlande…) ;
  - simplifie TOUS les pays ensemble (coverage_simplify) : deux pays voisins gardent exactement la même frontière,
    sans trou ni chevauchement ;
  - coupe la Russie, le Kazakhstan, la Turquie et l'Azerbaïdjan le long de la limite géographique de l'Europe
    (Oural, fleuve Oural, Caspienne, crête du Caucase, mer Noire, Bosphore et Dardanelles) : « ee » = partie
    européenne, « ea » = partie asiatique.
Tout est en longitude / latitude : la projection est calculée dans l'application (d3-geo).

Nécessite shapely ≥ 2.1 (pip install shapely).
Lancer :  python3 -I scripts/atlas/generer-atlas-europe.py
"""
import json
import os
import sys

import shapely
from shapely import set_precision
from shapely.geometry import MultiPolygon, Polygon, box, shape, mapping
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

RACINE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SOURCE = os.path.join(RACINE, 'scripts', 'atlas', 'sources', 'ne_10m_pays_europe_extrait.json')
SORTIE = os.path.join(RACINE, 'src', 'data', 'atlas-europe.json')

# Zone de données : un peu plus large que le cadre affiché (écrans larges)
CADRE = box(-45, 20, 90, 83)

# Territoires regroupés avec un État (nom Natural Earth -> identifiant de l'État)
REGROUPE = {
    'N. Cyprus': 'cy', 'Cyprus U.N. Buffer Zone': 'cy', 'Akrotiri': 'cy', 'Dhekelia': 'cy',
    'Gibraltar': 'gb', 'Guernsey': 'gb', 'Jersey': 'gb', 'Isle of Man': 'gb',
    'Åland': 'fi', 'Baikonur': 'kz',
}
# Pays écartés : trop loin du cadre pour jamais apparaître, même sur un écran très large
ECARTE = {'W. Sahara', 'Mauritania', 'India', 'Pakistan', 'Oman', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Mongolia', 'China', 'Nepal', 'Bhutan', 'Bangladesh', 'Siachen Glacier', 'Eritrea', 'Sudan', 'Chad', 'Niger', 'Mali', 'Yemen', 'Somaliland', 'Ethiopia', 'Bir Tawil'}

# ---------- Limite géographique de l'Europe (longitude, latitude) ----------
# Oural : de la mer de Kara à Orsk, selon la ligne de partage des eaux
OURAL = [(68.2, 69.0), (66.8, 68.0), (64.5, 66.5), (60.5, 65.2), (59.3, 65.0), (59.0, 63.5), (59.6, 60.4), (59.8, 58.5),
         (60.0, 56.8), (59.0, 55.5), (58.3, 54.3), (58.6, 52.5), (58.7, 51.2)]
# Fleuve Oural : d'Orsk à la Caspienne
FLEUVE_OURAL = [(58.7, 51.2), (55.1, 51.8), (53.0, 51.4), (51.4, 51.3), (51.0, 50.0), (51.8, 48.5), (51.9, 47.1), (51.7, 46.9)]
# Caspienne : en ligne droite jusqu'à la presqu'île d'Absheron
CASPIENNE = [(51.7, 46.9), (50.35, 40.35)]
# Crête du Grand Caucase : d'Absheron à la mer Noire
CAUCASE = [(50.35, 40.35), (49.0, 40.9), (48.0, 41.35), (47.0, 42.0), (46.0, 42.5), (44.5, 42.7), (43.5, 42.9),
           (42.44, 43.35), (41.5, 43.3), (40.0, 43.6), (38.7, 44.0), (37.4, 44.7)]
# Mer Noire, Bosphore, mer de Marmara, Dardanelles
DETROITS = [(37.4, 44.7), (33.0, 43.0), (29.2, 41.3), (29.05, 41.05), (28.0, 40.75), (26.7, 40.35), (26.2, 40.0)]
LIMITE = OURAL + FLEUVE_OURAL[1:] + CASPIENNE[1:] + CAUCASE[1:] + DETROITS[1:]

# Polygone « côté Europe » : la limite, refermée loin au sud-ouest, à l'ouest et au nord
EUROPE = Polygon(LIMITE + [(20, 30), (-50, 30), (-50, 88), (68.2, 88)])
# Pour la Russie : tout le Caucase russe est en Europe (la crête suit presque la frontière, on ne coupe pas la Russie là)
EUROPE_RUSSIE = EUROPE.union(box(36, 41.5, 49.2, 45.8))
TRANSCONTINENTAUX = {'ru': EUROPE_RUSSIE, 'kz': EUROPE, 'tr': EUROPE, 'az': EUROPE}


def extraire(chemin):
    """Réduit le fichier Natural Earth complet aux pays qui touchent le cadre."""
    donnees = json.load(open(chemin))
    sortie = []
    for f in donnees['features']:
        p = f['properties']
        g = shape(f['geometry']).intersection(CADRE)
        if g.is_empty:
            continue
        iso = p['ISO_A2_EH'] if p['ISO_A2_EH'] not in ('-99', '') else None
        sortie.append({'nom': p['NAME'], 'iso': iso, 'geo': mapping(set_precision(g, 1e-4))})
    with open(SOURCE, 'w') as fh:
        json.dump(sortie, fh, separators=(',', ':'))
    print(f'{SOURCE} : {len(sortie)} pays, {os.path.getsize(SOURCE) / 1024:.0f} Ko')


def identifiant(nom, iso):
    if nom in REGROUPE:
        return REGROUPE[nom]
    if nom == 'Kosovo':
        return 'xk'
    return (iso or nom).lower()


def en_polygones(g):
    if g.is_empty:
        return []
    return [g] if g.geom_type == 'Polygon' else [p for p in getattr(g, 'geoms', []) if p.geom_type == 'Polygon']


def coords(polys):
    sortie = []
    for p in polys:
        p = orient(p, sign=-1.0)  # d3-geo : anneau extérieur dans le sens horaire
        sortie.append([[[round(x, 2), round(y, 2)] for x, y in r.coords] for r in [p.exterior, *p.interiors]])
    return sortie


def main():
    if len(sys.argv) == 3 and sys.argv[1] == '--extraire':
        extraire(sys.argv[2])
        return
    pays = {}
    for e in json.load(open(SOURCE)):
        if e['nom'] in ECARTE:
            continue
        i = identifiant(e['nom'], e['iso'])
        g = shape(e['geo'])
        if not g.is_valid:
            g = g.buffer(0)
        pays.setdefault(i, []).append(g)
    ids = sorted(pays)
    unions = [unary_union([set_precision(g, 1e-4) for g in pays[i]]) for i in ids]
    unions = [u if u.geom_type == 'MultiPolygon' else MultiPolygon([u]) if u.geom_type == 'Polygon' else u for u in unions]

    # Simplification commune : les frontières partagées restent identiques de part et d'autre
    simples = shapely.coverage_simplify(unions, 0.01)
    print('Couverture valide :', bool(shapely.coverage_is_valid(simples).all()))

    sortie = []
    for i, g in zip(ids, simples):
        if i == 'gl':
            g = g.simplify(0.04, preserve_topology=True)  # seulement un coin de la carte : inutile de le détailler
        polys = en_polygones(g)
        petit = sum(p.area for p in polys) < 0.5  # micro-États et petites îles : on garde tout
        if not petit:
            polys = [p for p in polys if p.area > 0.0015]
        if not polys:
            print('  vide :', i)
            continue
        e = {'id': i}
        if i in TRANSCONTINENTAUX:
            zone = TRANSCONTINENTAUX[i]
            ee = [m for p in polys for m in en_polygones(p.intersection(zone))]
            ea = [m for p in polys for m in en_polygones(p.difference(zone))]
            ee = [m for m in ee if m.area > 0.0015]
            ea = [m for m in ea if m.area > 0.0015]
            e['ee'] = coords(ee)
            e['ea'] = coords(ea)
            print(f'  {i}: Europe {sum(m.area for m in ee):.1f} deg², Asie {sum(m.area for m in ea):.1f} deg²')
        else:
            e['p'] = coords(polys)
        sortie.append(e)

    with open(SORTIE, 'w') as f:
        json.dump({'pays': sortie, 'limite': [[round(x, 2), round(y, 2)] for x, y in LIMITE]}, f, separators=(',', ':'))
    print(f'{len(sortie)} pays -> {SORTIE} : {os.path.getsize(SORTIE) / 1024:.0f} Ko')


if __name__ == '__main__':
    main()
