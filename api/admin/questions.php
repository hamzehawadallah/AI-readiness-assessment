<?php
/**
 * Admin CRUD for dimensions, questions, and question_options.
 * All requests require X-Admin-Token header.
 *
 * GET    /api/admin/questions.php               — full tree (same as public but includes inactive)
 * POST   /api/admin/questions.php               — create dimension | question | option  (body.type)
 * PATCH  /api/admin/questions.php?id=&type=     — update dimension | question | option
 * DELETE /api/admin/questions.php?id=&type=     — delete dimension | question | option
 */

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db.php';

setCorsHeaders();
handlePreflight();
requireAdminAuth();

$method = $_SERVER['REQUEST_METHOD'];
$type   = $_GET['type'] ?? ($_POST['type'] ?? (jsonBody()['type'] ?? ''));
$id     = $_GET['id']   ?? null;

// ── GET: full tree ────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $db = getDb();

    $dimensions = $db->query("SELECT * FROM dimensions ORDER BY display_order")->fetchAll();
    $questions  = $db->query("SELECT * FROM questions  ORDER BY display_order")->fetchAll();
    $options    = $db->query("SELECT * FROM question_options ORDER BY display_order")->fetchAll();

    $optsByQ = [];
    foreach ($options as $o) {
        $o['grade'] = (float)$o['grade'];
        $optsByQ[$o['question_id']][] = $o;
    }

    $qByDim = [];
    foreach ($questions as $q) {
        $q['is_active'] = (bool)$q['is_active'];
        $q['tags']      = json_decode($q['tags'] ?? '[]', true) ?: [];
        $q['options']   = $optsByQ[$q['id']] ?? [];
        $qByDim[$q['dimension_id']][] = $q;
    }

    foreach ($dimensions as &$d) {
        $d['questions'] = $qByDim[$d['id']] ?? [];
    }

    echo json_encode($dimensions, JSON_UNESCAPED_UNICODE);
    exit;
}

// ── POST: create ──────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = jsonBody();
    $type = $body['type'] ?? '';
    $db   = getDb();
    $newId = generateUuid();

    if ($type === 'dimension') {
        $stmt = $db->prepare(
            "INSERT INTO dimensions (id, dimension_key, title, short_title, description, display_order)
             VALUES (:id, :key, :title, :short, :desc, :ord)"
        );
        $stmt->execute([
            ':id'    => $newId,
            ':key'   => $body['dimension_key'],
            ':title' => $body['title'],
            ':short' => $body['short_title'],
            ':desc'  => $body['description'],
            ':ord'   => $body['display_order'] ?? 0,
        ]);
        echo json_encode(['id' => $newId]);
        exit;
    }

    if ($type === 'question') {
        $stmt = $db->prepare(
            "INSERT INTO questions (id, dimension_id, question_key, text, display_order, is_active, question_type, tags)
             VALUES (:id, :dim, :key, :text, :ord, :active, :qtype, :tags)"
        );
        $stmt->execute([
            ':id'     => $newId,
            ':dim'    => $body['dimension_id'],
            ':key'    => $body['question_key'],
            ':text'   => $body['text'],
            ':ord'    => $body['display_order'] ?? 0,
            ':active' => isset($body['is_active']) ? ($body['is_active'] ? 1 : 0) : 1,
            ':qtype'  => $body['question_type']  ?? 'rating',
            ':tags'   => json_encode($body['tags'] ?? []),
        ]);
        echo json_encode(['id' => $newId]);
        exit;
    }

    if ($type === 'option') {
        $stmt = $db->prepare(
            "INSERT INTO question_options (id, question_id, label, grade, display_order)
             VALUES (:id, :qid, :label, :grade, :ord)"
        );
        $stmt->execute([
            ':id'    => $newId,
            ':qid'   => $body['question_id'],
            ':label' => $body['label'],
            ':grade' => $body['grade'] ?? 0,
            ':ord'   => $body['display_order'] ?? 0,
        ]);
        echo json_encode(['id' => $newId]);
        exit;
    }

    jsonError('Unknown type: ' . $type);
}

// ── PATCH: update ─────────────────────────────────────────────────────────────
if ($method === 'PATCH') {
    if (!$id) jsonError('id is required');
    $body = jsonBody();
    $type = $body['type'] ?? $type;
    $db   = getDb();

    if ($type === 'dimension') {
        $allowed = ['dimension_key', 'title', 'short_title', 'description', 'display_order'];
        $fields  = [];
        $params  = [':id' => $id];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) {
                $fields[] = "$f = :$f";
                $params[":$f"] = $body[$f];
            }
        }
        if ($fields) {
            $db->prepare("UPDATE dimensions SET " . implode(', ', $fields) . " WHERE id = :id")->execute($params);
        }
        echo json_encode(['success' => true]);
        exit;
    }

    if ($type === 'question') {
        $allowed = ['dimension_id', 'question_key', 'text', 'display_order', 'is_active', 'question_type', 'tags'];
        $fields  = [];
        $params  = [':id' => $id];
        foreach ($allowed as $f) {
            if (!array_key_exists($f, $body)) continue;
            if ($f === 'is_active') {
                $fields[] = "is_active = :is_active";
                $params[':is_active'] = $body['is_active'] ? 1 : 0;
            } elseif ($f === 'tags') {
                $fields[] = "tags = :tags";
                $params[':tags'] = json_encode($body['tags']);
            } else {
                $fields[] = "$f = :$f";
                $params[":$f"] = $body[$f];
            }
        }
        if ($fields) {
            $db->prepare("UPDATE questions SET " . implode(', ', $fields) . " WHERE id = :id")->execute($params);
        }
        echo json_encode(['success' => true]);
        exit;
    }

    if ($type === 'option') {
        $allowed = ['label', 'grade', 'display_order'];
        $fields  = [];
        $params  = [':id' => $id];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) {
                $fields[] = "$f = :$f";
                $params[":$f"] = $body[$f];
            }
        }
        if ($fields) {
            $db->prepare("UPDATE question_options SET " . implode(', ', $fields) . " WHERE id = :id")->execute($params);
        }
        echo json_encode(['success' => true]);
        exit;
    }

    jsonError('Unknown type: ' . $type);
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) jsonError('id is required');
    $db = getDb();

    $tables = ['dimension' => 'dimensions', 'question' => 'questions', 'option' => 'question_options'];
    if (!isset($tables[$type])) jsonError('Unknown type: ' . $type);

    $db->prepare("DELETE FROM {$tables[$type]} WHERE id = :id")->execute([':id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

jsonError('Method not allowed', 405);
