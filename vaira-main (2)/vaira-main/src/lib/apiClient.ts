/**
 * Thin fetch wrapper for all PHP API calls.
 * All endpoints are same-origin so we use relative paths.
 */

const ADMIN_TOKEN_KEY = 'vcl_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { 'X-Admin-Token': token } : {};
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(body).error ?? msg; } catch {}
    throw new Error(msg);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (password: string) =>
    request<{ token: string; expires: number }>('/api/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  check: () =>
    request<{ valid: boolean }>('/api/auth/check.php', {
      headers: adminHeaders(),
    }),

  logout: () =>
    request('/api/auth/logout.php', { method: 'POST' }),
};

// ── Public settings ───────────────────────────────────────────────────────────
export const settingsApi = {
  getPublic: () =>
    request<{ webhook_url: string; delivery_webhook_url: string; whatsapp_enabled: string }>(
      '/api/settings.php',
    ),

  getAdmin: () =>
    request<{ success: boolean; settings: Record<string, string> }>(
      '/api/settings.php?admin=1',
      { headers: adminHeaders() },
    ),

  update: (settings: Record<string, string>) =>
    request('/api/settings.php', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ settings }),
    }),
};

// ── Dimensions / questions ────────────────────────────────────────────────────
export const dimensionsApi = {
  getAll: () => request<any[]>('/api/dimensions.php'),

  adminGetAll: () =>
    request<any[]>('/api/admin/questions.php', { headers: adminHeaders() }),

  create: (type: string, data: Record<string, unknown>) =>
    request<{ id: string }>('/api/admin/questions.php', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ type, ...data }),
    }),

  update: (type: string, id: string, data: Record<string, unknown>) =>
    request('/api/admin/questions.php?id=' + id, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ type, ...data }),
    }),

  delete: (type: string, id: string) =>
    request('/api/admin/questions.php?id=' + id + '&type=' + type, {
      method: 'DELETE',
      headers: adminHeaders(),
    }),
};

// ── Participants ──────────────────────────────────────────────────────────────
export const participantsApi = {
  create: (data: { domain: string; original_website?: string }) =>
    request<{ id: string }>('/api/participants.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateContact: (
    id: string,
    data: {
      full_name?: string;
      email?: string;
      phone_number?: string;
      consent_to_contact?: boolean;
    },
  ) =>
    request('/api/participants.php?id=' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ── Assessment results ────────────────────────────────────────────────────────
export const resultsApi = {
  create: (data: {
    participant_id: string;
    overall_score: number;
    level_number: number;
    level_label: string;
    scores: unknown;
    agent_result: unknown;
    answers: unknown;
  }) =>
    request<{ id: string }>('/api/results.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePdfUrl: (id: string, pdf_url: string) =>
    request('/api/results.php?id=' + id, {
      method: 'PATCH',
      body: JSON.stringify({ pdf_url }),
    }),

  adminGetAll: () =>
    request<any[]>('/api/admin/results.php', { headers: adminHeaders() }),
};

// ── File upload ───────────────────────────────────────────────────────────────
export const uploadApi = {
  checkLogo: () =>
    request<{ exists: boolean; url: string | null }>('/api/upload.php'),

  uploadLogo: async (file: File): Promise<{ success: boolean; url: string }> => {
    const form = new FormData();
    form.append('file', file);
    form.append('type', 'logo');
    const res = await fetch('/api/upload.php', {
      method: 'POST',
      headers: adminHeaders(),
      body: form,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },

  uploadPdf: async (
    blob: Blob,
    filename: string,
  ): Promise<{ success: boolean; url: string; filename: string }> => {
    const form = new FormData();
    form.append('file', blob, filename);
    form.append('type', 'report');
    form.append('filename', filename.replace('.pdf', ''));
    const res = await fetch('/api/upload.php', { method: 'POST', body: form });
    if (!res.ok) throw new Error(`PDF upload failed: ${res.status}`);
    return res.json();
  },

  deleteLogo: async (): Promise<void> => {
    // No-op if logo doesn't exist — overwrite with next upload
    // For now we just leave the file; admin can re-upload to replace
  },
};
