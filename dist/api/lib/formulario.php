<?php
/**
 * Lo común de los formularios del sitio (contacto.php y postulacion.php): revisar la petición,
 * filtrar spam, leer la configuración, limitar envíos, aceptar adjuntos y mandar el correo.
 * No se llama sola: la incluye cada formulario.
 *
 * Configuración FUERA del repo y del docroot (el repo es público), ver docs/DEPLOY.md:
 *   /home/lolscl/lols-contacto/config.ini
 *     destinatario    = "correo que recibe las cotizaciones"   ; varios, separados por coma
 *     destinatario_cv = "correo que recibe las postulaciones"  ; opcional: si falta, destinatario
 *     remitente       = "no-responder@lols.cl"                 ; cuenta del dominio, para SPF
 *
 * Datos personales (Ley 21.719): no se guardan. Solo viajan en el correo (los adjuntos
 * también: PHP borra el archivo temporal al terminar). Para el límite de envíos se guarda un
 * hash de la IP con la hora, y se descarta a la hora.
 *
 * Compatible con PHP 7.4+ y sin mbstring ni fileinfo (el hosting no los trae).
 */

declare(strict_types=1);

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    http_response_code(404);
    exit;
}

date_default_timezone_set('America/Santiago');

// LOLS_CONTACTO_DIR solo sirve para probar en local; en el hosting no se define.
define('DIR_CONFIG', getenv('LOLS_CONTACTO_DIR') ?: '/home/lolscl/lols-contacto');
const MAX_ENVIOS_POR_HORA = 5;
const SEGUNDOS_MINIMOS = 3; // un humano no llena el formulario en menos tiempo
const MAX_ARCHIVOS = 2;
const MAX_BYTES_ARCHIVO = 5 * 1024 * 1024;

$quiereJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
$paginaFormulario = '/'; // cada formulario pone la suya (a dónde vuelve sin JavaScript)

function responder(bool $ok, string $codigo = '', int $estado = 200): void
{
    global $quiereJson, $paginaFormulario;
    if ($quiereJson) {
        http_response_code($estado);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => $ok, 'error' => $codigo ?: null]);
    } else {
        header('Location: ' . $paginaFormulario . '?' . ($ok ? 'enviado=1' : 'error=' . rawurlencode($codigo)) . '#formulario', true, 303);
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

// Opción de una lista cerrada [valor => texto]: '' si no se eligió; null si no es de la lista.
function opcion(string $nombre, array $lista): ?string
{
    $valor = campo($nombre, 40);
    if ($valor === '') {
        return '';
    }
    return isset($lista[$valor]) ? $valor : null;
}

// Varias opciones de una lista cerrada (casillas "nombre[]"): null si alguna no es de la lista.
function opciones(string $nombre, array $lista): ?array
{
    $valores = $_POST[$nombre] ?? [];
    if (!is_array($valores)) {
        return null;
    }
    $elegidas = [];
    foreach ($valores as $v) {
        if (!is_string($v) || !isset($lista[$v])) {
            return null;
        }
        $elegidas[$v] = true;
    }
    return array_keys($elegidas);
}

// Solo se aceptan envíos por POST desde el propio sitio, y se descartan los bots.
function revisarPeticion(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        responder(false, 'metodo', 405);
    }
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
    // la página (lo pone el JavaScript; sin JavaScript no se exige). Al bot se le dice que salió bien.
    if (campo('sitio_web', 200) !== '') {
        responder(true);
    }
    $cargado = (int) ($_POST['t'] ?? 0);
    if ($cargado > 0 && (time() * 1000 - $cargado) < SEGUNDOS_MINIMOS * 1000) {
        responder(true);
    }
}

// [destinatarios (separados por coma), remitente] de config.ini. $clave: 'destinatario' o
// 'destinatario_cv' (este último, si falta, usa 'destinatario').
function configuracion(string $clave): array
{
    $config = @parse_ini_file(DIR_CONFIG . '/config.ini');
    $config = is_array($config) ? $config : [];
    $lista = (string) ($config[$clave] ?? '') ?: (string) ($config['destinatario'] ?? '');
    $destinatarios = array_values(array_filter(array_map('trim', explode(',', $lista))));
    $remitente = (string) ($config['remitente'] ?? '');
    $validos = $destinatarios && filter_var($remitente, FILTER_VALIDATE_EMAIL);
    foreach ($destinatarios as $d) {
        $validos = $validos && filter_var($d, FILTER_VALIDATE_EMAIL);
    }
    if (!$validos) {
        error_log('formulario: falta o es inválido ' . DIR_CONFIG . '/config.ini (' . $clave . ')');
        responder(false, 'no-configurado', 503);
    }
    return [implode(', ', $destinatarios), $remitente];
}

// Límite de envíos por IP y formulario. Se guarda el hash de la IP, nunca la IP.
function limitarEnvios(string $formulario): void
{
    $archivoLimite = DIR_CONFIG . '/limite.json';
    $ahora = time();
    $claveIp = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $formulario);
    $fp = @fopen($archivoLimite, 'c+');
    if ($fp === false || !flock($fp, LOCK_EX)) {
        return;
    }
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

// Tipo real del archivo por sus primeros bytes (no se confía en el nombre ni en lo que diga el
// navegador). Word moderno (.docx) es un zip: se acepta solo si el nombre termina en .docx.
function tipoArchivo(string $ruta, string $nombreOriginal): ?array
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
    if (strncmp($c, "\xD0\xCF\x11\xE0", 4) === 0) {
        return ['application/msword', 'doc'];
    }
    if (strncmp($c, "PK\x03\x04", 4) === 0 && strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION)) === 'docx') {
        return ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'];
    }
    return null;
}

// Adjuntos subidos en "archivos[]": [['nombre' => …, 'tipo' => …, 'ruta' => …], …].
// $tipos: extensiones aceptadas. null si hay más de los permitidos, alguno es muy grande o
// no es de un tipo aceptado.
function adjuntos(array $tipos): ?array
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
        $tipo = tipoArchivo($ruta, (string) $nombreOriginal);
        if ($tipo === null || !in_array($tipo[1], $tipos, true)) {
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

// Manda el correo: texto simple o, con adjuntos, en partes (texto + cada archivo en base64).
function enviarCorreo(string $destinatarios, string $remitente, string $asunto, string $cuerpo, string $responderA, array $archivos): bool
{
    $cabeceras = [
        'From: =?UTF-8?B?' . base64_encode('Sitio web LOLS') . '?= <' . $remitente . '>',
        'Reply-To: ' . $responderA,
        'MIME-Version: 1.0',
    ];
    if (!$archivos) {
        $cabeceras[] = 'Content-Type: text/plain; charset=UTF-8';
        $cabeceras[] = 'Content-Transfer-Encoding: 8bit';
    } else {
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
    $enviado = mail(
        $destinatarios,
        '=?UTF-8?B?' . base64_encode($asunto) . '?=',
        $cuerpo,
        implode("\r\n", $cabeceras),
        '-f' . $remitente // remitente del sobre alineado con el dominio (SPF)
    );
    if (!$enviado) {
        error_log('formulario: mail() devolvió false');
    }
    return $enviado;
}
