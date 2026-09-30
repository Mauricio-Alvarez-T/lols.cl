// Obras para CarruselObras: proyectos reales o, mientras no haya, las muestras de referencia.
import type { ObraCarrusel } from '../components/CarruselObras.astro';
import { plantilla, type Proyecto } from './proyectos';
import { bandas, type ImagenReferencial } from './referencia';

export const deProyecto = (p: Proyecto): ObraCarrusel => ({
	href: `/proyectos/${p.slug}/`,
	imagen: p.fotos[0] ?? bandas.fichaEjemplo,
	tipo: p.tipo,
	nombre: p.nombre,
	comuna: p.comuna,
	superficie: p.superficie,
});

// Las muestras llevan a la ficha de ejemplo (solo existe fuera de producción).
export const deMuestra = (r: ImagenReferencial): ObraCarrusel => ({
	href: `/proyectos/${plantilla.slug}/`,
	imagen: r,
	tipo: r.ejemplo?.tipo ?? null,
	nombre: r.ejemplo?.nombre ?? null,
	comuna: r.ejemplo?.comuna ?? null,
	superficie: r.ejemplo?.superficie ?? null,
	ejemplo: true,
});
