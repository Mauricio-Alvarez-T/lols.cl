// Imágenes REFERENCIALES para revisar el diseño mientras no hay fotos definitivas.
// Todas se muestran con una etiqueta visible y el build de producción falla si queda alguna
// (componente Referencial). Reemplazar por fotos propias en alta resolución.
//
//   unsplash  → fotos genéricas de Unsplash (licencia libre), enlazadas desde su CDN.
//   lols-2018 → obras reales de LOLS del sitio de 2018 (respaldo-wp/), sin el marco verde,
//               pero de ~370 px: sirven para tarjetas, no para bandas grandes. Las 7
//               "en construcción" de 2018 son renders, no fotos.

export type Origen = 'unsplash' | 'lols-2018' | 'render-2018';

export interface ImagenReferencial {
	src: string;
	srcset?: string;
	alt: string;
	origen: Origen;
	// Datos de ejemplo para la tarjeta de proyecto (modo propuesta).
	ejemplo?: EjemploTarjeta;
}

export interface EjemploTarjeta {
	nombre: string;
	tipo: string;
	comuna: string;
	superficie: string;
	anio?: string; // terminados
	direccion?: string; // en construcción
	inicio?: string; // en construcción: desde cuándo
}

const unsplash = (id: string, alt: string, extra = ''): ImagenReferencial => {
	const url = (w: number) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop${extra}`;
	return { src: url(1600), srcset: [800, 1400, 2200].map((w) => `${url(w)} ${w}w`).join(', '), alt, origen: 'unsplash' };
};

const lols = (archivo: string, alt: string, ejemplo?: ImagenReferencial['ejemplo']): ImagenReferencial => ({
	src: `/referencia/obras-2018/${archivo}`,
	alt,
	origen: 'lols-2018',
	ejemplo,
});

// Render de una obra de LOLS del sitio de 2018 (las "en construcción" de entonces). Hace de foto de
// la obra terminada hasta tener la real.
export const render2018 = (archivo: string, alt: string): ImagenReferencial => ({
	src: `/referencia/obras-2018/${archivo}`,
	alt,
	origen: 'render-2018',
});

export const bandas = {
	portada: unsplash('1599707254554-027aeb4deacd', 'Grúas sobre un edificio en construcción'),
	empresa: unsplash('1541888946425-d81bb19240f5', 'Equipo de obra sobre una losa'),
	fichaEjemplo: unsplash('1655975719898-8f3432eed322', 'Grúa sobre una estructura en construcción'),
	// Cabeceras de páginas interiores (ObraPortada con imagen).
	proyectos: unsplash('1466803136990-7c174b34ff32', 'Vista aérea de una obra de edificación en la ciudad'),
	contacto: unsplash('1774599730788-a74cd9253b56', 'Equipo revisando planos en terreno'),
	error: unsplash('1603465410243-af3e840367dd', 'Maquinaria en una obra detenida'),
	privacidad: unsplash('1487491424367-7571f9afbb30', 'Vista aérea de edificios de altura'),
};

export const bandasServicio: Record<string, ImagenReferencial> = {
	construccion: unsplash('1609867271967-a82f85c48531', 'Faena de construcción con grúa'),
	'montaje-industrial': unsplash('1509024368907-57294758cfc5', 'Estructura metálica'),
	electricidad: unsplash('1635335874521-7987db781153', 'Tablero eléctrico cableado'),
};

export const destacado = lols('abate-vertical.jpg', 'Edificio de cinco pisos en esquina, obra LOLS');

// Obras terminadas del sitio de 2018 (fotos reales). Don Luis pidió sacar lo antiguo: en el
// sitio final van las obras terminadas que él elija, con fotos nuevas. Mientras tanto sirven
// de muestra para la sección "Terminados".
// El nombre, tipo, comuna, superficie y año de cada tarjeta son de EJEMPLO, no datos reales.
export const obras2018 = [
	lols('ventura_esp.jpg', 'Edificio comercial de tres pisos, obra LOLS', { nombre: 'Edificio comercial', tipo: 'Edificio comercial', comuna: 'Santiago', superficie: '1.850 m²', anio: '2024' }),
	lols('kolm_am.jpg', 'Edificio comercial con fachada gris y franja verde, obra LOLS', { nombre: 'Local y bodegas', tipo: 'Bodegaje', comuna: 'Santiago', superficie: '2.400 m²', anio: '2024' }),
	lols('renacer_bas.jpg', 'Edificio con fachada roja, obra LOLS', { nombre: 'Edificio de locales', tipo: 'Edificio comercial', comuna: 'Estación Central', superficie: '1.200 m²', anio: '2023' }),
	lols('eiffel_am.jpg', 'Edificio de fachada blanca y azul, obra LOLS', { nombre: 'Oficinas y comercio', tipo: 'Edificio y oficinas', comuna: 'Santiago', superficie: '3.100 m²', anio: '2023' }),
	lols('mak_sa.jpg', 'Edificio de fachada naranja y amarilla, obra LOLS', { nombre: 'Edificio comercial', tipo: 'Edificio comercial', comuna: 'Santiago', superficie: '980 m²', anio: '2022' }),
	lols('zhu_am.jpg', 'Edificio comercial de ladrillo, obra LOLS', { nombre: 'Centro comercial', tipo: 'Edificio comercial', comuna: 'Santiago', superficie: '4.300 m²', anio: '2022' }),
	lols('kolm_sa.jpg', 'Edificio de dos cuerpos color café, obra LOLS', { nombre: 'Edificio de oficinas', tipo: 'Edificio de oficinas', comuna: 'Santiago', superficie: '2.750 m²', anio: '2021' }),
	lols('b_cam_esp.jpg', 'Edificio de fachada azul, obra LOLS', { nombre: 'Local comercial', tipo: 'Habilitación', comuna: 'Estación Central', superficie: '640 m²', anio: '2021' }),
];

// Obras en construcción (reunión con don Luis): fotos de stock hasta tener las de Rodrigo.
// Nombre, tipo, comuna, dirección y superficie son de EJEMPLO.
export const obrasEnCurso = [
	{
		...unsplash('1508450859948-4e04fabaa4ea', 'Edificio de hormigón en obra gruesa'),
		ejemplo: { nombre: 'Edificio Los Conquistadores', tipo: 'Edificio y oficinas', comuna: 'Providencia', direccion: 'Av. Ejemplo 1234', superficie: '6.800 m²', inicio: 'Marzo 2026' },
	},
	{
		...unsplash('1649587345666-0f4ad68aa723', 'Estructura metálica de una nave de bodegas en montaje'),
		ejemplo: { nombre: 'Centro de bodegas Lo Espejo', tipo: 'Centro de bodegas', comuna: 'Lo Espejo', direccion: 'Camino Ejemplo 850', superficie: '12.500 m²', inicio: 'Enero 2026' },
	},
	{
		...unsplash('1644221150167-fb4fafa7f411', 'Edificio en construcción con grúa'),
		ejemplo: { nombre: 'Oficinas Quilicura', tipo: 'Edificio de oficinas', comuna: 'Quilicura', direccion: 'Calle Ejemplo 455', superficie: '3.900 m²', inicio: 'Junio 2026' },
	},
] satisfies ImagenReferencial[];

// Obras terminadas de EJEMPLO, una por año de 2021 a 2025 (Marcos, 08-10-2026: "inventa fotos hasta
// que nos pasen las fotos reales"). Nombre, tipo, comuna, superficie y año también son de ejemplo.
export const obrasEjemplo = [
	{ ...unsplash('1776179806507-b70623e680a2', 'Edificio comercial de fachada blanca y roja'), ejemplo: { nombre: 'Locales comerciales Estación Central', tipo: 'Edificio comercial', comuna: 'Estación Central', superficie: '1.400 m²', anio: '2025' } },
	{ ...unsplash('1766793110924-98e05b48eadc', 'Bodega de fachada metálica con portón'), ejemplo: { nombre: 'Bodegas Cerrillos', tipo: 'Bodegaje', comuna: 'Cerrillos', superficie: '2.200 m²', anio: '2024' } },
	{ ...unsplash('1543892607-04657ef3a279', 'Edificio de oficinas de tres pisos con ventanales'), ejemplo: { nombre: 'Oficinas Santiago Centro', tipo: 'Edificio de oficinas', comuna: 'Santiago', superficie: '1.900 m²', anio: '2023' } },
	{ ...unsplash('1759310347467-578dfd846229', 'Nave industrial de planchas metálicas junto a la calle'), ejemplo: { nombre: 'Nave industrial Quilicura', tipo: 'Industrial', comuna: 'Quilicura', superficie: '3.500 m²', anio: '2022' } },
	{ ...unsplash('1611570884860-6f9d61c3a64d', 'Edificio de fachada oscura con ventanales'), ejemplo: { nombre: 'Edificio comercial Independencia', tipo: 'Edificio comercial', comuna: 'Independencia', superficie: '1.100 m²', anio: '2021' } },
] satisfies ImagenReferencial[];

// Equipamiento propio (reunión con don Luis): fotos de stock hasta tener las reales.
// Renders de EJEMPLO para las obras en construcción, hasta tener el render real de cada una
// (Marcos, 09-10-2026). Imágenes de edificios terminados, nunca de obra a medio hacer.
export const rendersEjemplo: Record<string, ImagenReferencial> = {
	'escobar-williams-195': unsplash('1790005332509-0b4723519472', 'Render de ejemplo: edificio de cinco pisos con fachada de malla metálica'),
	'conferencia-622': unsplash('1654230163544-b69049014b60', 'Render de ejemplo: edificio comercial vidriado con locales en el primer piso'),
	'bascunan-guerrero-661': unsplash('1758448617677-2f8bebc56d9e', 'Render de ejemplo: edificio de varios pisos con acceso vidriado'),
	'union-latinoamericana-325': unsplash('1790214120372-4b3b06e2360a', 'Render de ejemplo: edificio comercial de tres pisos con celosías de madera'),
	'gorbea-3082': unsplash('1784894690165-8c6fe7dae24d', 'Render de ejemplo: edificio de cinco pisos con balcones y locales'),
	'toesca-2074': unsplash('1678388583153-f0e667c97288', 'Render de ejemplo: edificio de oficinas rodeado de árboles'),
};

// Fotos de EJEMPLO de obras reales que aún no tienen la suya (las terminadas en 2026).
export const fotosObrasEjemplo: Record<string, ImagenReferencial> = {
	'abate-molina-676': unsplash('1587994990528-14263e4ee443', 'Edificio de fachada blanca con ventanas verticales'),
	'abate-molina-80': unsplash('1623051786552-e46ef84e6c07', 'Edificio de fachada vidriada'),
};

// Tipos de andamio que se usan en Chile y que calzan con las piezas del inventario de la Bóveda
// (verticales, horizontales y diagonales; andamio saliente y ménsulas; ruedas). Fotos de ejemplo.
export const fotosAndamios: Record<string, ImagenReferencial> = {
	multidireccional: unsplash('1762248576542-f98e883f3fbd', 'Unión de un andamio multidireccional: vertical con roseta y horizontales'),
	saliente: unsplash('1636362006544-22445420703f', 'Trabajador sobre la plataforma de un andamio en el borde de un edificio'),
	movil: unsplash('1702392183172-17fdef8002b4', 'Torre de andamio liviana junto a un muro'),
};

export const fotosEquipamiento: Record<string, ImagenReferencial> = {
	alzaprimas: unsplash('1666796776547-5c25a077d9af', 'Alzaprimas y vigas bajo el moldaje de una losa'),
	moldajes: unsplash('1575971637203-d6255d9947a9', 'Paneles de moldaje para muros en una obra'),
	andamios: unsplash('1636362556682-11231883c01c', 'Edificio en altura cubierto de andamios'),
	maquinaria: unsplash('1620388640785-892616248ec8', 'Grúa horquilla moviendo material en una bodega'),
	vehiculos: unsplash('1628464682320-6a9ae020cb2b', 'Camioneta blanca de doble cabina'),
	seguridad: unsplash('1662309376159-b95fb193d96b', 'Cascos y chalecos reflectantes colgados en una pared'),
};

// Videos de stock (Mixkit, licencia libre, enlazados desde su CDN). Uso según
// docs/investigacion-secciones.md: loops decorativos donde suman ambiente (portada, seguridad,
// trabaja con nosotros). El timelapse de la ficha de proyecto se sacó (don Luis: nada de videos de avance).
// Peso: 720p ≤ 5 MB en los loops; 360p (< 1 MB) en celular. Componente VideoFondo.
export interface VideoReferencial {
	id: number;
	alt: string;
	poster: string;
	src720: string;
	src360: string;
}

const mixkit = (id: number, alt: string): VideoReferencial => ({
	id,
	alt,
	poster: `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`,
	src720: `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`,
	src360: `https://assets.mixkit.co/videos/${id}/${id}-360.mp4`,
});

export const videos = {
	portada: mixkit(4010, 'Vista aérea de edificios en construcción con grúas'),
	seguridad: mixkit(23170, 'Dos profesionales con casco revisan planos en obra'),
	empresa: mixkit(46753, 'Dos trabajadores con casco caminan hacia la obra'),
	trabaja: mixkit(31473, 'Trabajadores en obra gruesa de un edificio'),
};
