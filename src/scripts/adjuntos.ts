// Adjuntos de los formularios (cotización y postulación). Marcos, 11-11-2026: subió una sola foto
// y el formulario lo frenó con «Puede adjuntar hasta 2 archivos…», sin decir que el problema era
// el peso de la foto. Ahora, al elegir los archivos:
//   - las fotos pesadas se achican aquí mismo, en el navegador (JPG de ~5 megapíxeles: el texto
//     de un CV fotografiado se sigue leyendo), y las de un formato que el servidor no recibe
//     (GIF, AVIF…) se pasan a JPG;
//   - cada archivo se muestra en una lista con su nombre, su peso (y cuánto se achicó) y un
//     botón para quitarlo; elegir de nuevo agrega, no reemplaza;
//   - si uno no se puede adjuntar, el aviso dice cuál y por qué (muy pesado, formato que no se
//     recibe o ya están todos los que caben), y los demás se quedan.
// El servidor (public/api/lib/formulario.php) revisa lo mismo: cuántos, cuánto pesan y el tipo
// por sus primeros bytes. Un PDF, un plano o un modelo no se pueden achicar aquí: si pasa del
// máximo se pide uno más liviano, un enlace o mandarlo por correo.
// Formatos y pesos: src/data/formatos.ts. Sin JavaScript queda el campo de archivos de siempre.
import { MAX_MB, MAX_TOTAL_MB } from '../data/formatos';

const MAX_BYTES = MAX_MB * 1024 * 1024;
const MAX_TOTAL = MAX_TOTAL_MB * 1024 * 1024;
// Fotos que pasan este peso se achican (carga más rápida con poca señal y correo más liviano).
const UMBRAL_FOTO = 1.5 * 1024 * 1024;
const MAX_PIXELES = 5_000_000;
const MAX_LADO = 8000; // el lienzo de algunos celulares no da para más
const CALIDAD_JPG = 0.82;
// Fotos que el servidor recibe tal cual (las demás se pasan a JPG).
const FOTOS_DEL_SERVIDOR = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

type Clase = 'foto' | 'documento';
interface Item {
	origen: string; // nombre, peso y fecha del archivo elegido (para no repetirlo)
	archivo: File;
	clase: Clase;
	nota: string;
	vista?: string; // URL de la miniatura (fotos)
	listo: boolean;
}

export interface Adjuntos {
	// Espera a que terminen de achicarse las fotos.
	listo(): Promise<void>;
	cantidad(): number;
	// Pone los archivos de la lista en los datos que se envían (en vez de los del campo).
	ponerEn(datos: FormData): void;
	// Vacía la lista (después de enviar).
	vaciar(): void;
}

const origen = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
const extension = (nombre: string) => (nombre.match(/\.([a-z0-9_]+)$/i)?.[1] ?? '').toLowerCase();

export const peso = (bytes: number) =>
	bytes < 1024 * 1024
		? `${Math.max(1, Math.round(bytes / 1024))} KB`
		: `${(bytes / 1024 / 1024).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`;

// Foto (se achica o se pasa a JPG), documento (va tal cual) o null si no se recibe. Un TIFF es
// documento: suelen ser planos escaneados y el navegador no los abre para achicarlos.
function clase(f: File, extensiones: string[]): Clase | null {
	const ext = extension(f.name);
	if (FOTOS_DEL_SERVIDOR.includes(ext)) return 'foto';
	if (extensiones.includes(ext)) return 'documento';
	if (f.type.startsWith('image/')) return 'foto';
	return null;
}

// Imagen lista para dibujar, ya girada según la foto (EXIF). null si el navegador no la abre
// (p. ej., HEIC fuera de Safari).
async function abrirFoto(f: File): Promise<ImageBitmap | HTMLImageElement | null> {
	try {
		return await createImageBitmap(f, { imageOrientation: 'from-image' });
	} catch {
		const url = URL.createObjectURL(f);
		try {
			const img = new Image();
			img.src = url;
			await img.decode();
			return img;
		} catch {
			return null;
		} finally {
			URL.revokeObjectURL(url);
		}
	}
}

