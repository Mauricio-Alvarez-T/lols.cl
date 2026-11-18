// Controles de estructura del editor visual (etapa A2, docs/editor-visual.md § 4 «Etapa A2»). Los
// agrega el puente solo dentro de la Bóveda; en modo `mirar` y para el visitante no existen (los
// estilos de estilos.ts los ocultan fuera de html.ed-editar).
//
//   - «+ Nueva obra» en cada lista: en los carruseles, un botón en el encabezado; en la grilla
//     «En proyecto», una tarjeta punteada al final. Envía `nueva { lista }`.
//   - Ordenar: en la grilla, se arrastra la tarjeta (con el mouse, al moverlo; en pantallas táctiles,
//     con pulsación larga). En los carruseles, el botón «Ordenar» muestra las obras como una tira de
//     miniaturas (clase ed-ordenando en la sección) que se arrastran igual; «Listo» vuelve.
//     Al soltar se envía `mover { lista, item, indice }` y no se reordena nada aquí (más allá de la
//     marca de dónde caería): la Bóveda responde con un borrador.
// Texto siempre con textContent; nada de HTML desde afuera.
import type { Regla } from '../../data/selecciones';
import { esRegla, type Modo, type Saliente } from './protocolo';

type Enviar = (m: Saliente) => void;

// --- Arrastre (sin bibliotecas): pointer events, umbral con el mouse, pulsación larga en táctil ---

const UMBRAL_MOUSE = 5; // px antes de empezar a arrastrar con el mouse
const TOLERANCIA_TOQUE = 8; // px que se puede mover el dedo durante la pulsación larga
export const PULSACION_LARGA = 350; // ms

// Dónde caería lo que se arrastra: posición (0…n) entre los rectángulos de las demás, en orden de
// lectura (filas de arriba a abajo; en la fila, de izquierda a derecha).
export function indiceDeSoltar(rects: { left: number; top: number; width: number; bottom: number }[], x: number, y: number): number {
	for (let i = 0; i < rects.length; i++) {
		const r = rects[i];
		if (y < r.top) return i;
		if (y <= r.bottom && x < r.left + r.width / 2) return i;
	}
	return rects.length;
}

interface Arrastrable {
	raiz: HTMLElement; // donde se escucha
	elementos: () => HTMLElement[]; // lo que se puede arrastrar (visible, en orden)
	alSoltar: (el: HTMLElement, indice: number) => void;
	alTocar?: (el: HTMLElement) => void; // clic sin arrastrar
	activo: () => boolean;
}

