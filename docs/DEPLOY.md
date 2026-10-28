# Deploy de lols.cl

Independiente de Bóveda: repo, rama, clone, cron y log propios. Mismo mecanismo pull-side
(el FTP de cPanel bloquea las IPs de GitHub Actions, así que el servidor es quien baja).

```
push a main → GitHub Actions: npm run build → verificar-obras-reales → dist/build.txt → rama `deploy`
cron cPanel cada 5 min → script fijado (~/bin) → git fetch → filtro de ejecutables → rsync dist/ → docroot
```

El servidor ejecuta una **copia fijada** del script, fuera del clon, que solo se cambia a mano.
Así, quien pueda escribir en `main` (personas o la Bóveda con su token) puede cambiar lo que
se ve en el sitio, pero no ejecutar código en el servidor: el script no viene del repo y el
filtro no deja pasar PHP, CGI, `.htaccess` ni symlinks que no estén aprobados.

| Cosa | Valor |
|---|---|
| Repo (público, el clone no usa token) | `https://github.com/Mauricio-Alvarez-T/lols.cl.git` |
| Rama de build | `deploy` |
| Clone en servidor | `/home/lolscl/deploy-lols.cl` |
| Docroot (revisión) | `/home/lolscl/public_html/nuevo.lols.cl` → https://nuevo.lols.cl |
| Script que corre | `/home/lolscl/bin/cpanel-deploy-lols.sh` (copia fijada; referencia: `scripts/cpanel-deploy.sh`) |
| Log | `/home/lolscl/deploy-lols.cl.log` |
| Estado público | https://nuevo.lols.cl/deploy-status.txt (`<fecha> · OK · <sha>` o `<fecha> · FALLO · filtro · <sha>`) |
| Build en línea | https://nuevo.lols.cl/build.txt (SHA completo del commit de `main` compilado) |

## Configuración en cPanel (una vez)

El hosting no tiene Terminal ni Git Version Control: todo por **Cron Jobs** + **File Manager**.

### 1. Clonar (cron temporal)

Cron Jobs → Add New Cron Job → "Once Per Minute" (`* * * * *`) → Command:

```
GIT_TERMINAL_PROMPT=0 sh -c 'test -d /home/lolscl/deploy-lols.cl/.git || git clone --branch deploy https://github.com/Mauricio-Alvarez-T/lols.cl.git /home/lolscl/deploy-lols.cl' >> /home/lolscl/deploy-lols.cl-bootstrap.log 2>&1
```

Esperar 2 min. En File Manager debe existir `/home/lolscl/deploy-lols.cl/dist/index.html`.
Luego **borrar este cron**.

### 2. Script fijado (una vez, y cada vez que cambie el script)

1. File Manager → `/home/lolscl/` → crear la carpeta `bin` (si no existe).
2. Subir `scripts/cpanel-deploy.sh` desde una copia local del repo **ya revisada** (la de `main`
   después del merge) y renombrarlo a `cpanel-deploy-lols.sh`. Queda en
   `/home/lolscl/bin/cpanel-deploy-lols.sh`. No necesita permiso de ejecución (lo corre `/bin/bash`).
3. Comprobar que llegó igual: en local, `sha256sum scripts/cpanel-deploy.sh`; en el servidor,
   un cron temporal "Once Per Minute" con
   `sha256sum /home/lolscl/bin/cpanel-deploy-lols.sh > /home/lolscl/bin/cpanel-deploy-lols.sha256`;
   abrir ese archivo en File Manager, comparar y **borrar el cron**.

Nunca se copia el script desde el clon con un cron (`git checkout`, `git show`, `cp`): eso
vuelve a dejar que el repo decida qué se ejecuta en el servidor.

### 3. Cron de deploy (permanente)

Cron Jobs → Add New Cron Job → "Every 5 Minutes" (`*/5 * * * *`) → Command:

```
HOME=/home/lolscl GIT_TERMINAL_PROMPT=0 /bin/bash /home/lolscl/bin/cpanel-deploy-lols.sh >> /home/lolscl/deploy-lols.cl.log 2>&1
```

**Cambio del 28-oct-2026:** este cron **reemplaza** al anterior, que empezaba con
`cd /home/lolscl/deploy-lols.cl && git fetch … && git checkout -q -f origin/deploy -- scripts/cpanel-deploy.sh`
y ejecutaba el script del clon. Editar ese cron y dejar solo la línea de arriba (el script ya
hace el `git fetch` por su cuenta). Hacerlo **después** del paso 2.

