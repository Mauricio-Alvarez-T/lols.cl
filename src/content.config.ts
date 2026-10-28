// Obras del portafolio: un JSON por obra en src/content/obras/<slug>.json. Desde la Fase 1 los
// escribe la Bóveda (contrato en docs/contenido-obras.md). El esquema es estricto: un campo de
// más, un '' en vez de null, un valor fuera de catálogo o una regla cruzada sin cumplir hacen
// fallar el build, y el sitio anterior sigue arriba.
//
// El id de cada entrada es el nombre del archivo (no `slug`): así dos archivos no pueden chocar.
// src/data/proyectos.ts exige además que `slug` sea igual a ese nombre y que cada foto exista en
// public/.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { estados, tiposObra, urlsDeSrcset, type Estado } from './data/catalogo';
import { servicios } from './data/empresa';
import { referenciasDeObra } from './data/referencia';

const texto = (max: number) => z.string().trim().min(1).max(max);
const opcional = (max: number) => texto(max).nullable();

// Archivos de una obra: /proyectos/<slug>/<nombre>.<ext>, sin subcarpetas.
const archivo = /^\/proyectos\/[a-z0-9]+(-[a-z0-9]+)*\/[a-z0-9][a-z0-9._-]*\.(webp|avif|jpe?g|png)$/;

const foto = z
	.strictObject({
		src: z.string().regex(archivo),
		alt: texto(200).min(5),
		srcset: z
			.string()
			.trim()
			.min(1)
			.refine((s) => s.split(',').every((c) => /^\S+ [1-9]\d*w$/.test(c.trim()) && archivo.test(c.trim().split(' ')[0])), 'srcset inválido')
			.optional(),
		width: z.number().int().positive().optional(),
		height: z.number().int().positive().optional(),
	})
	.refine((f) => (f.width === undefined) === (f.height === undefined), 'width y height van juntos');

const obra = z
	.strictObject({
		slug: z
			.string()
			.max(80)
			.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
			.refine((s) => s !== 'ejemplo', 'slug reservado (ficha de ejemplo)'),
		orden: z.number().int().min(0),
		estado: z.enum(Object.keys(estados) as [Estado, ...Estado[]]),
		nombre: texto(160),
		titular: opcional(240),
		tipo: z.enum(tiposObra).nullable(),
		mandante: opcional(160),
		// Obligatoria: la tarjeta de la obra (TarjetaProyecto) muestra [PENDIENTE] si falta.
		comuna: texto(80),
		direccion: opcional(200),
		// Entero: es-CL redondea a 3 decimales (0.0004 saldría «0 m²»).
		superficieM2: z.number().int().min(1).nullable(),
		anio: z.number().int().min(1995).max(2100).nullable(),
		inicio: opcional(40),
		servicios: z
			.array(z.enum(servicios.map((s) => s.slug) as [string, ...string[]]))
			.min(1)
			.refine((l) => new Set(l).size === l.length, 'servicio repetido'),
		desafio: opcional(1200),
		solucion: opcional(1200),
		resultado: opcional(1200),
		fotos: z.array(foto),
		// Imagen referencial (src/data/referencia.ts → referenciasDeObra) mientras no hay foto propia.
		// null y la ausencia del campo valen lo mismo (la Bóveda lo pone en null al aprobar una portada).
		referencia: z.enum(Object.keys(referenciasDeObra) as [string, ...string[]]).nullable().optional(),
	})
	.superRefine((o, ctx) => {
		const falla = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
		// Reglas cruzadas: solo las que ya cumplen todas las obras (docs/contenido-obras.md).
		if (o.estado === 'terminado' && o.anio === null) falla(['anio'], 'una obra terminada exige anio');
		if (o.estado !== 'terminado' && o.anio !== null) falla(['anio'], 'anio es el año de término: solo en obras terminadas');
		if (o.referencia && o.fotos.length) falla(['referencia'], 'referencia solo va sin fotos propias');
		if (o.estado !== 'contratado' && !o.fotos.length && !o.referencia) {
			falla(['fotos'], `una obra «${o.estado}» exige portada (fotos[0] o referencia)`);
		}
		const propia = `/proyectos/${o.slug}/`;
		o.fotos.forEach((f, i) => {
			if ([f.src, ...urlsDeSrcset(f.srcset)].some((u) => !u.startsWith(propia))) falla(['fotos', i], `las fotos van en ${propia}`);
		});
	});

export const collections = {
	obras: defineCollection({
		loader: glob({ pattern: '*.json', base: './src/content/obras', generateId: ({ entry }) => entry.replace(/\.json$/, '') }),
		schema: obra,
	}),
};
