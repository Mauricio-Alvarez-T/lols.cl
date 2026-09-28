#!/bin/bash
# Deploy pull-side de lols.cl. Lo ejecuta un cron de cPanel cada 5 min (ver docs/DEPLOY.md).
# GitHub Actions compila y publica dist/ en la rama `deploy`; este script la baja con
# git (conexión saliente: el FTP entrante bloquea las IPs de GitHub) y la copia al docroot.
set -euo pipefail

REPO_DIR="${REPO_DIR:-/home/lolscl/deploy-lols.cl}"
BRANCH="deploy"
# Staging mientras dura la revisión. Al pasar a producción NO basta con cambiar esto:
# ver docs/DEPLOY.md § Paso a producción.
DEST="${DEST:-/home/lolscl/public_html/nuevo.lols.cl}"
TESTIGO="$HOME/.deploy-lols.cl-ok"   # sha del último deploy exitoso
LOCK="$HOME/.deploy-lols.cl.lock"

log() { echo "$(date '+%F %T') · $*"; }

# public_html contiene los docroots de otros dominios (boveda.lols.cl, nuevo.lols.cl, ...):
# un rsync --delete ahí los borraría.
case "${DEST%/}" in
    */public_html) log "ABORTO: DEST=$DEST es public_html; el --delete borraría otros sitios"; exit 1 ;;
esac

# Lock anti-solape entre ticks; uno de más de 30 min se considera colgado y se libera.
if [ -d "$LOCK" ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin +30 2>/dev/null)" ]; then
    rmdir "$LOCK" 2>/dev/null || true
fi
if ! mkdir "$LOCK" 2>/dev/null; then
    log "otro deploy en curso (lock) — salto"
    exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

cd "$REPO_DIR"
git fetch origin "$BRANCH" --quiet
REMOTE="$(git rev-parse "origin/$BRANCH")"
ULTIMO="$(cat "$TESTIGO" 2>/dev/null || true)"

# Se compara contra el testigo y no contra HEAD: tras el clone inicial HEAD ya es REMOTE
# y el primer deploy nunca ocurriría.
if [ "$REMOTE" = "$ULTIMO" ]; then
    log "sin cambios (${REMOTE:0:7})"
    exit 0
fi

log "desplegando ${REMOTE:0:7} (antes ${ULTIMO:0:7})"
git reset --hard "origin/$BRANCH" --quiet

if [ ! -s "$REPO_DIR/dist/index.html" ]; then
    log "ABORTO: dist/index.html no existe en la rama $BRANCH"
    exit 1
fi

# Espejo exacto de dist/, preservando lo que no es del build:
#   .well-known/ → validación de AutoSSL (Let's Encrypt)
#   cgi-bin/     → lo crea cPanel en cada docroot
mkdir -p "$DEST"
if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \
        --exclude '.well-known/' \
        --exclude 'cgi-bin/' \
        --exclude 'deploy-status.txt' \
        "$REPO_DIR/dist/" "$DEST/"
else
    find "$DEST" -mindepth 1 -maxdepth 1 ! -name '.well-known' ! -name 'cgi-bin' ! -name 'deploy-status.txt' -exec rm -rf {} +
    cp -a "$REPO_DIR/dist/." "$DEST/"
fi

echo "$REMOTE" > "$TESTIGO"
printf '%s · OK · %s\n' "$(date '+%F %T')" "${REMOTE:0:7}" > "$DEST/deploy-status.txt"
log "deploy OK → ${REMOTE:0:7}"
