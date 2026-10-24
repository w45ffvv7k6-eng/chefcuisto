#!/usr/bin/env bash
# Applique les fichiers de supabase/migrations/ qui ne l'ont pas encore été,
# grâce à l'API de gestion de Supabase. N'a besoin que du jeton d'accès
# (SUPABASE_ACCESS_TOKEN) et de l'identifiant du projet (PROJECT_REF).
set -euo pipefail

API="https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"

requete() {
  local reponse code
  reponse=$(jq -n --arg q "$1" '{query: $q}' | curl -sS -w '\n%{http_code}' -X POST "$API" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" --data-binary @-)
  code=$(tail -n1 <<<"$reponse")
  reponse=$(sed '$d' <<<"$reponse")
  if [[ $code != 2* ]]; then
    echo "::error::Supabase a répondu $code : $reponse" >&2
    return 1
  fi
  printf '%s' "$reponse"
}

requete "create table if not exists public.cuisto_migrations (nom text primary key, appliquee_le timestamptz default now());
alter table public.cuisto_migrations enable row level security;" >/dev/null

deja=$(requete "select nom from public.cuisto_migrations" | jq -r '.[].nom')

for fichier in $(ls supabase/migrations/*.sql | sort); do
  nom=$(basename "$fichier")
  if grep -qxF "$nom" <<<"$deja"; then
    echo "Déjà appliquée : $nom"
    continue
  fi
  echo "Application de $nom…"
  requete "begin;
$(cat "$fichier")
insert into public.cuisto_migrations (nom) values ('$nom');
commit;" >/dev/null
  echo "OK : $nom"
done
