// CONTENIDO DE EJEMPLO para la propuesta de diseño (modo propuesta). No es información de
// LOLS: sirve para que el diseño se vea como el sitio final mientras llegan los textos
// reales. Se muestra dentro de <Pendiente>, así que el build de producción falla mientras
// quede alguno. Al tener el texto real, va en src/data/empresa.ts o proyectos.ts y el
// ejemplo se borra de aquí.

export const ejemplosServicio: Record<
	string,
	{ problema: string; resumen: string; alcance: string[]; clientes: string[] }
> = {
	construccion: {
		problema: 'Levantar o ampliar un edificio sin coordinar a diez contratistas.',
		resumen: 'Obra gruesa, terminaciones e instalaciones con un solo responsable, desde el inicio hasta la recepción.',
		alcance: ['Obra gruesa', 'Terminaciones', 'Ampliaciones y remodelaciones', 'Habilitación de locales y oficinas'],
		clientes: ['Inmobiliarias', 'Comercio', 'Industria', 'Instituciones'],
	},
	'montaje-industrial': {
		problema: 'Estructuras y equipos montados a tiempo, sin detener la operación.',
		resumen: 'Montaje de estructuras metálicas, equipos y líneas, planificado por etapas.',
		alcance: ['Estructuras metálicas', 'Montaje de equipos', 'Plataformas y pasarelas', 'Galpones'],
		clientes: ['Industria', 'Bodegaje y logística', 'Energía'],
	},
	mantencion: {
		problema: 'Que lo construido siga funcionando todos los días.',
		resumen: 'Mantención preventiva y correctiva de edificios e instalaciones, con planes a la medida.',
		alcance: ['Planes preventivos', 'Reparaciones', 'Climatización', 'Fachadas y cubiertas'],
		clientes: ['Administración de edificios', 'Comercio', 'Industria'],
	},
	electricidad: {
		problema: 'Energía segura y bien dimensionada para cada proyecto.',
		resumen: 'Diseño e instalación eléctrica, tableros e iluminación, listos para certificar.',
		alcance: ['Tableros eléctricos', 'Alumbrado', 'Empalmes', 'Mallas a tierra'],
		clientes: ['Comercio', 'Oficinas', 'Industria'],
	},
	'voz-y-datos': {
		problema: 'Una red confiable desde el primer día.',
		resumen: 'Cableado estructurado, racks y puntos de red certificados.',
		alcance: ['Cableado estructurado', 'Racks y gabinetes', 'Fibra óptica', 'Certificación de puntos'],
		clientes: ['Oficinas', 'Comercio', 'Plantas industriales'],
	},
	muebles: {
		problema: 'Mobiliario que calza exacto con el espacio.',
		resumen: 'Diseño y fabricación de muebles a medida para oficinas, comercio y proyectos.',
		alcance: ['Muebles de oficina', 'Mesones y recepciones', 'Closets y cocinas', 'Muebles comerciales'],
		clientes: ['Oficinas', 'Comercio', 'Inmobiliarias'],
	},
};

export const ejemploProyecto = {
	nombre: 'Edificio comercial Esquina',
	titular: 'Cinco pisos de comercio y oficinas en una esquina de alto tránsito',
	mandante: 'Inmobiliaria Ejemplo',
	comuna: 'Santiago',
	anio: '2018',
	magnitud: '3.200 m²',
	estado: 'Terminado',
	desafio: 'Construir en una esquina con comercio funcionando, veredas angostas y horarios de carga restringidos.',
	solucion: 'Obra gruesa, terminaciones e instalaciones con un solo equipo, planificadas por etapas para no cortar el tránsito peatonal.',
	resultado: 'Edificio entregado en plazo, con los locales del primer piso operando desde el primer día.',
	cifra: { valor: '14 meses', etiqueta: 'de obra, sin accidentes con tiempo perdido' },
};

