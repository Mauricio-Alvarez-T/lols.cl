// Proyectos del portafolio. Ficha según docs/brief.md § 4 (formato Mott MacDonald / BIG):
// cada campo en null se muestra como [PENDIENTE] en el sitio.
//
// Para agregar un proyecto: copiar `plantilla`, darle un slug y llenar lo que se sepa.
// Fotos en public/proyectos/<slug>/ (la primera es la portada).

export type Estado = 'terminado' | 'en-curso';

export interface Proyecto {
	slug: string;
	nombre: string | null;
	titular: string | null; // el resultado en una frase, no el nombre (patrón Arup)
	mandante: string | null;
	comuna: string | null;
	anio: number | null;
	magnitud: string | null; // m², plazo o equivalente
	servicios: string[]; // slugs de src/data/empresa.ts
	estado: Estado | null;
	desafio: string | null;
	solucion: string | null;
	resultado: string | null;
	cifra: { valor: string; etiqueta: string } | null; // un número del resultado
	fotos: { src: string; alt: string }[];
}

export const proyectos: Proyecto[] = [];

// Ficha de ejemplo para revisar el diseño mientras no hay proyectos reales. Solo existe fuera
// de producción (ver src/pages/proyectos/[slug].astro).
export const plantilla: Proyecto = {
	slug: 'ejemplo',
	nombre: null,
	titular: null,
	mandante: null,
	comuna: null,
	anio: null,
	magnitud: null,
	servicios: ['construccion'],
	estado: null,
	desafio: null,
	solucion: null,
	resultado: null,
	cifra: null,
	fotos: [],
};

export const estados: Record<Estado, string> = { terminado: 'Terminado', 'en-curso': 'En curso' };