function hacerArrastrable(op: Arrastrable) {
	const doc = op.raiz.ownerDocument;
	const win = doc.defaultView ?? window; // (un documento sin ventana: el de las pruebas)
	let pend: { el: HTMLElement; id: number; x0: number; y0: number; tactil: boolean; reloj: number } | null = null;
	let arr: {
		el: HTMLElement;
		otros: HTMLElement[];
		desde: number;
		x0: number;
		y0: number;
		sy0: number;
		x: number;
		y: number;
		indice: number;
		marca: HTMLElement;
		cuadro: number;
	} | null = null;
	// Lo soltado: el clic que sigue (llega justo después, a veces en otra tarea) no cuenta.
	let tragarClic: { el: HTMLElement; hasta: number } | null = null;

	const cancelarPend = () => {
		if (pend) win.clearTimeout(pend.reloj);
		pend = null;
	};

	const empezar = (el: HTMLElement, x: number, y: number, x0: number, y0: number) => {
		const lista = op.elementos();
		const desde = lista.indexOf(el);
		if (desde < 0) return;
		// Si se estaba escribiendo en la tarjeta, deja de escribirse (el texto no se arrastra).
		const activo = doc.activeElement as HTMLElement | null;
		if (activo && el.contains(activo)) activo.blur();
		doc.getSelection()?.removeAllRanges();
		const marca = doc.createElement('div');
		marca.className = 'ed-ui ed-marca-soltar';
		doc.body.append(marca);
		doc.documentElement.classList.add('ed-arrastrando-algo');
		el.classList.add('ed-arrastrando');
		arr = { el, otros: lista.filter((e) => e !== el), desde, x0, y0, sy0: win.scrollY, x, y, indice: desde, marca, cuadro: 0 };
		mover(x, y);
		arr.cuadro = win.requestAnimationFrame(desplazar);
	};

	const mover = (x: number, y: number) => {
		if (!arr) return;
		arr.x = x;
		arr.y = y;
		arr.el.style.transform = `translate(${x - arr.x0}px, ${y - arr.y0 + (win.scrollY - arr.sy0)}px)`;
		const rects = arr.otros.map((e) => e.getBoundingClientRect());
		arr.indice = indiceDeSoltar(rects, x, y);
		// Marca: una barra al borde de la que quedaría después (o al final de la última).
		const ref = rects[arr.indice] ?? rects[rects.length - 1];
		if (!ref) {
			arr.marca.hidden = true;
			return;
		}
		const alFinal = arr.indice >= rects.length;
		const s = arr.marca.style;
		arr.marca.hidden = false;
		s.left = `${(alFinal ? ref.right + 4 : ref.left - 8)}px`;
		s.top = `${ref.top}px`;
		s.height = `${ref.height}px`;
	};

	// Cerca del borde de arriba o de abajo, la página se desplaza sola (la grilla es larga en el teléfono).
	const desplazar = () => {
		if (!arr) return;
		const borde = 56;
		const paso = arr.y < borde ? -14 : arr.y > win.innerHeight - borde ? 14 : 0;
		if (paso) {
			win.scrollBy(0, paso);
			mover(arr.x, arr.y);
		}
		arr.cuadro = win.requestAnimationFrame(desplazar);
	};

	const terminar = (soltar: boolean) => {
		cancelarPend();
		if (!arr) return;
		const { el, desde, indice, marca, cuadro } = arr;
		win.cancelAnimationFrame(cuadro);
		arr = null;
		marca.remove();
		el.classList.remove('ed-arrastrando');
		el.style.removeProperty('transform');
		doc.documentElement.classList.remove('ed-arrastrando-algo');
		tragarClic = { el, hasta: Date.now() + 400 };
		if (soltar && indice !== desde) op.alSoltar(el, indice);
	};

	op.raiz.addEventListener('pointerdown', (e) => {
		if (!op.activo() || arr || (e.pointerType === 'mouse' && e.button !== 0)) return;
		const el = op.elementos().find((x) => x.contains(e.target as Node));
		if (!el) return;
		// Escribiendo en un campo de la tarjeta: el mouse selecciona texto, no arrastra.
		const escribiendo = (e.target as HTMLElement).closest('[contenteditable]');
		if (escribiendo && escribiendo === doc.activeElement && e.pointerType === 'mouse') return;
		cancelarPend();
		const tactil = e.pointerType !== 'mouse';
		const { clientX: x0, clientY: y0, pointerId: id } = e;
		pend = {
			el,
			id,
			x0,
			y0,
			tactil,
			reloj: tactil
				? win.setTimeout(() => {
						if (!pend) return;
						const p = pend;
						pend = null;
						empezar(p.el, p.x0, p.y0, p.x0, p.y0);
						navigator.vibrate?.(15);
					}, PULSACION_LARGA)
				: 0,
		};
	});
	win.addEventListener('pointermove', (e) => {
		if (arr) return mover(e.clientX, e.clientY);
		if (!pend || e.pointerId !== pend.id) return;
		const d = Math.hypot(e.clientX - pend.x0, e.clientY - pend.y0);
		if (pend.tactil) {
			if (d > TOLERANCIA_TOQUE) cancelarPend(); // era un desplazamiento de la página
		} else if (d > UMBRAL_MOUSE) {
			const p = pend;
			pend = null;
			empezar(p.el, e.clientX, e.clientY, p.x0, p.y0);
		}
	});
	win.addEventListener('pointerup', (e) => {
		if (arr) return terminar(true);
		if (pend && e.pointerId === pend.id && op.alTocar) op.alTocar(pend.el);
		cancelarPend();
	});
	win.addEventListener('pointercancel', () => terminar(false));
	win.addEventListener('keydown', (e) => e.key === 'Escape' && arr && terminar(false));
	// Con el dedo, mientras se arrastra la página no se desplaza.
	doc.addEventListener('touchmove', (e) => arr && e.cancelable && e.preventDefault(), { passive: false });
	// La pulsación larga no abre el menú del navegador ni arrastra la imagen o el enlace.
	op.raiz.addEventListener('contextmenu', (e) => (pend || arr) && e.preventDefault());
	op.raiz.addEventListener('dragstart', (e) => op.activo() && e.preventDefault());
	// El clic que sigue a soltar no abre la ficha ni entra al campo.
	win.addEventListener(
		'click',
		(e) => {
			const t = tragarClic;
			tragarClic = null;
			if (!t || Date.now() > t.hasta || !t.el.contains(e.target as Node)) return;
			e.preventDefault();
			e.stopImmediatePropagation(); // también los otros oyentes de window (los del puente)
		},
		true,
	);
}

// --- Controles de cada lista ---

const boton = (doc: Document, texto: string, accion: string) => {
	const b = doc.createElement('button');
	b.type = 'button';
	b.className = 'ed-boton';
	b.setAttribute('data-ed-accion', accion);
	b.textContent = texto;
	return b;
};

export interface Controles {
	refrescar(): void; // después de un borrador
	modo(m: Modo): void;
	salirDeOrdenar(): void;
}

