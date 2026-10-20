// Obras para CarruselObras: proyectos reales o, mientras no haya, las muestras de referencia.
// Cada una trae lo que necesita su ficha (FichaObra), que se despliega bajo el carrusel.
import type { ObraCarrusel } from '../components/CarruselObras.astro';
import { plantilla, fotoPrincipal, obrasConfianza, type Proyecto } from './proyectos';
import type { ImagenReferencial } from './referencia';

export const deProyecto = (p: Proyecto): ObraCarrusel => ({
	id: p.slug,
	href: `/proyectos/${p.slug}/`,
	imagen: fotoPrincipal(p),
	tipo: p.tipo,
	nombre: p.nombre,
	comuna: p.comuna,
	superficie: p.superficie,
	anio: p.estado === 'terminado' && p.anio ? String(p.anio) : null,
	ficha: { proyecto: p },
});

// "Han confiado en nosotros": solo la foto del edificio y su dirección (don Luis, 08-10-2026), en
// el mismo carrusel que "En obra ahora" (Marcos, 20-10-2026). Sin ficha ni página propia.
export const deConfianza = (o: (typeof obrasConfianza)[number]): ObraCarrusel => ({
	id: o.slug,
	href: null,
	imagen: { src: `/proyectos/${o.slug}/1.jpg`, alt: `Edificio en ${o.direccion}, ${o.comuna}` },
	tipo: 'Obra entregada',
	nombre: o.direccion,
	comuna: o.comuna,
	superficie: null,
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
	anio: r.ejemplo?.anio ?? null,
	ejemplo: true,
	ficha: { proyecto: plantilla, muestra: r.ejemplo },
});
