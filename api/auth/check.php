<?php
/**
 * GET /api/auth/check.php
 * Header: X-Admin-Token: <token>
 * Returns: { "valid": true } or 401
 */

require_once __DIR__ . '/../helpers.php';

setCorsHeaders();
handlePreflight();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

$config  = loadConfig();
$token   = trim($_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '');
$stored  = $config['admin_token'] ?? '';
$expires = (int)($config['admin_token_expires'] ?? 0);

if (empty($token) || $token !== $stored || time() > $expires) {
    jsonError('Token invalid or expired', 401);
}

echo json_encode(['valid' => true]);
