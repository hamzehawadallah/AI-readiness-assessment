<?php
/**
 * AI Analysis Endpoint
 * Replaces the n8n AI workflow webhook.
 * Receives assessment data, calls Gemini API, returns structured AI analysis.
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Load config ─────────────────────────────────────────────────────────────
$configPath = __DIR__ . '/config.json';
if (!file_exists($configPath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Configuration file not found. Please set up the admin panel.']);
    exit;
}
$config = json_decode(file_get_contents($configPath), true);
$geminiApiKey = trim($config['gemini_api_key'] ?? '');
$geminiModel  = trim($config['gemini_model']  ?? 'gemini-2.5-flash');

if (empty($geminiApiKey)) {
    http_response_code(400);
    echo json_encode(['error' => 'Gemini API key not configured. Please set it in /admin/']);
    exit;
}

// ── Parse input ─────────────────────────────────────────────────────────────
$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);

// n8n sends {body:{...}} — handle both wrapped and unwrapped
$body = isset($input['body']) ? $input['body'] : $input;

if (!isset($body['participant']) || !isset($body['scores']) || !isset($body['questions'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: participant, scores, questions']);
    exit;
}

$participant = $body['participant'];
$scores      = $body['scores'];
$questions   = is_array($body['questions']) ? $body['questions'] : [];

if (empty($questions)) {
    http_response_code(400);
    echo json_encode(['error' => 'questions array cannot be empty']);
    exit;
}

// ── Prepare data (mirrors n8n "Code in JavaScript" node) ────────────────────
$prepared = [
    'participant' => [
        'domain'          => $participant['domain']          ?? 'N/A',
        'originalWebsite' => $participant['originalWebsite'] ?? 'N/A',
    ],
    'participantContext' => [
        'department' => $participant['department'] ?? 'Unspecified',
    ],
    'scores' => [
        'overallPercent' => $scores['overallPercent'] ?? $scores['overall'] ?? 0,
        'levelNumber'    => $scores['levelNumber'] ?? 0,
        'levelLabel'     => $scores['levelLabel']  ?? '',
        'dimensions'     => $scores['dimensions']  ?? $scores['dimensionScores'] ?? [],
        'tags'           => $scores['tags']         ?? $scores['tagScores']       ?? [],
    ],
    'questionEvidence' => array_map(function ($q) {
        return [
            'questionKey'    => $q['questionKey']    ?? null,
            'dimensionKey'   => $q['dimensionKey']   ?? null,
            'dimensionTitle' => $q['dimensionTitle'] ?? null,
            'tags'           => $q['tags']           ?? [],
            'answerGrade'    => $q['answerGrade']    ?? null,
            'answerLabel'    => $q['answerLabel']    ?? null,
            'questionText'   => $q['questionText']   ?? null,
        ];
    }, $questions),
];

$dimensionCount = count($prepared['scores']['dimensions']);

// ── System message (exact replica from n8n) ──────────────────────────────────
$systemMessage = <<<SYS
You are an AI Capability & Workforce Readiness Consultant at VCL.

This assessment measures AI capability at the INDIVIDUAL role level.
The participantContext.department (if provided) is critical and must shape the interpretation and recommendations.

You must use BOTH:
- quantitative signals (scores, levels, gaps)
- qualitative evidence (patterns in questionEvidence answer selections)

Hard rules:
- Do NOT write a company profile.
- Do NOT claim results represent the whole organisation.
- Do NOT include sources, URLs, citations, or bracketed notes.
- Do NOT change any numeric values.
- Output ONE valid JSON object only, starting with { and ending with }.
- Readiness and willingness are assessment-level indicators only (never per-dimension).
- Consultant tone: precise, evidence-based, individual-focused.
SYS;

// ── Output JSON schema ───────────────────────────────────────────────────────
$outputSchema = '{
  "summary": "",
  "level": {
    "number": 0,
    "label": "",
    "explanation": ""
  },
  "readinessWillingness": {
    "readinessScorePercent": 0,
    "willingnessScorePercent": 0,
    "gapPercent": 0,
    "diagnosis": ""
  },
  "dimensionInsights": [
    {
      "dimensionKey": "",
      "dimensionTitle": "",
      "scorePercent": 0,
      "strengthOrGap": "",
      "insight": "",
      "evidenceSignals": ["", ""]
    }
  ],
  "tagInsights": [
    {
      "tag": "",
      "scorePercent": 0,
      "strengthOrGap": "",
      "insight": ""
    }
  ],
  "recommendations": {
    "next90Days": [],
    "next12Months": []
  },
  "vclPositioning": {
    "howVCLCanHelp": "",
    "suggestedCallToAction": ""
  }
}';

// ── User prompt (exact replica from n8n) ─────────────────────────────────────
$preparedJson = json_encode($prepared, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$userPrompt = <<<PROMPT
INPUT ASSESSMENT DATA (DO NOT ALTER NUMBERS):
{$preparedJson}

ADDRESSING STYLE:
Write as if speaking directly to the individual who submitted the assessment.

DEPARTMENT USE:
Use participantContext.department to tailor:
- what "strong" or "weak" means for the role
- the risks/opportunities implied by the gaps
- the recommendations (executive-appropriate if department is Executive / C-Suite)

EVIDENCE REQUIREMENT:
For each insight (summary, readinessWillingness diagnosis, each dimension insight):
- You must reference evidence patterns from questionEvidence such as:
  - comfort with accountability and disclosure
  - tendency to validate AI outputs vs accept them
  - willingness to redesign work vs only use AI as a helper
  - approach to ambiguity and trade-offs
Do NOT quote questions verbatim. Do NOT list answers. Synthesize evidence into 1–2 short signals per insight.

ORG CONTEXT RULE (LIMITED):
You may use web search ONLY to infer the industry context of the domain, and ONLY to sense-check expectations.
Do NOT describe the organisation or its services.
If irrelevant or unclear, discard it.

READINESS/WILLINGNESS RULE:
These are assessment-level only.
Use scores.tags:
- readinessScorePercent = tag=readiness scorePercent
- willingnessScorePercent = tag=willingness scorePercent
- gapPercent = readinessScorePercent - willingnessScorePercent (use the provided numbers)

OUTPUT JSON ONLY in this exact schema:

{$outputSchema}

CONSTRAINTS:
- summary: 4–6 sentences, executive tone, evidence-based.
- level.explanation: 2–3 sentences.
- dimensionInsights: exactly {$dimensionCount} items, one per dimension, use exact scorePercent from input.
- strengthOrGap: "Strength" if scorePercent >= 70 else "Gap".
- evidenceSignals: exactly 2 short signals per dimension (derived from questionEvidence).
- tagInsights: exactly 2 items (readiness and willingness).
- recommendations:
  - next90Days: 3–5 actions appropriate for participantContext.department (executive actions if C-Suite)
  - next12Months: 3–5 actions tied to role evolution and operating model change
- No URLs, citations, org descriptions, or markdown.
PROMPT;

// ── Call Gemini API ───────────────────────────────────────────────────────────
$geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$geminiModel}:generateContent?key={$geminiApiKey}";

$requestPayload = json_encode([
    'system_instruction' => [
        'parts' => [['text' => $systemMessage]],
    ],
    'contents' => [
        ['parts' => [['text' => $userPrompt]]],
    ],
    'generationConfig' => [
        'temperature'      => 0.3,
        'responseMimeType' => 'application/json',
    ],
], JSON_UNESCAPED_UNICODE);

$ch = curl_init($geminiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $requestPayload,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 120,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$geminiResponse = curl_exec($ch);
$httpCode       = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError      = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to reach Gemini API: ' . $curlError]);
    exit;
}

if ($httpCode !== 200) {
    $errData = json_decode($geminiResponse, true);
    http_response_code(400);
    echo json_encode([
        'error' => 'Gemini API returned error ' . $httpCode . ': '
                 . ($errData['error']['message'] ?? $geminiResponse),
    ]);
    exit;
}

$geminiData = json_decode($geminiResponse, true);
$rawText    = $geminiData['candidates'][0]['content']['parts'][0]['text'] ?? '';

if (empty($rawText)) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty response from Gemini API']);
    exit;
}

// ── Parse & clean JSON (mirrors n8n "Code in JavaScript1" node) ──────────────
$txt = trim($rawText);
$txt = preg_replace('/^```json\s*/i', '', $txt);
$txt = preg_replace('/^```\s*/i', '',  $txt);
$txt = preg_replace('/```$/i',    '', $txt);
$txt = trim($txt);

