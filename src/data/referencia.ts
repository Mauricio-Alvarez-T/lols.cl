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
}

const unsplash = (id: string, alt: string): ImagenReferencial => {
	const url = (w: number) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;
	return { src: url(1600), srcset: [800, 1400, 2200].map((w) => `${url(w)} ${w}w`).join(', '), alt, origen: 'unsplash' };
};

const lols = (archivo: string, alt: string): ImagenReferencial => ({
	src: `/referencia/obras-2018/${archivo}`,
	alt,
	origen: 'lols-2018',
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
export const obras2018 = [
	lols('ventura_esp.jpg', 'Edificio comercial de tres pisos, obra LOLS'),
	lols('kolm_am.jpg', 'Edificio comercial con fachada gris y franja verde, obra LOLS'),
	lols('renacer_bas.jpg', 'Edificio con fachada roja, obra LOLS'),
	lols('eiffel_am.jpg', 'Edificio de fachada blanca y azul, obra LOLS'),
	lols('mak_sa.jpg', 'Edificio de fachada naranja y amarilla, obra LOLS'),
	lols('zhu_am.jpg', 'Edificio comercial de ladrillo, obra LOLS'),
	lols('kolm_sa.jpg', 'Edificio de dos cuerpos color café, obra LOLS'),
	lols('b_cam_esp.jpg', 'Edificio de fachada azul, obra LOLS'),
];
