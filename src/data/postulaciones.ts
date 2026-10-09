// Postulaciones de "Trabaja con nosotros" (Marcos, 09-10-2026): dos grupos, "En obra" y
// "Profesionales y oficina técnica". Al elegir uno se ven sus cargos; al apretar "Postular"
// aparece un formulario corto con los datos de la persona, sus años de experiencia y una o dos
// preguntas simples de ESE cargo (no es lo mismo un arquitecto que un carpintero). Así las
// postulaciones llegan separadas por cargo.
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

/** Pregunta de todos los cargos */
export const aniosExperiencia: Opcion[] = [
	['menos-1', 'Menos de 1 año'],
	['1-3', '1 a 3 años'],
	['3-5', '3 a 5 años'],
	['5-10', '5 a 10 años'],
	['mas-10', 'Más de 10 años'],
];

// Preguntas simples, una o dos por cargo (Marcos, 09-10-2026: "más tranqui", como título y años
// dirigiendo obras para el jefe de obra). En obra todos preguntan si ha tenido gente a cargo.
const aCargo: Pregunta = {
	id: 'a-cargo',
	texto: '¿Ha tenido personas a cargo?',
	opciones: [
		['no', 'No'],
		['hasta-5', 'Sí, hasta 5'],
		['6-15', 'Sí, de 6 a 15'],
		['mas-15', 'Sí, más de 15'],
	],
};
const oficio = (id: string, nombre: string, ...otras: Pregunta[]): Cargo => ({ id, nombre, preguntas: [aCargo, ...otras] });

export const grupos: Grupo[] = [
	{
		id: 'en-obra',
		nombre: 'En obra',
		bajada: 'Capataces, maestros y ayudantes. No necesita CV.',
		cvObligatorio: false,
		cargos: [
			oficio('capataz', 'Capataz'),
			oficio('carpintero', 'Carpintero'),
			oficio('albanil', 'Albañil'),
			oficio('enfierrador', 'Enfierrador'),
			oficio('soldador', 'Soldador', { id: 'certificacion', texto: '¿Tiene certificación de soldadura?', opciones: siNo }),
			oficio('electricista', 'Electricista', {
				id: 'licencia-sec',
				texto: '¿Tiene licencia SEC?',
				opciones: [
					['a', 'Clase A'],
					['b', 'Clase B'],
					['c', 'Clase C'],
					['d', 'Clase D'],
					['no', 'No tengo'],
				],
			}),
			oficio('jornal', 'Jornal'),
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
							['arquitecto', 'Arquitecto'],
							['otro', 'Otro'],
						],
					},
					{
						id: 'anios-dirigiendo',
						texto: '¿Cuántos años ha dirigido obras?',
						opciones: [
							['menos-2', 'Menos de 2'],
							['2-5', '2 a 5'],
							['mas-5', 'Más de 5'],
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
						id: 'titulo',
						texto: '¿Qué título tiene?',
						opciones: [
							['tecnico', 'Técnico en prevención'],
							['ingeniero', 'Ingeniero en prevención'],
							['otro', 'Otro'],
						],
					},
				],
			},
			{
				id: 'arquitecto',
				nombre: 'Arquitecto',
				texto: 'Proyectos, planos y permisos municipales.',
				preguntas: [{ id: 'obras', texto: '¿Ha trabajado en obras de construcción?', opciones: siNo }],
			},
			{
				id: 'administrativo',
				nombre: 'Administrativo',
				texto: 'Bodega, documentos de obra y control de asistencia.',
				preguntas: [{ id: 'constructora', texto: '¿Ha trabajado antes en una constructora?', opciones: siNo }],
			},
		],
	},
];

/** nombre del campo de una pregunta en el formulario */
export const campoPregunta = (cargo: Cargo, p: Pregunta) => `p-${cargo.id}-${p.id}${p.varias ? '[]' : ''}`;
