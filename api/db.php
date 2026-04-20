<?php
/**
 * MySQL PDO connection — call getDb() to get a shared PDO instance.
 */

require_once __DIR__ . '/helpers.php';

function getDb(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $config = loadConfig();
    $host   = $config['db_host'] ?? 'localhost';
    $dbname = $config['db_name'] ?? '';
    $user   = $config['db_user'] ?? '';
    $pass   = $config['db_pass'] ?? '';

    if (empty($dbname)) {
        http_response_code(500);
        echo json_encode(['error' => 'Database not configured. Set db_host, db_name, db_user, db_pass in admin settings.']);
        exit;
    }

    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    return $pdo;
}
