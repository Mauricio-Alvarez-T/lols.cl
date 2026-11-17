# Editor visual: contrato entre el sitio y la Bóveda

La Bóveda (app interna de LOLS) muestra este sitio **real** dentro de un `<iframe>` y deja editar las obras ahí
mismo: se toca un título y se escribe, se cambia una foto, se ordenan las tarjetas. Lo que se edita es un
**borrador** de la Bóveda; el sitio no cambia hasta que alguien pulsa «Publicar cambios» y la Bóveda sube los JSON de
`src/content/obras/` (ver `docs/contenido-obras.md`).

Para que eso funcione, el sitio aporta dos cosas, y este documento es su contrato:

1. **Marcas `data-ed-*` en el HTML**, que dicen qué parte de la página es qué campo de qué obra. Se emiten siempre
   (los visitantes no las ven ni las usan).
2. **El puente** (`src/scripts/editor/puente.ts`): un script que se carga **solo** si la página está dentro de un
   iframe **y** la URL trae `?editor`. Habla con la Bóveda por `postMessage` y aplica el borrador a la página.

> Si cambias el marcado de `CarruselObras`, `FichaObra`, `TarjetaProyecto`, `TarjetaContratada` o las listas de
> `index.astro` / `proyectos/index.astro`, **mantén las marcas**. `scripts/verificar-editor.mjs` (en el deploy) falla
> si una obra real queda sin ellas.

## 1. Marcas

| Atributo | Dónde | Valor |
|---|---|---|
| `data-ed-lista` | contenedor de una lista de obras | nombre de la regla (§2) |
| `data-ed-vista` | el mismo contenedor | `carrusel` · `contratada` · `tarjeta` |
| `data-ed-item` | **cada** parte que pertenece a una obra: el texto del carrusel (`article.texto`), su foto (`li.foto`), la ficha (`.ficha-obra`), la tarjeta (`article.tarjeta`, el `li` de «En proyecto»), la portada de `/proyectos/<slug>/` | `obras/<slug>` |
| `data-ed-campo` | elemento cuyo `textContent` es **exactamente** el valor de un campo de texto | puntero JSON: `/nombre`, `/titular`, `/comuna`, `/direccion`, `/inicio`, `/desafio`, `/solucion`, `/resultado` |
| `data-ed-derivado` | elemento que muestra un campo **formateado** (no se escribe en el lugar; se cambia en el panel de la Bóveda) | `/superficieM2` («6.220 m²»), `/tipo`, `/estado`, `/anio`, `/servicios`, `/mandante`, y `/inicio` en la lista «En proyecto» («Inicio previsto: Marzo 2027» / «En etapa de proyecto»; en la ficha, inicio es un campo) |
| `data-ed-picto` | el `<svg>` del pictograma del tipo de obra | `/tipo` |
| `data-ed-foto` | el `.marco` de la foto principal (carrusel, tarjetas, portada de la página de la obra) | `/fotos/0` |
| `data-ed-fila` | cada fila del recuadro de datos de la ficha y cada paso del relato | `tipo`, `mandante`, `comuna`, `direccion`, `superficie`, `anio`, `inicio`, `servicios`, `estado`, `desafio`, `solucion`, `resultado` |
| `data-ed-linea` | línea compuesta de varios campos, que es **un solo texto** y el puente rearma entera con el formateador del build (`src/data/vistaObra.ts`) | `resumen` (carrusel: «Comuna · 6.220 m² · 2024», `lineaResumen`) · `contratada` («En proyecto»: «Tipo · Comuna · 6.220 m²», `lineaContratada`) |
| `data-ed-parte` | (reservado, hoy sin uso) trozo opcional de una línea con su separador. El puente lo sabe ocultar y clonar del molde, pero las líneas actuales usan `data-ed-linea`: partir el texto en `<span>` cambia en Chrome el dibujo de algunos glifos (subpíxeles), y el sitio no debe verse distinto por las marcas | nombre del campo |
| `data-ed-cuenta` | el número de obras de un estado (índice de `/proyectos/`) | `en-curso` · `contratado` · `terminado` |

Reglas:
- Un mismo campo puede aparecer varias veces en la página (carrusel, ficha, tarjeta): el puente los actualiza todos.
- Las marcas no cambian lo que se ve: ningún estilo depende de ellas.
- «Han confiado en nosotros» y las muestras (`ejemplo`) **no** llevan `data-ed-item` (no son obras de la Bóveda).
- La comuna y la superficie del carrusel y de «En proyecto» están dentro de su línea (`data-ed-linea`): se escriben
  en la ficha o en el panel, no en esa línea.
- El titular de la ficha no tiene fila: el elemento con `data-ed-campo="/titular"` es lo que se oculta o se clona.
- Atributos que pone **solo el puente** (no van en el HTML del build): `data-ed-vacio` (fila o campo vacío:
  oculto para el visitante, con hueco «+ Dirección» en modo editar), `data-ed-hueco` (texto de ese hueco),
  `data-ed-quitada` (obra oculta por el borrador) y `data-ed-dibujo` (pictograma redibujado).
