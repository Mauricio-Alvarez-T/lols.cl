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
`;
