# Deploy de lols.cl

Independiente de Bóveda: repo, rama, clone, cron y log propios. Mismo mecanismo pull-side
(el FTP de cPanel bloquea las IPs de GitHub Actions, así que el servidor es quien baja).

```
push a main → GitHub Actions: npm run build → rama `deploy` (dist/ + scripts/)
cron cPanel cada 5 min → git fetch → rsync dist/ → docroot
```

| Cosa | Valor |
|---|---|
| Repo (público, el clone no usa token) | `https://github.com/Mauricio-Alvarez-T/lols.cl.git` |
| Rama de build | `deploy` |
| Clone en servidor | `/home/lolscl/deploy-lols.cl` |
| Docroot (revisión) | `/home/lolscl/public_html/nuevo.lols.cl` → https://nuevo.lols.cl |
| Script | `scripts/cpanel-deploy.sh` |
| Log | `/home/lolscl/deploy-lols.cl.log` |
| Estado público | https://nuevo.lols.cl/deploy-status.txt |

## Configuración en cPanel (una vez)

El hosting no tiene Terminal ni Git Version Control: todo por **Cron Jobs** + **File Manager**.

### 1. Clonar (cron temporal)

Cron Jobs → Add New Cron Job → "Once Per Minute" (`* * * * *`) → Command:

```
GIT_TERMINAL_PROMPT=0 sh -c 'test -d /home/lolscl/deploy-lols.cl/.git || git clone --branch deploy https://github.com/Mauricio-Alvarez-T/lols.cl.git /home/lolscl/deploy-lols.cl' >> /home/lolscl/deploy-lols.cl-bootstrap.log 2>&1
```

Esperar 2 min. En File Manager debe existir `/home/lolscl/deploy-lols.cl/dist/index.html`.
Luego **borrar este cron**.

### 2. Cron de deploy (permanente)

Cron Jobs → Add New Cron Job → "Every 5 Minutes" (`*/5 * * * *`) → Command:

```
cd /home/lolscl/deploy-lols.cl && git fetch -q origin deploy && git checkout -q -f origin/deploy -- scripts/cpanel-deploy.sh 2>/dev/null; HOME=/home/lolscl GIT_TERMINAL_PROMPT=0 /bin/bash /home/lolscl/deploy-lols.cl/scripts/cpanel-deploy.sh >> /home/lolscl/deploy-lols.cl.log 2>&1
```

El preámbulo (`git checkout … -- scripts/cpanel-deploy.sh`) carga la versión nueva del script
antes de ejecutarlo; sin él, el primer deploy tras editar el script corre la versión anterior.

### 3. Verificar

- https://nuevo.lols.cl/deploy-status.txt → `<fecha> · OK · <sha>`, con el sha del último build.
- Log: File Manager → `/home/lolscl/deploy-lols.cl.log` → última línea `deploy OK` o `sin cambios`.

## Problemas conocidos

| Síntoma en el log | Causa | Arreglo |
|---|---|---|
| `bad interpreter: /bin/bash^M` | script con CRLF | `.gitattributes` fuerza LF; re-clonar |
| `git: command not found` | PATH mínimo del cron | anteponer `PATH=/usr/local/bin:/usr/bin:/bin:$PATH` al comando |
| `otro deploy en curso (lock)` repetido > 30 min | lock huérfano | se libera solo a los 30 min |
| `ABORTO: DEST=... es public_html` | intento de deploy directo a public_html | ver § Paso a producción |

## Paso a producción

El script **se niega** a desplegar en `public_html`: ahí viven los docroots de otros sitios
(`boveda.lols.cl`, `test.boveda.lols.cl`, `nuevo.lols.cl`, …) y el `--delete` los borraría.
Plan de corte (se detalla cuando don Luis apruebe):

1. Respaldo completo de cPanel (home + BD de WordPress), descargado y verificado.
2. `astro.config.mjs`: `site` → `https://lols.cl`; `public/robots.txt` → permitir indexar.
3. Estrategia para `public_html`: lista explícita de lo que se borra (archivos de WordPress) y
   exclusión de todas las carpetas de docroots (revisar cPanel → Dominios).
4. Redirecciones 301 para URLs viejas que cambien.
5. Borrar la BD y el usuario MySQL de WordPress.

## Formulario de contacto (PHP)

`public/api/contacto.php` recibe el formulario de `/contacto/` y envía un correo con `mail()`
del servidor. No guarda datos personales (Ley 21.719); para el límite de 5 envíos por hora
guarda un hash de la IP que se descarta a la hora.

**Configuración (una vez, en File Manager).** Vive fuera del repo (que es público) y fuera
del docroot:

1. Crear la carpeta `/home/lolscl/lols-contacto/`.
2. Dentro, crear `config.ini`:

   ```ini
   destinatario = "correo-que-recibe@lols.cl"
   remitente = "no-responder@lols.cl"
   ```

   - `destinatario`: durante la revisión, un correo propio para probar; al lanzar, el de
     cotizaciones de la empresa.
   - `remitente`: una dirección del dominio lols.cl (así el correo pasa SPF). No hace falta
     que el buzón exista, pero conviene que exista para ver rebotes.

Sin `config.ini` el formulario responde "aún no está habilitado" y no envía nada.

**Verificar:** `curl -s https://nuevo.lols.cl/api/contacto.php` → `{"ok":false,"error":"metodo"}`
(PHP corre). Si responde el código fuente del PHP o un 404, el handler de PHP no está activo.
