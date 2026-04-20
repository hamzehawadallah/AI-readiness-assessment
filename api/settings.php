<?php
/**
 * Settings API
 *
 * GET  /api/settings.php           — public: returns webhook_url, delivery_webhook_url, whatsapp_enabled
 * GET  /api/settings.php?admin=1   — admin (X-Admin-Token): returns all non-secret settings
 * POST /api/settings.php           — admin (X-Admin-Token or X-Admin-Password): update settings
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password, X-Admin-Token');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$configPath = __DIR__ . '/config.json';

function loadCfg(string $path): array {
    if (!file_exists($path)) return [];
    return json_decode(file_get_contents($path), true) ?? [];
}
function saveCfg(string $path, array $data): void {
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$config = loadCfg($configPath);

// ── Auth helper ───────────────────────────────────────────────────────────────
function isAdminAuthed(array $cfg): bool {
    // Accept X-Admin-Token
    $token   = trim($_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '');
    $stored  = $cfg['admin_token'] ?? '';
    $expires = (int)($cfg['admin_token_expires'] ?? 0);
    if (!empty($token) && $token === $stored && time() <= $expires) {
        return true;
    }
    // Fallback: legacy X-Admin-Password (used by admin/index.php)
    $pwd = $_SERVER['HTTP_X_ADMIN_PASSWORD']
        ?? $_POST['admin_password']
        ?? (json_decode(file_get_contents('php://input'), true)['admin_password'] ?? '');
    return $pwd === ($cfg['admin_password'] ?? 'admin123');
}

// ── GET ───────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['admin'])) {
        if (!isAdminAuthed($config)) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        // Return all non-secret settings for admin panel
        $safe = [
            'gemini_model'          => $config['gemini_model']         ?? 'gemini-2.0-flash',
            'graph_tenant_id'       => $config['graph_tenant_id']      ?? '',
            'graph_client_id'       => $config['graph_client_id']      ?? '',
            'graph_from_email'      => $config['graph_from_email']     ?? '',
            'graph_from_name'       => $config['graph_from_name']      ?? 'VCL AI Assessment',
            'webhook_url'           => $config['webhook_url']          ?? '',
            'delivery_webhook_url'  => $config['delivery_webhook_url'] ?? '',
            'whatsapp_enabled'      => $config['whatsapp_enabled']     ?? 'true',
            'db_host'               => $config['db_host']              ?? 'localhost',
            'db_name'               => $config['db_name']              ?? '',
            'db_user'               => $config['db_user']              ?? '',
        ];
        // Mask secrets
        if (!empty($config['gemini_api_key'])) {
            $safe['gemini_api_key'] = '****' . substr($config['gemini_api_key'], -4);
        } else {
            $safe['gemini_api_key'] = '';
        }
        if (!empty($config['graph_client_secret'])) {
            $safe['graph_client_secret'] = '••••••••';
        } else {
            $safe['graph_client_secret'] = '';
        }
        if (!empty($config['db_pass'])) {
            $safe['db_pass'] = '••••••••';
        } else {
            $safe['db_pass'] = '';
        }
        echo json_encode(['success' => true, 'settings' => $safe]);
    } else {
        // Public endpoint — only exposes the keys the React app needs at runtime
        echo json_encode([
            'webhook_url'          => $config['webhook_url']          ?? '',
            'delivery_webhook_url' => $config['delivery_webhook_url'] ?? '',
            'whatsapp_enabled'     => $config['whatsapp_enabled']     ?? 'true',
        ]);
    }
    exit;
}

// ── POST ──────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isAdminAuthed($config)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $input   = json_decode(file_get_contents('php://input'), true) ?? [];
    $updates = $input['settings'] ?? $input;

    $allowed = [
        // AI
        'gemini_api_key', 'gemini_model',
        // Email
        'graph_tenant_id', 'graph_client_id', 'graph_client_secret',
        'graph_from_email', 'graph_from_name',
        // Webhooks / feature flags
        'webhook_url', 'delivery_webhook_url', 'whatsapp_enabled',
        // Database
        'db_host', 'db_name', 'db_user', 'db_pass',
        // Security
        'admin_password',
    ];

    foreach ($allowed as $key) {
        if (!array_key_exists($key, $updates)) continue;
        // Don't overwrite masked values
        if ($key === 'gemini_api_key'      && str_starts_with($updates[$key], '****'))    continue;
        if ($key === 'graph_client_secret' && $updates[$key] === '••••••••')              continue;
        if ($key === 'db_pass'             && $updates[$key] === '••••••••')              continue;
        $config[$key] = $updates[$key];
    }

    saveCfg($configPath, $config);
    echo json_encode(['success' => true, 'message' => 'Settings saved']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
