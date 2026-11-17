"""
Extrait du modèle BodyParts3D 4.0 (CC BY 4.0, Database Center for Life Science,
via le dépôt github.com/ashemag/human-atlas) tout ce qu'il faut pour
l'expérience « Le système circulatoire » du labo de sciences :
  - le cœur détaillé (parois, 4 cavités, 4 valvules, piliers, vaisseaux du cœur),
  - les artères et les veines du corps entier, regroupées par vaisseau / région,
  - quelques organes repères (cerveau, trachée et bronches, tube digestif, reins,
    muscles de la jambe) pour les liens entre les systèmes,
  - un squelette allégé pour se repérer dans le corps.

Utilisation (une seule fois, à la main) :
  pip install fast-simplification numpy
  python3 scripts/labo/extraire_circulation.py /chemin/vers/human-atlas
Sortie : public/labo/circulation/circulation.json + circulation-gz.bin
Format du .bin (petit-boutiste) : pour chaque pièce, positions Int16 x3
(quantifiées dans la boîte englobante globale) puis indices Uint16
(ou Uint32 si « i32 » vaut true dans le manifeste).
"""
import array
import gzip
import json
import re
import struct
import sys
from pathlib import Path

import numpy as np
import fast_simplification

SRC = Path(sys.argv[1]) / 'public' / 'models'
OUT = Path(__file__).resolve().parents[2] / 'public' / 'labo' / 'circulation'

