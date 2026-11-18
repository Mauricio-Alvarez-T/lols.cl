// Estilos del editor visual. Los pone el puente (un <style> con textContent) solo dentro de la
// Bóveda: el visitante no los descarga. Las marcas data-ed-* no tienen estilo propio fuera de esto.
export const estilosEditor = `
[data-ed-item][hidden], [data-ed-fila][hidden], [data-ed-parte][hidden], [data-ed-campo][hidden], .etiqueta-ref[hidden] {
	display: none !important;
}
html:not(.ed-editar) [data-ed-vacio] {
	display: none !important;
}
html.ed-editar [data-ed-campo] {
	cursor: text;
	outline: 2px dashed transparent !important;
	outline-offset: 3px;
	transition: outline-color 0.15s;
}
html.ed-editar [data-ed-campo]:hover,
html.ed-editar [data-ed-campo]:focus {
	outline-color: var(--lols-verde, #3fa535) !important;
}
html.ed-editar [data-ed-campo]:empty::before {
	content: attr(data-ed-hueco);
	color: var(--lols-verde-oscuro, #006739);
	opacity: 0.7;
}
html.ed-editar [data-ed-derivado]:hover,
html.ed-editar [data-ed-foto]:hover {
	outline: 2px dotted var(--lols-verde, #3fa535);
	outline-offset: 3px;
	cursor: pointer;
}
/* Etapa A2: estructura. Lo que agrega el puente (.ed-ui) solo existe en modo editar. */
html:not(.ed-editar) .ed-ui, html:not(.ed-editar) .ed-insignia {
	display: none !important;
}
.ed-insignia {
	display: inline-block;
	margin: 0 0 0.6rem;
	padding: 0.15rem 0.55rem;
	border: 1.5px dashed var(--lols-verde-oscuro, #006739);
	background: #fff8d6;
	color: var(--lols-verde-oscuro, #006739);
	font: 600 0.75rem/1.4 var(--fuente-datos, system-ui);
	letter-spacing: 0.04em;
	text-transform: uppercase;
}
html.ed-editar [data-ed-nueva] [data-ed-foto] {
	outline: 2px dashed var(--lols-verde, #3fa535);
	outline-offset: -2px;
}
.ed-boton {
	min-height: 2.5rem;
	padding: 0.35rem 0.9rem;
	border: 1.5px solid var(--lols-verde-oscuro, #006739);
	background: #fff;
	color: var(--lols-verde-oscuro, #006739);
	font: 600 0.95rem var(--fuente-titulos, system-ui);
	cursor: pointer;
}
.ed-boton:hover, .ed-boton[aria-pressed='true'] {
	background: var(--lols-verde-oscuro, #006739);
	color: #fff;
}
.ed-acciones {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	flex-basis: 100%;
}
.ed-nueva-obra {
	display: grid;
	place-items: center;
	min-height: 12rem;
	border: 2px dashed var(--lols-verde, #3fa535);
	list-style: none;
}
.ed-nueva-obra .ed-boton {
	border-style: dashed;
}
/* Arrastrar: la tarjeta sigue al puntero; una barra verde marca dónde caería. */
html.ed-editar .contratadas > li[data-ed-item], .ed-mini {
	cursor: grab;
	-webkit-touch-callout: none;
}
.ed-arrastrando {
	position: relative;
	z-index: 50;
	opacity: 0.85;
	box-shadow: 0 12px 32px rgb(0 0 0 / 0.25);
	cursor: grabbing !important;
	transition: none !important;
}
html.ed-arrastrando-algo, html.ed-arrastrando-algo * {
	user-select: none !important;
	-webkit-user-select: none !important;
}
.ed-marca-soltar {
	position: fixed;
	z-index: 60;
	width: 4px;
	background: var(--lols-verde, #3fa535);
	pointer-events: none;
}
/* Carrusel en modo «Ordenar»: tira de miniaturas en vez del carrusel. */
.ed-tira {
	display: none;
}
[data-carrusel].ed-ordenando .ed-tira {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
	gap: 0.75rem;
	margin: 0 0 1.5rem;
	padding: 0;
	list-style: none;
}
[data-carrusel].ed-ordenando .cuerpo {
	display: none;
}
.ed-mini {
	display: grid;
	gap: 0.35rem;
	padding: 0.4rem;
	border: 1px solid var(--linea, #d3d8d1);
	background: #fff;
	touch-action: manipulation;
}
.ed-mini-foto {
	display: block;
	aspect-ratio: 16 / 9;
	background: #e8ebe6;
	overflow: hidden;
}
.ed-mini-foto img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	pointer-events: none;
}
.ed-mini-nombre {
	font: 600 0.85rem/1.25 var(--fuente-titulos, system-ui);
	overflow-wrap: anywhere;
}
`;