### 4. Verificar

- https://nuevo.lols.cl/deploy-status.txt → `<fecha> · OK · <sha>`, con el sha del último build.
- https://nuevo.lols.cl/build.txt → el SHA del último commit de `main` que pasó el build.
- Log: File Manager → `/home/lolscl/deploy-lols.cl.log` → última línea `deploy OK` o `sin cambios`.

## Filtro de ejecutables

Antes de copiar, el script revisa `dist/` y **aborta** (no toca el docroot: sigue el sitio
anterior) si encuentra:

- `dist/` **mismo como symlink** (a otra carpeta del clon, a `../` o a una ruta absoluta): la
  revisión y la copia mirarían lo que hay del otro lado;
- una **ruta con caracteres fuera de** `A-Z a-z 0-9 . _ / -` (espacios, tildes, saltos de
  línea);
- cualquier **symlink** (un enlace a un archivo del servidor lo dejaría legible desde la web);
- algo en **`cgi-bin/` o `.well-known/`** de la raíz: son del servidor y el deploy no los toca
  (cPanel corre como CGI todo lo de `<docroot>/cgi-bin/`, aunque termine en `.jpg`);
- un archivo cuyo par `<sha256>  <ruta>` no esté en la lista `PERMITIDOS` del script, si
  (en cualquier carpeta y sin distinguir mayúsculas):
  - se llama `.htaccess`, `.user.ini` o `php.ini`;
  - **alguna** de sus extensiones, no solo la última, es de un handler de Apache: `php*`,
    `pht*`, `phar*`, `cgi`, `fcgi`, `pl`, `plx`, `ppl`, `perl`, `pm`, `py`, `pyc`, `pyo`,
    `sh`, `bash`, `shtml`, `shtm`, `stm`, `asis`, `var` (Apache aplica el handler de
    cualquiera: `x.php.webp` corre como PHP y `x.cgi.jpg` como CGI);
  - la última extensión no es de archivo estático (`ESTATICOS`: html, css, js, mjs, json, txt,
    xml, svg, ico, webp, avif, jpg, jpeg, png, gif, woff, woff2, webmanifest, mp4, webm, pdf),
    o no tiene extensión. Un tipo nuevo (una fuente `.ttf`, por ejemplo) se agrega a
    `ESTATICOS` en las dos copias del script, como en los pasos de abajo.

Además copia sin bits de ejecución (archivos 644, carpetas 755): suexec no corre un CGI sin `+x`.

Hoy la lista tiene `.htaccess` (de `public/.htaccess`) y los tres PHP del formulario:
`api/contacto.php`, `api/postulacion.php` y `api/lib/formulario.php` (de `public/api/`). Al
abortar escribe
`<fecha> · FALLO · filtro · <sha>` en `deploy-status.txt`, deja en el log una línea `FILTRO:`
por cada archivo, y no actualiza el testigo: cada 5 min lo vuelve a intentar hasta que se
corrija el build o la lista.

**Cuando cambia `public/.htaccess` o un PHP de `public/api/`, o se agrega uno nuevo** (el deploy
quedará en `FALLO · filtro` hasta hacer esto):

1. Revisar el cambio (es código que corre en el servidor).
2. En local, con el commit ya en `main`, el hash de cada archivo que cambió:

   ```
   git fetch origin
   for f in .htaccess api/contacto.php api/postulacion.php api/lib/formulario.php; do
     echo "$(git show origin/main:public/$f | sha256sum | cut -d' ' -f1)  $f"
   done
   ```

   Se usa `git show` para tomar los bytes del repo (LF), que son los que salen del build en
   GitHub Actions, y no los de una copia de trabajo en Windows (CRLF, otro hash). Un PHP nuevo
   se agrega al `for` con su ruta relativa a `dist/`.
3. File Manager → editar `/home/lolscl/bin/cpanel-deploy-lols.sh` → en `PERMITIDOS` agregar
   la línea `<hash>  <ruta>` (dos espacios). La lista admite varias líneas por ruta: se puede
   agregar la nueva antes del push y borrar la vieja después.
4. Hacer el mismo cambio en `scripts/cpanel-deploy.sh` del repo, para que la referencia no se
   desfase de la copia.

