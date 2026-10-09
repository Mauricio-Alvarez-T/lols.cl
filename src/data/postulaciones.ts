// Postulaciones de "Trabaja con nosotros" (Marcos, 09-10-2026): dos grupos, "En obra" y
// "Profesionales y oficina técnica". Al elegir uno se ven sus cargos; al apretar "Postular"
// aparece un formulario corto con los datos de la persona, sus años de experiencia, si ha
// tenido gente a cargo y las preguntas propias de ESE cargo (no es lo mismo un arquitecto que un
// carpintero). Así las postulaciones llegan separadas por cargo.
//
// En obra van los oficios sin especialidad (carpintero, albañil…); el CV es opcional, porque
// muchos maestros no tienen. En profesionales el CV es obligatorio.
//
// Los cargos son los que nombró Marcos; las PREGUNTAS DE CADA CARGO SON DE EJEMPLO hasta que
// las revise la jefatura (se muestran marcadas). El servidor valida las respuestas con estos
// mismos datos (src/pages/api/cargos.json.ts → /api/cargos.json → public/api/postulacion.php).

/** [valor que se envía, texto que se ve] */
export type Opcion = [valor: string, texto: string];

export interface Pregunta {
	id: string;
	texto: string;
	opciones: Opcion[];
	/** true = puede marcar varias (opcional); si no, una sola y es obligatoria */
	varias?: boolean;
}

export interface Cargo {
	/** también es el enlace del cargo: /trabaja-con-nosotros/#<id> */
	id: string;
	nombre: string;
	texto?: string;
	preguntas: Pregunta[];
}

export interface Grupo {
	id: 'en-obra' | 'profesionales';
	nombre: string;
	bajada: string;
	cvObligatorio: boolean;
	cargos: Cargo[];
}

const siNo: Opcion[] = [
	['si', 'Sí'],
	['no', 'No'],
];
const leePlanos: Pregunta = {
	id: 'lee-planos',
	texto: '¿Lee planos?',
	opciones: [
		['si', 'Sí'],
		['un-poco', 'Un poco'],
		['no', 'No'],
	],
};

/** Preguntas de todos los cargos */
export const aniosExperiencia: Opcion[] = [
	['menos-1', 'Menos de 1 año'],
	['1-3', '1 a 3 años'],
	['3-5', '3 a 5 años'],
	['5-10', '5 a 10 años'],
	['mas-10', 'Más de 10 años'],
];
export const personasACargo: Opcion[] = [
	['no', 'No'],
	['1-5', 'Sí, hasta 5'],
	['6-15', 'Sí, de 6 a 15'],
	['16-50', 'Sí, de 16 a 50'],
	['mas-50', 'Sí, más de 50'],
];

