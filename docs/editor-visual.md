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
  `data-ed-quitada` (obra oculta por el borrador), `data-ed-dibujo` (pictograma redibujado) y, desde A2,
  `data-ed-clon` (diapositiva, ficha o tarjeta clonada del molde), `data-ed-nueva` (obra nueva sin guardar) y
  `data-ed-mini` (miniatura del modo «Ordenar»). También son solo del puente las clases `ed-*` (`ed-editar`,
  `ed-ordenando`, `ed-ui`, `ed-insignia`…).
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
  formado entero se ignora. Las fotos del borrador no cambian la foto de una obra que ya está en la página (eso
  es el mensaje `foto`); desde A2 `fotos` y `referencia` se leen solo para ordenar las terminadas (foto propia
  primero) y para la foto de lo que se clona del molde, y solo si son del propio sitio (`fotos[].src` y `srcset`
  en `/proyectos/<slug>/…`; `referencia`, una clave de `referenciasDeObra`); si no, se descartan como cualquier
  campo inválido. Un `campo` nunca trae `fotos` ni `referencia`. Una obra que está en la página y no viene en el
  borrador se oculta como `incluir: false`.
- Al escribir en el lugar, el puente copia lo escrito a las otras apariciones del mismo campo (carrusel, ficha,
  tarjeta) sin esperar a la Bóveda, que no lo devuelve como `campo`. Un `borrador` posterior manda: es el estado
  que la Bóveda aceptó. El campo que se está escribiendo nunca se toca.
- `mostrar` despacha `lols:ir` (`detail: { slug, ficha: true }`) en el carrusel que tiene la obra; si no está en
  un carrusel, la lleva a la vista.
- `src/scripts/carrusel.ts` atiende `lols:refrescar` (se rearma con las diapositivas cuyo texto no está `hidden`,
  en el orden del DOM, y sigue en la misma obra aunque haya cambiado de lugar) y `lols:ir`. El puente dispara `lols:refrescar` después de cada `borrador` o `campo`.
- Las cuentas del índice de `/proyectos/` (`data-ed-cuenta`) pasan a ser las del borrador.
- En modo `mirar` los enlaces internos igual se frenan con `navegar` (el iframe no puede perder `?editor`).

Un `cambio` es solo una **propuesta**: la Bóveda la valida (campo permitido, largo, obra existente) antes de tocar el
borrador, y nada se guarda hasta «Guardar».

### Etapa A2: estructura (sigue siendo la versión 1; solo se agregan cosas)

**El `borrador` es la verdad sobre qué obras hay, dónde y en qué orden.** Al aplicarlo, el puente rearma cada lista
de la página (`data-ed-lista`) con la regla de `src/data/selecciones.ts` sobre las obras del borrador con
`meta.incluir === true` (más las `meta.nueva`, que se muestran aunque todavía no estén incluidas, para verlas
mientras se escriben), usando `json.estado`, `json.orden`, `json.anio`, nombre y slug como en el build:
- una obra que la lista ya tiene se **reutiliza** (mismos nodos) y se mueve a su posición;
- una que falta se **clona del molde** de esa vista (`/editor/moldes/`) y se rellena con su JSON;
- una que ya no corresponde (cambió de estado, se quitó, o dejó de estar entre las 3 de la portada) se **oculta**
  (`hidden` + `data-ed-quitada`); una obra creada por el puente que ya no viene en el borrador se **elimina**;
- las diapositivas y las fichas del panel del carrusel se reordenan igual y se dispara `lols:refrescar`;
- las cuentas `data-ed-cuenta` se recalculan (cuentan también las obras nuevas que se ven).

Cómo lo hace (`rearmarListas` en `src/scripts/editor/aplicar.ts`): cada lista son uno o más carriles paralelos (el
carrusel: `.textos`, `.pista` y las `.fichas` de su panel; «En proyecto»: la `<ul>`), y en cada uno la obra ocupa un
elemento. Lo que falta se clona del molde (`carrusel` o `contratada`) con `data-ed-clon` y se rellena con el JSON
completo (lo que no trae, vacío): sin la galería del molde, con su `data-ficha`, el `aria-controls` de su panel y
la foto de `fotoPrincipal` (la del JSON o «render/foto por recibir»). Los carriles se reordenan igual (primero las
de la lista, después las ocultas). Un `campo` de `/estado`, `/orden` o `/anio` también rearma las listas.

