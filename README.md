# lols.cl

Sitio corporativo de LOLS Ingeniería Limitada. Reemplaza el WordPress 4.9 (2018) de lols.cl.

- **Stack**: Astro, salida 100% estática. Node solo para construir; en el servidor quedan HTML/CSS/imágenes (sin PHP, sin BD, sin Passenger).
- **Revisión**: https://nuevo.lols.cl, provisorio mientras don Luis revisa (docroot `/home/lolscl/public_html/nuevo.lols.cl`; el hosting obliga a que cuelgue de `public_html`). `public/.htaccess` corta la herencia de las reglas de WordPress. `robots.txt` + meta `noindex` bloquean indexación.
- **Producción**: https://lols.cl, cuando el rediseño esté aprobado.
- **Deploy**: push a `main` → publica solo en ≤ 5 min. Detalle y configuración de cPanel en [docs/DEPLOY.md](docs/DEPLOY.md).

## Comandos

```bash
npm install
npm run dev                     # http://localhost:4321
npm run build                   # genera dist/
node scripts/extraer-wp.mjs     # re-extrae el contenido del WordPress viejo (solo mientras exista)
```

## Contenido heredado

`respaldo-wp/` es la copia del contenido del WordPress viejo (extraída 2026-09-28): 21 páginas (JSON de la API + HTML renderizado) y 95 imágenes originales. **Es la única copia fuera de WordPress: no borrar.**

Datos de contacto vigentes en el sitio viejo:
- LOLS INGENIERÍA LIMITADA
- El Mirador 112-150, Cerrillos, Santiago
- +56 652 710 609
- lols@lols.cl

Páginas: Inicio, Quiénes somos, Nuestros servicios (Construcción, Muebles, Montaje industrial, Mantención, Electricidad, Voz y datos), Proyectos terminados (8), Proyectos en construcción (7), Contacto.

## Paso a producción

Ver [docs/DEPLOY.md § Paso a producción](docs/DEPLOY.md#paso-a-producción). DNS y correo no se tocan.
