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

export const bandas = {
	portada: unsplash('1599707254554-027aeb4deacd', 'Grúas sobre un edificio en construcción'),
	empresa: unsplash('1541888946425-d81bb19240f5', 'Equipo de obra sobre una losa'),
	fichaEjemplo: unsplash('1655975719898-8f3432eed322', 'Grúa sobre una estructura en construcción'),
	// Cabeceras de páginas interiores (ObraPortada con imagen).
	proyectos: unsplash('1466803136990-7c174b34ff32', 'Vista aérea de una obra de edificación en la ciudad'),
	contacto: unsplash('1774599730788-a74cd9253b56', 'Equipo revisando planos en terreno'),
	proveedores: unsplash('1763926025477-423847028860', 'Estanterías con barras y perfiles metálicos'),
	error: unsplash('1603465410243-af3e840367dd', 'Maquinaria en una obra detenida'),
	privacidad: unsplash('1487491424367-7571f9afbb30', 'Vista aérea de edificios de altura'),
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

// Equipamiento propio (reunión con don Luis): fotos de stock hasta tener las reales.
export const fotosEquipamiento = {
	vehiculos: unsplash('1628464682320-6a9ae020cb2b', 'Camioneta blanca de doble cabina'),
	maquinaria: unsplash('1777181693263-2a333f0f808d', 'Trabajadores operando una hormigonera en obra'),
	seguridad: unsplash('1662309376159-b95fb193d96b', 'Cascos y chalecos reflectantes colgados en una pared'),
};

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
	empresa: mixkit(46753, 'Dos trabajadores con casco caminan hacia la obra'),
	trabaja: mixkit(31473, 'Trabajadores en obra gruesa de un edificio'),
	timelapse: mixkit(31454, 'Timelapse de grúas trabajando en la construcción de un edificio'),
};
