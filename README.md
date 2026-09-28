# lols-web

Sitio corporativo de LOLS Ingeniería Limitada. Reemplaza el WordPress 4.9 (2018) de lols.cl.

- **Stack**: Astro, salida 100% estática. Node solo para construir; en el servidor quedan HTML/CSS/imágenes (sin PHP, sin BD, sin Passenger).
- **Staging**: https://nuevo.lols.cl (docroot `/home/lolscl/nuevo.lols.cl`, fuera de `public_html`). `robots.txt` bloquea indexación.
- **Producción**: https://lols.cl, cuando el rediseño esté aprobado.

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

## Paso a producción (checklist)

1. Respaldo completo de cPanel (directorio home + base de datos de WordPress) descargado y verificado.
2. `SITE=https://lols.cl npm run build`, reemplazar `robots.txt` por uno que permita indexar.
3. Redirecciones 301 en `.htaccess` para URLs del sitio viejo que cambien.
4. Vaciar `public_html` (sin tocar subcarpetas ajenas a WordPress) y subir `dist/`.
5. Eliminar la base de datos y el usuario MySQL de WordPress.
6. DNS y correo no se tocan.