# (motif sur le nom anglais, groupe, nature) — nature : coeur, artere, veine, organe, os
REGLES = [
    # ---------- le cœur ----------
    (r'^wall of ventricle$', 'paroi_ventricules', 'coeur'),
    (r'^wall of right atrium$', 'paroi_oreillette_d', 'coeur'),
    (r'^wall of left atrium$', 'paroi_oreillette_g', 'coeur'),
    (r'^cavity of right ventricle$', 'cavite_ventricule_d', 'coeur'),
    (r'^cavity of left ventricle$', 'cavite_ventricule_g', 'coeur'),
    (r'^cavity of right atrium$', 'cavite_oreillette_d', 'coeur'),
    (r'^cavity of left atrium$', 'cavite_oreillette_g', 'coeur'),
    (r'tricuspid valve', 'valvule_tricuspide', 'coeur'),
    (r'mitral valve', 'valvule_mitrale', 'coeur'),
    (r'pulmonary valve', 'valvule_pulmonaire', 'coeur'),
    (r'aortic valve', 'valvule_aortique', 'coeur'),
    (r'papillary muscle', 'piliers', 'coeur'),
    (r'coronary artery|interventricular branch|interventricular artery|ventricular branch of|conus branch|marginal branch|circumflex branch of left coronary|diagonal branch|atrial branch|sinuatrial|atrioventricular nodal', 'arteres_coeur', 'artere'),
    (r'cardiac vein|coronary sinus|interventricular vein|vein of left ventricle|marginal vein|oblique vein of left atrium|anterior vein of right ventricle', 'veines_coeur', 'veine'),
    # ---------- les gros vaisseaux ----------
    (r'aorta$|arch of aorta', 'aorte', 'artere'),
    (r'pulmonary trunk', 'tronc_pulmonaire', 'artere'),
    (r'pulmonary artery|^(?!.*(hepatic|renal)).*segmental artery', 'arteres_pulmonaires', 'artere'),
    (r'pulmonary vein|^(?!.*(hepatic|renal)).*segmental vein|basal vein|apicoposterior vein|lingular vein', 'veines_pulmonaires', 'veine'),
    (r'superior vena cava', 'veine_cave_sup', 'veine'),
    (r'inferior vena cava', 'veine_cave_inf', 'veine'),
    # ---------- tête et cou ----------
    (r'carotid artery', 'carotide', 'artere'),
    (r'jugular vein', 'jugulaire', 'veine'),
    (r'brachiocephalic artery', 'tronc_brachiocephalique', 'artere'),
    (r'brachiocephalic vein', 'veines_brachiocephaliques', 'veine'),
    (r'subclavian artery', 'sous_claviere_a', 'artere'),
    (r'subclavian vein', 'sous_claviere_v', 'veine'),
    # ---------- bras ----------
    (r'axillary artery', 'axillaire_a', 'artere'),
    (r'axillary vein', 'axillaire_v', 'veine'),
    (r'^(left|right) brachial artery|deep brachial artery|of (left|right) deep brachial artery', 'artere_humerale', 'artere'),
    (r'(left|right) radial artery', 'artere_radiale', 'artere'),
    (r'(left|right) ulnar artery', 'artere_cubitale', 'artere'),
    (r'cephalic vein', 'veine_cephalique', 'veine'),
    (r'basilic vein', 'veine_basilique', 'veine'),
    # ---------- jambes ----------
    (r'iliac artery', 'arteres_iliaques', 'artere'),
    (r'iliac vein', 'veines_iliaques', 'veine'),
    (r'(left|right) femoral artery|deep femoral artery|circumflex femoral artery|perforating arter', 'artere_femorale', 'artere'),
    (r'(left|right) femoral vein|deep femoral vein|circumflex femoral vein|perforating vein', 'veine_femorale', 'veine'),
    (r'popliteal artery', 'artere_poplitee', 'artere'),
    (r'popliteal vein', 'veine_poplitee', 'veine'),
    (r'saphenous vein', 'veine_saphene', 'veine'),
    # ---------- organes ----------
    (r'renal artery|suprarenal artery', 'arteres_reins', 'artere'),
    (r'renal vein|suprarenal vein', 'veines_reins', 'veine'),
    (r'mesenteric artery|gastric artery|splenic artery|hepatic artery|celiac|gastroduodenal|pancreatic|colic artery|ileal|jejunal|sigmoid artery|rectal artery|gastro-omental|gastroepiploic|cystic artery|appendicular artery|ileocolic artery', 'arteres_digestives', 'artere'),
    (r'portal vein|hepatovenous|hepatic vein|tributary of (left|right|middle) hepatic|mesenteric vein|gastric vein|splenic vein|pancreatic|colic vein|ileal vein|jejunal vein|sigmoid vein|rectal vein|gastro-omental|gastroepiploic|cystic vein|ileocolic vein|pancreaticoduodenal', 'veines_digestives', 'veine'),
    # ---------- organes repères ----------
    (r'^trachea$|bronch(us|ial tree)', 'trachee_bronches', 'organe'),
    (r'gyrus|occipital lobe|parietal lobule|cerebellum|white matter of|^pons$|^midbrain$|medulla oblongata|corpus callosum|temporal pole|frontal pole|cuneus|precuneus|insula$', 'cerveau', 'organe'),
    (r'^esophagus$', 'oesophage', 'organe'),
    (r'^stomach$', 'estomac', 'organe'),
    (r'jejunum|ileum|^duodenum$', 'intestin_grele', 'organe'),
    (r'colon$|^rectum$|^cecum$|^appendix$', 'gros_intestin', 'organe'),
    (r'kidney$', 'reins', 'organe'),
    (r'rectus femoris|vastus|gastrocnemius|soleus|sartorius|biceps femoris|semitendinosus|semimembranosus|tibialis anterior', 'muscles_jambe', 'organe'),
    # ---------- squelette repère (allégé) ----------
    (r'frontal bone|parietal bone|occipital bone|temporal bone|sphenoid|zygomatic|maxilla|mandible|nasal bone', 'crane', 'os'),
    (r'atlas$|axis$|vertebra|sacrum|coccyx|hip bone', 'colonne_bassin', 'os'),
    (r'\brib\b|manubrium|body of sternum|xiphoid|clavicle|scapula$', 'cage_thoracique', 'os'),
    (r'humerus|\bradius$|\bulna$|femur|patella|\btibia$|fibula$', 'os_membres', 'os'),
]

IMPAIRS = {'paroi_ventricules', 'paroi_oreillette_d', 'paroi_oreillette_g', 'aorte', 'tronc_pulmonaire', 'veine_cave_sup', 'veine_cave_inf',
           'tronc_brachiocephalique', 'trachee_bronches', 'cerveau', 'oesophage', 'estomac', 'intestin_grele', 'gros_intestin',
           'crane', 'colonne_bassin', 'cage_thoracique', 'os_membres', 'arteres_coeur', 'veines_coeur', 'piliers',
           'veines_brachiocephaliques', 'arteres_digestives', 'veines_digestives', 'muscles_jambe', 'reins',
           'cavite_ventricule_d', 'cavite_ventricule_g', 'cavite_oreillette_d', 'cavite_oreillette_g',
           'valvule_tricuspide', 'valvule_mitrale', 'valvule_pulmonaire', 'valvule_aortique', 'arteres_iliaques', 'veines_iliaques'}

