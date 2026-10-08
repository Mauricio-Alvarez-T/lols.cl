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
	servicios: string[]; // slugs de src/data/empresa.ts
	estado: Estado | null;
	desafio: string | null;
	solucion: string | null;
	resultado: string | null;
	// Terminadas: fotos de la obra terminada. En construcción y contratadas: el render de lo que
	// se hará (don Luis, 08-10-2026: nada de fotos por etapa ni videos de avance).
	fotos: { src: string; alt: string }[];
}

// Datos que no se saben de una obra real quedan en null (la ficha no los muestra).
const obra = (datos: Partial<Proyecto> & Pick<Proyecto, 'slug' | 'nombre' | 'estado'>): Proyecto => ({
	titular: null,
	tipo: null,
	mandante: null,
	comuna: 'Santiago',
	direccion: null,
	superficie: null,
	anio: null,
	inicio: null,
	servicios: ['construccion'],
	desafio: null,
	solucion: null,
	resultado: null,
	fotos: [],
	...datos,
});

// Obras terminadas del sitio de 2018 (respaldo-wp/: proyecto, fecha de entrega, propietario y
// dirección de cada ficha). Fotos de ese sitio, de 480 × 360 px (public/proyectos/<slug>/).
// Todas van en "Han confiado en nosotros" (foto y dirección). En el portafolio va una por año
// (don Luis, 08-10-2026: "las de años anteriores, solo una por año"); `portafolio` marca la
// elegida de cada año: propuesta, la elección final es de don Luis.
// Sin el propietario cuando es una persona (don Luis: no agregar nombres de personas).
export const obras2018Reales = [
	{ slug: 'av-espana-778', nombre: 'Av. España 778', anio: 2014, mandante: 'Broncerías Camille Ltda.', direccion: 'Av. España 778, esquina Blanco Encalada 2385 al 2393', foto: 'b_cam_esp', portafolio: true },
	{ slug: 'abate-molina-469', nombre: 'Abate Molina 469', anio: 2016, mandante: 'Comercial Eiffel Ltda.', direccion: 'Abate Molina 469', foto: 'eiffel_am', portafolio: true },
	{ slug: 'esperanza-27', nombre: 'Esperanza 27', anio: 2017, mandante: 'Inmobiliaria e Inversiones Ventura y Cía. Ltda.', direccion: 'Esperanza 27 al 29, esquina Romero 2880 al 2894', foto: 'ventura_esp', portafolio: true },
	{ slug: 'abate-molina-165', nombre: 'Abate Molina 165', anio: 2017, mandante: 'Inversiones Millenia Ltda.', direccion: 'Abate Molina 165 al 171', foto: 'zhu_am', portafolio: false },
	{ slug: 'abate-molina-201', nombre: 'Abate Molina 201', anio: 2018, mandante: 'Electrónica Kolm Ltda.', direccion: 'Abate Molina 211, esquina Sazié 2604', foto: 'abate', portafolio: true },
	{ slug: 'bascunan-guerrero-402', nombre: 'Bascuñán Guerrero 402', anio: 2018, mandante: 'Inmobiliaria e Inversiones Renacer SpA', direccion: 'Bascuñán Guerrero 402 al 416, Gorbea 2790 al 2798', foto: 'renacer_bas', portafolio: false },
	{ slug: 'san-alfonso-516', nombre: 'San Alfonso 516', anio: 2018, mandante: null, direccion: 'San Alfonso 516 al 520', foto: 'mak_sa', portafolio: false },
	{ slug: 'abate-molina-221', nombre: 'Abate Molina 221', anio: 2018, mandante: 'Electrónica Kolm Ltda.', direccion: 'Abate Molina 221', foto: 'kolm_am', portafolio: false },
];

export const proyectos: Proyecto[] = [
	// En construcción: obras activas de la Bóveda LOLS (tabla `obras`, octubre de 2026), con la
	// dirección registrada ahí. Faltan el render, el tipo, la superficie y el inicio de cada una.
	// Quedaron fuera las activas sin dirección en la Bóveda: Blanco Encalada, Rivas Vicuña y Domeyko.
	obra({ slug: 'escobar-williams-195', nombre: 'Escobar Williams 195', estado: 'en-curso', comuna: 'Cerrillos', direccion: 'Escobar Williams 195' }),
	obra({ slug: 'conferencia-622', nombre: 'Conferencia 622', estado: 'en-curso', direccion: 'Conferencia 622' }),
	obra({ slug: 'bascunan-guerrero-661', nombre: 'Bascuñán Guerrero 661', estado: 'en-curso', direccion: 'Bascuñán Guerrero 661' }),
	obra({ slug: 'union-latinoamericana-325', nombre: 'Unión Latinoamericana 325', estado: 'en-curso', direccion: 'Unión Latinoamericana 325' }),
	obra({ slug: 'gorbea-3082', nombre: 'Gorbea 3082', estado: 'en-curso', direccion: 'Gorbea 3082' }),
	obra({ slug: 'toesca-2074', nombre: 'Toesca 2074', estado: 'en-curso', direccion: 'Toesca 2074' }),
	// Terminadas en 2026 (Bóveda: fecha de fin mayo y junio de 2026). Faltan las fotos.
	obra({ slug: 'abate-molina-676', nombre: 'Abate Molina 676', estado: 'terminado', anio: 2026, direccion: 'Abate Molina 676' }),
	obra({ slug: 'abate-molina-80', nombre: 'Abate Molina 80', estado: 'terminado', anio: 2026, direccion: 'Abate Molina 80' }),
	// De 2019 a 2025 falta la obra de cada año (la elige don Luis).
	...obras2018Reales
		.filter((o) => o.portafolio)
		.reverse()
		.map((o) =>
			obra({
				slug: o.slug,
				nombre: o.nombre,
				estado: 'terminado',
				anio: o.anio,
				mandante: o.mandante,
				direccion: o.direccion,
				fotos: [{ src: `/proyectos/${o.slug}/1.jpg`, alt: `Edificio de ${o.nombre}, obra terminada por LOLS en ${o.anio}` }],
			}),
		),
];

export const proyectosPorEstado = (estado: Estado) => proyectos.filter((p) => p.estado === estado);

// Foto principal, o un recuadro gris que dice qué falta: el render (lo que se hará) o la foto
// (lo terminado). Nunca una foto de obra a medio hacer en su lugar.
export const fotoPrincipal = (p: Proyecto) =>
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
