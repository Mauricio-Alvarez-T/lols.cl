#!/bin/bash
# Deploy pull-side de lols.cl. Lo ejecuta un cron de cPanel cada 5 min (ver docs/DEPLOY.md).
# GitHub Actions compila y publica dist/ en la rama `deploy`; este script la baja con
# git (conexión saliente: el FTP entrante bloquea las IPs de GitHub) y la copia al docroot.
#
# VERSIÓN DE REFERENCIA. En el servidor corre una copia fijada fuera del clon
# (~/bin/cpanel-deploy-lols.sh) que se actualiza a mano: así, poder escribir en main no
# equivale a poder ejecutar código en el servidor. Ver docs/DEPLOY.md § Script fijado.
set -euo pipefail
export LC_ALL=C   # rangos de caracteres y ${x,,} solo en ASCII

REPO_DIR="${REPO_DIR:-/home/lolscl/deploy-lols.cl}"
BRANCH="deploy"
# Staging mientras dura la revisión. Al pasar a producción NO basta con cambiar esto:
# ver docs/DEPLOY.md § Paso a producción.
DEST="${DEST:-/home/lolscl/public_html/nuevo.lols.cl}"
TESTIGO="$HOME/.deploy-lols.cl-ok"   # sha del último deploy exitoso
LOCK="$HOME/.deploy-lols.cl.lock"

# Archivos que piden revisión (ver filtrar) y que igual salen porque alguien los revisó:
# "<sha256>  <ruta relativa a dist/>". Si cambia public/.htaccess o algún PHP de public/api/,
# el deploy aborta hasta que alguien revise el cambio y ponga aquí el hash nuevo
# (docs/DEPLOY.md § Filtro de ejecutables). Hashes de los blobs de git (LF), como salen del build.
PERMITIDOS='
1b5790cce1698dd4d1dd2546f3d3634c0ed3be0ba93138a1ccb8e191b90b9d21  .htaccess
c4d5debc42159c5181dd8e60ccbf5e295ab838dafb23cc14e4873c4b60e26ecf  api/contacto.php
44d272cfcc5cff5826550191cfe6657b1f6b6a73e1acb7144cf10d22861b83e2  api/lib/formulario.php
b96b160776bb99db38867a9571c77a51b143d82084dd3401362038fd44d4228f  api/postulacion.php
'
# Extensiones finales que salen sin revisión.
ESTATICOS=' html css js mjs json txt xml svg ico webp avif jpg jpeg png gif woff woff2 webmanifest mp4 webm pdf '

log() { echo "$(date '+%F %T') · $*"; }

# Comparación exacta, línea por línea (grep -F tomaría cada línea de una ruta con saltos de
# línea como un patrón aparte).
permitido() {
    local linea
    while IFS= read -r linea; do
        [ "$linea" = "$1" ] && return 0
    done <<<"$PERMITIDOS"
    return 1
}

