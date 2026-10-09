<?php
/**
 * Formulario de contacto de lols.cl: valida, filtra spam y envía un correo con mail(), con las
 * fotos o planos que adjunte la persona (hasta 2, de 5 MB, JPG/PNG/WebP/HEIC/PDF).
 *
 * Configuración FUERA del repo y del docroot (el repo es público):
 *   /home/lolscl/lols-contacto/config.ini
 *     destinatario = "correo que recibe las cotizaciones"
 *     remitente    = "no-responder@lols.cl"   ; cuenta del dominio, para SPF
 * Sin ese archivo el formulario no envía nada (responde "no configurado").
 *
 * Datos personales (Ley 21.719): no se guardan. Solo viajan en el correo (los adjuntos
 * también: PHP borra el archivo temporal al terminar). Para el límite de envíos se guarda un
 * hash de la IP con la hora, y se descarta a la hora.
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
const MAX_ARCHIVOS = 2;
const MAX_BYTES_ARCHIVO = 5 * 1024 * 1024;

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

// Opción de una lista cerrada: '' si no se eligió; null si el valor no es de la lista.
function opcion(string $nombre, array $lista): ?string
{
    $valor = campo($nombre, 40);
    if ($valor === '') {
        return '';
    }
    return isset($lista[$valor]) ? $valor : null;
}

// Tipo real del archivo por sus primeros bytes (no se confía en el nombre ni en lo que diga el
// navegador; tampoco depende de fileinfo, que puede no estar en el hosting).
function tipoArchivo(string $ruta): ?array
{
    $f = @fopen($ruta, 'rb');
    if ($f === false) {
        return null;
    }
    $c = (string) fread($f, 16);
    fclose($f);
    if (strncmp($c, "\xFF\xD8\xFF", 3) === 0) {
        return ['image/jpeg', 'jpg'];
    }
    if (strncmp($c, "\x89PNG\r\n\x1A\n", 8) === 0) {
        return ['image/png', 'png'];
    }
    if (strncmp($c, 'RIFF', 4) === 0 && substr($c, 8, 4) === 'WEBP') {
        return ['image/webp', 'webp'];
    }
    if (substr($c, 4, 4) === 'ftyp' && in_array(substr($c, 8, 4), ['heic', 'heix', 'mif1', 'msf1'], true)) {
        return ['image/heic', 'heic'];
    }
    if (strncmp($c, '%PDF', 4) === 0) {
        return ['application/pdf', 'pdf'];
    }
    return null;
}

// Adjuntos subidos en "archivos[]": [['nombre' => …, 'tipo' => …, 'ruta' => …], …].
// null si hay más de los permitidos, alguno es muy grande o no es foto ni PDF.
function adjuntos(): ?array
{
    $subidos = $_FILES['archivos'] ?? null;
    if (!is_array($subidos) || !is_array($subidos['name'] ?? null)) {
        return [];
    }
    $lista = [];
    foreach ($subidos['name'] as $i => $nombreOriginal) {
        $error = (int) ($subidos['error'][$i] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $ruta = (string) ($subidos['tmp_name'][$i] ?? '');
        if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($ruta) || filesize($ruta) > MAX_BYTES_ARCHIVO) {
            return null;
        }
        $tipo = tipoArchivo($ruta);
        if ($tipo === null) {
            return null;
        }
        // Nombre seguro para el correo: letras sin tilde, números, punto, guion y guion bajo.
        $base = strtr(pathinfo((string) $nombreOriginal, PATHINFO_FILENAME), [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
            'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ü' => 'U', 'Ñ' => 'N',
        ]);
        $base = preg_replace('/[^A-Za-z0-9._-]+/', '-', $base) ?? '';
        $base = substr(trim($base, '.-'), 0, 60) ?: 'adjunto-' . (count($lista) + 1);
        $lista[] = ['nombre' => $base . '.' . $tipo[1], 'tipo' => $tipo[0], 'ruta' => $ruta];
    }
    return count($lista) <= MAX_ARCHIVOS ? $lista : null;
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
$archivos = adjuntos();
if ($archivos === null) {
    responder(false, 'archivos', 422);
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

$cabeceras = [
    'From: =?UTF-8?B?' . base64_encode('Sitio web LOLS') . '?= <' . $remitente . '>',
    'Reply-To: ' . $correo,
    'MIME-Version: 1.0',
];
if (!$archivos) {
    $cabeceras[] = 'Content-Type: text/plain; charset=UTF-8';
    $cabeceras[] = 'Content-Transfer-Encoding: 8bit';
} else {
    // Con adjuntos: correo en partes (texto + cada archivo en base64).
    $limite = 'lols-' . bin2hex(random_bytes(12));
    $cabeceras[] = 'Content-Type: multipart/mixed; boundary="' . $limite . '"';
    $partes = [
        '--' . $limite,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        $cuerpo,
    ];
    foreach ($archivos as $a) {
        array_push(
            $partes,
            '--' . $limite,
            'Content-Type: ' . $a['tipo'] . '; name="' . $a['nombre'] . '"',
            'Content-Transfer-Encoding: base64',
            'Content-Disposition: attachment; filename="' . $a['nombre'] . '"',
            '',
            rtrim(chunk_split(base64_encode((string) file_get_contents($a['ruta'])), 76, "\r\n"))
        );
    }
    $partes[] = '--' . $limite . '--';
    $cuerpo = implode("\r\n", $partes);
}
$cabeceras = implode("\r\n", $cabeceras);

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
