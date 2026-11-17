// Huella de un build (dist/): sha256 de cada archivo, ordenado por ruta, para comprobar que un
// cambio de código no cambia lo que ve el visitante (p. ej. al agregar las marcas del editor
// visual, docs/editor-visual.md). Se compara la huella de dos builds:
//
//   node scripts/huella-dist.mjs [dist] > huella.txt
//   node scripts/huella-dist.mjs --comparar <distA> <distB>   (sale con 1 si difieren)
//
// Fuera de la huella: build.txt (lo escribe el deploy), editor/** (moldes del editor) y
// _astro/*.js (los scripts cambian de nombre y de contenido con cualquier cambio de código).
// Antes de calcular, cada .html y .css se normaliza:
//   - sin atributos data-ed-* ni los <span> que solo existen para llevarlos (data-ed-parte,
//     data-ed-campo…: se deja su contenido);
//   - data-astro-cid-<hash> pasa a data-astro-cid (el hash cambia si se mueve un componente);
//   - sin <script> (su contenido y sus src son de _astro/*.js);
//   - el hash del nombre de los archivos de _astro/ se quita (en las rutas y en las referencias).
// Y todo archivo de texto pasa a fin de línea LF: un checkout en Windows (core.autocrlf) deja
// algunos archivos de public/ con CRLF y el build los copia tal cual.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const fuera = (ruta) => ruta === 'build.txt' || ruta.startsWith('editor/') || /^_astro\/.*\.m?js$/.test(ruta);
const sinHash = (ruta) => ruta.replace(/^(_astro\/.+?)\.[A-Za-z0-9_-]{8}(\.[a-z0-9]+)$/, '$1$2');

function archivos(dir, base = dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? archivos(join(dir, e.name), base) : [relative(base, join(dir, e.name)).replaceAll('\\', '/')],
	);
}

const cid = (t) => t.replace(/data-astro-cid-[a-z0-9]+/g, 'data-astro-cid');
const refsAstro = (t) => t.replace(/(\/_astro\/[^"'()\s]+?)\.[A-Za-z0-9_-]{8}(\.[a-z0-9]+)/g, '$1$2');

// <span> cuyos atributos son solo data-ed-* (y el data-astro-cid de su componente), con al menos uno.
const soloMarca = (attrs) => {
	const nombres = [...attrs.matchAll(/([^\s"'=/>]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g)].map((m) => m[1]);
	return nombres.some((n) => n.startsWith('data-ed-')) && nombres.every((n) => n.startsWith('data-ed-') || n.startsWith('data-astro-cid-'));
};
function sinSpansDeMarca(html) {
	const pila = [];
	return html.replace(/<span(\s[^>]*)?>|<\/span>/g, (tag, attrs = '') => {
		if (tag === '</span>') return pila.pop() ? '' : tag;
		const quitar = soloMarca(attrs);
		pila.push(quitar);
		return quitar ? '' : tag;
	});
}

export function normalizarHtml(html) {
	let t = html.replace(/<script\b[\s\S]*?<\/script>/g, '');
	t = sinSpansDeMarca(t);
	t = t.replace(/\sdata-ed-[a-z-]+(?:="[^"]*")?/g, '');
	return refsAstro(cid(t));
}

const esTexto = (ruta) => /\.(html|css|svg|txt|php|ini|htaccess|json|xml|webmanifest)$/.test(ruta);

export function huella(dist) {
	const lineas = [];
	for (const ruta of archivos(dist).filter((r) => !fuera(r))) {
		let datos = readFileSync(join(dist, ruta));
		if (esTexto(ruta)) datos = Buffer.from(datos.toString('utf8').replaceAll('\r\n', '\n'));
		if (ruta.endsWith('.html')) datos = Buffer.from(normalizarHtml(datos.toString('utf8')));
		else if (ruta.endsWith('.css')) datos = Buffer.from(refsAstro(cid(datos.toString('utf8'))));
		lineas.push([sinHash(ruta), createHash('sha256').update(datos).digest('hex')]);
	}
	return new Map(lineas.sort(([a], [b]) => (a < b ? -1 : 1)));
}

const args = process.argv.slice(2);
if (args[0] === '--comparar') {
	const [a, b] = [args[1], args[2]];
	if (!a || !b || !existsSync(a) || !existsSync(b)) {
		console.error('huella-dist: uso: node scripts/huella-dist.mjs --comparar <distA> <distB>');
		process.exit(1);
	}
	const [ha, hb] = [huella(a), huella(b)];
	const difieren = [...new Set([...ha.keys(), ...hb.keys()])].sort().filter((r) => ha.get(r) !== hb.get(r));
	for (const r of difieren) console.log(`${!ha.has(r) ? 'solo en B' : !hb.has(r) ? 'solo en A' : 'distinto '}  ${r}`);
	console.log(`huella-dist: ${ha.size} / ${hb.size} archivos; ${difieren.length} distinto(s)`);
	process.exit(difieren.length ? 1 : 0);
} else if (process.argv[1]?.endsWith('huella-dist.mjs')) {
	const dist = args[0] ?? 'dist';
	for (const [ruta, sha] of huella(dist)) console.log(`${sha}  ${ruta}`);
}
