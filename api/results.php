<?php
/**
 * POST /api/results.php       — create assessment result, returns { id }
 * PATCH /api/results.php?id=  — update pdf_url on an existing result
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

setCorsHeaders();
handlePreflight();

$method = $_SERVER['REQUEST_METHOD'];

// ── POST: create ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = jsonBody();

    $participantId = trim($body['participant_id'] ?? '');
    if (empty($participantId)) {
        jsonError('participant_id is required');
    }

    $id   = generateUuid();
    $db   = getDb();
    $stmt = $db->prepare(
        "INSERT INTO assessment_results
            (id, participant_id, overall_score, level_number, level_label, scores, agent_result, answers)
         VALUES
            (:id, :pid, :score, :lvl_num, :lvl_lbl, :scores, :agent, :answers)"
    );
    $stmt->execute([
        ':id'      => $id,
        ':pid'     => $participantId,
        ':score'   => $body['overall_score']  ?? null,
        ':lvl_num' => $body['level_number']   ?? null,
        ':lvl_lbl' => $body['level_label']    ?? null,
        ':scores'  => isset($body['scores'])       ? json_encode($body['scores'])       : null,
        ':agent'   => isset($body['agent_result'])  ? json_encode($body['agent_result']) : null,
        ':answers' => isset($body['answers'])       ? json_encode($body['answers'])      : null,
    ]);

    echo json_encode(['id' => $id]);
    exit;
}

// ── PATCH: update pdf_url ────────────────────────────────────────────────────
if ($method === 'PATCH') {
    $id = trim($_GET['id'] ?? '');
    if (empty($id)) {
        jsonError('id query param is required');
    }

    $body   = jsonBody();
    $pdfUrl = $body['pdf_url'] ?? null;

    $db   = getDb();
    $stmt = $db->prepare("UPDATE assessment_results SET pdf_url = :url WHERE id = :id");
    $stmt->execute([':url' => $pdfUrl, ':id' => $id]);

    echo json_encode(['success' => true]);
    exit;
}

jsonError('Method not allowed', 405);
