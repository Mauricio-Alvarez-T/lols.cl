# Investigación: qué secciones tienen los sitios de construcción

Septiembre 2026. Tres revisiones en paralelo:

- **A.** 15 constructoras y contratistas chicos y medianos de Chile (10) y del resto de LATAM (5): LR Montajes, Conecta, Mentor Montajes, Alerce, SBH, INCOP, IG Construcciones, Montelco, Elecso, NextEnergy, SERCODE (PE), GTA (CO), Mantenimiento y Montajes (CO), M&CAV (MX), CORBE (AR).
- **B.** 16 contratistas chicos y medianos de EE. UU., Reino Unido, Australia, Canadá y España (generales, montaje industrial, eléctricos, design-build).
- **C.** Guías de UX para sitios de contratistas B2B: NN/G, Hinge Marketing, Google web.dev, W3C, criterios de precalificación (Codelco REGIC, SICEP, AGC).

## Frecuencia combinada (N = 31 sitios)

### Menú principal

| Ítem | Sitios |
|---|---|
| Contacto | 31 |
| Nosotros / Empresa | 29 |
| Servicios | 26 |
| Proyectos | 24 |
| Blog / Noticias | 18 |
| Trabaja con nosotros | 10 |
| Sectores / Mercados | 4 |
| Botón "Cotizar" destacado en el menú | 3 |
| Seguridad (ítem propio) | 1 |

### Portada

| Sección | Sitios |
|---|---|
| Hero con frase | 31 |
| Bloque breve "nosotros" | 27 |
| Servicios (tarjetas) | 26 |
| Proyectos destacados | 23 |
| Cifras (años, obras, m²) | 16 |
| "Por qué elegirnos" | 14 |
| Formulario de contacto en la portada | 13 |
| Logos de clientes | 13 |
| Franja final de cotización | 12 |
| Video (casi siempre loop decorativo en el hero) | 10 |
| Testimonios | 9 |
| Certificaciones | 8 |
| Sectores atendidos | 8 |
| Noticias | 8 |
| WhatsApp (solo LATAM: 8 de 15) | 8 |
| Cobertura / mapa | 6 |
| Proceso de trabajo | 5 |
| Equipo | 5 |
| "Trabaja con nosotros" en portada | 5 |
| Seguridad (bloque propio) | 3 |

## Qué se intenta mostrar (y qué falta)

1. **"Manos seguras", no creatividad.** El sello universal son los años de trayectoria (29/31), seguidos de números de obras y logos de clientes conocidos.
2. **La estructura es igual en todos:** Nosotros, Servicios, Proyectos, Contacto. La diferencia la hace el contenido.
3. **Los proyectos son la prueba principal, pero casi siempre son solo foto y título.** Los pocos que muestran ficha (mandante, ubicación, plazo) y desafío, solución y resultado son claramente más persuasivos (C: es lo que más miran los compradores).
4. **Seguridad y calidad es el gran hueco.**
   - Es un criterio top de precalificación: en Chile los mandantes piden tasas de accidentabilidad certificadas por la mutualidad, ISO 9001/14001/45001 y registros como REGIC o SICEP.
   - Casi ningún sitio lo muestra: 0 de 15 en LATAM, 3 de 16 en el resto.
5. **Cotizar es la conversión principal, pero está escondida.** Los mejores la combinan con WhatsApp (clave en Chile) y con una promesa concreta.
6. **Separar públicos:** postulantes y proveedores con rutas propias, para no saturar el canal comercial (C).
7. **Ruido para una empresa chica:** blog y noticias que no se actualizan, misión y visión, contadores sin respaldo, carruseles automáticos y fotos de stock en "nosotros" (C).

## Video (C + observado)

- Aparece en 10 de 31 sitios, casi siempre como loop silencioso de ambiente en el hero.
- NN/G: el autoplay en la portada se percibe como publicidad si compite con el mensaje.
- Google: el video del hero es una de las causas principales de un LCP lento.
- Cómo hacerlo bien:
  - que sea decorativo y no cargue el mensaje;
  - `muted autoplay loop playsinline`;
  - una imagen fija (poster) como elemento principal de carga;
  - de 1 a 5 MB y en 720p;
  - solo poster en celular o con ahorro de datos;
  - botón de pausa visible (WCAG 2.2.2);
  - respetar `prefers-reduced-motion`.
- Donde más aporta:
  - un timelapse de obra en la ficha de proyecto, que se reproduce al hacer clic;
  - cultura y faena en "Trabaja con nosotros" y en seguridad;
  - testimonios de clientes.