// La foto como JPG de a lo más ~5 megapíxeles; si aún pesa mucho, más chica. null si no se pudo.
async function achicar(f: File): Promise<File | null> {
	const fuente = await abrirFoto(f);
	if (!fuente) return null;
	const ancho = 'naturalWidth' in fuente ? fuente.naturalWidth : fuente.width;
	const alto = 'naturalHeight' in fuente ? fuente.naturalHeight : fuente.height;
	try {
		if (!ancho || !alto) return null;
		let escala = Math.min(1, Math.sqrt(MAX_PIXELES / (ancho * alto)), MAX_LADO / Math.max(ancho, alto));
		for (let intento = 0; intento < 4; intento++, escala *= 0.75) {
			const lienzo = document.createElement('canvas');
			lienzo.width = Math.max(1, Math.round(ancho * escala));
			lienzo.height = Math.max(1, Math.round(alto * escala));
			const ctx = lienzo.getContext('2d');
			if (!ctx) return null;
			// Fondo blanco: un PNG con transparencia no queda negro en JPG.
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, lienzo.width, lienzo.height);
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(fuente, 0, 0, lienzo.width, lienzo.height);
			const jpg = await new Promise<Blob | null>((r) => lienzo.toBlob(r, 'image/jpeg', CALIDAD_JPG));
			lienzo.width = lienzo.height = 0; // libera la memoria del lienzo (celulares viejos)
			if (!jpg) return null;
			if (jpg.size <= UMBRAL_FOTO || (intento === 3 && jpg.size <= MAX_BYTES)) {
				const nombre = f.name.replace(/\.[^.]*$/, '') + '.jpg';
				return new File([jpg], nombre, { type: 'image/jpeg', lastModified: f.lastModified });
			}
		}
		return null;
	} finally {
		if ('close' in fuente) fuente.close();
	}
}

export interface OpcionesAdjuntos {
	// Extensiones que se reciben además de las fotos (src/data/formatos.ts).
	extensiones: string[];
	maxArchivos: number;
	// Final del aviso cuando un archivo no es de un formato que se recibe.
	noRecibido: string;
	correo: string;
}

