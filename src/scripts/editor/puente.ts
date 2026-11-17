// Puente del editor visual (docs/editor-visual.md). Lo carga src/layouts/Base.astro solo si la
// página está dentro de un iframe y la URL trae ?editor: el visitante no lo descarga.
//
//   1. Saludo: `hola` a la ventana padre, una vez por cada origen permitido; acepta el primer
//      `iniciar` válido (origen permitido, desde window.parent y con un puerto) y desde ahí habla
//      solo por ese puerto.
//   2. Bóveda → puente: borrador, campo, modo, mostrar, foto (aplicar.ts hace el trabajo en el DOM).
//   3. Puente → Bóveda: seleccion, cambio, navegar, atajo.
// Prohibido aquí (verificar-editor.mjs lo revisa): innerHTML, outerHTML, insertAdjacentHTML,
// document.write, eval y new Function. Texto siempre con textContent.
import { limites } from '../../data/limitesObra';
import { aplicarBorrador, aplicarObra, itemDe, listasDe, partesDe, ponerFoto, tipoDeFoto, type Contexto } from './aplicar';
import { estilosEditor } from './estilos';
import { aceptarIniciar, leerEntrante, origenesHola, sobre, type Entrante, type Modo, type ObraParcial, type Saliente } from './protocolo';
import type { DetalleIr } from '../carrusel';

const build: string | null = import.meta.env.PUBLIC_BUILD_SHA ?? null;
let puerto: MessagePort | null = null;
let modo: Modo = 'mirar';
const obras = new Map<string, ObraParcial>(); // último JSON de cada obra (para aplicar un `campo`)
const fotos = new Map<string, string>(); // blob: vigente de cada obra

const enviar = (m: Saliente) => puerto?.postMessage(sobre(m));

// --- Estilos (solo dentro del editor) ---
const estilo = document.createElement('style');
estilo.textContent = estilosEditor;
document.head.append(estilo);

// --- Moldes: documento inerte (DOMParser no corre scripts), una sola vez ---
let moldes: Promise<Document | null> | null = null;
const cargarMoldes = () =>
	(moldes ??= fetch('/editor/moldes/', { credentials: 'same-origin' })
		.then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
		.then((html) => new DOMParser().parseFromString(html, 'text/html'))
		.catch(() => null));

// --- Edición en el lugar ---
const esCampo = (el: Element | null): el is HTMLElement => !!el && el.hasAttribute('data-ed-campo') && !!el.closest('[data-ed-item]');
const editando = (): HTMLElement | null => {
	const a = document.activeElement;
	return esCampo(a) && a.isContentEditable ? a : null;
};
const maximo = (el: HTMLElement) => limites[el.getAttribute('data-ed-campo')!.slice(1) as keyof typeof limites] ?? 200;
let soportaPlano: boolean | null = null;

// En modo editar, cada campo es editable (así el clic deja el cursor donde se tocó).
function prepararEdicion() {
	for (const el of document.querySelectorAll<HTMLElement>('[data-ed-campo]')) {
		if (!el.closest('[data-ed-item]')) continue;
		if (modo !== 'editar') {
			el.removeAttribute('contenteditable');
			continue;
		}
		if (el.isContentEditable) continue;
		el.setAttribute('contenteditable', 'plaintext-only');
		soportaPlano ??= el.contentEditable === 'plaintext-only';
		if (!soportaPlano) el.setAttribute('contenteditable', 'true');
		el.spellcheck = true;
	}
}
function ponerModo(m: Modo) {
	modo = m;
	document.documentElement.classList.toggle('ed-editar', m === 'editar');
	if (m === 'mirar') editando()?.blur();
	prepararEdicion();
}

// `cambio`: 150 ms después de la última tecla y al salir del campo.
let pendiente: { el: HTMLElement; reloj: number } | null = null;
function cambio(el: HTMLElement, final: boolean) {
	const item = el.closest('[data-ed-item]')?.getAttribute('data-ed-item');
	if (!item) return;
	const texto = el.textContent ?? '';
	const campo = el.getAttribute('data-ed-campo')!;
	const valor = final ? texto.trim() || null : texto;
	enviar({ tipo: 'cambio', item, campo, valor });
	// Las otras apariciones del mismo campo (carrusel, ficha, tarjeta) siguen lo que se escribe; la Bóveda
	// no lo devuelve como `campo`. El que se está escribiendo no se toca (ctx.editando).
	void ponerCampo(item, campo, valor);
}
function vaciarPendiente() {
	if (!pendiente) return;
	clearTimeout(pendiente.reloj);
	cambio(pendiente.el, false);
	pendiente = null;
}

