// Estados y tipos de obra. Viven aparte de proyectos.ts porque también los usa el esquema de
// src/content.config.ts, que no puede importar un módulo que lee la colección.

// 'en-curso' conserva el valor de las URLs viejas (/proyectos-en-construccion/ → ?estado=en-curso).
export type Estado = 'en-curso' | 'contratado' | 'terminado';

// Orden en que se muestran en el sitio: lo que está pasando ahora primero.
export const estados: Record<Estado, string> = {
	'en-curso': 'En construcción',
	contratado: 'En proyecto',
	terminado: 'Terminado',
};

// Tipos de obra que nombró don Luis; se pueden agregar más (la Bóveda tiene su espejo).
export const tiposObra = [
	'Edificio de oficinas',
	'Edificio y oficinas',
	'Edificio comercial',
	'Bodegaje',
	'Centro de bodegas',
	'Industrial',
	'Habilitación',
] as const;
export type TipoObra = (typeof tiposObra)[number];

// Superficie construida tal como se muestra: 6220 → "6.220 m²". Con agrupación siempre, para no
// depender de si la versión de ICU agrupa o no los números de cuatro cifras en español.
const m2 = new Intl.NumberFormat('es-CL', { useGrouping: 'always' });
export const formatoSuperficie = (superficieM2: number) => `${m2.format(superficieM2)} m²`;

// URLs de un srcset ("<url> <ancho>w, …").
export const urlsDeSrcset = (srcset: string | undefined) => (srcset ? srcset.split(',').map((c) => c.trim().split(/\s+/)[0]) : []);
