# Médias de compta-manager

Cette branche ne contient que des fichiers lourds lus par le site (modèles 3D du labo de sciences).
Elle n'est **jamais** construite par Vercel (voir `vercel.json`) : c'est ce qui évite de les recopier à chaque déploiement.

- `anatomie-gz.bin` et `circulation-gz.bin` : modèles 3D du corps humain, compressés en gzip.
  Source : BodyParts3D, © The Database Center for Life Science, licence CC BY 4.0.

Le site les charge via jsDelivr (puis GitHub en secours) en visant un commit précis :
voir `src/config/medias.js` dans la branche `main`. Après avoir changé un fichier ici, il faut mettre à jour ce commit.
