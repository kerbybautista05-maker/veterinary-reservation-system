// components/comms/comms.api.ts
// ─── CSRF-aware fetch utilities used by all comms panels ──────────────────────

export async function apiFetch(url: string, opts: RequestInit = {}): Promise<Response> {
    const isWrite = opts.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(opts.method.toUpperCase());
    const xsrf = document.cookie.split(';').reduce<string>((acc, c) => {
        const [k, v] = c.trim().split('=');
        return k === 'XSRF-TOKEN' ? decodeURIComponent(v) : acc;
    }, '');
    const isFormData = opts.body instanceof FormData;
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(isWrite && xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(opts.headers as Record<string, string> ?? {}),
    };
    if (isFormData) delete headers['Content-Type'];
    return fetch(url, { ...opts, headers, credentials: 'include' });
}

export async function apiGet<T>(url: string): Promise<T | null> {
    try {
        const r = await apiFetch(url);
        if (!r.ok) return null;
        const j = await r.json();
        return j.success ? (j.data ?? null) : null;
    } catch { return null; }
}

export async function apiPost<T>(
    url: string,
    body: unknown
): Promise<{ success: boolean; data?: T; message?: string; errors?: Record<string, string[]>; [key: string]: unknown }> {
    try {
        const isForm = body instanceof FormData;
        const r = await apiFetch(url, { method: 'POST', body: isForm ? body : JSON.stringify(body) });
        return await r.json();
    } catch { return { success: false, message: 'Network error' }; }
}

export async function apiDelete<T>(
    url: string
): Promise<{ success: boolean; data?: T; message?: string; [key: string]: unknown }> {
    try {
        const r = await apiFetch(url, { method: 'DELETE' });
        if (!r.ok) {
            try { return await r.json(); } catch { return { success: false, message: `Request failed (${r.status})` }; }
        }
        // Some DELETE endpoints return 204 No Content — treat empty body as success.
        const text = await r.text();
        if (!text) return { success: true };
        try { return JSON.parse(text); } catch { return { success: true }; }
    } catch { return { success: false, message: 'Network error' }; }
}

// ─── Sidebar module badges ─────────────────────────────────────────────────────

export interface ModuleBadgeCounts {
    messages: number;
    support: number;
    suggestions: number;
    requests: number;
}

/**
 * GET /api/notifications/module-badges
 * Unread/actionable counts for the four nav modules (Messages, Support,
 * Suggestions, Requests) — drives the red counter badges in the sidebar.
 * Safe to poll; returns an all-zero object on any failure rather than
 * throwing, so a badge fetch failure never breaks navigation.
 */
export async function getModuleBadges(): Promise<ModuleBadgeCounts> {
    const zero: ModuleBadgeCounts = { messages: 0, support: 0, suggestions: 0, requests: 0 };
    const data = await apiGet<ModuleBadgeCounts>('/api/notifications/module-badges');
    return data ?? zero;
}