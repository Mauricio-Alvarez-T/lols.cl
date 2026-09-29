<?php
/**
 * Formulario de contacto de lols.cl: valida, filtra spam y envía un correo con mail().
 *
 * Configuración FUERA del repo y del docroot (el repo es público):
 *   /home/lolscl/lols-contacto/config.ini
 *     destinatario = "correo que recibe las cotizaciones"
 *     remitente    = "no-responder@lols.cl"   ; cuenta del dominio, para SPF
 * Sin ese archivo el formulario no envía nada (responde "no configurado").
 *
 * Datos personales (Ley 21.719): no se guardan. Solo viajan en el correo. Para el límite de
 * envíos se guarda un hash de la IP con la hora, y se descarta a la hora.
 *
 * Responde JSON si la petición viene por fetch (Accept: application/json); si no, redirige
 * a /contacto/ con ?enviado=1 o ?error=<código>, para que funcione sin JavaScript.
 *
 * Compatible con PHP 7.4+.
 */

declare(strict_types=1);

date_default_timezone_set('America/Santiago');

// LOLS_CONTACTO_DIR solo sirve para probar en local; en el hosting no se define.
define('DIR_CONFIG', getenv('LOLS_CONTACTO_DIR') ?: '/home/lolscl/lols-contacto');
const MAX_ENVIOS_POR_HORA = 5;
const SEGUNDOS_MINIMOS = 3; // un humano no llena el formulario en menos tiempo

const SERVICIOS = [
    'construccion' => 'Construcción',
    'montaje-industrial' => 'Montaje industrial',
    'mantencion' => 'Mantención',
    'electricidad' => 'Electricidad',
    'voz-y-datos' => 'Voz y datos',
    'muebles' => 'Muebles',
    'otro' => 'Otro',
];

$quiereJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function responder(bool $ok, string $codigo = '', int $estado = 200): void
{
    global $quiereJson;
    if ($quiereJson) {
        http_response_code($estado);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => $ok, 'error' => $codigo ?: null]);
    } else {
        header('Location: /contacto/?' . ($ok ? 'enviado=1' : 'error=' . rawurlencode($codigo)) . '#formulario', true, 303);
    }
    exit;
}

// Texto de un campo: sin caracteres de control (evita inyección de cabeceras) y con largo máximo.
function campo(string $nombre, int $maximo): string
{
    $valor = trim((string) ($_POST[$nombre] ?? ''));
    $valor = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $valor) ?? '';
    // Truncar por caracteres con PCRE (no depende de mbstring, que el hosting no trae);
    // si el texto no es UTF-8 válido, preg falla y el campo queda vacío.
    return preg_match('/^.{0,' . $maximo . '}/us', $valor, $m) ? $m[0] : '';
}

function unaLinea(string $valor): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $valor) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(false, 'metodo', 405);
}

// Solo se aceptan envíos desde el propio sitio.
$host = $_SERVER['HTTP_HOST'] ?? '';
$origen = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($origen !== '') {
    $partes = parse_url($origen);
    $hostOrigen = ($partes['host'] ?? '') . (isset($partes['port']) ? ':' . $partes['port'] : '');
    if (strcasecmp($hostOrigen, $host) !== 0) {
        responder(false, 'origen', 403);
    }
}

// Trampas para bots: campo oculto que un humano no llena, y tiempo mínimo desde que cargó
// la página (lo pone el JavaScript; sin JavaScript no se exige).
if (campo('sitio_web', 200) !== '') {
    responder(true); // al bot se le dice que salió bien
}
$cargado = (int) ($_POST['t'] ?? 0);
if ($cargado > 0 && (time() * 1000 - $cargado) < SEGUNDOS_MINIMOS * 1000) {
    responder(true);
}

$config = @parse_ini_file(DIR_CONFIG . '/config.ini');
$destinatario = is_array($config) ? (string) ($config['destinatario'] ?? '') : '';
$remitente = is_array($config) ? (string) ($config['remitente'] ?? '') : '';
if (!filter_var($destinatario, FILTER_VALIDATE_EMAIL) || !filter_var($remitente, FILTER_VALIDATE_EMAIL)) {
    error_log('contacto.php: falta o es inválido ' . DIR_CONFIG . '/config.ini');
    responder(false, 'no-configurado', 503);
}

$nombre = unaLinea(campo('nombre', 120));
$empresa = unaLinea(campo('empresa', 120));
$correo = unaLinea(campo('correo', 160));
$telefono = unaLinea(campo('telefono', 40));
$servicio = campo('servicio', 40);
$direccion = unaLinea(campo('direccion', 200));
$superficie = unaLinea(campo('superficie', 40));
$mensaje = campo('mensaje', 5000);
$consiente = ($_POST['consentimiento'] ?? '') === 'si';

if ($nombre === '' || $mensaje === '' || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'datos', 422);
}
if ($servicio !== '' && !isset(SERVICIOS[$servicio])) {
    responder(false, 'datos', 422);
}
if (!$consiente) {
    responder(false, 'consentimiento', 422);
}

// Límite de envíos por IP. Se guarda el hash de la IP, nunca la IP.
$archivoLimite = DIR_CONFIG . '/limite.json';
$ahora = time();
$claveIp = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $destinatario);
$fp = @fopen($archivoLimite, 'c+');
if ($fp !== false && flock($fp, LOCK_EX)) {
    $registro = json_decode(stream_get_contents($fp) ?: '{}', true) ?: [];
    foreach ($registro as $k => $marcas) {
        $registro[$k] = array_values(array_filter($marcas, function ($m) use ($ahora) {
            return $m > $ahora - 3600;
        }));
        if (!$registro[$k]) {
            unset($registro[$k]);
        }
    }
    if (count($registro[$claveIp] ?? []) >= MAX_ENVIOS_POR_HORA) {
        flock($fp, LOCK_UN);
        fclose($fp);
        responder(false, 'limite', 429);
    }
    $registro[$claveIp][] = $ahora;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($registro));
    flock($fp, LOCK_UN);
    fclose($fp);
}

$servicioTexto = $servicio !== '' ? SERVICIOS[$servicio] : 'No indicado';
$asunto = 'Cotización web: ' . $servicioTexto . ' — ' . $nombre;
$cuerpo = implode("\n", [
    'Nueva solicitud desde el formulario de ' . $host,
    '',
    'Nombre:    ' . $nombre,
    'Empresa:   ' . ($empresa ?: '—'),
    'Correo:    ' . $correo,
    'Teléfono:  ' . ($telefono ?: '—'),
    '',
    'Servicio:    ' . $servicioTexto,
    'Dirección:   ' . ($direccion ?: '—'),
    'Superficie:  ' . ($superficie !== '' ? $superficie . ' m² (aprox.)' : '—'),
    '',
    'Proyecto:',
    $mensaje,
    '',
    '—',
    'Enviado el ' . date('d-m-Y H:i') . '. La persona aceptó la política de privacidad.',
    'Responder a este correo le contesta directamente a ' . $correo . '.',
]);

$cabeceras = implode("\r\n", [
    'From: =?UTF-8?B?' . base64_encode('Sitio web LOLS') . '?= <' . $remitente . '>',
    'Reply-To: ' . $correo,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$enviado = mail(
    $destinatario,
    '=?UTF-8?B?' . base64_encode($asunto) . '?=',
    $cuerpo,
    $cabeceras,
    '-f' . $remitente // remitente del sobre alineado con el dominio (SPF)
);

if (!$enviado) {
    error_log('contacto.php: mail() devolvió false');
    responder(false, 'envio', 500);
}
responder(true);
