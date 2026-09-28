// Datos de la empresa. Fuente y estado de cada dato: docs/brief.md § 4.
// `revisar` = dato en uso pero sin confirmar con don Luis; se muestra marcado en el sitio.

export const empresa = {
	razonSocial: 'LOLS Ingeniería Limitada',
	lema: 'Sus proyectos en las mejores manos',
	directrices: 'Experiencia, seguridad y calidad son nuestras directrices.',
	direccion: { valor: 'El Mirador 112-150, Cerrillos, Santiago', revisar: 'confirmar vigencia' },
	telefono: { valor: '+56 652 710 609', revisar: 'el prefijo 65 es de Osorno' },
	correo: { valor: 'lols@lols.cl', revisar: 'confirmar; ¿un correo por área?' },
};

export const telefonoHref = (t: string) => 'tel:' + t.replace(/[^\d+]/g, '');

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

export const navegacion = [
	{ href: '/proyectos/', texto: 'Proyectos' },
	{ href: '/servicios/', texto: 'Servicios' },
	{ href: '/empresa/', texto: 'Empresa' },
	{ href: '/contacto/', texto: 'Contacto' },
];