export function montarControles(doc: Document, enviar: Enviar): Controles {
	let modoActual: Modo = 'mirar';
	const editando = () => modoActual === 'editar';
	const visibles = (els: Iterable<HTMLElement>) => [...els].filter((e) => !e.hidden);
	const tiras: { seccion: HTMLElement; tira: HTMLElement; ordenar: HTMLButtonElement; regla: Regla }[] = [];
	const grillas: HTMLElement[] = [];

	for (const lista of doc.querySelectorAll<HTMLElement>('[data-ed-lista]')) {
		const regla = lista.getAttribute('data-ed-lista');
		if (!esRegla(regla)) continue;
		const nueva = boton(doc, '+ Nueva obra', 'nueva');
		nueva.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (editando()) enviar({ tipo: 'nueva', lista: regla });
		});
		const vista = lista.getAttribute('data-ed-vista');
		if (vista === 'contratada') {
			// Tarjeta punteada al final de la grilla.
			const li = doc.createElement('li');
			li.className = 'ed-ui ed-nueva-obra';
			li.append(nueva);
			lista.append(li);
			grillas.push(lista);
			hacerArrastrable({
				raiz: lista,
				elementos: () => visibles(lista.querySelectorAll<HTMLElement>(':scope > li[data-ed-item]')),
				alSoltar: (el, indice) => enviar({ tipo: 'mover', lista: regla, item: el.getAttribute('data-ed-item')!, indice }),
				activo: editando,
			});
		} else if (vista === 'carrusel') {
			const cabeza = lista.querySelector('.encabezado-carrusel');
			if (!cabeza) continue;
			const acciones = doc.createElement('div');
			acciones.className = 'ed-ui ed-acciones';
			const ordenar = boton(doc, 'Ordenar', 'ordenar');
			acciones.append(nueva, ordenar);
			cabeza.append(acciones);
			const tira = doc.createElement('ol');
			tira.className = 'ed-ui ed-tira';
			tira.setAttribute('aria-label', 'Orden de las obras (arrastrar para ordenar)');
			cabeza.after(tira);
			const t = { seccion: lista, tira, ordenar, regla };
			tiras.push(t);
			ordenar.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				ponerOrdenando(t, !lista.classList.contains('ed-ordenando'));
			});
			hacerArrastrable({
				raiz: tira,
				elementos: () => [...tira.querySelectorAll<HTMLElement>(':scope > li[data-ed-mini]')],
				alSoltar: (el, indice) => enviar({ tipo: 'mover', lista: regla, item: el.getAttribute('data-ed-mini')!, indice }),
				alTocar: (el) => enviar({ tipo: 'seleccion', item: el.getAttribute('data-ed-mini')!, campo: null }),
				activo: () => editando() && lista.classList.contains('ed-ordenando'),
			});
		}
	}

	// Miniaturas (foto y nombre) de las obras visibles del carrusel, en su orden.
	function armarTira(t: (typeof tiras)[number]) {
		const minis = visibles(t.seccion.querySelectorAll<HTMLElement>('.textos > article.texto[data-ed-item]')).map((texto) => {
			const item = texto.getAttribute('data-ed-item')!;
			const foto = [...t.seccion.querySelectorAll('.pista > li.foto')].find((f) => f.getAttribute('data-ed-item') === item);
			const li = doc.createElement('li');
			li.className = 'ed-mini';
			li.setAttribute('data-ed-mini', item);
			const marco = doc.createElement('span');
			marco.className = 'ed-mini-foto';
			const src = foto?.querySelector('img')?.currentSrc || foto?.querySelector('img')?.getAttribute('src');
			if (src) {
				const img = doc.createElement('img');
				img.src = src;
				img.alt = '';
				img.draggable = false;
				marco.append(img);
			}
			const nombre = doc.createElement('span');
			nombre.className = 'ed-mini-nombre';
			nombre.textContent = texto.querySelector('h3')?.textContent?.trim() || 'Sin nombre';
			li.append(marco, nombre);
			return li;
		});
		t.tira.replaceChildren(...minis);
	}

	function ponerOrdenando(t: (typeof tiras)[number], si: boolean) {
		t.seccion.classList.toggle('ed-ordenando', si);
		t.ordenar.textContent = si ? 'Listo' : 'Ordenar';
		t.ordenar.setAttribute('aria-pressed', String(si));
		if (si) armarTira(t);
		else t.tira.replaceChildren();
	}

	return {
		refrescar() {
			// La tarjeta «+ Nueva obra» siempre al final de su grilla.
			for (const g of grillas) {
				const tarjeta = g.querySelector(':scope > .ed-nueva-obra');
				if (tarjeta && tarjeta !== g.lastElementChild) g.append(tarjeta);
			}
			for (const t of tiras) if (t.seccion.classList.contains('ed-ordenando')) armarTira(t);
		},
		modo(m) {
			modoActual = m;
			if (m !== 'editar') for (const t of tiras) ponerOrdenando(t, false);
		},
		salirDeOrdenar() {
			for (const t of tiras) ponerOrdenando(t, false);
		},
	};
}
