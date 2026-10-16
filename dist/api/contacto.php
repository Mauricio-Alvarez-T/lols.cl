<?php
/**
 * Formulario de cotización de lols.cl (/contacto/): valida, filtra spam y envía un correo con
 * mail(), con las fotos o planos que adjunte la persona (hasta 2, de 5 MB, JPG/PNG/WebP/HEIC/PDF).
 * Lo común con postulacion.php (configuración, límite de envíos, adjuntos, correo) está en
 * lib/formulario.php; la configuración, en docs/DEPLOY.md. Sin config.ini no envía nada
 * (responde "no configurado").
 *
 * Responde JSON si la petición viene por fetch (Accept: application/json); si no, redirige
 * a /contacto/ con ?enviado=1 o ?error=<código>, para que funcione sin JavaScript.
 *
 * Compatible con PHP 7.4+.
 */

declare(strict_types=1);

require __DIR__ . '/lib/formulario.php';

$paginaFormulario = '/contacto/';

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
$archivos = adjuntos(TIPOS_ADJUNTO);
if ($archivos === null) {
    responder(false, 'archivos', 422);
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
