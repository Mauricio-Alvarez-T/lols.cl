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
// Tope por archivo. El que manda de verdad es upload_max_filesize del hosting (api/.user.ini lo
// sube a 10 MB si el PHP del hosting lo lee; si no, quedan los 2 MB de fábrica: docs/DEPLOY.md
// § Peso de los archivos).
const MAX_BYTES_ARCHIVO = 10 * 1024 * 1024;
const MAX_BYTES_TOTAL = 20 * 1024 * 1024; // el correo queda bajo ~27 MB (base64)

// Formatos que se reconocen por la extensión del nombre y se confirman con sus primeros bytes
// (Marcos, 11-11-2026: planos y modelos de ingeniería y arquitectura en la cotización, «que nadie
// quede afuera»). Fotos y PDF se reconocen solo por sus bytes (tipoArchivo). La lista para el
// navegador está en src/data/formatos.ts: cambiar en ambos.
// extensión => [tipo MIME, reglas]; basta con que se cumpla una regla:
//   '@ole'   documento compuesto de Microsoft (Revit, Word y Excel viejos, Inventor, 3ds Max…)
//   '@zip'   zip (Office nuevo, IFC comprimido, KMZ…); además se revisa lo que trae (zipSeguro)
//   '@texto' texto sin bytes nulos (DXF, IFC, OBJ, STEP…)
//   '@otro'  binario sin firma fija conocida: basta con que no sea un programa
//   otra     los primeros bytes exactos
const OCTETOS = 'application/octet-stream';
const FORMATOS = [
    // Planos CAD
    'dwg' => ['image/vnd.dwg', ['AC1', 'AC2']],
    'dxf' => ['image/vnd.dxf', ['@texto', 'AutoCAD Binary DXF']],
    'dwf' => ['model/vnd.dwf', ['(DWF V']],
    'dwfx' => [OCTETOS, ['@zip']],
    'dgn' => [OCTETOS, ['@ole', "\x08\x09\xFE\x02", "\xC8\x09\xFE\x02"]],
    // BIM (Revit, IFC, Navisworks, ArchiCAD)
    'rvt' => [OCTETOS, ['@ole']],
    'rfa' => [OCTETOS, ['@ole']],
    'rte' => [OCTETOS, ['@ole']],
    'rft' => [OCTETOS, ['@ole']],
    'ifc' => ['application/x-step', ['ISO-10303-21']],
    'ifczip' => [OCTETOS, ['@zip']],
    'ifcxml' => ['application/xml', ['@texto']],
    'nwd' => [OCTETOS, ['@otro']],
    'nwc' => [OCTETOS, ['@otro']],
    'nwf' => [OCTETOS, ['@otro']],
    'pln' => [OCTETOS, ['@otro']],
    'pla' => [OCTETOS, ['@otro']],
    'bpn' => [OCTETOS, ['@otro']],
    // Modelos 3D (SketchUp, Rhino, Blender, 3ds Max y de intercambio)
    'skp' => [OCTETOS, ["\xFF\xFE\xFF"]],
    '3dm' => [OCTETOS, ['3D Geometry File Format']],
    'blend' => [OCTETOS, ['BLENDER', "\x1F\x8B", "\x28\xB5\x2F\xFD"]],
    'max' => [OCTETOS, ['@ole']],
    'fbx' => [OCTETOS, ['Kaydara FBX Binary', '@texto']],
    'obj' => ['model/obj', ['@texto']],
    'mtl' => ['model/mtl', ['@texto']],
    'stl' => ['model/stl', ['@otro']],
    '3ds' => [OCTETOS, ['MM']],
    'dae' => ['model/vnd.collada+xml', ['@texto']],
    'gltf' => ['model/gltf+json', ['@texto']],
    'glb' => ['model/gltf-binary', ['glTF']],
    // Ingeniería mecánica y estructuras (intercambio, SolidWorks, Inventor, Fusion)
    'step' => ['model/step', ['ISO-10303-21']],
    'stp' => ['model/step', ['ISO-10303-21']],
    'iges' => ['model/iges', ['@texto']],
    'igs' => ['model/iges', ['@texto']],
    'sat' => [OCTETOS, ['@texto']],
    'x_t' => [OCTETOS, ['@texto']],
    'x_b' => [OCTETOS, ['@otro']],
    'sldprt' => [OCTETOS, ['@otro']],
    'sldasm' => [OCTETOS, ['@otro']],
    'slddrw' => [OCTETOS, ['@otro']],
    'ipt' => [OCTETOS, ['@ole']],
    'iam' => [OCTETOS, ['@ole']],
    'idw' => [OCTETOS, ['@ole']],
    'f3d' => [OCTETOS, ['@otro']],
    // Terreno y levantamientos (Google Earth, nubes de puntos)
    'kmz' => ['application/vnd.google-earth.kmz', ['@zip']],
    'kml' => ['application/vnd.google-earth.kml+xml', ['@texto']],
    'las' => [OCTETOS, ['LASF']],
    'laz' => [OCTETOS, ['LASF']],
    'e57' => [OCTETOS, ['ASTM-E57']],
    // Documentos, planillas e imágenes escaneadas
    'doc' => ['application/msword', ['@ole']],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['@zip']],
    'xls' => ['application/vnd.ms-excel', ['@ole']],
    'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ['@zip']],
    'pptx' => ['application/vnd.openxmlformats-officedocument.presentationml.presentation', ['@zip']],
    'odt' => ['application/vnd.oasis.opendocument.text', ['@zip']],
    'ods' => ['application/vnd.oasis.opendocument.spreadsheet', ['@zip']],
    'csv' => ['text/csv', ['@texto']],
    'txt' => ['text/plain', ['@texto']],
    'tif' => ['image/tiff', ["II*\x00", "MM\x00*"]],
    'tiff' => ['image/tiff', ["II*\x00", "MM\x00*"]],
    // Varios archivos juntos (también los de un programa que no está en esta lista)
    'zip' => ['application/zip', ['@zip']],
];

