# Estructura del sitio y de dónde sale cada decisión

Reestructuración completa (no una renovación del sitio de 2018). Cada patrón viene de una
referencia de docs/brief.md § 3.

## Criterio visual

- Blanco y carbón dominan; el verde es acento puntual (Webuild). Botones y enlaces en `#006739`.
- Frases grandes sobre mucho espacio en blanco (Heatherwick, Arup).
- La foto de obra propia es la protagonista: bandas a todo el ancho (BESIX, Ingevec).
- Menú de 4 ítems + botón Cotizar (Heatherwick, BIG). Pie mínimo (Heatherwick).

## Páginas

| Página | Secciones | Referencias |
|---|---|---|
| Portada | frase grande → banda de video/foto → 4 cifras → servicios por necesidad → proyecto destacado (desafío/solución/resultado) → 3 proyectos → logos de clientes → contacto con persona | Heatherwick, BESIX, Ingevec, Skanska, Ramboll, Arup, BIG, Tecsa, Mott MacDonald |
| Proyectos | tres bloques según la reunión con don Luis (docs/reunion-inicial.md): en construcción (tipo, superficie, comuna, dirección), contratados (tabla) y terminados; tarjetas con campos fijos (BIG) | BIG, SalfaCorp, Ingevec, reunión |
| Ficha de proyecto | titular con el resultado → recuadro de datos (mandante, ubicación, año, magnitud, servicios, estado) → foto → desafío / solución / resultado + una cifra → galería → otros proyectos | Mott MacDonald, Heatherwick, Arup, BIG |
| Servicios | agrupados por necesidad (Construir / Instalar / Mantener, **propuesta a confirmar**), cada uno con el problema que resuelve | Ramboll, Arup |
| Servicio | problema como titular → foto → qué hacemos / para quién → proyectos del servicio → contacto | Arup, Ramboll |
| Empresa | directrices en grande → foto de equipo → línea de tiempo → valores → seguridad → equipo con nombre | Heatherwick, Tecsa, Ingevec, Mott MacDonald |
| Contacto | formulario + persona que atiende + datos + mapa | Arup, Mott MacDonald |

## Qué se descartó y por qué

- Filtros de muchas dimensiones (Ramboll, Skanska): con 6–12 proyectos se verían vacíos.
- Noticias, inversionistas, gobierno corporativo: se quedarían desactualizados o no aplican.
- Ficha de proyecto delgada de Tecsa (solo título, mandante y fotos).

## Ajuste por investigación del rubro (29-sep-2026)

Tras revisar 31 sitios de construcción y guías de UX B2B (docs/investigacion-secciones.md):

| Cambio | Por qué |
|---|---|
| Página **Seguridad y calidad** (menú + bloque en portada): indicadores de la mutualidad, ISO, registros REGIC/SICEP, programa de prevención, "Solicitar documentación" | Es lo primero que revisa un mandante al precalificar y casi ningún sitio lo muestra (0/15 en LATAM) |
| **Barra fija en celular** (Llamar · WhatsApp · Cotizar) y botón flotante de WhatsApp en escritorio | WhatsApp es el canal principal en Chile; la mayoría de las visitas es móvil |
| **Trabaja con nosotros** y **Proveedores** (en el pie, y derivación desde Contacto) | Rutas propias para no saturar el canal comercial |
| **Cómo trabajamos** (4 pasos) en portada y "Qué pasa después" en Contacto | Claridad del proceso cuando no hay precios publicados |
| Frase del hero: qué hace, para quién y dónde | El hero debe responder eso en 5 segundos |
| Ficha de proyecto: plazo, rol de LOLS, testimonio con nombre y cargo, timelapse | Los compradores miran proyectos similares con datos, no solo fotos |
| **Videos** (Mixkit): loop con botón de pausa en portada, seguridad y trabaja con nosotros; timelapse al hacer clic en la ficha | Donde el video suma ambiente o prueba; el poster carga primero, 360p en celular, solo poster con ahorro de datos o "reducir movimiento" |
| Sin blog ni noticias | En una empresa chica se desactualizan y restan credibilidad |

## Dirección visual "lámina de proyecto" (29-sep-2026)

Fuentes: skill `frontend-design` de Anthropic (actualizado 3-sep-2026), blog "Improving frontend
design through Skills" (nov-2025), cookbook de estética frontend; sitios de construcción
premiados en Awwwards 2025–2026 (Berch, Modus, Haven, METRIC, Spence); NN/G State of UX 2026;
WebKit/Chrome sobre view transitions.

- **Un solo gesto audaz: el lenguaje del plano, como información.** Rótulo de lámina (cuadro de
  datos con celdas y línea de dibujo) en tarjetas, ficha y proyecto destacado, con número de
  lámina correlativo; grilla de plano con ejes A–D / 1–3 en las secciones oscuras
  (`.plano` + `EjesPlano`); ejes que se trazan sobre la obra de la portada (`ObraPortada`).
- **Tipografía:** DM Sans (la del logo) pesada y con tamaño óptico para títulos; IBM Plex Sans
  para texto (reemplaza Inter, marcada por Anthropic como fuente "por defecto"); IBM Plex Sans
  Condensed para rótulos y datos, como la rotulación de planos.
- **Color:** blanco roto con leve sesgo verde (`--fondo`), grises de hormigón, carbón; el verde
  solo como acento. Las fotos llevan un tratamiento común (menos saturación, algo más de contraste).
- **Fuera el "template chrome":** rótulos en mayúsculas espaciadas sobre cada sección (ahora un
  rótulo discreto solo donde informa), flechas "→" en enlaces (ahora subrayado que crece),
  numeración 01/02/03 donde no hay secuencia (queda en el proceso y la línea de tiempo).