- `scripts/huella-dist.mjs` compara dos builds sin las marcas: sirve para comprobar que un cambio en estos
  componentes no cambia lo que ve el visitante.

## 2. Listas (`src/data/selecciones.ts`)

Cada lista editable tiene una regla con nombre que dice qué obras muestra y en qué orden; la usan la página (al
compilar) y el puente (para saber dónde poner una obra nueva o que cambió de estado).

| Regla | Página | Vista | Obras |
|---|---|---|---|
| `portada-en-obra` | `/` | carrusel | las 3 primeras `en-curso` |
| `portada-proximos` | `/` | carrusel | todas las `contratado` |
| `proyectos-en-curso` | `/proyectos/` | carrusel | todas las `en-curso` |
| `proyectos-contratados` | `/proyectos/` | contratada | todas las `contratado` |
| `proyectos-terminados` | `/proyectos/` | carrusel | `terminado`, por año (más nueva primero), en el mismo año primero las con foto propia |

El orden base es el de `src/data/proyectos.ts`: estado, `orden`, nombre (es) y slug.

## 3. Moldes (`/editor/moldes/`)

Cada vista va en un contenedor `data-ed-molde`: `carrusel` (un `CarruselObras` con la obra terminada: texto,
foto y ficha), `ficha-1` y `ficha-3` (`FichaObra` de la página y del panel del carrusel, una terminada y una en
construcción: entre las dos tienen todas las filas, también año e inicio), `contratada` (`TarjetaContratada`) y
`tarjeta` (`TarjetaProyecto`). La obra de muestra tiene dos fotos (la segunda arma la galería, para que el relato
clonado quede antes de ella). Usa el layout del sitio (`Base`, con `interna`: `noindex` también en producción) para
que agregarla no cambie cómo se agrupan los estilos de las demás páginas.

Página interna (`noindex`, `Disallow` en `robots.txt`) que dibuja cada vista una vez con una obra de muestra
**completa** (slug reservado `molde`: todos los campos llenos). El puente la lee con `fetch` + `DOMParser` (documento
inerte: no corre scripts) y clona de ahí lo que falta: una fila de datos que la obra no tenía, el titular, una
tarjeta o una diapositiva nueva. Nunca construye HTML desde lo que llega por mensaje.

## 4. Protocolo de mensajes (versión 1)

Todo mensaje es un objeto `{ p: 'lols-editor', v: 1, tipo, ... }`. Se ignora cualquier otro.

### Saludo
1. El puente, al cargar, envía `hola` a `window.parent` con `postMessage(msg, origen)` **una vez por cada origen
   permitido** (el navegador descarta la copia cuyo origen no es el del padre):
   - `https://boveda.lols.cl`, `https://test.boveda.lols.cl`;
   - y solo si el sitio mismo corre en `localhost`/`127.0.0.1` (desarrollo): `http://localhost:<cualquier puerto>`.
     Como `postMessage` necesita el origen exacto, en desarrollo el `hola` va al origen del padre que dan
     `location.ancestorOrigins[0]` o `document.referrer`, si es `http://localhost:<puerto>`.

   ```ts
   { tipo: 'hola', ruta: '/proyectos/', build: 'b22d9a5…' | null,
     listas: [{ regla: 'proyectos-en-curso', vista: 'carrusel', items: ['maipu-40', …] }, …],
     limites: { nombre: 160, titular: 240, … } }
   ```
2. La Bóveda lo acepta solo si `e.origin` es el origen del sitio y `e.source === iframe.contentWindow`. Responde con
   `iniciar` y le pasa un puerto de un `MessageChannel`:
   `iframe.contentWindow.postMessage({ p, v: 1, tipo: 'iniciar', modo: 'editar' }, origenSitio, [canal.port2])`.
3. El puente acepta **el primer** `iniciar` cuyo `e.origin` esté en la lista, con `e.source === window.parent` y un
   puerto. Desde ahí habla **solo** por ese puerto y deja de escuchar `window`.
4. Si la Bóveda no recibe `hola` en 4 s, muestra «Esta página no se puede editar».

### Bóveda → puente
| tipo | datos | qué hace el puente |
|---|---|---|
| `borrador` | `obras: [{ json: <obra con la forma de src/content/obras/*.json>, meta: { incluir: boolean, nueva: boolean } }]` | reemplaza el estado completo: rellena cada `data-ed-item` con su JSON (texto y derivados con los formateadores del sitio), agrega lo que falta desde los moldes, oculta lo que ya no corresponde (A2: obras nuevas, quitadas, cambio de estado, orden) y dispara `lols:refrescar` en los carruseles |
| `campo` | `item: 'obras/<slug>'`, `campo: '/nombre'`, `valor` | actualiza ese campo en todas sus apariciones |
| `modo` | `modo: 'editar' \| 'mirar'` | `mirar` = como visitante: sin contornos ni huecos «+ campo» |
| `mostrar` | `item` | lleva esa obra a la vista (carrusel `lols:ir`) |
| `foto` | `item`, `bytes: ArrayBuffer` (transferido) | revisa la firma WEBP/JPEG y ≤5 MB, crea el `blob:` en el origen del sitio y lo pone en `data-ed-foto` (sin `srcset` ni `sizes`, y oculta la etiqueta «Imagen referencial»); revoca el `blob:` anterior de esa obra |