// Texto plano en el cursor (pegar, y el respaldo sin plaintext-only), sin pasar el largo máximo.
function insertarTexto(el: HTMLElement, texto: string) {
	const sel = getSelection();
	const elegido = sel && sel.rangeCount && el.contains(sel.anchorNode) ? sel.toString().length : 0;
	const cabe = Math.max(0, maximo(el) - ((el.textContent ?? '').length - elegido));
	const t = texto.replace(/\s*[\r\n]+\s*/g, ' ').slice(0, cabe);
	if (!t || !sel?.rangeCount) return;
	// execCommand deja el cambio en la pila de deshacer del navegador y dispara `input`.
	if (document.execCommand('insertText', false, t)) return;
	const r = sel.getRangeAt(0);
	r.deleteContents();
	r.insertNode(document.createTextNode(t));
	r.collapse(false);
	el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

addEventListener(
	'beforeinput',
	(e) => {
		const el = editando();
		if (!el || !el.contains(e.target as Node)) return;
		const tipo = e.inputType;
		if (tipo === 'insertParagraph' || tipo === 'insertLineBreak' || tipo.startsWith('format') || tipo === 'insertFromDrop') {
			e.preventDefault();
			return;
		}
		if (tipo === 'insertText' && e.data) {
			const sel = getSelection();
			const elegido = sel?.toString().length ?? 0;
			if ((el.textContent ?? '').length - elegido + e.data.length > maximo(el)) e.preventDefault();
		}
	},
	true,
);
addEventListener(
	'paste',
	(e) => {
		const el = editando();
		if (!el) return;
		e.preventDefault();
		insertarTexto(el, e.clipboardData?.getData('text/plain') ?? '');
	},
	true,
);
addEventListener('drop', (e) => editando() && e.preventDefault(), true);
addEventListener(
	'input',
	(e) => {
		const el = editando();
		if (!el || !el.contains(e.target as Node)) return;
		// Sin plaintext-only, el navegador puede dejar un <br> o pasar el largo (autocompletar).
		if (el.firstElementChild && !el.closest('dd.con-picto')) el.textContent = el.textContent ?? '';
		const max = maximo(el);
		if ((el.textContent ?? '').length > max) el.textContent = (el.textContent ?? '').slice(0, max);
		if (pendiente && pendiente.el !== el) vaciarPendiente();
		if (pendiente) clearTimeout(pendiente.reloj);
		pendiente = { el, reloj: window.setTimeout(() => ((pendiente = null), cambio(el, false)), 150) };
	},
	true,
);
addEventListener(
	'focusout',
	(e) => {
		const el = e.target as HTMLElement;
		if (!esCampo(el) || !el.isContentEditable) return;
		if (pendiente?.el === el) {
			clearTimeout(pendiente.reloj);
			pendiente = null;
		}
		// Salir sin haber escrito (o el foco que pone la ficha al abrirse) no es un cambio.
		if (el.textContent !== alEntrar.get(el)) cambio(el, true);
	},
	true,
);

// Selección: al entrar a un campo (clic o Tab) y al tocar una foto, un derivado o una tarjeta. El
// foco que pone el sitio solo (el título de la ficha al abrirse) no selecciona.
let ultimaSeleccion = '';
let conTab = false;
const alEntrar = new WeakMap<HTMLElement, string | null>();
addEventListener('keydown', (e) => (conTab = e.key === 'Tab'), true);
addEventListener('pointerdown', () => (conTab = false), true);
function seleccionar(item: string, campo: string | null) {
	const clave = `${item} ${campo}`;
	if (clave === ultimaSeleccion) return;
	ultimaSeleccion = clave;
	enviar({ tipo: 'seleccion', item, campo });
}
addEventListener(
	'focusin',
	(e) => {
		const el = e.target as HTMLElement;
		if (esCampo(el)) alEntrar.set(el, el.textContent);
		if (modo === 'editar' && esCampo(el) && conTab) seleccionar(el.closest('[data-ed-item]')!.getAttribute('data-ed-item')!, el.getAttribute('data-ed-campo'));
	},
	true,
);

// Clics, en captura (antes que el sitio): tocar un campo lo edita sin seguir el enlace ni abrir la
// ficha; tocar la foto de un carrusel deja que el carrusel haga lo suyo (abrir la ficha, ir a esa
// obra), pero una tarjeta que lleva a otra página no navega: solo selecciona.
addEventListener(
	'click',
	(e) => {
		if (modo !== 'editar') return;
		const t = e.target as HTMLElement;
		const parte = t.closest('[data-ed-item]');
		if (!parte) return;
		const item = parte.getAttribute('data-ed-item')!;
		const enlace = t.closest('a');
		const delCarrusel = !!t.closest('[data-carrusel]');
		const campo = t.closest('[data-ed-campo]');
		if (campo && esCampo(campo)) {
			e.preventDefault();
			e.stopPropagation();
			seleccionar(item, campo.getAttribute('data-ed-campo'));
			if (!campo.isContentEditable) return;
			if (document.activeElement !== campo) campo.focus();
			return;
		}
		const marca = t.closest('[data-ed-derivado],[data-ed-foto]');
		ultimaSeleccion = '';
		seleccionar(item, marca?.getAttribute('data-ed-derivado') ?? marca?.getAttribute('data-ed-foto') ?? null);
		if (enlace && !delCarrusel) {
			e.preventDefault();
			e.stopPropagation();
		}
	},
	true,
);

// Enlaces, al final (después del sitio): un enlace interno a otra página no navega dentro del
// iframe; la Bóveda lo recarga en esa ruta con ?editor. Los de la misma página (#) siguen. Uno
// externo no se abre en el iframe (en una pestaña nueva, sí).
addEventListener('click', (e) => {
	if (e.defaultPrevented || e.button !== 0) return;
	const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
	if (!a) return;
	const url = new URL(a.href, location.href);
	if (url.origin !== location.origin) {
		if (a.target !== '_blank') e.preventDefault();
		return;
	}
	if (url.pathname === location.pathname && url.search === location.search) return;
	e.preventDefault();
	enviar({ tipo: 'navegar', ruta: url.pathname + url.hash });
});

// Teclado: atajos de la Bóveda (deshacer, rehacer, guardar) y, escribiendo, sin Enter y con Esc
// para salir. Mientras se escribe, las teclas no llegan al sitio (flechas del carrusel, Esc de la
// ficha).
addEventListener(
	'keydown',
	(e) => {
		const mod = e.ctrlKey || e.metaKey;
		const tecla = e.key.toLowerCase();
		const accion = mod && tecla === 'z' ? (e.shiftKey ? 'rehacer' : 'deshacer') : mod && tecla === 'y' ? 'rehacer' : mod && tecla === 's' ? 'guardar' : null;
		if (accion && puerto) {
			e.preventDefault();
			e.stopPropagation();
			vaciarPendiente();
			enviar({ tipo: 'atajo', accion });
			return;
		}
		const el = editando();
		if (!el) return;
		e.stopPropagation();
		if (e.key === 'Enter' || (mod && ['b', 'i', 'u'].includes(tecla))) e.preventDefault();
		if (e.key === 'Escape') {
			e.preventDefault();
			el.blur();
		}
	},
	true,
);

// Un campo de una obra, en todas sus apariciones (menos el que se está escribiendo).
async function ponerCampo(item: string, campo: string, valor: unknown) {
	const doc = await cargarMoldes();
	const slug = item.slice(6);
	const o = { ...(obras.get(slug) ?? { slug }), [campo.slice(1)]: valor } as ObraParcial;
	obras.set(slug, o);
	aplicarObra(document, o, { moldes: doc, editando: editando() });
	for (const c of document.querySelectorAll('[data-carrusel]')) if (c.querySelector('[data-ed-item]')) c.dispatchEvent(new CustomEvent('lols:refrescar'));
	prepararEdicion();
}

// --- Mensajes de la Bóveda ---
async function procesar(m: Entrante) {
	const ctx = (): Contexto => ({ moldes: null, editando: editando() });
	switch (m.tipo) {
		case 'borrador': {
			const doc = await cargarMoldes();
			obras.clear();
			for (const b of m.obras) obras.set(b.json.slug, b.json);
			aplicarBorrador(document, m.obras, { ...ctx(), moldes: doc });
			prepararEdicion();
			break;
		}
		case 'campo':
			await ponerCampo(m.item, m.campo, m.valor);
			break;
		case 'modo':
			ponerModo(m.modo);
			break;
		case 'mostrar': {
			const slug = m.item.slice(6);
			const carrusel = [...document.querySelectorAll<HTMLElement>('[data-carrusel]')].find((c) =>
				[...c.querySelectorAll('.texto[data-ed-item]')].some((t) => t.getAttribute('data-ed-item') === m.item && !(t as HTMLElement).hidden),
			);
			if (carrusel) carrusel.dispatchEvent(new CustomEvent<DetalleIr>('lols:ir', { detail: { slug, ficha: true } }));
			else partesDe(document, itemDe(slug)).find((p) => !p.hidden)?.scrollIntoView({ block: 'center' });
			break;
		}
		case 'foto': {
			const tipo = tipoDeFoto(m.bytes);
			if (!tipo) break;
			const url = URL.createObjectURL(new Blob([m.bytes], { type: tipo }));
			const vieja = fotos.get(m.item);
			fotos.set(m.item, url);
			ponerFoto(document, m.item, url);
			if (vieja) URL.revokeObjectURL(vieja);
			break;
		}
	}
}

// Los mensajes se aplican en orden, aunque uno espere a los moldes.
let cola: Promise<void> = Promise.resolve();
function recibir(e: MessageEvent) {
	const m = leerEntrante(e.data);
	if (m) cola = cola.then(() => procesar(m)).catch(() => undefined);
}

// --- Saludo ---
function alIniciar(e: MessageEvent) {
	const ok = aceptarIniciar(e, window.parent, location.hostname);
	if (!ok) return;
	removeEventListener('message', alIniciar);
	puerto = ok.puerto;
	puerto.onmessage = recibir;
	ponerModo(ok.modo);
	cargarMoldes();
}
addEventListener('message', alIniciar);

const hola: Saliente = { tipo: 'hola', ruta: location.pathname, build, listas: listasDe(document), limites: { ...limites } };
for (const origen of origenesHola(location.hostname, [location.ancestorOrigins?.[0], document.referrer])) {
	window.parent.postMessage(sobre(hola), origen);
}
