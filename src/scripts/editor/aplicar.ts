// Aplicar el borrador de la Bóveda a la página (docs/editor-visual.md § 1–3). Funciones puras
// sobre un Document (el de la página y el de /editor/moldes/), sin mensajería: las usa el puente
// y las prueban los tests con el HTML del build.
//
// Reglas:
//   - Texto siempre con textContent; los derivados y las líneas compuestas (data-ed-linea) con los
//     mismos formateadores que el build (src/data/vistaObra.ts): la vista previa es lo que se publica.
//   - Lo que falta (una fila de la ficha, el titular, el relato) se clona
//     del documento inerte de los moldes y se pone donde va según el orden del molde. Nunca se
//     arma HTML desde un mensaje.
//   - Un valor que queda en null oculta su fila o trozo (`hidden`). Si es un texto que se escribe
//     en el lugar, la fila queda «vacía» (data-ed-vacio): oculta para el visitante y, en modo
//     editar, con el hueco «+ Dirección» para escribirla (estilos.ts).
//   - meta.incluir === false (u obra que ya no está en el borrador) oculta todas sus partes.
//   - Etapa A2 (estructura): el borrador dice qué obras hay en cada lista (data-ed-lista) y en qué
//     orden, con las mismas reglas que el build (src/data/selecciones.ts). Ver rearmarListas.
import { pictogramaDeTipo, piezasPictograma } from '../../data/pictogramas';
import { referenciasDeObra } from '../../data/referencia';
import { seleccionar } from '../../data/selecciones';
import {
	anioCarrusel,
	compararObras,
	conAnio,
	fotoPrincipal,
	lineaContratada,
	lineaResumen,
	rotuloInicio,
	textoAnio,
	textoEstado,
	textoInicioContratada,
	textoServicios,
	textoSuperficie,
	type FotoObra,
	type Proyecto,
} from '../../data/vistaObra';
import { esRegla, type ListaHola, type ObraBorrador, type ObraParcial } from './protocolo';

const SVG = 'http://www.w3.org/2000/svg';
export const itemDe = (slug: string) => `obras/${slug}`;

// Texto de cada marca a partir del JSON. `undefined`: el JSON no trae ese campo (no se toca).
type Calculo = (o: ObraParcial) => string | null | undefined;
const tiene = (o: ObraParcial, k: keyof ObraParcial) => Object.prototype.hasOwnProperty.call(o, k);
const texto = (k: keyof ObraParcial): Calculo => (o) => (tiene(o, k) ? ((o[k] as string | null) ?? null) : undefined);
export const CAMPOS: Record<string, Calculo> = {
	'/nombre': texto('nombre'),
	'/titular': texto('titular'),
	'/comuna': texto('comuna'),
	'/direccion': texto('direccion'),
	'/inicio': texto('inicio'),
	'/desafio': texto('desafio'),
	'/solucion': texto('solucion'),
	'/resultado': texto('resultado'),
};
export const DERIVADOS: Record<string, Calculo> = {
	'/superficieM2': (o) => (tiene(o, 'superficieM2') ? textoSuperficie(o.superficieM2 ?? null) : undefined),
	'/tipo': (o) => (tiene(o, 'tipo') ? (o.tipo ?? null) : undefined),
	'/estado': (o) => (tiene(o, 'estado') ? textoEstado(o.estado ?? null) : undefined),
	'/anio': (o) => (tiene(o, 'anio') ? textoAnio(o.anio ?? null) : undefined),
	'/servicios': (o) => (tiene(o, 'servicios') ? textoServicios(o.servicios ?? []) : undefined),
	'/mandante': (o) => (tiene(o, 'mandante') ? (o.mandante ?? null) : undefined),
	// Solo en la lista «En proyecto» (TarjetaContratada); en la ficha, inicio es un campo.
	'/inicio': (o) => (tiene(o, 'inicio') ? textoInicioContratada(o.inicio ?? null) : undefined),
};
// Líneas compuestas (data-ed-linea): se rearman enteras, con el formateador del build. Necesitan
// todos sus campos (el puente siempre tiene el JSON completo de la obra).
const todos = (o: ObraParcial, ks: (keyof ObraParcial)[]) => ks.every((k) => tiene(o, k));
export const LINEAS: Record<string, Calculo> = {
	resumen: (o) =>
		todos(o, ['comuna', 'superficieM2', 'estado', 'anio'])
			? lineaResumen(o.comuna ?? null, textoSuperficie(o.superficieM2 ?? null), anioCarrusel(o.estado ?? null, o.anio ?? null))
			: undefined,
	contratada: (o) =>
		todos(o, ['tipo', 'comuna', 'superficieM2']) ? lineaContratada(o.tipo ?? null, o.comuna ?? null, textoSuperficie(o.superficieM2 ?? null)) : undefined,
};
// Hueco que se ve en modo editar cuando el campo está vacío.
export const HUECOS: Record<string, string> = {
	'/nombre': '+ Nombre',
	'/titular': '+ Titular',
	'/comuna': '+ Comuna',
	'/direccion': '+ Dirección',
	'/inicio': '+ Inicio',
	'/desafio': '+ Desafío',
	'/solucion': '+ Solución',
	'/resultado': '+ Resultado',
};

