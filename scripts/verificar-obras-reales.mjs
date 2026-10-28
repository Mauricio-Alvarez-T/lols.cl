// Comprueba, después de `npm run build`, que ninguna obra real (src/content/obras/<slug>.json)
// se publique con marcadores de propuesta. Mira solo el marcado de cada obra, sin depender de
// atributos agregados para esto (el HTML queda igual):
//   - en dist/proyectos/<slug>/index.html: .portada, .ficha (que debe traer .ficha-obra) y <title>;
//   - en todo dist/: el panel [data-ficha="obra-<slug>"] de los carruseles; el <article> o <li>
//     más cercano que contenga un enlace a /proyectos/<slug>/ o un <h3 class="obra"> con el
//     nombre de la obra (lista de «En proyecto», que no enlaza), y el .marco de cada imagen de
//     /proyectos/<slug>/.
//     Cada obra tiene que aparecer así al menos una vez en dist/proyectos/index.html: si el
//     marcado cambia y la búsqueda deja de encontrarla, falla en vez de no revisar nada.
// El resto de la página («Otros proyectos» de otras obras, notas de sección, Contacto, Pie) no:
// esos marcadores los vigila el build de producción (SITE=https://lols.cl), que falla con cualquiera.
//
// Marcadores: data-pendiente, class pendiente / revisar / ejemplo, el texto [PENDIENTE: o
// [REVISAR:, y la etiqueta de imagen referencial (class etiqueta-ref). Esta última se acepta solo
// en una obra con `referencia` en su JSON: es su estado honesto hasta tener la foto real.
// Casos que ya existían al crear este control y se aceptan a sabiendas: CONOCIDOS (vacío hoy).
// También falla si una página tiene dos paneles [data-ficha="obra-<slug>"] (slug que choca con el
// id de una muestra).
//
// Uso: node scripts/verificar-obras-reales.mjs   (sale con 1 si encuentra algo)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.cwd();
const dirObras = join(raiz, 'src/content/obras');
const dist = join(raiz, 'dist');

// Excepciones explícitas: { slug, marcador, donde (RegExp sobre «ruta selector»), motivo }.
// Una entrada que ya no se usa también falla, para que la lista no quede vieja.
const CONOCIDOS = [];

const entradas = existsSync(dirObras) ? readdirSync(dirObras, { withFileTypes: true }) : [];
// El build solo lee src/content/obras/*.json: una subcarpeta o un «.JSON» pasarían sin que nadie
// los vea.
const extranas = entradas.filter((e) => e.name !== '.gitkeep' && !(e.isFile() && /^[a-z0-9]+(-[a-z0-9]+)*\.json$/.test(e.name)));
if (extranas.length) {
	console.error(`verificar-obras-reales: en src/content/obras/ solo van <slug>.json: ${extranas.map((e) => e.name).join(', ')}`);
	process.exit(1);
}
const obras = entradas
	.filter((e) => e.name.endsWith('.json'))
	.map((e) => {
		const slug = e.name.slice(0, -5);
		const datos = JSON.parse(readFileSync(join(dirObras, e.name), 'utf8'));
		// El esquema recorta los textos (trim) y textoDe junta los espacios: el nombre se compara igual.
		return { slug, nombre: String(datos.nombre ?? '').replace(/\s+/g, ' ').trim(), referencia: Boolean(datos.referencia) };
	});
if (!obras.length) {
	console.log('verificar-obras-reales: sin obras reales');
	process.exit(0);
}
if (!existsSync(join(dist, 'index.html'))) {
	console.error('verificar-obras-reales: no hay dist/index.html (correr antes npm run build)');
	process.exit(1);
}

// --- Árbol de elementos de una página, con escaneo de etiquetas balanceadas (sin dependencias).
const vacios = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const crudos = new Set(['script', 'style', 'textarea', 'title']);
const etiqueta = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g;

