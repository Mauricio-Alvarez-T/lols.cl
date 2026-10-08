// Datos de la empresa. Fuente y estado de cada dato: docs/brief.md § 4.
// Dirección, teléfono, WhatsApp, correo, RUT y razón social confirmados por Marcos (octubre de
// 2026); horario y correos, respuestas de don Luis a las preguntas para la jefatura (08-10-2026).
import type { NombrePictograma } from './pictogramas';

export const empresa = {
	razonSocial: 'LOLS Empresa de Ingeniería Limitada',
	rut: '77.085.560-8',
	lema: 'Sus proyectos en las mejores manos',
	directrices: 'Experiencia, seguridad y calidad son nuestras directrices.',
	direccion: { valor: 'El Mirador 150, Cerrillos, Santiago' },
	telefono: { valor: '+56 652 710 609' },
	// También recibe las postulaciones (CV): don Luis, 08-10-2026.
	correo: { valor: 'lols@lols.cl' },
	horario: 'Lunes a viernes, de 9:00 a 17:00',
	// Única mutualidad o registro que se muestra (don Luis: "solo la mutual").
	mutual: 'Mutual de Seguridad CChC',
	// Número de WhatsApp comercial (formato 56XXXXXXXXX). Mientras sea null, los botones
	// abren WhatsApp sin destinatario y el build de producción falla (marcador en BarraContacto).
	whatsapp: '56652710609' as string | null,
};

// Año de fundación (reunión con don Luis, 2026). Los años de trayectoria se calculan al
// construir el sitio, así que se actualizan solos cada año con el siguiente deploy.
export const fundacion = 1995;
export const aniosTrayectoria = new Date().getFullYear() - fundacion;

// Equipamiento propio. Cuatro categorías salen del inventario de la Bóveda LOLS (categorías
// ANDAMIOS, ALZAPRIMAS, MOLDAJES y MAQUINARIA; ítems del catálogo de marzo de 2026). Vehículos
// y seguridad vienen de la reunión con don Luis. El camión con pluma está en el inventario
// (ítem 115, camión Hyundai con pluma hidráulica).
// Sin cantidades y sin repetir en cada ítem el nombre de la categoría (don Luis, 08-10-2026).
// Un ítem con `revisar` se muestra marcado hasta que se confirme que es equipo propio.
// `tipos`: variantes con foto de ejemplo (src/data/referencia.ts, mismas claves).
export interface CategoriaEquipo {
	clave: string;
	titulo: string;
	pictograma: NombrePictograma;
	tipos?: { clave: string; nombre: string; texto: string }[];
	items: (string | { texto: string; revisar: string })[];
}

export const equipamiento: CategoriaEquipo[] = [
	{
		clave: 'alzaprimas',
		titulo: 'Alzaprimas y vigas',
		pictograma: 'alzaprima',
		items: ['Cerradas de 1,9 a 3,5 m', 'Telescópicas de hasta 6,6 m', 'Vigas de 3 a 4 m', 'Vigas PERI'],
	},
	{
		clave: 'moldajes',
		titulo: 'Moldajes',
		pictograma: 'moldaje',
		items: ['Paneles fenólicos de 10 × 60 a 60 × 150 cm', 'Esquineros y ángulos', 'Alineadores de 3 y 6 m', 'Separadores de muro, pernos y tuercas', 'Cabezales, trípodes y escuadras de muro'],
	},
	{
		clave: 'andamios',
		titulo: 'Andamios',
		pictograma: 'andamio',
		// Sin "tipo europeo" (Marcos, 08-10-2026): los tipos que se usan en Chile y que calzan con las
		// piezas del inventario de la Bóveda.
		tipos: [
			{ clave: 'multidireccional', nombre: 'Multidireccional', texto: 'Verticales, horizontales y diagonales para armar en altura alrededor de la obra.' },
			{ clave: 'saliente', nombre: 'Saliente', texto: 'Apoyado en ménsulas, para trabajar en el borde de losas y fachadas.' },
			{ clave: 'movil', nombre: 'Móvil', texto: 'Torre sobre ruedas que se traslada por la obra, para interiores y terminaciones.' },
		],
		items: ['Patas regulables', 'Bandejas, tablones y escaleras', 'Malla de seguridad'],
	},
	{
		clave: 'maquinaria',
		titulo: 'Maquinaria',
		pictograma: 'maquinaria',
		items: ['Grúa horquilla de 5 t', 'Bombas de hormigón y hormigoneras', 'Elevadores de 4 a 12 m', 'Mini retroexcavadora', 'Cortadora y dobladora de fierro', 'Placa compactadora y soldadora', 'Contenedores de oficina, baño y bodega para la faena'],
	},
	{
		clave: 'vehiculos',
		titulo: 'Vehículos',
		pictograma: 'vehiculo',
		items: ['Camión con pluma', 'Camiones', 'Camionetas'],
	},
	{
		clave: 'seguridad',
		titulo: 'Seguridad',
		pictograma: 'seguridad',
		items: ['Elementos de protección personal (EPP)', 'Equipos de seguridad para faena'],
	},
];