// --- Lectura del DOM ---

// Partes de una obra en la página (texto y foto del carrusel, ficha, tarjeta, portada).
export const partesDe = (raiz: ParentNode, item: string) =>
	[...raiz.querySelectorAll<HTMLElement>('[data-ed-item]')].filter((e) => e.getAttribute('data-ed-item') === item);

// Marcas de `puntero` que son de esta parte (no de otra obra anidada).
function marcas(parte: HTMLElement, atributo: 'data-ed-campo' | 'data-ed-derivado', puntero: string) {
	const todas = [...(parte.matches(`[${atributo}]`) ? [parte] : []), ...parte.querySelectorAll<HTMLElement>(`[${atributo}]`)];
	return todas.filter((e) => e.getAttribute(atributo) === puntero && e.closest('[data-ed-item]') === parte);
}

// Fila o trozo que se oculta junto con el valor; sin uno, el elemento mismo.
const contenedor = (el: HTMLElement, parte: HTMLElement) => {
	const c = el.closest<HTMLElement>('[data-ed-fila],[data-ed-parte]');
	return c && parte.contains(c) ? c : null;
};
const claveDe = (el: Element) =>
	el.getAttribute('data-ed-fila') ?? el.getAttribute('data-ed-parte') ?? el.getAttribute('data-ed-campo') ?? el.getAttribute('data-ed-derivado');

// Qué vista es una parte y qué la reconoce en los moldes.
function vistaDe(parte: HTMLElement): { molde: string; selector: string } | null {
	if (parte.classList.contains('ficha-obra')) return { molde: parte.classList.contains('compacta') ? 'ficha-3' : 'ficha-1', selector: '.ficha-obra' };
	if (parte.matches('article.texto')) return { molde: 'carrusel', selector: 'article.texto' };
	if (parte.matches('li.foto')) return { molde: 'carrusel', selector: 'li.foto' };
	if (parte.matches('article.tarjeta')) return { molde: 'tarjeta', selector: 'article.tarjeta' };
	if (parte.matches('li') && parte.parentElement?.closest('[data-ed-vista="contratada"]')) return { molde: 'contratada', selector: 'li' };
	return null;
}
function moldesPara(moldes: Document | null, parte: HTMLElement): HTMLElement[] {
	const vista = vistaDe(parte);
	const caja = vista && moldes?.querySelector(`[data-ed-molde="${vista.molde}"]`);
	if (!vista || !caja) return [];
	return [...caja.querySelectorAll<HTMLElement>('[data-ed-item]')].filter((e) => e.matches(vista.selector));
}

// --- Escritura ---

