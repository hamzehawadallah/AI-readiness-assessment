<?php
/**
 * POST /api/auth/logout.php
 * Clears the stored admin token.
 */

require_once __DIR__ . '/../helpers.php';

setCorsHeaders();
handlePreflight();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$config = loadConfig();
$config['admin_token']         = null;
$config['admin_token_expires'] = 0;
saveConfig($config);

echo json_encode(['success' => true]);
