// Protocolo de mensajes entre el sitio y la Bóveda, versión 1 (docs/editor-visual.md § 4).
// Solo tipos, constantes y revisiones puras: qué origen puede hablarle al puente y qué forma
// tiene cada mensaje. Lo que no pasa estas revisiones se ignora sin aviso.
import { estados, tiposObra } from '../../data/catalogo';
import { limites } from '../../data/limitesObra';
import type { ObraJson } from '../../data/vistaObra';

export const P = 'lols-editor';
export const V = 1;

// Orígenes de la Bóveda (producción y prueba). En desarrollo (el sitio mismo en localhost o
// 127.0.0.1) también http://localhost:<puerto>.
export const ORIGENES = ['https://boveda.lols.cl', 'https://test.boveda.lols.cl'];
const LOCAL = /^http:\/\/localhost:\d{1,5}$/;
export const sitioLocal = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1';
export const origenPermitido = (origen: string, hostname: string) => ORIGENES.includes(origen) || (sitioLocal(hostname) && LOCAL.test(origen));

// A quién se le manda `hola`: los orígenes fijos y, en desarrollo, el del padre si se lo conoce
// (location.ancestorOrigins o document.referrer): con un puerto cualquiera no se puede enumerar.
export function origenesHola(hostname: string, pistas: (string | null | undefined)[]): string[] {
	const locales = sitioLocal(hostname) ? pistas.map(origenDe).filter((o): o is string => !!o && LOCAL.test(o)) : [];
	return [...new Set([...ORIGENES, ...locales])];
}
function origenDe(url: string | null | undefined) {
	try {
		return url ? new URL(url).origin : null;
	} catch {
		return null;
	}
}

export type Modo = 'editar' | 'mirar';
export type ObraParcial = Partial<ObraJson> & { slug: string };
export interface ObraBorrador {
	json: ObraParcial;
	meta: { incluir: boolean; nueva: boolean };
}
export type Entrante =
	| { tipo: 'borrador'; obras: ObraBorrador[] }
	| { tipo: 'campo'; item: string; campo: string; valor: unknown }
	| { tipo: 'modo'; modo: Modo }
	| { tipo: 'mostrar'; item: string }
	| { tipo: 'foto'; item: string; bytes: ArrayBuffer };

export interface ListaHola {
	regla: string;
	vista: string;
	items: string[];
}
export type Saliente =
	| { tipo: 'hola'; ruta: string; build: string | null; listas: ListaHola[]; limites: Record<string, number> }
	| { tipo: 'seleccion'; item: string; campo: string | null }
	| { tipo: 'cambio'; item: string; campo: string; valor: string | null }
	| { tipo: 'navegar'; ruta: string }
	| { tipo: 'atajo'; accion: 'deshacer' | 'rehacer' | 'guardar' };

export const sobre = <T extends object>(m: T) => ({ p: P, v: V, ...m });

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
export const esSobre = (d: unknown): d is Record<string, unknown> & { tipo: string } => esObjeto(d) && d.p === P && d.v === V && typeof d.tipo === 'string';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const esSlug = (s: unknown): s is string => typeof s === 'string' && s.length <= limites.slug && SLUG.test(s);
export const esItem = (s: unknown): s is string => typeof s === 'string' && s.startsWith('obras/') && esSlug(s.slice(6));

// Campos que el puente sabe mostrar. Texto: se escribe en el lugar (data-ed-campo) o, mandante,
// en el panel; el resto son derivados (data-ed-derivado).
const textos = ['nombre', 'titular', 'mandante', 'comuna', 'direccion', 'inicio', 'desafio', 'solucion', 'resultado'] as const;
export const CAMPOS_EN_LUGAR = ['/nombre', '/titular', '/comuna', '/direccion', '/inicio', '/desafio', '/solucion', '/resultado'];

// ¿`valor` sirve para el campo `clave` del JSON? (tipo y largo; el resto lo valida la Bóveda)
export function valorValido(clave: string, valor: unknown): boolean {
	if ((textos as readonly string[]).includes(clave)) {
		return valor === null || (typeof valor === 'string' && valor.length <= limites[clave as (typeof textos)[number]]);
	}
	switch (clave) {
		case 'superficieM2':
		case 'anio':
			return valor === null || (Number.isInteger(valor) && (valor as number) > 0);
		case 'tipo':
			return valor === null || (tiposObra as readonly unknown[]).includes(valor);
		case 'estado':
			return typeof valor === 'string' && valor in estados;
		case 'servicios':
			return Array.isArray(valor) && valor.length <= 20 && valor.every((s) => typeof s === 'string' && s.length <= 80);
		case 'orden':
			return Number.isInteger(valor);
		default:
			return false; // fotos, referencia y lo desconocido: el puente no los muestra
	}
}

// Una obra del borrador: el slug es obligatorio; un campo inválido se descarta (no se muestra).
function leerObra(x: unknown): ObraBorrador | null {
	if (!esObjeto(x) || !esObjeto(x.json) || !esObjeto(x.meta)) return null;
	const { json, meta } = x;
	if (!esSlug(json.slug) || typeof meta.incluir !== 'boolean' || typeof meta.nueva !== 'boolean') return null;
	const limpio: ObraParcial = { slug: json.slug };
	for (const [clave, valor] of Object.entries(json)) {
		if (clave !== 'slug' && valorValido(clave, valor)) (limpio as Record<string, unknown>)[clave] = valor;
	}
	return { json: limpio, meta: { incluir: meta.incluir, nueva: meta.nueva } };
}

// Mensaje que llega por el puerto: su forma, o null.
export function leerEntrante(d: unknown): Entrante | null {
	if (!esSobre(d)) return null;
	switch (d.tipo) {
		case 'borrador': {
			if (!Array.isArray(d.obras) || d.obras.length > 1000) return null;
			const obras = d.obras.map(leerObra);
			return obras.every((o): o is ObraBorrador => o !== null) ? { tipo: 'borrador', obras } : null;
		}
		case 'campo': {
			const clave = typeof d.campo === 'string' && /^\/[a-zA-Z0-9]+$/.test(d.campo) ? d.campo.slice(1) : '';
			if (!esItem(d.item) || !clave || clave === 'slug' || !valorValido(clave, d.valor)) return null;
			return { tipo: 'campo', item: d.item, campo: d.campo as string, valor: d.valor };
		}
		case 'modo':
			return d.modo === 'editar' || d.modo === 'mirar' ? { tipo: 'modo', modo: d.modo } : null;
		case 'mostrar':
			return esItem(d.item) ? { tipo: 'mostrar', item: d.item } : null;
		case 'foto':
			return esItem(d.item) && d.bytes instanceof ArrayBuffer ? { tipo: 'foto', item: d.item, bytes: d.bytes } : null;
		default:
			return null;
	}
}

// El saludo de la Bóveda (`iniciar`), recibido por window: solo de un origen permitido, desde la
// ventana padre y con un puerto. Devuelve el puerto y el modo, o null.
export interface EventoMensaje {
	data: unknown;
	origin: string;
	source: unknown;
	ports: readonly MessagePort[];
}
export function aceptarIniciar(e: EventoMensaje, padre: unknown, hostname: string): { puerto: MessagePort; modo: Modo } | null {
	if (!origenPermitido(e.origin, hostname) || e.source !== padre || e.source === null || e.ports.length !== 1) return null;
	const d = e.data;
	if (!esSobre(d) || d.tipo !== 'iniciar') return null;
	return { puerto: e.ports[0], modo: d.modo === 'mirar' ? 'mirar' : 'editar' };
}