Para probar el filtro en local sin git ni docroot: `bash scripts/cpanel-deploy.sh --filtrar <carpeta>`.
Con el `dist/` de un build local en Windows los PHP salen con CRLF y el filtro los rechaza (hash
distinto): probarlo con la rama `deploy` bajada con LF
(`git -c core.autocrlf=input -c core.eol=lf archive origin/deploy dist | tar -x -C /tmp/x`).

## Problemas conocidos

| Síntoma en el log | Causa | Arreglo |
|---|---|---|
| `bad interpreter: /bin/bash^M` | script con CRLF | `.gitattributes` fuerza LF; re-clonar |
| `git: command not found` | PATH mínimo del cron | anteponer `PATH=/usr/local/bin:/usr/bin:/bin:$PATH` al comando |
| `otro deploy en curso (lock)` repetido > 30 min | lock huérfano | se libera solo a los 30 min |
| `ABORTO: DEST=... es public_html` | intento de deploy directo a public_html | ver § Paso a producción |
| `FILTRO: …` + `ABORTO: dist/ trae rutas, symlinks o archivos no permitidos`; `deploy-status.txt` en `FALLO · filtro` | dist/ trae un ejecutable nuevo o cambiado, un tipo de archivo que no está en `ESTATICOS`, un nombre con caracteres raros o un symlink | ver § Filtro de ejecutables; si no se esperaba, revisar el último commit de `main` |
| el sitio no cambia tras editar `scripts/cpanel-deploy.sh` | el servidor corre la copia fijada | ver § Script fijado |

## Paso a producción

El script **se niega** a desplegar en `public_html`: ahí viven los docroots de otros sitios
(`boveda.lols.cl`, `test.boveda.lols.cl`, `nuevo.lols.cl`, …) y el `--delete` los borraría.
Plan de corte (se detalla cuando don Luis apruebe):

1. Respaldo completo de cPanel (home + BD de WordPress), descargado y verificado.
2. `astro.config.mjs`: `site` → `https://lols.cl`; `public/robots.txt` → permitir indexar.
3. Estrategia para `public_html`: lista explícita de lo que se borra (archivos de WordPress) y
   exclusión de todas las carpetas de docroots (revisar cPanel → Dominios).
   `DEST` (y esa estrategia) se cambia en `scripts/cpanel-deploy.sh` **y** en la copia fijada
   `/home/lolscl/bin/cpanel-deploy-lols.sh`, que es la que corre: repetir § Script fijado
   (subirla y comparar el sha256).
4. Redirecciones 301 para URLs viejas que cambien.
5. Borrar la BD y el usuario MySQL de WordPress.

## Formulario de contacto (PHP)

`public/api/contacto.php` recibe el formulario de cotización de `/cotizar/` y
`public/api/postulacion.php` las postulaciones de `/trabaja-con-nosotros/` (cargos y preguntas
en `/api/cargos.json`, que se genera desde `src/data/postulaciones.ts`). Los dos envían un
correo con `mail()` del servidor, con los archivos adjuntos (hasta 2, de 5 MB); lo común está
en `public/api/lib/formulario.php`. No guardan datos personales (Ley 21.719); para el límite de
5 envíos por hora guardan un hash de la IP que se descarta a la hora.

**Configuración (una vez, en File Manager).** Vive fuera del repo (que es público) y fuera
del docroot:

1. Crear la carpeta `/home/lolscl/lols-contacto/`.
2. Dentro, crear `config.ini`:

   ```ini
   destinatario = "lols@lols.cl, contacto@lols.cl"
   destinatario_cv = "lols@lols.cl"
   remitente = "no-responder@lols.cl"
   ```

   - `destinatario`: correos que reciben las cotizaciones (uno o varios, separados por coma).
     Don Luis pidió lols@lols.cl y contacto@lols.cl. Durante la revisión, conviene un correo
     propio para probar.
   - `destinatario_cv`: correos que reciben las postulaciones. Opcional: si falta, van a
     `destinatario`. Don Luis pidió lols@lols.cl, hasta que se cree un correo para los CV.
   - `remitente`: una dirección del dominio lols.cl (así el correo pasa SPF). No hace falta
     que el buzón exista, pero conviene que exista para ver rebotes.

Sin `config.ini` el formulario responde "aún no está habilitado" y no envía nada.

**Verificar:** `curl -s https://nuevo.lols.cl/api/contacto.php` (y `postulacion.php`) →
`{"ok":false,"error":"metodo"}`
(PHP corre). Si responde el código fuente del PHP o un 404, el handler de PHP no está activo.
