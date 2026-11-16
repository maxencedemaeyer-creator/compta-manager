# MOTUS — fabrication des listes de mots

1. `pip download pylexique --no-deps` puis décompresser : contient `Lexique383.txt` (base Lexique 3, licence CC BY-SA 4.0).
2. `npm pack an-array-of-french-words` puis décompresser : `package/index.json` (licence MIT).
3. `python3 cibles.py Lexique383.txt package/index.json cibles.txt` → noms communs, adjectifs et verbes (forme du dictionnaire : singulier, masculin, infinitif), 5 à 12 lettres, présents dans le dictionnaire.
4. `python3 genere.py package/index.json cibles.txt ../../public/motus` → `public/motus/cibles.txt` (mots à deviner, injures retirées) et `public/motus/dico/` (mots acceptés, un fichier par 1re lettre + longueur).
