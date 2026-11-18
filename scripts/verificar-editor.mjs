// Comprueba, después de `npm run build`, lo que el editor visual de la Bóveda necesita del sitio
// (contrato en docs/editor-visual.md):
//   - cada obra real (src/content/obras/<slug>.json) tiene su data-ed-item="obras/<slug>" y su
//     data-ed-campo="/nombre" en dist/proyectos/index.html (si el marcado cambia y pierde las
//     marcas, la Bóveda ya no podría editarla en el lugar);
//   - la página de moldes (dist/editor/moldes/index.html) existe, trae cada vista con la obra
//     `molde` y no tiene marcadores de propuesta;
//   - src/scripts/editor/ no usa innerHTML, outerHTML, insertAdjacentHTML, document.write, eval
//     ni new Function (fuera de los comentarios).
//
// Uso: node scripts/verificar-editor.mjs   (sale con 1 si encuentra algo)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.cwd();
const errores = [];
const leer = (ruta) => (existsSync(join(raiz, ruta)) ? readFileSync(join(raiz, ruta), 'utf8') : null);
// Etiquetas de apertura con sus atributos (sin dependencias; el HTML lo escribe Astro).
const etiquetas = (html) => [...html.matchAll(/<([a-zA-Z][\w-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>/g)];
const atributo = (attrs, nombre) => {
	const m = attrs.match(new RegExp(`(?:^|\\s)${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`));
	return m ? (m[1] ?? m[2] ?? m[3]) : null;
};

// 1. Obras reales con sus marcas en /proyectos/.
const listado = leer('dist/proyectos/index.html');
if (!listado) {
	errores.push('no hay dist/proyectos/index.html (correr antes npm run build)');
} else {
	const items = new Set();
	let enItem = null;
	const nombres = new Set();
	// Recorre en orden: un /nombre pertenece al último data-ed-item abierto antes que él (todas las
	// vistas ponen el nombre dentro de su parte).
	for (const [, , attrs] of etiquetas(listado)) {
		const item = atributo(attrs, 'data-ed-item');
		if (item) {
			items.add(item);
			enItem = item;
		}
		if (atributo(attrs, 'data-ed-campo') === '/nombre' && enItem) nombres.add(enItem);
	}
	const dir = join(raiz, 'src/content/obras');
	const slugs = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [];
	for (const slug of slugs) {
		if (!items.has(`obras/${slug}`)) errores.push(`${slug}: sin data-ed-item="obras/${slug}" en dist/proyectos/index.html (¿se perdieron las marcas al cambiar el marcado?)`);
		else if (!nombres.has(`obras/${slug}`)) errores.push(`${slug}: sin data-ed-campo="/nombre" dentro de su obra en dist/proyectos/index.html`);
	}
	for (const lista of ['proyectos-en-curso', 'proyectos-terminados']) {
		if (!listado.includes(`data-ed-lista="${lista}"`)) errores.push(`dist/proyectos/index.html: falta la lista data-ed-lista="${lista}"`);
	}
	console.log(`verificar-editor: ${slugs.length} obra(s) revisadas en /proyectos/`);
}

// 2. Moldes.
const moldes = leer('dist/editor/moldes/index.html');
if (!moldes) {
	errores.push('no existe dist/editor/moldes/index.html (src/pages/editor/moldes.astro)');
} else {
	const vistas = { carrusel: ['article', 'texto'], 'ficha-1': ['div', 'ficha-obra'], 'ficha-3': ['div', 'ficha-obra'], contratada: ['li', null], tarjeta: ['article', 'tarjeta'] };
	for (const [vista, [tag, clase]] of Object.entries(vistas)) {
		const inicio = moldes.indexOf(`data-ed-molde="${vista}"`);
		if (inicio === -1) {
			errores.push(`moldes: falta la vista data-ed-molde="${vista}"`);
			continue;
		}
		// Hasta la vista siguiente o el fin de <main> (el pie del layout no es parte de los moldes).
		const fin = [moldes.indexOf('data-ed-molde="', inicio + 1), moldes.indexOf('</main>', inicio)].filter((i) => i !== -1);
		const trozo = moldes.slice(inicio, fin.length ? Math.min(...fin) : undefined);
		const ok = etiquetas(trozo).some(
			([, t, attrs]) => t === tag && atributo(attrs, 'data-ed-item') === 'obras/molde' && (!clase || (atributo(attrs, 'class') ?? '').split(/\s+/).includes(clase)),
		);
		if (!ok) errores.push(`moldes: la vista «${vista}» no trae su <${tag}${clase ? `.${clase}` : ''} data-ed-item="obras/molde">`);
		if (/\[PENDIENTE|\[REVISAR|data-pendiente|etiqueta-ref/.test(trozo)) errores.push(`moldes: la vista «${vista}» tiene un marcador de propuesta`);
	}
	if (!/<meta name="robots" content="noindex/.test(moldes)) errores.push('moldes: falta <meta name="robots" content="noindex">');
}

// 3. APIs prohibidas en el puente.
const prohibidas = /\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b|document\.write|\beval\s*\(|new\s+Function\b/;
const dirPuente = join(raiz, 'src/scripts/editor');
for (const f of existsSync(dirPuente) ? readdirSync(dirPuente) : []) {
	readFileSync(join(dirPuente, f), 'utf8')
		.split(/\r?\n/) // con CRLF (checkout en Windows) un comentario no llegaría al $ de la regla
		.forEach((linea, i) => {
			const codigo = linea.replace(/^\s*\/\/.*$/, '');
			const m = codigo.match(prohibidas);
			if (m) errores.push(`src/scripts/editor/${f}:${i + 1}: usa ${m[0]} (prohibido en el puente: docs/editor-visual.md § 5)`);
		});
}

if (errores.length) {
	console.error(`\nverificar-editor: ${errores.length} problema(s)`);
	for (const e of errores) console.error(`  - ${e}`);
	process.exit(1);
}
console.log('verificar-editor: OK');
