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

export interface Servicio {
	slug: string;
	nombre: string;
	icono: 'construccion' | 'montaje' | 'mantencion' | 'electricidad' | 'datos' | 'muebles';
	// null hasta tener el texto real (en el sitio de 2018 ningún servicio tenía descripción).
	resumen: string | null;
}

// Orden del sitio de 2018.
export const servicios: Servicio[] = [
	{ slug: 'construccion', nombre: 'Construcción', icono: 'construccion', resumen: null },
	{ slug: 'montaje-industrial', nombre: 'Montaje industrial', icono: 'montaje', resumen: null },
	{ slug: 'mantencion', nombre: 'Mantención', icono: 'mantencion', resumen: null },
	{ slug: 'electricidad', nombre: 'Electricidad', icono: 'electricidad', resumen: null },
	{ slug: 'voz-y-datos', nombre: 'Voz y datos', icono: 'datos', resumen: null },
	{ slug: 'muebles', nombre: 'Muebles', icono: 'muebles', resumen: null },
];

export const navegacion = [
	{ href: '/empresa/', texto: 'Empresa' },
	{ href: '/servicios/', texto: 'Servicios' },
	{ href: '/proyectos/', texto: 'Proyectos' },
	{ href: '/contacto/', texto: 'Contacto' },
];
