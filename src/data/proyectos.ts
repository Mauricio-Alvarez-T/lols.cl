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
import { fotosObrasEjemplo, rendersEjemplo, rendersContratados, type ImagenReferencial } from './referencia';

// 'en-curso' conserva el valor de las URLs viejas (/proyectos-en-construccion/ → ?estado=en-curso).
export type Estado = 'en-curso' | 'contratado' | 'terminado';

// Orden en que se muestran en el sitio: lo que está pasando ahora primero.
export const estados: Record<Estado, string> = {
	'en-curso': 'En construcción',
	contratado: 'En proyecto',
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
	// se hará (don Luis, 08-10-2026: nada de fotos por etapa ni videos de avance). Una imagen
	// referencial (con `origen`) se muestra con su etiqueta hasta tener la foto real.
	fotos: ({ src: string; alt: string } | ImagenReferencial)[];
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
// dirección de cada ficha). Fotos de ese sitio, de 480 × 360 px (public/proyectos/<slug>/). En el
// portafolio va una por año (don Luis, 08-10-2026: "las de años anteriores, solo una por año");
// `portafolio` marca la elegida de cada año: propuesta, la elección final es de don Luis.
// Sin el propietario cuando es una persona (don Luis: no agregar nombres de personas).
export const obras2018Reales = [
	{ slug: 'av-espana-778', nombre: 'Av. España 778', anio: 2014, mandante: 'Broncerías Camille Ltda.', direccion: 'Av. España 778, esquina Blanco Encalada 2385 al 2393', foto: 'b_cam_esp', portafolio: true },
	{ slug: 'abate-molina-469', nombre: 'Abate Molina 469', anio: 2016, mandante: 'Comercial Eiffel Ltda.', direccion: 'Abate Molina 469', foto: 'eiffel_am', portafolio: true },
	{ slug: 'esperanza-27', nombre: 'Esperanza 27', anio: 2017, mandante: 'Inmobiliaria e Inversiones Ventura y Cía. Ltda.', direccion: 'Esperanza 27 al 29, esquina Romero 2880 al 2894', foto: 'ventura_esp', portafolio: true },
];

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

// Lo que dice el currículum de cada obra: usos, pisos y subterráneos → titular de la ficha.
const titular = (usos: string, pisos: string, subte = 0) =>
	`${usos}, ${pisos}${subte ? ` y ${subte} subterráneo${subte > 1 ? 's' : ''}` : ''}.`;
const foto = (slug: string, alt: string) => ({ src: `/proyectos/${slug}/1.jpg`, alt });

// Obras del currículum empresarial de LOLS 2026 ("Resumen de obras ejecutadas, en ejecución y en
// proyecto 2018–2026", 42 obras): dirección, pisos, m² construidos, usos y fecha de entrega.
// Fotos y renders del mismo documento; donde no hay, imagen de ejemplo (marcada) hasta tener la
// real (Marcos, 08-10-2026). No se publican los valores de cada obra ni los nombres del equipo.
// Diferencias con la Bóveda a confirmar: Toesca 2770 y 2774 (Bóveda: "Toesca 2074") y Unión
// Americana 325 (Bóveda: "Unión Latinoamericana 325").
export const proyectos: Proyecto[] = [
	// En construcción (currículum: "en etapa de construcción"). Primero las que tienen render en el
	// currículum: la portada muestra las tres primeras. El render de Bascuñán Guerrero 661 dice
	// "Bascuñán Guerrero / Sazie": confirmar que es esta obra.
	obra({ slug: 'bascunan-guerrero-661', nombre: 'Bascuñán Guerrero 661', estado: 'en-curso', tipo: 'Edificio comercial', direccion: 'Bascuñán Guerrero 661', superficie: '6.220 m²', titular: titular('Locales comerciales y bodegas para arriendo', '4 pisos', 1), fotos: [foto('bascunan-guerrero-661', 'Render del edificio en la esquina de Bascuñán Guerrero y Sazié')] }),
	obra({ slug: 'union-americana-325', nombre: 'Unión Americana 325', estado: 'en-curso', tipo: 'Edificio y oficinas', direccion: 'Unión Americana 325', superficie: '1.566 m²', titular: titular('Locales comerciales, bodegas y oficinas', '2 pisos'), fotos: [foto('union-americana-325', 'Render del edificio de Unión Americana 325, con dos locales comerciales')] }),
	obra({ slug: 'toesca-2770', nombre: 'Toesca 2770 y 2774', estado: 'en-curso', tipo: 'Edificio y oficinas', direccion: 'Toesca 2770 y 2774', superficie: '996 m²', titular: 'Dos edificios de locales comerciales, oficinas y vivienda, de 4 pisos y 1 subterráneo cada uno.', fotos: [foto('toesca-2770', 'Render de los edificios de Toesca 2770 y 2774')] }),
	obra({ slug: 'escobar-williams-195', nombre: 'Escobar Williams 195', estado: 'en-curso', tipo: 'Edificio comercial', comuna: 'Cerrillos', direccion: 'Escobar Williams 195', superficie: '5.377 m²', titular: titular('Locales comerciales y bodegas para arriendo', '2 pisos y altillo'), fotos: [rendersEjemplo['escobar-williams-195']] }),
	obra({ slug: 'maipu-40', nombre: 'Maipú 40', estado: 'en-curso', tipo: 'Edificio comercial', direccion: 'Maipú 40-A y 40-B', superficie: '2.686 m²', titular: titular('Locales comerciales y bodegas para arriendo', '4 pisos', 1), fotos: [rendersEjemplo['maipu-40']] }),
	obra({ slug: 'gorbea-3082', nombre: 'Gorbea 3082', estado: 'en-curso', tipo: 'Edificio comercial', direccion: 'Gorbea 3082', superficie: '963 m²', titular: titular('Locales comerciales y bodegas para arriendo', '5 pisos', 1), fotos: [rendersEjemplo['gorbea-3082']] }),
	obra({ slug: 'conferencia-622', nombre: 'Conferencia 622', estado: 'en-curso', tipo: 'Edificio comercial', direccion: 'Conferencia 622', superficie: '912 m²', titular: titular('Locales comerciales, bodegas y vivienda', '5 pisos', 1), fotos: [rendersEjemplo['conferencia-622']] }),
	obra({ slug: 'domeyko-2432', nombre: 'Domeyko 2432', estado: 'en-curso', tipo: 'Edificio comercial', direccion: 'Domeyko 2432', superficie: '873 m²', titular: titular('Locales comerciales, bodegas y vivienda', '4 pisos'), fotos: [rendersEjemplo['domeyko-2432']] }),

	// En proyecto (currículum: "en etapa de proyecto"), con su render.
	obra({ slug: 'romero-3008', nombre: 'Romero 3008', estado: 'contratado', tipo: 'Edificio y oficinas', direccion: 'Romero 3008', superficie: '4.301 m²', titular: titular('Locales comerciales y oficinas', '3 pisos', 2), fotos: [foto('romero-3008', 'Render del edificio de esquina de Romero 3008')] }),
	obra({ slug: 'buzeta-3810', nombre: 'Buzeta 3810', estado: 'contratado', tipo: 'Centro de bodegas', comuna: 'Estación Central', direccion: 'Buzeta 3810', superficie: '27.569 m²', titular: titular('Centro de bodegas', '2 pisos', 1), fotos: [foto('buzeta-3810', 'Render del centro de bodegas de Buzeta 3810')] }),
	obra({ slug: 'abate-molina-502', nombre: 'Abate Molina 502', estado: 'contratado', tipo: 'Edificio y oficinas', direccion: 'Abate Molina 502', superficie: '2.418 m²', titular: titular('Locales comerciales, bodegas y oficinas', '4 pisos', 1), fotos: [foto('abate-molina-502', 'Render del edificio de esquina de Abate Molina 502')] }),
	obra({ slug: 'abate-molina-626', nombre: 'Abate Molina 626', estado: 'contratado', tipo: 'Edificio y oficinas', direccion: 'Abate Molina 626', superficie: '1.588 m²', titular: titular('Locales comerciales, bodegas y oficinas', '4 pisos'), fotos: [foto('abate-molina-626', 'Render del edificio de Abate Molina 626')] }),
	obra({ slug: 'abate-molina-516', nombre: 'Abate Molina 516', estado: 'contratado', tipo: 'Edificio y oficinas', direccion: 'Abate Molina 516 y 520', superficie: '1.245 m²', titular: titular('Locales comerciales, bodegas y oficinas', '3 pisos'), fotos: [foto('abate-molina-516', 'Render del edificio de Abate Molina 516 y 520')] }),
	obra({ slug: 'abate-molina-51', nombre: 'Abate Molina 51', estado: 'contratado', tipo: 'Edificio y oficinas', direccion: 'Abate Molina 51', superficie: '3.374 m²', titular: titular('Locales comerciales, bodegas y oficinas', '2 pisos'), fotos: [rendersContratados[1]] }),
	obra({ slug: 'alameda-2740', nombre: 'Portal Edwards', estado: 'contratado', tipo: 'Habilitación', direccion: 'Alameda 2740, piso 2', titular: 'Locales comerciales y bodegas en el segundo piso del Portal Edwards, en estructura metálica.', fotos: [foto('alameda-2740', 'Render del acceso a los locales del segundo piso del Portal Edwards')] }),

	// Terminadas: las de 2026 todas (don Luis: "de aquí en adelante, todas") y, de los años
	// anteriores, una por año (la más grande con foto). Sin obras en el currículum: 2021, 2023 y 2024.
	obra({ slug: 'san-alfonso-607', nombre: 'San Alfonso 607', estado: 'terminado', anio: 2026, tipo: 'Edificio comercial', direccion: 'San Alfonso 607', superficie: '1.436 m²', titular: titular('Locales comerciales y bodegas para arriendo', '4 pisos', 1), fotos: [fotosObrasEjemplo['san-alfonso-607']] }),
	obra({ slug: 'abate-molina-80', nombre: 'Abate Molina 80', estado: 'terminado', anio: 2026, tipo: 'Edificio y oficinas', direccion: 'Abate Molina 80', superficie: '1.867 m²', titular: titular('Locales comerciales, bodegas y oficinas', '2 pisos'), fotos: [fotosObrasEjemplo['abate-molina-80']] }),
	obra({ slug: 'abate-molina-676', nombre: 'Abate Molina 676', estado: 'terminado', anio: 2026, tipo: 'Edificio comercial', direccion: 'Abate Molina 676', superficie: '1.282 m²', titular: titular('Locales comerciales y bodegas', '3 pisos', 1), fotos: [fotosObrasEjemplo['abate-molina-676']] }),
	obra({ slug: 'monumento-2212', nombre: 'Monumento 2212', estado: 'terminado', anio: 2026, tipo: 'Edificio comercial', comuna: 'Maipú', direccion: 'Monumento 2212', superficie: '738 m²', titular: titular('Locales comerciales', '2 pisos'), fotos: [foto('monumento-2212', 'Render del edificio de locales comerciales de Monumento 2212')] }),
	obra({ slug: 'abate-molina-321', nombre: 'Abate Molina 321', estado: 'terminado', anio: 2025, tipo: 'Edificio comercial', direccion: 'Abate Molina 321', superficie: '1.682 m²', titular: titular('Locales comerciales y bodegas', '4 pisos', 1), fotos: [fotosObrasEjemplo['abate-molina-321']] }),
	obra({ slug: 'enfermera-lucia-vidal-arias-6679', nombre: 'Enfermera Lucía Vidal Arias 6679', estado: 'terminado', anio: 2022, tipo: 'Centro de bodegas', comuna: 'Cerrillos', direccion: 'Enfermera Lucía Vidal Arias 6679', superficie: '5.192 m²', titular: titular('Locales comerciales y bodegas', '3 pisos'), fotos: [foto('enfermera-lucia-vidal-arias-6679', 'Centro de bodegas de techo rojo en Enfermera Lucía Vidal Arias 6679, Cerrillos')] }),
	obra({ slug: 'bascunan-guerrero-818', nombre: 'Bascuñán Guerrero 818', estado: 'terminado', anio: 2020, tipo: 'Edificio comercial', direccion: 'Bascuñán Guerrero 818', superficie: '2.445 m²', titular: titular('Locales comerciales, oficinas y bodegas', '2 pisos', 1), fotos: [foto('bascunan-guerrero-818', 'Edificio de esquina de Bascuñán Guerrero 818')] }),
	obra({ slug: 'abate-molina-221', nombre: 'Abate Molina 221', estado: 'terminado', anio: 2019, mandante: 'Electrónica Kolm Ltda.', tipo: 'Edificio y oficinas', direccion: 'Abate Molina 221', superficie: '3.452 m²', titular: titular('Locales comerciales y oficinas', '2 pisos', 1), fotos: [foto('abate-molina-221', 'Edificio de Electrónica Kolm en Abate Molina 221')] }),
	obra({ slug: 'abate-molina-211', nombre: 'Abate Molina 211', estado: 'terminado', anio: 2018, mandante: 'Electrónica Kolm Ltda.', tipo: 'Edificio y oficinas', direccion: 'Abate Molina 211, esquina Sazié 2605', superficie: '581 m²', titular: titular('Locales comerciales y oficinas', '6 pisos'), fotos: [foto('abate-molina-211', 'Edificio de seis pisos en la esquina de Abate Molina y Sazié')] }),
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
				fotos: [foto(o.slug, `Edificio de ${o.nombre}, obra terminada por LOLS en ${o.anio}`)],
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
