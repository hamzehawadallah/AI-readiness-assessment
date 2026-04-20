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

// Ensure directories exist
if (!is_dir($uploadsRoot)) mkdir($uploadsRoot, 0755, true);
if (!is_dir($reportsDir))  mkdir($reportsDir,  0755, true);

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: check logo ───────────────────────────────────────────────────────────
if ($method === 'GET') {
    $logoPath = $uploadsRoot . '/email-logo.png';
    $exists   = file_exists($logoPath);
    echo json_encode([
        'exists' => $exists,
        'url'    => $exists ? $baseUrl . '/email-logo.png' : null,
    ]);
    exit;
}

// ── POST: upload ──────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $type = $_POST['type'] ?? 'report'; // 'report' | 'logo'

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        jsonError('No valid file uploaded');
    }

    $file     = $_FILES['file'];
    $maxBytes = 10 * 1024 * 1024; // 10 MB

    if ($file['size'] > $maxBytes) {
        jsonError('File too large (max 10 MB)');
    }

    if ($type === 'logo') {
        // Validate image
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

    // type === 'report' (PDF)
    if ($file['type'] !== 'application/pdf') {
        jsonError('Invalid file type. Expected PDF.');
    }

    $filename = ($_POST['filename'] ?? generateUuid()) . '.pdf';
    $filename = basename($filename); // safety: no path traversal
    $dest     = $reportsDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        jsonError('Failed to save PDF', 500);
    }

    echo json_encode([
        'success'  => true,
        'url'      => $baseUrl . '/reports/' . $filename,
        'filename' => $filename,
    ]);
    exit;
}

jsonError('Method not allowed', 405);

function generateUuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));
}
