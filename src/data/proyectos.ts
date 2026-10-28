// Proyectos del portafolio. Ficha según docs/brief.md § 4 (formato Mott MacDonald / BIG) y la
// reunión inicial con don Luis (docs/reunion-inicial.md): de cada obra en construcción se
// muestra superficie, comuna, dirección y tipo de obra; las contratadas que aún no parten
// también se muestran, como cartera.
//
// Las obras NO se escriben aquí: cada una es un JSON en src/content/obras/<slug>.json, con sus
// fotos en public/proyectos/<slug>/ (contrato y reglas: docs/contenido-obras.md; esquema:
// src/content.config.ts). Desde la Fase 1 esos archivos los escribe la Bóveda al publicar: para
// agregar o cambiar una obra se hace en la Bóveda (módulo «Sitio web»), no a mano en el código,
// porque la próxima publicación reemplaza lo que no venga de ella.
// Un campo en null no se muestra en la ficha de una obra real (solo la ficha de ejemplo lleva
// [PENDIENTE]). Cuando una obra termina, pasa a `estado: 'terminado'` con su `anio`.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection } from 'astro:content';
import type { NombrePictograma } from './pictogramas';
import { estados, tiposObra, formatoSuperficie, urlsDeSrcset, type Estado, type TipoObra } from './catalogo';
import { referenciasDeObra, type ImagenReferencial } from './referencia';

export { estados, tiposObra, type Estado, type TipoObra };

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

// Foto propia de una obra (public/proyectos/<slug>/). srcset, width y height son opcionales.
export interface FotoObra {
	src: string;
	alt: string;
	srcset?: string;
	width?: number;
	height?: number;
}

export interface Proyecto {
	slug: string;
	nombre: string | null;
	titular: string | null; // el resultado en una frase, no el nombre (patrón Arup)
	tipo: TipoObra | null;
	mandante: string | null;
	comuna: string | null;
	direccion: string | null; // calle y número (se publica: decisión del dueño, 28-10-2026)
	superficie: string | null; // superficie construida, ej. "3.200 m²" (en el JSON: superficieM2)
	anio: number | null; // año de término (terminados)
	inicio: string | null; // inicio real o previsto, ej. "Marzo 2027" (en construcción y contratados)
	servicios: string[]; // slugs de src/data/empresa.ts
	estado: Estado | null;
	desafio: string | null;
	solucion: string | null;
	resultado: string | null;
	// Terminadas: fotos de la obra terminada. En construcción y contratadas: el render de lo que
	// se hará (don Luis, 08-10-2026: nada de fotos por etapa ni videos de avance). Una imagen
	// referencial (con `origen`, campo `referencia` del JSON) se muestra con su etiqueta hasta
	// tener la foto real.
	fotos: (FotoObra | ImagenReferencial)[];
}

// "Han confiado en nosotros" (portada): foto del edificio terminado y su dirección, sin nombres
// (don Luis, 08-10-2026). Fotos del currículum empresarial de LOLS 2026 (páginas 6 a 12).
export const obrasConfianza = [
	{ slug: 'enfermera-lucia-vidal-arias-6679', direccion: 'Enfermera Lucía Vidal Arias 6679', comuna: 'Cerrillos' },
	{ slug: 'claudio-gay-2970', direccion: 'Claudio Gay 2970', comuna: 'Santiago' },
	{ slug: 'av-providencia-1132', direccion: 'Av. Providencia 1132', comuna: 'Providencia' },
	{ slug: 'abate-molina-221', direccion: 'Abate Molina 221', comuna: 'Santiago' },
	{ slug: 'bascunan-guerrero-818', direccion: 'Bascuñán Guerrero 818', comuna: 'Santiago' },
	{ slug: 'grajales-2751', direccion: 'Grajales 2751', comuna: 'Santiago' },
	{ slug: 'bascunan-guerrero-239', direccion: 'Bascuñán Guerrero 239', comuna: 'Santiago' },
	{ slug: 'gorbea-2635', direccion: 'Gorbea 2635', comuna: 'Santiago' },
	{ slug: 'tucapel-jimenez-84', direccion: 'Tucapel Jiménez 84', comuna: 'Santiago' },
	{ slug: 'conferencia-442', direccion: 'Conferencia 442', comuna: 'Santiago' },
	{ slug: 'san-alfonso-580', direccion: 'San Alfonso 580', comuna: 'Santiago' },
	{ slug: 'abate-molina-211', direccion: 'Abate Molina 211, esquina Sazié', comuna: 'Santiago' },
];
// Cuatro de estas carpetas son también de una obra de src/content/obras/ (las escribe la Bóveda,
// que no debe borrar su 1.jpg: docs/contenido-obras.md § Carpetas compartidas). Si falta una foto,
// el build falla en vez de publicar un carrusel con la imagen rota.
for (const o of obrasConfianza) {
	if (!existsSync(join(process.cwd(), 'public/proyectos', o.slug, '1.jpg'))) {
		throw new Error(`obrasConfianza: no existe public/proyectos/${o.slug}/1.jpg`);
	}
}