$start = strpos($txt, '{');
$end   = strrpos($txt, '}');

if ($start === false || $end === false || $end <= $start) {
    http_response_code(400);
    echo json_encode(['error' => 'Could not find JSON object in Gemini response']);
    exit;
}

$candidate = substr($txt, $start, $end - $start + 1);
// Normalise common JSON flaws
$candidate = preg_replace('/,\s*([}\]])/', '$1', $candidate); // trailing commas
$candidate = trim($candidate);

$parsed = json_decode($candidate, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON parse failed: ' . json_last_error_msg()]);
    exit;
}

// ── Validate structure ───────────────────────────────────────────────────────
$errors = [];
if (!is_string($parsed['summary']              ?? null)) $errors[] = 'summary must be a string';
if (!is_array( $parsed['level']                ?? null)) $errors[] = 'level must be an object';
if (!is_array( $parsed['readinessWillingness'] ?? null)) $errors[] = 'readinessWillingness must be an object';
if (!is_array( $parsed['dimensionInsights']    ?? null)) $errors[] = 'dimensionInsights must be an array';
if (!is_array( $parsed['tagInsights']          ?? null)) $errors[] = 'tagInsights must be an array';
if (!is_array( $parsed['recommendations']      ?? null)) $errors[] = 'recommendations must be an object';
if (!is_array( $parsed['vclPositioning']       ?? null)) $errors[] = 'vclPositioning must be an object';
if (count($parsed['dimensionInsights'] ?? []) !== $dimensionCount) $errors[] = "dimensionInsights must have exactly {$dimensionCount} items";
if (count($parsed['tagInsights']       ?? []) !== 2)     $errors[] = 'tagInsights must have exactly 2 items';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['error' => 'Validation failed: ' . implode('; ', $errors)]);
    exit;
}

// ── Return result (frontend handles both array and plain object) ──────────────
echo json_encode($parsed, JSON_UNESCAPED_UNICODE);