# Revisa un dist/ antes de copiarlo. Imprime cada problema y devuelve 1 si hay alguno:
#   - dist/ mismo no es una carpeta real (un symlink a otra carpeta del clon, a ../ o a una ruta
#     absoluta: find no entraría y rsync/cp copiarían lo que haya del otro lado);
#   - una ruta con algo fuera de [A-Za-z0-9._/-] (un salto de línea, por ejemplo);
#   - cualquier symlink (uno a ~/.env, por ejemplo, lo dejaría legible desde la web);
#   - algo dentro de cgi-bin/ o .well-known/ de la raíz: son del servidor (cPanel corre como CGI
#     todo lo de <docroot>/cgi-bin/, sea cual sea su extensión) y nunca vienen del build;
#   - un archivo cuyo "<sha256>  <ruta>" no esté en PERMITIDOS si: es .htaccess, .user.ini o
#     php.ini; alguna de sus extensiones es de PHP, CGI, Perl, Python, shell o SSI (Apache
#     aplica el handler de cualquiera: x.php.webp, x.cgi.jpg); o la última no está en ESTATICOS.
filtrar() {
    local dist="${1%/}" problemas=0 f rel nombre ext revisar hash
    local -a partes
    if [ -L "$dist" ] || [ ! -d "$dist" ]; then
        log "FILTRO: $dist no es una carpeta real (no existe o es un symlink)"
        return 1
    fi
    while IFS= read -r -d '' f; do
        rel="${f#"$dist"/}"
        if [[ ! $rel =~ ^[A-Za-z0-9._/-]+$ ]]; then
            log "FILTRO: ruta con caracteres no permitidos $(printf '%q' "$rel")"
            problemas=1
            continue
        fi
        if [ -L "$f" ]; then
            log "FILTRO: symlink $rel"
            problemas=1
            continue
        fi
        case "${rel,,}" in
            cgi-bin | cgi-bin/* | .well-known | .well-known/*)
                log "FILTRO: $rel es del servidor, no del build"
                problemas=1
                continue
                ;;
        esac
        [ -f "$f" ] || continue
        nombre="${rel##*/}"
        nombre="${nombre,,}"
        IFS=. read -ra partes <<<"${nombre#.}"
        revisar=0
        case "$nombre" in .htaccess | .user.ini | php.ini) revisar=1 ;; esac
        for ext in "${partes[@]:1}"; do
            case "$ext" in
                php* | pht* | phar* | cgi | fcgi | pl | plx | ppl | perl | pm | py | pyc | pyo | sh | bash \
                    | shtml | shtm | stm | asis | var) revisar=1 ;;
            esac
        done
        ext=""
        [ "${#partes[@]}" -gt 1 ] && ext="${partes[${#partes[@]}-1]}"
        [[ -n $ext && $ESTATICOS == *" $ext "* ]] || revisar=1
        if [ "$revisar" = 1 ]; then
            hash="$(sha256sum "$f" | cut -d' ' -f1)"
            if ! permitido "$hash  $rel"; then
                log "FILTRO: archivo no permitido $rel ($hash)"
                problemas=1
            fi
        fi
    done < <(find "$dist/" -mindepth 1 -print0)
    return "$problemas"
}

# Prueba local del filtro, sin git ni docroot: bash cpanel-deploy.sh --filtrar <dist>
if [ "${1:-}" = "--filtrar" ]; then
    filtrar "${2:?falta la carpeta}" && log "filtro OK"
    exit
fi

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

# dist/ como symlink haría que la revisión de abajo y la copia miren otra carpeta: se corta antes
# (filtrar lo vuelve a revisar).
if [ -L "$REPO_DIR/dist" ] || [ ! -s "$REPO_DIR/dist/index.html" ]; then
    log "ABORTO: dist/index.html no existe en la rama $BRANCH, o dist/ es un symlink"
    exit 1
fi

if ! filtrar "$REPO_DIR/dist"; then
    # No se toca el docroot (sigue el sitio anterior) ni el testigo: el próximo tick vuelve a
    # intentarlo y a avisar hasta que se arregle el build o se actualice PERMITIDOS.
    mkdir -p "$DEST"
    printf '%s · FALLO · filtro · %s\n' "$(date '+%F %T')" "${REMOTE:0:7}" > "$DEST/deploy-status.txt"
    log "ABORTO: dist/ trae rutas, symlinks o archivos no permitidos (${REMOTE:0:7})"
    exit 1
fi

# Espejo exacto de dist/ sin bits de ejecución (suexec no corre un CGI sin +x), preservando lo
# que no es del build:
#   .well-known/ → validación de AutoSSL (Let's Encrypt)
#   cgi-bin/     → lo crea cPanel en cada docroot
mkdir -p "$DEST"
if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete --chmod=D755,F644 \
        --exclude '.well-known/' \
        --exclude 'cgi-bin/' \
        --exclude 'deploy-status.txt' \
        "$REPO_DIR/dist/" "$DEST/"
else
    # Las mismas exclusiones que rsync, también al copiar: lo que quede en cgi-bin/ no pasa por el
    # chmod de abajo.
    find "$DEST" -mindepth 1 -maxdepth 1 ! -name '.well-known' ! -name 'cgi-bin' ! -name 'deploy-status.txt' -exec rm -rf {} +
    find "$REPO_DIR/dist/" -mindepth 1 -maxdepth 1 ! -name '.well-known' ! -name 'cgi-bin' ! -name 'deploy-status.txt' \
        -exec cp -a {} "$DEST/" \;
    find "$DEST" -mindepth 1 \( -path "$DEST/.well-known" -o -path "$DEST/cgi-bin" \) -prune \
        -o -type d -exec chmod 755 {} + -o -type f -exec chmod 644 {} +
fi

echo "$REMOTE" > "$TESTIGO"
printf '%s · OK · %s\n' "$(date '+%F %T')" "${REMOTE:0:7}" > "$DEST/deploy-status.txt"
log "deploy OK → ${REMOTE:0:7}"