function arbol(html) {
	const elementos = []; // { nombre, attrs, inicio, finApertura, fin, padre }
	const abiertos = [];
	etiqueta.lastIndex = 0;
	let m;
	while ((m = etiqueta.exec(html))) {
		if (m[0].startsWith('<!--')) continue;
		const [todo, cierre, nombreCrudo, attrs, auto] = m;
		const nombre = nombreCrudo.toLowerCase();
		const fin = m.index + todo.length;
		if (cierre) {
			const i = abiertos.findLastIndex((e) => e.nombre === nombre);
			if (i === -1) continue;
			for (const e of abiertos.splice(i)) e.fin = fin;
			continue;
		}
		const el = { nombre, attrs, inicio: m.index, finApertura: fin, fin: html.length, padre: abiertos.at(-1) ?? null };
		elementos.push(el);
		if (vacios.has(nombre) || auto) {
			el.fin = fin;
			continue;
		}
		if (crudos.has(nombre)) {
			const cierreCrudo = html.indexOf(`</${nombre}`, fin);
			if (cierreCrudo !== -1) etiqueta.lastIndex = cierreCrudo;
		}
		abiertos.push(el);
	}
	return elementos;
}

const atributo = (attrs, nombre) => {
	const m = attrs.match(new RegExp(`(?:^|\\s)${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'));
	return m ? (m[1] ?? m[2] ?? m[3]) : null;
};
const tieneClase = (el, clase) => (atributo(el.attrs, 'class') ?? '').split(/\s+/).includes(clase);
const decodificar = (t) =>
	t
		.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
		.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
const textoDe = (html, el) => decodificar(html.slice(el.finApertura, el.fin).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
// Lo que rodea a un enlace o título de la obra: su <article> o <li> (tarjeta, ítem de carrusel o
// de lista). Una imagen se mira solo en su .marco: la ficha de un servicio, por ejemplo, muestra
// la foto de una obra dentro de un <li> que es del servicio, no de la obra.
const ancestro = (el, es) => {
	for (let e = el.padre; e; e = e.padre) if (es(e)) return e;
	return el;
};
const contenedor = (el) => ancestro(el, (e) => e.nombre === 'article' || e.nombre === 'li');
const marcoDe = (el) => ancestro(el, (e) => tieneClase(e, 'marco'));

// Lo que dejan <Pendiente> y <Referencial> en el HTML.
const marcadores = [
	{ nombre: 'data-pendiente', es: (a) => atributo(a, 'data-pendiente') !== null },
	{ nombre: 'class="pendiente"', es: (a) => (atributo(a, 'class') ?? '').split(/\s+/).includes('pendiente') },
	{ nombre: 'class="revisar"', es: (a) => (atributo(a, 'class') ?? '').split(/\s+/).includes('revisar') },
	{ nombre: 'class="ejemplo"', es: (a) => (atributo(a, 'class') ?? '').split(/\s+/).includes('ejemplo') },
	{ nombre: 'imagen referencial', es: (a) => (atributo(a, 'class') ?? '').split(/\s+/).includes('etiqueta-ref') },
];
function buscarMarcadores(trozo) {
	const hallados = new Set();
	if (trozo.includes('[REVISAR:')) hallados.add('[REVISAR:');
	if (trozo.includes('[PENDIENTE:')) hallados.add('[PENDIENTE:');
	etiqueta.lastIndex = 0;
	let m;
	while ((m = etiqueta.exec(trozo))) {
		if (m[1] || !m[3]) continue;
		for (const mk of marcadores) if (mk.es(m[3])) hallados.add(mk.nombre);
	}
	return [...hallados];
}

function htmlDe(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? htmlDe(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
	);
}
const paginas = htmlDe(dist).map((ruta) => {
	const html = readFileSync(ruta, 'utf8');
	return { ruta: ruta.slice(dist.length + 1).replaceAll('\\', '/'), html, elementos: arbol(html) };
});

// Elementos de una obra en una página (sin repetir los que quedan dentro de otro ya tomado).
function elementosDeObra(pagina, obra) {
	const propia = `/proyectos/${obra.slug}/`;
	const tomados = new Map(); // elemento → selector
	for (const el of pagina.elementos) {
		if (atributo(el.attrs, 'data-ficha') === `obra-${obra.slug}`) tomados.set(el, `[data-ficha="obra-${obra.slug}"]`);
		else if (el.nombre === 'a' && atributo(el.attrs, 'href') === propia) tomados.set(contenedor(el), `enlace a ${propia}`);
		else if (el.nombre === 'img' && [atributo(el.attrs, 'src') ?? '', atributo(el.attrs, 'srcset') ?? ''].some((u) => u.includes(propia))) {
			tomados.set(marcoDe(el), `imagen de ${propia}`);
		} else if (el.nombre === 'h3' && tieneClase(el, 'obra') && textoDe(pagina.html, el) === obra.nombre) {
			tomados.set(contenedor(el), `<h3 class="obra">${obra.nombre}`);
		}
	}
	const dentro = (a, b) => a !== b && a.inicio >= b.inicio && a.fin <= b.fin;
	return [...tomados].filter(([el]) => ![...tomados.keys()].some((otro) => dentro(el, otro)));
}

const errores = [];
const usados = new Set();
const revisarTrozo = (obra, donde, trozo) => {
	for (const marcador of buscarMarcadores(trozo)) {
		if (marcador === 'imagen referencial' && obra.referencia) continue;
		const conocido = CONOCIDOS.find((c) => c.slug === obra.slug && c.marcador === marcador && c.donde.test(donde));
		if (conocido) {
			usados.add(conocido);
			console.log(`verificar-obras-reales: ${obra.slug}: ${marcador} en ${donde} (conocido: ${conocido.motivo})`);
			continue;
		}
		errores.push(`${obra.slug}: ${marcador} en ${donde}`);
	}
};

for (const obra of obras) {
	let revisados = 0;
	const propia = paginas.find((p) => p.ruta === `proyectos/${obra.slug}/index.html`);
	if (!propia) {
		errores.push(`${obra.slug}: no existe dist/proyectos/${obra.slug}/index.html`);
	} else {
		for (const clase of ['portada', 'ficha']) {
			const els = propia.elementos.filter((el) => tieneClase(el, clase));
			if (!els.length) errores.push(`${obra.slug}: falta .${clase} en ${propia.ruta}`);
			for (const el of els) {
				revisarTrozo(obra, `${propia.ruta} .${clase}`, propia.html.slice(el.inicio, el.fin));
				revisados++;
			}
		}
		if (!propia.elementos.some((el) => tieneClase(el, 'ficha-obra'))) errores.push(`${obra.slug}: falta .ficha-obra en ${propia.ruta}`);
		const titulo = propia.html.match(/<title>([\s\S]*?)<\/title>/i);
		revisarTrozo(obra, `${propia.ruta} <title>`, titulo ? titulo[1] : '');
	}
	let enListado = 0;
	for (const p of paginas) {
		// Las muestras de un carrusel usan `obra-<sección>-<n>` (CarruselObras): un slug como
		// «terminados-1» chocaría con una y el enlace #obra-<slug> abriría la ficha equivocada.
		const fichas = p.elementos.filter((el) => atributo(el.attrs, 'data-ficha') === `obra-${obra.slug}`).length;
		if (fichas > 1) errores.push(`${obra.slug}: ${fichas} paneles [data-ficha="obra-${obra.slug}"] en ${p.ruta} (el slug choca con otra ficha)`);
		for (const [el, selector] of elementosDeObra(p, obra)) {
			if (p.ruta === 'proyectos/index.html') enListado++;
			revisarTrozo(obra, `${p.ruta} ${selector}`, p.html.slice(el.inicio, el.fin));
			revisados++;
		}
	}
	if (!enListado) errores.push(`${obra.slug}: no se encontró en dist/proyectos/index.html (¿cambió el marcado?)`);
	console.log(`verificar-obras-reales: ${obra.slug} · ${revisados} elementos revisados${obra.referencia ? ' · con imagen referencial' : ''}`);
}

for (const c of CONOCIDOS) if (!usados.has(c)) errores.push(`CONOCIDOS: la excepción de ${c.slug} (${c.marcador}) ya no aparece; sacarla de la lista`);

if (errores.length) {
	console.error(`\nverificar-obras-reales: ${errores.length} problema(s)`);
	for (const e of errores) console.error(`  - ${e}`);
	process.exit(1);
}
console.log(`verificar-obras-reales: OK (${obras.length} obra(s); ${obras.filter((o) => o.referencia).length} con imagen referencial)`);