// Texto de un elemento. Si tiene hijos elemento (el pictograma junto al tipo), solo se cambia el
// texto suelto.
export function ponerTexto(el: HTMLElement, valor: string) {
	if (!el.firstElementChild) {
		if (el.textContent !== valor) el.textContent = valor;
		return;
	}
	const sueltos = [...el.childNodes].filter((n) => n.nodeType === 3);
	if (sueltos.map((n) => n.textContent).join('') === valor) return;
	for (const n of sueltos) n.remove();
	el.append(el.ownerDocument.createTextNode(valor));
}

const ocultar = (el: Element, si: boolean) => el.toggleAttribute('hidden', si);
const vaciar = (el: Element, si: boolean) => el.toggleAttribute('data-ed-vacio', si);

// Dibuja el pictograma `nombre` dentro de un <svg data-ed-picto> (como Pictograma.astro).
export function dibujarPictograma(svg: SVGElement, nombre: ReturnType<typeof pictogramaDeTipo>) {
	if (svg.getAttribute('data-ed-dibujo') === nombre) return;
	const doc = svg.ownerDocument;
	const { macizos, contornos, trazo } = piezasPictograma(nombre);
	const g = (attrs: Record<string, string>) => {
		const e = doc.createElementNS(SVG, 'g');
		for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
		return e;
	};
	const rect = (r: { x: number; y: number; width: number; height: number }) => {
		const e = doc.createElementNS(SVG, 'rect');
		for (const k of ['x', 'y', 'width', 'height'] as const) e.setAttribute(k, String(r[k]));
		return e;
	};
	const relleno = g({ fill: 'currentColor' });
	relleno.append(...macizos.map(rect));
	const linea = g({ fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' });
	linea.append(...contornos.map(rect));
	if (trazo) {
		const p = doc.createElementNS(SVG, 'path');
		p.setAttribute('d', trazo);
		p.setAttribute('stroke-width', '2');
		p.setAttribute('stroke-linecap', 'square');
		linea.append(p);
	}
	svg.replaceChildren(relleno, linea);
	svg.setAttribute('data-ed-dibujo', nombre);
}

// Elemento del molde equivalente a `x` dentro de `padre` (por su clave o, si no tiene, por
// etiqueta y clases).
function equivalente(padre: Element, x: Element): Element | null {
	const clave = claveDe(x);
	for (const h of padre.children) {
		if (clave !== null ? claveDe(h) === clave : !claveDe(h) && h.tagName === x.tagName && h.getAttribute('class') === x.getAttribute('class')) return h;
	}
	return null;
}

// Pone un clon de `m` (elemento de un molde, dentro de `raizMolde`) en la parte `parte`, en el
// lugar que le da el orden del molde. Su contenedor ya tiene que estar en la parte.
function clonarEnSuLugar(m: Element, raizMolde: Element, parte: HTMLElement): Element | null {
	const padre = m.parentElement && encontrar(m.parentElement, raizMolde, parte);
	if (!padre) return null;
	return insertar(padre, parte.ownerDocument.importNode(m, true) as Element, m);
}
// El elemento equivalente de `m` en la parte (camino desde la raíz por equivalencias).
function encontrar(m: Element, raizMolde: Element, parte: HTMLElement): Element | null {
	if (m === raizMolde) return parte;
	if (!raizMolde.contains(m)) return null;
	const padre = m.parentElement && encontrar(m.parentElement, raizMolde, parte);
	return padre ? equivalente(padre, m) : null;
}
// Inserta `clon` en `padre` antes del primer hermano que en el molde va después de `m`.
function insertar(padre: Element, clon: Element, m: Element): Element {
	for (let s = m.nextElementSibling; s; s = s.nextElementSibling) {
		const ancla = equivalente(padre, s);
		if (ancla) {
			padre.insertBefore(clon, ancla);
			return clon;
		}
	}
	padre.append(clon);
	return clon;
}

// Clona del molde la fila/trozo/elemento que lleva la marca `puntero` (si el molde la tiene).
function clonarMarca(parte: HTMLElement, moldes: HTMLElement[], atributo: 'data-ed-campo' | 'data-ed-derivado', puntero: string): boolean {
	for (const raiz of moldes) {
		const el = marcas(raiz, atributo, puntero)[0];
		if (!el) continue;
		const unidad = contenedor(el, raiz) ?? el;
		// Un contenedor que ya existe (se clona solo lo que falta): el relato con otros pasos.
		if (encontrar(unidad, raiz, parte)) continue;
		// Lo que va dentro de un contenedor sin marca (el relato) se clona por partes: primero el
		// contenedor, vacío, después la fila.
		const padre = unidad.parentElement;
		if (padre && padre !== raiz && !encontrar(padre, raiz, parte)) {
			const abuelo = padre.parentElement && encontrar(padre.parentElement, raiz, parte);
			if (!abuelo) continue;
			insertar(abuelo, parte.ownerDocument.importNode(padre, false) as Element, padre);
		}
		if (clonarEnSuLugar(unidad, raiz, parte)) return true;
	}
	return false;
}

export interface Contexto {
	moldes: Document | null;
	editando?: Element | null; // el campo que se está escribiendo: no se le toca el texto
}

// Aplica a una parte los campos que trae `o` (parcial: lo que no trae no se toca).
export function aplicarAParte(parte: HTMLElement, o: ObraParcial, ctx: Contexto) {
	const moldes = moldesPara(ctx.moldes, parte);
	const esFicha = parte.classList.contains('ficha-obra');
	const terminada = tiene(o, 'estado') ? conAnio(o.estado ?? null) : null;
	// En la ficha (y en la línea del carrusel) el año va solo en las terminadas; el inicio, en las demás.
	const permitido = (puntero: string, el?: HTMLElement) => {
		if (terminada === null) return true;
		const clave = el ? claveDe(contenedor(el, parte) ?? el) : puntero.slice(1);
		if (clave === 'anio') return terminada;
		if (clave === 'inicio' && esFicha) return !terminada;
		return true;
	};
	for (const [atributo, tabla] of [
		['data-ed-campo', CAMPOS],
		['data-ed-derivado', DERIVADOS],
	] as const) {
		for (const [puntero, calcular] of Object.entries(tabla)) {
			const valor = calcular(o);
			if (valor === undefined) continue;
			const enLugar = atributo === 'data-ed-campo';
			let els = marcas(parte, atributo, puntero);
			// Falta en la página: se clona del molde si hay algo que mostrar (o un hueco que escribir).
			if (!els.length && (valor !== null || enLugar) && permitido(puntero) && clonarMarca(parte, moldes, atributo, puntero)) {
				els = marcas(parte, atributo, puntero);
			}
			for (const el of els) {
				const caja = contenedor(el, parte);
				const ok = permitido(puntero, el);
				if (el !== ctx.editando) ponerTexto(el, ok ? (valor ?? '') : '');
				if (enLugar) {
					el.setAttribute('data-ed-hueco', HUECOS[puntero] ?? '+');
					// Sin contenedor y sin poder ocultarse (nombre del carrusel): queda vacío y ya.
					const quien = caja ?? (puntero === '/titular' ? el : null);
					if (quien) {
						ocultar(quien, !ok);
						vaciar(quien, ok && valor === null);
					}
				} else if (caja) {
					ocultar(caja, !ok || valor === null);
				}
			}
		}
	}
	for (const el of [...(parte.matches('[data-ed-linea]') ? [parte] : []), ...parte.querySelectorAll<HTMLElement>('[data-ed-linea]')]) {
		const texto = LINEAS[el.getAttribute('data-ed-linea')!]?.(o);
		if (texto != null && el.closest('[data-ed-item]') === parte) ponerTexto(el, texto);
	}
	// Rótulo de la fila de inicio: «Inicio previsto» en las contratadas.
	if (tiene(o, 'estado')) {
		for (const fila of parte.querySelectorAll('[data-ed-fila="inicio"] > dt')) ponerTexto(fila as HTMLElement, rotuloInicio(o.estado ?? null));
	}
	// El relato sin ningún paso escrito no deja su hueco en la ficha.
	for (const relato of parte.querySelectorAll('.relato')) {
		const pasos = [...relato.querySelectorAll('[data-ed-fila]')];
		vaciar(relato, pasos.length > 0 && pasos.every((p) => p.hasAttribute('hidden') || p.hasAttribute('data-ed-vacio')));
	}
	if (tiene(o, 'tipo')) {
		for (const svg of parte.querySelectorAll<SVGElement>('[data-ed-picto]')) {
			if (svg.closest('[data-ed-item]') !== parte) continue;
			dibujarPictograma(svg, pictogramaDeTipo(o.tipo));
			const caja = svg.parentElement;
			if (caja?.classList.contains('picto') && parte.matches('article.tarjeta')) {
				if (o.tipo) caja.setAttribute('title', o.tipo);
				else caja.removeAttribute('title');
			}
		}
	}
}

// Aplica a todas las partes de una obra.
export function aplicarObra(doc: Document, o: ObraParcial, ctx: Contexto) {
	for (const parte of partesDe(doc, itemDe(o.slug))) aplicarAParte(parte, o, ctx);
}

// --- Listas (etapa A2) ---
//
// Cada lista de la página (data-ed-lista) se rearma con su regla sobre las obras del borrador que
// se muestran (meta.incluir, o meta.nueva para verlas mientras se escriben), en el orden base del
// build (compararObras). Una lista es uno o varios «carriles» paralelos: el carrusel tiene tres (los
// textos, las fotos y las fichas del panel, que van en el mismo orden) y «En proyecto», uno.
// Cada obra ocupa una «raíz» en cada carril: se reutiliza la que hay, se clona del molde la que
// falta, se oculta (hidden + data-ed-quitada) la que ya no corresponde y se reordenan.

const SIZES: Record<string, string> = {
	carrusel: '(max-width: 760px) 88vw, 60vw',
	contratada: '(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw',
};
export const INSIGNIA_NUEVA = 'Borrador · fuera del sitio';

// id y hash de la ficha de una obra: `obra-<slug>`. El provisorio `~n1` pasa a `obra--n1` (sin
// caracteres que haya que escapar en un selector o en el hash; un slug real nunca lleva `--`).
export const idFicha = (slug: string) => `obra-${slug.replace('~', '-')}`;
// A dónde lleva el título de una obra (el carrusel lo frena y abre la ficha).
const enlaceDe = (slug: string) => (slug.startsWith('~') ? `#${idFicha(slug)}` : `/proyectos/${slug}/`);

export const enSitio = (b: ObraBorrador) => b.meta.incluir || b.meta.nueva;
// Fotos como las ve el build (proyectoDesdeJson): la referencial, si la hay, o las propias.
const fotosDe = (o: ObraParcial) => (o.referencia && referenciasDeObra[o.referencia] ? [referenciasDeObra[o.referencia]] : (o.fotos ?? []));
// El JSON completo (lo que falta, vacío): para rellenar un clon sin dejar textos del molde.
const VACIA = {
	nombre: null,
	titular: null,
	tipo: null,
	mandante: null,
	comuna: null,
	direccion: null,
	superficieM2: null,
	anio: null,
	inicio: null,
	servicios: [],
	desafio: null,
	solucion: null,
	resultado: null,
} as unknown as Omit<ObraParcial, 'slug'>;
const completa = (o: ObraParcial): ObraParcial => ({ ...VACIA, ...o });

// Obras de cada regla, en orden: los slugs.
export function obrasDeLista(regla: string, obras: ObraBorrador[]): string[] {
	if (!esRegla(regla)) return [];
	const lista = obras
		.filter((b) => enSitio(b) && b.json.estado)
		.map((b) => ({ ...b.json, estado: b.json.estado ?? null, anio: b.json.anio ?? null, fotos: fotosDe(b.json) }))
		.sort(compararObras);
	return seleccionar(regla, lista).map((o) => o.slug);
}

interface Carril {
	caja: Element; // contenedor de las raíces (.textos, .pista, .fichas, la <ul>)
	molde: string; // selector de la raíz en el documento de los moldes
}
const parteDe = (raiz: Element): HTMLElement | null =>
	raiz.hasAttribute('data-ed-item') ? (raiz as HTMLElement) : raiz.querySelector<HTMLElement>(':scope > [data-ed-item]');
const itemDeRaiz = (raiz: Element) => parteDe(raiz)?.getAttribute('data-ed-item') ?? null;
const raicesDe = (c: Carril) => [...c.caja.children].filter((r) => itemDeRaiz(r) !== null);

export function carrilesDe(doc: Document, lista: Element): Carril[] {
	const vista = lista.getAttribute('data-ed-vista');
	if (vista === 'contratada') return [{ caja: lista, molde: '[data-ed-molde="contratada"] > li[data-ed-item]' }];
	if (vista !== 'carrusel') return [];
	const panel = lista.getAttribute('data-panel');
	const fichas = panel ? doc.getElementById(panel)?.querySelector('.fichas') : null;
	const carriles = [
		{ caja: lista.querySelector('.textos'), molde: '[data-ed-molde="carrusel"] .textos > article.texto' },
		{ caja: lista.querySelector('.pista'), molde: '[data-ed-molde="carrusel"] .pista > li.foto' },
		{ caja: fichas ?? null, molde: '[data-ed-molde="carrusel"] .fichas > [data-ficha]' },
	];
	return carriles.filter((c): c is Carril => !!c.caja);
}

// Muestra u oculta una parte (sin destapar lo que ocultó otro: solo lo que tapó el puente).
function mostrarParte(parte: HTMLElement, si: boolean) {
	if (!si) {
		if (!parte.hidden) parte.setAttribute('data-ed-quitada', '');
		ocultar(parte, true);
	} else if (parte.hasAttribute('data-ed-quitada')) {
		parte.removeAttribute('data-ed-quitada');
		ocultar(parte, false);
	}
}

// Foto principal de un clon: la del JSON (rutas del sitio, protocolo.ts) o el recuadro «por recibir».
function ponerFotoClon(raiz: Element, o: ObraParcial, vista: string) {
	const img = raiz.querySelector('[data-ed-foto] img');
	if (!img) return;
	const f = fotoPrincipal({ fotos: fotosDe(o), estado: o.estado ?? null, nombre: o.nombre ?? null } as Proyecto) as FotoObra;
	img.setAttribute('src', f.src);
	img.setAttribute('alt', f.alt);
	for (const k of ['srcset', 'sizes', 'width', 'height']) img.removeAttribute(k);
	if (f.srcset) {
		img.setAttribute('srcset', f.srcset);
		img.setAttribute('sizes', SIZES[vista] ?? '100vw');
	}
	if (f.width && f.height) {
		img.setAttribute('width', String(f.width));
		img.setAttribute('height', String(f.height));
	}
}

// Clona la raíz del molde `m` para la obra `o` (completa) en una lista de la vista `vista`, cuyo
// panel de fichas es `panel`.
function clonar(doc: Document, m: Element, o: ObraParcial, vista: string, panel: string | null): Element {
	const raiz = doc.importNode(m, true) as HTMLElement;
	const item = itemDe(o.slug);
	for (const e of [raiz, ...raiz.querySelectorAll('[data-ed-item]')]) {
		if (e.getAttribute('data-ed-item') === 'obras/molde') e.setAttribute('data-ed-item', item);
	}
	raiz.setAttribute('data-ed-clon', '');
	if (raiz.matches('article.texto')) {
		raiz.classList.remove('activo', 'antes');
		raiz.classList.add('despues');
		raiz.inert = true;
		raiz.removeAttribute('data-indice');
		const boton = raiz.querySelector('.ver-ficha');
		if (boton) {
			boton.setAttribute('hidden', '');
			if (panel) boton.setAttribute('aria-controls', panel);
		}
	} else if (raiz.matches('li.foto')) {
		raiz.classList.add('futura');
		raiz.setAttribute('aria-hidden', 'true');
	} else if (raiz.hasAttribute('data-ficha')) {
		raiz.setAttribute('data-ficha', idFicha(o.slug));
		raiz.hidden = true;
		// La galería del molde es la de la obra de muestra.
		for (const g of [...raiz.querySelectorAll('.galeria')]) (g.parentElement && g.parentElement.parentElement === parteDe(raiz) ? g.parentElement : g).remove();
	}
	for (const a of raiz.querySelectorAll('a[href]')) if (a.getAttribute('href') === '/proyectos/molde/') a.setAttribute('href', enlaceDe(o.slug));
	ponerFotoClon(raiz, o, vista);
	return raiz;
}

// Insignia «Borrador · fuera del sitio» de una obra nueva (en el texto del carrusel y en la tarjeta).
function marcarNueva(parte: HTMLElement, nueva: boolean) {
	parte.toggleAttribute('data-ed-nueva', nueva);
	if (!parte.matches('article.texto, li')) return;
	const insignia = [...parte.children].find((h) => h.classList.contains('ed-insignia'));
	if (!nueva) {
		insignia?.remove();
		return;
	}
	if (insignia) return;
	const nuevaInsignia = parte.ownerDocument.createElement('span');
	nuevaInsignia.className = 'ed-insignia';
	nuevaInsignia.textContent = INSIGNIA_NUEVA;
	parte.prepend(nuevaInsignia);
}

// Rearma todas las listas. Devuelve las partes que quedaron a cargo de alguna lista.
export function rearmarListas(doc: Document, obras: ObraBorrador[], ctx: Contexto): Set<HTMLElement> {
	const porItem = new Map(obras.map((b) => [itemDe(b.json.slug), b]));
	const enListas = new Set<HTMLElement>();
	// Clones del puente de obras que ya no vienen en el borrador (el ~n1 al guardarse): fuera.
	for (const c of [...doc.querySelectorAll('[data-ed-clon]')]) {
		const item = itemDeRaiz(c);
		if (!item || !porItem.has(item)) c.remove();
	}
	for (const lista of doc.querySelectorAll<HTMLElement>('[data-ed-lista]')) {
		const carriles = carrilesDe(doc, lista);
		if (!carriles.length) continue;
		const vista = lista.getAttribute('data-ed-vista')!;
		const panel = lista.getAttribute('data-panel');
		const deseadas = obrasDeLista(lista.getAttribute('data-ed-lista')!, obras).map(itemDe);
		const quedan = new Set(deseadas);
		for (const c of carriles) {
			const raices = raicesDe(c);
			const hay = new Map(raices.map((r) => [itemDeRaiz(r)!, r]));
			// Las que faltan, del molde (se rellenan con el JSON completo).
			const m = ctx.moldes?.querySelector(c.molde) ?? null;
			for (const item of deseadas) {
				if (hay.has(item) || !m) continue;
				const o = completa(porItem.get(item)!.json);
				const clon = clonar(doc, m, o, vista, panel);
				aplicarAParte(parteDe(clon)!, o, ctx);
				hay.set(item, clon);
			}
			// Orden: las de la lista y después las ocultas (en todos los carriles igual).
			const orden = [...deseadas.map((i) => hay.get(i)).filter((r): r is Element => !!r), ...raices.filter((r) => !quedan.has(itemDeRaiz(r)!))];
			const actual = raicesDe(c);
			if (orden.length !== actual.length || orden.some((r, i) => r !== actual[i])) {
				// Lo que no es una obra (la tarjeta «+ Nueva obra») queda al final.
				const otros = [...c.caja.children].filter((h) => itemDeRaiz(h) === null);
				for (const r of orden) c.caja.append(r);
				for (const h of otros) c.caja.append(h);
			}
			for (const r of orden) {
				const parte = parteDe(r)!;
				const item = itemDeRaiz(r)!;
				enListas.add(parte);
				mostrarParte(parte, quedan.has(item));
				marcarNueva(parte, !!porItem.get(item)?.meta.nueva);
			}
		}
	}
	return enListas;
}

// Cantidad de obras de cada estado (índice de /proyectos/): las que se ven, también las nuevas.
function contar(doc: Document, obras: ObraBorrador[]) {
	for (const el of doc.querySelectorAll<HTMLElement>('[data-ed-cuenta]')) {
		const estado = el.getAttribute('data-ed-cuenta');
		ponerTexto(el, String(obras.filter((b) => enSitio(b) && b.json.estado === estado).length));
	}
}

// Carruseles con obras de la Bóveda: que se rearmen (src/scripts/carrusel.ts).
export function refrescarCarruseles(doc: Document) {
	const Evento = doc.defaultView?.CustomEvent ?? CustomEvent;
	for (const c of doc.querySelectorAll('[data-carrusel]')) {
		if (c.hasAttribute('data-ed-lista') || c.querySelector('[data-ed-item]')) c.dispatchEvent(new Evento('lols:refrescar'));
	}
}

// Borrador completo: el estado de todas las obras y de las listas.
export function aplicarBorrador(doc: Document, obras: ObraBorrador[], ctx: Contexto) {
	const porItem = new Map(obras.map((b) => [itemDe(b.json.slug), b]));
	const enListas = rearmarListas(doc, obras, ctx);
	// Fuera de las listas (la página de la obra, sus «otros proyectos»): se ve si está en el sitio.
	for (const parte of doc.querySelectorAll<HTMLElement>('[data-ed-item]')) {
		if (enListas.has(parte)) continue;
		const b = porItem.get(parte.getAttribute('data-ed-item')!);
		mostrarParte(parte, !!b && enSitio(b));
	}
	for (const { json } of obras) aplicarObra(doc, json, ctx);
	contar(doc, obras);
	refrescarCarruseles(doc);
}

// Listas de la página para el saludo: regla, vista y slugs en orden.
export function listasDe(doc: Document): ListaHola[] {
	return [...doc.querySelectorAll<HTMLElement>('[data-ed-lista]')].map((l) => ({
		regla: l.getAttribute('data-ed-lista')!,
		vista: l.getAttribute('data-ed-vista') ?? '',
		items: [...new Set([...l.querySelectorAll('[data-ed-item]')].map((e) => e.getAttribute('data-ed-item')!.slice(6)))],
	}));
}

// --- Fotos ---

export const MAX_FOTO = 5 * 1024 * 1024;
// Tipo de una foto por su firma (no por lo que diga el mensaje): WEBP o JPEG, hasta 5 MB.
export function tipoDeFoto(bytes: ArrayBuffer): 'image/webp' | 'image/jpeg' | null {
	if (bytes.byteLength > MAX_FOTO || bytes.byteLength < 12) return null;
	const b = new Uint8Array(bytes, 0, 12);
	const ascii = (i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));
	if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image/webp';
	if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
	return null;
}

// Pone `url` (blob: del sitio) como foto principal de la obra en todas sus apariciones.
export function ponerFoto(doc: Document, item: string, url: string) {
	for (const parte of partesDe(doc, item)) {
		const marcos = [...(parte.matches('[data-ed-foto]') ? [parte] : []), ...parte.querySelectorAll<HTMLElement>('[data-ed-foto]')];
		for (const marco of marcos) {
			const img = marco.querySelector('img');
			if (!img) continue;
			img.removeAttribute('srcset');
			img.removeAttribute('sizes');
			img.setAttribute('src', url);
			// La etiqueta «Imagen referencial» ya no corresponde.
			for (const etiqueta of marco.querySelectorAll('.etiqueta-ref')) ocultar(etiqueta, true);
		}
	}
}