# Part de triangles gardés après simplification (le cœur reste détaillé)
GARDE = {'os': 0.15, 'organe': 0.4, 'cerveau': 0.2, 'muscles_jambe': 0.3, 'trachee_bronches': 0.35,
         'artere': 0.5, 'veine': 0.5, 'coeur': 1.0,
         'arteres_tete': 0.25, 'arteres_tronc': 0.3, 'veines_tronc': 0.3, 'arteres_digestives': 0.3, 'veines_digestives': 0.25,
         'arteres_coeur': 0.45, 'veines_coeur': 0.45, 'valvule_tricuspide': 0.6, 'valvule_mitrale': 0.6, 'valvule_pulmonaire': 0.6,
         'valvule_aortique': 0.7, 'piliers': 0.6,
         'aorte': 0.8, 'tronc_pulmonaire': 1.0, 'veine_cave_sup': 1.0, 'veine_cave_inf': 1.0, 'carotide': 0.8, 'jugulaire': 1.0}


def regle(nom, systeme):
    n = nom.lower()
    if systeme in ('cardiac',) and re.search(r'ventricle|foramen', n) and not re.search(r'wall|cavity', n):
        return None  # ventricules du CERVEAU, rangés par erreur dans « cardiac »
    if re.search(r'hepatovenous segment', n):
        return None  # volumes du foie entier, pas des vaisseaux
    if re.search(r'pharyn|palat|nasal concha|nasal cartilage|epiglottis|tongue|gingiva|tooth|mesentery|taenia|mesocolon|omentum|duct|gland|biliary', n):
        return None
    for motif, groupe, nature in REGLES:
        if re.search(motif, n):
            if nature == 'os' and systeme != 'skeletal':
                continue
            if nature == 'artere' and systeme != 'arterial':
                continue
            if nature == 'veine' and systeme != 'venous':
                continue
            return groupe, nature
    if systeme == 'arterial':
        return 'reseau_a', 'artere'
    if systeme == 'venous':
        return 'reseau_v', 'veine'
    return None


def region(cx, cy):
    """Région du corps pour les petits vaisseaux non nommés."""
    if cy > 1.45:
        return 'tete'
    if abs(cx) > 0.16 and cy > 0.72:
        return 'bras'
    if cy < 0.92:
        return 'jambe'
    return 'tronc'


def cote(nom, cx):
    n = nom.lower()
    if re.search(r'\bright\b', n):
        return 'd'
    if re.search(r'\bleft\b', n):
        return 'g'
    return 'd' if cx < 0 else 'g'


atlas = json.loads((SRC / 'atlas.json').read_text())
chunks = [(SRC / Path(c['url']).name).read_bytes() for c in atlas['chunks']]

pieces = {}
for p in atlas['parts']:
    r = regle(p['name'], p['system'])
    if not r:
        continue
    groupe, nature = r
    buf = chunks[p['chunk']]
    pos = np.frombuffer(buf, dtype='<f4', count=p['vertexCount'] * 3, offset=p['positions']).reshape(-1, 3)
    idx = np.frombuffer(buf, dtype='<u4', count=p['indexCount'], offset=p['indices']).reshape(-1, 3)
    cx, cy = float(pos[:, 0].mean()), float(pos[:, 1].mean())
    if groupe in ('reseau_a', 'reseau_v'):
        groupe = ('arteres_' if nature == 'artere' else 'veines_') + region(cx, cy)
    c = '' if groupe in IMPAIRS or groupe.endswith('_tronc') or groupe.endswith('_tete') else cote(p['name'], cx)
    pieces.setdefault((groupe, c, nature), []).append((pos, idx))


def simplifier(pos, idx, garde):
    if garde >= 0.99 or len(idx) < 300:
        return pos, idx
    try:
        p2, i2 = fast_simplification.simplify(pos.astype(np.float32), idx.astype(np.int64), target_reduction=1 - garde)
        if len(i2) > 20:
            return p2, i2
    except Exception as err:  # noqa: BLE001
        print('simplification impossible', err)
    return pos, idx


# Boîte englobante globale
tous = np.concatenate([pos for lst in pieces.values() for pos, _ in lst])
mn, mx = tous.min(0), tous.max(0)

