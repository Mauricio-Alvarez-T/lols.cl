// Proyectos del portafolio. Ficha según docs/brief.md § 4 (formato Mott MacDonald / BIG) y la
// reunión inicial con don Luis (docs/reunion-inicial.md): de cada obra en construcción se
// muestra superficie, comuna, dirección y tipo de obra; las contratadas que aún no parten
// también se muestran, como cartera.
//
// Las obras NO se escriben aquí: cada una es un JSON en src/content/obras/<slug>.json, con sus
// fotos en public/proyectos/<slug>/ (contrato y reglas: docs/contenido-obras.md; esquema:
// src/content.config.ts). Desde la Fase 1 esos archivos los escribe la Bóveda al publicar: para
// agregar o cambiar una obra se hace en la Bóveda (módulo «Sitio web»), no a mano en el código,
// porque la próxima publicación reemplaza lo que no venga de ella.
// Un campo en null no se muestra en la ficha de una obra real (solo la ficha de ejemplo lleva
// [PENDIENTE]). Cuando una obra termina, pasa a `estado: 'terminado'` con su `anio`.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection } from 'astro:content';
import { estados, tiposObra, urlsDeSrcset, type Estado, type TipoObra } from './catalogo';
import { compararObras, proyectoDesdeJson, type ObraJson, type Proyecto } from './vistaObra';

// Lo que no lee la colección vive en módulos puros (también los usa el editor visual en el
// navegador): vistaObra.ts (Proyecto, fotoPrincipal y los textos derivados) y pictogramas.ts.
// Se reexportan para que los componentes sigan importando desde aquí.
export { estados, tiposObra, type Estado, type TipoObra };
export { fotoPrincipal, type FotoObra, type Proyecto } from './vistaObra';
export { pictogramaDeTipo } from './pictogramas';

// "Han confiado en nosotros" (portada): foto del edificio terminado y su dirección, sin nombres
// (don Luis, 08-10-2026). Fotos del currículum empresarial de LOLS 2026 (páginas 6 a 12).
export const obrasConfianza = [
	{ slug: 'enfermera-lucia-vidal-arias-6679', direccion: 'Enfermera Lucía Vidal Arias 6679', comuna: 'Cerrillos' },
	{ slug: 'claudio-gay-2970', direccion: 'Claudio Gay 2970', comuna: 'Santiago' },
	{ slug: 'av-providencia-1132', direccion: 'Av. Providencia 1132', comuna: 'Providencia' },
	{ slug: 'abate-molina-221', direccion: 'Abate Molina 221', comuna: 'Santiago' },
	{ slug: 'bascunan-guerrero-818', direccion: 'Bascuñán Guerrero 818', comuna: 'Santiago' },
	{ slug: 'grajales-2751', direccion: 'Grajales 2751', comuna: 'Santiago' },
	{ slug: 'bascunan-guerrero-239', direccion: 'Bascuñán Guerrero 239', comuna: 'Santiago' },
	{ slug: 'gorbea-2635', direccion: 'Gorbea 2635', comuna: 'Santiago' },
	{ slug: 'tucapel-jimenez-84', direccion: 'Tucapel Jiménez 84', comuna: 'Santiago' },
	{ slug: 'conferencia-442', direccion: 'Conferencia 442', comuna: 'Santiago' },
	{ slug: 'san-alfonso-580', direccion: 'San Alfonso 580', comuna: 'Santiago' },
	{ slug: 'abate-molina-211', direccion: 'Abate Molina 211, esquina Sazié', comuna: 'Santiago' },
];
// Cuatro de estas carpetas son también de una obra de src/content/obras/ (las escribe la Bóveda,
// que no debe borrar su 1.jpg: docs/contenido-obras.md § Carpetas compartidas). Si falta una foto,
// el build falla en vez de publicar un carrusel con la imagen rota.
for (const o of obrasConfianza) {
	if (!existsSync(join(process.cwd(), 'public/proyectos', o.slug, '1.jpg'))) {
		throw new Error(`obrasConfianza: no existe public/proyectos/${o.slug}/1.jpg`);
	}
}

// Obras de src/content/obras/, en el orden del sitio (compararObras en vistaObra.ts). Lo que el
// esquema no puede ver hace fallar el build aquí: un `slug` distinto del nombre del archivo (o dos
// archivos con el mismo slug) y una foto que no existe en public/.
async function cargar(): Promise<Proyecto[]> {
	const lista: ObraJson[] = (await getCollection('obras')).map(({ id, data: o }) => {
		const archivo = `src/content/obras/${id}.json`;
		if (o.slug !== id) throw new Error(`${archivo}: slug «${o.slug}» distinto del nombre del archivo`);
		for (const f of o.fotos) {
			for (const url of [f.src, ...urlsDeSrcset(f.srcset)]) {
				if (!existsSync(join(process.cwd(), 'public', url))) throw new Error(`${archivo}: no existe public${url}`);
			}
		}
		return o;
	});
	return lista.sort(compararObras).map(proyectoDesdeJson);
}

export const proyectos: Proyecto[] = await cargar();

export const proyectosPorEstado = (estado: Estado) => proyectos.filter((p) => p.estado === estado);

// Ficha de ejemplo para revisar el diseño mientras no hay proyectos reales. Solo existe fuera
// de producción (ver src/pages/proyectos/[slug].astro).
export const plantilla: Proyecto = {
	slug: 'ejemplo',
	nombre: null,
	titular: null,
	tipo: null,
	mandante: null,
	comuna: null,
	direccion: null,
	superficie: null,
	anio: null,
	inicio: null,
	servicios: ['construccion'],
	estado: null,
	desafio: null,
	solucion: null,
	resultado: null,
	fotos: [],
};