- **Movimiento:** un solo momento al cargar la portada; sin revelado al hacer scroll (el
  contenido está completo en reposo); transiciones entre páginas con CSS nativo (la foto de la
  tarjeta viaja a la ficha; el encabezado queda fijo). Respeta "reducir movimiento".
- **Jerarquía:** la primera obra de cada grilla es más grande.
- **Pie:** columnas de contacto, sitio, otros públicos y certificaciones; marca en grande; RUT.

## Identidad: el isotipo como sistema (30-sep-2026)

Pedido: "la web se siente sosa, le falta identidad", con elementos livianos. Se revisaron de
nuevo las 11 referencias del brief, esta vez buscando qué las hace reconocibles (capturas del
30-sep; SalfaCorp bloquea el acceso automatizado). Las que tienen más identidad repiten uno o
dos recursos propios en todo el sitio: Mott MacDonald saca máscaras, íconos y separadores de la
forma de su logo; BIG pone un pictograma a cada proyecto; Skanska termina cada enlace con su
flecha en círculo verde y usa un bloque azul para las cifras; Arup cierra con un pie rojo y
lleva "80 years" bajo el logo; BESIX pone una barra roja en cada título; Tecsa usa su rojo en
grande. La propuesta anterior usaba el verde solo en detalles y ninguna pieza propia.

Sistema: las piezas del isotipo (losa, muro, ventana en contorno, zócalo) son un edificio en
elevación, y se repiten en todo el sitio:

- **Pictogramas LOLS** (`Pictograma.astro`): servicios y tipos de obra dibujados con esa
  geometría, solo ángulos rectos. En tarjetas de proyecto (macizo = obra en curso o terminada),
  en la tabla de contratados (contorno = obra que aún no parte), en la ficha y en servicios.
  Reemplazan íconos genéricos. (BIG, Mott MacDonald)
- **Losa sobre cada título de sección**: barra verde de 6 px, la misma proporción que las losas
  del logo; y una losa de 4 px arriba del encabezado. (BESIX, logo)
- **Zócalo ■** como marcador de rótulos y como remate de los enlaces, que al pasar el mouse se
  estira hasta ser una losa. (Mott MacDonald, Skanska)
- **Pie verde**, para que cada página cierre con la marca. (Arup)
- **"Desde 1995"** junto al logo y en el pie. (Arup, "80 years")

Revisión del usuario (30-sep): se sacaron la cinta de especialidades bajo la portada, el
cierre de contacto como letrero de obra y el logo gigante del pie ("lo que no sume, mejor no
tenerlo"). El cierre de contacto quedó en texto: título, botón y datos en líneas.

Todo es CSS y SVG en línea: sin imágenes, fuentes ni librerías nuevas. 

## Mostrar, no contar (30-sep-2026)

Premisa del usuario: "siempre es mejor mostrar que decir". Donde no sea estrictamente
necesario, solo un título y una imagen; el detalle, recién cuando la persona lo pide.

Filosofía base: **divulgación progresiva** (Nielsen Norman Group,
https://www.nngroup.com/articles/progressive-disclosure/). Se complementa con "mostrar, no
contar" para el primer nivel, con la investigación de NN/g sobre fotos
(https://www.nngroup.com/articles/photos-as-web-content/: se miran las fotos reales, se ignora
el stock) y con el "menos, pero mejor" de Dieter Rams. Es el mismo patrón que siguen
Heatherwick, BIG, Snøhetta y Herzog & de Meuron: en el listado, foto + nombre + lugar; en la
página del proyecto, fotos primero, un texto corto y un recuadro de datos.

Reglas aplicadas:

1. **Dos niveles.** Nivel 1: imagen + título (y, si hace falta, una línea). Nivel 2: una página
   propia con todo. Nunca un tercer nivel.
2. **La tarjeta entera es el enlace**, con título visible. Nada que aparezca solo al pasar el
   mouse (en el celular no existe).
3. **Enlaces que dicen adónde llevan** ("Ver indicadores y certificaciones", no "Ver más").
4. **Sin ventanas emergentes para información**; el detalle vive en páginas con su URL.
5. **Lo que un mandante necesita no se esconde** (NN/g B2B): nombres de los servicios,
   teléfono y WhatsApp (pie y barra del celular), años de trayectoria y seguridad en corto.
6. **Las cifras cuentan como imagen**: número grande, etiqueta corta.
7. **Todo el contenido está en el HTML** (no se carga al hacer clic), para buscadores y
   lectores de pantalla.

Cambios:

- **Portada (10 → 7 bloques):** obra en video con lema, bajada y botones · cifras · servicios en
  seis fotos · obras en construcción (foto, nombre, comuna) · seguridad (video + dos datos) ·
  clientes · contacto (frase + botón). Salieron el proyecto destacado, el equipamiento, "cómo
  trabajamos" (sigue en /contacto/) y la agrupación Construir/Instalar/Mantener.
- **Tarjetas de proyecto:** foto, pictograma, nombre y comuna; tipo, superficie, fechas y
  dirección pasaron a la ficha.
- **Ficha de proyecto:** la foto va primero; después nombre, titular, datos y relato.
- **Servicios:** seis fotos con su nombre (antes, lista de texto sin imágenes).
- **Empresa:** salieron los bloques de valores y de normas (texto); el equipamiento es foto +
  nombre + una línea.
- **Seguridad:** cifras y sellos; los registros como sellos; salió la lista del programa.
- **Cierre de contacto:** frase + botón.

Condición: la filosofía descansa en las fotos. Con stock sirve para la propuesta; el sitio final
necesita fotos reales de obras, equipos y personas.
