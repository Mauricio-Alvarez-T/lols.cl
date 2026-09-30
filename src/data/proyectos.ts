// Proyectos del portafolio. Ficha según docs/brief.md § 4 (formato Mott MacDonald / BIG) y la
// reunión inicial con don Luis (docs/reunion-inicial.md): de cada obra en construcción se
// muestra superficie, comuna, dirección y tipo de obra; las contratadas que aún no parten
// también se muestran, como cartera.
// Cada campo en null se muestra como [PENDIENTE] en el sitio.
//
// Para agregar un proyecto: copiar `plantilla`, darle un slug y llenar lo que se sepa.
// Fotos en public/proyectos/<slug>/ (la primera es la portada). Cuando una obra termina, basta
// cambiar su `estado` a 'terminado' y completar el año y el relato.

import type { NombrePictograma } from './pictogramas';

// 'en-curso' conserva el valor de las URLs viejas (/proyectos-en-construccion/ → ?estado=en-curso).
export type Estado = 'en-curso' | 'contratado' | 'terminado';

// Orden en que se muestran en el sitio: lo que está pasando ahora primero.
export const estados: Record<Estado, string> = {
	'en-curso': 'En construcción',
	contratado: 'Contratado',
	terminado: 'Terminado',
};

// Tipos de obra que nombró don Luis; se pueden agregar más.
export const tiposObra = [
	'Edificio de oficinas',
	'Edificio y oficinas',
	'Edificio comercial',
	'Bodegaje',
	'Centro de bodegas',
	'Industrial',
	'Habilitación',
] as const;
export type TipoObra = (typeof tiposObra)[number];

// Pictograma de cada tipo de obra (src/components/Pictograma.astro). Acepta texto libre
// porque las tarjetas de muestra traen el tipo como string; lo desconocido cae en "edificio".
const pictogramas: Record<TipoObra, NombrePictograma> = {
	'Edificio de oficinas': 'edificio',
	'Edificio y oficinas': 'edificio-oficinas',
	'Edificio comercial': 'comercial',
	Bodegaje: 'bodegaje',
	'Centro de bodegas': 'centro-bodegas',
	Industrial: 'industrial',
	Habilitación: 'habilitacion',
};
export const pictogramaDeTipo = (tipo: string | null | undefined): NombrePictograma =>
	(tipo && pictogramas[tipo as TipoObra]) || 'edificio';

export interface Proyecto {
	slug: string;
	nombre: string | null;
	titular: string | null; // el resultado en una frase, no el nombre (patrón Arup)
	tipo: TipoObra | null;
	mandante: string | null;
	comuna: string | null;
	direccion: string | null; // calle y número; confirmar con el mandante si se puede publicar
	superficie: string | null; // superficie construida, ej. "3.200 m²"
	anio: number | null; // año de término (terminados)
	inicio: string | null; // inicio real o previsto, ej. "Marzo 2027" (en construcción y contratados)
	plazo: string | null;
	servicios: string[]; // slugs de src/data/empresa.ts
	estado: Estado | null;
	desafio: string | null;
	solucion: string | null;
	resultado: string | null;
	cifra: { valor: string; etiqueta: string } | null; // un número del resultado
	fotos: { src: string; alt: string }[];
	video: { src: string; poster: string } | null; // video propio de la obra (public/proyectos/<slug>/)
}

export const proyectos: Proyecto[] = [];

export const proyectosPorEstado = (estado: Estado) => proyectos.filter((p) => p.estado === estado);

// Ficha de ejemplo para revisar el diseño mientras no hay proyectos reales. Solo existe fuera
// de producción (ver src/pages/proyectos/[slug].astro).
export const plantilla: Proyecto = {
	slug: 'ejemplo',
	nombre: null,
	titular: null,
	tipo: null,
	mandante: null,
	comuna: null,
	direccion: null,
	superficie: null,
	anio: null,
	inicio: null,
	plazo: null,
	servicios: ['construccion'],
	estado: null,
	desafio: null,
	solucion: null,
	resultado: null,
	cifra: null,
	fotos: [],
	video: null,
};