donnees = bytearray()
manifeste = []
for (g, c, nature), lst in sorted(pieces.items()):
    garde = GARDE.get(g, GARDE.get(nature, 1.0))
    # on fusionne les morceaux du groupe puis on simplifie l'ensemble
    tout_pos, tout_idx, b = [], [], 0
    for pos, idx in lst:
        tout_pos.append(pos)
        tout_idx.append(idx + b)
        b += len(pos)
    lst = [simplifier(np.concatenate(tout_pos), np.concatenate(tout_idx), garde)]
    positions, indices, base = [], [], 0
    for pos, idx in lst:
        utilises = np.unique(idx)
        remap = np.full(len(pos), -1, dtype=np.int64)
        remap[utilises] = np.arange(len(utilises))
        q = np.round((pos[utilises] - mn) / (mx - mn) * 65534 - 32767).clip(-32767, 32767).astype('<i2')
        positions.append(q)
        indices.append(remap[idx].reshape(-1) + base)
        base += len(utilises)
    positions = np.concatenate(positions)
    indices = np.concatenate(indices)
    i32 = base > 65535
    off = len(donnees)
    donnees += positions.tobytes()
    if len(donnees) % 4:
        donnees += b'\0' * (4 - len(donnees) % 4)
    off_i = len(donnees)
    donnees += indices.astype('<u4' if i32 else '<u2').tobytes()
    if len(donnees) % 4:
        donnees += b'\0' * (4 - len(donnees) % 4)
    manifeste.append({'groupe': g, 'cote': c, 'nature': nature, 'positions': off, 'sommets': int(base),
                      'indices': off_i, 'nIndices': int(len(indices)), 'i32': bool(i32)})

OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'circulation-gz.bin').write_bytes(gzip.compress(bytes(donnees), 9))
(OUT / 'circulation.json').write_text(json.dumps({
    'source': 'BodyParts3D 4.0, © The Database Center for Life Science, CC BY 4.0 (via github.com/ashemag/human-atlas)',
    'unite': 'mètres, Y vers le haut, Z vers l’avant, X négatif = côté droit de la personne',
    'min': mn.tolist(), 'max': mx.tolist(), 'octets': len(donnees), 'pieces': manifeste,
}, ensure_ascii=False, indent=1))
print(len(manifeste), 'pièces', len(donnees), 'octets bruts', (OUT / 'circulation-gz.bin').stat().st_size, 'gzip')
for m in manifeste:
    print(f"{m['nature']:7} {m['groupe']:28} {m['cote']:1} {m['sommets']:7} {m['nIndices'] // 3:7}")


# =============================================================
#  Lignes centrales de quelques vaisseaux (pour faire voyager une
#  goutte de sang dans les vrais vaisseaux) + points repères.
#  Ligne centrale : on coupe le vaisseau en tranches de 6 mm le long
#  de son axe principal et on prend le centre de chaque tranche.
# =============================================================
LIGNES = {
    'aorte_ascendante': 'Ascending aorta', 'crosse_aorte': 'Arch of aorta', 'aorte_descendante': 'Descending aorta',
    'tronc_pulmonaire': 'Pulmonary trunk', 'artere_pulmonaire_g': 'Left pulmonary artery', 'artere_pulmonaire_d': 'Right pulmonary artery',
    'veine_pulmonaire_g': 'Left superior pulmonary vein', 'veine_pulmonaire_d': 'Right superior pulmonary vein',
    'veine_cave_sup': 'Superior vena cava', 'veine_cave_inf_haut': ('Inferior vena cava', 0), 'veine_cave_inf_bas': ('Inferior vena cava', 1),
    'carotide_commune': 'Left common carotid artery', 'carotide_interne': 'Left internal carotid artery',
    'jugulaire_interne': 'Left internal jugular vein', 'brachiocephalique_v': 'Left brachiocephalic vein',
    'sous_claviere_a': 'Left subclavian artery', 'axillaire_a': 'Left axillary artery', 'humerale_a': 'Left brachial artery', 'radiale_a': 'Left radial artery',
    'radiale_v': 'Left radial vein', 'humerale_v': 'Left medial brachial vein', 'axillaire_v': 'Left axillary vein', 'sous_claviere_v': 'Left subclavian vein',
    'iliaque_commune_a': 'Left common iliac artery', 'iliaque_externe_a': 'Left external iliac artery', 'femorale_a': 'Left femoral artery',
    'poplitee_a': 'Left popliteal artery', 'tibiale_a': 'Left anterior tibial artery',
    'tibiale_v': ('Left anterior tibial vein', 'max'), 'poplitee_v': 'Left popliteal vein', 'femorale_v': 'Left femoral vein',
    'iliaque_externe_v': ('Left external iliac vein', 'max'), 'iliaque_commune_v': 'Left common iliac vein',
    'mesenterique_a': 'Trunk of superior mesenteric artery', 'mesenterique_v': 'Superior mesenteric vein', 'porte': 'Hepatic portal vein',
    'hepatique_v': 'Right hepatic vein', 'renale_a': 'Left renal artery', 'renale_v': ('Left renal vein', 'min'),
}


