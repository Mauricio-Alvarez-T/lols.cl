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
| Proyectos | grilla de campos fijos (foto, nombre, servicio, comuna, año) + filtro por servicio y estado (`?servicio=`, `?estado=`) | BIG, SalfaCorp, Ingevec |
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