export function prepararAdjuntos(input: HTMLInputElement, { extensiones, maxArchivos, noRecibido, correo }: OpcionesAdjuntos): Adjuntos {
	const items: Item[] = [];
	const total = () => items.reduce((s, i) => s + i.archivo.size, 0);
	let pendiente: Promise<void> = Promise.resolve();

	// La lista y el aviso van justo después de la ayuda del campo.
	const ayuda = document.getElementById(input.getAttribute('aria-describedby') ?? '') ?? input;
	const lista = document.createElement('ul');
	lista.className = 'adjuntos';
	lista.hidden = true;
	lista.setAttribute('aria-label', 'Archivos adjuntos');
	const aviso = document.createElement('p');
	aviso.className = 'adjuntos-aviso';
	// Vacío no se ve (CSS :empty); al llenarse lo lee el lector de pantalla.
	aviso.setAttribute('role', 'alert');
	ayuda.after(lista, aviso);

	// El campo muestra lo mismo que la lista (si el navegador lo permite; si no, igual se envía
	// lo de la lista: ver ponerEn).
	function sincronizar() {
		try {
			const dt = new DataTransfer();
			items.forEach((i) => dt.items.add(i.archivo));
			input.files = dt.files;
		} catch {
			if (!items.length) input.value = '';
		}
	}

	function pintar() {
		lista.replaceChildren(
			...items.map((i) => {
				const li = document.createElement('li');
				li.dataset.clase = i.clase;
				if (!i.listo) li.dataset.ocupado = '';
				const miniatura = document.createElement('span');
				miniatura.className = 'adjunto-miniatura';
				miniatura.setAttribute('aria-hidden', 'true');
				if (i.vista) {
					const img = document.createElement('img');
					img.src = i.vista;
					img.alt = '';
					miniatura.append(img);
				} else {
					const ext = extension(i.archivo.name).toUpperCase();
					miniatura.textContent = ext || 'Archivo';
					if (ext.length > 4) miniatura.dataset.largo = '';
				}
				const texto = document.createElement('span');
				texto.className = 'adjunto-texto';
				const nombre = document.createElement('b');
				nombre.textContent = i.archivo.name;
				const nota = document.createElement('span');
				nota.textContent = i.nota;
				texto.append(nombre, nota);
				const quitar = document.createElement('button');
				quitar.type = 'button';
				quitar.className = 'adjunto-quitar';
				quitar.textContent = 'Quitar';
				quitar.setAttribute('aria-label', `Quitar ${i.archivo.name}`);
				quitar.disabled = !i.listo;
				quitar.addEventListener('click', () => {
					const n = items.indexOf(i);
					if (n < 0) return;
					items.splice(n, 1);
					if (i.vista) URL.revokeObjectURL(i.vista);
					sincronizar();
					pintar();
					avisar('');
					input.focus();
				});
				li.append(miniatura, texto, quitar);
				return li;
			}),
		);
		lista.hidden = !items.length;
	}

	function avisar(texto: string) {
		aviso.textContent = texto;
		if (texto) input.setAttribute('aria-invalid', 'true');
		else input.removeAttribute('aria-invalid');
	}

	// Cada aviso empieza por «no quedó adjunto»: que se entienda que ese archivo no se enviará y
	// que el resto del formulario sigue (Marcos, 11-11-2026).
	const pesado = (f: File) =>
		`«${f.name}» no quedó adjunto: pesa ${peso(f.size)} y el máximo es ${MAX_MB} MB. Suba uno más liviano, siga sin él o mándelo a ${correo}.`;
	const lleno = (f: File) =>
		`«${f.name}» no quedó adjunto: con él, los archivos pasan de ${MAX_TOTAL_MB} MB entre todos. Quite uno o mándelo a ${correo}.`;

	async function preparar(f: File, c: Clase): Promise<string> {
		const ext = extension(f.name);
		const item: Item = { origen: origen(f), archivo: f, clase: c, nota: peso(f.size), listo: false };
		const debeAchicar = c === 'foto' && (f.size > UMBRAL_FOTO || !FOTOS_DEL_SERVIDOR.includes(ext));
		if (!debeAchicar) {
			if (f.size > MAX_BYTES) return pesado(f);
			if (total() + f.size > MAX_TOTAL) return lleno(f);
			if (c === 'foto') item.vista = URL.createObjectURL(f);
			item.listo = true;
			items.push(item);
			return '';
		}
		item.nota = 'Achicando la foto…';
		items.push(item);
		pintar();
		const chica = await achicar(f);
		if (chica && (chica.size < f.size || !FOTOS_DEL_SERVIDOR.includes(ext))) {
			item.archivo = chica;
			item.nota =
				chica.size < f.size ? `Foto achicada: de ${peso(f.size)} a ${peso(chica.size)}` : `Foto pasada a JPG · ${peso(chica.size)}`;
		} else if (f.size > MAX_BYTES || !FOTOS_DEL_SERVIDOR.includes(ext)) {
			// No se pudo abrir o achicar y así como está no se puede mandar.
			items.splice(items.indexOf(item), 1);
			return f.size > MAX_BYTES
				? `«${f.name}» no quedó adjunta: no pudimos achicar la foto (${peso(f.size)}; el máximo es ${MAX_MB} MB). Pruebe con otra, siga sin ella o mándela a ${correo}.`
				: `«${f.name}» no quedó adjunta: ese tipo de foto no lo podemos recibir. Pruebe con una foto JPG o PNG.`;
		}
		if (total() > MAX_TOTAL) {
			items.splice(items.indexOf(item), 1);
			return lleno(f);
		}
		item.vista = URL.createObjectURL(item.archivo);
		item.listo = true;
		return '';
	}

	async function agregar(nuevos: File[]) {
		const problemas: string[] = [];
		for (const f of nuevos) {
			if (items.some((i) => i.origen === origen(f))) continue;
			const c = clase(f, extensiones);
			if (!c) {
				problemas.push(`«${f.name}» no quedó adjunto: ${noRecibido}`);
				continue;
			}
			if (items.length >= maxArchivos) {
				problemas.push(`«${f.name}» no quedó adjunto: se pueden ${maxArchivos} archivos como máximo (quite uno para cambiarlo).`);
				continue;
			}
			const problema = await preparar(f, c);
			if (problema) problemas.push(problema);
			pintar();
		}
		sincronizar();
		pintar();
		avisar(problemas.join(' '));
	}

	input.addEventListener('change', () => {
		const nuevos = [...(input.files ?? [])];
		// Algunos navegadores vacían el campo si se cierra la ventana sin elegir: se restaura.
		if (!nuevos.length) {
			sincronizar();
			return;
		}
		avisar('');
		pendiente = pendiente.then(() => agregar(nuevos));
	});

	return {
		listo: () => pendiente,
		cantidad: () => items.length,
		ponerEn(datos) {
			datos.delete(input.name);
			for (const i of items) datos.append(input.name, i.archivo, i.archivo.name);
		},
		vaciar() {
			items.forEach((i) => i.vista && URL.revokeObjectURL(i.vista));
			items.length = 0;
			input.value = '';
			pintar();
			avisar('');
		},
	};
}
