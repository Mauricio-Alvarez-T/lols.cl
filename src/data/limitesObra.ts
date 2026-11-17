// Largo máximo de cada texto de una obra (src/content/obras/<slug>.json). Los usa el esquema
// (src/content.config.ts) y el editor visual: el puente no deja escribir más que esto en el lugar
// y se los pasa a la Bóveda en el saludo (docs/editor-visual.md § Protocolo). Cambiar aquí cambia
// los dos; la Bóveda tiene su propia copia para validar (docs/contenido-obras.md).
export const limites = {
	slug: 80,
	nombre: 160,
	titular: 240,
	mandante: 160,
	comuna: 80,
	direccion: 200,
	inicio: 40,
	desafio: 1200,
	solucion: 1200,
	resultado: 1200,
	alt: 200, // texto alternativo de cada foto (mínimo 5)
} as const;

export type CampoConLimite = keyof typeof limites;