// Obras de src/content/obras/, en el orden del sitio: por estado (el de `estados`), después por
// `orden` y al final por nombre y slug (el orden en que el glob entrega los archivos no significa
// nada). Lo que el esquema no puede ver hace fallar el build aquí: un `slug` distinto del nombre
// del archivo (o dos archivos con el mismo slug) y una foto que no existe en public/.
async function cargar(): Promise<Proyecto[]> {
	const ordenEstados = Object.keys(estados);
	const lista = (await getCollection('obras')).map(({ id, data: o }) => {
		const archivo = `src/content/obras/${id}.json`;
		if (o.slug !== id) throw new Error(`${archivo}: slug «${o.slug}» distinto del nombre del archivo`);
		for (const f of o.fotos) {
			for (const url of [f.src, ...urlsDeSrcset(f.srcset)]) {
				if (!existsSync(join(process.cwd(), 'public', url))) throw new Error(`${archivo}: no existe public${url}`);
			}
		}
		const proyecto: Proyecto = {
			slug: o.slug,
			nombre: o.nombre,
			titular: o.titular,
			tipo: o.tipo,
			mandante: o.mandante,
			comuna: o.comuna,
			direccion: o.direccion,
			superficie: o.superficieM2 === null ? null : formatoSuperficie(o.superficieM2),
			anio: o.anio,
			inicio: o.inicio,
			servicios: o.servicios,
			estado: o.estado,
			desafio: o.desafio,
			solucion: o.solucion,
			resultado: o.resultado,
			fotos: o.referencia ? [referenciasDeObra[o.referencia]] : o.fotos,
		};
		return { proyecto, estado: o.estado, orden: o.orden };
	});
	lista.sort(
		(a, b) =>
			ordenEstados.indexOf(a.estado) - ordenEstados.indexOf(b.estado) ||
			a.orden - b.orden ||
			a.proyecto.nombre!.localeCompare(b.proyecto.nombre!, 'es') ||
			(a.proyecto.slug < b.proyecto.slug ? -1 : 1),
	);
	return lista.map((e) => e.proyecto);
}

export const proyectos: Proyecto[] = await cargar();

export const proyectosPorEstado = (estado: Estado) => proyectos.filter((p) => p.estado === estado);

// Foto principal, o un recuadro gris que dice qué falta: el render (lo que se hará) o la foto
// (lo terminado). Nunca una foto de obra a medio hacer en su lugar.
export const fotoPrincipal = (p: Proyecto): FotoObra | ImagenReferencial =>
	p.fotos[0] ??
	(p.estado === 'terminado'
		? { src: '/proyectos/foto-por-recibir.svg', alt: `Foto de ${p.nombre ?? 'la obra'} por recibir` }
		: { src: '/proyectos/render-por-recibir.svg', alt: `Render de ${p.nombre ?? 'la obra'} por recibir` });

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
	servicios: ['construccion'],
	estado: null,
	desafio: null,
	solucion: null,
	resultado: null,
	fotos: [],
};
