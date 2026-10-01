// Mosaico con detalle bajo la fila, como en Google Imágenes (MosaicoServicios, Equipamiento):
// al pinchar una foto, su ficha se despliega a todo el ancho justo después de la última foto
// de esa fila (sirve con 3, 2 o 1 columnas) y una muesca apunta a la foto. El historial, Esc,
// el foco y la animación los lleva src/scripts/despliegue.ts.
//
// Marcado que espera:
//   <ul data-mosaico>
//     <li class="item"><a href="…" data-abre="{id}">…</a></li> …
//     <li class="ficha-panel" id="…" hidden> … <div data-ficha="{id}" hidden>…</div> … [data-cerrar] </li>
//   </ul>
import { registrar, abrir, cerrar, abiertaEn, type Grupo } from './despliegue';

for (const m of document.querySelectorAll<HTMLElement>('[data-mosaico]')) {
	const panel = m.querySelector<HTMLElement>(':scope > .ficha-panel')!;
	const items = [...m.querySelectorAll<HTMLElement>(':scope > .item')];
	const enlaces = items.map((it) => it.querySelector<HTMLAnchorElement>('[data-abre]')!);
	const ids = enlaces.map((a) => a.dataset.abre!);
	const fichas = ids.map((id) => panel.querySelector<HTMLElement>(`[data-ficha="${id}"]`)!);
	let actual = -1;

	for (const a of enlaces) {
		a.setAttribute('aria-controls', panel.id);
		a.setAttribute('aria-expanded', 'false');
	}

	const ubicar = () => {
		if (actual < 0) return false;
		const it = items[actual];
		const fila = it.offsetTop;
		const ultimo = items.filter((o) => Math.abs(o.offsetTop - fila) < 4).pop() ?? it;
		const movido = ultimo.nextElementSibling !== panel;
		if (movido) ultimo.after(panel);
		const r = it.getBoundingClientRect();
		const base = m.getBoundingClientRect();
		panel.style.setProperty('--x', `${r.left - base.left + r.width / 2}px`);
		return movido;
	};

	const marcar = () =>
		items.forEach((it, i) => {
			it.classList.toggle('abierta', i === actual);
			enlaces[i].setAttribute('aria-expanded', String(i === actual));
		});

	const grupo: Grupo = {
		tiene: (id) => ids.includes(id),
		mostrar: (id) => {
			actual = ids.indexOf(id);
			const estabaAbierto = panel.classList.contains('abierto');
			if (ubicar() && estabaAbierto) {
				// Cambió de fila: volver a desplegarlo en su nuevo lugar.
				panel.classList.remove('abierto');
				void panel.offsetHeight;
				panel.classList.add('abierto');
			}
			fichas.forEach((f, i) => (f.hidden = i !== actual));
			marcar();
		},
		panel: () => panel,
		disparador: () => enlaces[actual] ?? null,
		alCerrar: () => {
			actual = -1;
			marcar();
		},
	};

	enlaces.forEach((a, i) =>
		a.addEventListener('click', (e) => {
			if (e.ctrlKey || e.metaKey || e.shiftKey) return; // abrir la página en otra pestaña
			e.preventDefault();
			if (abiertaEn(grupo) === ids[i]) cerrar();
			else abrir(grupo, ids[i]);
		}),
	);
	for (const b of panel.querySelectorAll<HTMLButtonElement>('[data-cerrar]')) b.addEventListener('click', cerrar);

	let pendiente = false;
	addEventListener('resize', () => {
		if (pendiente || actual < 0) return;
		pendiente = true;
		requestAnimationFrame(() => {
			pendiente = false;
			ubicar();
		});
	});

	registrar(grupo);
}
