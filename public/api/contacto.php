<?php
/**
 * Formulario de cotización de lols.cl (/cotizar/): valida, filtra spam y envía un correo con
 * mail(), con lo que adjunte la persona: hasta 5 archivos de fotos, PDF, planos, modelos y
 * documentos técnicos (FORMATOS en lib/formulario.php), y un enlace para los muy pesados.
 * Lo común con postulacion.php (configuración, límite de envíos, adjuntos, correo) está en
 * lib/formulario.php; la configuración, en docs/DEPLOY.md. Sin config.ini no envía nada
 * (responde "no configurado").
 *
 * Responde JSON si la petición viene por fetch (Accept: application/json); si no, redirige
 * a /cotizar/ con ?enviado=1 o ?error=<código>, para que funcione sin JavaScript.
 *
 * Compatible con PHP 7.4+.
 */

declare(strict_types=1);

require __DIR__ . '/lib/formulario.php';

$paginaFormulario = '/cotizar/';

// Opciones del formulario (src/components/FormularioContacto.astro): cambiarlas en ambos.
const SERVICIOS = [
    'construccion' => 'Construcción',
    'montaje-industrial' => 'Montaje industrial',
    'electricidad' => 'Electricidad',
    'otro' => 'Otro',
];
const TERRENOS = [
    'plano' => 'Plano',
    'pendiente' => 'Con pendiente',
    'construccion-existente' => 'Con una construcción existente',
    'relleno' => 'Relleno o suelo blando',
    'no-sabe' => 'No lo sabe',
];
const ETAPAS = [
    'idea' => 'Solo una idea',
    'planos' => 'Tiene planos',
    'permisos' => 'Tiene permisos',
    'licitacion' => 'Es una licitación',
];
const INICIOS = [
    'pronto' => 'Lo antes posible',
    '1-3' => 'En 1 a 3 meses',
    '3-6' => 'En 3 a 6 meses',
    'mas-6' => 'En más de 6 meses',
    'no-sabe' => 'No lo sabe',
];
// Fotos y PDF, y todos los formatos técnicos de lib/formulario.php (Marcos, 11-11-2026).
const MAX_ADJUNTOS = 5;
const TIPOS_ADJUNTO = ['jpg', 'png', 'webp', 'heic', 'pdf'];

revisarPeticion();
[$destinatario, $remitente] = configuracion('destinatario');

$nombre = unaLinea(campo('nombre', 120));
$empresa = unaLinea(campo('empresa', 120));
$correo = unaLinea(campo('correo', 160));
$telefono = unaLinea(campo('telefono', 40));
$servicio = campo('servicio', 40);
$direccion = unaLinea(campo('direccion', 200));
$superficie = unaLinea(campo('superficie', 40));
$mensaje = campo('mensaje', 5000);
// Enlace a planos o modelos pesados (Drive, OneDrive, Dropbox, WeTransfer…): solo http(s).
$enlace = unaLinea(campo('enlace', 500));
$terreno = opcion('terreno', TERRENOS);
$etapa = opcion('etapa', ETAPAS);
$inicio = opcion('inicio', INICIOS);
$consiente = ($_POST['consentimiento'] ?? '') === 'si';

if ($nombre === '' || $mensaje === '' || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'datos', 422);
}
if ($servicio !== '' && !isset(SERVICIOS[$servicio])) {
    responder(false, 'datos', 422);
}
if ($terreno === null || $etapa === null || $inicio === null) {
    responder(false, 'datos', 422);
}
if ($enlace !== '' && (!filter_var($enlace, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $enlace))) {
    responder(false, 'enlace', 422);
}
$archivos = adjuntos(array_merge(TIPOS_ADJUNTO, array_keys(FORMATOS)), MAX_ADJUNTOS);
if (!is_array($archivos)) {
    responder(false, $archivos, 422);
}
if (!$consiente) {
    responder(false, 'consentimiento', 422);
}

limitarEnvios('contacto');

$servicioTexto = $servicio !== '' ? SERVICIOS[$servicio] : 'No indicado';
$asunto = 'Cotización web: ' . $servicioTexto . ' — ' . $nombre;
$cuerpo = implode("\n", [
    'Nueva solicitud desde el formulario de ' . ($_SERVER['HTTP_HOST'] ?? ''),
    '',
    'Nombre:    ' . $nombre,
    'Empresa:   ' . ($empresa ?: '—'),
    'Correo:    ' . $correo,
    'Teléfono:  ' . ($telefono ?: '—'),
    '',
    'Servicio:    ' . $servicioTexto,
    'Dirección:   ' . ($direccion ?: '—'),
    'Superficie:  ' . ($superficie !== '' ? $superficie . ' m² (aprox.)' : '—'),
    'Terreno:     ' . ($terreno !== '' ? TERRENOS[$terreno] : '—'),
    'Etapa:       ' . ($etapa !== '' ? ETAPAS[$etapa] : '—'),
    'Inicio:      ' . ($inicio !== '' ? INICIOS[$inicio] : '—'),
    'Adjuntos:    ' . ($archivos ? count($archivos) . ' (' . implode(', ', array_column($archivos, 'nombre')) . ')' : '—'),
    'Enlace:      ' . ($enlace ?: '—'),
    '',
    'Proyecto:',
    $mensaje,
    '',
    '—',
    'Enviado el ' . date('d-m-Y H:i') . '. La persona aceptó la política de privacidad.',
    'Responder a este correo le contesta directamente a ' . $correo . '.',
]);

if (!enviarCorreo($destinatario, $remitente, $asunto, $cuerpo, $correo, $archivos)) {
    responder(false, 'envio', 500);
}
responder(true);