Límite: solo se rearman las listas que **están** en la página. Si el build no dibujó una (la portada sin
contratadas no tiene «Próximos proyectos»; sin obras reales en construcción, el carrusel es de muestras y no
lleva `data-ed-lista`), una obra nueva de esa lista no se ve en esa página hasta publicar.

**Obras nuevas sin guardar:** la Bóveda les da un slug provisorio `~n1`, `~n2`… (no puede ser un slug real: el `~`
no pasa el esquema). Llevan `meta.nueva: true` y el puente les pone `data-ed-nueva` (insignia «Borrador · fuera del
sitio» en modo editar). Al guardar, la Bóveda manda un `borrador` nuevo con el slug definitivo: el puente elimina el
`~n1` y crea el definitivo. El `~` no va en ids ni en el hash: la ficha de `~n1` es `obra--n1` (un slug real nunca
lleva `--`), y su título enlaza a `#obra--n1` (no tiene página). `campo`, `mostrar` y `foto` aceptan
`obras/~n1` como `item` (`~n` y un número).

**Una obra con `meta.incluir === false`** que no es nueva no aparece en ninguna lista (la Bóveda la muestra en su
bandeja «Fuera del sitio»).

**Mensajes nuevos, puente → Bóveda:**

| tipo | datos | cuándo |
|---|---|---|
| `nueva` | `lista` (regla) | al tocar la tarjeta «+ Nueva obra» que el puente agrega al final de cada lista en modo editar. La Bóveda crea la obra provisoria con el estado de esa lista (`portada-en-obra`/`proyectos-en-curso` → `en-curso`; `portada-proximos`/`proyectos-contratados` → `contratado`; `proyectos-terminados` → `terminado`) y manda el `borrador` + `mostrar` |
| `mover` | `lista`, `item`, `indice` (posición final, 0 = primera, entre las visibles de esa lista) | al soltar una obra arrastrada dentro de su lista (grilla «En proyecto»: arrastrar la tarjeta, con pulsación larga en pantallas táctiles; carruseles: en el modo «Ordenar», ver abajo). Es una propuesta: la Bóveda recalcula `orden`, valida (las terminadas solo se ordenan dentro del mismo año) y manda el `borrador` |

**Modo «Ordenar» en los carruseles:** en modo editar el puente agrega un botón «Ordenar» en el encabezado de cada
carrusel editable; al tocarlo, el carrusel se muestra como una tira de miniaturas (clase `ed-ordenando`) que se
arrastran; «Listo» vuelve al carrusel normal. Fuera del editor no existe. En los carruseles «+ Nueva obra» es un
botón en ese mismo encabezado (junto a «Ordenar»); en la grilla «En proyecto», una tarjeta punteada al final.
Arrastrar: con el mouse, al moverlo más de 5 px; en pantallas táctiles, pulsación larga (350 ms) y después se
arrastra (la página se desplaza sola cerca del borde). Una barra verde marca dónde caería; soltar donde estaba no
envía nada. Tocar una miniatura (sin arrastrar) envía `seleccion`. Todo esto está en
`src/scripts/editor/controles.ts`; en modo `mirar` no se ve ni responde.

**Fotos de obras nuevas:** hasta que llegue un `foto`, la obra nueva muestra el recuadro «render/foto por recibir»
del molde (`fotoPrincipal`). Un `foto` ya recibido se vuelve a poner en lo que se clone después (otra lista).

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
  (cambios, filas que aparecen desde el molde, filas que se ocultan, `incluir: false`; desde A2, obras nuevas,
  cambio de estado, orden, `~n1` → slug definitivo, cuentas, «+ Nueva obra» y arrastrar) y revisa el protocolo.
