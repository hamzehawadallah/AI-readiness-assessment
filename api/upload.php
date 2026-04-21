<?php
/**
 * POST /api/upload.php          — upload a PDF (field: "file", type: "report") or logo (type: "logo")
 * GET  /api/upload.php?check=1  — check if email-logo.png exists, returns { exists, url }
 */

require_once __DIR__ . '/helpers.php';

setCorsHeaders();
handlePreflight();

$uploadsRoot  = __DIR__ . '/../uploads';
$reportsDir   = $uploadsRoot . '/reports';
$baseUrl      = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http')
              . '://' . $_SERVER['HTTP_HOST'] . '/uploads';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: check logo (read-only — no directory creation needed) ────────────────
if ($method === 'GET') {
    $logoPath = $uploadsRoot . '/email-logo.png';
    $exists   = file_exists($logoPath);
    echo json_encode([
        'exists' => $exists,
        'url'    => $exists ? $baseUrl . '/email-logo.png' : null,
    ]);
    exit;
}

// ── Ensure upload directories exist (only needed for write operations) ────────
if (!is_dir($uploadsRoot) && !mkdir($uploadsRoot, 0755, true) && !is_dir($uploadsRoot)) {
    jsonError('Could not create uploads directory', 500);
}
if (!is_dir($reportsDir) && !mkdir($reportsDir, 0755, true) && !is_dir($reportsDir)) {
    jsonError('Could not create reports directory', 500);
}

// ── POST: upload ──────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    // ── JSON / base64 path (used by PDF uploads) ──────────────────────────────
    if (strpos($contentType, 'application/json') !== false) {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $type     = $input['type']     ?? 'report';
        $b64      = $input['data']     ?? '';
        $filename = basename($input['filename'] ?? generateUuid()) . '.pdf';

        if (empty($b64)) {
            jsonError('No file data provided');
        }

        $decoded = base64_decode($b64, true);
        if ($decoded === false) {
            jsonError('Invalid base64 data');
        }

        $maxBytes = 10 * 1024 * 1024; // 10 MB
        if (strlen($decoded) > $maxBytes) {
            jsonError('File too large (max 10 MB)');
        }

        $dest = $reportsDir . '/' . $filename;
        if (file_put_contents($dest, $decoded) === false) {
            jsonError('Failed to save PDF — check directory permissions', 500);
        }

        echo json_encode([
            'success'  => true,
            'url'      => $baseUrl . '/reports/' . $filename,
            'filename' => $filename,
        ]);
        exit;
    }

    // ── FormData / multipart path (used by logo uploads) ─────────────────────
    $type = $_POST['type'] ?? 'logo';

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        jsonError('No valid file uploaded');
    }

    $file     = $_FILES['file'];
    $maxBytes = 10 * 1024 * 1024;

    if ($file['size'] > $maxBytes) {
        jsonError('File too large (max 10 MB)');
    }

    // Only logo uploads come through FormData now
    $allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!in_array($file['type'], $allowed)) {
        jsonError('Invalid file type. Allowed: PNG, JPG, GIF, SVG, WEBP');
    }

    $dest = $uploadsRoot . '/email-logo.png';
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        jsonError('Failed to save logo', 500);
    }

    echo json_encode([
        'success' => true,
        'url'     => $baseUrl . '/email-logo.png',
    ]);
    exit;
}

jsonError('Method not allowed', 405);
