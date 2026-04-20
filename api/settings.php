<?php
/**
 * Settings API — GET and POST
 * Used by the admin panel to read/write config.json
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$configPath = __DIR__ . '/config.json';

// ── Load current config ──────────────────────────────────────────────────────
function loadConfig(string $path): array {
    if (!file_exists($path)) return [];
    return json_decode(file_get_contents($path), true) ?? [];
}

function saveConfig(string $path, array $data): void {
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$config = loadConfig($configPath);
$adminPassword = $config['admin_password'] ?? 'admin123';

// ── Authenticate ─────────────────────────────────────────────────────────────
$providedPassword = $_SERVER['HTTP_X_ADMIN_PASSWORD']
    ?? $_POST['admin_password']
    ?? (json_decode(file_get_contents('php://input'), true)['admin_password'] ?? '');

if ($providedPassword !== $adminPassword) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ── GET: return settings (API key masked) ────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $safe = $config;
    if (!empty($safe['gemini_api_key'])) {
        $safe['gemini_api_key'] = '****' . substr($safe['gemini_api_key'], -4);
    }
    if (!empty($safe['smtp_password'])) {
        $safe['smtp_password'] = '••••••••';
    }
    unset($safe['admin_password']);
    echo json_encode(['success' => true, 'settings' => $safe]);
    exit;
}

// ── POST: update settings ────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $updates = $input['settings'] ?? $input;

    $allowed = [
        'gemini_api_key', 'gemini_model',
        'smtp_host', 'smtp_port', 'smtp_encryption',
        'smtp_username', 'smtp_password',
        'smtp_from_email', 'smtp_from_name',
        'admin_password',
    ];

    foreach ($allowed as $key) {
        if (array_key_exists($key, $updates)) {
            // Don't overwrite masked values
            if ($key === 'gemini_api_key' && str_starts_with($updates[$key], '****')) continue;
            if ($key === 'smtp_password'  && $updates[$key] === '••••••••')            continue;
            $config[$key] = $updates[$key];
        }
    }

    if (isset($updates['smtp_port'])) {
        $config['smtp_port'] = intval($updates['smtp_port']);
    }

    saveConfig($configPath, $config);
    echo json_encode(['success' => true, 'message' => 'Settings saved']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
