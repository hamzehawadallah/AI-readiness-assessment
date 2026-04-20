<?php
/**
 * VCL AI Assessment — Admin Settings Panel
 * Manage Gemini API key and SMTP email settings.
 * Protected by admin password stored in /api/config.json
 */

session_start();

$configPath = dirname(__DIR__) . '/api/config.json';

function loadConfig(string $path): array {
    if (!file_exists($path)) return [];
    return json_decode(file_get_contents($path), true) ?? [];
}
function saveConfig(string $path, array $data): void {
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$config        = loadConfig($configPath);
$adminPassword = $config['admin_password'] ?? 'admin123';
$isLoggedIn    = isset($_SESSION['admin_auth']) && $_SESSION['admin_auth'] === true;
$message       = '';
$messageType   = 'success';
$activeTab     = $_GET['tab'] ?? 'ai';

// ── Handle login ─────────────────────────────────────────────────────────────
if (isset($_POST['action']) && $_POST['action'] === 'login') {
    if ($_POST['password'] === $adminPassword) {
        $_SESSION['admin_auth'] = true;
        $isLoggedIn = true;
    } else {
        $message     = 'Incorrect password. Please try again.';
        $messageType = 'error';
    }
}

// ── Handle logout ─────────────────────────────────────────────────────────────
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: /admin/');
    exit;
}

// ── Handle settings save ──────────────────────────────────────────────────────
if ($isLoggedIn && isset($_POST['action']) && $_POST['action'] === 'save') {
    $section = $_POST['section'] ?? '';

    if ($section === 'ai') {
        if (!empty($_POST['gemini_api_key'])) $config['gemini_api_key'] = trim($_POST['gemini_api_key']);
        $config['gemini_model'] = trim($_POST['gemini_model'] ?? 'gemini-2.0-flash');
        saveConfig($configPath, $config);
        $message   = 'AI settings saved successfully.';
        $activeTab = 'ai';
    }

    if ($section === 'email') {
        $config['smtp_host']       = trim($_POST['smtp_host']       ?? '');
        $config['smtp_port']       = intval($_POST['smtp_port']     ?? 587);
        $config['smtp_encryption'] = trim($_POST['smtp_encryption'] ?? 'tls');
        $config['smtp_username']   = trim($_POST['smtp_username']   ?? '');
        if (!empty($_POST['smtp_password'])) {
            $config['smtp_password'] = $_POST['smtp_password'];
        }
        $config['smtp_from_email'] = trim($_POST['smtp_from_email'] ?? '');
        $config['smtp_from_name']  = trim($_POST['smtp_from_name']  ?? '');
        saveConfig($configPath, $config);
        $message   = 'Email settings saved successfully.';
        $activeTab = 'email';
    }

    if ($section === 'security') {
        if (!empty($_POST['new_password']) && $_POST['new_password'] === $_POST['confirm_password']) {
            $config['admin_password'] = $_POST['new_password'];
            saveConfig($configPath, $config);
            $message   = 'Admin password updated successfully.';
            $activeTab = 'security';
        } else {
            $message     = 'Passwords do not match or are empty.';
            $messageType = 'error';
            $activeTab   = 'security';
        }
    }

    $config = loadConfig($configPath);
}

// ── Handle test email ─────────────────────────────────────────────────────────
$testResult = '';
if ($isLoggedIn && isset($_POST['action']) && $_POST['action'] === 'test_email') {
    $testTo = trim($_POST['test_email_to'] ?? '');
    if (filter_var($testTo, FILTER_VALIDATE_EMAIL)) {
        try {
            require_once dirname(__DIR__) . '/api/send-email.php';
            // Re-include just the class — we call it directly
            $m = new SimpleSMTP(
                $config['smtp_host'], intval($config['smtp_port']),
                $config['smtp_encryption'] ?? 'tls',
                $config['smtp_username'], $config['smtp_password'],
                $config['smtp_from_email'], $config['smtp_from_name']
            );
            $m->send($testTo, 'VCL Admin — SMTP Test', '<html><body style="font-family:sans-serif;padding:32px"><h2 style="color:#CE2823">✅ SMTP Test Successful</h2><p>This is a test email from the VCL AI Assessment admin panel. Your SMTP configuration is working correctly.</p></body></html>');
            $testResult = 'success:Test email sent to ' . $testTo;
        } catch (Exception $e) {
            $testResult = 'error:' . $e->getMessage();
        }
    } else {
        $testResult = 'error:Please enter a valid email address.';
    }
    $activeTab = 'email';
}

