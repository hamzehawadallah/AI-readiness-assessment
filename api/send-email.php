<?php
/**
 * Email Delivery Endpoint — Microsoft Graph API
 * Replaces the n8n "export and send" webhook.
 * Sends assessment results via Microsoft Graph API (Office 365). No SMTP.
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

// ── Load config ──────────────────────────────────────────────────────────────
$configPath = __DIR__ . '/config.json';
if (!file_exists($configPath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Configuration file not found']);
    exit;
}
$config = json_decode(file_get_contents($configPath), true);

// ── Parse input ──────────────────────────────────────────────────────────────
$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);
$body  = isset($input['body']) ? $input['body'] : $input;

$email     = trim($body['email']    ?? '');
$emailHtml = $body['emailhtml']     ?? $body['emailHtml'] ?? '';
$fullName  = $body['fullName']      ?? $body['full_name'] ?? '';
$domain    = $body['participant']['domain'] ?? $body['domain'] ?? 'Assessment';

// If no email provided (e.g. WhatsApp channel — removed), skip gracefully
if (empty($email)) {
    echo json_encode(['success' => true, 'message' => 'No email address provided — skipped']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address: ' . $email]);
    exit;
}

// ── Microsoft Graph API settings ─────────────────────────────────────────────
$tenantId     = trim($config['graph_tenant_id']     ?? '');
$clientId     = trim($config['graph_client_id']     ?? '');
$clientSecret = trim($config['graph_client_secret'] ?? '');
$fromEmail    = trim($config['graph_from_email']    ?? '');
$fromName     = trim($config['graph_from_name']     ?? 'VCL AI Assessment');

if (empty($tenantId) || empty($clientId) || empty($clientSecret) || empty($fromEmail)) {
    http_response_code(400);
    echo json_encode(['error' => 'Microsoft Graph API not configured. Please set it up in /admin/']);
    exit;
}

// ── Build email content ───────────────────────────────────────────────────────
$subject  = 'VCL AI Assessment Results | ' . $domain;
$htmlBody = $emailHtml ?: buildFallbackHtml($fullName, $domain);

// ── Step 1: Get OAuth2 access token ──────────────────────────────────────────
$tokenUrl  = "https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token";
$tokenData = http_build_query([
    'grant_type'    => 'client_credentials',
    'client_id'     => $clientId,
    'client_secret' => $clientSecret,
    'scope'         => 'https://graph.microsoft.com/.default',
]);

$ch = curl_init($tokenUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $tokenData,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$tokenResponse = curl_exec($ch);
$tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$tokenCurlErr  = curl_error($ch);
curl_close($ch);

if ($tokenCurlErr) {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to reach Microsoft login: ' . $tokenCurlErr]);
    exit;
}

$tokenJson = json_decode($tokenResponse, true);

if ($tokenHttpCode !== 200 || empty($tokenJson['access_token'])) {
    http_response_code(400);
    $errDesc = $tokenJson['error_description'] ?? $tokenJson['error'] ?? $tokenResponse;
    echo json_encode(['error' => 'Failed to obtain access token: ' . $errDesc]);
    exit;
}

$accessToken = $tokenJson['access_token'];

// ── Step 2: Send email via Graph API ──────────────────────────────────────────
$sendMailUrl = "https://graph.microsoft.com/v1.0/users/" . urlencode($fromEmail) . "/sendMail";

$mailPayload = json_encode([
    'message' => [
        'subject' => $subject,
        'body'    => [
            'contentType' => 'HTML',
            'content'     => $htmlBody,
        ],
        'from' => [
            'emailAddress' => [
                'address' => $fromEmail,
                'name'    => $fromName,
            ],
        ],
        'toRecipients' => [
            [
                'emailAddress' => [
                    'address' => $email,
                    'name'    => $fullName ?: $email,
                ],
            ],
        ],
    ],
    'saveToSentItems' => true,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init($sendMailUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $mailPayload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json',
    ],
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$sendResponse = curl_exec($ch);
$sendHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$sendCurlErr  = curl_error($ch);
curl_close($ch);

if ($sendCurlErr) {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to reach Microsoft Graph API: ' . $sendCurlErr]);
    exit;
}

// Graph API returns 202 Accepted on success (no body)
if ($sendHttpCode === 202) {
    echo json_encode(['success' => true, 'message' => 'Email sent to ' . $email]);
    exit;
}

// Handle error
$sendJson = json_decode($sendResponse, true);
$errMsg   = $sendJson['error']['message'] ?? ('HTTP ' . $sendHttpCode . ': ' . $sendResponse);
http_response_code(400);
echo json_encode(['error' => 'Graph API send failed: ' . $errMsg]);

// ── Fallback HTML ─────────────────────────────────────────────────────────────
function buildFallbackHtml(string $name, string $domain): string {
    $n = htmlspecialchars($name ?: 'there');
    $d = htmlspecialchars($domain);
    return "<!DOCTYPE html><html><body style='font-family:sans-serif;color:#333;padding:32px;max-width:600px;margin:0 auto'>
        <h2 style='color:#CE2823'>VCL AI Assessment Results</h2>
        <p>Hi {$n},</p>
        <p>Thank you for completing the AI Readiness Assessment for <strong>{$d}</strong>.</p>
        <p>Your personalised results have been processed. Please contact us if you need any assistance.</p>
        <p style='margin-top:32px'>Best regards,<br><strong>The VCL Team</strong></p>
    </body></html>";
}
