// Archivos que reciben los formularios. La cotización recibe planos, modelos y documentos técnicos
// de ingeniería y arquitectura (Marcos, 11-11-2026: «todos los que se pueda, para que a nadie
// quede afuera»). El servidor tiene la misma lista, con cómo se reconoce cada formato por sus
// primeros bytes: FORMATOS en public/api/lib/formulario.php. Cambiar en ambos.
//
// Lo que no está en la lista igual se puede mandar dentro de un ZIP (el servidor revisa que no
// traiga programas) o como enlace (Drive, OneDrive, Dropbox, WeTransfer). RAR y 7z no: no se
// puede revisar lo que traen.

// Peso por archivo y de todos juntos. Hoy el PHP del hosting recibe 2 MB por archivo y 8 MB por
// envío (valores de fábrica, medidos el 11-11-2026). public/api/.user.ini los sube a 10 y 32 MB si
// el hosting lo lee: después del deploy, medir (docs/DEPLOY.md § Peso de los archivos) y recién
// entonces subir estos números a 10 y 20.
export const MAX_MB = 2;
export const MAX_TOTAL_MB = 7;

export const gruposCotizacion: { nombre: string; ext: string[] }[] = [
	{ nombre: 'Planos', ext: ['pdf', 'dwg', 'dxf', 'dwf', 'dwfx', 'dgn'] },
	{ nombre: 'BIM y Revit', ext: ['rvt', 'rfa', 'rte', 'rft', 'ifc', 'ifczip', 'ifcxml', 'nwd', 'nwc', 'nwf', 'pln', 'pla', 'bpn'] },
	{ nombre: 'Modelos 3D', ext: ['skp', '3dm', 'blend', 'max', 'fbx', 'obj', 'mtl', 'stl', '3ds', 'dae', 'gltf', 'glb'] },
	{
		nombre: 'Mecánica y estructuras',
		ext: ['step', 'stp', 'iges', 'igs', 'sat', 'x_t', 'x_b', 'sldprt', 'sldasm', 'slddrw', 'ipt', 'iam', 'idw', 'f3d'],
	},
	{ nombre: 'Terreno y levantamientos', ext: ['kmz', 'kml', 'las', 'laz', 'e57'] },
	{ nombre: 'Documentos y planillas', ext: ['doc', 'docx', 'xls', 'xlsx', 'pptx', 'odt', 'ods', 'csv', 'txt'] },
	{ nombre: 'Fotos e imágenes', ext: ['jpg', 'png', 'heic', 'webp', 'tif', 'tiff'] },
	{ nombre: 'Varios archivos juntos', ext: ['zip'] },
];

// Lo que no es foto (las fotos se reconocen aparte y se achican en el navegador).
const FOTOS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
export const extCotizacion = gruposCotizacion.flatMap((g) => g.ext).filter((e) => !FOTOS.includes(e));
export const extPostulacion = ['pdf', 'doc', 'docx'];

export const acceptDe = (ext: string[]) => ['image/*', ...ext.map((e) => '.' + e)].join(',');