$geminiKey   = $config['gemini_api_key']  ?? '';
$geminiModel = $config['gemini_model']    ?? 'gemini-2.0-flash';
$smtpHost    = $config['smtp_host']       ?? '';
$smtpPort    = $config['smtp_port']       ?? 587;
$smtpEnc     = $config['smtp_encryption'] ?? 'tls';
$smtpUser    = $config['smtp_username']   ?? '';
$smtpFrom    = $config['smtp_from_email'] ?? '';
$smtpName    = $config['smtp_from_name']  ?? 'VCL AI Assessment';

$maskedKey = $geminiKey ? '••••••••' . substr($geminiKey, -4) : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Settings — VCL AI Assessment</title>
<link rel="icon" type="image/png" href="/vcl-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0f1117;
    --surface:  #1a1d27;
    --surface2: #222537;
    --border:   #2e3147;
    --text:     #e8eaf0;
    --muted:    #8b90a8;
    --accent:      #CE2823;
    --accent-lite: rgba(206,40,35,.12);
    --green:    #22c55e;
    --yellow:   #f59e0b;
    --red:      #ef4444;
    --radius:   12px;
  }

  body {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    position: sticky; top: 0; z-index: 100;
  }
  .header-brand { display: flex; align-items: center; gap: 12px; }
  .header-brand img { height: 32px; }
  .header-title { font-size: 14px; font-weight: 500; color: var(--muted); }
  .header-badge {
    background: var(--accent-lite); color: var(--accent);
    padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
  }
  .logout-btn {
    background: none; border: 1px solid var(--border);
    color: var(--muted); padding: 7px 16px; border-radius: 8px;
    cursor: pointer; font-size: 13px; transition: all .2s;
  }
  .logout-btn:hover { border-color: var(--accent); color: var(--accent); }

  /* ── Layout ── */
  .container { max-width: 860px; margin: 40px auto; padding: 0 24px; width: 100%; }

  /* ── Login card ── */
  .login-wrap {
    display: flex; align-items: center; justify-content: center;
    min-height: calc(100vh - 65px);
  }
  .login-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 48px 40px; width: 100%; max-width: 420px;
    text-align: center;
  }
  .login-logo { height: 44px; margin-bottom: 24px; }
  .login-card h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  .login-card p  { color: var(--muted); font-size: 14px; margin-bottom: 32px; }

  /* ── Tabs ── */
  .tabs {
    display: flex; gap: 4px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 4px; margin-bottom: 28px;
  }
  .tab {
    flex: 1; text-align: center; padding: 10px 16px;
    border-radius: 9px; cursor: pointer; font-size: 14px; font-weight: 500;
    color: var(--muted); text-decoration: none; transition: all .2s;
    border: none; background: none;
  }
  .tab.active { background: var(--surface2); color: var(--text); }
  .tab:hover:not(.active) { color: var(--text); }

  /* ── Cards / sections ── */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 28px 32px; margin-bottom: 20px;
  }
  .card-title {
    font-size: 16px; font-weight: 600; margin-bottom: 4px;
    display: flex; align-items: center; gap: 8px;
  }
  .card-desc { font-size: 13px; color: var(--muted); margin-bottom: 24px; }

  /* ── Form elements ── */
  .form-group { margin-bottom: 20px; }
  label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 7px; color: var(--text); }
  label .hint { color: var(--muted); font-weight: 400; margin-left: 6px; }

  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="number"],
  select {
    width: 100%; padding: 10px 14px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-size: 14px;
    font-family: inherit; outline: none; transition: border-color .2s;
    appearance: none;
  }
  input:focus, select:focus { border-color: var(--accent); }
  input::placeholder { color: var(--muted); }

  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .row-3 { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 22px; border-radius: 8px; font-size: 14px; font-weight: 600;
    cursor: pointer; border: none; transition: all .2s; font-family: inherit;
    text-decoration: none;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #b52220; }
  .btn-outline {
    background: none; border: 1px solid var(--border);
    color: var(--muted);
  }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
  .btn-sm { padding: 8px 16px; font-size: 13px; }
  .btn-green { background: #16a34a; color: #fff; }
  .btn-green:hover { background: #15803d; }

  .form-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }

  /* ── Alerts ── */
  .alert {
    display: flex; align-items: center; gap: 10px;
    padding: 13px 16px; border-radius: 9px; font-size: 14px; margin-bottom: 20px;
  }
  .alert-success { background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.3); color: #4ade80; }
  .alert-error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.3);  color: #f87171; }
  .alert-info    { background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.3); color: #93c5fd; }

  /* ── Status dot ── */
  .status-dot {
    display: inline-block; width: 8px; height: 8px;
    border-radius: 50%; margin-right: 6px;
  }
  .dot-green  { background: var(--green); box-shadow: 0 0 6px var(--green); }
  .dot-red    { background: var(--red); }
  .dot-yellow { background: var(--yellow); }

  /* ── Password toggle ── */
  .input-wrap { position: relative; }
  .input-wrap input { padding-right: 44px; }
  .eye-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--muted);
    font-size: 16px; transition: color .2s;
  }
  .eye-btn:hover { color: var(--text); }

  /* ── Model chips ── */
  .model-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .model-chip {
    padding: 6px 14px; border-radius: 999px; font-size: 13px;
    border: 1px solid var(--border); cursor: pointer; transition: all .2s;
    background: var(--surface2); color: var(--muted);
  }
  .model-chip.selected { background: var(--accent-lite); border-color: var(--accent); color: var(--text); }

  /* ── Divider ── */
  .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

  /* ── Info box ── */
  .info-box {
    background: rgba(59,130,246,.06); border: 1px solid rgba(59,130,246,.2);
    border-radius: 9px; padding: 14px 16px; font-size: 13px; color: #93c5fd;
    margin-bottom: 20px;
  }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .row-2, .row-3 { grid-template-columns: 1fr; }
    .card { padding: 20px; }
    .container { padding: 0 16px; }
    .header { padding: 12px 16px; }
  }
