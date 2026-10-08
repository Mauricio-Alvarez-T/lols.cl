// Obras para CarruselObras: proyectos reales o, mientras no haya, las muestras de referencia.
// Cada una trae lo que necesita su ficha (FichaObra), que se despliega bajo el carrusel.
import type { ObraCarrusel } from '../components/CarruselObras.astro';
import { plantilla, fotoPrincipal, type Proyecto } from './proyectos';
import type { ImagenReferencial } from './referencia';

export const deProyecto = (p: Proyecto): ObraCarrusel => ({
	id: p.slug,
	href: `/proyectos/${p.slug}/`,
	imagen: fotoPrincipal(p),
	tipo: p.tipo,
	nombre: p.nombre,
	comuna: p.comuna,
	superficie: p.superficie,
	ficha: { proyecto: p },
});

// Las muestras llevan a la ficha de ejemplo (solo existe fuera de producción), con sus datos.
export const deMuestra = (r: ImagenReferencial): ObraCarrusel => ({
	id: null, // el carrusel le da uno según su posición
	href: `/proyectos/${plantilla.slug}/`,
	imagen: r,
	tipo: r.ejemplo?.tipo ?? null,
	nombre: r.ejemplo?.nombre ?? null,
	comuna: r.ejemplo?.comuna ?? null,
	superficie: r.ejemplo?.superficie ?? null,
	ejemplo: true,
	ficha: { proyecto: plantilla, muestra: r.ejemplo },
});
