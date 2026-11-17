// Listas de obras del sitio: qué obras muestra cada una y en qué orden (docs/editor-visual.md § 2).
// Las usan las páginas al compilar (index.astro, proyectos/index.astro) y, desde la etapa A2, el
// puente del editor visual, para saber dónde va una obra nueva o una que cambió de estado. El
// nombre de cada regla es también el valor de `data-ed-lista` en el contenedor de la lista.
//
// Reciben las obras ya en el orden base del sitio (src/data/proyectos.ts: estado, `orden`,
// nombre y slug) y sirven tanto para Proyecto como para el JSON de una obra.
import type { Estado } from './catalogo';

export type Vista = 'carrusel' | 'contratada' | 'tarjeta';
export type Regla = 'portada-en-obra' | 'portada-proximos' | 'proyectos-en-curso' | 'proyectos-contratados' | 'proyectos-terminados';

// Lo que las reglas miran de una obra (Proyecto o JSON).
interface ObraListable {
	estado: Estado | null;
	anio: number | null;
	fotos: readonly object[];
}

const deEstado = (estado: Estado) => <T extends ObraListable>(lista: readonly T[]) => lista.filter((o) => o.estado === estado);
// Foto propia: la primera foto no es una imagen referencial (las referenciales traen `origen`).
const imagenPropia = (o: ObraListable) => (o.fotos[0] && !('origen' in o.fotos[0]) ? 1 : 0);

export const reglas: Record<Regla, { vista: Vista; elegir: <T extends ObraListable>(lista: readonly T[]) => T[] }> = {
	// Portada, «En obra ahora»: las tres primeras en construcción.
	'portada-en-obra': { vista: 'carrusel', elegir: (lista) => deEstado('en-curso')(lista).slice(0, 3) },
	// Portada, «Próximos proyectos»: todas las contratadas.
	'portada-proximos': { vista: 'carrusel', elegir: deEstado('contratado') },
	'proyectos-en-curso': { vista: 'carrusel', elegir: deEstado('en-curso') },
	'proyectos-contratados': { vista: 'contratada', elegir: deEstado('contratado') },
	// Terminadas, de la más nueva a la más antigua; en el mismo año, primero las que tienen imagen
	// propia (no de ejemplo).
	'proyectos-terminados': {
		vista: 'carrusel',
		elegir: (lista) => [...deEstado('terminado')(lista)].sort((a, b) => (b.anio ?? 0) - (a.anio ?? 0) || imagenPropia(b) - imagenPropia(a)),
	},
};

export const seleccionar = <T extends ObraListable>(regla: Regla, lista: readonly T[]): T[] => reglas[regla].elegir(lista);
