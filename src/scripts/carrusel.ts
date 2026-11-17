// Carrusel de obras (CarruselObras.astro): flechas, teclado, deslizar con el dedo y la ficha en el
// lugar (src/scripts/despliegue.ts). Un oyente de cada tipo por carrusel, delegado: los textos,
// fotos y fichas se leen del DOM cada vez que cambian, así el editor visual
// (docs/editor-visual.md) puede ocultar o agregar obras y pedirle al carrusel que se rearme:
//   - `lols:refrescar` (en la sección [data-carrusel]): vuelve a leer diapositivas, textos, fichas
//     e ids, mantiene la obra actual si sigue (si no, la más cercana), actualiza «n de N» y
//     redibuja. Una diapositiva con `hidden` en su texto no cuenta.
//   - `lols:ir` (detail: { slug, ficha? }): muestra esa obra; con `ficha: true` abre su ficha.
import { registrar, abrir, cambiar, cerrar, abiertaEn, type Grupo } from './despliegue';

interface Diapositiva {
	texto: HTMLElement;
	foto: HTMLElement;
	ficha: HTMLElement | null; // [data-ficha] del panel (sin panel: null)
	boton: HTMLButtonElement | null; // «Ver ficha»
	id: string | null; // id de la ficha (obra-<slug> o el de la muestra)
	slug: string | null; // obra de la Bóveda (data-ed-item = obras/<slug>)
}

export interface DetalleIr {
	slug: string;
	ficha?: boolean;
}

