// Editor visual (docs/editor-visual.md): el puente aplicado al HTML del build. Correr después de
// `npm run build` (lee dist/). Usa las funciones puras del puente (src/scripts/editor/aplicar.ts y
// protocolo.ts), sin mensajería ni navegador real.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { aplicarBorrador, listasDe, partesDe, ponerFoto, tipoDeFoto } from '../src/scripts/editor/aplicar';
import { aceptarIniciar, leerEntrante, origenesHola, origenPermitido, P, V, type ObraBorrador } from '../src/scripts/editor/protocolo';
import { pictogramaDeTipo, piezasPictograma } from '../src/data/pictogramas';
import type { ObraJson } from '../src/data/vistaObra';

const dist = join(process.cwd(), 'dist');
const leer = (ruta: string) => new DOMParser().parseFromString(readFileSync(join(dist, ruta), 'utf8'), 'text/html') as unknown as Document;
const obrasReales: ObraJson[] = readdirSync('src/content/obras')
	.filter((f) => f.endsWith('.json'))
	.map((f) => JSON.parse(readFileSync(join('src/content/obras', f), 'utf8')));
const borrador = (cambios: Record<string, Partial<ObraJson>> = {}, quitar: string[] = []): ObraBorrador[] =>
	obrasReales.map((o) => ({ json: { ...o, ...cambios[o.slug] }, meta: { incluir: !quitar.includes(o.slug), nueva: false } }));

let moldes: Document;
beforeAll(() => {
	if (!existsSync(join(dist, 'proyectos/index.html'))) throw new Error('Falta dist/: correr antes npm run build');
	moldes = leer('editor/moldes/index.html');
});

const item = (slug: string) => `obras/${slug}`;
const en = (doc: Document, slug: string, selector: string) =>
	partesDe(doc, item(slug)).flatMap((p) => [...(p.matches(selector) ? [p] : []), ...p.querySelectorAll<HTMLElement>(selector)]);
const textos = (els: Element[]) => els.map((e) => e.textContent!.trim());
const fichaDe = (doc: Document, slug: string) => partesDe(doc, item(slug)).find((p) => p.classList.contains('ficha-obra'))!;
const fila = (ficha: Element, nombre: string) => ficha.querySelector<HTMLElement>(`[data-ed-fila="${nombre}"]`);
// Visible dentro de su obra (el panel de fichas del carrusel está cerrado: eso no cuenta).
const visible = (el: Element | null) => {
	for (let e = el; e; e = e.parentElement) {
		if (e.hasAttribute('hidden') || e.hasAttribute('data-ed-vacio')) return false;
		if (e.hasAttribute('data-ed-item')) return true;
	}
	return !!el;
};

