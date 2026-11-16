"""
Extrait de BodyParts3D 4.0 (CC BY 4.0) les os du membre supérieur droit, un par un,
pour construire les membres antérieurs des animaux (paillasse « Les cousins cachés ») :
chaque os est recentré et orienté (axe principal le long de X, bout proche de l'épaule en 0).
  python3 scripts/labo/extraire_membre.py /chemin/vers/human-atlas
Sortie : public/labo/anatomie/membre.json + membre.bin (Float32 positions puis Uint16 indices).
"""
import json, struct, sys, array
from pathlib import Path
import numpy as np

SRC = Path(sys.argv[1]) / 'public' / 'models'
OUT = Path(__file__).resolve().parents[2] / 'public' / 'labo' / 'anatomie'
atlas = json.loads((SRC / 'atlas.json').read_text())
chunks = [(SRC / Path(c['url']).name).read_bytes() for c in atlas['chunks']]
par_nom = {p['name']: p for p in atlas['parts']}

DOIGTS = {1: 'thumb', 2: 'index finger', 3: 'middle finger', 4: 'ring finger', 5: 'little finger'}
ORD = {1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth'}
PIECES = {'humerus': ['Right humerus'], 'radius': ['Right radius'], 'cubitus': ['Right ulna'],
          'carpes': ['Right ' + n for n in ['scaphoid', 'lunate', 'triquetral', 'pisiform', 'trapezium', 'trapezoid', 'capitate', 'hamate']]}
for d in range(1, 6):
    PIECES[f'mc{d}'] = [f'Right {ORD[d]} metacarpal bone']
    PIECES[f'p{d}1'] = [f'Proximal phalanx of right {DOIGTS[d]}']
    if d != 1:
        PIECES[f'p{d}2'] = [f'Middle phalanx of right {DOIGTS[d]}']
    PIECES[f'p{d}3'] = [f'Distal phalanx of right {DOIGTS[d]}']

def charger(nom):
    p = par_nom[nom]
    buf = chunks[p['chunk']]
    pos = np.array(struct.unpack_from(f"<{p['vertexCount']*3}f", buf, p['positions'])).reshape(-1, 3)
    idx = np.array(struct.unpack_from(f"<{p['indexCount']}I", buf, p['indices']))
    return pos, idx

donnees = bytearray()
manifeste = {}
for cle, noms in PIECES.items():
    tout_pos, tout_idx, base = [], [], 0
    for n in noms:
        pos, idx = charger(n)
        tout_pos.append(pos); tout_idx.append(idx + base); base += len(pos)
    pos = np.vstack(tout_pos); idx = np.concatenate(tout_idx)
    centre = pos.mean(axis=0)
    q = pos - centre
    if cle == 'carpes':
        axe = np.array([0, -1.0, 0])
    else:
        w, v = np.linalg.eigh(np.cov(q.T))
        axe = v[:, np.argmax(w)]
        if axe[1] > 0:  # vers le bas = vers les doigts (bras le long du corps)
            axe = -axe
    # repère : X = axe de l'os (épaule → doigts), Z = vers l'avant, Y complète
    z = np.array([0, 0, 1.0]) - axe * axe[2]
    z /= np.linalg.norm(z)
    y = np.cross(z, axe)
    R = np.stack([axe, y, z])  # lignes
    loc = q @ R.T
    xmin, xmax = loc[:, 0].min(), loc[:, 0].max()
    loc[:, 0] -= xmin
    if cle == 'carpes':
        loc[:, 0] -= (xmax - xmin) / 2
    off_p = len(donnees)
    donnees += array.array('f', loc.astype(np.float32).ravel().tolist()).tobytes()
    off_i = len(donnees)
    donnees += array.array('H', idx.astype(np.uint16).tolist()).tobytes()
    if len(donnees) % 4:
        donnees += b'\0' * (4 - len(donnees) % 4)
    manifeste[cle] = {'positions': off_p, 'sommets': len(loc), 'indices': off_i, 'nIndices': len(idx),
                      'longueur': float(xmax - xmin), 'largeur': float(np.ptp(loc[:, 1])), 'epaisseur': float(np.ptp(loc[:, 2]))}

(OUT / 'membre.bin').write_bytes(bytes(donnees))
(OUT / 'membre.json').write_text(json.dumps({'source': 'BodyParts3D 4.0, © The Database Center for Life Science, CC BY 4.0', 'pieces': manifeste}, indent=1))
print(len(manifeste), 'os', len(donnees), 'octets')
for k, m in manifeste.items(): print(k, round(m['longueur']*100, 1), 'cm')
