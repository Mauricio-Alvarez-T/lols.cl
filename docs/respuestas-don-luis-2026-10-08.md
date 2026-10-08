# Respuestas de don Luis (8 de octubre de 2026)

Respuestas a la hoja "Preguntas para la jefatura" (1 de octubre de 2026) y notas tomadas en la
reunión, y cómo se llevaron al sitio. Las trajo Marcos.

## Lo que se cambió

| Respuesta | Dónde quedó |
|---|---|
| Servicios vigentes: Construcción, Montaje industrial y Electricidad. Salen Mantención, Voz y datos y Muebles | `servicios` en `src/data/empresa.ts`; también salen del formulario y de la bajada de la portada |
| No especificar las especialidades; quitar el apartado de especialidades | Sin "Seis especialidades" en Servicios, sin "Qué hacemos / Para quién" en la ficha de cada servicio y sin "Aprende de varias especialidades" en Trabaja con nosotros |
| Sin tiempo de construcción, para no comprometerse | Sin "Plazo" ni la cifra "14 meses de obra" en la ficha de obra (`FichaObra.astro`) |
| En la línea de tiempo no va nada; historia de LOLS: no | Sin "Nuestra trayectoria" en Empresa |
| Solo el render de lo que se hará y la imagen de lo terminado; fotos por etapa: no | Sin video ni timelapse en la ficha de obra. Una obra sin imagen muestra "Render por recibir" (en construcción) o "Foto por recibir" (terminada), nunca una foto de obra a medio hacer |
| "Han confiado en nosotros": solo la foto del edificio y la dirección, sin nombres de personas. Logos de clientes: no | La portada muestra las 8 obras terminadas del sitio de 2018 con su foto y su dirección |
| No agregar nombres de personas | Sin testimonios, sin "Las personas a cargo" (Empresa) y sin "Quién atiende" (Contacto) |
| Obras y mandantes que se pueden nombrar: todas | Proyectos con sus datos reales (`src/data/proyectos.ts`) |
| Todas las obras de aquí en adelante y, de los años anteriores, solo una por año | En construcción: las 6 obras activas con dirección de la Bóveda LOLS. Terminadas: las 2 de 2026 de la Bóveda y una por año del sitio de 2018 (2014, 2016, 2017 y 2018) |
| Cifras: quitar las de equipos. Trabajadores: 200. Registro de m²: no hay | Equipamiento sin cantidades. Portada: 31 años, obras ejecutadas (de ejemplo) y 200 trabajadores, sin m² |
| Capacidad técnica: eliminar términos repetidos | Los ítems de cada equipo ya no repiten el nombre de la categoría ("Andamios verticales" → "Verticales") |
| Verificar andamios tipo europeo y camión pluma | El camión con pluma está en el inventario de la Bóveda (ítem 115). El andamio tipo europeo va marcado para revisar: no figura así en el inventario |
| Los presupuestos son en UF | Paso "Cotización" de "Qué pasa después" |
| Después de que LOLS recibe una solicitud, se pone en contacto con usted. Plazo de respuesta: sin plazo | Bajada de Contacto y primer paso de "Qué pasa después" |
| Eliminar el apartado de presupuesto estimado | El formulario no tiene ese campo |
| Correo de cotizaciones: lols@lols.cl y contacto@lols.cl | Destinatario del formulario: se configura en el servidor (`config.ini`, ver `docs/DEPLOY.md`) |
| Correo de los CV: lols@lols.cl. Crear un correo propio para CV | Trabaja con nosotros envía a lols@lols.cl hasta que exista el correo nuevo |
| Horario: lunes a viernes, de 9:00 a 17:00 | `empresa.horario`: Contacto y pie |
| Política de privacidad: aprobada | Sin cambios |
| Certificado de la mutual: no. Registros (MOP, MINVU, CChC…): no. Solo la mutual | Seguridad: sin indicadores, sin ISO (LOLS no las tiene) y sin registros; queda la Mutual de Seguridad CChC |
| Publicar la Política de Seguridad y Salud en el Trabajo: sí | Sección "Política de Seguridad y Salud en el Trabajo" en Seguridad (falta el documento) y en la portada y el pie |
| Preguntas frecuentes: no | No hay |

También se pusieron los datos confirmados por Marcos: dirección El Mirador 150, RUT
77.085.560-8, razón social LOLS Empresa de Ingeniería Limitada y WhatsApp +56 652 710 609.

## Lo que falta

- Render, tipo, superficie e inicio de cada obra en construcción, y las que parten pronto.
- La obra de cada año de 2019 a 2025, y fotos de las terminadas en 2026.
- El documento de la Política de Seguridad y Salud en el Trabajo.
- El correo propio para las postulaciones.
- LinkedIn y perfil de Google: don Luis dijo que sí; se crean fuera del sitio.
- Pedir a 2 o 3 clientes una recomendación: don Luis dijo que sí, pero sin nombres de personas.
