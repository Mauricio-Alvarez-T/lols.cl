// Cómo se ve una obra: del JSON de src/content/obras/<slug>.json al Proyecto que dibujan los
// componentes, y los textos derivados (superficie, año, servicios…) tal como salen en la página.
// Módulo puro (sin astro:content ni node:fs): lo usan src/data/proyectos.ts al compilar y el
// puente del editor visual en el navegador (src/scripts/editor/aplicar.ts), para que un cambio
// hecho en la Bóveda se vea igual que después de publicarlo (docs/editor-visual.md).
import { estados, formatoSuperficie, type Estado, type TipoObra } from './catalogo';
import { servicioPorSlug } from './empresa';
import { referenciasDeObra, type ImagenReferencial } from './referencia';

// Foto propia de una obra (public/proyectos/<slug>/). srcset, width y height son opcionales.
export interface FotoObra {
	src: string;
	alt: string;
	srcset?: string;
	width?: number;
	height?: number;
}

// Una obra tal como está en su JSON (contrato en docs/contenido-obras.md; esquema en
// src/content.config.ts, que es quien la valida).
export interface ObraJson {
	slug: string;
	orden: number;
	estado: Estado;
	nombre: string;
	titular: string | null;
	tipo: TipoObra | null;
	mandante: string | null;
	comuna: string;
	direccion: string | null;
	superficieM2: number | null;
	anio: number | null;
	inicio: string | null;
	servicios: string[];
	desafio: string | null;
	solucion: string | null;
	resultado: string | null;
	fotos: FotoObra[];
	referencia?: string | null;
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

// --- Textos derivados: un campo del JSON tal como se lee en la página. ---

export const textoSuperficie = (m2: number | null) => (m2 === null ? null : formatoSuperficie(m2));
export const textoAnio = (anio: number | null) => (anio ? String(anio) : null);
export const textoEstado = (estado: Estado | null) => (estado ? estados[estado] : null);
// Un slug que el sitio no conoce (lo valida el esquema al publicar) sale tal cual en la vista previa.
export const textoServicios = (slugs: string[]) => slugs.map((s) => servicioPorSlug(s)?.nombre ?? s).join(', ');
// Carrusel: el año solo en las terminadas (el portafolio va una obra por año).
export const anioCarrusel = (estado: Estado | null, anio: number | null) => (estado === 'terminado' ? textoAnio(anio) : null);
// Ficha: la fila de fecha es el año de término en las terminadas y el inicio en las demás.
export const conAnio = (estado: Estado | null) => estado === 'terminado';
export const rotuloInicio = (estado: Estado | null) => (estado === 'contratado' ? 'Inicio previsto' : 'Inicio');
// Líneas compuestas (data-ed-linea): un solo texto, como siempre se armaron. Partirlas en trozos
// con su propio elemento cambia, en algunos glifos, el dibujo del texto en Chrome (subpíxeles).
// Carrusel: «Comuna · 6.220 m² · 2024» (el año, solo en las terminadas).
export const lineaResumen = (comuna: string | null, superficie: string | null, anio: string | null) =>
	`${comuna ?? ''}${superficie ? ` · ${superficie}` : ''}${anio ? ` · ${anio}` : ''}`;
// Lista «En proyecto»: «Tipo · Comuna · 6.220 m²».
export const lineaContratada = (tipo: string | null, comuna: string | null, superficie: string | null) =>
	`${tipo ?? ''}${comuna ? ` · ${comuna}` : ''}${superficie ? ` · ${superficie}` : ''}`;
// Lista «En proyecto» (TarjetaContratada): la línea de arriba del nombre.
export const textoInicioContratada = (inicio: string | null) => (inicio ? `Inicio previsto: ${inicio}` : 'En etapa de proyecto');

export function proyectoDesdeJson(o: ObraJson): Proyecto {
	return {
		slug: o.slug,
		nombre: o.nombre,
		titular: o.titular,
		tipo: o.tipo,
		mandante: o.mandante,
		comuna: o.comuna,
		direccion: o.direccion,
		superficie: textoSuperficie(o.superficieM2),
		anio: o.anio,
		inicio: o.inicio,
		servicios: o.servicios,
		estado: o.estado,
		desafio: o.desafio,
		solucion: o.solucion,
		resultado: o.resultado,
		fotos: o.referencia ? [referenciasDeObra[o.referencia]] : o.fotos,
	};
}

// Orden del sitio: por estado (el de `estados`), después por `orden` y al final por nombre y slug
// (el orden en que el glob entrega los archivos no significa nada).
const ordenEstados = Object.keys(estados);
export const compararObras = (a: ObraJson, b: ObraJson) =>
	ordenEstados.indexOf(a.estado) - ordenEstados.indexOf(b.estado) ||
	a.orden - b.orden ||
	a.nombre.localeCompare(b.nombre, 'es') ||
	(a.slug < b.slug ? -1 : 1);

// Foto principal, o un recuadro gris que dice qué falta: el render (lo que se hará) o la foto
// (lo terminado). Nunca una foto de obra a medio hacer en su lugar.
export const fotoPrincipal = (p: Proyecto): FotoObra | ImagenReferencial =>
	p.fotos[0] ??
	(p.estado === 'terminado'
		? { src: '/proyectos/foto-por-recibir.svg', alt: `Foto de ${p.nombre ?? 'la obra'} por recibir` }
		: { src: '/proyectos/render-por-recibir.svg', alt: `Render de ${p.nombre ?? 'la obra'} por recibir` });
