"""
Extrait du modèle BodyParts3D 4.0 (CC BY 4.0, Database Center for Life Science,
via le dépôt github.com/ashemag/human-atlas) les os et les muscles utiles au
labo de sciences, regroupés par os / muscle et par côté.

Utilisation (une seule fois, à la main) :
  python3 scripts/labo/extraire_anatomie.py /chemin/vers/human-atlas
Sortie : public/labo/anatomie/anatomie.json + anatomie-gz.bin
Format du .bin (petit-boutiste) : pour chaque pièce, positions Int16 x3
(quantifiées dans la boîte englobante globale) puis indices Uint32.
"""
import gzip, json, re, struct, sys, array
from pathlib import Path

SRC = Path(sys.argv[1]) / 'public' / 'models'
OUT = Path(__file__).resolve().parents[2] / 'public' / 'labo' / 'anatomie'

def groupe(nom):
    n = nom.lower()
    regles = [
        (r'intervertebral disk', 'disques'),
        (r'costal cartilage', 'cartilages'),
        (r'gingiva|cartilage|hyoid', None),
        (r'tooth|frontal bone|parietal|occipital|temporal bone|sphenoid|ethmoid|nasal bone|zygomatic|maxilla|mandible|vomer|palatine', 'crane'),
        (r'atlas$|axis$|vertebra', 'vertebres'),
        (r'\brib\b', 'cotes'),
        (r'manubrium|body of sternum|xiphoid', 'sternum'),
        (r'clavicle', 'clavicule'),
        (r'scapula$', 'omoplate'),
        (r'humerus', 'humerus'),
        (r'\bradius$', 'radius'),
        (r'\bulna$', 'cubitus'),
        (r'scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|finger|thumb', 'main'),
        (r'hip bone|sacrum|coccyx', 'bassin'),
        (r'femur', 'femur'),
        (r'patella', 'rotule'),
        (r'\btibia$', 'tibia'),
        (r'fibula$', 'perone'),
        (r'talus|calcaneus$|navicular|cuboid|cuneiform bone|metatarsal|toe|sesamoid bone of', 'pied'),
        (r'biceps brachii', 'biceps'),
        (r'triceps brachii', 'triceps'),
        (r'brachialis$', 'brachial'),
        (r'deltoid', 'deltoide'),
        (r'brachioradialis|flexor carpi|extensor carpi', 'muscles_avant_bras'),
        (r'rectus femoris|vastus', 'quadriceps'),
        (r'biceps femoris|semitendinosus|semimembranosus', 'ischio_jambiers'),
        (r'gastrocnemius|soleus', 'mollet'),
        (r'calcaneal tendon', 'tendon_achille'),
        (r'tibialis anterior', 'jambier_anterieur'),
        (r'^skin$', 'peau'),
    ]
    for motif, g in regles:
        if re.search(motif, n):
            return g
    return None

def cote(nom):
    n = nom.lower()
    if re.search(r'\bright\b', n): return 'd'
    if re.search(r'\bleft\b', n): return 'g'
    return ''

IMPAIRS = {'crane', 'vertebres', 'sternum', 'disques', 'bassin'}

atlas = json.loads((SRC / 'atlas.json').read_text())
chunks = [(SRC / Path(c['url']).name).read_bytes() for c in atlas['chunks']]

pieces = {}
for p in atlas['parts']:
    if p['system'] not in ('skeletal', 'muscular', 'connective', 'integumentary') or re.search(r'vein|arter|nerve|ligament', p['name'], re.I):
        continue
    g = groupe(p['name'])
    if not g:
        continue
    buf = chunks[p['chunk']]
    pos = struct.unpack_from(f"<{p['vertexCount']*3}f", buf, p['positions'])
    idx = struct.unpack_from(f"<{p['indexCount']}I", buf, p['indices'])
    if g == 'peau':
        # Peau : seulement le bras droit (pour le scalpel), triangles dont le centre est hors du tronc
        garde = []
        for t in range(0, len(idx), 3):
            a, b, c = idx[t:t+3]
            cx = (pos[a*3] + pos[b*3] + pos[c*3]) / 3
            cy = (pos[a*3+1] + pos[b*3+1] + pos[c*3+1]) / 3
            if cx < -0.17 and cy > 0.75:
                garde += [a, b, c]
        idx = garde
        g, cle = 'peau', ('peau', 'd')
    if g in IMPAIRS:
        c = ''
    elif g == 'peau':
        c = 'd'
    else:
        c = cote(p['name']) or ('d' if sum(pos[0::3]) / (len(pos) / 3) < 0 else 'g')
    cle = (g, c)
    pieces.setdefault(cle, []).append((pos, idx))

# Boîte englobante globale
xs = []
for lst in pieces.values():
    for pos, _ in lst:
        xs.append((min(pos[0::3]), min(pos[1::3]), min(pos[2::3]), max(pos[0::3]), max(pos[1::3]), max(pos[2::3])))
mn = [min(b[i] for b in xs) for i in range(3)]
mx = [max(b[i+3] for b in xs) for i in range(3)]

donnees = bytearray()
manifeste = []
for (g, c), lst in sorted(pieces.items()):
    positions, indices = [], []
    base = 0
    for pos, idx in lst:
        # garde seulement les sommets utilisés (peau découpée)
        utilises = sorted(set(idx))
        remap = {v: i for i, v in enumerate(utilises)}
        for v in utilises:
            for k in range(3):
                q = round((pos[v*3+k] - mn[k]) / (mx[k] - mn[k]) * 65534 - 32767)
                positions.append(max(-32767, min(32767, q)))
        indices += [remap[v] + base for v in idx]
        base += len(utilises)
    off = len(donnees)
    donnees += array.array('h', positions).tobytes()
    off_i = len(donnees)
    donnees += array.array('I', indices).tobytes()
    manifeste.append({'groupe': g, 'cote': c, 'positions': off, 'sommets': base, 'indices': off_i, 'nIndices': len(indices)})

OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'anatomie-gz.bin').write_bytes(gzip.compress(bytes(donnees), 9))
(OUT / 'anatomie.json').write_text(json.dumps({
    'source': 'BodyParts3D 4.0, © The Database Center for Life Science, CC BY 4.0 (via github.com/ashemag/human-atlas)',
    'unite': 'mètres, Y vers le haut, Z vers l’avant, X négatif = côté droit de la personne',
    'min': mn, 'max': mx, 'octets': len(donnees), 'pieces': manifeste,
}, ensure_ascii=False, indent=1))
print(len(manifeste), 'pièces', len(donnees), 'octets bruts', (OUT / 'anatomie-gz.bin').stat().st_size, 'gzip')
for m in manifeste: print(m['groupe'], m['cote'], m['sommets'], m['nIndices']//3)
