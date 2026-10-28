# Contenido de obras

Las obras del portafolio (en construcción, en proyecto y terminadas) no se escriben en el
código: cada una es un archivo `src/content/obras/<slug>.json`, con sus fotos en
`public/proyectos/<slug>/`. El sitio las lee en el build (colección `obras`, esquema en
`src/content.config.ts`; carga y orden en `src/data/proyectos.ts`). Este documento es el
contrato de esos archivos: si cambia el esquema, cambia este documento (y la copia de tipos y
servicios que tiene la Bóveda).

## Rutas y dueños

Desde la **Fase 1** del módulo «Sitio web» de la Bóveda (el sistema interno de LOLS), la Bóveda
publica las obras con un commit en `main`. Hasta entonces los archivos se editan en el repo.

| Ruta | Dueño desde la Fase 1 | Nota |
|---|---|---|
| `src/content/obras/<slug>.json` | Bóveda | Un archivo por obra publicada. Lo que se edite a mano se pierde en la próxima publicación. |
| `public/proyectos/<slug>/` de cada obra | Bóveda | Fotos de la obra. Las que sube la Bóveda se llaman `portada.<hash8>-<800\|1600>.webp`: el hash cambia con los bytes, así una foto nueva nunca queda tapada por la caché. |
| `public/proyectos/<slug>/1.jpg` de «Han confiado en nosotros» (`obrasConfianza`) | repo | Edificios del carrusel de la portada. Cuatro comparten carpeta con una obra: ver abajo. |
| `public/proyectos/*.svg` | repo | Recuadros «render/foto por recibir». |
| `src/data/referencia.ts` (`referenciasDeObra`) | repo | Imágenes referenciales que puede nombrar el campo `referencia`. |
| Todo lo demás | repo | Diseño, textos generales, ejemplos. |

Cada publicación de la Bóveda es una foto completa: trae todas las obras incluidas, y la que deja
de estarlo se borra (JSON y fotos) en el mismo commit.

**Carpetas compartidas.** «Han confiado en nosotros» (`obrasConfianza` en
`src/data/proyectos.ts`) muestra `/proyectos/<slug>/1.jpg`, y cuatro de esas carpetas son también
de una obra: `abate-molina-211`, `abate-molina-221`, `bascunan-guerrero-818` y
`enfermera-lucia-vidal-arias-6679` (y lo mismo vale para una obra futura cuyo `slug` coincida con
otro de la lista). En ellas la Bóveda **nunca borra ni reemplaza `1.jpg`**: ni
al aprobar una portada nueva (la regla «la heredada se borra en el mismo commit» no se aplica
aquí), ni cuando la obra deja de publicarse (se borran el JSON y las demás fotos). El JSON puede
dejar de nombrar ese `1.jpg`. Si falta el `1.jpg` de cualquier edificio de `obrasConfianza`,
`npm run build` falla.

**Nota para quien edite el sitio (Marcos):** las 27 obras que estaban en el arreglo `proyectos`
de `src/data/proyectos.ts` (las del currículum 2026 y las tres del sitio de 2018) pasaron tal
cual a estos JSON el 28-10-2026, con el mismo orden y el mismo HTML. La Fase 1 las importa a la
Bóveda; desde ahí se agregan y se cambian en la Bóveda. No agregar obras al código ni editar los
JSON a mano después de esa importación: la próxima publicación los reemplaza.

## Contrato del JSON

Un archivo `<slug>.json` (minúsculas, extensión `.json`) directo en `src/content/obras/`, sin
subcarpetas, en UTF-8 **sin BOM**. Objeto estricto: un campo que no esté en esta tabla hace fallar
el build, y todos los campos van siempre (con `null` si no hay dato), salvo `referencia`, que
puede ir en `null` u omitirse (es lo mismo).

