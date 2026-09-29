// Imágenes REFERENCIALES para revisar el diseño mientras no hay fotos definitivas.
// Todas se muestran con una etiqueta visible y el build de producción falla si queda alguna
// (componente Referencial). Reemplazar por fotos propias en alta resolución.
//
//   unsplash  → fotos genéricas de Unsplash (licencia libre), enlazadas desde su CDN.
//   lols-2018 → obras reales de LOLS del sitio de 2018 (respaldo-wp/), sin el marco verde,
//               pero de ~370 px: sirven para tarjetas, no para bandas grandes. Las 7
//               "en construcción" de 2018 son renders, no fotos.

export type Origen = 'unsplash' | 'lols-2018';

export interface ImagenReferencial {
	src: string;
	srcset?: string;
	alt: string;
	origen: Origen;
	// Datos de ejemplo para la tarjeta de proyecto (modo propuesta).
	ejemplo?: { nombre: string; servicio: string; comuna: string; anio: string };
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

export const bandas = {
	portada: unsplash('1599707254554-027aeb4deacd', 'Grúas sobre un edificio en construcción'),
	empresa: unsplash('1541888946425-d81bb19240f5', 'Equipo de obra sobre una losa'),
	fichaEjemplo: unsplash('1655975719898-8f3432eed322', 'Grúa sobre una estructura en construcción'),
};

export const bandasServicio: Record<string, ImagenReferencial> = {
	construccion: unsplash('1609867271967-a82f85c48531', 'Faena de construcción con grúa'),
	'montaje-industrial': unsplash('1509024368907-57294758cfc5', 'Estructura metálica'),
	mantencion: unsplash('1642749776312-aa42ce20c9f5', 'Técnicos revisando equipos de climatización en una azotea'),
	electricidad: unsplash('1635335874521-7987db781153', 'Tablero eléctrico cableado'),
	'voz-y-datos': unsplash('1544197150-b99a580bb7a8', 'Patch panel de red con cables'),
	muebles: unsplash('1590880795696-20c7dfadacde', 'Taller de carpintería'),
};

export const destacado = lols('abate-vertical.jpg', 'Edificio de cinco pisos en esquina, obra LOLS');

// Obras terminadas del sitio de 2018 (fotos reales).
// El nombre, comuna y año de cada tarjeta son de EJEMPLO (modo propuesta), no datos reales.
export const obras2018 = [
	lols('ventura_esp.jpg', 'Edificio comercial de tres pisos, obra LOLS', { nombre: 'Edificio comercial', servicio: 'Construcción', comuna: 'Santiago', anio: '2017' }),
	lols('kolm_am.jpg', 'Edificio comercial con fachada gris y franja verde, obra LOLS', { nombre: 'Local y bodegas', servicio: 'Construcción', comuna: 'Santiago', anio: '2017' }),
	lols('renacer_bas.jpg', 'Edificio con fachada roja, obra LOLS', { nombre: 'Edificio de locales', servicio: 'Construcción', comuna: 'Estación Central', anio: '2016' }),
	lols('eiffel_am.jpg', 'Edificio de fachada blanca y azul, obra LOLS', { nombre: 'Oficinas y comercio', servicio: 'Construcción', comuna: 'Santiago', anio: '2018' }),
	lols('mak_sa.jpg', 'Edificio de fachada naranja y amarilla, obra LOLS', { nombre: 'Edificio comercial', servicio: 'Electricidad', comuna: 'Santiago', anio: '2016' }),
	lols('zhu_am.jpg', 'Edificio comercial de ladrillo, obra LOLS', { nombre: 'Centro comercial', servicio: 'Montaje industrial', comuna: 'Santiago', anio: '2015' }),
	lols('kolm_sa.jpg', 'Edificio de dos cuerpos color café, obra LOLS', { nombre: 'Edificio de oficinas', servicio: 'Construcción', comuna: 'Santiago', anio: '2015' }),
	lols('b_cam_esp.jpg', 'Edificio de fachada azul, obra LOLS', { nombre: 'Local comercial', servicio: 'Voz y datos', comuna: 'Estación Central', anio: '2014' }),
];

// Retratos de stock para la persona de contacto y el equipo (nombres de ejemplo).
const retrato = (id: string, alt: string) => unsplash(id, alt, '&crop=faces');
export const retratos = {
	contacto: retrato('1672748341520-6a839e6c05bb', 'Retrato de ejemplo: profesional con casco rojo'),
	equipo: [
		retrato('1621905252472-943afaa20e20', 'Retrato de ejemplo: profesional con casco en la mano'),
		retrato('1688841747582-41097036109d', 'Retrato de ejemplo: profesional con casco y chaleco'),
		retrato('1787672357797-f5fa35bb0d18', 'Retrato de ejemplo: técnico con overol azul'),
		retrato('1587715718640-987708ba38e1', 'Retrato de ejemplo: profesional en obra'),
	],
};

// Logos genéricos de clientes (public/referencia/logos/, no son marcas reales).
export const logosEjemplo = ['constructora', 'inmobiliaria', 'retail', 'industrial', 'logistica', 'energia'].map(
	(n) => `/referencia/logos/${n}.svg`,
);

// Videos de stock (Mixkit, licencia libre, enlazados desde su CDN). Uso según
// docs/investigacion-secciones.md: loops decorativos donde suman ambiente (portada, seguridad,
// trabaja con nosotros) y un timelapse que se reproduce al hacer clic en la ficha de proyecto.
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
	trabaja: mixkit(31473, 'Trabajadores en obra gruesa de un edificio'),
	timelapse: mixkit(31454, 'Timelapse de grúas trabajando en la construcción de un edificio'),
};
