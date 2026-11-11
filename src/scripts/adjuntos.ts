// Adjuntos de los formularios (cotización y postulación). Marcos, 11-11-2026: subió una sola foto
// y el formulario lo frenó con «Puede adjuntar hasta 2 archivos…», sin decir que el problema era
// el peso de la foto. Ahora, al elegir los archivos:
//   - las fotos pesadas se achican aquí mismo, en el navegador (JPG de ~5 megapíxeles: el texto
//     de un CV fotografiado se sigue leyendo), y las de un formato que el servidor no recibe
//     (GIF, AVIF…) se pasan a JPG;
//   - cada archivo se muestra en una lista con su nombre, su peso (y cuánto se achicó) y un
//     botón para quitarlo; elegir de nuevo agrega, no reemplaza;
//   - si uno no se puede adjuntar, el aviso dice cuál y por qué (muy pesado, tipo no aceptado o
//     ya hay 2), y los demás se quedan.
// El servidor (public/api/lib/formulario.php) revisa lo mismo: máximo 2 archivos de 5 MB, y el
// tipo por sus primeros bytes. Un PDF o un Word no se pueden achicar aquí: si pasa de 5 MB se
// pide uno más liviano o mandarlo por correo.
// Sin JavaScript queda el campo de archivos de siempre.

const MAX_ARCHIVOS = 2;
const MAX_BYTES = 5 * 1024 * 1024;
// Fotos que pasan este peso se achican (carga más rápida con poca señal y correo más liviano).
const UMBRAL_FOTO = 1.5 * 1024 * 1024;
const MAX_PIXELES = 5_000_000;
const MAX_LADO = 8000; // el lienzo de algunos celulares no da para más
const CALIDAD_JPG = 0.82;
// Fotos que el servidor recibe tal cual (las demás se pasan a JPG).
const FOTOS_DEL_SERVIDOR = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

type Clase = 'foto' | 'pdf' | 'word';
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
const extension = (nombre: string) => (nombre.match(/\.([a-z0-9]+)$/i)?.[1] ?? '').toLowerCase();

export const peso = (bytes: number) =>
	bytes < 1024 * 1024
		? `${Math.max(1, Math.round(bytes / 1024))} KB`
		: `${(bytes / 1024 / 1024).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`;

function clase(f: File, word: boolean): Clase | null {
	const ext = extension(f.name);
	if (f.type.startsWith('image/') || FOTOS_DEL_SERVIDOR.includes(ext)) return 'foto';
	if (ext === 'pdf' || f.type === 'application/pdf') return 'pdf';
	if (word && (ext === 'doc' || ext === 'docx')) return 'word';
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

export function prepararAdjuntos(
	input: HTMLInputElement,
	{ word, correo }: { word: boolean; correo: string },
): Adjuntos {
	const tipos = word ? 'PDF, Word ni foto' : 'foto ni PDF';
	const items: Item[] = [];
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
					miniatura.textContent = i.clase === 'pdf' ? 'PDF' : i.clase === 'word' ? 'Word' : 'Foto';
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

	const pesado = (f: File) =>
		`«${f.name}» pesa ${peso(f.size)} y el máximo es 5 MB. Suba uno más liviano o mándelo a ${correo}.`;

	async function preparar(f: File, c: Clase): Promise<string> {
		const ext = extension(f.name);
		const item: Item = { origen: origen(f), archivo: f, clase: c, nota: peso(f.size), listo: false };
		const debeAchicar = c === 'foto' && (f.size > UMBRAL_FOTO || !FOTOS_DEL_SERVIDOR.includes(ext));
		if (!debeAchicar) {
			if (f.size > MAX_BYTES) return pesado(f);
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
				? `No pudimos achicar «${f.name}» (${peso(f.size)}; el máximo es 5 MB). Pruebe con otra foto o mándela a ${correo}.`
				: `«${f.name}» no es un tipo de foto que podamos recibir. Pruebe con una foto JPG o PNG.`;
		}
		item.vista = URL.createObjectURL(item.archivo);
		item.listo = true;
		return '';
	}

	async function agregar(nuevos: File[]) {
		const problemas: string[] = [];
		for (const f of nuevos) {
			if (items.some((i) => i.origen === origen(f))) continue;
			const c = clase(f, word);
			if (!c) {
				problemas.push(`«${f.name}» no se puede adjuntar: no es ${tipos}.`);
				continue;
			}
			if (items.length >= MAX_ARCHIVOS) {
				problemas.push(`Puede adjuntar 2 archivos como máximo: quite uno para agregar «${f.name}».`);
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