| Campo | Regla |
|---|---|
| `slug` | `^[a-z0-9]+(-[a-z0-9]+)*$`, máx. 80. Igual al nombre del archivo. No puede ser `ejemplo` (la ficha de muestra) ni `<sección>-<n>` (`terminados-1`, `en-construccion-2`…: es el id de las muestras de un carrusel; `verificar-obras-reales.mjs` falla si choca). |
| `orden` | entero ≥ 0. Orden dentro de su estado (10, 20, 30…); empata el nombre y después el slug. |
| `estado` | `en-curso` \| `contratado` \| `terminado` (el sitio dice «En construcción», «En proyecto», «Terminado») |
| `nombre` | texto 1..160, obligatorio |
| `titular` | texto 1..240 o `null`. El resultado en una frase, no el nombre de la obra. |
| `tipo` | uno de `tiposObra` (`src/data/catalogo.ts`) o `null` |
| `mandante` | texto 1..160 o `null`. Nunca el nombre de una persona (don Luis, 08-10-2026). |
| `comuna` | texto 1..80, **obligatorio** (todas las obras la tienen; sin ella la tarjeta de la obra mostraría [PENDIENTE]) |
| `direccion` | texto 1..200 o `null`. **Se publica** (decisión del dueño, 28-10-2026). |
| `superficieM2` | entero ≥ 1 o `null`. El sitio lo muestra como `6.220 m²` (es-CL, `formatoSuperficie`). |
| `anio` | entero 1995..2100 o `null`: año de término |
| `inicio` | texto 1..40 o `null` (ej. «Marzo 2027») |
| `servicios` | slugs de `servicios` en `src/data/empresa.ts` (hoy `construccion`, `montaje-industrial`, `electricidad`), al menos 1, sin repetir |
| `desafio`, `solucion`, `resultado` | texto 1..1200 o `null` |
| `fotos` | lista de fotos propias; `fotos[0]` es la portada y las demás, la galería de la ficha |
| `referencia` | clave de `referenciasDeObra` (`src/data/referencia.ts`), p. ej. `rendersEjemplo/maipu-40`, `null` u omitido. Una clave solo con `fotos: []`; al aprobarse una portada propia pasa a `null` en el mismo commit. |

Cada foto: `{ "src", "alt" }` y, opcionales, `"srcset"`, `"width"`, `"height"`.
- `src`: `/proyectos/<slug>/<archivo>.(webp|avif|jpg|jpeg|png)`, sin subcarpetas.
- `alt`: describe la foto, 5..200 caracteres.
- `srcset`: `"<url> <ancho>w, …"` con URLs de la misma carpeta. El sitio lo usa con un `sizes`
  propio de cada lugar.
- `width` y `height`: enteros > 0, los dos o ninguno (los de `src`).

Los textos se recortan (trim) y **nunca** van vacíos: lo que no se sabe va en `null`, no en `""`.
Un campo en `null` no se muestra: su fila desaparece de la ficha (sin `titular` no hay título
grande; sin `tipo`, no hay fila de tipo y el pictograma es el genérico).

**Reglas cruzadas** (solo las que ya cumplen todas las obras; las hace cumplir el build):

- `terminado` exige `anio`, y `anio` va solo en obras terminadas.
- `en-curso` y `terminado` exigen portada: `fotos[0]` o `referencia`. Una obra `contratado` puede
  ir sin ninguna de las dos: muestra el recuadro «Render de … por recibir».
- `referencia` con una clave solo va con `fotos: []`.
- Toda URL de `src` y de `srcset` empieza con `/proyectos/<slug>/` y el archivo existe en `public/`.
- `slug` es igual al nombre del archivo; con eso, dos archivos no pueden tener el mismo `slug`.

```json
{
  "slug": "bodegas-ejemplo-norte",
  "orden": 10,
  "estado": "en-curso",
  "nombre": "Bodegas Ejemplo Norte",
  "titular": "Frase de ejemplo con el resultado de la obra.",
  "tipo": "Centro de bodegas",
  "mandante": null,
  "comuna": "Comuna de ejemplo",
  "direccion": "Calle Ejemplo 123",
  "superficieM2": 6800,
  "anio": null,
  "inicio": null,
  "servicios": ["construccion"],
  "desafio": null,
  "solucion": null,
  "resultado": null,
  "fotos": [
    {
      "src": "/proyectos/bodegas-ejemplo-norte/portada.0a1b2c3d-1600.webp",
      "alt": "Render de la nave central vista desde el acceso",
      "srcset": "/proyectos/bodegas-ejemplo-norte/portada.0a1b2c3d-800.webp 800w, /proyectos/bodegas-ejemplo-norte/portada.0a1b2c3d-1600.webp 1600w",
      "width": 1600,
      "height": 900
    }
  ]
}
```

(Datos inventados, solo para mostrar la forma.)

