<?php
/**
 * GET /api/dimensions.php
 * Returns all active dimensions with their questions and options.
 * Public — no authentication required.
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

setCorsHeaders();
handlePreflight();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

try {
    $db = getDb();

    $dimensions = $db->query(
        "SELECT id, dimension_key, title, short_title, description, display_order
         FROM dimensions
         ORDER BY display_order ASC"
    )->fetchAll();

    $questions = $db->query(
        "SELECT id, dimension_id, question_key, text, display_order, is_active, question_type, tags
         FROM questions
         WHERE is_active = 1
         ORDER BY display_order ASC"
    )->fetchAll();

    $options = $db->query(
        "SELECT id, question_id, label, grade, display_order
         FROM question_options
         ORDER BY display_order ASC"
    )->fetchAll();

    // Index options by question_id
    $optionsByQuestion = [];
    foreach ($options as $opt) {
        $opt['grade'] = (float)$opt['grade'];
        $optionsByQuestion[$opt['question_id']][] = $opt;
    }

    // Attach questions to dimensions
    $questionsByDimension = [];
    foreach ($questions as $q) {
        $q['is_active']     = (bool)$q['is_active'];
        $q['tags']          = json_decode($q['tags'] ?? '[]', true) ?: [];
        $q['options']       = $optionsByQuestion[$q['id']] ?? [];
        $questionsByDimension[$q['dimension_id']][] = $q;
    }

    foreach ($dimensions as &$dim) {
        $dim['questions'] = $questionsByDimension[$dim['id']] ?? [];
    }
    unset($dim);

    echo json_encode($dimensions, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
}
