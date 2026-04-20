<?php
/**
 * Email Delivery Endpoint
 * Replaces the n8n "export and send" webhook.
 * Sends assessment results via SMTP email. WhatsApp removed.
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
    http_response_code(500);
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

// If no email provided, nothing to do (WhatsApp removed)
if (empty($email)) {
    echo json_encode(['success' => true, 'message' => 'No email address provided — skipped']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address: ' . $email]);
    exit;
}

// ── SMTP settings ────────────────────────────────────────────────────────────
$smtpHost       = trim($config['smtp_host']       ?? '');
$smtpPort       = intval($config['smtp_port']      ?? 587);
$smtpEncryption = strtolower(trim($config['smtp_encryption'] ?? 'tls'));
$smtpUsername   = trim($config['smtp_username']   ?? '');
$smtpPassword   = $config['smtp_password']         ?? '';
$fromEmail      = trim($config['smtp_from_email'] ?? 'noreply@vcl.solutions');
$fromName       = trim($config['smtp_from_name']  ?? 'VCL AI Assessment');

if (empty($smtpHost)) {
    http_response_code(500);
    echo json_encode(['error' => 'SMTP not configured. Please set it up in /admin/']);
    exit;
}

// ── Build subject ────────────────────────────────────────────────────────────
$subject = 'VCL AI Assessment Results | ' . $domain;

// ── Send email via SMTP ───────────────────────────────────────────────────────
try {
    $mailer = new SimpleSMTP($smtpHost, $smtpPort, $smtpEncryption, $smtpUsername, $smtpPassword, $fromEmail, $fromName);
    $mailer->send($email, $subject, $emailHtml ?: buildFallbackHtml($fullName, $domain));
    echo json_encode(['success' => true, 'message' => 'Email sent to ' . $email]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email: ' . $e->getMessage()]);
}

// ── Fallback HTML if no emailhtml provided ───────────────────────────────────
function buildFallbackHtml(string $name, string $domain): string {
    $n = htmlspecialchars($name ?: 'there');
    $d = htmlspecialchars($domain);
    return "<html><body style='font-family:sans-serif;color:#333;padding:32px'>
        <h2>VCL AI Assessment Results</h2>
        <p>Hi {$n},</p>
        <p>Thank you for completing the AI Readiness Assessment for <strong>{$d}</strong>.</p>
        <p>Your results have been processed. Please contact us if you did not receive them.</p>
        <p>Best regards,<br>The VCL Team</p>
    </body></html>";
}

// ── Minimal SMTP client (no external libraries needed) ───────────────────────
class SimpleSMTP {
    private string $host;
    private int    $port;
    private string $encryption;
    private string $username;
    private string $password;
    private string $fromEmail;
    private string $fromName;
    /** @var resource */
    private $conn;

    public function __construct(
        string $host, int $port, string $encryption,
        string $username, string $password,
        string $fromEmail, string $fromName
    ) {
        $this->host       = $host;
        $this->port       = $port;
        $this->encryption = $encryption; // 'ssl' | 'tls' | 'none'
        $this->username   = $username;
        $this->password   = $password;
        $this->fromEmail  = $fromEmail;
        $this->fromName   = $fromName;
    }

    public function send(string $toEmail, string $subject, string $htmlBody): void {
        $prefix = ($this->encryption === 'ssl') ? 'ssl://' : '';
        $errno  = 0;
        $errstr = '';

        $this->conn = @fsockopen($prefix . $this->host, $this->port, $errno, $errstr, 30);
        if (!$this->conn) {
            throw new Exception("SMTP connection failed ({$errno}): {$errstr}");
        }

        stream_set_timeout($this->conn, 30);

        $this->read(); // greeting

        $this->cmd("EHLO " . (gethostname() ?: 'localhost'));

        // STARTTLS for port 587
        if ($this->encryption === 'tls') {
            $this->cmd("STARTTLS");
            if (!stream_socket_enable_crypto($this->conn, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new Exception("STARTTLS negotiation failed");
            }
            $this->cmd("EHLO " . (gethostname() ?: 'localhost'));
        }

        // AUTH LOGIN
        if (!empty($this->username)) {
            $this->cmd("AUTH LOGIN");
            $this->cmd(base64_encode($this->username));
            $resp = $this->cmd(base64_encode($this->password));
            if (substr($resp, 0, 3) !== '235') {
                throw new Exception("SMTP authentication failed: {$resp}");
            }
        }

        $this->cmd("MAIL FROM:<{$this->fromEmail}>");
        $resp = $this->cmd("RCPT TO:<{$toEmail}>");
        if (substr($resp, 0, 3) !== '250') {
            throw new Exception("RCPT TO rejected: {$resp}");
        }

        $this->cmd("DATA");

        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $fromHeader     = $this->fromName
            ? '"' . addslashes($this->fromName) . '" <' . $this->fromEmail . '>'
            : $this->fromEmail;

        $message  = "From: {$fromHeader}\r\n";
        $message .= "To: {$toEmail}\r\n";
        $message .= "Subject: {$encodedSubject}\r\n";
        $message .= "MIME-Version: 1.0\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n";
        $message .= "Date: " . date('r') . "\r\n";
        $message .= "X-Mailer: VCL-AI-Assessment/1.0\r\n";
        $message .= "\r\n";
        $message .= chunk_split(base64_encode($htmlBody));
        $message .= "\r\n.";

        fputs($this->conn, $message . "\r\n");
        $this->read();

        $this->cmd("QUIT");
        fclose($this->conn);
    }

    private function cmd(string $cmd): string {
        fputs($this->conn, $cmd . "\r\n");
        return $this->read();
    }

    private function read(): string {
        $response = '';
        while ($line = fgets($this->conn, 515)) {
            $response .= $line;
            // A line not ending with '-' after the code means end of response
            if (substr($line, 3, 1) === ' ') break;
        }
        return trim($response);
    }
}
