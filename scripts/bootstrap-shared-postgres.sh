#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${BOOKING_DB_ENV_FILE:-$ROOT_DIR/secrets/production/postgres.env}"

[[ -f "$ENV_FILE" ]] || { printf 'Missing %s\n' "$ENV_FILE" >&2; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${BOOKING_DB:?BOOKING_DB is required}"
: "${BOOKING_DB_USER:?BOOKING_DB_USER is required}"
: "${BOOKING_DB_PASSWORD:?BOOKING_DB_PASSWORD is required}"
VIETSAGE_POSTGRES_CONTAINER="${VIETSAGE_POSTGRES_CONTAINER:-vietsage-postgres}"

[[ "$BOOKING_DB" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || { printf 'Invalid BOOKING_DB\n' >&2; exit 2; }
[[ "$BOOKING_DB_USER" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || { printf 'Invalid BOOKING_DB_USER\n' >&2; exit 2; }
[[ ${#BOOKING_DB_PASSWORD} -ge 24 ]] || { printf 'BOOKING_DB_PASSWORD must be at least 24 characters\n' >&2; exit 2; }
[[ "$(docker inspect -f '{{.State.Running}}' "$VIETSAGE_POSTGRES_CONTAINER" 2>/dev/null)" == true ]] || {
  printf 'PostgreSQL container is not running: %s\n' "$VIETSAGE_POSTGRES_CONTAINER" >&2
  exit 1
}

escape_psql() {
  local value=${1//\\/\\\\}
  printf '%s' "${value//\'/\'\'}"
}

{
  printf "\\set booking_db '%s'\n" "$(escape_psql "$BOOKING_DB")"
  printf "\\set booking_user '%s'\n" "$(escape_psql "$BOOKING_DB_USER")"
  printf "\\set booking_password '%s'\n" "$(escape_psql "$BOOKING_DB_PASSWORD")"
  printf '%s\n' \
    "SELECT format('CREATE ROLE %I LOGIN', :'booking_user') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'booking_user') \\gexec" \
    'ALTER ROLE :"booking_user" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'"'"'booking_password'"'"';' \
    "SELECT format('CREATE DATABASE %I OWNER %I', :'booking_db', :'booking_user') WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'booking_db') \\gexec" \
    "SELECT format('ALTER DATABASE %I OWNER TO %I', :'booking_db', :'booking_user') \\gexec" \
    "SELECT format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', :'booking_db') \\gexec" \
    "SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'booking_db', :'booking_user') \\gexec"
} | docker exec -i "$VIETSAGE_POSTGRES_CONTAINER" sh -lc \
  'exec psql --username "${POSTGRES_USER:-postgres}" --dbname postgres --set ON_ERROR_STOP=1'

printf 'Prepared isolated database %s and role %s in %s\n' \
  "$BOOKING_DB" "$BOOKING_DB_USER" "$VIETSAGE_POSTGRES_CONTAINER"