// Lo que nunca se recibe dentro de un zip: programas, scripts, macros (también las de AutoCAD:
// LISP, VBA, ARX) y otros comprimidos que no se pueden revisar.
const EXTENSIONES_PELIGROSAS = [
    'exe', 'com', 'bat', 'cmd', 'scr', 'pif', 'msi', 'msp', 'mst', 'dll', 'cpl', 'ocx', 'sys', 'drv',
    'jar', 'js', 'jse', 'mjs', 'vbs', 'vbe', 'wsf', 'wsh', 'wsc', 'ps1', 'psm1', 'psd1', 'hta', 'lnk',
    'url', 'reg', 'inf', 'scf', 'sh', 'bash', 'app', 'apk', 'ipa', 'deb', 'rpm', 'iso', 'img', 'vhd',
    'vhdx', 'docm', 'dotm', 'xlsm', 'xltm', 'xlam', 'pptm', 'potm', 'ppam', 'sldm', 'lsp', 'fas',
    'vlx', 'mnl', 'dvb', 'arx', 'dbx', 'crx', 'py', 'pyc', 'pyw', 'rb', 'pl', 'php', 'phtml', 'asp',
    'aspx', 'cgi', 'htm', 'html', 'xhtml', 'svg', 'zip', 'rar', '7z', 'gz', 'tgz', 'tar', 'cab', 'arj',
    'ace', 'xz', 'bz2', 'lzh', 'z',
];

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

// Primeros bytes de un archivo ('' si no se puede leer).
function primerosBytes(string $ruta, int $cuantos): string
{
    $f = @fopen($ruta, 'rb');
    if ($f === false) {
        return '';
    }
    $c = (string) fread($f, $cuantos);
    fclose($f);
    return $c;
}

// Un programa (Windows, Linux, Mac o Java) o un script, se llame como se llame.
function esPrograma(string $c): bool
{
    foreach (['MZ', "\x7FELF", "\xCA\xFE\xBA\xBE", "\xFE\xED\xFA", "\xCE\xFA\xED\xFE", "\xCF\xFA\xED\xFE", '#!'] as $firma) {
        if (strncmp($c, $firma, strlen($firma)) === 0) {
            return true;
        }
    }
    return false;
}

function esZip(string $c): bool
{
    return strncmp($c, "PK\x03\x04", 4) === 0 || strncmp($c, "PK\x05\x06", 4) === 0;
}

// Tipo real del archivo. Fotos y PDF, por sus primeros bytes (no se confía en el nombre ni en lo
// que diga el navegador: una foto con otro nombre sale con el suyo). Lo demás, por la extensión
// del nombre confirmada con sus bytes (tipoPorNombre).
function tipoArchivo(string $ruta, string $nombreOriginal): ?array
{
    $c = primerosBytes($ruta, 16);
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
    return tipoPorNombre($ruta, $nombreOriginal);
}

// [tipo MIME, extensión] según FORMATOS, o null si la extensión no está, los bytes no calzan,
// es un programa o es un comprimido que no se puede revisar.
function tipoPorNombre(string $ruta, string $nombreOriginal): ?array
{
    $ext = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));
    if (!isset(FORMATOS[$ext])) {
        return null;
    }
    [$mime, $reglas] = FORMATOS[$ext];
    $c = primerosBytes($ruta, 8192);
    if ($c === '' || esPrograma($c)) {
        return null;
    }
    // Un zip, se llame como se llame, se revisa por dentro; RAR y 7z no se pueden revisar.
    $zip = esZip($c);
    if ($zip && !zipSeguro($ruta)) {
        return null;
    }
    if (strncmp($c, 'Rar!', 4) === 0 || strncmp($c, "7z\xBC\xAF\x27\x1C", 6) === 0) {
        return null;
    }
    foreach ($reglas as $regla) {
        if (
            ($regla === '@ole' && strncmp($c, "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1", 8) === 0)
            || ($regla === '@zip' && $zip)
            || ($regla === '@texto' && strpos($c, "\x00") === false)
            || $regla === '@otro'
            || ($regla[0] !== '@' && strncmp($c, $regla, strlen($regla)) === 0)
        ) {
            return [$mime, $ext];
        }
    }
    return null;
}

