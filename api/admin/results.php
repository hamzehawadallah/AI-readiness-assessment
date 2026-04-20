<?php
/**
 * GET /api/admin/results.php  — all assessment results with participant join
 * Requires X-Admin-Token header.
 */

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db.php';

setCorsHeaders();
handlePreflight();
requireAdminAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

$db = getDb();

$rows = $db->query(
    "SELECT
        r.id, r.participant_id, r.overall_score, r.level_number, r.level_label,
        r.scores, r.agent_result, r.answers, r.pdf_url, r.created_at,
        p.id          AS p_id,
        p.domain      AS p_domain,
        p.original_website AS p_original_website,
        p.full_name   AS p_full_name,
        p.email       AS p_email,
        p.phone_number AS p_phone_number,
        p.consent_to_contact AS p_consent_to_contact,
        p.created_at  AS p_created_at
     FROM assessment_results r
     LEFT JOIN participants p ON p.id = r.participant_id
     ORDER BY r.created_at DESC"
)->fetchAll();

$results = [];
foreach ($rows as $row) {
    $results[] = [
        'id'             => $row['id'],
        'participant_id' => $row['participant_id'],
        'overall_score'  => $row['overall_score'] !== null ? (float)$row['overall_score'] : null,
        'level_number'   => $row['level_number']  !== null ? (int)$row['level_number']    : null,
        'level_label'    => $row['level_label'],
        'scores'         => $row['scores']       ? json_decode($row['scores'],       true) : null,
        'agent_result'   => $row['agent_result'] ? json_decode($row['agent_result'], true) : null,
        'answers'        => $row['answers']      ? json_decode($row['answers'],      true) : null,
        'pdf_url'        => $row['pdf_url'],
        'created_at'     => $row['created_at'],
        'participants'   => $row['p_id'] ? [
            'id'                 => $row['p_id'],
            'domain'             => $row['p_domain'],
            'original_website'   => $row['p_original_website'],
            'full_name'          => $row['p_full_name'],
            'email'              => $row['p_email'],
            'phone_number'       => $row['p_phone_number'],
            'consent_to_contact' => (bool)$row['p_consent_to_contact'],
            'created_at'         => $row['p_created_at'],
        ] : null,
    ];
}

echo json_encode($results, JSON_UNESCAPED_UNICODE);