describe('moldes', () => {
	it('la página de moldes tiene cada vista con la obra `molde`', () => {
		for (const vista of ['carrusel', 'ficha-1', 'ficha-3', 'contratada', 'tarjeta']) {
			const caja = moldes.querySelector(`[data-ed-molde="${vista}"]`);
			expect(caja, vista).not.toBeNull();
			expect(caja!.querySelector('[data-ed-item="obras/molde"]'), vista).not.toBeNull();
		}
		const ficha = moldes.querySelector('[data-ed-molde="ficha-1"] .ficha-obra')!;
		for (const f of ['tipo', 'mandante', 'comuna', 'direccion', 'superficie', 'anio', 'servicios', 'estado', 'desafio', 'solucion', 'resultado']) {
			expect(fila(ficha, f), f).not.toBeNull();
		}
		expect(moldes.querySelector('[data-ed-molde="ficha-1"] [data-ed-fila="inicio"]')).not.toBeNull();
		// Sin marcadores de propuesta en los moldes (el pie del layout sí los tiene fuera de producción).
		for (const caja of moldes.querySelectorAll('[data-ed-molde]')) expect(caja.innerHTML).not.toMatch(/\[PENDIENTE|data-pendiente|etiqueta-ref/);
	});
});

describe('/proyectos/', () => {
	let doc: Document;
	beforeAll(() => {
		doc = leer('proyectos/index.html');
	});

	it('el saludo lista las tres listas con sus obras en orden', () => {
		const listas = listasDe(doc);
		expect(listas.map((l) => [l.regla, l.vista])).toEqual([
			['proyectos-en-curso', 'carrusel'],
			['proyectos-contratados', 'contratada'],
			['proyectos-terminados', 'carrusel'],
		]);
		const enCurso = obrasReales.filter((o) => o.estado === 'en-curso').length;
		expect(listas[0].items).toHaveLength(enCurso);
		expect(listas[0].items).toContain('maipu-40');
	});

	it('el borrador sin cambios deja los textos como estaban', () => {
		const antes = textos([...doc.querySelectorAll('.texto, .contratadas li, .ficha-obra')]);
		aplicarBorrador(doc, borrador(), { moldes });
		const despues = [...doc.querySelectorAll('.texto, .contratadas li, .ficha-obra')].map((e) => {
			// Lo agregado para los huecos de edición (vacío) no se ve: se saca para comparar.
			const c = e.cloneNode(true) as Element;
			for (const v of c.querySelectorAll('[data-ed-vacio], [data-ed-fila][hidden], [data-ed-parte][hidden]')) v.remove();
			return c.textContent!.trim();
		});
		expect(despues).toEqual(antes);
	});

	it('cambia nombre, titular, comuna, superficie, tipo y año en todas sus apariciones', () => {
		aplicarBorrador(
			doc,
			borrador({
				'maipu-40': { nombre: 'Maipú Cuarenta', titular: 'Otro titular.', comuna: 'Estación Central', superficieM2: 12345, tipo: 'Bodegaje' },
				'monumento-2212': { anio: 2001 },
			}),
			{ moldes },
		);
		expect(textos(en(doc, 'maipu-40', '[data-ed-campo="/nombre"]'))).toEqual(['Maipú Cuarenta', 'Maipú Cuarenta']);
		expect(textos(en(doc, 'maipu-40', '[data-ed-campo="/titular"]'))).toEqual(['Otro titular.']);
		expect(textos(en(doc, 'maipu-40', '[data-ed-campo="/comuna"]'))).toEqual(['Estación Central']);
		expect(textos(en(doc, 'maipu-40', '[data-ed-derivado="/superficieM2"]'))).toEqual(['12.345 m²']);
		// La línea del carrusel se rearma entera (data-ed-linea), como la arma el build.
		expect(en(doc, 'maipu-40', '[data-ed-linea="resumen"]')[0].textContent).toBe('Estación Central · 12.345 m²');
		expect(textos(en(doc, 'maipu-40', '[data-ed-derivado="/tipo"]'))).toEqual(['Bodegaje', 'Bodegaje']);
		// El pictograma se redibuja con el del tipo nuevo.
		const svg = en(doc, 'maipu-40', '[data-ed-picto]')[0];
		const { macizos } = piezasPictograma(pictogramaDeTipo('Bodegaje'));
		expect(svg.querySelectorAll('g[fill="currentColor"] rect')).toHaveLength(macizos.length);
		expect(svg.querySelector('rect')!.getAttribute('width')).toBe(String(macizos[0].width));
		// Año: en la línea del carrusel y en la ficha de la terminada.
		expect(textos(en(doc, 'monumento-2212', '[data-ed-derivado="/anio"]'))).toEqual(['2001']);
		expect(en(doc, 'monumento-2212', '.resumen')[0].textContent).toMatch(/ · 2001$/);
	});

	it('un campo que estaba en null aparece desde el molde, en su lugar', () => {
		aplicarBorrador(
			doc,
			borrador({
				'maipu-40': { mandante: 'Inmobiliaria Ejemplo', desafio: 'Un desafío.' },
				'av-espana-778': { titular: 'Titular nuevo.', superficieM2: 900 },
			}),
			{ moldes },
		);
		const ficha = fichaDe(doc, 'maipu-40');
		const filas = [...ficha.querySelectorAll('.datos > [data-ed-fila]')].filter(visible).map((f) => f.getAttribute('data-ed-fila'));
		expect(filas).toEqual(['tipo', 'mandante', 'comuna', 'direccion', 'superficie', 'servicios', 'estado']);
		expect(fila(ficha, 'mandante')!.querySelector('dt')!.textContent).toBe('Mandante');
		expect(fila(ficha, 'mandante')!.querySelector('dd')!.textContent).toBe('Inmobiliaria Ejemplo');
		// El relato se arma entero (los pasos vacíos quedan como hueco) y va después del recuadro.
		const relato = ficha.querySelector('.relato')!;
		expect(relato.previousElementSibling!.matches('dl.datos')).toBe(true);
		expect(visible(relato)).toBe(true);
		expect([...relato.querySelectorAll('[data-ed-fila]')].map((p) => [p.getAttribute('data-ed-fila'), visible(p)])).toEqual([
			['desafio', true],
			['solucion', false],
			['resultado', false],
		]);
		expect(relato.querySelector('h4')!.textContent).toBe('Desafío'); // ficha del panel: nivel 3
		// Titular en una obra que no lo tenía: después del nombre, con el nivel de su ficha.
		const titular = en(doc, 'av-espana-778', '[data-ed-campo="/titular"]')[0];
		expect(titular.tagName).toBe('H3');
		expect(titular.previousElementSibling!.classList.contains('nombre')).toBe(true);
		expect(visible(titular)).toBe(true);
		expect(en(doc, 'av-espana-778', '.resumen')[0].textContent).toBe('Santiago · 900 m² · 2014');
		expect(visible(fila(fichaDe(doc, 'av-espana-778'), 'superficie'))).toBe(true);
	});

	it('un campo que queda en null oculta su fila (y deja el hueco para escribirlo)', () => {
		aplicarBorrador(doc, borrador({ 'maipu-40': { direccion: null, superficieM2: null, titular: null } }), { moldes });
		const ficha = fichaDe(doc, 'maipu-40');
		expect(fila(ficha, 'direccion')!.hasAttribute('data-ed-vacio')).toBe(true);
		expect(fila(ficha, 'direccion')!.querySelector('dd')!.getAttribute('data-ed-hueco')).toBe('+ Dirección');
		expect(fila(ficha, 'superficie')!.hidden).toBe(true);
		expect(en(doc, 'maipu-40', '.resumen')[0].textContent).toBe('Santiago');
		expect(visible(ficha.querySelector('[data-ed-campo="/titular"]'))).toBe(false);
		// Y vuelve al poner el valor de nuevo.
		aplicarBorrador(doc, borrador(), { moldes });
		expect(visible(fila(ficha, 'direccion'))).toBe(true);
		expect(visible(fila(ficha, 'superficie'))).toBe(true);
	});

	it('la fila de fecha sigue al estado: inicio previsto en las contratadas', () => {
		aplicarBorrador(doc, borrador({ 'maipu-40': { inicio: 'Marzo 2027' } }), { moldes });
		const ficha = fichaDe(doc, 'maipu-40');
		expect(fila(ficha, 'inicio')!.querySelector('dd')!.textContent).toBe('Marzo 2027');
		expect(fila(ficha, 'inicio')!.querySelector('dt')!.textContent).toBe('Inicio');
		expect(fila(ficha, 'anio')).toBeNull();
		aplicarBorrador(doc, borrador({ 'romero-3008': { inicio: 'Enero 2027' } }), { moldes });
		expect(textos(en(doc, 'romero-3008', '[data-ed-derivado="/inicio"]'))).toEqual(['Inicio previsto: Enero 2027']);
		aplicarBorrador(doc, borrador({ 'romero-3008': { comuna: 'Ñuñoa', superficieM2: null } }), { moldes });
		expect(textos(en(doc, 'romero-3008', '[data-ed-linea="contratada"]'))).toEqual(['Edificio y oficinas · Ñuñoa']);
	});

	it('incluir = false oculta todas las partes de la obra y la cuenta baja', () => {
		const cuenta = () => doc.querySelector('[data-ed-cuenta="en-curso"]')!.textContent;
		const n = obrasReales.filter((o) => o.estado === 'en-curso').length;
		aplicarBorrador(doc, borrador({}, ['maipu-40', 'romero-3008']), { moldes });
		const partes = partesDe(doc, item('maipu-40'));
		expect(partes.length).toBeGreaterThanOrEqual(3); // texto, foto y ficha del carrusel
		expect(partes.every((p) => p.hidden)).toBe(true);
		expect(partesDe(doc, item('romero-3008')).every((p) => p.hidden)).toBe(true);
		expect(cuenta()).toBe(String(n - 1));
		aplicarBorrador(doc, borrador(), { moldes });
		expect(partes.some((p) => p.hidden)).toBe(false);
		expect(cuenta()).toBe(String(n));
	});

	it('una foto nueva reemplaza la de todas las apariciones, sin srcset ni etiqueta referencial', () => {
		ponerFoto(doc, item('toesca-2770'), 'blob:https://nuevo.lols.cl/x');
		const imgs = en(doc, 'toesca-2770', '[data-ed-foto] img');
		expect(imgs.length).toBeGreaterThan(0);
		for (const img of imgs) {
			expect(img.getAttribute('src')).toBe('blob:https://nuevo.lols.cl/x');
			expect(img.hasAttribute('srcset')).toBe(false);
		}
	});
});

describe('portada y página de obra', () => {
	it('la portada lista sus carruseles y aplica el borrador', () => {
		const doc = leer('index.html');
		expect(listasDe(doc).map((l) => l.regla)).toEqual(['portada-en-obra', 'portada-proximos']);
		const primera = listasDe(doc)[0].items[0];
		aplicarBorrador(doc, borrador({ [primera]: { nombre: 'Nombre nuevo' } }), { moldes });
		expect(textos(en(doc, primera, '[data-ed-campo="/nombre"]'))).toEqual(['Nombre nuevo', 'Nombre nuevo']);
		// «Han confiado en nosotros» no es de la Bóveda: sin marcas.
		expect(doc.querySelector('#han-confiado [data-ed-item]')).toBeNull();
	});

	it('la página de la obra: titular grande (h1) desde el molde de nivel 1', () => {
		const doc = leer('proyectos/av-espana-778/index.html');
		aplicarBorrador(doc, borrador({ 'av-espana-778': { titular: 'Un titular.' } }), { moldes });
		const titular = fichaDe(doc, 'av-espana-778').querySelector('[data-ed-campo="/titular"]')!;
		expect(titular.tagName).toBe('H1');
		expect(titular.textContent).toBe('Un titular.');
		expect(doc.querySelector('.portada[data-ed-foto="/fotos/0"]')).not.toBeNull();
	});
});

describe('protocolo', () => {
	const padre = {};
	const puerto = () => new MessageChannel().port1;
	const iniciar = { p: P, v: V, tipo: 'iniciar', modo: 'editar' };

	it('acepta iniciar solo del origen permitido, del padre y con un puerto', () => {
		const ok = { data: iniciar, origin: 'https://boveda.lols.cl', source: padre, ports: [puerto()] };
		expect(aceptarIniciar(ok, padre, 'nuevo.lols.cl')?.modo).toBe('editar');
		expect(aceptarIniciar({ ...ok, origin: 'https://test.boveda.lols.cl' }, padre, 'nuevo.lols.cl')).not.toBeNull();
		expect(aceptarIniciar({ ...ok, origin: 'https://evil.example' }, padre, 'nuevo.lols.cl')).toBeNull();
		expect(aceptarIniciar({ ...ok, origin: 'https://boveda.lols.cl.evil.example' }, padre, 'nuevo.lols.cl')).toBeNull();
		expect(aceptarIniciar({ ...ok, source: {} }, padre, 'nuevo.lols.cl')).toBeNull();
		expect(aceptarIniciar({ ...ok, ports: [] }, padre, 'nuevo.lols.cl')).toBeNull();
		expect(aceptarIniciar({ ...ok, data: { ...iniciar, p: 'otro' } }, padre, 'nuevo.lols.cl')).toBeNull();
		expect(aceptarIniciar({ ...ok, data: { ...iniciar, v: 2 } }, padre, 'nuevo.lols.cl')).toBeNull();
		expect(aceptarIniciar({ ...ok, data: { ...iniciar, tipo: 'borrador' } }, padre, 'nuevo.lols.cl')).toBeNull();
		expect(aceptarIniciar({ ...ok, data: 'iniciar' }, padre, 'nuevo.lols.cl')).toBeNull();
		// localhost: solo si el sitio mismo corre en local.
		const local = { ...ok, origin: 'http://localhost:5173' };
		expect(aceptarIniciar(local, padre, 'nuevo.lols.cl')).toBeNull();
		expect(aceptarIniciar(local, padre, 'localhost')).not.toBeNull();
		expect(origenPermitido('http://localhost:5173', '127.0.0.1')).toBe(true);
		expect(origenPermitido('https://localhost:5173', 'localhost')).toBe(false);
		expect(origenesHola('nuevo.lols.cl', ['http://localhost:5173/x'])).toEqual(['https://boveda.lols.cl', 'https://test.boveda.lols.cl']);
		expect(origenesHola('localhost', ['http://localhost:5173/x'])).toContain('http://localhost:5173');
	});

	it('descarta mensajes con otra forma', () => {
		const m = (x: object) => leerEntrante({ p: P, v: V, ...x });
		expect(m({ tipo: 'modo', modo: 'mirar' })).toEqual({ tipo: 'modo', modo: 'mirar' });
		expect(m({ tipo: 'modo', modo: 'otro' })).toBeNull();
		expect(leerEntrante({ v: V, tipo: 'modo', modo: 'mirar' })).toBeNull();
		expect(leerEntrante(null)).toBeNull();
		expect(m({ tipo: 'campo', item: 'obras/maipu-40', campo: '/nombre', valor: 'x' })).not.toBeNull();
		expect(m({ tipo: 'campo', item: 'obras/maipu-40', campo: '/nombre', valor: 'x'.repeat(161) })).toBeNull();
		expect(m({ tipo: 'campo', item: 'obras/../x', campo: '/nombre', valor: 'x' })).toBeNull();
		expect(m({ tipo: 'campo', item: 'obras/maipu-40', campo: '/fotos', valor: [] })).toBeNull();
		expect(m({ tipo: 'campo', item: 'obras/maipu-40', campo: '/superficieM2', valor: '12' })).toBeNull();
		expect(m({ tipo: 'mostrar', item: 'maipu-40' })).toBeNull();
		expect(m({ tipo: 'foto', item: 'obras/maipu-40', bytes: 'abc' })).toBeNull();
		expect(m({ tipo: 'borrador', obras: [{ json: { slug: 'Mal Slug' }, meta: { incluir: true, nueva: false } }] })).toBeNull();
		expect(m({ tipo: 'borrador', obras: [{ json: { slug: 'x' }, meta: { incluir: 'si', nueva: false } }] })).toBeNull();
		// Un campo inválido dentro del borrador se descarta; el resto se aplica.
		const b = m({ tipo: 'borrador', obras: [{ json: { slug: 'x', nombre: 'N', tipo: 'Castillo', extra: 1 }, meta: { incluir: true, nueva: false } }] });
		expect(b && b.tipo === 'borrador' && b.obras[0].json).toEqual({ slug: 'x', nombre: 'N' });
	});

	it('reconoce la foto por su firma y su peso', () => {
		const bytes = (cabeza: number[], n = 64) => {
			const b = new Uint8Array(n);
			b.set(cabeza);
			return b.buffer;
		};
		const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
		expect(tipoDeFoto(bytes([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')]))).toBe('image/webp');
		expect(tipoDeFoto(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
		expect(tipoDeFoto(bytes([0x89, 0x50, 0x4e, 0x47]))).toBeNull(); // PNG
		expect(tipoDeFoto(bytes(ascii('<svg'), 64))).toBeNull();
		expect(tipoDeFoto(bytes([0xff, 0xd8, 0xff], 5 * 1024 * 1024 + 1))).toBeNull();
	});
});

describe('seguridad del puente', () => {
	it('src/scripts/editor/ no usa APIs que interpretan HTML o código', () => {
		const dir = 'src/scripts/editor';
		for (const f of readdirSync(dir)) {
			const codigo = readFileSync(join(dir, f), 'utf8').replace(/^\s*\/\/.*$/gm, '');
			expect(codigo, f).not.toMatch(/\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b|document\.write|\beval\s*\(|new\s+Function\b/);
		}
	});
});
