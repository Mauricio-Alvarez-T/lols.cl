// Datos de la empresa. Fuente y estado de cada dato: docs/brief.md § 4.
// `revisar` = dato en uso pero sin confirmar con don Luis; se muestra marcado en el sitio.
import type { NombrePictograma } from './pictogramas';

export const empresa = {
	razonSocial: 'LOLS Ingeniería Limitada',
	lema: 'Sus proyectos en las mejores manos',
	directrices: 'Experiencia, seguridad y calidad son nuestras directrices.',
	direccion: { valor: 'El Mirador 112-150, Cerrillos, Santiago', revisar: 'confirmar vigencia' },
	telefono: { valor: '+56 652 710 609', revisar: 'el prefijo 65 es de Osorno' },
	correo: { valor: 'lols@lols.cl', revisar: 'confirmar; ¿un correo por área?' },
	// Número de WhatsApp comercial (móvil, formato 569XXXXXXXX). Mientras sea null, los botones
	// abren WhatsApp sin destinatario y el build de producción falla (marcador en BarraContacto).
	whatsapp: null as string | null,
};

// Año de fundación (reunión con don Luis, 2026). Los años de trayectoria se calculan al
// construir el sitio, así que se actualizan solos cada año con el siguiente deploy.
export const fundacion = 1995;
export const aniosTrayectoria = new Date().getFullYear() - fundacion;

// Equipamiento propio. Cuatro categorías salen del inventario de la Bóveda LOLS (categorías
// ANDAMIOS, ALZAPRIMAS, MOLDAJES y MAQUINARIA; ítems del catálogo de marzo de 2026). Vehículos
// y seguridad vienen de la reunión con don Luis.
// Cifras redondeadas a pedido del usuario ("no necesito cifras exactas"):
//   - `aprox`: unidades en obra según el inventario de la Bóveda (resumen de marzo de 2026),
//     redondeadas hacia abajo. Se muestran marcadas para revisar: confirmar que todo es propio
//     (el inventario distingue el dueño de cada ítem) y que el número sigue vigente.
//   - `ejemplo`: no hay dato; número de muestra (modo propuesta).
export interface CategoriaEquipo {
	clave: string;
	titulo: string;
	pictograma: NombrePictograma;
	cifra: { valor: string; unidad: string; estado: 'aprox' | 'ejemplo' };
	items: string[];
}

export const equipamiento: CategoriaEquipo[] = [
	{
		clave: 'alzaprimas',
		titulo: 'Alzaprimas y vigas',
		pictograma: 'alzaprima',
		cifra: { valor: '2.000+', unidad: 'vigas y alzaprimas', estado: 'aprox' },
		items: ['Alzaprimas cerradas de 1,9 a 3,5 m', 'Alzaprimas telescópicas de hasta 6,6 m', 'Vigas de 3 a 4 m', 'Vigas PERI'],
	},
	{
		clave: 'moldajes',
		titulo: 'Moldajes',
		pictograma: 'moldaje',
		cifra: { valor: '800+', unidad: 'paneles de moldaje', estado: 'aprox' },
		items: ['Paneles fenólicos de 10 × 60 a 60 × 150 cm', 'Esquineros y ángulos', 'Alineadores de 3 y 6 m', 'Separadores de muro, pernos y tuercas', 'Cabezales, trípodes y escuadras de muro'],
	},
	{
		clave: 'andamios',
		titulo: 'Andamios',
		pictograma: 'andamio',
		cifra: { valor: '400+', unidad: 'cuerpos de andamio', estado: 'aprox' },
		items: ['Andamios verticales de pata regulable', 'Andamios salientes y escuadras', 'Horizontales y diagonales', 'Bandejas, tablones y escaleras', 'Ruedas y malla de seguridad'],
	},
	{
		clave: 'maquinaria',
		titulo: 'Maquinaria',
		pictograma: 'maquinaria',
		cifra: { valor: '20+', unidad: 'equipos', estado: 'aprox' },
		items: ['Grúa horquilla de 5 t', 'Bombas de hormigón y hormigoneras', 'Elevadores de 4 a 12 m', 'Mini retroexcavadora', 'Cortadora y dobladora de fierro', 'Placa compactadora y soldadora', 'Contenedores de oficina, baño y bodega para la faena'],
	},
	{
		clave: 'vehiculos',
		titulo: 'Vehículos',
		pictograma: 'vehiculo',
		cifra: { valor: '10+', unidad: 'camionetas y camiones', estado: 'ejemplo' },
		items: ['Camionetas', 'Camiones', 'Camión con pluma'],
	},
	{
		clave: 'seguridad',
		titulo: 'Seguridad',
		pictograma: 'seguridad',
		cifra: { valor: '100 %', unidad: 'del equipo con EPP', estado: 'ejemplo' },
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

export const servicios: Servicio[] = [
	{ slug: 'construccion', nombre: 'Construcción', icono: 'construccion', problema: null, resumen: null },
	{ slug: 'montaje-industrial', nombre: 'Montaje industrial', icono: 'montaje', problema: null, resumen: null },
	{ slug: 'mantencion', nombre: 'Mantención', icono: 'mantencion', problema: null, resumen: null },
	{ slug: 'electricidad', nombre: 'Electricidad', icono: 'electricidad', problema: null, resumen: null },
	{ slug: 'voz-y-datos', nombre: 'Voz y datos', icono: 'datos', problema: null, resumen: null },
	{ slug: 'muebles', nombre: 'Muebles', icono: 'muebles', problema: null, resumen: null },
];

export const servicioPorSlug = (slug: string) => servicios.find((s) => s.slug === slug)!;

// Servicios agrupados por lo que el cliente necesita, no por especialidad (patrón Ramboll).
// La agrupación es una propuesta de diseño: se muestra marcada para que don Luis la confirme.
export const necesidades = [
	{ titulo: 'Construir', servicios: ['construccion', 'muebles'] },
	{ titulo: 'Instalar', servicios: ['montaje-industrial', 'electricidad', 'voz-y-datos'] },
	{ titulo: 'Mantener', servicios: ['mantencion'] },
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
export const otrosPublicos = [
	{ href: '/trabaja-con-nosotros/', texto: 'Trabaja con nosotros' },
	{ href: '/proveedores/', texto: 'Proveedores' },
];
