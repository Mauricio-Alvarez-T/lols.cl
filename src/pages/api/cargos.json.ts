// /api/cargos.json: cargos y preguntas de "Trabaja con nosotros" para public/api/postulacion.php,
// que valida las respuestas con los mismos datos que muestra la página (src/data/postulaciones.ts).
import type { APIRoute } from 'astro';
import { grupos, aniosExperiencia } from '../../data/postulaciones';

const lista = (opciones: [string, string][]) => Object.fromEntries(opciones);

export const GET: APIRoute = () =>
	new Response(
		JSON.stringify({
			experiencia: lista(aniosExperiencia),
			cargos: Object.fromEntries(
				grupos.flatMap((g) =>
					g.cargos.map((c) => [
						c.id,
						{
							nombre: c.nombre,
							grupo: g.nombre,
							cvObligatorio: g.cvObligatorio,
							preguntas: c.preguntas.map((p) => ({ id: p.id, texto: p.texto, varias: !!p.varias, opciones: lista(p.opciones) })),
						},
					]),
				),
			),
		}),
		{ headers: { 'Content-Type': 'application/json' } },
	);
