<?php
/**
 * POST /api/auth/login.php
 * Body: { "password": "..." }
 * Returns: { "token": "...", "expires": 1234567890 }
 */

require_once __DIR__ . '/../helpers.php';

setCorsHeaders();
handlePreflight();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body     = jsonBody();
$password = $body['password'] ?? '';
$config   = loadConfig();
$expected = $config['admin_password'] ?? 'admin123';

if (empty($password) || $password !== $expected) {
    jsonError('Invalid password', 401);
}

// Generate token valid for 24 hours
$token   = bin2hex(random_bytes(32));
$expires = time() + 86400;

$config['admin_token']         = $token;
$config['admin_token_expires'] = $expires;
saveConfig($config);

echo json_encode(['token' => $token, 'expires' => $expires]);