export const ejemplosEmpresa = {
	hitos: [
		{ anio: '1998', texto: 'Nace LOLS Ingeniería' },
		{ anio: '2006', texto: 'Primeras obras industriales' },
		{ anio: '2014', texto: 'Se suman montaje, electricidad y datos' },
		{ anio: '2026', texto: 'Seis especialidades, un solo responsable' },
	],
	valores: {
		Esfuerzo: 'Cumplimos los plazos con equipos propios y comprometidos con cada obra.',
		Creatividad: 'Buscamos la solución constructiva que mejor calza con cada proyecto.',
		Responsabilidad: 'Cuidamos a las personas y el entorno en cada faena.',
	} as Record<string, string>,
	seguridad: [
		'Plan de prevención de riesgos en cada obra',
		'Capacitación permanente del equipo',
		'Gestión y reciclaje de residuos de construcción',
		'Cumplimiento de la normativa ambiental vigente',
	],
	equipo: [
		{ nombre: 'Nombre Apellido', cargo: 'Gerente general' },
		{ nombre: 'Nombre Apellido', cargo: 'Jefe de proyectos' },
		{ nombre: 'Nombre Apellido', cargo: 'Prevención de riesgos' },
		{ nombre: 'Nombre Apellido', cargo: 'Administración de obras' },
	],
};

// Frase del hero: qué hace, para quién y dónde (NN/G: el hero debe responder eso en 5 s).
export const ejemploBajadaHero =
	'Construcción, montaje industrial, electricidad y mantención para empresas e industria en la Región Metropolitana.';

// Seguridad y calidad: lo que un mandante revisa para precalificar a un contratista
// (tasas certificadas por la mutualidad, ISO, registros de contratistas).
export const ejemplosSeguridad = {
	indicadores: [
		{ valor: '0', etiqueta: 'accidentes con tiempo perdido en 2025' },
		{ valor: '1,2', etiqueta: 'tasa de accidentabilidad (%)' },
		{ valor: '850', etiqueta: 'días sin accidentes' },
	],
	fuenteIndicadores: 'Certificado por la mutualidad, período enero–diciembre 2025.',
	certificaciones: [
		{ nombre: 'ISO 9001', alcance: 'Gestión de calidad', emisor: 'Organismo certificador', vigencia: '2027' },
		{ nombre: 'ISO 45001', alcance: 'Seguridad y salud en el trabajo', emisor: 'Organismo certificador', vigencia: '2027' },
		{ nombre: 'ISO 14001', alcance: 'Gestión ambiental', emisor: 'Organismo certificador', vigencia: '2027' },
	],
	registros: ['Mutualidad de seguridad', 'Registro de contratistas REGIC', 'SICEP', 'ChileProveedores'],
	programa: [
		'Plan de prevención de riesgos y análisis de riesgos por faena',
		'Charlas diarias de seguridad y capacitación permanente',
		'Comité paritario y experto en prevención en obra',
		'Gestión y reciclaje de residuos de construcción',
	],
};

// Cómo trabajamos: qué pasa después de pedir una cotización (claridad del proceso, NN/G B2B).
export const ejemploProceso = [
	{ titulo: 'Visita técnica', texto: 'Conocemos la obra o la instalación y levantamos lo que necesita.' },
	{ titulo: 'Cotización', texto: 'Propuesta con alcance, plazo y valor, sin letra chica.' },
	{ titulo: 'Ejecución', texto: 'Un jefe de proyecto a cargo, con reportes de avance.' },
	{ titulo: 'Entrega y mantención', texto: 'Recepción conforme y, si lo necesita, plan de mantención.' },
];

export const ejemploTestimonio = {
	cita: 'Cumplieron el plazo sin interrumpir la operación de nuestras tiendas. Volveríamos a trabajar con ellos.',
	nombre: 'Nombre Apellido',
	cargo: 'Gerente de proyectos',
	empresa: 'Empresa cliente',
};

export const ejemploFichaExtra = { rol: 'Contratista principal', plazo: '14 meses' };

export const ejemplosTrabaja = {
	bajada: 'Buscamos personas que quieran construir bien, con seguridad y en equipo.',
	motivos: [
		{ titulo: 'Seguridad primero', texto: 'Capacitación permanente y los elementos de protección que cada faena requiere.' },
		{ titulo: 'Estabilidad', texto: 'Obras continuas para empresas e industria, con contrato y pagos al día.' },
		{ titulo: 'Crecimiento', texto: 'Aprende de varias especialidades: construcción, montaje, electricidad y datos.' },
	],
	perfiles: ['Maestros de obra y jornales', 'Soldadores y montajistas', 'Electricistas con licencia SEC', 'Técnicos en redes', 'Carpinteros', 'Prevencionistas de riesgos'],
};

export const ejemplosProveedores = {
	bajada: 'Trabajamos con proveedores de materiales, equipos y servicios que cumplan plazos y estándares de seguridad.',
	requisitos: ['Inicio de actividades y documentación tributaria al día', 'Certificado de la mutualidad (si presta servicios en obra)', 'Catálogo o lista de precios', 'Referencias de clientes'],
};