def piece(nom):
    choix = nom
    if isinstance(nom, tuple):
        nom, choix = nom
    trouves = [p for p in atlas['parts'] if p['name'] == nom]
    if not trouves:
        raise SystemExit(f'introuvable : {nom}')
    if choix == 'max':
        return max(trouves, key=lambda p: p['vertexCount'])
    if choix == 'min':
        return min(trouves, key=lambda p: p['vertexCount'])
    if isinstance(choix, int):
        return sorted(trouves, key=lambda p: -p['bounds'][1][1])[choix]
    return trouves[0]


def ligne_centrale(p, pas=0.006):
    buf = chunks[p['chunk']]
    pos = np.frombuffer(buf, dtype='<f4', count=p['vertexCount'] * 3, offset=p['positions']).reshape(-1, 3).astype(np.float64)
    c = pos.mean(0)
    _, _, vt = np.linalg.svd(pos - c, full_matrices=False)
    axe = vt[0]
    t = (pos - c) @ axe
    n = max(2, int((t.max() - t.min()) / pas))
    bornes = np.linspace(t.min(), t.max(), n + 1)
    pts = []
    for i in range(n):
        m = (t >= bornes[i]) & (t <= bornes[i + 1])
        if m.sum() >= 3:
            pts.append(pos[m].mean(0))
    pts = np.array(pts)
    if len(pts) >= 5:  # lissage léger
        lisse = pts.copy()
        lisse[1:-1] = (pts[:-2] + 2 * pts[1:-1] + pts[2:]) / 4
        pts = lisse
    return [[round(float(v), 4) for v in q] for q in pts]


lignes = {cle: ligne_centrale(piece(nom)) for cle, nom in LIGNES.items()}


def centre(motif, systeme=None, plus_grand=False):
    ps = [p for p in atlas['parts'] if re.search(motif, p['name'], re.I) and (systeme is None or p['system'] == systeme)]
    if plus_grand:
        ps = [max(ps, key=lambda p: p['vertexCount'])]
    tout = []
    for p in ps:
        buf = chunks[p['chunk']]
        tout.append(np.frombuffer(buf, dtype='<f4', count=p['vertexCount'] * 3, offset=p['positions']).reshape(-1, 3))
    return [round(float(v), 4) for v in np.concatenate(tout).mean(0)]


points = {
    'oreillette_d': centre(r'^cavity of right atrium$'), 'ventricule_d': centre(r'^cavity of right ventricle$'),
    'oreillette_g': centre(r'^cavity of left atrium$'), 'ventricule_g': centre(r'^cavity of left ventricle$'),
    'coeur': centre(r'^wall of ventricle$|^wall of (left|right) atrium$'),
    'cerveau': centre(r'white matter of left cerebral hemisphere'),
    'poumon_g': centre(r'^left .*segmental bronchial tree$|lingular bronchial tree', 'respiratory'),
    'poumon_d': centre(r'^right .*segmental bronchial tree$|^(medial|lateral) segmental bronchial tree', 'respiratory'),
    'main': centre(r'^left (first|second|third|fourth) common palmar digital artery$'),
    'pied': centre(r'^left anterior tibial artery$'),
    'intestin': centre(r'jejunum|ileum', 'digestive'),
    'foie': centre(r'hepatovenous segment'),
    'rein_g': centre(r'^left kidney$'),
}

manif = json.loads((OUT / 'circulation.json').read_text())
manif['lignes'] = lignes
manif['points'] = points
(OUT / 'circulation.json').write_text(json.dumps(manif, ensure_ascii=False, separators=(',', ':')))
print('lignes :', {k: len(v) for k, v in lignes.items()})
