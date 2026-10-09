<?php
/**
 * Postulaciones de "Trabaja con nosotros": valida el cargo y las respuestas con /api/cargos.json
 * (los mismos datos que muestra la página, src/data/postulaciones.ts) y manda un correo por
 * postulación, con el cargo en el asunto (así llegan separadas) y el CV adjunto (hasta 2
 * archivos de 5 MB: PDF, Word o foto). El CV es obligatorio en profesionales y opcional en obra;
 * el correo de la persona también (muchos maestros no tienen).
 *
 * Correo de destino: destinatario_cv de config.ini (si falta, destinatario). Lo común con
 * contacto.php está en lib/formulario.php; la configuración, en docs/DEPLOY.md.
 *
 * Compatible con PHP 7.4+.
 */

declare(strict_types=1);

require __DIR__ . '/lib/formulario.php';

$paginaFormulario = '/trabaja-con-nosotros/';

const TIPOS_CV = ['pdf', 'doc', 'docx', 'jpg', 'png', 'webp', 'heic'];

revisarPeticion();
[$destinatario, $remitente] = configuracion('destinatario_cv');

$datos = json_decode((string) @file_get_contents(__DIR__ . '/cargos.json'), true);
if (!is_array($datos) || !is_array($datos['cargos'] ?? null)) {
    error_log('postulacion.php: falta o es inválido cargos.json');
    responder(false, 'otro', 500);
}

$idCargo = campo('cargo', 60);
$cargo = $datos['cargos'][$idCargo] ?? null;
$nombre = unaLinea(campo('nombre', 120));
$telefono = unaLinea(campo('telefono', 40));
$correo = unaLinea(campo('correo', 160));
$comuna = unaLinea(campo('comuna', 80));
$experiencia = opcion('experiencia', $datos['experiencia']);
$aCargo = opcion('personas_a_cargo', $datos['personasACargo']);
$mensaje = campo('mensaje', 3000);
$consiente = ($_POST['consentimiento'] ?? '') === 'si';

if (!is_array($cargo) || $nombre === '' || $telefono === '' || !$experiencia || !$aCargo) {
    responder(false, 'datos', 422);
}
if ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'datos', 422);
}
if ($cargo['cvObligatorio'] && $correo === '') {
    responder(false, 'datos', 422);
}

// Preguntas del cargo: las de una opción son obligatorias; las de varias, opcionales.
$respuestas = [];
foreach ($cargo['preguntas'] as $p) {
    $campo = 'p-' . $idCargo . '-' . $p['id'];
    if ($p['varias']) {
        $elegidas = opciones($campo, $p['opciones']);
        if ($elegidas === null) {
            responder(false, 'datos', 422);
        }
        $texto = $elegidas ? implode(', ', array_map(function ($v) use ($p) {
            return $p['opciones'][$v];
        }, $elegidas)) : '—';
    } else {
        $elegida = opcion($campo, $p['opciones']);
        if (!$elegida) {
            responder(false, 'datos', 422);
        }
        $texto = $p['opciones'][$elegida];
    }
    $respuestas[] = $p['texto'] . ' ' . $texto;
}

$archivos = adjuntos(TIPOS_CV);
if ($archivos === null) {
    responder(false, 'archivos', 422);
}
if ($cargo['cvObligatorio'] && !$archivos) {
    responder(false, 'cv', 422);
}
if (!$consiente) {
    responder(false, 'consentimiento', 422);
}

limitarEnvios('postulacion');

$asunto = 'Postulación web: ' . $cargo['nombre'] . ' — ' . $nombre;
$cuerpo = implode("\n", array_merge([
    'Nueva postulación desde ' . ($_SERVER['HTTP_HOST'] ?? ''),
    '',
    'Cargo:       ' . $cargo['nombre'] . ' (' . $cargo['grupo'] . ')',
    '',
    'Nombre:      ' . $nombre,
    'Teléfono:    ' . $telefono,
    'Correo:      ' . ($correo ?: '—'),
    'Comuna:      ' . ($comuna ?: '—'),
    '',
    'Experiencia:       ' . $datos['experiencia'][$experiencia],
    'Personas a cargo:  ' . $datos['personasACargo'][$aCargo],
    '',
], $respuestas, [
    '',
    'CV y adjuntos: ' . ($archivos ? implode(', ', array_column($archivos, 'nombre')) : 'no adjuntó'),
    '',
    'Algo más:',
    $mensaje ?: '—',
    '',
    '—',
    'Enviado el ' . date('d-m-Y H:i') . '. La persona aceptó que LOLS guarde sus datos para la selección de personal.',
    $correo !== '' ? 'Responder a este correo le contesta directamente a ' . $correo . '.' : 'No dejó correo: contactar por teléfono.',
]));

if (!enviarCorreo($destinatario, $remitente, $asunto, $cuerpo, $correo !== '' ? $correo : $remitente, $archivos)) {
    responder(false, 'envio', 500);
}
responder(true);
