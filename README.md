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

## Contenido y marca

- Especificación: [docs/brief.md](docs/brief.md) (colores, tipografías, estructura, requisitos, preguntas para don Luis). Logos originales en `docs/marca/`.
- Datos de empresa y servicios: `src/data/empresa.ts`. Tokens de color: `src/styles/global.css`.
- **No se inventa contenido.** Lo que falta va con `<Pendiente texto="…" />` y lo que está sin confirmar con `<Pendiente revisar="…">dato</Pendiente>`; ambos se ven destacados en amarillo. **El build para `lols.cl` falla mientras quede alguno**, así que no se puede lanzar con huecos.
- **Imágenes referenciales** (`src/data/referencia.ts`, componente `<Referencial>`): fotos de Unsplash en las bandas grandes y obras LOLS de 2018 recortadas (`public/referencia/`) en tarjetas, todas con etiqueta visible. También bloquean el build de producción: hay que reemplazarlas por fotos propias.

## Formulario de contacto

`src/components/FormularioContacto.astro` → `public/api/contacto.php` (PHP en el mismo hosting, `mail()`). El destinatario se configura en el servidor, fuera del repo: ver [docs/DEPLOY.md § Formulario de contacto](docs/DEPLOY.md#formulario-de-contacto-php).

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