export const telefonoHref = (t: string) => 'tel:' + t.replace(/[^\d+]/g, '');

export const whatsappHref = (mensaje = 'Hola, quisiera cotizar un proyecto con LOLS Ingeniería.') =>
	`https://wa.me/${empresa.whatsapp ?? ''}?text=${encodeURIComponent(mensaje)}`;

// Textos institucionales del sitio de 2018 (brief § 4).
export const valores = [
	{ titulo: 'Esfuerzo', texto: null },
	{ titulo: 'Creatividad', texto: null },
	{ titulo: 'Responsabilidad', texto: null },
];

export interface Servicio {
	slug: string;
	nombre: string;
	icono: 'construccion' | 'montaje' | 'mantencion' | 'electricidad' | 'datos' | 'muebles';
	// null hasta tener el texto real (en el sitio de 2018 ningún servicio tenía descripción).
	problema: string | null; // qué problema del cliente resuelve (patrón Arup)
	resumen: string | null;
}

// Servicios vigentes (don Luis, 08-10-2026): salen Mantención, Voz y datos y Muebles.
export const servicios: Servicio[] = [
	{ slug: 'construccion', nombre: 'Construcción', icono: 'construccion', problema: null, resumen: null },
	{ slug: 'montaje-industrial', nombre: 'Montaje industrial', icono: 'montaje', problema: null, resumen: null },
	{ slug: 'electricidad', nombre: 'Electricidad', icono: 'electricidad', problema: null, resumen: null },
];

export const servicioPorSlug = (slug: string) => servicios.find((s) => s.slug === slug)!;

// Servicios agrupados por lo que el cliente necesita, no por especialidad (patrón Ramboll).
// La agrupación es una propuesta de diseño: se muestra marcada para que don Luis la confirme.
export const necesidades = [
	{ titulo: 'Construir', servicios: ['construccion'] },
	{ titulo: 'Instalar', servicios: ['montaje-industrial', 'electricidad'] },
];
export const necesidadesRevisar = 'agrupación propuesta; confirmar';

// Menú principal: las 4 secciones que tienen casi todos los sitios del rubro + Seguridad,
// que casi ninguno muestra y es lo primero que revisa un mandante (docs/investigacion-secciones.md).
export const navegacion = [
	{ href: '/proyectos/', texto: 'Proyectos' },
	{ href: '/servicios/', texto: 'Servicios' },
	{ href: '/seguridad/', texto: 'Seguridad' },
	{ href: '/empresa/', texto: 'Empresa' },
	{ href: '/contacto/', texto: 'Contacto' },
];

// Rutas para públicos que no son clientes: van en el pie para no saturar el canal comercial.
// Sin Proveedores (Marcos, 08-10-2026): una sección de compras puede hacer pensar que LOLS vende.
export const otrosPublicos = [{ href: '/trabaja-con-nosotros/', texto: 'Trabaja con nosotros' }];
