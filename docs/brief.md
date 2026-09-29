# Rediseño lols.cl — Datos para el desarrollo

**Empresa:** LOLS Ingeniería Limitada · **Actualizado:** 28 de septiembre de 2026
**Sitio actual:** https://lols.cl (WordPress 4.9.26, sin actualizar desde 2018)

## Cómo usar este documento

- ✅ = dato confirmado o extraído de una fuente de la empresa. Se puede usar.
- ⚠️ = dato por confirmar con la jefatura. Úsalo, pero déjalo marcado para revisarlo.
- **No inventes contenido.** Si falta un texto, una foto o un dato, pon un marcador visible `[PENDIENTE: …]` en vez de relleno. Un texto inventado que parece real es peor que un hueco evidente.
- Avanzar por partes (ver el orden sugerido al final).

---

## 1. Logo

✅ **Fuente oficial: Bóveda LOLS** (https://boveda.lols.cl), la aplicación interna de la empresa. Tiene el logo en SVG vectorial.

Archivos adjuntos:

| Archivo | Uso |
|---|---|
| `logo-lols.svg` | Logo completo en verde, sobre fondos claros |
| `logo-lols-blanco.svg` | Logo completo en blanco, sobre fondos verdes u oscuros |
| `isotipo-lols.svg` | Solo el símbolo (sin texto): favicon, avatar, espacios chicos |

Notas técnicas:

- El texto "LOLS" e "INGENIERIA" del SVG está como `<text>` con la fuente **DM Sans 700**, no como trazados. O se carga DM Sans en el sitio, o se convierte el texto a trazados (en Figma/Illustrator: "Outline text") antes de usarlo en producción. Si no se hace ninguna de las dos cosas, el logo se muestra con otra fuente.
- El `favicon.svg` original de Bóveda usaba `strokeWidth` (sintaxis de React), que no es válido en SVG puro y hace que los contornos no se dibujen. En `isotipo-lols.svg` ya está corregido a `stroke-width`.
- ⚠️ **Hay dos versiones del símbolo.** En el SVG de Bóveda el tercer rectángulo es **relleno**; en el logo del sitio de 2018 los tres rectángulos son **contornos**. Se asume que la versión de Bóveda es la vigente. Confirmar.

## 2. Colores y tipografía

⚠️ **El verde cambió entre el sitio viejo y Bóveda.** Se propone usar el de Bóveda como principal, por ser el más reciente. Confirmar.

| Token | Hex | Fuente | Uso propuesto |
|---|---|---|---|
| `--lols-verde` | `#029E4D` | Bóveda LOLS, 2026 ✅ | Color de marca: logo, íconos, franjas, titulares grandes |
| `--lols-verde-oscuro` | `#006739` | lols.cl, 2018 ✅ | Enlaces, botones, cualquier texto verde de tamaño normal |
| `--lols-verde-medio` | `#22A13B` | lols.cl, 2018 ✅ | Solo si se quiere mantener el degradado del sitio viejo |
| `--lols-lima` | `#81D742` | lols.cl, 2018 ✅ | Acento puntual; nunca como texto sobre blanco (contraste bajo) |
| `--lols-carbon` | `#141414` | lols.cl, 2018 ✅ | Texto principal |
| `--lols-gris` | `#3E3E3E` | lols.cl, 2018 ✅ | Texto secundario |
| `--lols-gris-claro` | `#F1F1F1` | lols.cl, 2018 ✅ | Fondos de sección alternos |
| `--lols-blanco` | `#FFFFFF` | — | Fondo base |

```css
:root {
  --lols-verde: #029E4D;
  --lols-verde-oscuro: #006739;
  --lols-verde-medio: #22A13B;
  --lols-lima: #81D742;
  --lols-carbon: #141414;
  --lols-gris: #3E3E3E;
  --lols-gris-claro: #F1F1F1;
  --lols-blanco: #FFFFFF;
}
```

**Contraste (calculado según WCAG 2.2):** `#029E4D` sobre blanco da **3,5:1**. Sirve para el logo, íconos y titulares grandes (24 px o más, o 19 px en negrita), pero **no alcanza el mínimo de 4,5:1 para texto normal**. Lo mismo pasa con texto blanco sobre ese verde. Por eso los enlaces, los botones y todo texto verde de tamaño normal van en `#006739`, que da **7:1**. El lima `#81D742` da 1,8:1: solo decorativo.

Tipografía:

- **Bóveda LOLS usa:** Inter (interfaz) y DM Sans (logo). ✅
- **El sitio de 2018 usaba:** Ubuntu Condensed (menú y títulos) y Montserrat (texto). ✅
- **Propuesta:** DM Sans para títulos e Inter para el texto corrido. Así el sitio queda coherente con el logo y con Bóveda. Ambas están en Google Fonts. ⚠️ Confirmar.

Lema institucional ✅: **"Sus proyectos en las mejores manos"** (portada del sitio actual).

## 3. Referencias visuales

⚠️ **Pendiente:** que don Luis elija una o dos. Las tres primeras son las más cercanas a LOLS y las que conviene mostrarle primero. Todas se revisaron en septiembre de 2026.

**Chilenas, mismo rubro**

| Sitio | Qué tomar |
|---|---|
| [Tecsa — https://www.tecsa.cl/](https://www.tecsa.cl/) | La estructura: divisiones como tarjetas con ícono, franja de logos de clientes, línea de tiempo. Es el modelo más cercano a LOLS. |
| [Ingevec — https://www.ingevec.cl/](https://www.ingevec.cl/) | Video de obra propia en la portada y la historia de la empresa como línea de tiempo. |
| [SalfaCorp — https://www.salfacorp.com/](https://www.salfacorp.com/) | Portafolio filtrable por tipo de obra. |

**Constructoras internacionales**

| Sitio | Qué tomar |
|---|---|
| [BESIX — https://www.besix.com/en](https://www.besix.com/en) | El estándar de fotografía: obra a pantalla completa y en alta resolución. |
| [Skanska — https://www.skanska.com/](https://www.skanska.com/) | Franja de cifras clave en la portada (años, obras, m², dotación). |
| [Webuild — https://www.webuildgroup.com/en](https://www.webuildgroup.com/en) | Un solo color de marca usado con disciplina sobre fotografía sobria. |
| [Ramboll — https://www.ramboll.com/](https://www.ramboll.com/) | Contenido agrupado por lo que necesita el cliente, no por el organigrama. |

**Ingeniería y estudios de diseño**

| Sitio | Qué tomar |
|---|---|
| [Arup — https://www.arup.com/](https://www.arup.com/) | Cada servicio contado desde el problema que resolvió en un proyecto real. |
| [Mott MacDonald — https://www.mottmac.com/](https://www.mottmac.com/) | El formato de ficha de proyecto: título, ubicación, alcance, resultado. |
| [BIG — https://big.dk/](https://big.dk/) | Grilla de proyectos limpia, siempre con los mismos campos. |
| [Heatherwick Studio — https://www.heatherwick.com/](https://www.heatherwick.com/) | Una frase de portada grande y clara sobre mucho espacio en blanco. |

## 4. Contenido

### Datos de contacto

| Campo | Valor | Estado |
|---|---|---|
| Razón social | LOLS Ingeniería Limitada | ✅ |
| Dirección | El Mirador 112-150, Cerrillos, Santiago | ⚠️ Confirmar vigencia |
| Teléfono | +56 652 710 609 | ⚠️ **Revisar:** el prefijo 65 es de Osorno, no de Santiago |
| Correo | lols@lols.cl | ⚠️ Confirmar; idealmente un correo por área (cotizaciones, trabajo) |

### Textos institucionales (sitio de 2018)

Sirven como punto de partida; hay que actualizarlos. Tomados de la página "Quiénes somos":

- Más de 20 años de experiencia en el área de construcción. ⚠️ Recalcular: el texto es de 2018.
- Un esquema de trabajo basado en el esfuerzo, la creatividad y la responsabilidad.
- Compromiso con las normas de seguridad y el respeto por el medio ambiente.
- "Experiencia, seguridad y calidad son nuestras directrices."

### Servicios ✅ (los seis del sitio actual)

1. Construcción
2. Montaje industrial
3. Mantención
4. Electricidad
5. Voz y datos
6. Muebles

⚠️ En el sitio actual **ningún servicio tiene descripción**, solo el título. Cada página de servicio necesita, como mínimo: qué incluye, para qué tipo de cliente o industria, y un proyecto de ejemplo. Dejar `[PENDIENTE]` hasta tener el texto.

### Proyectos que aparecen en el sitio de 2018

**Terminados** (8). Aparecen solo como imágenes, sin ningún dato. Los nombres son **nombres de archivo**, no nombres reales de proyecto:

`ABATE` · `KOLM_AM` · `MAK_SA` · `ZHU_AM` · `B_CAM_ESP` · `RENACER_BAS` · `EIFFEL_AM` · `VENTURA_ESP`

**En construcción** (7, en 2018). Solo imagen y dirección:

Sazié 2642 · Bascuñán Guerrero 986 · U.L.A. 444 · San Alfonso 646 · San Alfonso 616 · Chacabuco (dos proyectos, dirección incompleta)

⚠️ Lo más probable es que los "en construcción" de 2018 ya estén terminados. **Pendiente:** el listado actualizado de proyectos y, para cada uno, la ficha:

```
nombre · mandante · comuna · año · servicio(s) LOLS · m² o magnitud · 3 a 12 fotos · estado (terminado / en curso)
```

## 5. Estructura propuesta del sitio

```
/                      Portada
/empresa               Quiénes somos, historia, seguridad
/servicios             Índice de los 6 servicios
/servicios/<slug>      Una página por servicio
/proyectos             Todos los proyectos, filtrables por servicio y por estado
/proyectos/<slug>      Ficha de cada proyecto
/contacto              Formulario de cotización, mapa, datos
/privacidad            Política de privacidad (obligatoria, ver punto 6)
```

Redirecciones 301 desde las URL antiguas (para no perder lo que Google ya tiene indexado):

| URL antigua | URL nueva |
|---|---|
| `/quienes-somos/` | `/empresa` |
| `/nuestros-servicios/` | `/servicios` |
| `/proyectos-terminados/` | `/proyectos?estado=terminado` |
| `/proyectos-en-construccion/` | `/proyectos?estado=en-curso` |
| `/contacto/` | `/contacto` |

## 6. Requisitos que no se negocian

- **Ley 21.719 de protección de datos personales:** entra en vigencia el **1 de diciembre de 2026**. El formulario de contacto recoge datos personales, así que necesita (a) una página `/privacidad` que explique para qué se usan los datos, cuánto tiempo se guardan y cómo la persona ejerce sus derechos, y (b) una casilla de consentimiento en el formulario, sin marcar por defecto. El texto legal final lo revisa quien vea los temas legales de la empresa.
- **Responsive:** la mayoría de las visitas llega por celular. Revisar todo ahí.
- **Accesibilidad básica:** texto alternativo en todas las imágenes, contraste mínimo de 4,5:1 en texto normal (enlaces y botones en `#006739`, nunca texto en lima), navegable con teclado, un solo `h1` por página.
- **Analítica instalada antes del lanzamiento**, para tener con qué comparar.
- **Dominio, hosting y panel de administración a nombre de LOLS**, no del proveedor ni de una cuenta personal.

## 7. Preguntas para don Luis

Todos los ⚠️ se resuelven con estas seis preguntas:

1. ¿El verde oficial es el de Bóveda (`#029E4D`) o el del sitio viejo (`#006739`)?
2. ¿El logo vigente es el de Bóveda (tercer cuadro relleno) o el de 2018 (tres cuadros en contorno)?
3. ¿La dirección, el teléfono (+56 652 710 609) y el correo lols@lols.cl siguen vigentes?
4. ¿Cuáles son los proyectos que quiere mostrar hoy? Idealmente de 6 a 12.
5. ¿Cuál de estas referencias le gusta más: Tecsa, Ingevec o SalfaCorp?
6. ~~¿Cuántos años exactos tiene la empresa?~~ Respondida: nace en 1995 (docs/reunion-inicial.md).

## Orden sugerido de trabajo

1. Tokens de color, tipografías y logo cargados en el proyecto.
2. Estructura base: encabezado con menú, pie de página y las páginas vacías del sitemap.
3. Portada con marcadores `[PENDIENTE]` donde falte contenido.
4. Plantilla de ficha de proyecto (una sola, que sirva para todos).
5. Páginas de servicio.
6. Contacto, formulario y política de privacidad.
7. Redirecciones, analítica y revisión en celular antes de publicar.
