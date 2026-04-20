<?php
/**
 * POST /api/participants.php       — create participant, returns { id }
 * PATCH /api/participants.php?id=  — update contact info (name, email, phone, consent)
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

setCorsHeaders();
handlePreflight();

$method = $_SERVER['REQUEST_METHOD'];

// ── POST: create ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body   = jsonBody();
    $domain = trim($body['domain'] ?? '');

    if (empty($domain)) {
        jsonError('domain is required');
    }

    $id  = generateUuid();
    $db  = getDb();
    $sql = "INSERT INTO participants (id, domain, original_website) VALUES (:id, :domain, :ow)";
    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':id'     => $id,
        ':domain' => $domain,
        ':ow'     => $body['original_website'] ?? null,
    ]);

    echo json_encode(['id' => $id]);
    exit;
}

// ── PATCH: update contact ─────────────────────────────────────────────────────
if ($method === 'PATCH') {
    $id = trim($_GET['id'] ?? '');
    if (empty($id)) {
        jsonError('id query param is required');
    }

    $body = jsonBody();
    $db   = getDb();

    $fields = [];
    $params = [':id' => $id];

    if (array_key_exists('full_name', $body)) {
        $fields[] = 'full_name = :full_name';
        $params[':full_name'] = $body['full_name'];
    }
    if (array_key_exists('email', $body)) {
        $fields[] = 'email = :email';
        $params[':email'] = $body['email'];
    }
    if (array_key_exists('phone_number', $body)) {
        $fields[] = 'phone_number = :phone';
        $params[':phone'] = $body['phone_number'];
    }
    if (array_key_exists('consent_to_contact', $body)) {
        $fields[] = 'consent_to_contact = :consent';
        $params[':consent'] = $body['consent_to_contact'] ? 1 : 0;
    }

    if (empty($fields)) {
        echo json_encode(['success' => true]);
        exit;
    }

    $stmt = $db->prepare("UPDATE participants SET " . implode(', ', $fields) . " WHERE id = :id");
    $stmt->execute($params);

    echo json_encode(['success' => true]);
    exit;
}

jsonError('Method not allowed', 405);
