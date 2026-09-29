# Reunión inicial con don Luis (septiembre 2026)

Notas tomadas en la reunión y cómo se llevaron al sitio.

## Notas

- **Eliminar lo antiguo.** Agregar los proyectos nuevos y actualizar los que se terminaron.
- **Contacto.** Que quien escriba pueda exponer a grandes rasgos su proyecto: metros cuadrados
  y dirección de la propiedad.
- **Proyectos en construcción.** Datos específicos de cada obra en curso: superficie construida,
  comuna, dirección y tipo (edificio y oficinas, bodegaje, centro de bodegas, etc.). Rodrigo
  tiene videos e imágenes.
- **Equipamiento propio.** Camionetas, camiones, EPP, equipos de seguridad y maquinaria
  (alzaprimas, gatas, hormigonera, etc.).
- **Proyectos en preparación (contratados).** Mostrar los que se van a realizar.
- **Sobre nosotros / línea de tiempo.** La empresa nace en 1995: 31 años en el mercado.

## Cómo quedó en el sitio

| Nota | Dónde | Estado |
|---|---|---|
| Eliminar lo antiguo | Las fotos de 2018 quedan solo como muestra en "Terminados" y el build de producción falla mientras estén | Falta que don Luis elija las obras terminadas y fotos nuevas |
| Proyectos en construcción | `/proyectos/#en-construccion` y "En obra ahora" en la portada. Campos `tipo`, `direccion`, `superficie`, `inicio` en `src/data/proyectos.ts` | Faltan los datos y fotos/videos de Rodrigo |
| Contratados | `/proyectos/#contratados`: tabla (aún no hay obra que fotografiar) y línea con el total en la portada. Estado `contratado` | Falta la lista |
| Terminados | `/proyectos/#terminados`. Al terminar una obra basta cambiar su `estado` | — |
| Equipamiento propio | Componente `Equipamiento`: completo en `/empresa/#equipamiento`, compacto en la portada | Faltan lista completa, cantidades y fotos |
| Contacto | Formulario con "Su proyecto": servicio, dirección de la propiedad, superficie aproximada y descripción | Formulario aún sin `config.ini` (ver DEPLOY.md) |
| Desde 1995 | `fundacion` en `src/data/empresa.ts`; los años se calculan al construir (31 en 2026). Cifra de la portada, bajada de Empresa y primer hito de la línea de tiempo | Faltan los demás hitos |

## Preguntas abiertas

1. ¿Las obras contratadas se pueden publicar con nombre y comuna antes de que partan?
2. ¿La dirección exacta de las obras en curso se puede publicar, o basta la comuna?
3. ¿Qué hitos van en la línea de tiempo además de 1995?
4. ¿Qué más incluye el equipamiento ("etc.") y en qué cantidades?