// Revisa lo que trae un zip leyendo su índice (el «directorio central»), sin descomprimir: false
// si trae algo de EXTENSIONES_PELIGROSAS o si el índice no se puede leer. Sin ZipArchive, que el
// hosting puede no tener.
function zipSeguro(string $ruta): bool
{
    $tamano = (int) @filesize($ruta);
    $f = @fopen($ruta, 'rb');
    if ($f === false) {
        return false;
    }
    try {
        if ($tamano < 22) {
            return false;
        }
        // Fin del índice: en los últimos 22 bytes más un comentario de hasta 64 KB.
        $cola = min($tamano, 22 + 65535);
        fseek($f, $tamano - $cola);
        $fin = (string) fread($f, $cola);
        $pos = strrpos($fin, "PK\x05\x06");
        if ($pos === false || strlen($fin) < $pos + 22) {
            return false;
        }
        $v = unpack('ventradas/Vlargo/Vinicio', substr($fin, $pos + 10, 10));
        [$entradas, $largo, $inicio] = [$v['entradas'], $v['largo'], $v['inicio']];
        // ZIP64: los valores de verdad están en otro registro, antes del fin del índice.
        if ($entradas === 0xFFFF || $largo === 0xFFFFFFFF || $inicio === 0xFFFFFFFF) {
            $loc = strrpos(substr($fin, 0, $pos), "PK\x06\x07");
            if ($loc === false || strlen($fin) < $loc + 16) {
                return false;
            }
            fseek($f, unpack('P', substr($fin, $loc + 8, 8))[1]);
            $z = (string) fread($f, 56);
            if (strncmp($z, "PK\x06\x06", 4) !== 0 || strlen($z) < 56) {
                return false;
            }
            $v = unpack('Pentradas/Plargo/Pinicio', substr($z, 32, 24));
            [$entradas, $largo, $inicio] = [$v['entradas'], $v['largo'], $v['inicio']];
        }
        if ($largo <= 0 || $largo > 8 * 1024 * 1024 || $inicio + $largo > $tamano) {
            return false;
        }
        fseek($f, $inicio);
        $indice = (string) fread($f, $largo);
    } finally {
        fclose($f);
    }
    $p = 0;
    for ($i = 0; $i < $entradas; $i++) {
        if (strlen($indice) < $p + 46 || substr($indice, $p, 4) !== "PK\x01\x02") {
            return false;
        }
        $e = unpack('vnombre/vextra/vcomentario', substr($indice, $p + 28, 6));
        $nombre = substr($indice, $p + 46, $e['nombre']);
        $p += 46 + $e['nombre'] + $e['extra'] + $e['comentario'];
        if (substr($nombre, -1) === '/') {
            continue; // carpeta
        }
        // «x.exe.» o «x.exe » también son .exe para Windows.
        $nombre = rtrim(str_replace('\\', '/', $nombre), ' .');
        $ext = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
        if ($ext !== '' && in_array($ext, EXTENSIONES_PELIGROSAS, true)) {
            return false;
        }
    }
    return true;
}

// Adjuntos subidos en "archivos[]": [['nombre' => …, 'tipo' => …, 'ruta' => …], …].
// $tipos: extensiones aceptadas. Si algo no va, devuelve el código de error para responder:
// 'zip' si un zip trae algo que no se recibe; 'archivos' si hay más de $maximo, alguno o todos
// juntos pesan demasiado, o alguno no es de un tipo aceptado.
function adjuntos(array $tipos, int $maximo = MAX_ARCHIVOS)
{
    $subidos = $_FILES['archivos'] ?? null;
    if (!is_array($subidos) || !is_array($subidos['name'] ?? null)) {
        return [];
    }
    $lista = [];
    $total = 0;
    foreach ($subidos['name'] as $i => $nombreOriginal) {
        $error = (int) ($subidos['error'][$i] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $ruta = (string) ($subidos['tmp_name'][$i] ?? '');
        if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($ruta) || filesize($ruta) > MAX_BYTES_ARCHIVO) {
            return 'archivos';
        }
        $total += (int) filesize($ruta);
        $tipo = tipoArchivo($ruta, (string) $nombreOriginal);
        if ($tipo === null || !in_array($tipo[1], $tipos, true)) {
            return esZip(primerosBytes($ruta, 4)) && !zipSeguro($ruta) ? 'zip' : 'archivos';
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
    return count($lista) <= $maximo && $total <= MAX_BYTES_TOTAL ? $lista : 'archivos';
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