### Puente → Bóveda
| tipo | datos | cuándo |
|---|---|---|
| `hola` | ver arriba | al cargar |
| `seleccion` | `item`, `campo \| null` | al entrar a un campo (clic o Tab) o tocar una obra: `campo` es el puntero del campo o derivado tocado, `/fotos/0` para la foto y `null` para el resto de la tarjeta |
| `cambio` | `item`, `campo`, `valor` | al escribir en el lugar (150 ms después de la última tecla: `valor` tal cual; al salir del campo: recortado, o `null` si quedó vacío) |
| `navegar` | `ruta` (`pathname` + `#hash`) | al tocar un enlace interno a otra página: el puente lo frena y la Bóveda recarga el iframe en esa ruta (con `?editor`). Un `#` de la misma página sigue normal; un enlace externo no se abre en el iframe |
| `atajo` | `accion: 'deshacer' \| 'rehacer' \| 'guardar'` | Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y, Ctrl/Cmd+S dentro del iframe |

Detalles de la versión 1 (etapa A0):
- `borrador`: un campo con tipo o largo inválido se descarta (no se muestra) y el resto se aplica; un mensaje mal
  formado entero se ignora. Las fotos no se toman del borrador (solo del mensaje `foto`). Una obra que está en la
  página y no viene en el borrador se oculta como `incluir: false`. Pendiente para A2: obras nuevas
  (`meta.nueva`), cambio de lista por estado y orden (`TODO(A2)` en `src/scripts/editor/aplicar.ts`).
- El puente no copia lo escrito a las otras apariciones del mismo campo: lo hace al llegar el `campo` o
  `borrador` de vuelta (así la Bóveda sigue siendo la fuente). El campo que se está escribiendo no se toca.
- `mostrar` despacha `lols:ir` (`detail: { slug, ficha: true }`) en el carrusel que tiene la obra; si no está en
  un carrusel, la lleva a la vista.
- `src/scripts/carrusel.ts` atiende `lols:refrescar` (se rearma con las diapositivas cuyo texto no está `hidden`)
  y `lols:ir`. El puente dispara `lols:refrescar` después de cada `borrador` o `campo`.
- Las cuentas del índice de `/proyectos/` (`data-ed-cuenta`) pasan a ser las del borrador.
- En modo `mirar` los enlaces internos igual se frenan con `navegar` (el iframe no puede perder `?editor`).

Un `cambio` es solo una **propuesta**: la Bóveda la valida (campo permitido, largo, obra existente) antes de tocar el
borrador, y nada se guarda hasta «Guardar».

## 5. Seguridad del puente
- Se carga solo enmarcado y con `?editor`; los visitantes descargan una línea.
- Texto siempre con `textContent`. Prohibidos en `src/scripts/editor/**`: `innerHTML`, `outerHTML`,
  `insertAdjacentHTML`, `document.write`, `eval`, `new Function` (`verificar-editor.mjs` lo revisa).
- Los clones salen del documento inerte de `/editor/moldes/` (del propio sitio), nunca de un mensaje.
- Edición de texto con `contenteditable="plaintext-only"`: sin Enter (cada texto es un párrafo), pegar entra como
  texto plano, largo máximo según `limites`.
- En modo editor, `despliegue.ts` usa `replaceState` (no ensucia el «Atrás» de la Bóveda).
- Atajos dentro del iframe: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z o Ctrl/Cmd+Y y Ctrl/Cmd+S van a la Bóveda (`atajo`);
  escribiendo, Enter no hace nada, Esc sale del campo (sin cerrar la ficha) y las teclas no llegan al sitio
  (flechas del carrusel). Sin `plaintext-only` (navegadores viejos) se usa `contenteditable="true"` y pegar se
  hace a mano como texto plano; también se bloquean negrita/cursiva y soltar archivos.
- Los estilos del editor (contornos, huecos) los inyecta el puente; el visitante no los descarga.
- El `hola` lleva `build: import.meta.env.PUBLIC_BUILD_SHA` (el deploy lo pasa al build) o `null`.

## 6. Comprobaciones

- `scripts/verificar-editor.mjs` (deploy, después del build): cada obra real con su `data-ed-item` y su `/nombre`
  en `/proyectos/`, la página de moldes con cada vista y sin marcadores, y el puente sin las APIs prohibidas.
- `npx vitest run` (`tests/editor.test.ts`, deploy, después del build): aplica borradores al HTML de `dist/`
  (cambios, filas que aparecen desde el molde, filas que se ocultan, `incluir: false`) y revisa el protocolo.
