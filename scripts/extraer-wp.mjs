// Respaldo del contenido del WordPress viejo de lols.cl (páginas + imágenes).
// Uso: node scripts/extraer-wp.mjs
// Salida: respaldo-wp/ (se versiona; es la única copia del contenido fuera de WordPress).
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGEN = 'https://lols.cl';
const SALIDA = fileURLToPath(new URL('../respaldo-wp/', import.meta.url));

const json = async (ruta) => {
  const r = await fetch(ORIGEN + ruta);
  if (!r.ok) throw new Error(`${r.status} ${ruta}`);
  return r.json();
};

const guardar = async (ruta, datos) => {
  const destino = join(SALIDA, ruta);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, datos);
};

// Cualquier URL de uploads: src, data-*, srcset, url(...) de CSS, con o sin protocolo.
const RE_UPLOAD = /(?:https?:)?\/\/lols\.cl\/wp-content\/uploads\/[^\s"'()<>,\\]+?\.(?:jpe?g|png|gif|svg|webp|pdf)/gi;
const normalizar = (u) => 'https:' + u.replace(/^https?:/, '');

const paginas = await json('/wp-json/wp/v2/pages?per_page=100&context=view');
const medios = await json('/wp-json/wp/v2/media?per_page=100');
const urls = new Set(medios.map((m) => normalizar(m.source_url)));

const indice = [];
for (const p of paginas) {
  const html = await (await fetch(p.link)).text();
  await guardar(`paginas/${p.slug}.json`, JSON.stringify(p, null, 2));
  await guardar(`paginas/${p.slug}.html`, html);
  for (const u of (p.content.rendered + html).match(RE_UPLOAD) ?? []) urls.add(normalizar(u));
  indice.push({ id: p.id, slug: p.slug, titulo: p.title.rendered, padre: p.parent, url: p.link, modificado: p.modified });
  console.log('página', p.slug);
}

// Además de cada variante redimensionada (foto-300x200.jpg), bajar el original.
for (const u of [...urls]) {
  const original = u.replace(/-\d+x\d+(\.\w+)$/, '$1');
  if (original !== u) urls.add(original);
}

const imagenes = [];
const fallidas = [];
for (const u of [...urls].sort()) {
  const r = await fetch(u);
  if (!r.ok) { fallidas.push({ url: u, estado: r.status }); continue; }
  const ruta = 'uploads/' + decodeURIComponent(u.split('/wp-content/uploads/')[1]);
  const buf = Buffer.from(await r.arrayBuffer());
  await guardar(ruta, buf);
  imagenes.push({ url: u, archivo: ruta, bytes: buf.length });
}

await guardar('indice.json', JSON.stringify({
  extraido: new Date().toISOString(),
  origen: ORIGEN,
  paginas: indice,
  medios: medios.map((m) => ({ id: m.id, url: m.source_url, alt: m.alt_text, titulo: m.title?.rendered })),
  imagenes,
  fallidas,
}, null, 2));

const mb = (imagenes.reduce((s, i) => s + i.bytes, 0) / 1e6).toFixed(1);
console.log(`\n${indice.length} páginas, ${imagenes.length} imágenes (${mb} MB), ${fallidas.length} fallidas`);
