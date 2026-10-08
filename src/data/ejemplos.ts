// CONTENIDO DE EJEMPLO para la propuesta de diseño (modo propuesta). No es información de
// LOLS: sirve para que el diseño se vea como el sitio final mientras llegan los textos
// reales. Se muestra dentro de <Pendiente>, así que el build de producción falla mientras
// quede alguno. Al tener el texto real, va en src/data/empresa.ts o proyectos.ts y el
// ejemplo se borra de aquí.

export const ejemplosServicio: Record<
	string,
	{ problema: string; resumen: string }
> = {
	construccion: {
		problema: 'Levantar o ampliar un edificio sin coordinar a diez contratistas.',
		resumen: 'Obra gruesa, terminaciones e instalaciones con un solo responsable, desde el inicio hasta la recepción.',
	},
	'montaje-industrial': {
		problema: 'Estructuras y equipos montados sin detener la operación.',
		resumen: 'Montaje de estructuras metálicas, equipos y líneas, planificado por etapas.',
	},
	electricidad: {
		problema: 'Energía segura y bien dimensionada para cada proyecto.',
		resumen: 'Diseño e instalación eléctrica, tableros e iluminación, listos para certificar.',
	},
};

export const ejemploProyecto = {
	nombre: 'Edificio comercial Esquina',
	tipo: 'Edificio y oficinas',
	direccion: 'Av. Ejemplo 1234',
	inicio: 'Marzo 2017',
	titular: 'Cinco pisos de comercio y oficinas en una esquina de alto tránsito',
	mandante: 'Inmobiliaria Ejemplo',
	comuna: 'Santiago',
	anio: '2018',
	superficie: '3.200 m²',
	estado: 'Terminado',
	desafio: 'Construir en una esquina con comercio funcionando, veredas angostas y horarios de carga restringidos.',
	solucion: 'Obra gruesa, terminaciones e instalaciones con un solo equipo, planificadas por etapas para no cortar el tránsito peatonal.',
	resultado: 'Edificio entregado con los locales del primer piso operando desde el primer día.',
};

// Frase del hero: qué hace, para quién y dónde (NN/G: el hero debe responder eso en 5 s).
export const ejemploBajadaHero =
	'Construcción, montaje industrial y electricidad para empresas e industria en la Región Metropolitana.';

// Cómo trabajamos: qué pasa después de pedir una cotización (claridad del proceso, NN/G B2B).
// El primer paso es de don Luis (08-10-2026): sin plazo de respuesta, para no comprometerse.
// Los presupuestos van en UF.
export const ejemploProceso = [
	{ titulo: 'Lo contactamos', texto: 'Después de recibir su solicitud, LOLS se pone en contacto con usted.' },
	{ titulo: 'Visita técnica', texto: 'Conocemos la obra o la instalación y levantamos lo que necesita.' },
	{ titulo: 'Cotización', texto: 'Propuesta con alcance y valor en UF, sin letra chica.' },
	{ titulo: 'Ejecución y entrega', texto: 'Un jefe de proyecto a cargo hasta la recepción conforme.' },
];

export const ejemploFichaExtra = { rol: 'Contratista principal' };

export const ejemplosTrabaja = {
	bajada: 'Buscamos personas que quieran construir bien, con seguridad y en equipo.',
	motivos: [
		{ titulo: 'Seguridad primero', texto: 'Capacitación permanente y los elementos de protección que cada faena requiere.' },
		{ titulo: 'Estabilidad', texto: 'Obras continuas para empresas e industria, con contrato y pagos al día.' },
	],
	perfiles: ['Maestros de obra y jornales', 'Soldadores y montajistas', 'Electricistas con licencia SEC', 'Carpinteros', 'Prevencionistas de riesgos'],
};

export const ejemplosProveedores = {
	bajada: 'Trabajamos con proveedores de materiales, equipos y servicios que cumplan plazos y estándares de seguridad.',
	requisitos: ['Inicio de actividades y documentación tributaria al día', 'Certificado de la mutualidad (si presta servicios en obra)', 'Catálogo o lista de precios', 'Referencias de clientes'],
};


// Obras contratadas que aún no parten (reunión con don Luis: mostrar los proyectos futuros).
export const ejemplosContratados = [
	{ nombre: 'Bodegas Pudahuel Norte', tipo: 'Centro de bodegas', comuna: 'Pudahuel', superficie: '18.000 m²', inicio: 'Enero 2027' },
	{ nombre: 'Edificio corporativo San Miguel', tipo: 'Edificio y oficinas', comuna: 'San Miguel', superficie: '5.400 m²', inicio: 'Marzo 2027' },
	{ nombre: 'Planta de distribución Maipú', tipo: 'Industrial', comuna: 'Maipú', superficie: '9.200 m²', inicio: 'Segundo semestre 2027' },
];
