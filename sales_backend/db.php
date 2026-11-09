<?php
$localConfigFile = __DIR__ . '/config.local.php';
$infinityConfigFile = __DIR__ . '/config.infinityfree.php';
$requestHost = strtolower(trim(explode(':', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'))[0], '[]'));
$isLocalRequest = in_array($requestHost, ['localhost', '127.0.0.1', '::1'], true);

if (!$isLocalRequest && is_file($infinityConfigFile)) {
    $localConfigFile = $infinityConfigFile;
} elseif (!is_file($localConfigFile) && is_file($infinityConfigFile)) {
    $localConfigFile = $infinityConfigFile;
}
$localConfig = is_file($localConfigFile) ? require $localConfigFile : [];
if (!is_array($localConfig)) {
    $localConfig = [];
}

$appEnv = getenv('APP_ENV') ?: ($localConfig['APP_ENV'] ?? 'development');
$isProduction = $appEnv === 'production';
$secureCookieSetting = getenv('SESSION_COOKIE_SECURE');
$secureCookieSetting = $secureCookieSetting === false
    ? ($localConfig['SESSION_COOKIE_SECURE'] ?? false)
    : $secureCookieSetting;
$secureCookie = $secureCookieSetting === false
    ? ($isProduction || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'))
    : filter_var($secureCookieSetting, FILTER_VALIDATE_BOOLEAN);

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => $secureCookie,
    'httponly' => true,
    'samesite' => $isProduction ? 'Strict' : 'Lax'
]);
session_start();

// CORS Headers allow karne ke liye
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $defaultAllowedOrigins = [
        'http://localhost',
        'http://localhost:5173',
        'http://127.0.0.1',
        'http://127.0.0.1:5173'
    ];
    $configuredOrigins = getenv('CORS_ALLOWED_ORIGINS');
    if ($configuredOrigins === false) {
        $configuredOrigins = $localConfig['CORS_ALLOWED_ORIGINS'] ?? false;
    }
    $allowedOrigins = $configuredOrigins === false
        ? $defaultAllowedOrigins
        : array_filter(array_map('trim', explode(',', $configuredOrigins)));

    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Max-Age: 86400');
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");

function requireAuth(?array $allowedRoles = null): void
{
    if (empty($_SESSION['user']['id'])) {
        http_response_code(401);
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Unauthorized. Please log in again.'
        ));
        exit;
    }

    if (!empty($allowedRoles) && !in_array($_SESSION['user']['role'] ?? '', $allowedRoles, true)) {
        http_response_code(403);
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Forbidden. Insufficient permissions.'
        ));
        exit;
    }

    requireCsrf();
}

function requireCsrf(): void
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }

    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($headers['X-CSRF-Token'] ?? '');
    $sessionToken = $_SESSION['csrf_token'] ?? '';

    if ($sessionToken === '' || !is_string($csrfToken) || !hash_equals($sessionToken, $csrfToken)) {
        http_response_code(403);
        echo json_encode(array(
            'status' => 'error',
            'message' => 'Invalid or missing CSRF token.'
        ));
        exit;
    }
}

function sanitizeUserSession(array $user): array
{
    return array(
        'id' => intval($user['id'] ?? 0),
        'name' => trim((string) ($user['name'] ?? '')),
        'username' => trim((string) ($user['username'] ?? '')),
        'role' => trim((string) ($user['role'] ?? '')),
        'location_id' => isset($user['location_id']) ? intval($user['location_id']) : null
    );
}

function isProductionEnvironment(): bool
{
    return ($GLOBALS['appEnv'] ?? 'development') === 'production';
}

function apiExceptionMessage(Throwable $exception): string
{
    if (isProductionEnvironment()) {
        error_log(get_class($exception) . ': ' . $exception->getMessage());
        return 'An internal error occurred. Please try again later.';
    }

    return $exception->getMessage();
}

$host = getenv('DB_HOST') ?: ($localConfig['DB_HOST'] ?? 'localhost');
$port = getenv('DB_PORT') ?: ($localConfig['DB_PORT'] ?? '3306');
$db_name = getenv('DB_NAME') ?: ($localConfig['DB_NAME'] ?? 'sales_management_db');
$username = getenv('DB_USER') ?: ($localConfig['DB_USER'] ?? 'root');
$password = getenv('DB_PASSWORD') ?: ($localConfig['DB_PASSWORD'] ?? '');

if ($isProduction && ($username === 'root' || $password === '')) {
    http_response_code(500);
    error_log('Production database credentials are not configured securely.');
    echo json_encode(array('error' => 'Server database configuration is incomplete.'));
    exit();
}

try {
    $conn = new PDO(
        "mysql:host={$host};port={$port};dbname={$db_name};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch(PDOException $exception) {
    http_response_code(500);
    error_log('Database connection failed: ' . $exception->getMessage());
    $message = $isProduction ? 'Database connection failed.' : 'Connection error: ' . $exception->getMessage();
    echo json_encode(array("error" => $message));
    exit();
}
?>