// Detalle que se abre en el lugar (docs/estructura.md § Mostrar, no contar): al pinchar una
// obra o un servicio, su ficha se despliega en la misma página, con los demás ítems arriba y
// abajo, en vez de llevar a otra página de la que después cuesta volver.
//
// Cada componente (CarruselObras, MosaicoServicios) registra un grupo con sus fichas; este
// módulo lleva lo que es común a todos:
//   - una sola ficha abierta en la página;
//   - el historial: abrir agrega una entrada (#obra-… / #servicio-…), así el botón Atrás del
//     navegador la cierra y deja a la persona donde estaba; cambiar de ficha la reemplaza;
//   - Esc cierra; la página que carga con el hash abre esa ficha (enlace directo);
//   - el despliegue animado del panel (grid-template-rows 0fr → 1fr), el foco y el scroll.
// Sin JavaScript, los enlaces siguen yendo a las páginas de cada obra y servicio.

export interface Grupo {
	tiene(id: string): boolean;
	// Muestra la ficha `id` en su panel (que puede estar ya abierto con otra).
	mostrar(id: string): void;
	// Panel y disparador actuales del grupo.
	panel(): HTMLElement;
	disparador(): HTMLElement | null;
	alCerrar(): void;
}

const grupos: Grupo[] = [];
let abierta: { grupo: Grupo; id: string } | null = null;
let empujada = false; // la entrada del historial es nuestra (Atrás la cierra)
const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;

const buscar = (hash: string) => {
	const id = decodeURIComponent(hash.slice(1));
	const grupo = id ? grupos.find((g) => g.tiene(id)) : undefined;
	return grupo ? { grupo, id } : null;
};
const sinHash = () => location.pathname + location.search;

function desplegar(panel: HTMLElement) {
	panel.hidden = false;
	if (reducir) {
		panel.classList.add('abierto');
		return;
	}
	void panel.offsetHeight; // aplicar el estado cerrado antes de animar
	panel.classList.add('abierto');
}

function plegar(panel: HTMLElement, alTerminar?: () => void) {
	panel.classList.remove('abierto');
	let listo = false;
	const fin = () => {
		if (listo) return;
		listo = true;
		panel.removeEventListener('transitionend', alFinal);
		if (!panel.classList.contains('abierto')) {
			panel.hidden = true;
			alTerminar?.();
		}
	};
	const alFinal = (e: TransitionEvent) => e.target === panel && fin();
	if (reducir) return fin();
	panel.addEventListener('transitionend', alFinal);
	// Por si la transición no corre (pestaña oculta, sin cambio de altura).
	setTimeout(fin, 700);
}

// Si el panel queda muy abajo, subirlo hasta la mitad de la pantalla: se ve que se abrió y el
// ítem pinchado sigue a la vista arriba.
function acercar(panel: HTMLElement) {
	const arriba = panel.getBoundingClientRect().top;
	if (arriba > innerHeight * 0.75 || arriba < 0) {
		scrollTo({ top: scrollY + arriba - innerHeight * 0.45, behavior: reducir ? 'auto' : 'smooth' });
	}
}

function abrirSinHistorial(grupo: Grupo, id: string, enfocar: boolean) {
	if (abierta && abierta.grupo !== grupo) {
		const anterior = abierta.grupo;
		plegar(anterior.panel(), () => anterior.alCerrar());
	}
	const yaAbierto = abierta?.grupo === grupo;
	abierta = { grupo, id };
	grupo.mostrar(id);
	const panel = grupo.panel();
	if (!yaAbierto || !panel.classList.contains('abierto')) desplegar(panel);
	if (enfocar) {
		panel.querySelector<HTMLElement>('[data-ficha]:not([hidden]) .titulo-ficha')?.focus({ preventScroll: true });
		requestAnimationFrame(() => acercar(panel));
	}
}

function cerrarSinHistorial(volver: boolean) {
	if (!abierta) return;
	const { grupo } = abierta;
	const disparador = grupo.disparador();
	abierta = null;
	empujada = false;
	plegar(grupo.panel(), () => grupo.alCerrar());
	if (disparador) {
		disparador.focus({ preventScroll: true });
		if (volver && disparador.getBoundingClientRect().top < 0) {
			disparador.scrollIntoView({ block: 'center', behavior: reducir ? 'auto' : 'smooth' });
		}
	}
}

// --- API para los componentes ---

export function registrar(grupo: Grupo) {
	grupos.push(grupo);
	const directa = buscar(location.hash);
	if (directa?.grupo === grupo) {
		abrirSinHistorial(grupo, directa.id, false);
		// Esperar a que la página termine de armarse para llevar la ficha a la vista.
		addEventListener('load', () => grupo.panel().scrollIntoView({ block: 'start' }), { once: true });
	}
}

export function abrir(grupo: Grupo, id: string) {
	const url = sinHash() + '#' + encodeURIComponent(id);
	if (abierta && empujada) history.replaceState(history.state, '', url);
	else if (abierta) history.replaceState(null, '', url);
	else {
		history.pushState({ despliegue: true }, '', url);
		empujada = true;
	}
	abrirSinHistorial(grupo, id, true);
}

// Cambia la ficha de un panel ya abierto (flechas del carrusel), sin mover el foco.
export function cambiar(grupo: Grupo, id: string) {
	if (abierta?.grupo !== grupo) return;
	history.replaceState(history.state, '', sinHash() + '#' + encodeURIComponent(id));
	abierta.id = id;
	grupo.mostrar(id);
}

export function cerrar() {
	if (!abierta) return;
	if (empujada) history.back(); // popstate la cierra y el navegador devuelve el scroll
	else {
		history.replaceState(null, '', sinHash());
		cerrarSinHistorial(true);
	}
}

export const abiertaEn = (grupo: Grupo) => (abierta?.grupo === grupo ? abierta.id : null);

addEventListener('popstate', () => {
	const destino = buscar(location.hash);
	if (destino) {
		empujada = history.state?.despliegue === true;
		abrirSinHistorial(destino.grupo, destino.id, false);
	} else if (abierta) {
		cerrarSinHistorial(false);
	}
});

addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && abierta && !document.fullscreenElement) cerrar();
});
