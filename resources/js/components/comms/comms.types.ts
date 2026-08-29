// components/comms/comms.types.ts
// ─── Shared types, constants, and pure helpers for the Comms panel ────────────

export type UserRole = 'admin' | 'team_leader' | 'teacher' | 'staff';
export type OnlineStatus = 'online' | 'away' | 'busy' | 'offline';
export type Tab = 'chat' | 'support' | 'ideas';
export type ConvType =
    | 'direct'
    | 'group'
    | 'branch_group'
    | 'team_leaders'
    | 'staff_group'
    | 'announcement'
    | 'custom';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
    id: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    role: UserRole;
    profile_photo_path?: string;
    profile_photo_url?: string;
}

export interface PageProps {
    auth?: { user?: AuthUser };
    [key: string]: unknown;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface Participant {
    user_id: number;
    is_admin?: boolean;
    can_post_announcements?: boolean;
    user?: {
        id: number;
        first_name?: string;
        last_name?: string;
        real_name?: string;
        profile_photo_path?: string;
        profile_photo_url?: string;
    };
}

export interface LastMsg {
    body?: string;
    created_at?: string;
    message_type?: string;
    preview?: string;
    sender?: { first_name?: string };
}

export interface Conversation {
    id: number;
    name?: string | null;
    type: ConvType;
    last_message?: LastMsg | null;
    latest_message?: LastMsg | null;
    unread_count?: number;
    active_participants?: Participant[];
    participants?: Participant[];
    display_name?: string;
    is_group?: boolean;
    icon_url?: string | null;
}

export interface MsgAttachment {
    id: number;
    file_name?: string;
    file_url?: string;
    attachment_type?: string;
    mime_type?: string;
    formatted_file_size?: string;
}

export interface Reaction {
    emoji: string;
    count: number;
    reacted: boolean;
    user_ids?: number[];
    users?: { id: number; name: string; profile_photo_path?: string }[];
}

export interface MsgRead {
    user_id: number;
    user?: {
        id: number;
        first_name?: string;
        last_name?: string;
        real_name?: string;
        profile_photo_path?: string;
        profile_photo_url?: string;
    };
}

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    body?: string | null;
    is_pinned?: boolean;
    is_edited?: boolean;
    created_at: string;
    time_ago?: string;
    sender?: {
        id: number;
        first_name?: string;
        last_name?: string;
        real_name?: string;
        profile_photo_path?: string;
        profile_photo_url?: string;
    };
    attachments?: MsgAttachment[];
    reaction_summary?: Reaction[];
    is_read_by_me?: boolean;
    reads?: MsgRead[];
    reply_to?: { id: number; body?: string; sender?: { first_name?: string } } | null;
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

export interface TicketUser {
    id?: number;
    first_name?: string;
    last_name?: string;
    real_name?: string;
    role?: string;
    profile_photo_path?: string;
    profile_photo_url?: string;
}

export interface SupportTicket {
    id: number;
    ticket_number?: string;
    subject: string;
    status: 'new' | 'open' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
    priority?: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
    category?: string;
    created_at: string;
    updated_at?: string;
    status_label?: string;
    priority_label?: string;
    submitted_by?: number | TicketUser;
    submittedBy?: TicketUser;
    assignee?: TicketUser;
    // True unread indicator — count of unread Notifications tied to this
    // ticket for the CURRENT user (new replies, status/assignment changes).
    // Clears automatically once the ticket is opened (GET /api/support-tickets/{id}).
    unread_count?: number;
    has_unread?: boolean;
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

export interface SuggestionUser {
    id?: number;
    first_name?: string;
    last_name?: string;
    real_name?: string;
    profile_photo_path?: string;
    profile_photo_url?: string;
}

export interface Suggestion {
    id: number;
    title: string;
    body?: string;
    status: 'submitted' | 'pending' | 'under_review' | 'planned' | 'in_development' | 'implemented' | 'rejected';
    category?: string;
    votes_count?: number;
    is_anonymous?: boolean;
    my_vote?: 'up' | 'down' | null;
    created_at: string;
    status_label?: string;
    submitted_by?: number | SuggestionUser;
    submittedBy?: SuggestionUser;
    excerpt?: string;
    category_label?: string;
    formatted_created_at?: string;
    // True unread indicator — count of unread Notifications tied to this
    // suggestion for the CURRENT user (new comments, status updates).
    // Clears automatically once opened (GET /api/suggestions/{id}).
    unread_count?: number;
    has_unread?: boolean;
}

// ─── People ───────────────────────────────────────────────────────────────────

export interface Colleague {
    id: number;
    first_name?: string;
    last_name?: string;
    real_name?: string;
    profile_photo_path?: string;
    profile_photo_url?: string;
    role: UserRole;
    online_status?: OnlineStatus;
}

export type AnyUser = {
    first_name?: string;
    last_name?: string;
    real_name?: string;
    profile_photo_path?: string;
    profile_photo_url?: string;
} | null | undefined;

// ─── Theme ────────────────────────────────────────────────────────────────────

export const G0 = '#0d1b3e';
export const G1 = '#1a3a6b';
export const GS = `linear-gradient(135deg, ${G0} 0%, ${G1} 100%)`;

// ─── Status configs ────────────────────────────────────────────────────────────

export const TICKET_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    new:          { label: 'New',         color: '#0369a1', bg: '#e0f2fe' },
    open:         { label: 'Open',        color: '#0369a1', bg: '#e0f2fe' },
    under_review: { label: 'In Review',   color: '#b45309', bg: '#fef3c7' },
    assigned:     { label: 'Assigned',    color: '#6d28d9', bg: '#ede9fe' },
    in_progress:  { label: 'In Progress', color: '#0d1b3e', bg: '#e0e7ff' },
    resolved:     { label: 'Resolved',    color: '#15803d', bg: '#dcfce7' },
    closed:       { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6' },
};

export const TICKET_PRIORITY: Record<string, { label: string; color: string; bg: string }> = {
    low:      { label: 'Low',      color: '#6b7280', bg: '#f3f4f6' },
    medium:   { label: 'Medium',   color: '#0369a1', bg: '#e0f2fe' },
    high:     { label: 'High',     color: '#c2410c', bg: '#fff7ed' },
    critical: { label: 'Critical', color: '#b91c1c', bg: '#fee2e2' },
    urgent:   { label: 'Urgent',   color: '#b91c1c', bg: '#fee2e2' },
};

export const SUGGESTION_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    submitted:      { label: 'Submitted',     color: '#0369a1', bg: '#e0f2fe' },
    pending:        { label: 'Pending',       color: '#6b7280', bg: '#f3f4f6' },
    under_review:   { label: 'In Review',     color: '#b45309', bg: '#fef3c7' },
    planned:        { label: 'Planned',       color: '#6d28d9', bg: '#ede9fe' },
    in_development: { label: 'In Dev',        color: '#0d1b3e', bg: '#e0e7ff' },
    implemented:    { label: 'Implemented ✓', color: '#15803d', bg: '#dcfce7' },
    rejected:       { label: 'Rejected',      color: '#b91c1c', bg: '#fee2e2' },
};

export const STATUS_ONLINE: Record<OnlineStatus, { label: string; color: string }> = {
    online:  { label: 'Online',  color: '#22c55e' },
    away:    { label: 'Away',    color: '#f59e0b' },
    busy:    { label: 'Busy',    color: '#ef4444' },
    offline: { label: 'Offline', color: '#9ca3af' },
};

export const TICKET_SORT_PRIORITY: Record<string, number> = {
    new: 0, under_review: 1, assigned: 2, in_progress: 3, resolved: 4, closed: 5,
};

export const PRIORITY_SORT: Record<string, number> = {
    critical: 0, high: 1, medium: 2, low: 3,
};

export const SUPPORT_CATEGORIES = [
    { id: 'technical_issue',      label: 'Technical Issue',    icon: '🔧', desc: 'App bugs, system errors, connectivity' },
    { id: 'attendance_concern',   label: 'Attendance Concern', icon: '📋', desc: 'Attendance records, absences, tardiness' },
    { id: 'schedule_concern',     label: 'Schedule Concern',   icon: '📅', desc: 'Class schedule, time slot issues' },
    { id: 'equipment_concern',    label: 'Equipment Concern',  icon: '🖥️', desc: 'Headset, camera, computer problems' },
    { id: 'account_lock_concern', label: 'Account Lock',       icon: '🔒', desc: 'Locked out, password reset, access' },
    { id: 'contract_concern',     label: 'Contract Concern',   icon: '📄', desc: 'Contract terms, renewal, amendments' },
    { id: 'other',                label: 'Other',              icon: '💬', desc: 'Anything not listed above' },
] as const;

export const SUGGESTION_PIPELINE: { status: string; label: string; icon: string; color: string; bg: string }[] = [
    { status: 'submitted',      label: 'Submitted',      icon: '📥', color: '#0369a1', bg: '#e0f2fe' },
    { status: 'under_review',   label: 'Under Review',   icon: '🔍', color: '#b45309', bg: '#fef3c7' },
    { status: 'planned',        label: 'Planned',        icon: '📋', color: '#6d28d9', bg: '#ede9fe' },
    { status: 'in_development', label: 'In Development', icon: '⚙️', color: '#0d1b3e', bg: '#e0e7ff' },
    { status: 'implemented',    label: 'Implemented',    icon: '✅', color: '#15803d', bg: '#dcfce7' },
    { status: 'rejected',       label: 'Rejected',       icon: '❌', color: '#b91c1c', bg: '#fee2e2' },
];

// ─── Role-based routes ─────────────────────────────────────────────────────────

const BASE: Record<UserRole, {
    chat: string; support: string; ideas: string;
    chatMgmt: string | null; supportMgmt: string | null; ideasMgmt: string | null;
}> = {
    admin:       { chat: '/admin/chat',       support: '/admin/support',       ideas: '/admin/suggestions',       chatMgmt: '/admin/chat-management',       supportMgmt: '/admin/support-management',       ideasMgmt: '/admin/ideas-management' },
    staff:       { chat: '/staff/chat',       support: '/staff/support',       ideas: '/staff/suggestions',       chatMgmt: '/staff/chat-management',       supportMgmt: '/staff/support-management',       ideasMgmt: '/staff/ideas-management' },
    team_leader: { chat: '/team-leader/chat', support: '/team-leader/support', ideas: '/team-leader/suggestions', chatMgmt: null,                           supportMgmt: null,                             ideasMgmt: null },
    teacher:     { chat: '/teacher/chat',     support: '/teacher/support',     ideas: '/teacher/suggestions',     chatMgmt: null,                           supportMgmt: null,                             ideasMgmt: null },
};

export function chatHref(role: UserRole, id?: number): string {
    const b = BASE[role]?.chat ?? '/teacher/chat';
    return id ? `${b}/${id}` : b;
}
export function supportHref(role: UserRole, id?: number): string {
    const b = BASE[role]?.support ?? '/teacher/support';
    return id ? `${b}/${id}` : b;
}
export function ideasHref(role: UserRole, id?: number): string {
    const b = BASE[role]?.ideas ?? '/teacher/suggestions';
    return id ? `${b}/${id}` : b;
}
export function chatMgmtHref(role: UserRole): string | null   { return BASE[role]?.chatMgmt   ?? null; }
export function supportMgmtHref(role: UserRole): string | null { return BASE[role]?.supportMgmt ?? null; }
export function ideasMgmtHref(role: UserRole): string | null   { return BASE[role]?.ideasMgmt   ?? null; }

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function photoUrl(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `/storage/${path}`;
}

export function ago(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso), diff = Date.now() - d.getTime();
    if (diff < 60_000)     return 'just now';
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    // FIX: 'en-PH' only controls language/format conventions, not the
    // actual timezone used for conversion — without an explicit timeZone,
    // this rendered in the *browser's* local timezone, which can silently
    // shift the displayed date by a day for anyone not physically on
    // Philippine time. Force Asia/Manila explicitly so the date is always
    // correct regardless of where the browser thinks it is.
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
}

