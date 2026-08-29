// resources/js/pages/Shared/helpers.ts
// Shared utility functions used across NE Veterinary Clinic pages

import type { UserSummary } from '../../services';

// ─── PH Time Formatting ────────────────────────────────────────────────────────
const PH_TZ = 'Asia/Manila';

/** e.g. "Jun 18, 2026, 2:30 PM" */
export function formatPHDateTime(dateStr?: string | null): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleString('en-PH', {
            timeZone: PH_TZ,
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true,
        });
    } catch { return dateStr; }
}

/** e.g. "Wednesday, June 18, 2026" */
export function formatPHDate(dateStr?: string | null, opts?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            timeZone: PH_TZ,
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            ...opts,
        });
    } catch { return dateStr; }
}

/** e.g. "Wed, Jun 18, 2026" */
export function formatPHDateShort(dateStr?: string | null): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            timeZone: PH_TZ, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        });
    } catch { return dateStr; }
}

/** e.g. "2:30 PM" */
export function formatPHTime(dateStr?: string | null): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleTimeString('en-PH', {
            timeZone: PH_TZ, hour: 'numeric', minute: '2-digit', hour12: true,
        });
    } catch { return dateStr; }
}

/** e.g. "Just now", "5m ago", "2h ago", "Jun 18, 3:00 PM" */
export function timeAgo(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-PH', {
        timeZone: PH_TZ, month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
}

// ─── Currency ──────────────────────────────────────────────────────────────────

export function formatPeso(amount: number | string): string {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (Number.isNaN(n)) return '₱0.00';
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Name Helpers ──────────────────────────────────────────────────────────────

/** Get display name — prefers server-computed full_name, falls back to name/email */
export function getDisplayName(user?: UserSummary | null): string {
    if (!user) return 'Unknown';
    return user.full_name || user.name || user.email || 'Unknown';
}

/** Get initials from user's display name */
export function getInitials(user?: UserSummary | null): string {
    if (!user) return '?';
    const name = getDisplayName(user);
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0]?.[0]?.toUpperCase() ?? '?';
}

export function getRoleLabel(role?: string | null): string {
    return { admin: 'Administrator', veterinarian: 'Veterinarian', pet_owner: 'Pet Owner' }[role ?? ''] ?? 'User';
}

// ─── File Helpers ──────────────────────────────────────────────────────────────

export function formatFileSize(bytes?: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