</style>
</head>
<body>

<!-- ── Header ──────────────────────────────────────────────────────────────── -->
<header class="header">
  <div class="header-brand">
    <img src="/vcl-logo.png" alt="VCL">
    <span class="header-title">Admin Settings</span>
  </div>
  <div style="display:flex;align-items:center;gap:12px">
    <span class="header-badge">⚡ VCL AI Assessment</span>
    <?php if ($isLoggedIn): ?>
      <a href="?logout=1" class="logout-btn">Sign out</a>
    <?php endif; ?>
  </div>
</header>

<?php if (!$isLoggedIn): ?>
<!-- ── Login screen ─────────────────────────────────────────────────────────── -->
<div class="login-wrap">
  <div class="login-card">
    <img class="login-logo" src="/vcl-logo.png" alt="VCL">
    <h1>Admin Panel</h1>
    <p>Enter your admin password to manage AI and email settings.</p>

    <?php if ($message): ?>
      <div class="alert alert-error" style="text-align:left;margin-bottom:20px">
        ⚠️ <?= htmlspecialchars($message) ?>
      </div>
    <?php endif; ?>

    <form method="POST">
      <input type="hidden" name="action" value="login">
      <div class="form-group" style="text-align:left">
        <label>Password</label>
        <div class="input-wrap">
          <input type="password" name="password" id="loginPass" placeholder="Enter admin password" autofocus required>
          <button type="button" class="eye-btn" onclick="togglePass('loginPass',this)">👁</button>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px">
        Sign In →
      </button>
    </form>
    <p style="margin-top:20px;font-size:12px;color:var(--muted)">
      Default password: <code style="color:var(--accent)">admin123</code> — change it after first login.
    </p>
  </div>
</div>

