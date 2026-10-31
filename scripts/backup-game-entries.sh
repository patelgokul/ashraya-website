#!/bin/bash
# Saves Game Day participants, scores, and events to this Mac every run.
set -euo pipefail
export PATH="/opt/homebrew/opt/postgresql@16/bin:/opt/homebrew/bin:/usr/bin:/bin:${PATH:-}"

ROOT="/Users/gokulpatel/Documents/Github NGO/ashraya-website"
DEST="/Users/gokulpatel/Documents/Ashraya-backups/game-day"
ENV_FILE="$ROOT/.env.local"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DEST/$STAMP"

mkdir -p "$OUT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
\copy (SELECT * FROM "GameParticipant" ORDER BY "createdAt") TO '$OUT/participants.csv' WITH CSV HEADER
\copy (SELECT * FROM "GameScore" ORDER BY "createdAt") TO '$OUT/scores.csv' WITH CSV HEADER
\copy (SELECT * FROM "GameEvent" ORDER BY "createdAt") TO '$OUT/events.csv' WITH CSV HEADER
SQL

psql "$DATABASE_URL" -At -c "SELECT 'participants', count(*) FROM \"GameParticipant\" UNION ALL SELECT 'scores', count(*) FROM \"GameScore\";" > "$OUT/counts.txt"

find "$DEST" -mindepth 1 -maxdepth 1 -type d -mtime +2 -exec rm -rf {} +
echo "$STAMP backup written to $OUT"