function montar(c: HTMLElement) {
	const pista = c.querySelector<HTMLElement>('.pista')!;
	const anuncio = c.querySelector<HTMLElement>('[data-anuncio]')!;
	// Sin ficha (data-panel ausente): solo el carrusel.
	const panel = c.dataset.panel ? document.getElementById(c.dataset.panel) : null;
	const posicion = panel?.querySelector<HTMLElement>('[data-posicion]');

	let todas: Diapositiva[] = [];
	let slides: Diapositiva[] = []; // las visibles
	let actual = 0;

	// Textos, fotos y fichas van en el mismo orden: la diapositiva n es el n-ésimo de cada lista.
	const leer = () => {
		const textos = [...c.querySelectorAll<HTMLElement>('.texto')];
		const fotos = [...pista.children] as HTMLElement[];
		const fichas = panel ? [...panel.querySelectorAll<HTMLElement>('[data-ficha]')] : [];
		todas = textos.map((texto, i) => {
			const item = texto.dataset.edItem;
			return {
				texto,
				foto: fotos[i],
				ficha: fichas[i] ?? null,
				boton: panel ? texto.querySelector<HTMLButtonElement>('.ver-ficha') : null,
				id: fichas[i]?.dataset.ficha ?? null,
				slug: item?.startsWith('obras/') ? item.slice(6) : null,
			};
		});
		slides = todas.filter((s) => !s.texto.hidden);
		for (const s of slides) if (s.boton) s.boton.hidden = false;
	};
	leer();
	const total = () => slides.length;

	const marcar = (abierta: boolean) => {
		c.classList.toggle('con-ficha', abierta);
		todas.forEach((s) => {
			if (!s.boton) return;
			const esta = abierta && s === slides[actual];
			s.boton.setAttribute('aria-expanded', String(esta));
			s.boton.querySelector('span')!.textContent = esta ? 'Cerrar ficha' : 'Ver ficha';
		});
	};
	const indiceDe = (id: string) => slides.findIndex((s) => s.id === id);
	const grupo: Grupo = {
		tiene: (id) => indiceDe(id) >= 0,
		mostrar: (id) => {
			const n = indiceDe(id);
			if (n !== actual) mostrar(n, false);
			todas.forEach((s) => s.ficha && (s.ficha.hidden = s !== slides[n]));
			if (posicion) posicion.textContent = `${n + 1} de ${total()}`;
			marcar(true);
		},
		panel: () => panel!,
		disparador: () => slides[actual]?.boton ?? null,
		alCerrar: () => marcar(false),
	};

	// Clases de cada diapositiva según la actual (las ocultas quedan inertes y fuera de la cuenta).
	const dibujar = () => {
		pista.style.setProperty('--i', String(actual));
		todas.forEach((s) => {
			const i = slides.indexOf(s);
			s.texto.classList.toggle('activo', i === actual);
			s.texto.classList.toggle('antes', i >= 0 && i < actual);
			s.texto.classList.toggle('despues', i > actual);
			s.texto.inert = i !== actual;
			if (!s.foto) return;
			s.foto.classList.toggle('pasada', i >= 0 && i < actual);
			s.foto.classList.toggle('futura', i > actual);
			if (i === actual) s.foto.removeAttribute('aria-hidden');
			else s.foto.setAttribute('aria-hidden', 'true');
		});
	};

	const mostrar = (n: number, sincronizar = true) => {
		if (!total()) return;
		actual = (n + total()) % total(); // después de la última vuelve a la primera
		dibujar();
		anuncio.textContent = `Obra ${actual + 1} de ${total()}: ${slides[actual].texto.querySelector('h3')?.textContent?.trim() ?? ''}`;
		// Con la ficha abierta, cambiar de obra cambia también la ficha.
		if (sincronizar && panel && abiertaEn(grupo)) cambiar(grupo, slides[actual].id!);
	};

	c.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowRight') mostrar(actual + 1);
		if (e.key === 'ArrowLeft') mostrar(actual - 1);
	});

	// Deslizar con el dedo sobre las fotos.
	let x0: number | null = null;
	pista.addEventListener('pointerdown', (e) => {
		if (e.pointerType !== 'mouse') x0 = e.clientX;
	});
	pista.addEventListener('pointerup', (e) => {
		if (x0 === null) return;
		const dx = e.clientX - x0;
		x0 = null;
		if (Math.abs(dx) > 40) mostrar(actual + (dx < 0 ? 1 : -1));
	});
	pista.addEventListener('pointercancel', () => (x0 = null));

	// Un solo oyente de clics. Flechas; «Ver ficha» abre o cierra la ficha; el título o la foto
	// activa la abren; una foto que asoma al lado lleva a esa obra. Ctrl/Cmd + clic sigue abriendo
	// la página. Sin ficha: tocar una foto que asoma lleva a esa obra.
	c.addEventListener('click', (e) => {
		const t = e.target as HTMLElement;
		if (t.closest('.anterior')) return mostrar(actual - 1);
		if (t.closest('.siguiente')) return mostrar(actual + 1);
		if (t.closest('.ver-ficha')) return abiertaEn(grupo) ? cerrar() : abrir(grupo, slides[actual].id!);
		const fotos = slides.map((s) => s.foto);
		if (!panel) {
			const foto = t.closest<HTMLElement>('.foto');
			const n = foto ? fotos.indexOf(foto) : -1;
			if (n >= 0 && n !== actual) mostrar(n);
			return;
		}
		const a = t.closest('a');
		if (!a || a.classList.contains('ver-todos') || e.ctrlKey || e.metaKey || e.shiftKey) return;
		e.preventDefault();
		const foto = a.closest<HTMLElement>('.foto');
		const n = foto ? fotos.indexOf(foto) : actual;
		if (n !== actual) mostrar(n);
		else abrir(grupo, slides[actual].id!);
	});

	// Editor visual: rearmar después de cambios en el DOM, e ir a una obra.
	c.addEventListener('lols:refrescar', () => {
		const antes = slides[actual];
		leer();
		const sigue = antes ? slides.indexOf(antes) : -1;
		actual = sigue >= 0 ? sigue : Math.min(actual, Math.max(total() - 1, 0));
		dibujar();
		const abierta = abiertaEn(grupo);
		if (abierta && panel) {
			if (indiceDe(abierta) >= 0) grupo.mostrar(abierta);
			else if (total()) cambiar(grupo, slides[actual].id!);
			else cerrar();
		} else if (posicion) posicion.textContent = `${actual + 1} de ${total()}`;
	});
	c.addEventListener('lols:ir', (e) => {
		const { slug, ficha } = (e as CustomEvent<DetalleIr>).detail ?? {};
		const n = slides.findIndex((s) => s.slug === slug);
		if (n < 0) return;
		if (ficha && panel) {
			if (abiertaEn(grupo)) mostrar(n); // cambia también la ficha
			else {
				mostrar(n, false);
				abrir(grupo, slides[n].id!);
			}
		} else {
			mostrar(n);
			c.scrollIntoView({ block: 'start' });
		}
	});

	if (!panel) return;
	panel.addEventListener('click', (e) => {
		const t = e.target as HTMLElement;
		const paso = t.closest<HTMLElement>('[data-paso]');
		if (paso) mostrar(actual + Number(paso.dataset.paso));
		else if (t.closest('[data-cerrar]')) cerrar();
	});
	// Las flechas de la barra de la ficha solo aparecen cuando las del carrusel ya no se ven
	// (al bajar leyendo la ficha); si no, quedarían dos pares de flechas juntos.
	const controles = c.querySelector<HTMLElement>('.controles')!;
	new IntersectionObserver(([e]) => panel.classList.toggle('con-flechas', !e.isIntersecting), {
		rootMargin: '-80px 0px 0px 0px', // bajo el encabezado fijo
	}).observe(controles);

	registrar(grupo);
}

for (const c of document.querySelectorAll<HTMLElement>('[data-carrusel]')) montar(c);
