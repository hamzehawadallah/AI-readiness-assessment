<?php
/**
 * Shared helpers for all API endpoints.
 * Include this file at the top of every api/*.php endpoint.
 */

function setCorsHeaders(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
    header('Content-Type: application/json');
}

function handlePreflight(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

function getConfigPath(): string {
    // Walk up from the calling file's directory to find api/config.json
    $dir = __DIR__;
    while ($dir !== dirname($dir)) {
        $candidate = $dir . '/config.json';
        if (file_exists($candidate) && strpos($dir, DIRECTORY_SEPARATOR . 'api') !== false) {
            return $candidate;
        }
        // Also check if this IS the api dir
        $candidate2 = $dir . '/api/config.json';
        if (file_exists($candidate2)) {
            return $candidate2;
        }
        $dir = dirname($dir);
    }
    // Fallback: assume we're one level inside api/
    return __DIR__ . '/../api/config.json';
}

function loadConfig(): array {
    // Resolve config.json relative to the /api/ directory
    $path = dirname(__FILE__) . '/config.json';
    if (!file_exists($path)) {
        // We may be in a sub-directory of api/
        $path = dirname(dirname(__FILE__)) . '/api/config.json';
    }
    if (!file_exists($path)) return [];
    return json_decode(file_get_contents($path), true) ?? [];
}

function saveConfig(array $config): void {
    $path = dirname(__FILE__) . '/config.json';
    if (!file_exists($path)) {
        $path = dirname(dirname(__FILE__)) . '/api/config.json';
    }
    file_put_contents($path, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function requireAdminAuth(): void {
    $config  = loadConfig();
    $token   = trim($_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '');
    $stored  = $config['admin_token'] ?? '';
    $expires = (int)($config['admin_token_expires'] ?? 0);

    if (empty($token) || $token !== $stored || time() > $expires) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}

function generateUuid(): string {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function jsonBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function jsonError(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}