export const grupos: Grupo[] = [
	{
		id: 'en-obra',
		nombre: 'En obra',
		bajada: 'Capataces, maestros y ayudantes. No necesita CV.',
		cvObligatorio: false,
		cargos: [
			{ id: 'capataz', nombre: 'Capataz', preguntas: [leePlanos] },
			{
				id: 'carpintero',
				nombre: 'Carpintero',
				preguntas: [
					{ id: 'herramientas', texto: '¿Tiene herramientas propias?', opciones: siNo },
					{ id: 'moldajes', texto: '¿Ha trabajado con moldajes?', opciones: siNo },
				],
			},
			{
				id: 'albanil',
				nombre: 'Albañil',
				preguntas: [leePlanos, { id: 'altura', texto: '¿Ha trabajado en altura, sobre andamios?', opciones: siNo }],
			},
			{
				id: 'enfierrador',
				nombre: 'Enfierrador',
				preguntas: [
					{ ...leePlanos, texto: '¿Lee planos de armadura?' },
					{ id: 'maquinas', texto: '¿Ha usado cortadora y dobladora de fierro?', opciones: siNo },
				],
			},
			{
				id: 'soldador',
				nombre: 'Soldador',
				preguntas: [
					{
						id: 'procesos',
						texto: '¿Qué procesos domina?',
						varias: true,
						opciones: [
							['arco', 'Arco manual'],
							['mig', 'MIG'],
							['tig', 'TIG'],
						],
					},
					{ id: 'certificacion', texto: '¿Tiene certificación de soldadura?', opciones: siNo },
				],
			},
			{
				id: 'electricista',
				nombre: 'Electricista',
				preguntas: [
					{
						id: 'licencia-sec',
						texto: '¿Tiene licencia SEC?',
						opciones: [
							['a', 'Clase A'],
							['b', 'Clase B'],
							['c', 'Clase C'],
							['d', 'Clase D'],
							['no', 'No tengo'],
						],
					},
				],
			},
			{
				id: 'jornal',
				nombre: 'Jornal',
				preguntas: [{ id: 'curso-altura', texto: '¿Tiene curso de trabajo en altura?', opciones: siNo }],
			},
		],
	},
	{
		id: 'profesionales',
		nombre: 'Profesionales y oficina técnica',
		bajada: 'Jefe de obra, prevencionista, arquitecto y administrativo. Con CV.',
		cvObligatorio: true,
		cargos: [
			{
				id: 'jefe-de-obra',
				nombre: 'Jefe de obra',
				texto: 'Dirige la obra en terreno: avance, cuadrillas, calidad y seguridad.',
				preguntas: [
					{
						id: 'titulo',
						texto: '¿Qué título tiene?',
						opciones: [
							['constructor-civil', 'Constructor civil'],
							['ingeniero-constructor', 'Ingeniero constructor'],
							['ingeniero-civil', 'Ingeniero civil'],
							['arquitecto', 'Arquitecto'],
							['otro', 'Otro'],
						],
					},
					{
						id: 'obra-mayor',
						texto: '¿Cuál es la obra más grande que ha dirigido?',
						opciones: [
							['hasta-1000', 'Hasta 1.000 m²'],
							['1000-5000', '1.000 a 5.000 m²'],
							['mas-5000', 'Más de 5.000 m²'],
						],
					},
				],
			},
			{
				id: 'prevencionista',
				nombre: 'Prevencionista de riesgos',
				texto: 'Seguridad en obra: charlas, inspecciones y documentos.',
				preguntas: [
					{
						id: 'registro-seremi',
						texto: '¿Qué registro tiene en la SEREMI de Salud?',
						opciones: [
							['tecnico', 'Técnico'],
							['profesional', 'Profesional'],
							['en-tramite', 'En trámite'],
							['no', 'No tengo'],
						],
					},
					{ id: 'comite-paritario', texto: '¿Ha trabajado con Comité Paritario?', opciones: siNo },
				],
			},
			{
				id: 'arquitecto',
				nombre: 'Arquitecto',
				texto: 'Proyectos, planos y permisos municipales.',
				preguntas: [
					{ id: 'permisos-dom', texto: '¿Ha tramitado permisos de edificación en la DOM?', opciones: siNo },
					{
						id: 'programas',
						texto: '¿Qué programas usa?',
						varias: true,
						opciones: [
							['autocad', 'AutoCAD'],
							['revit', 'Revit'],
							['sketchup', 'SketchUp'],
							['archicad', 'ArchiCAD'],
						],
					},
				],
			},
			{
				id: 'administrativo',
				nombre: 'Administrativo',
				texto: 'Bodega, documentos de obra y control de asistencia.',
				preguntas: [
					{
						id: 'experiencia-en',
						texto: '¿En qué ha trabajado?',
						varias: true,
						opciones: [
							['bodega', 'Bodega'],
							['asistencia', 'Control de asistencia'],
							['documentos', 'Documentos de obra'],
							['remuneraciones', 'Remuneraciones'],
						],
					},
					{
						id: 'excel',
						texto: '¿Qué nivel de Excel tiene?',
						opciones: [
							['basico', 'Básico'],
							['intermedio', 'Intermedio'],
							['avanzado', 'Avanzado'],
						],
					},
				],
			},
		],
	},
];

/** nombre del campo de una pregunta en el formulario */
export const campoPregunta = (cargo: Cargo, p: Pregunta) => `p-${cargo.id}-${p.id}${p.varias ? '[]' : ''}`;