<?php else: ?>
<!-- ── Admin panel ──────────────────────────────────────────────────────────── -->
<main class="container">

  <?php if ($message): ?>
    <div class="alert alert-<?= $messageType === 'error' ? 'error' : 'success' ?>">
      <?= $messageType === 'error' ? '⚠️' : '✅' ?> <?= htmlspecialchars($message) ?>
    </div>
  <?php endif; ?>

  <!-- Tabs -->
  <div class="tabs">
    <a href="?tab=ai"       class="tab <?= $activeTab==='ai'       ? 'active':'' ?>">🤖 AI (Gemini)</a>
    <a href="?tab=email"    class="tab <?= $activeTab==='email'    ? 'active':'' ?>">📧 Email (SMTP)</a>
    <a href="?tab=security" class="tab <?= $activeTab==='security' ? 'active':'' ?>">🔒 Security</a>
  </div>

  <!-- ── Tab: AI Settings ──────────────────────────────────────────────────── -->
  <?php if ($activeTab === 'ai'): ?>
  <div class="card">
    <div class="card-title">🤖 Gemini AI Configuration</div>
    <div class="card-desc">Configure the Google Gemini API key and model used for generating assessment insights.</div>

    <div class="info-box">
      ℹ️ Get your free API key at <strong>aistudio.google.com</strong> → Create API Key. The key is stored securely on the server and never exposed in the browser.
    </div>

    <form method="POST">
      <input type="hidden" name="action"  value="save">
      <input type="hidden" name="section" value="ai">

      <div class="form-group">
        <label>Gemini API Key
          <?php if ($geminiKey): ?>
            <span style="color:var(--green)"><span class="status-dot dot-green"></span>Configured</span>
          <?php else: ?>
            <span style="color:var(--red)"><span class="status-dot dot-red"></span>Not set</span>
          <?php endif; ?>
        </label>
        <div class="input-wrap">
          <input type="password" name="gemini_api_key" id="geminiKey"
                 placeholder="<?= $geminiKey ? $maskedKey : 'AIza...' ?>"
                 autocomplete="new-password">
          <button type="button" class="eye-btn" onclick="togglePass('geminiKey',this)">👁</button>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-top:6px">Leave blank to keep the existing key.</p>
      </div>

      <div class="form-group">
        <label>Model</label>
        <input type="hidden" name="gemini_model" id="modelInput" value="<?= htmlspecialchars($geminiModel) ?>">
        <div class="model-chips">
          <?php foreach (['gemini-2.0-flash','gemini-2.0-flash-lite','gemini-1.5-flash','gemini-1.5-pro'] as $m): ?>
            <button type="button" class="model-chip <?= $geminiModel===$m?'selected':'' ?>"
                    onclick="selectModel('<?= $m ?>')">
              <?= $m ?>
            </button>
          <?php endforeach; ?>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-top:8px">
          Recommended: <strong>gemini-2.0-flash</strong> (fast, low cost). Use <strong>gemini-1.5-pro</strong> for highest quality.
        </p>
      </div>

      <div class="form-footer">
        <div style="font-size:13px;color:var(--muted)">
          Changes take effect immediately for new assessments.
        </div>
        <button type="submit" class="btn btn-primary">Save AI Settings</button>
      </div>
    </form>
  </div>
  <?php endif; ?>

  <!-- ── Tab: Email / SMTP ─────────────────────────────────────────────────── -->
  <?php if ($activeTab === 'email'): ?>
  <div class="card">
    <div class="card-title">📧 SMTP Email Configuration</div>
    <div class="card-desc">Configure the SMTP server used to send AI assessment results to participants.</div>

    <?php if ($testResult): ?>
      <?php [$tType, $tMsg] = explode(':', $testResult, 2); ?>
      <div class="alert alert-<?= $tType === 'success' ? 'success' : 'error' ?>">
        <?= $tType === 'success' ? '✅' : '⚠️' ?> <?= htmlspecialchars($tMsg) ?>
      </div>
    <?php endif; ?>

    <form method="POST">
      <input type="hidden" name="action"  value="save">
      <input type="hidden" name="section" value="email">

      <div class="row-3">
        <div class="form-group">
          <label>SMTP Host
            <?php if ($smtpHost): ?>
              <span style="color:var(--green)"><span class="status-dot dot-green"></span>Set</span>
            <?php endif; ?>
          </label>
          <input type="text" name="smtp_host" value="<?= htmlspecialchars($smtpHost) ?>"
                 placeholder="mail.vcl.solutions">
        </div>
        <div class="form-group">
          <label>Port</label>
          <input type="number" name="smtp_port" value="<?= (int)$smtpPort ?>" placeholder="587">
        </div>
        <div class="form-group">
          <label>Encryption</label>
          <select name="smtp_encryption">
            <option value="tls"  <?= $smtpEnc==='tls' ?'selected':'' ?>>STARTTLS (587)</option>
            <option value="ssl"  <?= $smtpEnc==='ssl' ?'selected':'' ?>>SSL/TLS (465)</option>
            <option value="none" <?= $smtpEnc==='none'?'selected':'' ?>>None</option>
          </select>
        </div>
      </div>

      <div class="row-2">
        <div class="form-group">
          <label>SMTP Username</label>
          <input type="text" name="smtp_username" value="<?= htmlspecialchars($smtpUser) ?>"
                 placeholder="user@yourdomain.com">
        </div>
        <div class="form-group">
          <label>SMTP Password</label>
          <div class="input-wrap">
            <input type="password" name="smtp_password" id="smtpPass"
                   placeholder="<?= $config['smtp_password'] ? '••••••••' : 'Enter password' ?>"
                   autocomplete="new-password">
            <button type="button" class="eye-btn" onclick="togglePass('smtpPass',this)">👁</button>
          </div>
        </div>
      </div>

      <hr class="divider">
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">
        <strong style="color:var(--text)">Sender details</strong> — shown as the From address in assessment result emails.
      </p>

      <div class="row-2">
        <div class="form-group">
          <label>From Email</label>
          <input type="email" name="smtp_from_email" value="<?= htmlspecialchars($smtpFrom) ?>"
                 placeholder="mahmoud@vcl.solutions">
        </div>
        <div class="form-group">
          <label>From Name</label>
          <input type="text" name="smtp_from_name" value="<?= htmlspecialchars($smtpName) ?>"
                 placeholder="VCL AI Assessment">
        </div>
      </div>

      <div class="form-footer">
        <div style="font-size:13px;color:var(--muted)">Leave password blank to keep existing.</div>
        <button type="submit" class="btn btn-primary">Save Email Settings</button>
      </div>
    </form>
  </div>

  <!-- Test email -->
  <div class="card">
    <div class="card-title">🧪 Test Email Connection</div>
    <div class="card-desc">Send a test email to verify your SMTP settings are working correctly.</div>
    <form method="POST">
      <input type="hidden" name="action" value="test_email">
      <div style="display:flex;gap:12px;align-items:flex-end">
        <div class="form-group" style="flex:1;margin-bottom:0">
          <label>Send test to</label>
          <input type="email" name="test_email_to" placeholder="your@email.com">
        </div>
        <button type="submit" class="btn btn-green btn-sm" style="margin-bottom:0;height:42px">
          📨 Send Test
        </button>
      </div>
    </form>
  </div>
  <?php endif; ?>

  <!-- ── Tab: Security ─────────────────────────────────────────────────────── -->
  <?php if ($activeTab === 'security'): ?>
  <div class="card">
    <div class="card-title">🔒 Admin Password</div>
    <div class="card-desc">Change the password used to access this admin panel.</div>

    <div class="info-box">
      ⚠️ If you forget your password, you can reset it by editing <code>/api/config.json</code> directly on the server and changing the <code>admin_password</code> field.
    </div>

    <form method="POST">
      <input type="hidden" name="action"  value="save">
      <input type="hidden" name="section" value="security">

      <div class="form-group">
        <label>New Password</label>
        <div class="input-wrap">
          <input type="password" name="new_password" id="newPass" placeholder="Enter new password" required>
          <button type="button" class="eye-btn" onclick="togglePass('newPass',this)">👁</button>
        </div>
      </div>
      <div class="form-group">
        <label>Confirm Password</label>
        <div class="input-wrap">
          <input type="password" name="confirm_password" id="confPass" placeholder="Confirm new password" required>
          <button type="button" class="eye-btn" onclick="togglePass('confPass',this)">👁</button>
        </div>
      </div>

      <div class="form-footer">
        <div style="font-size:13px;color:var(--muted)">You'll be logged out after changing.</div>
        <button type="submit" class="btn btn-primary">Update Password</button>
      </div>
    </form>
  </div>

  <div class="card">
    <div class="card-title">🔗 Endpoint Status</div>
    <div class="card-desc">These are the PHP API endpoints replacing the n8n webhooks.</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <?php
      $base = (isset($_SERVER['HTTPS'])&&$_SERVER['HTTPS']==='on'?'https':'http').'://'.$_SERVER['HTTP_HOST'];
      foreach (['/api/analyze.php'=>'AI Analysis (Gemini)', '/api/send-email.php'=>'Email Delivery (SMTP)', '/api/settings.php'=>'Settings API'] as $endpoint=>$label): ?>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)">
          <div>
            <div style="font-weight:500;font-size:14px"><?= $label ?></div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px"><code><?= $base.$endpoint ?></code></div>
          </div>
          <span style="color:var(--green);font-size:13px"><span class="status-dot dot-green"></span>Active</span>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>

</main>
<?php endif; ?>

<script>
function togglePass(id, btn) {
  var inp = document.getElementById(id);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

function selectModel(model) {
  document.getElementById('modelInput').value = model;
  document.querySelectorAll('.model-chip').forEach(c => {
    c.classList.toggle('selected', c.textContent.trim() === model);
  });
}
</script>

</body>
</html>