export function userName(u?: AnyUser): string {
    if (!u) return '';
    if (u.real_name?.trim()) return u.real_name.trim();
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return full || '';
}

export function userDisplayName(u?: AnyUser): string {
    return userName(u) || 'Unknown';
}

export function initials(u?: AnyUser): string {
    const name = userName(u);
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function userPhoto(u?: AnyUser): string | null {
    if (!u) return null;
    return photoUrl(u.profile_photo_path) ?? photoUrl(u.profile_photo_url) ?? null;
}

export function getParticipants(c: Conversation): Participant[] {
    return c.active_participants ?? c.participants ?? [];
}

export function getLastMessage(c: Conversation): LastMsg | null | undefined {
    return c.latest_message ?? c.last_message;
}

export function getPreviewText(lm: LastMsg | null | undefined, unreadCount: number): string {
    if (!lm) return unreadCount > 0 ? 'New message' : 'No messages yet';
    if (lm.preview) return lm.preview;
    if (lm.body?.trim()) return lm.body.trim();
    switch (lm.message_type) {
        case 'image':        return '📷 Photo';
        case 'file':         return '📎 File';
        case 'announcement': return '📢 Announcement';
        case 'system':       return '• System message';
        default: return unreadCount > 0 ? '📎 Attachment' : 'No messages yet';
    }
}

// Ticket helpers
export function getTicketSubmitter(ticket: SupportTicket): TicketUser | null {
    const raw = (ticket as any).submitted_by;
    if (raw && typeof raw === 'object') return raw as TicketUser;
    if ((ticket as any).submittedBy) return (ticket as any).submittedBy as TicketUser;
    return null;
}

export function ticketUserPhoto(u: TicketUser | null | undefined): string | null {
    if (!u) return null;
    if (u.profile_photo_path) return photoUrl(u.profile_photo_path);
    if ((u as any).profile_photo_url) return (u as any).profile_photo_url;
    return null;
}

export function ticketUserName(u: TicketUser | null | undefined): string {
    if (!u) return 'Unknown';
    if (u.real_name?.trim()) return u.real_name.trim();
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return full || 'Unknown';
}

export function ticketInitials(u: TicketUser | null | undefined): string {
    const name = ticketUserName(u);
    if (name === 'Unknown') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

// Suggestion helpers
export function getSuggestionSubmitter(s: Suggestion): SuggestionUser | null {
    const raw = (s as any).submitted_by;
    if (raw && typeof raw === 'object') return raw as SuggestionUser;
    if ((s as any).submittedBy) return (s as any).submittedBy as SuggestionUser;
    return null;
}

export function suggestionUserName(u: SuggestionUser | null | undefined): string {
    if (!u) return 'Anonymous';
    if (u.real_name?.trim()) return u.real_name.trim();
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return full || 'Anonymous';
}

export function suggestionUserPhoto(u: SuggestionUser | null | undefined): string | null {
    if (!u) return null;
    if (u.profile_photo_path) return photoUrl(u.profile_photo_path);
    if (u.profile_photo_url) return u.profile_photo_url;
    return null;
}

// Online status helpers
export function getStoredStatus(userId: number): OnlineStatus {
    try {
        const v = localStorage.getItem(`mn2_status_${userId}`);
        if (v && (['online', 'away', 'busy', 'offline'] as string[]).includes(v)) return v as OnlineStatus;
    } catch { /* ignore */ }
    return 'offline';
}

// Reaction normalization
export function normalizeReactions(raw: unknown): Reaction[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return (raw as any[]).map(r => ({
            emoji:    String(r.emoji ?? ''),
            count:    Number(r.count ?? 1),
            reacted:  Boolean(r.reacted ?? false),
            user_ids: Array.isArray(r.user_ids) ? r.user_ids : [],
            users:    Array.isArray(r.users) ? r.users : [],
        })).filter(r => r.emoji && r.count > 0);
    }
    if (typeof raw === 'object' && raw !== null) {
        return Object.entries(raw as Record<string, unknown>).map(([emoji, val]) => ({
            emoji,
            count:    typeof val === 'number' ? val : Number((val as any)?.count ?? 1),
            reacted:  typeof val === 'object' && val !== null ? Boolean((val as any)?.reacted) : false,
            user_ids: [],
            users:    [],
        })).filter(r => r.count > 0);
    }
    return [];
}

export function normalizeMessages(msgs: Message[]): Message[] {
    return msgs.map(m => ({ ...m, reaction_summary: normalizeReactions(m.reaction_summary) }));
}

// Sound helper
export function playNewMessageSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
        osc.onended = () => ctx.close();
    } catch { /* AudioContext not supported */ }
}