**Diferencia con el plan de la Fase 1:** el plan preveía también `rol`, `plazo`, `cifra` y
`video`. Hoy la ficha no muestra ninguno, así que el esquema no los acepta (un campo que se
publica y no se ve sería un dato perdido sin aviso). Se agregan al esquema, a la ficha y a este
documento cuando se decida mostrarlos; mientras tanto, la Bóveda no los escribe. Igual con
`titular` y `tipo`: el plan los quería obligatorios, pero las tres obras de 2018 no los tienen.

## Lo que nunca va en el JSON ni en las fotos

El repo es **público** y su historial es permanente: lo que entra no se puede sacar.

- Nada interno: ids de la Bóveda, usuarios, correos, quién aprobó, fechas de auditoría, costos,
  valores de las obras, nombres del equipo ni rutas del servidor.
- **Nadie reconocible en las fotos**: ni caras, ni nombres en cascos o chalecos, ni patentes.
- Fotos sin metadatos (EXIF, XMP, IPTC: pueden traer la ubicación GPS y el equipo).

## Qué hace fallar la publicación

El sitio anterior sigue arriba en todos estos casos (el deploy solo corre si todo pasa):

- JSON roto, campo desconocido, valor fuera de regla o de catálogo (`tipo`, `servicios`,
  `referencia`), `""` en vez de `null`, regla cruzada sin cumplir: esquema, en `npm run build`;
- `slug` distinto del nombre del archivo, una foto que no existe en `public/` o un `1.jpg` de
  `obrasConfianza` que falta: `src/data/proyectos.ts`, en `npm run build`;
- algo que no sea `<slug>.json` o `.gitkeep` en `src/content/obras/` (una subcarpeta, un
  `.JSON`), o un marcador de propuesta (`data-pendiente`, clases `pendiente`/`revisar`/`ejemplo`,
  `[PENDIENTE:`, `[REVISAR:`) en el marcado de una obra: portada, miga y ficha de su página, su
  `<title>`, su panel de ficha en los carruseles y sus tarjetas, ítems y filas en los listados.
  Lo revisa `scripts/verificar-obras-reales.mjs`, paso obligatorio del workflow. La etiqueta de
  imagen referencial se acepta solo en una obra con `referencia`. Los casos que ya existían y se
  aceptan a sabiendas van en `CONOCIDOS` del script (hoy ninguno). Un marcador en el resto de
  la página (notas de sección, Contacto, Pie) lo ataja solo el build de producción
  (`SITE=https://lols.cl`).

Para probar en local: `npm run build && node scripts/verificar-obras-reales.mjs`. Archivos de
prueba en `src/content/obras/` o `public/proyectos/`: **no commitearlos**.

## Procedencia de las obras actuales

Notas que estaban como comentarios en `src/data/proyectos.ts` (un JSON no admite comentarios):

- **Currículum empresarial de LOLS 2026** («Resumen de obras ejecutadas, en ejecución y en
  proyecto 2018–2026», 42 obras): dirección, pisos, m² construidos, usos y fecha de entrega. El
  `titular` es «usos, pisos y subterráneos» del currículum. Fotos y renders del mismo documento;
  donde no hay, imagen referencial (`referencia`) hasta tener la real (Marcos, 08-10-2026). No se
  publican los valores de cada obra ni los nombres del equipo.
- **En construcción:** primero las que tienen render en el currículum (la portada muestra las tres
  primeras). El render de Bascuñán Guerrero 661 dice «Bascuñán Guerrero / Sazie»: confirmar que es
  esta obra.
- **Terminadas:** las de 2026 todas (don Luis: «de aquí en adelante, todas») y, de los años
  anteriores, una por año (la más grande con foto). Sin obras en el currículum: 2021, 2023 y 2024.
- **Sitio de 2018** (`respaldo-wp/`): Av. España 778 (2014, foto `b_cam_esp`), Abate Molina 469
  (2016, `eiffel_am`) y Esperanza 27 (2017, `ventura_esp`), de 480 × 360 px. Una por año (don
  Luis, 08-10-2026: «las de años anteriores, solo una por año»): propuesta, la elección final es
  de don Luis. Sin el propietario cuando es una persona.
- **A confirmar:** Toesca 2770 y 2774 (en la Bóveda figura «Toesca 2074») y Unión Americana 325
  (en la Bóveda, «Unión Latinoamericana 325»).
