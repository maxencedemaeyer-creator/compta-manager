#!/bin/sh
# Appelé par Vercel (vercel.json → ignoreCommand) avant chaque construction.
# Code 1 = on construit, code 0 = on saute. Chaque construction recopie tout
# public/ dans le stockage de l'équipe Vercel : on n'en fait que pour main.
#  - main                                  → construit
#  - déploiement hors Git (pas de branche) → construit
#  - autre branche                         → sautée, sauf si le message du
#                                            commit contient « [preview] »
if [ -z "$VERCEL_GIT_COMMIT_REF" ] || [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "Branche main : construction."
  exit 1
fi
case "$VERCEL_GIT_COMMIT_MESSAGE" in
  *"[preview]"*)
    echo "Branche $VERCEL_GIT_COMMIT_REF : [preview] demandé, construction."
    exit 1
    ;;
esac
echo "Branche $VERCEL_GIT_COMMIT_REF : pas de construction (économie de stockage)."
exit 0
