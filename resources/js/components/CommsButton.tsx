// resources/js/components/CommsButton.tsx
// Fixed V2 — profile photos · message order · reactions · sound · FB-style seen

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    MessageSquare, Ticket, Lightbulb, X, ChevronRight, ChevronLeft,
    Plus, Search, ArrowUpRight, Loader2, MessageCircle, Users,
    Hash, Megaphone, HelpCircle, Sparkles, Send, Paperclip,
    ThumbsUp, ThumbsDown, Check, Pin, Image, FileText,
    MoreHorizontal, Edit2, Trash2, Reply, SmilePlus, Bell,Shield ,
    AlertCircle, ChevronDown, ChevronUp, RefreshCw,
    UserCheck,
} from 'lucide-react';

// ─── Theme ──────────────────────────────────────────────────────────────────────
const G0  = '#0d1b3e';
const G1  = '#1a3a6b';
const GS  = `linear-gradient(135deg, ${G0} 0%, ${G1} 100%)`;

// ─── Profile photo URL helper ────────────────────────────────────────────────────
// Backend stores profile_photo_path (e.g. "profile-photos/abc.jpg")
// We need to prepend /storage/ to get the public URL
function photoUrl(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `/storage/${path}`;
}

// ─── Types ──────────────────────────────────────────────────────────────────────
type UserRole = 'admin' | 'team_leader' | 'teacher' | 'staff';

interface AuthUser {
    id: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    role: UserRole;
    profile_photo_path?: string;
    profile_photo_url?: string;
}

interface PageProps {
    auth?: { user?: AuthUser };
    [key: string]: unknown;
}

type ConvType = 'direct' | 'group' | 'branch_group' | 'team_leaders' | 'staff_group' | 'announcement' | 'custom';

interface Participant {
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

interface LastMsg {
    body?: string;
    created_at?: string;
    message_type?: string;   // text|image|file|system|announcement
    preview?: string;        // server-computed 60-char preview
    sender?: { first_name?: string };
}

interface Conversation {
    id: number;
    name?: string | null;
    type: ConvType;
    last_message?: LastMsg | null;      // fallback / v2-types shape
    latest_message?: LastMsg | null;    // Laravel serializes latestMessage → latest_message
    unread_count?: number;
    active_participants?: Participant[];
    participants?: Participant[];
    display_name?: string;
    is_group?: boolean;
    icon_url?: string | null;
}

function getParticipants(c: Conversation): Participant[] {
    return c.active_participants ?? c.participants ?? [];
}

/** Laravel serializes the latestMessage relation as latest_message in JSON.
 *  Support both keys so the conversation list preview always shows. */
function getLastMessage(c: Conversation): LastMsg | null | undefined {
    return c.latest_message ?? c.last_message;
}

/** Returns the best preview text for a conversation list row.
 *  Handles: text body, image messages, file messages, system, empty. */
function getPreviewText(lm: LastMsg | null | undefined, unreadCount: number): string {
    if (!lm) {
        // No latest_message loaded — but if there are unreads something exists
        return unreadCount > 0 ? 'New message' : 'No messages yet';
    }
    // Use server-computed preview if available
    if (lm.preview) return lm.preview;
    // Use body if present
    if (lm.body?.trim()) return lm.body.trim();
    // No body — infer from message_type
    switch (lm.message_type) {
        case 'image':        return '📷 Photo';
        case 'file':         return '📎 File';
        case 'announcement': return '📢 Announcement';
        case 'system':       return '• System message';
        default:
            // Still no body and no type — could be attachment-only
            return unreadCount > 0 ? '📎 Attachment' : 'No messages yet';
    }
}

interface MsgAttachment {
    id: number;
    file_name?: string;
    file_url?: string;
    attachment_type?: string;
    mime_type?: string;
    formatted_file_size?: string;
}

interface Reaction {
    emoji: string;
    count: number;
    reacted: boolean;
    user_ids?: number[];
    users?: { id: number; name: string; profile_photo_path?: string }[];
}

interface MsgRead {
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

interface Message {
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

interface TicketUser {
    id?: number;
    first_name?: string;
    last_name?: string;
    real_name?: string;
    role?: string;
    profile_photo_path?: string;
    profile_photo_url?: string;
}
interface SupportTicket {
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
    // Laravel serializes submittedBy relation → submitted_by (object), NOT submittedBy
    submitted_by?: number | TicketUser;  // can be ID (number) or eager-loaded object
    submittedBy?: TicketUser;            // kept for compat but rarely populated
    assignee?: TicketUser;
}

/** Safely resolve the submitter object from a ticket regardless of field name */
function getTicketSubmitter(ticket: SupportTicket | { submittedBy?: TicketUser; submitted_by?: number | TicketUser; assignee?: TicketUser }): TicketUser | null {
    // Laravel eager-loads as submitted_by when the relation key is submittedBy
    // It serializes to snake_case: submitted_by
    const raw = (ticket as any).submitted_by;
    if (raw && typeof raw === 'object') return raw as TicketUser;
    // Some endpoints may return it as submittedBy (camelCase preserved)
    if ((ticket as any).submittedBy) return (ticket as any).submittedBy as TicketUser;
    return null;
}

/** Build photo URL from a TicketUser */
function ticketUserPhoto(u: TicketUser | null | undefined): string | null {
    if (!u) return null;
    if (u.profile_photo_path) return photoUrl(u.profile_photo_path);
    if ((u as any).profile_photo_url) return (u as any).profile_photo_url;
    return null;
}

/** Display name for a TicketUser */
function ticketUserName(u: TicketUser | null | undefined): string {
    if (!u) return 'Unknown';
    if (u.real_name?.trim()) return u.real_name.trim();
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return full || 'Unknown';
}

/** Initials for a TicketUser */
function ticketInitials(u: TicketUser | null | undefined): string {
    const name = ticketUserName(u);
    if (name === 'Unknown') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
    return `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase();
}

interface SuggestionUser {
    id?: number;
    first_name?: string;
    last_name?: string;
    real_name?: string;
    profile_photo_path?: string;
    profile_photo_url?: string;
}
interface Suggestion {
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
    // Laravel serializes submittedBy → submitted_by (object when eager loaded)
    submitted_by?: number | SuggestionUser;
    submittedBy?: SuggestionUser;
    excerpt?: string;
    category_label?: string;
    formatted_created_at?: string;
}

function getSuggestionSubmitter(s: Suggestion): SuggestionUser | null {
    const raw = (s as any).submitted_by;
    if (raw && typeof raw === 'object') return raw as SuggestionUser;
    if ((s as any).submittedBy) return (s as any).submittedBy as SuggestionUser;
    return null;
}
function suggestionUserName(u: SuggestionUser | null | undefined): string {
    if (!u) return 'Anonymous';
    if (u.real_name?.trim()) return u.real_name.trim();
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return full || 'Anonymous';
}
function suggestionUserPhoto(u: SuggestionUser | null | undefined): string | null {
    if (!u) return null;
    if (u.profile_photo_path) return photoUrl(u.profile_photo_path);
    if (u.profile_photo_url) return u.profile_photo_url;
    return null;
}

type OnlineStatus = 'online' | 'away' | 'busy' | 'offline';

interface Colleague {
    id: number;
    first_name?: string;
    last_name?: string;
    real_name?: string;
    profile_photo_path?: string;
    profile_photo_url?: string;
    role: UserRole;
    online_status?: OnlineStatus;
}

function getStoredStatus(userId: number): OnlineStatus {
    try {
        const v = localStorage.getItem(`mn2_status_${userId}`);
        if (v && (['online','away','busy','offline'] as string[]).includes(v)) return v as OnlineStatus;
    } catch { /* ignore */ }
    return 'offline';
}

// ─── Sound helper ────────────────────────────────────────────────────────────────
// Plays a short, gentle "pop" using Web Audio API — no external file needed
function playNewMessageSound() {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────────
function ago(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso), diff = Date.now() - d.getTime();
    if (diff < 60_000)     return 'just now';
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

type AnyUser = {
    first_name?: string;
    last_name?: string;
    real_name?: string;
    profile_photo_path?: string;
    profile_photo_url?: string;
} | null | undefined;

function userName(u?: AnyUser): string {
    if (!u) return '';
    if (u.real_name?.trim()) return u.real_name.trim();
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return full || '';
}

function userDisplayName(u?: AnyUser): string {
    return userName(u) || 'Unknown';
}

function initials(u?: AnyUser): string {
    const name = userName(u);
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function userPhoto(u?: AnyUser): string | null {
    if (!u) return null;
    return photoUrl(u.profile_photo_path) ?? photoUrl(u.profile_photo_url) ?? null;
}

// ─── Role-based routes ─────────────────────────────────────────────────────────
const BASE: Record<UserRole, {
    chat: string; support: string; ideas: string;
    chatMgmt: string | null; supportMgmt: string | null; ideasMgmt: string | null;
}> = {
    admin:       {
        chat: '/admin/chat',       support: '/admin/support',       ideas: '/admin/suggestions',
        chatMgmt: '/admin/chat-management',    supportMgmt: '/admin/support-management',    ideasMgmt: '/admin/ideas-management',
    },
    staff:       {
        chat: '/staff/chat',       support: '/staff/support',       ideas: '/staff/suggestions',
        chatMgmt: '/staff/chat-management',    supportMgmt: '/staff/support-management',    ideasMgmt: '/staff/ideas-management',
    },
    team_leader: {
        chat: '/team-leader/chat', support: '/team-leader/support', ideas: '/team-leader/suggestions',
        chatMgmt: null, supportMgmt: null, ideasMgmt: null,
    },
    teacher:     {
        chat: '/teacher/chat',     support: '/teacher/support',     ideas: '/teacher/suggestions',
        chatMgmt: null, supportMgmt: null, ideasMgmt: null,
    },
};
function chatHref(role: UserRole, id?: number): string {
    const b = BASE[role]?.chat ?? '/teacher/chat';
    return id ? `${b}/${id}` : b;
}
function supportHref(role: UserRole, id?: number): string {
    const b = BASE[role]?.support ?? '/teacher/support';
    return id ? `${b}/${id}` : b;
}
function ideasHref(role: UserRole, id?: number): string {
    const b = BASE[role]?.ideas ?? '/teacher/suggestions';
    return id ? `${b}/${id}` : b;
}
/** Management full-page URL — null for roles without access (teacher, team_leader) */
function chatMgmtHref(role: UserRole): string | null   { return BASE[role]?.chatMgmt ?? null; }
function supportMgmtHref(role: UserRole): string | null { return BASE[role]?.supportMgmt ?? null; }
function ideasMgmtHref(role: UserRole): string | null   { return BASE[role]?.ideasMgmt ?? null; }

// ─── Status configs ────────────────────────────────────────────────────────────
const TICKET_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    new:         { label: 'New',         color: '#0369a1', bg: '#e0f2fe' },
    open:        { label: 'Open',        color: '#0369a1', bg: '#e0f2fe' },
    under_review:{ label: 'In Review',   color: '#b45309', bg: '#fef3c7' },
    assigned:    { label: 'Assigned',    color: '#6d28d9', bg: '#ede9fe' },
    in_progress: { label: 'In Progress', color: '#0d1b3e', bg: '#e0e7ff' },
    resolved:    { label: 'Resolved',    color: '#15803d', bg: '#dcfce7' },
    closed:      { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6' },
};
const TICKET_PRIORITY: Record<string, { label: string; color: string; bg: string }> = {
    low:      { label: 'Low',      color: '#6b7280', bg: '#f3f4f6' },
    medium:   { label: 'Medium',   color: '#0369a1', bg: '#e0f2fe' },
    high:     { label: 'High',     color: '#c2410c', bg: '#fff7ed' },
    critical: { label: 'Critical', color: '#b91c1c', bg: '#fee2e2' },
    urgent:   { label: 'Urgent',   color: '#b91c1c', bg: '#fee2e2' },
};
const SUGGESTION_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    submitted:      { label: 'Submitted',     color: '#0369a1', bg: '#e0f2fe' },
    pending:        { label: 'Pending',       color: '#6b7280', bg: '#f3f4f6' },
    under_review:   { label: 'In Review',     color: '#b45309', bg: '#fef3c7' },
    planned:        { label: 'Planned',       color: '#6d28d9', bg: '#ede9fe' },
    in_development: { label: 'In Dev',        color: '#0d1b3e', bg: '#e0e7ff' },
    implemented:    { label: 'Implemented ✓', color: '#15803d', bg: '#dcfce7' },
    rejected:       { label: 'Rejected',      color: '#b91c1c', bg: '#fee2e2' },
};
const STATUS_ONLINE: Record<OnlineStatus, { label: string; color: string }> = {
    online:  { label: 'Online',  color: '#22c55e' },
    away:    { label: 'Away',    color: '#f59e0b' },
    busy:    { label: 'Busy',    color: '#ef4444' },
    offline: { label: 'Offline', color: '#9ca3af' },
};

// ─── CSRF fetch util ───────────────────────────────────────────────────────────
async function apiFetch(url: string, opts: RequestInit = {}): Promise<Response> {
    const isWrite = opts.method && ['POST','PUT','PATCH','DELETE'].includes(opts.method.toUpperCase());
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

async function apiGet<T>(url: string): Promise<T | null> {
    try {
        const r = await apiFetch(url);
        if (!r.ok) return null;
        const j = await r.json();
        return j.success ? (j.data ?? null) : null;
    } catch { return null; }
}

async function apiPost<T>(url: string, body: unknown): Promise<{ success: boolean; data?: T; message?: string; errors?: Record<string, string[]>; [key: string]: unknown }> {
    try {
        const isForm = body instanceof FormData;
        const r = await apiFetch(url, { method: 'POST', body: isForm ? body : JSON.stringify(body) });
        return await r.json();
    } catch { return { success: false, message: 'Network error' }; }
}

// ─── Tab definitions ───────────────────────────────────────────────────────────
type Tab = 'chat' | 'support' | 'ideas';
const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'chat',    label: 'Chat',    Icon: MessageSquare },
    { id: 'support', label: 'Support', Icon: Ticket        },
    { id: 'ideas',   label: 'Ideas',   Icon: Lightbulb     },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function Spinner({ label }: { label?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: G0 }} />
            {label && <p className="text-xs text-gray-400">{label}</p>}
        </div>
    );
}

function Empty({ Icon = MessageSquare, title, sub }: { Icon?: React.ElementType; title: string; sub?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
            <Icon className="w-8 h-8 text-gray-200" />
            <p className="text-sm font-semibold text-gray-500">{title}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
    );
}

// Universal Avatar — resolves photo from either profile_photo_path or profile_photo_url
function Avatar({ user, size = 8 }: { user?: AnyUser; size?: number }) {
    const sz = `${size * 4}px`;
    const [err, setErr] = useState(false);
    const url = userPhoto(user);
    if (url && !err) {
        return (
            <img
                src={url}
                className="rounded-full object-cover flex-shrink-0"
                style={{ width: sz, height: sz }}
                onError={() => setErr(true)}
            />
        );
    }
    return (
        <div
            className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-black"
            style={{ width: sz, height: sz, background: GS, fontSize: `${size * 1.5}px` }}
        >
            {initials(user)}
        </div>
    );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ color, background: bg }}>
            {label}
        </span>
    );
}

// ─── Facebook-style "seen by" row ─────────────────────────────────────────────
// Shows up to 5 small avatar circles of people who read the message
function SeenAvatars({ reads, myId }: { reads?: MsgRead[]; myId: number }) {
    if (!reads || reads.length === 0) return null;
    // exclude myself
    const others = reads.filter(r => r.user_id !== myId);
    if (others.length === 0) return null;
    const shown = others.slice(0, 5);
    const extra = others.length - shown.length;
    return (
        <div className="flex items-center gap-0.5 mt-0.5 justify-end">
            {shown.map((r, i) => (
                <div key={r.user_id} className="relative" style={{ zIndex: shown.length - i }}>
                    <Avatar user={r.user} size={4} />
                </div>
            ))}
            {extra > 0 && (
                <span className="text-[9px] text-gray-400 ml-0.5">+{extra}</span>
            )}
        </div>
    );
}

// ─── Online presence hook ──────────────────────────────────────────────────────
function useOnlineStatus(userId?: number): {
    myStatus: OnlineStatus;
    setMyStatus: (s: OnlineStatus) => void;
} {
    const [myStatus, setMyStatusState] = useState<OnlineStatus>('online');

    const setMyStatus = useCallback((s: OnlineStatus) => {
        setMyStatusState(s);
        if (userId) localStorage.setItem(`mn2_status_${userId}`, s);
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const stored = localStorage.getItem(`mn2_status_${userId}`) as OnlineStatus | null;
        if (stored) setMyStatusState(stored);
    }, [userId]);

    return { myStatus, setMyStatus };
}

// ════════════════════════════════════════════════════════════════════════════
// PEOPLE PANEL
// ════════════════════════════════════════════════════════════════════════════
function GroupMemberRow({ c, checked, onToggle }: { c: Colleague; checked: boolean; onToggle: () => void }) {
    return (
        <button onClick={onToggle}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
            <Avatar user={c} size={9} />
            <p className="flex-1 text-xs font-semibold text-gray-800 text-left truncate">{userDisplayName(c)}</p>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'border-transparent' : 'border-gray-300'}`}
                style={checked ? { background: G0 } : {}}>
                {checked && <Check className="w-3 h-3 text-white" />}
            </div>
        </button>
    );
}

function MentionRow({ c, onSelect }: { c: Colleague; onSelect: () => void }) {
    return (
        <button onClick={onSelect}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left">
            <Avatar user={c} size={7} />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{userDisplayName(c)}</p>
                <p className="text-[10px] text-gray-400 capitalize">{c.role.replace('_', ' ')}</p>
            </div>
        </button>
    );
}

function PersonRow({ c, onStartDM, startingDM }: { c: Colleague; onStartDM: (c: Colleague) => void; startingDM: number | null }) {
    const isStarting = startingDM === c.id;
    const status = c.online_status ?? 'offline';
    const STATUS_COLORS: Record<OnlineStatus, string> = { online: '#22c55e', away: '#f59e0b', busy: '#ef4444', offline: '#9ca3af' };
    const STATUS_LABELS: Record<OnlineStatus, string> = { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' };
    const ROLE_LABELS: Record<UserRole, string> = { admin: 'Admin', team_leader: 'Team Leader', teacher: 'Teacher', staff: 'Staff' };
    return (
        <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors">
            <div className="relative flex-shrink-0">
                <Avatar user={c} size={10} />
                <span className="absolute -bottom-0.5 -right-0.5 block w-3 h-3 rounded-full border-2 border-white"
                    style={{ background: STATUS_COLORS[status] }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{userDisplayName(c)}</p>
                <p className="text-[11px]">
                    <span style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>
                    <span className="text-gray-300 mx-1">·</span>
                    <span className="text-gray-400">{ROLE_LABELS[c.role]}</span>
                </p>
            </div>
            <button onClick={() => onStartDM(c)} disabled={isStarting}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-all disabled:opacity-50 flex-shrink-0 hover:opacity-85 active:scale-95"
                style={{ background: GS }}>
                {isStarting ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <MessageCircle className="w-4 h-4 text-white" />}
            </button>
        </div>
    );
}

function PeoplePanel({ user, role, onStartDM, onClose }: {
    user: AuthUser; role: UserRole;
    onStartDM: (convId: number, colleague: Colleague) => void;
    onClose: () => void;
}) {
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [startingDM, setStartingDM] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const r = await apiFetch('/api/branch-teachers');
            if (r.status === 403) { setError('Permission denied.'); setLoading(false); return; }
            if (!r.ok) { setError('Could not load colleagues.'); setLoading(false); return; }
            const j = await r.json();
            if (j.success && Array.isArray(j.data)) {
                const list: Colleague[] = (j.data as Colleague[])
                    .filter(c => c.id !== user.id)
                    .map((c, i) => ({
                        ...c,
                        online_status: getStoredStatus(c.id) !== 'offline'
                            ? getStoredStatus(c.id)
                            : (i % 3 === 0 ? 'online' : i % 5 === 0 ? 'away' : 'offline') as OnlineStatus,
                    }));
                setColleagues(list);
            }
        } catch { setError('Network error.'); }
        setLoading(false);
    }, [user.id]);

    useEffect(() => { load(); }, [load]);

    async function startDM(targetColleague: Colleague) {
        setStartingDM(targetColleague.id);
        try {
            const res = await apiPost<{ id: number } | Conversation>('/api/conversations/direct', { user_id: targetColleague.id });
            if (res.success && res.data) {
                const convId = (res.data as { id: number }).id;
                if (convId) onStartDM(convId, targetColleague);
            }
        } finally { setStartingDM(null); }
    }

    const q = search.toLowerCase();
    const all = q ? colleagues.filter(c => userDisplayName(c).toLowerCase().includes(q)) : colleagues;
    const active  = all.filter(c => c.online_status && c.online_status !== 'offline');
    const offline = all.filter(c => !c.online_status || c.online_status === 'offline');

    return (
        <div className="flex flex-col h-full">
            <div className="px-3 pt-3 pb-2 flex gap-2 flex-shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search colleagues…"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none" />
                </div>
                <button onClick={load} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pb-2">
                {loading ? <Spinner label="Loading colleagues…" />
                : error ? (
                    <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                        <AlertCircle className="w-8 h-8 text-red-300" />
                        <p className="text-xs text-gray-500">{error}</p>
                        <button onClick={load} className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Try again</button>
                    </div>
                ) : colleagues.length === 0 ? (
                    <Empty Icon={Users} title="No colleagues found" sub="Your branch-mates will appear here" />
                ) : (
                    <>
                        {active.length > 0 && (
                            <div>
                                <div className="px-3 py-1.5 sticky top-0 bg-white z-10">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Active — {active.length}</p>
                                </div>
                                {active.map(c => <PersonRow key={c.id} c={c} onStartDM={startDM} startingDM={startingDM} />)}
                            </div>
                        )}
                        {offline.length > 0 && (
                            <div>
                                <div className="px-3 py-1.5 sticky top-0 bg-white z-10">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Offline — {offline.length}</p>
                                </div>
                                {offline.map(c => <PersonRow key={c.id} c={c} onStartDM={startDM} startingDM={startingDM} />)}
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2 text-center" style={{ background: '#f7f8fc' }}>
                <p className="text-[10px] text-gray-400">Tap <MessageCircle className="w-3 h-3 inline mx-0.5" /> to send a direct message</p>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE GROUP MODAL
// ════════════════════════════════════════════════════════════════════════════
function CreateGroupModal({ user, role, onCreated, onClose }: {
    user: AuthUser; role: UserRole;
    onCreated: (convId: number, name: string, iconUrl?: string) => void;
    onClose: () => void;
}) {
    const [name, setName]             = useState('');
    const [desc, setDesc]             = useState('');
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [selected, setSelected]     = useState<Set<number>>(new Set());
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch]         = useState('');
    const [err, setErr]               = useState('');
    // Icon state
    const [iconFile, setIconFile]     = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        (async () => {
            const data = await apiGet<Colleague[]>('/api/branch-teachers');
            if (data) setColleagues(data.filter(c => c.id !== user.id));
            setLoading(false);
        })();
    }, [user.id]);

    function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setIconFile(file);
        setIconPreview(URL.createObjectURL(file));
    }

    function removeIcon() {
        setIconFile(null);
        setIconPreview(null);
        if (iconInputRef.current) iconInputRef.current.value = '';
    }

    async function create() {
        if (!name.trim()) { setErr('Group name is required'); return; }
        if (selected.size === 0) { setErr('Add at least one member'); return; }
        setSubmitting(true);
        try {
            // Step 1: create the group (JSON — no icon yet)
            const res = await apiPost<{ id: number }>('/api/conversations', {
                name: name.trim(),
                description: desc.trim() || undefined,
                participant_ids: [...selected],
            });
            if (!res.success || !res.data) {
                setErr(res.message ?? 'Failed to create group');
                return;
            }
            const convId = (res.data as any).id as number;
            let finalIconUrl: string | undefined;

            // Step 2: if an icon was chosen, upload it via the update endpoint
            if (iconFile && convId) {
                const fd = new FormData();
                fd.append('icon', iconFile);
                fd.append('name', name.trim()); // required by update validation
                try {
                    const xsrf = document.cookie.split(';').reduce<string>((acc, c) => {
                        const [k, v] = c.trim().split('=');
                        return k === 'XSRF-TOKEN' ? decodeURIComponent(v) : acc;
                    }, '');
                    const r = await fetch(`/api/conversations/${convId}`, {
                        method: 'POST', // controller uses POST for update too
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                        },
                        credentials: 'include',
                        body: fd,
                    });
                    if (r.ok) {
                        const j = await r.json();
                        finalIconUrl = j?.data?.icon_url ?? undefined;
                    }
                } catch { /* icon upload failed — still open the group */ }
            }

            onCreated(convId, name.trim(), finalIconUrl);
        } finally {
            setSubmitting(false);
        }
    }

    const filtered = search
        ? colleagues.filter(c => userDisplayName(c).toLowerCase().includes(search.toLowerCase()))
        : colleagues;

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.50)' }} onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
                style={{ background: 'white', maxHeight: '82dvh', animation: 'mn2Panel 0.2s ease-out both' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: GS }}>
                    <p className="text-white font-black text-sm">New Group Chat</p>
                    <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                {/* Group icon + name + desc */}
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    {/* Icon picker row */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                            <button type="button"
                                onClick={() => iconInputRef.current?.click()}
                                className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors bg-gray-50 relative group"
                                title="Set group icon">
                                {iconPreview ? (
                                    <img src={iconPreview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Image className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                        <span className="text-[9px] text-gray-300 group-hover:text-gray-400 font-bold">ICON</span>
                                    </div>
                                )}
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                    <Image className="w-5 h-5 text-white" />
                                </div>
                            </button>
                            {iconPreview && (
                                <button onClick={removeIcon}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                                    title="Remove icon">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <input value={name} onChange={e => { setName(e.target.value); setErr(''); }}
                                placeholder="Group name *"
                                className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': `${G0}30` } as React.CSSProperties} />
                            <input value={desc} onChange={e => setDesc(e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': `${G0}30` } as React.CSSProperties} />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 -mt-1">
                        Tap the box to set a group icon (JPG, PNG, WebP · max 2 MB)
                    </p>
                    {err && <p className="text-[11px] text-red-500 mt-1">{err}</p>}
                    {/* Hidden file input */}
                    <input ref={iconInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg"
                        className="hidden" onChange={handleIconChange} />
                </div>

                {/* Member search */}
                <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search branch colleagues…"
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none" />
                    </div>
                    {selected.size > 0 && (
                        <p className="text-[10px] text-gray-500 mt-1.5">{selected.size} member{selected.size !== 1 ? 's' : ''} selected</p>
                    )}
                </div>

                {/* Member list */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? <Spinner label="Loading colleagues…" /> : filtered.map(c => (
                        <GroupMemberRow key={c.id} c={c} checked={selected.has(c.id)}
                            onToggle={() => setSelected(prev => {
                                const s = new Set(prev);
                                selected.has(c.id) ? s.delete(c.id) : s.add(c.id);
                                return s;
                            })} />
                    ))}
                </div>

                {/* Create button */}
                <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
                    <button onClick={create} disabled={submitting || !name.trim() || selected.size === 0}
                        className="w-full py-2.5 rounded-xl text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: GS }}>
                        {submitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" />{iconFile ? 'Creating & uploading icon…' : 'Creating…'}</>
                            : <><Users className="w-4 h-4" />Create Group ({selected.size} members)</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}


// ════════════════════════════════════════════════════════════════════════════
// CREATE ANNOUNCEMENT CHANNEL MODAL (Admin / Staff only)
// ════════════════════════════════════════════════════════════════════════════
type AudienceType = 'all_tl' | 'branch_teachers' | 'all_teachers' | 'custom';

function CreateAnnouncementModal({ user, onCreated, onClose }: {
    user: AuthUser;
    onCreated: (convId: number, name: string) => void;
    onClose: () => void;
}) {
    const [name, setName]         = useState('');
    const [desc, setDesc]         = useState('');
    const [audience, setAudience] = useState<AudienceType>('all_teachers');
    const [branchId, setBranchId] = useState<string>('');
    const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr]           = useState('');

    // Load branches for branch-specific targeting
    useEffect(() => {
        apiGet<{ id: number; name: string }[]>('/api/branches').then(data => {
            if (data) setBranches(data);
        });
    }, []);

    const AUDIENCE_OPTIONS: { id: AudienceType; label: string; desc: string; icon: string }[] = [
        { id: 'all_tl',          label: 'All Team Leaders',       desc: 'Every TL across all branches',        icon: '👥' },
        { id: 'branch_teachers', label: 'Branch Teachers',        desc: 'All teachers in a specific branch',   icon: '🏫' },
        { id: 'all_teachers',    label: 'All Teachers',           desc: 'Every teacher in all branches',       icon: '📚' },
        { id: 'custom',          label: 'Everyone (All roles)',   desc: 'All users in the system',             icon: '🌐' },
    ];

    async function create() {
        if (!name.trim()) { setErr('Channel name is required'); return; }
        if (audience === 'branch_teachers' && !branchId) { setErr('Please select a branch'); return; }
        setSubmitting(true);
        try {
            // Build participant_ids based on audience selection
            // The backend will resolve these via a dedicated endpoint or we pass the audience type
            const res = await apiPost<{ id: number }>('/api/conversations', {
                type: 'announcement',
                name: name.trim(),
                description: desc.trim() || undefined,
                participant_ids: [user.id],        // creator; backend adds more based on audience
                audience_type: audience,           // backend resolves this to actual user IDs
                audience_branch_id: audience === 'branch_teachers' ? Number(branchId) : undefined,
            });
            setSubmitting(false);
            if (res.success && res.data) {
                onCreated((res.data as any).id, name.trim());
            } else {
                const errMsg = res.errors
                    ? Object.values(res.errors).flat().join(' ')
                    : res.message ?? 'Failed to create channel';
                setErr(errMsg);
            }
        } catch {
            setSubmitting(false);
            setErr('Network error. Please try again.');
        }
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.50)' }} onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
                style={{ background: 'white', maxHeight: '82dvh', animation: 'mn2Panel 0.2s ease-out both' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#b45309,#d97706)' }}>
                    <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-white" />
                        <p className="text-white font-black text-sm">New Announcement Channel</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Info banner */}
                <div className="px-4 py-2.5 flex items-start gap-2 flex-shrink-0"
                    style={{ background: '#fef9ec', borderBottom: '1px solid #fde68a' }}>
                    <Bell className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-snug">
                        Only <strong>Admins</strong> and <strong>Staff</strong> with permission can post.
                        Selected members can read.
                    </p>
                </div>

                {/* Fields */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {/* Name */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1">
                            Channel Name *
                        </label>
                        <input value={name} onChange={e => { setName(e.target.value); setErr(''); }}
                            placeholder="e.g. MN2 Announcements"
                            className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': '#d9770640' } as React.CSSProperties} />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1">
                            Description
                        </label>
                        <textarea value={desc} onChange={e => setDesc(e.target.value)}
                            placeholder="What is this channel for? (optional)"
                            rows={2}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none resize-none" />
                    </div>

                    {/* Audience */}
                    <div>
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-2">
                            Who can see this channel?
                        </label>
                        <div className="space-y-1.5">
                            {AUDIENCE_OPTIONS.map(opt => (
                                <button key={opt.id} type="button"
                                    onClick={() => { setAudience(opt.id); setErr(''); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all"
                                    style={audience === opt.id
                                        ? { borderColor: '#d97706', background: '#fef9ec' }
                                        : { borderColor: '#e5e7eb', background: 'white' }}>
                                    <span className="text-base flex-shrink-0">{opt.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-gray-800">{opt.label}</p>
                                        <p className="text-[10px] text-gray-400">{opt.desc}</p>
                                    </div>
                                    <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                                        style={audience === opt.id
                                            ? { borderColor: '#d97706', background: '#d97706' }
                                            : { borderColor: '#d1d5db' }}>
                                        {audience === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Branch selector for branch_teachers */}
                        {audience === 'branch_teachers' && (
                            <div className="mt-2">
                                <select value={branchId} onChange={e => setBranchId(e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-xl border-2 border-amber-200 bg-amber-50 focus:outline-none"
                                    style={{ color: '#92400e' }}>
                                    <option value="">Select branch…</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {err && <p className="text-[11px] text-red-500 font-semibold">{err}</p>}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
                    <button onClick={onClose}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={create} disabled={submitting || !name.trim()}
                        className="flex-1 py-2 rounded-xl text-white text-xs font-black disabled:opacity-40 flex items-center justify-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg,#b45309,#d97706)' }}>
                        {submitting
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Megaphone className="w-3.5 h-3.5" />
                        }
                        Create Channel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAT PANEL
// ════════════════════════════════════════════════════════════════════════════
type ChatView = 'list' | 'thread' | 'people';

function ChatPanel({ user, role, onClose }: { user: AuthUser; role: UserRole; onClose: () => void }) {
    const [view, setView]               = useState<ChatView>('list');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading]         = useState(false);
    const [search, setSearch]           = useState('');
    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [threadDisplayName, setThreadDisplayName] = useState<string | undefined>(undefined);
    const [filterType, setFilterType]   = useState<'all' | 'direct' | 'group' | 'announcement'>('all');
    const [showCreateGroup, setShowCreateGroup]               = useState(false);
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const canManageAnnouncement = role === 'admin' || role === 'staff';

    // initialConvoLoad: show spinner only on first load, not on background polls
    const initialConvoLoad = useRef(false);

    const loadConvos = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const data = await apiGet<Conversation[]>('/api/conversations?per_page=50');
        if (data) {
            setConversations(prev => {
                // Smooth merge: preserve existing order, update fields, append new
                if (!initialConvoLoad.current || prev.length === 0) {
                    initialConvoLoad.current = true;
                    return data;
                }
                const freshById = new Map(data.map(c => [c.id, c]));
                const freshIds  = new Set(data.map(c => c.id));
                // Remove conversations that are no longer in the fresh list
                // (e.g. after leaving a group — they disappear from forUser scope)
                const stillMember = prev.filter(c => freshIds.has(c.id));
                // Update existing conversations in place (keeps scroll position stable)
                const updated = stillMember.map(c => freshById.get(c.id) ?? c);
                // Append any brand-new conversations not yet in list
                const existingIds = new Set(stillMember.map(c => c.id));
                const newConvs = data.filter(c => !existingIds.has(c.id));
                return newConvs.length > 0 ? [...updated, ...newConvs] : updated;
            });
        }
        if (!silent) setLoading(false);
    }, []);

    useEffect(() => { loadConvos(); }, [loadConvos]);
    // Background poll — silent so no spinner/re-mount glitch
    useEffect(() => {
        const iv = setInterval(() => loadConvos(true), 8_000);
        return () => clearInterval(iv);
    }, [loadConvos]);

    const totalUnread = conversations.reduce((s, c) => s + (c.unread_count ?? 0), 0);

    function convLabel(c: Conversation): string {
        if (c.name) return c.name;
        if (c.display_name) return c.display_name;
        if (c.type === 'direct') {
            const other = getParticipants(c).find(p => p.user_id !== user.id);
            return userName(other?.user) || 'Direct Message';
        }
        return 'Conversation';
    }

    function ConvAvatar({ c }: { c: Conversation }) {
        const [iconErr, setIconErr] = useState(false);
        if (c.type === 'direct') {
            const other = getParticipants(c).find(p => p.user_id !== user.id);
            return (
                <div className="relative flex-shrink-0">
                    <Avatar user={other?.user} size={11} />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-400 block" />
                </div>
            );
        }
        // Custom group with an uploaded icon
        if (c.icon_url && !iconErr) {
            return (
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-gray-100">
                    <img src={c.icon_url} className="w-full h-full object-cover"
                        onError={() => setIconErr(true)} />
                </div>
            );
        }
        const colors: Record<string, string> = { announcement: '#d97706', group: G1, branch_group: '#0d9488', custom: '#7c3aed', team_leaders: '#0369a1', staff_group: '#7c3aed' };
        const icons: Record<string, React.ElementType> = { announcement: Megaphone, group: Users, branch_group: Users, custom: Users, team_leaders: Users, staff_group: Users };
        const Icon = icons[c.type] ?? MessageCircle;
        return (
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: colors[c.type] ?? G0 }}>
                <Icon className="w-5 h-5" />
            </div>
        );
    }

    const filtered = conversations.filter(c => {
        if (filterType !== 'all') {
            if (filterType === 'group' && !['group','branch_group','custom','team_leaders','staff_group'].includes(c.type)) return false;
            if (filterType === 'direct' && c.type !== 'direct') return false;
            if (filterType === 'announcement' && c.type !== 'announcement') return false;
        }
        if (!search) return true;
        return convLabel(c).toLowerCase().includes(search.toLowerCase());
    });

    if (view === 'people') return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={() => setView('list')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <p className="text-xs font-black" style={{ color: G0 }}>People — Branch Colleagues</p>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
                <PeoplePanel user={user} role={role}
                    onStartDM={(convId, colleague) => {
                        setActiveConvId(convId);
                        setThreadDisplayName(userDisplayName(colleague));
                        setView('thread');
                        loadConvos();
                    }} onClose={onClose} />
            </div>
        </div>
    );

    if (view === 'thread' && activeConvId !== null) return (
        <ChatThread conversationId={activeConvId} user={user}
            conversation={conversations.find(c => c.id === activeConvId)}
            displayName={threadDisplayName}
            onBack={() => { setView('list'); setThreadDisplayName(undefined); loadConvos(true); }}
            onClose={onClose} />
    );

    return (
        <div className="flex flex-col h-full">
            {showCreateGroup && (
                <CreateGroupModal user={user} role={role}
                    onCreated={(convId, name, iconUrl) => {
                        setShowCreateGroup(false);
                        setActiveConvId(convId);
                        setThreadDisplayName(name);
                        setView('thread');
                        loadConvos();
                    }}
                    onClose={() => setShowCreateGroup(false)} />
            )}
            {showCreateAnnouncement && (
                <CreateAnnouncementModal user={user}
                    onCreated={(convId, name) => {
                        setShowCreateAnnouncement(false);
                        setActiveConvId(convId);
                        setThreadDisplayName(name);
                        setView('thread');
                        loadConvos(true);
                    }}
                    onClose={() => setShowCreateAnnouncement(false)} />
            )}

            <div className="px-3 pt-3 pb-2 flex gap-1.5 flex-shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search conversations…"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none placeholder-gray-400" />
                </div>
                <button onClick={() => setShowCreateGroup(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Create group chat">
                    <Plus className="w-4 h-4" />
                </button>
                {canManageAnnouncement && (
                    <button onClick={() => setShowCreateAnnouncement(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-amber-50 flex-shrink-0"
                        style={{ color: '#d97706' }} title="Create announcement channel">
                        <Megaphone className="w-4 h-4" />
                    </button>
                )}
                <button onClick={() => setView('people')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="People">
                    <Users className="w-4 h-4" />
                </button>
                <button onClick={loadConvos}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
               
                {chatMgmtHref(role) && (
                    <Link href={chatMgmtHref(role)!} onClick={onClose}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 whitespace-nowrap"
                        style={{ color: G0 }} title="Manage all conversations">
                        <Shield className="w-3.5 h-3.5" />Manage
                    </Link>
                )}
            </div>

            <div className="px-3 pb-2 flex gap-1.5 flex-shrink-0 overflow-x-auto">
                {(['all','direct','group','announcement'] as const).map(f => (
                    <button key={f} onClick={() => setFilterType(f)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all"
                        style={filterType === f ? { background: G0, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                        {f === 'all' ? `All${totalUnread > 0 ? ` (${totalUnread})` : ''}` : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? <Spinner label="Loading conversations…" />
                : filtered.length === 0 ? (
                    <Empty Icon={MessageSquare}
                        title={search ? 'No results' : (
                            filterType === 'announcement' ? 'No announcement channels' :
                            filterType === 'direct'       ? 'No direct messages' :
                            filterType === 'group'        ? 'No group chats' :
                            'No conversations'
                        )}
                        sub={
                            filterType === 'announcement' ? (canManageAnnouncement ? 'Tap the 📣 button above to create a channel' : 'Announcement channels are created by admins') :
                            filterType === 'direct'       ? 'Tap People to message a colleague' :
                            filterType === 'group'        ? 'Tap + to create a group chat' :
                            'Tap + to create a group or People to message a colleague'
                        } />
                ) : filtered.map(conv => {
                    const unread = conv.unread_count ?? 0;
                    const label  = convLabel(conv);
                    return (
                        <button key={conv.id}
                            onClick={() => { setActiveConvId(conv.id); setThreadDisplayName(undefined); setView('thread'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                            <ConvAvatar c={conv} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-sm truncate ${unread > 0 ? 'font-black' : 'font-semibold text-gray-800'}`}
                                        style={unread > 0 ? { color: G0 } : {}}>
                                        {label}
                                    </p>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                                        {ago(getLastMessage(conv)?.created_at)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-1 mt-0.5">
                                    <p className={`text-[11px] truncate ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                        {(() => {
    const lm = getLastMessage(conv);
    const preview = getPreviewText(lm, conv.unread_count ?? 0);
    const sender = lm?.sender?.first_name;
    // Only prefix sender name for group convos and for non-system messages
    return (sender && conv.type !== 'direct' && !preview.startsWith('•') && !preview.startsWith('📢'))
        ? `${sender}: ${preview}`
        : preview;
})()}
                                    </p>
                                    {unread > 0 && (
                                        <span className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-black text-[9px]"
                                            style={{ background: G0, minWidth: '1.1rem', height: '1.1rem', padding: '0 3px' }}>
                                            {unread > 9 ? '9+' : unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2" style={{ background: '#f7f8fc' }}>
                <div className="flex gap-2">
                    <button onClick={() => setShowCreateGroup(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50"
                        style={{ color: G0 }}>
                        <Plus className="w-3.5 h-3.5" />New Group
                    </button>
                    {canManageAnnouncement ? (
                        <button onClick={() => setShowCreateAnnouncement(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-amber-50"
                            style={{ color: '#d97706' }}>
                            <Megaphone className="w-3.5 h-3.5" />Channel
                        </button>
                    ) : (
                        <button onClick={() => setView('people')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50"
                            style={{ color: G0 }}>
                            <Users className="w-3.5 h-3.5" />People
                        </button>
                    )}
                   
                    {chatMgmtHref(role) && (
                        <Link href={chatMgmtHref(role)!} onClick={onClose}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-red-50 transition-colors"
                            style={{ color: '#b91c1c' }}>
                            <Shield className="w-3.5 h-3.5" />Manage
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAT THREAD — Fixed: profile photos, ordering, reactions, sound, seen
// ════════════════════════════════════════════════════════════════════════════
interface ChatThreadProps {
    conversationId: number;
    user: AuthUser;
    conversation?: Conversation;
    displayName?: string;
    onBack: () => void;
    onClose: () => void;
}

// ── Module-level reaction normalization helpers ──────────────────────────────
// Defined outside any component so they are always stable (no stale closure risk).
// The backend's getReactionSummary() uses Laravel mapWithKeys() which can serialize
// as a plain object {"👍":5} instead of an array. Normalize both shapes to Reaction[].
function normalizeReactions(raw: unknown): Reaction[] {
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
    // Legacy object shape: { "👍": 5 } or { "👍": { count, reacted } }
    if (typeof raw === 'object' && raw !== null) {
        return Object.entries(raw as Record<string, unknown>)
            .map(([emoji, val]) => ({
                emoji,
                count:    typeof val === 'number' ? val : Number((val as any)?.count ?? 1),
                reacted:  typeof val === 'object' && val !== null ? Boolean((val as any)?.reacted) : false,
                user_ids: [],
                users:    [],
            }))
            .filter(r => r.count > 0);
    }
    return [];
}

function normalizeMessages(msgs: Message[]): Message[] {
    return msgs.map(m => ({ ...m, reaction_summary: normalizeReactions(m.reaction_summary) }));
}

function ChatThread({ conversationId, user, conversation, displayName, onBack, onClose }: ChatThreadProps) {
    const [messages, setMessages]           = useState<Message[]>([]);
    const [loading, setLoading]             = useState(false);
    const [sending, setSending]             = useState(false);
    const [body, setBody]                   = useState('');
    const [replyTo, setReplyTo]             = useState<Message | null>(null);
    const [attachments, setAttachments]     = useState<File[]>([]);
    const [showReactions, setShowReactions] = useState<number | null>(null);
    // Reactor popup: { msgId, emoji } — null = closed
    const [showReactors, setShowReactors]   = useState<{ msgId: number; emoji: string } | null>(null);
    const [mentionList, setMentionList]     = useState<Colleague[]>([]);
    const [showMentions, setShowMentions]   = useState(false);
    const [headerImgErr, setHeaderImgErr]   = useState(false);
    const [showGroupMenu, setShowGroupMenu]       = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [leaving, setLeaving]                   = useState(false);
    const [leftGroup, setLeftGroup]               = useState(false);

    const bottomRef   = useRef<HTMLDivElement>(null);
    const fileRef     = useRef<HTMLInputElement>(null);
    const imgRef      = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const menuRef     = useRef<HTMLDivElement>(null);
    // track highest known message id so polling only fetches new ones
    const lastMsgIdRef = useRef<number>(0);
    // track if initial load is done (to avoid sounding on first load)
    const initialLoadDone = useRef(false);

    const EMOJIS = ['👍','❤️','😂','😮','😢','🎉','🔥','👏','✅','💯'];

    const mentionableMembers: Colleague[] = getParticipants(conversation ?? {} as Conversation)
        .filter(p => p.user_id !== user.id && p.user)
        .map(p => ({
            id: p.user!.id,
            first_name: p.user!.first_name,
            last_name: p.user!.last_name,
            real_name: p.user!.real_name,
            profile_photo_path: p.user!.profile_photo_path,
            profile_photo_url: p.user!.profile_photo_url,
            role: 'teacher' as UserRole,
        }));

    // ── Load initial messages ─────────────────────────────────────────────────
    // Controller returns oldestFirst paginated — page 1 = oldest 50.
    // Fetch per_page=100 so we get more history, then take the last 50
    // (most recent) for display. This ensures group chats with many messages
    // show the latest content, not messages from months ago.
    const loadMessages = useCallback(async () => {
        setLoading(true);
        const data = await apiGet<Message[]>(`/api/conversations/${conversationId}/messages?per_page=100`);
        if (data) {
            const normalized = normalizeMessages(data);
            const latest = normalized.length > 50 ? normalized.slice(-50) : normalized;
            setMessages(latest);
            if (latest.length > 0) {
                lastMsgIdRef.current = Math.max(...latest.map(m => m.id));
            }
        }
        setLoading(false);
        apiFetch(`/api/conversations/${conversationId}/mark-read`, { method: 'POST' }).catch(() => {});
        setTimeout(() => { initialLoadDone.current = true; }, 1000);
    }, [conversationId]);

    useEffect(() => { loadMessages(); }, [loadMessages]);

    // ── Scroll to bottom when messages change ────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // ── Poll for new messages every 5s ────────────────────────────────────────
    // We re-fetch the latest page and append only unknown IDs.
    // The controller doesn't have after_id so we use a full re-fetch and dedupe.
    useEffect(() => {
        const iv = setInterval(async () => {
            if (!initialLoadDone.current) return;
            const data = await apiGet<Message[]>(`/api/conversations/${conversationId}/messages?per_page=100`);
            if (!data) return; // 403/404 — silently skip this tick
            const normalized = normalizeMessages(data);
            // Build a lookup of fresh server data keyed by message id
            const freshById = new Map(normalized.map(m => [m.id, m]));
            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMsgs = normalized.filter(m => !existingIds.has(m.id));
                const hasIncoming = newMsgs.some(m => m.sender_id !== user.id);
                if (hasIncoming) playNewMessageSound();
                if (normalized.length > 0) {
                    lastMsgIdRef.current = Math.max(lastMsgIdRef.current, ...normalized.map(m => m.id));
                }
                // Always merge: update reaction_summary + reads on every existing
                // message so reactions from others appear immediately on next poll.
                const merged = prev.map(m => {
                    const fresh = freshById.get(m.id);
                    if (!fresh) return m;
                    // Only replace if something actually changed to avoid re-renders
                    const reactionsChanged =
                        JSON.stringify(fresh.reaction_summary) !== JSON.stringify(m.reaction_summary);
                    const readsChanged =
                        (fresh.reads?.length ?? 0) !== (m.reads?.length ?? 0);
                    if (!reactionsChanged && !readsChanged) return m;
                    return {
                        ...m,
                        reaction_summary: fresh.reaction_summary,
                        reads: fresh.reads ?? m.reads,
                        is_read_by_me: fresh.is_read_by_me ?? m.is_read_by_me,
                    };
                });
                if (newMsgs.length === 0) return merged;
                return [...merged, ...newMsgs];
            });
            apiFetch(`/api/conversations/${conversationId}/mark-read`, { method: 'POST' }).catch(() => {});
        }, 3_000);
        return () => clearInterval(iv);
    }, [conversationId, user.id]);

    // ── Outside click handlers ────────────────────────────────────────────────
    useEffect(() => {
        function h(e: MouseEvent) {
            if (!menuRef.current?.contains(e.target as Node)) setShowGroupMenu(false);
        }
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // ── @mention handling ─────────────────────────────────────────────────────
    function handleBodyChange(val: string) {
        setBody(val);
        const match = val.match(/@(\w*)$/);
        if (match) {
            const q = match[1].toLowerCase();
            const list = mentionableMembers.filter(c =>
                userDisplayName(c).toLowerCase().includes(q) ||
                (c.first_name ?? '').toLowerCase().startsWith(q)
            ).slice(0, 6);
            setMentionList(list);
            setShowMentions(list.length > 0);
        } else {
            setShowMentions(false);
        }
    }

    function insertMention(c: Colleague) {
        const name = userDisplayName(c);
        setBody(prev => prev.replace(/@\w*$/, `@${name} `));
        setShowMentions(false);
        setTimeout(() => textareaRef.current?.focus(), 0);
    }

    // ── Send message ──────────────────────────────────────────────────────────
    async function send() {
        const text = body.trim();
        if (!text && attachments.length === 0) return;
        setSending(true);
        try {
            let result: Message | null = null;
            if (attachments.length > 0) {
                const fd = new FormData();
                if (text) fd.append('body', text);
                if (replyTo) fd.append('reply_to_id', String(replyTo.id));
                attachments.forEach(f => fd.append('attachments[]', f));
                const res = await apiPost<Message>(`/api/conversations/${conversationId}/messages`, fd);
                if (res.success && res.data) result = res.data as Message;
            } else {
                const res = await apiPost<Message>(`/api/conversations/${conversationId}/messages`, {
                    body: text, ...(replyTo ? { reply_to_id: replyTo.id } : {}),
                });
                if (res.success && res.data) result = res.data as Message;
            }
            if (result) {
                // Normalize reaction_summary on the returned message too
                const normalized = { ...result, reaction_summary: normalizeReactions(result.reaction_summary) };
                setMessages(prev => {
                    if (prev.some(m => m.id === normalized.id)) return prev;
                    return [...prev, normalized];
                });
                lastMsgIdRef.current = Math.max(lastMsgIdRef.current, result.id);
            }
            setBody(''); setReplyTo(null); setAttachments([]);
        } finally { setSending(false); }
    }

    // ── Toggle reaction — optimistic, no refetch ──────────────────────────────
    // FIX: don't call setMessages inside the async callback to prevent re-ordering.
    // Instead update state synchronously first, then fire the API silently.
    async function toggleReaction(msgId: number, emoji: string) {
        setShowReactions(null);

        // Optimistic update — mutate only the reaction_summary, preserve message position
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            // Guard: ensure reaction_summary is always an array before calling .find()
            const existing: Reaction[] = Array.isArray(m.reaction_summary)
                ? m.reaction_summary
                : normalizeReactions(m.reaction_summary);
            const already = existing.find(r => r.emoji === emoji);
            let updated: Reaction[];
            if (already) {
                if (already.reacted) {
                    updated = existing
                        .map(r => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r)
                        .filter(r => r.count > 0);
                } else {
                    updated = existing.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r);
                }
            } else {
                updated = [...existing, { emoji, count: 1, reacted: true }];
            }
            // Return a new object but preserve the same reference position in the array
            return { ...m, reaction_summary: updated };
        }));

        // Fire API — response has { success, added, summary } not { success, data }
        // We intentionally ignore the server response to prevent a re-render that would
        // flash/reorder messages. The optimistic update is sufficient.
        apiFetch(`/api/conversations/${conversationId}/messages/${msgId}/react`, {
            method: 'POST',
            body: JSON.stringify({ emoji }),
        }).catch(() => {});
    }

    async function deleteMsg(msgId: number) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        apiFetch(`/api/conversations/${conversationId}/messages/${msgId}`, { method: 'DELETE' }).catch(() => {});
    }

    async function pinMsg(msgId: number, currentlyPinned: boolean) {
        const action = currentlyPinned ? 'unpin' : 'pin';
        // Optimistic update first
        setMessages(prev => prev.map(m =>
            m.id === msgId ? { ...m, is_pinned: !currentlyPinned } : m
        ));
        try {
            const r = await apiFetch(
                `/api/conversations/${conversationId}/messages/${msgId}/${action}`,
                { method: 'POST' }
            );
            if (!r.ok) {
                // Revert on failure (403 = not admin, 404 = not found)
                setMessages(prev => prev.map(m =>
                    m.id === msgId ? { ...m, is_pinned: currentlyPinned } : m
                ));
            }
        } catch {
            // Revert on network error
            setMessages(prev => prev.map(m =>
                m.id === msgId ? { ...m, is_pinned: currentlyPinned } : m
            ));
        }
    }

    // Edit state — inline in-bubble editing
    const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
    const [editBody, setEditBody]         = useState('');
    const editRef = useRef<HTMLTextAreaElement>(null);

    function startEdit(msg: Message) {
        setEditingMsgId(msg.id);
        setEditBody(msg.body ?? '');
        setTimeout(() => editRef.current?.focus(), 0);
    }

    async function submitEdit(msgId: number) {
        const text = editBody.trim();
        if (!text) return;
        setMessages(prev => prev.map(m =>
            m.id === msgId ? { ...m, body: text, is_edited: true } : m
        ));
        setEditingMsgId(null);
        apiFetch(`/api/conversations/${conversationId}/messages/${msgId}`, {
            method: 'PUT',
            body: JSON.stringify({ body: text }),
        }).catch(() => {});
    }



    async function leaveGroup() {
        setShowLeaveConfirm(false);
        setLeaving(true);
        const r = await apiFetch(`/api/conversations/${conversationId}/leave`, { method: 'POST' });
        setLeaving(false);
        if (r.ok) {
            setLeftGroup(true);
            // Go back immediately — onBack triggers loadConvos() in ChatPanel
            // which will re-fetch and the left conversation won't appear
            setTimeout(onBack, 800);
        }
    }

    // ── Display helpers ───────────────────────────────────────────────────────
    const otherUser = conversation?.type === 'direct'
        ? getParticipants(conversation).find(p => p.user_id !== user.id)?.user
        : undefined;

    function convLabel(): string {
        if (displayName) return displayName;
        if (conversation?.name) return conversation.name;
        if (conversation?.display_name) return conversation.display_name;
        if (conversation?.type === 'direct') {
            const n = userName(otherUser);
            if (n) return n;
        }
        return 'Direct Message';
    }

    const isDM = conversation?.type === 'direct' || (!conversation?.name && !!displayName);
    const participants = getParticipants(conversation ?? {} as Conversation);
    // Last message sent by ME (for seen indicators)
    const lastMyMsg = [...messages].reverse().find(m => m.sender_id === user.id);

    // Announcement channel: only admins / can_post_announcements members may send
    const isAnnouncement = conversation?.type === 'announcement';
    const myParticipant  = participants.find(p => p.user_id === user.id);
    const canPostAnnouncement = !isAnnouncement || (
        myParticipant?.is_admin === true ||
        myParticipant?.can_post_announcements === true ||
        user.role === 'admin' ||
        user.role === 'staff'
    );
    // Who can pin: admins, staff, or group-admins
    const canPin = user.role === 'admin' || user.role === 'staff' ||
        myParticipant?.is_admin === true;
    // Who can delete any message (not just own): admin / staff
    const canDeleteAny = user.role === 'admin' || user.role === 'staff';

    function renderBody(text: string) {
        return text.split(/(@\S+)/g).map((part, i) =>
            part.startsWith('@')
                ? <span key={i} className="font-bold" style={{ color: isDM ? '#93c5fd' : '#2563eb' }}>{part}</span>
                : <span key={i}>{part}</span>
        );
    }

    function needsDivider(i: number): boolean {
        if (i === 0) return false;
        const prev = messages[i - 1];
        const curr = messages[i];
        return new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() > 300_000;
    }

    const otherPhotoUrl = userPhoto(otherUser);

    if (leftGroup) return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-sm font-black text-gray-600">You left the group</p>
            <p className="text-xs text-gray-400">Updating your list…</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full"
            onClick={() => { setShowReactions(null); setShowMentions(false); setShowGroupMenu(false); setShowReactors(null); }}>

            {/* ── Header ── */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 flex-shrink-0">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    {isDM ? (
                        otherPhotoUrl && !headerImgErr ? (
                            <img src={otherPhotoUrl} className="w-8 h-8 rounded-full object-cover"
                                onError={() => setHeaderImgErr(true)} />
                        ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs"
                                style={{ background: GS }}>
                                {initials(otherUser ?? { first_name: displayName?.split(' ')[0], last_name: displayName?.split(' ')[1] })}
                            </div>
                        )
                    ) : (
                        conversation?.icon_url ? (
                            <img src={conversation.icon_url} className="w-8 h-8 rounded-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: '#7c3aed' }}>
                                <Users className="w-4 h-4" />
                            </div>
                        )
                    )}
                    {isDM && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-400 block" />}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate leading-tight" style={{ color: G0 }}>{convLabel()}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">
                        {isDM ? 'Active now' : `${participants.length} members`}
                    </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <Link href={chatHref(user.role as UserRole, conversationId)} onClick={onClose}
                        className="text-[10px] font-bold flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-gray-200"
                        style={{ color: G0 }}>
                        <ArrowUpRight className="w-3 h-3" />Full
                    </Link>
                    {!isDM && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={e => { e.stopPropagation(); setShowGroupMenu(o => !o); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {showGroupMenu && (
                                <div className="absolute right-0 top-full mt-1 z-[80] bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[150px]"
                                    onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={e => { e.stopPropagation(); setShowGroupMenu(false); setShowLeaveConfirm(true); }}
                                        disabled={leaving}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50">
                                        {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5 rotate-90" />}
                                        Leave Group
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2 relative">

                {/* ── Inline Leave Confirmation (mini SweetAlert) ── */}
                {showLeaveConfirm && (
                    <div className="absolute inset-0 z-[70] flex items-center justify-center"
                        style={{ background: 'rgba(13,27,62,0.18)', backdropFilter: 'blur(2px)' }}
                        onClick={() => setShowLeaveConfirm(false)}>
                        <div className="mx-4 w-full max-w-[220px] bg-white rounded-2xl shadow-2xl overflow-hidden"
                            style={{ animation: 'mn2Panel 0.18s cubic-bezier(0.34,1.3,0.64,1) both' }}
                            onClick={e => e.stopPropagation()}>
                            {/* Icon */}
                            <div className="flex flex-col items-center px-5 pt-5 pb-3">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center mb-2.5"
                                    style={{ background: '#fee2e2' }}>
                                    <ArrowUpRight className="w-5 h-5 text-red-500 rotate-90" />
                                </div>
                                <p className="text-sm font-black text-gray-800 text-center leading-snug">
                                    Leave Group?
                                </p>
                                <p className="text-[11px] text-gray-400 text-center mt-1 leading-snug">
                                    You won't receive messages from this group anymore.
                                </p>
                            </div>
                            {/* Buttons */}
                            <div className="flex border-t border-gray-100">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100">
                                    Cancel
                                </button>
                                <button
                                    onClick={leaveGroup}
                                    disabled={leaving}
                                    className="flex-1 py-3 text-xs font-black text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                                    {leaving
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                                        : 'Leave'
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? <Spinner label="Loading messages…" />
                : messages.length === 0 ? <Empty Icon={MessageCircle} title="No messages yet" sub="Say hello! 👋" />
                : messages.map((msg, i) => {
                    const isMe       = msg.sender_id === user.id;
                    const prevMsg    = messages[i - 1];
                    const nextMsg    = messages[i + 1];
                    const showAvatar = !isMe && msg.sender_id !== nextMsg?.sender_id;
                    const showName   = !isMe && msg.sender_id !== prevMsg?.sender_id && !isDM;
                    const isLastMine = msg.id === lastMyMsg?.id;
                    const senderPhotoUrl = userPhoto(msg.sender);

                    return (
                        <div key={msg.id} className="mb-px">
                            {/* Time divider */}
                            {needsDivider(i) && (
                                <div className="flex items-center gap-2 my-2">
                                    <div className="flex-1 h-px bg-gray-100" />
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap px-2">{ago(prevMsg?.created_at)}</span>
                                    <div className="flex-1 h-px bg-gray-100" />
                                </div>
                            )}

                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-1 group relative`}>
                                {/* Avatar column for others */}
                                {!isMe && (
                                    <div className="w-6 flex-shrink-0 self-end mb-0.5">
                                        {showAvatar ? (
                                            senderPhotoUrl ? (
                                                <img src={senderPhotoUrl} className="w-6 h-6 rounded-full object-cover"
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[9px]"
                                                    style={{ background: G1 }}>{initials(msg.sender)}</div>
                                            )
                                        ) : null}
                                    </div>
                                )}

                                <div className={`max-w-[62%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showName && (
                                        <p className="text-[10px] font-bold mb-px px-0.5" style={{ color: G0 }}>
                                            {userDisplayName(msg.sender)}
                                        </p>
                                    )}

                                    {/* Reply preview */}
                                    {msg.reply_to && (
                                        <div className="mb-1 px-2.5 py-1.5 rounded-xl text-[10px] max-w-full"
                                            style={isMe
                                                ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', borderLeft: '2px solid rgba(255,255,255,0.4)' }
                                                : { background: '#e5e7eb', color: '#6b7280', borderLeft: `2px solid ${G0}` }
                                            }>
                                            <p className="font-bold text-[10px] mb-0.5">{msg.reply_to.sender?.first_name}</p>
                                            <p className="truncate">{msg.reply_to.body}</p>
                                        </div>
                                    )}

                                    {/* Message bubble */}
                                    <div className="relative">
                                        <div className="px-2.5 py-1.5 rounded-2xl text-[11px] leading-snug break-words"
                                            style={{
                                                background: isMe ? GS : '#f0f0f0',
                                                color: isMe ? 'white' : '#111827',
                                                borderBottomRightRadius: isMe ? 4 : undefined,
                                                borderBottomLeftRadius: !isMe ? 4 : undefined,
                                                minWidth: 48,
                                            }}>
                                            {/* Pinned indicator */}
                                            {msg.is_pinned && (
                                                <div className="flex items-center gap-1 mb-1 opacity-60">
                                                    <Pin className="w-2.5 h-2.5" />
                                                    <span className="text-[9px] font-bold uppercase tracking-wide">Pinned</span>
                                                </div>
                                            )}
                                            {/* Inline edit mode */}
                                            {editingMsgId === msg.id ? (
                                                <div className="flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <textarea
                                                        ref={editRef}
                                                        value={editBody}
                                                        onChange={e => setEditBody(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(msg.id); }
                                                            if (e.key === 'Escape') setEditingMsgId(null);
                                                        }}
                                                        rows={2}
                                                        className="w-full text-[11px] px-2 py-1.5 rounded-lg resize-none focus:outline-none"
                                                        style={{
                                                            background: isMe ? 'rgba(255,255,255,0.15)' : '#e5e7eb',
                                                            color: isMe ? 'white' : '#111827',
                                                            minWidth: 140,
                                                        }}
                                                    />
                                                    <div className="flex gap-1.5 justify-end">
                                                        <button onClick={() => setEditingMsgId(null)}
                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-md opacity-60 hover:opacity-100"
                                                            style={{ background: 'rgba(255,255,255,0.15)' }}>
                                                            Cancel
                                                        </button>
                                                        <button onClick={() => submitEdit(msg.id)}
                                                            className="text-[10px] font-black px-2 py-0.5 rounded-md"
                                                            style={{ background: 'rgba(255,255,255,0.3)' }}>
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                msg.body && (
                                                    <p className="whitespace-pre-wrap">{renderBody(msg.body)}</p>
                                                )
                                            )}

                                            {/* Attachments */}
                                            {msg.attachments?.map(att => (
                                                <div key={att.id} className="mt-1.5">
                                                    {att.mime_type?.startsWith('image/') || att.attachment_type === 'image'
                                                        ? <a href={att.file_url} target="_blank" rel="noreferrer" className="block">
                                                            <img src={att.file_url}
                                                                className="rounded-xl max-w-[200px] max-h-[160px] object-cover cursor-pointer hover:opacity-90"
                                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                          </a>
                                                        : <a href={att.file_url} target="_blank" rel="noreferrer"
                                                            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[11px] font-semibold"
                                                            style={isMe ? { background: 'rgba(255,255,255,0.15)', color: 'white' } : { background: '#e5e7eb', color: '#374151' }}>
                                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                                            <span className="truncate max-w-[140px]">{att.file_name}</span>
                                                          </a>
                                                    }
                                                </div>
                                            ))}

                                            {/* Timestamp */}
                                            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <span className="text-[9px] opacity-50 whitespace-nowrap">{ago(msg.created_at)}</span>
                                                {msg.is_edited && <span className="text-[9px] opacity-40 italic">edited</span>}
                                            </div>
                                        </div>

                                        {/* Hover action bar */}
                                        <div className={`absolute ${isMe ? 'left-0 -translate-x-full pr-1.5' : 'right-0 translate-x-full pl-1.5'} top-0 hidden group-hover:flex items-center gap-0.5 z-10`}>
                                            {/* React */}
                                            <button onClick={e => { e.stopPropagation(); setShowReactions(showReactions === msg.id ? null : msg.id); }}
                                                className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-100"
                                                title="React">
                                                <SmilePlus className="w-3.5 h-3.5" />
                                            </button>
                                            {/* Reply */}
                                            <button onClick={e => { e.stopPropagation(); setReplyTo(msg); setTimeout(() => textareaRef.current?.focus(), 0); }}
                                                className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-100"
                                                title="Reply">
                                                <Reply className="w-3.5 h-3.5" />
                                            </button>
                                            {/* Edit — own messages only */}
                                            {isMe && (
                                                <button onClick={e => { e.stopPropagation(); startEdit(msg); }}
                                                    className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-blue-600 border border-gray-100"
                                                    title="Edit">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {/* Pin / Unpin — admin, staff, group-admin */}
                                            {canPin && (
                                                <button onClick={e => { e.stopPropagation(); pinMsg(msg.id, !!msg.is_pinned); }}
                                                    className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 transition-colors"
                                                    style={msg.is_pinned ? { color: '#d97706' } : { color: '#9ca3af' }}
                                                    title={msg.is_pinned ? 'Unpin' : 'Pin'}>
                                                    <Pin className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {/* Delete — own OR admin/staff */}
                                            {(isMe || canDeleteAny) && (
                                                <button onClick={e => { e.stopPropagation(); deleteMsg(msg.id); }}
                                                    className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-red-400 hover:text-red-600 border border-gray-100"
                                                    title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Emoji picker */}
                                        {showReactions === msg.id && (
                                            <div className={`absolute z-[65] ${isMe ? 'right-0' : 'left-0'} top-full mt-1`}
                                                onClick={e => e.stopPropagation()}>
                                                <div className="flex gap-0.5 px-2 py-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100"
                                                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                                                    {EMOJIS.map(e => (
                                                        <button key={e} onClick={() => toggleReaction(msg.id, e)}
                                                            className="text-xl hover:scale-125 transition-transform leading-none p-0.5">
                                                            {e}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reactions row */}
                                    {(msg.reaction_summary?.length ?? 0) > 0 && (
                                        <div className={`relative flex flex-wrap gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            {msg.reaction_summary!.map(r => (
                                                <button key={r.emoji}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        // Single tap = react/unreact
                                                        // Long-press or second tap on count = show who reacted
                                                        if (showReactors?.msgId === msg.id && showReactors.emoji === r.emoji) {
                                                            setShowReactors(null);
                                                        } else {
                                                            setShowReactors({ msgId: msg.id, emoji: r.emoji });
                                                        }
                                                    }}
                                                    onDoubleClick={e => { e.stopPropagation(); toggleReaction(msg.id, r.emoji); }}
                                                    className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border transition-all active:scale-95"
                                                    style={r.reacted
                                                        ? { background: `${G0}12`, borderColor: `${G0}50`, color: G0, fontWeight: 700 }
                                                        : { background: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>
                                                    {r.emoji}<span className="text-[10px] ml-0.5">{r.count}</span>
                                                </button>
                                            ))}

                                            {/* Reactor popup — who reacted with this emoji */}
                                            {showReactors?.msgId === msg.id && (() => {
                                                const activeReaction = msg.reaction_summary!.find(r => r.emoji === showReactors.emoji);
                                                const allReactors = msg.reaction_summary!; // all emojis
                                                return (
                                                    <div
                                                        className={`absolute z-[70] bottom-full mb-1.5 ${isMe ? 'right-0' : 'left-0'}`}
                                                        onClick={e => e.stopPropagation()}>
                                                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                                                            style={{ minWidth: 200, maxWidth: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>

                                                            {/* Tab row — one tab per emoji */}
                                                            <div className="flex border-b border-gray-100 overflow-x-auto">
                                                                {/* "All" tab */}
                                                                <button
                                                                    onClick={() => setShowReactors({ msgId: msg.id, emoji: '__all__' })}
                                                                    className="px-3 py-2 text-[11px] font-black whitespace-nowrap flex-shrink-0 transition-colors"
                                                                    style={showReactors.emoji === '__all__'
                                                                        ? { color: G0, borderBottom: `2px solid ${G0}` }
                                                                        : { color: '#9ca3af', borderBottom: '2px solid transparent' }}>
                                                                    All {msg.reaction_summary!.reduce((s, r) => s + r.count, 0)}
                                                                </button>
                                                                {allReactors.map(r => (
                                                                    <button key={r.emoji}
                                                                        onClick={() => setShowReactors({ msgId: msg.id, emoji: r.emoji })}
                                                                        className="px-3 py-2 text-[11px] font-bold whitespace-nowrap flex-shrink-0 flex items-center gap-1 transition-colors"
                                                                        style={showReactors.emoji === r.emoji
                                                                            ? { color: G0, borderBottom: `2px solid ${G0}`, background: `${G0}06` }
                                                                            : { color: '#6b7280', borderBottom: '2px solid transparent' }}>
                                                                        <span className="text-sm">{r.emoji}</span>
                                                                        <span>{r.count}</span>
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* Reactor list */}
                                                            <div className="max-h-44 overflow-y-auto">
                                                                {(() => {
                                                                    // Determine which reactors to show
                                                                    const filtered = showReactors.emoji === '__all__'
                                                                        ? allReactors
                                                                        : allReactors.filter(r => r.emoji === showReactors.emoji);

                                                                    // Collect user objects from reads/reactions
                                                                    // We use participant list as source of truth for names
                                                                    type ReactorEntry = { userId?: number; name: string; emoji: string; photo?: string | null };
                                                                    const entries: ReactorEntry[] = [];

                                                                    filtered.forEach(r => {
                                                                        if (r.users && r.users.length > 0) {
                                                                            // New format: server includes user details
                                                                            r.users.forEach(u => {
                                                                                entries.push({
                                                                                    userId: u.id,
                                                                                    name:   u.name,
                                                                                    emoji:  r.emoji,
                                                                                    photo:  photoUrl(u.profile_photo_path),
                                                                                });
                                                                            });
                                                                        } else if (r.user_ids && r.user_ids.length > 0) {
                                                                            // user_ids only — look up from participants
                                                                            r.user_ids.forEach((uid: number) => {
                                                                                const p = participants.find(p => p.user_id === uid);
                                                                                entries.push({
                                                                                    userId: uid,
                                                                                    name:   userDisplayName(p?.user) || `User ${uid}`,
                                                                                    emoji:  r.emoji,
                                                                                    photo:  userPhoto(p?.user),
                                                                                });
                                                                            });
                                                                        } else {
                                                                            // Fallback count only
                                                                            entries.push({ name: `${r.count} reaction${r.count !== 1 ? 's' : ''}`, emoji: r.emoji });
                                                                        }
                                                                    });

                                                                    if (entries.length === 0) {
                                                                        return (
                                                                            <div className="px-4 py-3 text-center text-[11px] text-gray-400">
                                                                                {activeReaction?.count ?? 0} reaction{(activeReaction?.count ?? 0) !== 1 ? 's' : ''}
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return entries.map((entry, idx) => (
                                                                        <div key={idx}
                                                                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors">
                                                                            {/* Avatar */}
                                                                            {entry.photo ? (
                                                                                <img src={entry.photo} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                                                            ) : (
                                                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] flex-shrink-0"
                                                                                    style={{ background: GS }}>
                                                                                    {entry.name.charAt(0).toUpperCase()}
                                                                                </div>
                                                                            )}
                                                                            <p className="flex-1 text-xs font-semibold text-gray-800 truncate">{entry.name}</p>
                                                                            <span className="text-base flex-shrink-0">{entry.emoji}</span>
                                                                        </div>
                                                                    ));
                                                                })()}
                                                            </div>

                                                            {/* Footer: tap emoji to react */}
                                                            <div className="border-t border-gray-50 px-3 py-2 flex items-center justify-between">
                                                                <p className="text-[10px] text-gray-400">Tap emoji to react</p>
                                                                <div className="flex gap-1">
                                                                    {msg.reaction_summary!.slice(0,5).map(r => (
                                                                        <button key={r.emoji}
                                                                            onClick={() => { toggleReaction(msg.id, r.emoji); setShowReactors(null); }}
                                                                            className="text-base hover:scale-125 transition-transform"
                                                                            title={`React with ${r.emoji}`}>
                                                                            {r.emoji}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* ── Facebook-style seen avatars (only under last MY message) ── */}
                                    {isMe && isLastMine && (msg.reads?.length ?? 0) > 0 && (
                                        <SeenAvatars reads={msg.reads} myId={user.id} />
                                    )}
                                    {/* Fallback: if reads not loaded but is_read_by_me set, show "Seen" text */}
                                    {isMe && isLastMine && (!msg.reads || msg.reads.length === 0) && msg.is_read_by_me && (
                                        <p className="text-[9px] text-gray-400 mt-0.5">Seen</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* ── Reply bar ── */}
            {replyTo && (
                <div className="flex-shrink-0 mx-3 mb-1 px-2.5 py-1.5 rounded-xl flex items-start gap-2 border-l-2"
                    style={{ background: `${G0}06`, borderColor: G0 }}>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold" style={{ color: G0 }}>Replying to {userDisplayName(replyTo.sender)}</p>
                        <p className="text-[10px] text-gray-500 truncate">{replyTo.body}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* ── Attachment previews ── */}
            {attachments.length > 0 && (
                <div className="flex-shrink-0 flex gap-1.5 px-3 pb-1.5 overflow-x-auto">
                    {attachments.map((f, i) => (
                        <div key={i} className="relative flex-shrink-0">
                            {f.type.startsWith('image/')
                                ? <img src={URL.createObjectURL(f)} className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                                : <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-1 p-1">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    <span className="text-[8px] text-gray-400 text-center truncate w-full">{f.name}</span>
                                  </div>
                            }
                            <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── @Mention dropdown ── */}
            {showMentions && mentionList.length > 0 && (
                <div className="flex-shrink-0 mx-3 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-40 overflow-y-auto"
                    onClick={e => e.stopPropagation()}>
                    {mentionList.map(c => (
                        <MentionRow key={c.id} c={c} onSelect={() => insertMention(c)} />
                    ))}
                </div>
            )}

            {/* ── Compose bar ── */}
            {canPostAnnouncement ? (
            <div className="flex-shrink-0 px-3 py-2.5 border-t border-gray-100 flex items-end gap-1.5"
                style={{ background: '#fafafa' }}>
                <input type="file" ref={imgRef} multiple accept="image/*,video/*" className="hidden"
                    onChange={e => setAttachments(prev => [...prev, ...Array.from(e.target.files ?? [])])} />
                <input type="file" ref={fileRef} multiple className="hidden"
                    onChange={e => setAttachments(prev => [...prev, ...Array.from(e.target.files ?? [])])} />

                <button onClick={() => imgRef.current?.click()}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex-shrink-0">
                    <Image className="w-4 h-4" />
                </button>
                <button onClick={() => fileRef.current?.click()}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex-shrink-0">
                    <Paperclip className="w-4 h-4" />
                </button>

                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={e => handleBodyChange(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Escape') setShowMentions(false);
                        if (e.key === 'Enter' && !e.shiftKey && !showMentions) { e.preventDefault(); send(); }
                    }}
                    placeholder={isAnnouncement ? 'Post an announcement…' : 'Type a message… (@ to mention)'}
                    rows={1}
                    className="flex-1 text-xs px-3 py-2.5 rounded-2xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
                    style={{ '--tw-ring-color': `${G0}30`, maxHeight: 90, lineHeight: '1.5' } as React.CSSProperties}
                />

                <button onClick={send} disabled={sending || (!body.trim() && attachments.length === 0)}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-white disabled:opacity-40 transition-all flex-shrink-0 hover:opacity-85 active:scale-95"
                    style={{ background: GS }}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
            ) : (
            /* Read-only notice for announcement channels */
            <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex items-center justify-center gap-2"
                style={{ background: '#fef9ec' }}>
                <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#d97706' }} />
                <p className="text-[11px] text-amber-700 font-semibold text-center">
                    Only admins can post in this channel
                </p>
            </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// SUPPORT PANEL
// ════════════════════════════════════════════════════════════════════════════
// Status priority for sorting (lower = more urgent)
const TICKET_SORT_PRIORITY: Record<string, number> = {
    new: 0, under_review: 1, assigned: 2, in_progress: 3, resolved: 4, closed: 5,
};
const PRIORITY_SORT: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function SupportPanel({ user, role, markTicketSeen, onClose }: { user: AuthUser; role: UserRole; markTicketSeen: (id: number, status: string) => void; onClose: () => void }) {
    const [tickets, setTickets]           = useState<SupportTicket[]>([]);
    const [loading, setLoading]           = useState(false);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    const [showCreate, setShowCreate]     = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [search, setSearch]             = useState('');
    const [toast, setToast]               = useState<{ msg: string; color: string } | null>(null);
    // Track previous ticket statuses to detect changes
    const prevStatusRef = useRef<Record<number, string>>({});
    const initialLoadRef = useRef(false);

    const canCreate = role === 'teacher' || role === 'team_leader' || role === 'staff';
    const canManage = role === 'admin' || role === 'staff' || role === 'team_leader';

    function showToast(msg: string, color = '#15803d') {
        setToast({ msg, color });
        setTimeout(() => setToast(null), 4000);
    }

    const loadTickets = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const data = await apiGet<SupportTicket[]>('/api/support-tickets?per_page=50');
        if (data) {
            // Detect status changes on silent refreshes
            if (silent && initialLoadRef.current) {
                data.forEach(t => {
                    const prev = prevStatusRef.current[t.id];
                    if (prev && prev !== t.status) {
                        const st = TICKET_STATUS[t.status];
                        const shortNum = t.ticket_number?.split('-').pop() ?? String(t.id);
                        // Notify submitter of status changes
                        if (role === 'teacher' || role === 'team_leader') {
                            showToast(`#${shortNum} → ${st?.label ?? t.status}`, st?.color ?? G0);
                        }
                        // Notify admin/staff of new tickets
                        if ((role === 'admin' || role === 'staff') && t.status === 'new') {
                            showToast(`New ticket #${shortNum}: ${t.subject.slice(0,40)}`, '#0369a1');
                        }
                    }
                });
            }
            // Update status tracking map
            const newMap: Record<number, string> = {};
            data.forEach(t => { newMap[t.id] = t.status; });
            prevStatusRef.current = newMap;
            initialLoadRef.current = true;

            // Sort: by status priority, then priority level, then updated_at desc
            const sorted = [...data].sort((a, b) => {
                const sp = (TICKET_SORT_PRIORITY[a.status] ?? 9) - (TICKET_SORT_PRIORITY[b.status] ?? 9);
                if (sp !== 0) return sp;
                const pp = (PRIORITY_SORT[a.priority ?? ''] ?? 9) - (PRIORITY_SORT[b.priority ?? ''] ?? 9);
                if (pp !== 0) return pp;
                return new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime();
            });
            setTickets(sorted);
        }
        if (!silent) setLoading(false);
    }, [role]);

    useEffect(() => { loadTickets(); }, [loadTickets]);
    // Auto-poll every 10 seconds
    useEffect(() => {
        const iv = setInterval(() => loadTickets(true), 10_000);
        return () => clearInterval(iv);
    }, [loadTickets]);

    const filtered = tickets.filter(t => {
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) &&
            !(t.ticket_number ?? '').toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    if (showCreate) return <CreateTicketForm role={role}
        onBack={() => { setShowCreate(false); loadTickets(); }} onClose={onClose} />;
    if (activeTicketId !== null) return <TicketThread ticketId={activeTicketId} user={user} role={role}
        onBack={() => { setActiveTicketId(null); loadTickets(true); }} onClose={onClose}
        markTicketSeen={markTicketSeen} />;

    const STATUS_FILTERS = ['all','new','under_review','in_progress','resolved','closed'];

    // Counts per status for badge chips
    const statusCounts = tickets.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="flex flex-col h-full relative">
            {/* Status-change toast */}
            {toast && (
                <div className="absolute top-2 left-3 right-3 z-50 flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg text-white text-[11px] font-bold transition-all"
                    style={{ background: toast.color, animation: 'mn2Panel 0.2s ease-out both' }}>
                    <Bell className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1">{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Search + New */}
            <div className="px-3 pt-3 pb-2 flex gap-2 flex-shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search tickets…"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none placeholder-gray-400" />
                </div>
                {canCreate && (
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-bold whitespace-nowrap"
                        style={{ background: GS }}>
                        <Plus className="w-3.5 h-3.5" />New Ticket
                    </button>
                )}
             
                {supportMgmtHref(role) && (
                    <Link href={supportMgmtHref(role)!} onClick={onClose}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-red-50 whitespace-nowrap"
                        style={{ color: '#b91c1c' }} title="Manage all tickets">
                        <Shield className="w-3.5 h-3.5" />Manage
                    </Link>
                )}
            </div>

            {/* Status filter chips */}
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
                {STATUS_FILTERS.map(s => {
                    const cfg = TICKET_STATUS[s] ?? { label: 'All', color: G0, bg: '#e0e7ff' };
                    const count = s === 'all' ? tickets.length : (statusCounts[s] ?? 0);
                    const isAlert = (s === 'new' && (role === 'admin' || role === 'staff'))
                        || (s === 'in_progress' && (role === 'teacher' || role === 'team_leader'))
                        || (s === 'resolved' && (role === 'teacher' || role === 'team_leader'));
                    return (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 relative"
                            style={filterStatus === s ? { background: G0, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                            {s === 'all' ? 'All' : cfg.label}
                            {count > 0 && (
                                <span className="text-[9px] font-black px-1 py-0.5 rounded-full"
                                    style={filterStatus === s
                                        ? { background: 'rgba(255,255,255,0.25)' }
                                        : isAlert && count > 0
                                            ? { background: '#fecaca', color: '#b91c1c' }
                                            : { background: '#e5e7eb' }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Ticket list */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-2">
                {loading ? <Spinner label="Loading tickets…" />
                : filtered.length === 0 ? <Empty Icon={HelpCircle}
                    title={search ? 'No results' : filterStatus !== 'all' ? `No ${TICKET_STATUS[filterStatus]?.label ?? filterStatus} tickets` : 'No tickets yet'}
                    sub={canCreate ? 'Tap "New Ticket" to submit a concern' : 'No support tickets to show'} />
                : filtered.map(ticket => {
                    const st = TICKET_STATUS[ticket.status] ?? TICKET_STATUS['new'];
                    const pr = ticket.priority ? TICKET_PRIORITY[ticket.priority] : null;
                    const catLabel = {
                        technical_issue: '🔧', attendance_concern: '📋', schedule_concern: '📅',
                        equipment_concern: '🖥️', account_lock_concern: '🔒', contract_concern: '📄', other: '💬',
                    }[ticket.category ?? ''] ?? '🎫';
                    const hasAlert = (role === 'admin' || role === 'staff')
                        ? ticket.status === 'new'
                        : ticket.status === 'in_progress' || ticket.status === 'resolved';

                    const submitter = getTicketSubmitter(ticket);
                    const submitterPhoto = ticketUserPhoto(submitter);

                    return (
                        <button key={ticket.id} onClick={() => {
                                setActiveTicketId(ticket.id);
                                markTicketSeen(ticket.id, ticket.status);
                            }}
                            className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left group"
                            style={hasAlert ? { background: '#fff7f7' } : {}}>

                            {/* Queue number + submitter avatar stack */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                                {/* Queue/priority indicator */}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base relative"
                                    style={{ background: hasAlert ? '#fee2e2' : `${G0}0d` }}>
                                    {catLabel}
                                    {hasAlert && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                                    )}
                                </div>
                                {/* Submitter mini avatar */}
                                {submitter && (
                                    <div className="flex-shrink-0" title={userDisplayName(submitter)}>
                                        {submitterPhoto ? (
                                            <img src={submitterPhoto} className="w-5 h-5 rounded-full object-cover border border-gray-200" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[8px]"
                                                style={{ background: GS }}>
                                                {initials(submitter)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Ticket number + time */}
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="text-[10px] text-gray-400 font-mono">{ticket.ticket_number}</span>
                                    <span className="text-[10px] text-gray-400">{ago(ticket.updated_at ?? ticket.created_at)}</span>
                                </div>
                                {/* Subject */}
                                <p className={`text-xs leading-snug line-clamp-2 ${hasAlert ? 'font-black text-gray-900' : 'font-semibold text-gray-800'} group-hover:text-blue-900`}>
                                    {ticket.subject}
                                </p>
                                {/* Submitter name (for admin/staff view) */}
                                {(role === 'admin' || role === 'staff') && submitter && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                        by {ticketUserName(submitter)}
                                    </p>
                                )}
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                    <Badge label={st.label} color={st.color} bg={st.bg} />
                                    {pr && <Badge label={pr.label} color={pr.color} bg={pr.bg} />}
                                    {hasAlert && (
                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                            style={{ background: '#fee2e2', color: '#b91c1c' }}>
                                            {(role === 'admin' || role === 'staff') ? '● Needs action' : '● Staff replied'}
                                        </span>
                                    )}
                                    <ChevronRight className="w-3 h-3 text-gray-300 ml-auto group-hover:text-gray-400" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2 flex gap-2" style={{ background: '#f7f8fc' }}>
                {canCreate && (
                    <button onClick={() => setShowCreate(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-white transition-colors"
                        style={{ color: G0 }}>
                        <Plus className="w-3.5 h-3.5" />New Ticket
                    </button>
                )}
            
            </div>
        </div>
    );
}

// ── Category picker step ──────────────────────────────────────────────────────
const SUPPORT_CATEGORIES = [
    { id: 'technical_issue',    label: 'Technical Issue',    icon: '🔧', desc: 'App bugs, system errors, connectivity' },
    { id: 'attendance_concern', label: 'Attendance Concern', icon: '📋', desc: 'Attendance records, absences, tardiness' },
    { id: 'schedule_concern',   label: 'Schedule Concern',   icon: '📅', desc: 'Class schedule, time slot issues' },
    { id: 'equipment_concern',  label: 'Equipment Concern',  icon: '🖥️', desc: 'Headset, camera, computer problems' },
    { id: 'account_lock_concern', label: 'Account Lock',     icon: '🔒', desc: 'Locked out, password reset, access' },
    { id: 'contract_concern',   label: 'Contract Concern',   icon: '📄', desc: 'Contract terms, renewal, amendments' },
    { id: 'other',              label: 'Other',              icon: '💬', desc: 'Anything not listed above' },
] as const;

function CreateTicketForm({ role, onBack, onClose }: { role: UserRole; onBack: () => void; onClose: () => void }) {
    const [step, setStep]         = useState<'category' | 'details'>('category');
    const [form, setForm]         = useState({ subject: '', description: '', category: '', priority: 'medium' });
    const [attachFiles, setAttachFiles] = useState<File[]>([]);
    const [errors, setErrors]     = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone]         = useState(false);
    const attachRef = useRef<HTMLInputElement>(null);

    const selectedCat = SUPPORT_CATEGORIES.find(c => c.id === form.category);

    function removeAttach(i: number) {
        setAttachFiles(prev => prev.filter((_, j) => j !== i));
    }

    async function submit() {
        const e: Record<string, string> = {};
        if (!form.subject.trim())      e.subject      = 'Subject is required';
        if (!form.description.trim())  e.description  = 'Description is required';
        if (!form.category)            e.category     = 'Category is required';
        setErrors(e);
        if (Object.keys(e).length) return;
        setSubmitting(true);
        try {
            let res;
            if (attachFiles.length > 0) {
                // Use FormData for file upload
                const fd = new FormData();
                fd.append('subject',     form.subject);
                fd.append('description', form.description);
                fd.append('category',    form.category);
                fd.append('priority',    form.priority);
                attachFiles.forEach(f => fd.append('attachments[]', f));
                res = await apiPost('/api/support-tickets', fd);
            } else {
                res = await apiPost('/api/support-tickets', form);
            }
            if (res.success) { setDone(true); setTimeout(onBack, 1600); }
            else if (res.errors) setErrors(Object.fromEntries(Object.entries(res.errors).map(([k, v]) => [k, (v as string[])[0]])));
            else setErrors({ submit: res.message ?? 'Failed to submit ticket' });
        } finally { setSubmitting(false); }
    }

    // ── Done screen ───────────────────────────────────────────────────────────
    if (done) return (
        <div className="flex flex-col items-center justify-center gap-3 h-full px-6 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: '#dcfce7' }}>
                ✅
            </div>
            <p className="text-sm font-black text-gray-800">Ticket Submitted!</p>
            <p className="text-xs text-gray-500">Our team will review it shortly.</p>
        </div>
    );

    // ── Step 1: Category picker ───────────────────────────────────────────────
    if (step === 'category') return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex-1">
                    <p className="text-xs font-black" style={{ color: G0 }}>New Support Ticket</p>
                    <p className="text-[10px] text-gray-400">Step 1 of 2 — Select category</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-wide px-1 mb-3">
                    What is your concern about?
                </p>
                {SUPPORT_CATEGORIES.map(cat => (
                    <button key={cat.id} type="button"
                        onClick={() => { setForm(p => ({ ...p, category: cat.id })); setStep('details'); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all hover:border-blue-200 hover:bg-blue-50 group"
                        style={{ borderColor: '#e5e7eb', background: 'white' }}>
                        <span className="text-2xl flex-shrink-0">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-gray-800 group-hover:text-blue-900">{cat.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{cat.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                    </button>
                ))}
            </div>
        </div>
    );

    // ── Step 2: Details form ──────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={() => setStep('category')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-base">{selectedCat?.icon}</span>
                        <p className="text-xs font-black" style={{ color: G0 }}>{selectedCat?.label}</p>
                    </div>
                    <p className="text-[10px] text-gray-400">Step 2 of 2 — Describe your concern</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {/* Subject */}
                <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1">
                        Subject *
                    </label>
                    <input value={form.subject}
                        onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(p => ({ ...p, subject: '' })); }}
                        placeholder={`Brief title — e.g. "${selectedCat?.desc.split(',')[0]}"`}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: errors.subject ? '#ef4444' : '#e5e7eb', '--tw-ring-color': `${G0}25` } as React.CSSProperties} />
                    {errors.subject && <p className="text-[10px] text-red-500 mt-0.5">{errors.subject}</p>}
                </div>

                {/* Priority */}
                <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1.5">
                        Priority
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {(['low','medium','high','critical'] as const).map(p => {
                            const cfg = TICKET_PRIORITY[p];
                            return (
                                <button key={p} type="button"
                                    onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                                    className="py-2 rounded-xl text-[10px] font-black border-2 transition-all"
                                    style={form.priority === p
                                        ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color }
                                        : { background: '#f9fafb', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                                    {cfg.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1">
                        Description *
                    </label>
                    <textarea value={form.description}
                        onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setErrors(p => ({ ...p, description: '' })); }}
                        placeholder="Please describe your concern in detail. Include when it started, what you were doing, and any error messages you saw…"
                        rows={5}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-none transition-all"
                        style={{ borderColor: errors.description ? '#ef4444' : '#e5e7eb', '--tw-ring-color': `${G0}25` } as React.CSSProperties} />
                    {errors.description && <p className="text-[10px] text-red-500 mt-0.5">{errors.description}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{form.description.length} chars</p>
                </div>

                {/* Attachments */}
                <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1.5">
                        Attachments <span className="text-gray-400 font-normal normal-case">(screenshots, videos — optional)</span>
                    </label>
                    <input ref={attachRef} type="file" multiple
                        accept="image/*,video/*,application/pdf,.doc,.docx,.xlsx,.xls"
                        className="hidden"
                        onChange={e => setAttachFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])} />

                    {/* Previews */}
                    {attachFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {attachFiles.map((f, i) => (
                                <div key={i} className="relative group flex-shrink-0">
                                    {f.type.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(f)}
                                            className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200" />
                                    ) : f.type.startsWith('video/') ? (
                                        <div className="w-16 h-16 rounded-xl border-2 border-gray-200 bg-gray-100 flex flex-col items-center justify-center gap-1">
                                            <span className="text-xl">🎬</span>
                                            <span className="text-[8px] text-gray-500 truncate w-14 text-center px-1">{f.name}</span>
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl border-2 border-gray-200 bg-gray-100 flex flex-col items-center justify-center gap-1 p-1">
                                            <FileText className="w-5 h-5 text-gray-400" />
                                            <span className="text-[8px] text-gray-500 truncate w-full text-center">{f.name}</span>
                                        </div>
                                    )}
                                    <button onClick={() => removeAttach(i)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button type="button" onClick={() => attachRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                        <Paperclip className="w-4 h-4" />
                        {attachFiles.length > 0
                            ? `${attachFiles.length} file${attachFiles.length > 1 ? 's' : ''} attached — tap to add more`
                            : 'Attach screenshot, video or document'}
                    </button>
                </div>

                {errors.submit && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <p className="text-[11px] text-red-600">{errors.submit}</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-3 py-2.5 border-t border-gray-100 flex gap-2">
                <button onClick={() => setStep('category')}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                    Back
                </button>
                <button onClick={submit} disabled={submitting || !form.subject.trim() || !form.description.trim()}
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-black disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                    style={{ background: GS }}>
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Submit Ticket
                </button>
            </div>
        </div>
    );
}

function TicketThread({ ticketId, user, role, onBack, onClose, markTicketSeen }: {
    ticketId: number; user: AuthUser; role: UserRole; onBack: () => void; onClose: () => void;
    markTicketSeen?: (id: number, status: string) => void;
}) {
    interface CommentAttachment {
        id: number; file_name: string; file_path: string; mime_type?: string;
        file_url?: string; formatted_file_size?: string;
    }
    interface Comment {
        id: number; content?: string; body?: string; is_internal?: boolean;
        created_at: string; time_ago?: string;
        user?: AnyUser & { role?: string; profile_photo_path?: string; profile_photo_url?: string };
        attachments?: CommentAttachment[];
    }
    interface TicketAttachment {
        id: number; file_name: string; file_path: string; mime_type?: string;
        file_url?: string; formatted_file_size?: string;
    }
    interface TicketDetail extends SupportTicket {
        description?: string;
        // submitted_by is either the ID or the eager-loaded user object
        submitted_by?: number | TicketUser;
        submittedBy?: TicketUser;
        assignee?: TicketUser;
        comments?: Comment[];
        attachments?: TicketAttachment[];
    }
    const [ticket, setTicket]           = useState<TicketDetail | null>(null);
    const [loading, setLoading]         = useState(true);
    const [comment, setComment]         = useState('');
    const [isInternal, setIsInternal]   = useState(false);
    const [submitting, setSubmitting]   = useState(false);
    const [replyFiles, setReplyFiles]   = useState<File[]>([]);
    const replyFileRef = useRef<HTMLInputElement>(null);
    const canManage = role === 'admin' || role === 'staff' || role === 'team_leader';

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const data = await apiGet<TicketDetail>(`/api/support-tickets/${ticketId}`);
        if (data) {
            setTicket(data);
            // Mark as seen at current status — clears the badge
            markTicketSeen?.(ticketId, data.status);
        }
        if (!silent) setLoading(false);
    }, [ticketId, markTicketSeen]);

    useEffect(() => { load(); }, [load]);
    // Auto-poll every 8s — also marks seen if status changed while viewing
    useEffect(() => {
        const iv = setInterval(() => load(true), 8_000);
        return () => clearInterval(iv);
    }, [load]);

    async function addComment(internal = false) {
        if (!comment.trim() && replyFiles.length === 0) return;
        setSubmitting(true);
        try {
            let res;
            if (replyFiles.length > 0) {
                const fd = new FormData();
                if (comment.trim()) fd.append('content', comment.trim());
                else fd.append('content', '(attachment)');
                fd.append('is_internal', internal ? '1' : '0');
                replyFiles.forEach(f => fd.append('attachments[]', f));
                res = await apiPost(`/api/support-tickets/${ticketId}/comments`, fd);
            } else {
                res = await apiPost(`/api/support-tickets/${ticketId}/comments`, {
                    content: comment,
                    is_internal: internal,
                });
            }
            if (res.success) { setComment(''); setIsInternal(false); setReplyFiles([]); load(true); }
        } finally { setSubmitting(false); }
    }

    // Status transition actions for managers
    async function transition(action: string, body?: Record<string, string>) {
        const res = await apiPost(`/api/support-tickets/${ticketId}/${action}`, body ?? {});
        if (res.success) load(true);
    }

    if (loading) return <div className="h-full flex items-center justify-center"><Spinner label="Loading ticket…" /></div>;
    if (!ticket)  return <div className="h-full flex items-center justify-center"><Empty Icon={AlertCircle} title="Ticket not found" /></div>;

    const st  = TICKET_STATUS[ticket.status] ?? TICKET_STATUS['new'];
    const pr  = ticket.priority ? TICKET_PRIORITY[ticket.priority] : null;
    const cat = SUPPORT_CATEGORIES.find(c => c.id === ticket.category);

    // Next action buttons for managers
    const nextActions: { label: string; action: string; color: string; body?: Record<string,string> }[] = [];
    if (canManage) {
        if (ticket.status === 'new')          nextActions.push({ label: 'Review',     action: 'under-review', color: '#b45309' });
        if (ticket.status === 'under_review') nextActions.push({ label: 'In Progress', action: 'in-progress', color: '#0369a1' });
        if (ticket.status === 'in_progress')  nextActions.push({ label: 'Resolve',    action: 'resolve',     color: '#15803d', body: { resolution_notes: 'Resolved via support panel.' } });
        if (ticket.status === 'resolved')     nextActions.push({ label: 'Close',      action: 'close',       color: '#6b7280' });
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-mono">{ticket.ticket_number}</p>
                    <p className="text-xs font-black truncate" style={{ color: G0 }}>{ticket.subject}</p>
                </div>
                <Link href={supportHref(role, ticketId)} onClick={onClose}
                    className="text-[10px] font-bold opacity-60 hover:opacity-100 flex items-center gap-0.5 flex-shrink-0" style={{ color: G0 }}>
                    <ArrowUpRight className="w-3 h-3" />Full
                </Link>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
                {/* Status + submitter + meta */}
                {(() => {
                    const submitter = getTicketSubmitter(ticket);
                    const submitterPhoto = ticketUserPhoto(submitter);
                    return (
                        <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-gray-50">
                            {/* Submitter avatar */}
                            <div className="flex-shrink-0">
                                {submitterPhoto ? (
                                    <img src={submitterPhoto} className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
                                        style={{ background: GS }}>
                                        {ticketInitials(submitter)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-black text-gray-800 truncate">
                                        {ticketUserName(submitter)}
                                    </p>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{ago(ticket.created_at)}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                    {cat && <span className="text-sm">{cat.icon}</span>}
                                    <Badge label={st.label} color={st.color} bg={st.bg} />
                                    {pr && <Badge label={pr.label} color={pr.color} bg={pr.bg} />}
                                    {ticket.assignee && (
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <UserCheck className="w-3 h-3" />{userName(ticket.assignee)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Description bubble */}
                {ticket.description && (
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-[11px] text-gray-700 leading-relaxed">{ticket.description}</p>
                    </div>
                )}

                {/* Ticket-level attachments */}
                {(ticket.attachments?.length ?? 0) > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1.5">
                            Attachments ({ticket.attachments!.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {ticket.attachments!.map(att => {
                                const isImg = att.mime_type?.startsWith('image/');
                                const isVid = att.mime_type?.startsWith('video/');
                                const url   = att.file_url ?? `/storage/${att.file_path}`;
                                return (
                                    <a key={att.id} href={url} target="_blank" rel="noreferrer"
                                        className="flex-shrink-0 block rounded-xl overflow-hidden border-2 border-gray-100 hover:border-blue-300 transition-colors"
                                        title={att.file_name}>
                                        {isImg ? (
                                            <img src={url} className="w-20 h-20 object-cover" />
                                        ) : isVid ? (
                                            <div className="w-20 h-20 bg-gray-100 flex flex-col items-center justify-center gap-1">
                                                <span className="text-2xl">🎬</span>
                                                <span className="text-[9px] text-gray-500 px-1 truncate w-full text-center">{att.file_name}</span>
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-100 flex flex-col items-center justify-center gap-1 p-1">
                                                <FileText className="w-6 h-6 text-gray-400" />
                                                <span className="text-[9px] text-gray-500 truncate w-full text-center px-1">{att.file_name}</span>
                                                {att.formatted_file_size && <span className="text-[8px] text-gray-400">{att.formatted_file_size}</span>}
                                            </div>
                                        )}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Next action buttons for managers */}
                {nextActions.length > 0 && (
                    <div className="flex gap-2">
                        {nextActions.map(a => (
                            <button key={a.action}
                                onClick={() => transition(a.action, a.body)}
                                className="flex-1 py-2 rounded-xl text-white text-[11px] font-black transition-all hover:opacity-90"
                                style={{ background: a.color }}>
                                {a.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Comments / replies */}
                {(ticket.comments?.length ?? 0) > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-2">
                            Replies ({ticket.comments!.length})
                        </p>
                        <div className="space-y-2">
                            {ticket.comments!.map(c => {
                                const isOfficial = c.user?.role === 'admin' || c.user?.role === 'staff' || c.user?.role === 'team_leader';
                                return (
                                    <div key={c.id} className="flex gap-2">
                                        {/* Comment author avatar */}
                                    {(() => {
                                        const cu = c.user as TicketUser | undefined;
                                        const cp = ticketUserPhoto(cu);
                                        return cp ? (
                                            <img src={cp} className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-100"
                                                onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] flex-shrink-0"
                                                style={{ background: GS }}>
                                                {ticketInitials(cu)}
                                            </div>
                                        );
                                    })()}
                                        <div className="flex-1 min-w-0">
                                            <div className="px-2.5 py-2 rounded-xl rounded-tl-sm"
                                                style={c.is_internal
                                                    ? { background: '#fef9ec', border: '1px solid #fde68a' }
                                                    : { background: isOfficial ? `${G0}0d` : '#f3f4f6' }}>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] font-black"
                                                        style={{ color: isOfficial ? G0 : '#374151' }}>
                                                        {ticketUserName(c.user as TicketUser)}
                                                    </span>
                                                    {isOfficial && (
                                                        <span className="text-[9px] font-black px-1 py-0.5 rounded"
                                                            style={{ background: `${G0}15`, color: G0 }}>
                                                            Staff
                                                        </span>
                                                    )}
                                                    {c.is_internal && (
                                                        <span className="text-[9px] font-black px-1 py-0.5 rounded"
                                                            style={{ background: '#fef3c7', color: '#b45309' }}>
                                                            Internal
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] text-gray-400 ml-auto">
                                                        {c.time_ago ?? ago(c.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-700 leading-relaxed">
                                                    {c.content ?? c.body}
                                                </p>
                                                {/* Comment attachments */}
                                                {(c.attachments?.length ?? 0) > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                        {c.attachments!.map(att => {
                                                            const isImg = att.mime_type?.startsWith('image/');
                                                            const isVid = att.mime_type?.startsWith('video/');
                                                            const url   = att.file_url ?? `/storage/${att.file_path}`;
                                                            return (
                                                                <a key={att.id} href={url} target="_blank" rel="noreferrer"
                                                                    className="flex-shrink-0 block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
                                                                    {isImg ? (
                                                                        <img src={url} className="w-16 h-16 object-cover" />
                                                                    ) : isVid ? (
                                                                        <div className="w-16 h-16 bg-gray-100 flex flex-col items-center justify-center gap-0.5">
                                                                            <span className="text-lg">🎬</span>
                                                                            <span className="text-[8px] text-gray-400 truncate w-14 text-center px-1">{att.file_name}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-16 h-16 bg-gray-100 flex flex-col items-center justify-center gap-0.5 p-1">
                                                                            <FileText className="w-4 h-4 text-gray-400" />
                                                                            <span className="text-[8px] text-gray-400 truncate w-full text-center">{att.file_name}</span>
                                                                        </div>
                                                                    )}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Compose — only for open tickets */}
            {ticket.status !== 'closed' && (
                <div className="flex-shrink-0 border-t border-gray-100 p-3 space-y-2">
                    {/* Internal toggle for managers */}
                    {canManage && (
                        <div className="flex gap-1.5">
                            <button onClick={() => setIsInternal(false)}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-black border-2 transition-all"
                                style={!isInternal
                                    ? { background: G0, color: 'white', borderColor: G0 }
                                    : { background: 'white', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                                Public Reply
                            </button>
                            <button onClick={() => setIsInternal(true)}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-black border-2 transition-all"
                                style={isInternal
                                    ? { background: '#fef9ec', color: '#b45309', borderColor: '#fde68a' }
                                    : { background: 'white', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                                🔒 Internal Note
                            </button>
                        </div>
                    )}
                    <input ref={replyFileRef} type="file" multiple
                        accept="image/*,video/*,application/pdf,.doc,.docx,.xlsx"
                        className="hidden"
                        onChange={e => setReplyFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])} />

                    {/* File previews */}
                    {replyFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1">
                            {replyFiles.map((f, i) => (
                                <div key={i} className="relative group flex-shrink-0">
                                    {f.type.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(f)}
                                            className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200" />
                                    ) : f.type.startsWith('video/') ? (
                                        <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-0.5">
                                            <span className="text-lg">🎬</span>
                                            <span className="text-[8px] text-gray-400 truncate w-12 text-center">{f.name}</span>
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-0.5 p-1">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <span className="text-[8px] text-gray-400 truncate w-full text-center">{f.name}</span>
                                        </div>
                                    )}
                                    <button onClick={() => setReplyFiles(prev => prev.filter((_,j) => j !== i))}
                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-1.5 items-end">
                        <button onClick={() => replyFileRef.current?.click()}
                            className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors"
                            style={replyFiles.length > 0
                                ? { background: `${G0}15`, color: G0 }
                                : { background: '#f3f4f6', color: '#9ca3af' }}
                            title="Attach file">
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <textarea value={comment}
                            onChange={e => setComment(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(isInternal); } }}
                            placeholder={isInternal ? 'Internal note (only visible to staff)…' : 'Type your reply…'}
                            rows={2}
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 resize-none focus:outline-none focus:ring-2 transition-all"
                            style={{
                                '--tw-ring-color': `${G0}25`,
                                ...(isInternal ? { background: '#fef9ec', borderColor: '#fde68a' } : {}),
                            } as React.CSSProperties} />
                        <button onClick={() => addComment(isInternal)}
                            disabled={submitting || (!comment.trim() && replyFiles.length === 0)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-white disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
                            style={{ background: isInternal ? 'linear-gradient(135deg,#b45309,#d97706)' : GS }}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            )}
            {ticket.status === 'closed' && (
                <div className="flex-shrink-0 px-3 py-3 text-center border-t border-gray-100" style={{ background: '#f7f8fc' }}>
                    <p className="text-[11px] text-gray-500 font-semibold">This ticket is closed.</p>
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// IDEAS / SUGGESTIONS PANEL
// ════════════════════════════════════════════════════════════════════════════
function IdeasPanel({ user, role, onClose }: { user: AuthUser; role: UserRole; onClose: () => void }) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading]         = useState(false);
    const [showCreate, setShowCreate]   = useState(false);
    const [activeId, setActiveId]       = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sort, setSort]               = useState<'votes' | 'newest'>('votes');

    const canCreate = ['teacher', 'team_leader', 'staff'].includes(role);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const url = `/api/suggestions?per_page=50&sort_by=${sort === 'votes' ? 'votes_count' : 'created_at'}&sort_order=desc`;
        const data = await apiGet<Suggestion[]>(url);
        if (data) setSuggestions(data);
        if (!silent) setLoading(false);
    }, [sort]);

    useEffect(() => { load(); }, [load]);

    // Optimistic vote — no full reload flash
    async function vote(e: React.MouseEvent, id: number, type: 'up' | 'down') {
        e.stopPropagation();
        e.preventDefault();
        // Optimistic update
        setSuggestions(prev => prev.map(s => {
            if (s.id !== id) return s;
            const wasVoted = s.my_vote === type;
            return {
                ...s,
                my_vote: wasVoted ? null : type,
                votes_count: (s.votes_count ?? 0) + (wasVoted ? -1 : s.my_vote ? 0 : 1),
            };
        }));
        await apiPost(`/api/suggestions/${id}/vote`, { vote: type });
        load(true);
    }

    const filtered = suggestions.filter(s => filterStatus === 'all' || s.status === filterStatus);
    const STATUS_FILTERS = ['all','submitted','under_review','planned','in_development','implemented','rejected'];

    if (showCreate) return <CreateSuggestionForm role={role} user={user}
        onBack={() => { setShowCreate(false); load(); }} onClose={onClose} />;
    if (activeId !== null) return <SuggestionDetail id={activeId} user={user} role={role}
        onBack={() => { setActiveId(null); load(true); }} onClose={onClose} />;

    return (
        <div className="flex flex-col h-full">
            {/* Header actions */}
            <div className="px-3 pt-3 pb-2 flex gap-1.5 flex-shrink-0">
                <div className="flex gap-1 flex-1">
                    {(['votes','newest'] as const).map(s => (
                        <button key={s} onClick={() => setSort(s)}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                            style={sort === s ? { background: G0, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                            {s === 'votes' ? '🔥 Top' : '🆕 New'}
                        </button>
                    ))}
                </div>
                {canCreate && (
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
                        <Sparkles className="w-3.5 h-3.5" />Suggest
                    </button>
                )}
               
                {ideasMgmtHref(role) && (
                    <Link href={ideasMgmtHref(role)!} onClick={onClose}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-red-50"
                        style={{ color: '#b91c1c' }} title="Manage all suggestions">
                        <Shield className="w-3.5 h-3.5" />Manage
                    </Link>
                )}
            </div>

            {/* Status chips */}
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
                {STATUS_FILTERS.map(s => {
                    const cfg = SUGGESTION_STATUS[s] ?? { label: 'All', color: G0, bg: '#e0e7ff' };
                    const count = s === 'all' ? suggestions.length : suggestions.filter(x => x.status === s).length;
                    return (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1"
                            style={filterStatus === s ? { background: G0, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                            {s === 'all' ? 'All' : cfg.label}
                            {count > 0 && (
                                <span className="text-[9px] px-1 rounded-full"
                                    style={filterStatus === s ? { background: 'rgba(255,255,255,0.25)' } : { background: '#e5e7eb' }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Suggestion list — using divs NOT buttons to avoid nested button error */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-2">
                {loading ? <Spinner label="Loading ideas…" />
                : filtered.length === 0
                ? <Empty Icon={Lightbulb} title="No suggestions yet"
                    sub={canCreate ? 'Share your idea with the team!' : 'No suggestions to show'} />
                : filtered.map(sug => {
                    const st        = SUGGESTION_STATUS[sug.status] ?? SUGGESTION_STATUS['pending'];
                    const submitter = getSuggestionSubmitter(sug);
                    const photo     = !sug.is_anonymous ? suggestionUserPhoto(submitter) : null;
                    const name      = sug.is_anonymous ? 'Anonymous' : suggestionUserName(submitter);
                    const catIcon   = { operations: '⚙️', policy: '📜', facility: '🏫', system: '💻', other: '💡' }[sug.category ?? ''] ?? '💡';

                    return (
                        // ── Use div (not button) to allow vote buttons inside ──
                        <div key={sug.id}
                            onClick={() => setActiveId(sug.id)}
                            className="flex items-start gap-2.5 px-3 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 cursor-pointer group">

                            {/* Vote column */}
                            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-1"
                                onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={e => vote(e, sug.id, 'up')}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                                    style={sug.my_vote === 'up'
                                        ? { background: '#dcfce7', color: '#15803d' }
                                        : { background: '#f3f4f6', color: '#9ca3af' }}>
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[11px] font-black leading-none py-0.5"
                                    style={{ color: sug.votes_count && sug.votes_count > 0 ? G0 : '#9ca3af' }}>
                                    {sug.votes_count ?? 0}
                                </span>
                                <button
                                    onClick={e => vote(e, sug.id, 'down')}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                                    style={sug.my_vote === 'down'
                                        ? { background: '#fee2e2', color: '#b91c1c' }
                                        : { background: '#f3f4f6', color: '#9ca3af' }}>
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Submitter row */}
                                <div className="flex items-center gap-1.5 mb-1">
                                    {/* Avatar */}
                                    {photo ? (
                                        <img src={photo} className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-gray-100"
                                            onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[8px] flex-shrink-0"
                                            style={{ background: sug.is_anonymous ? '#9ca3af' : GS }}>
                                            {sug.is_anonymous ? '?' : (name.charAt(0).toUpperCase())}
                                        </div>
                                    )}
                                    <span className="text-[10px] font-semibold text-gray-600 truncate">{name}</span>
                                    <span className="text-[9px] text-gray-300 mx-0.5">·</span>
                                    <span className="text-[9px]">{catIcon}</span>
                                    <span className="text-[9px] text-gray-400 ml-auto flex-shrink-0">{ago(sug.created_at)}</span>
                                </div>

                                {/* Title */}
                                <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-blue-900">
                                    {sug.title}
                                </p>

                                {/* Excerpt if available */}
                                {sug.excerpt && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{sug.excerpt}</p>
                                )}

                                {/* Status badge */}
                                <div className="flex items-center gap-1 mt-1.5">
                                    <Badge label={st.label} color={st.color} bg={st.bg} />
                                    {sug.category_label && (
                                        <span className="text-[10px] text-gray-400">{sug.category_label}</span>
                                    )}
                                    <ChevronRight className="w-3 h-3 text-gray-300 ml-auto group-hover:text-gray-400" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2 flex gap-2" style={{ background: '#f7f8fc' }}>
                {canCreate && (
                    <button onClick={() => setShowCreate(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-amber-50 transition-colors"
                        style={{ color: '#d97706' }}>
                        <Sparkles className="w-3.5 h-3.5" />New Idea
                    </button>
                )}
              
            </div>
        </div>
    );
}

function CreateSuggestionForm({ role, user, onBack, onClose }: { role: UserRole; user: AuthUser; onBack: () => void; onClose: () => void }) {
    const CATS = ['operations','policy','facility','system','other'];
    const CAT_LABELS: Record<string, string> = { operations: 'Operations', policy: 'Policy', facility: 'Facility', system: 'System', other: 'Other' };
    const [form, setForm] = useState({ title: '', body: '', category: '', is_anonymous: false });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    async function submit() {
        const e: Record<string, string> = {};
        if (!form.title.trim()) e.title = 'Title is required';
        if (!form.body.trim()) e.body = 'Description is required';
        if (!form.category) e.category = 'Category is required';
        setErrors(e);
        if (Object.keys(e).length) return;
        setSubmitting(true);
        const res = await apiPost('/api/suggestions', form);
        setSubmitting(false);
        if (res.success) { setDone(true); setTimeout(onBack, 1500); }
        else if (res.errors) setErrors(Object.fromEntries(Object.entries(res.errors).map(([k, v]) => [k, (v as string[])[0]])));
    }

    if (done) return (
        <div className="flex flex-col items-center justify-center gap-3 h-full">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
                <Sparkles className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-sm font-black text-gray-800">Idea submitted!</p>
            <p className="text-xs text-gray-500">Thank you for sharing.</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <p className="text-xs font-black" style={{ color: G0 }}>New Suggestion</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="What's your suggestion about?"
                        className="w-full text-xs px-3 py-2 rounded-lg border focus:outline-none"
                        style={{ borderColor: errors.title ? '#ef4444' : '#e5e7eb' }} />
                    {errors.title && <p className="text-[10px] text-red-500 mt-0.5">{errors.title}</p>}
                </div>
                <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Category *</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full text-xs px-3 py-2 rounded-lg border focus:outline-none bg-white"
                        style={{ borderColor: errors.category ? '#ef4444' : '#e5e7eb' }}>
                        <option value="">Select category…</option>
                        {CATS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </select>
                    {errors.category && <p className="text-[10px] text-red-500 mt-0.5">{errors.category}</p>}
                </div>
                <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Description *</label>
                    <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                        placeholder="Describe your idea in detail…" rows={4}
                        className="w-full text-xs px-3 py-2 rounded-lg border focus:outline-none resize-none"
                        style={{ borderColor: errors.body ? '#ef4444' : '#e5e7eb' }} />
                    {errors.body && <p className="text-[10px] text-red-500 mt-0.5">{errors.body}</p>}
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" checked={form.is_anonymous}
                            onChange={e => setForm(p => ({ ...p, is_anonymous: e.target.checked }))} className="sr-only" />
                        <div className="w-9 h-5 rounded-full transition-all" style={{ background: form.is_anonymous ? G0 : '#d1d5db' }}>
                            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                                style={{ transform: form.is_anonymous ? 'translateX(16px)' : 'translateX(0)' }} />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-700">Submit anonymously</p>
                        <p className="text-[10px] text-gray-400">Your name won't be shown to others</p>
                    </div>
                </label>
            </div>
            <div className="flex-shrink-0 px-3 py-2.5 border-t border-gray-100 flex gap-2">
                <button onClick={onBack} className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={submit} disabled={submitting}
                    className="flex-1 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
                    style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Submit
                </button>
            </div>
        </div>
    );
}

// Status pipeline for admin/staff management
const SUGGESTION_PIPELINE: { status: string; label: string; icon: string; color: string; bg: string }[] = [
    { status: 'submitted',      label: 'Submitted',      icon: '📥', color: '#0369a1', bg: '#e0f2fe' },
    { status: 'under_review',   label: 'Under Review',   icon: '🔍', color: '#b45309', bg: '#fef3c7' },
    { status: 'planned',        label: 'Planned',        icon: '📋', color: '#6d28d9', bg: '#ede9fe' },
    { status: 'in_development', label: 'In Development', icon: '⚙️', color: '#0d1b3e', bg: '#e0e7ff' },
    { status: 'implemented',    label: 'Implemented',    icon: '✅', color: '#15803d', bg: '#dcfce7' },
    { status: 'rejected',       label: 'Rejected',       icon: '❌', color: '#b91c1c', bg: '#fee2e2' },
];

function SuggestionDetail({ id, user, role, onBack, onClose }: { id: number; user: AuthUser; role: UserRole; onBack: () => void; onClose: () => void }) {
    interface CommentUser {
        id?: number; first_name?: string; last_name?: string; real_name?: string;
        profile_photo_path?: string; profile_photo_url?: string; role?: string;
    }
    interface SugComment {
        id: number; content?: string; body?: string; is_official_comment?: boolean;
        created_at: string; time_ago?: string;
        commenter?: CommentUser; user?: CommentUser;
    }
    interface SugDetail extends Suggestion {
        body?: string;
        official_update?: string;
        comments?: SugComment[];
    }

    const [sug, setSug]           = useState<SugDetail | null>(null);
    const [loading, setLoading]   = useState(true);
    const [comment, setComment]   = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Status update panel (admin/staff only)
    const [showStatusPanel, setShowStatusPanel] = useState(false);
    const [newStatus, setNewStatus]             = useState('');
    const [officialNote, setOfficialNote]       = useState('');
    const [updatingStatus, setUpdatingStatus]   = useState(false);
    const [statusSuccess, setStatusSuccess]     = useState('');

    const canManage = role === 'admin' || role === 'staff';

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const data = await apiGet<SugDetail>(`/api/suggestions/${id}`);
        if (data) setSug(data);
        if (!silent) setLoading(false);
    }, [id]);

    useEffect(() => { load(); }, [load]);

    async function vote(type: 'up' | 'down') {
        // Optimistic
        setSug(prev => prev ? {
            ...prev,
            my_vote: prev.my_vote === type ? null : type,
            votes_count: (prev.votes_count ?? 0) + (prev.my_vote === type ? -1 : prev.my_vote ? 0 : 1),
        } : prev);
        await apiPost(`/api/suggestions/${id}/vote`, { vote: type });
        load(true);
    }

    async function addComment() {
        if (!comment.trim()) return;
        setSubmitting(true);
        const res = await apiPost(`/api/suggestions/${id}/comments`, { body: comment });
        if (res.success) { setComment(''); load(true); }
        setSubmitting(false);
    }

    async function updateStatus() {
        if (!newStatus) return;
        setUpdatingStatus(true);
        const res = await apiPost(`/api/suggestions/${id}/status`, {
            status: newStatus,
            note: officialNote.trim() || undefined,
        });
        setUpdatingStatus(false);
        if (res.success) {
            setStatusSuccess(`Status updated to "${SUGGESTION_PIPELINE.find(p => p.status === newStatus)?.label}"!`);
            setOfficialNote('');
            setShowStatusPanel(false);
            load(true);
            setTimeout(() => setStatusSuccess(''), 3000);
        }
    }

    if (loading || !sug) return <div className="h-full flex items-center justify-center"><Spinner label="Loading…" /></div>;

    const st         = SUGGESTION_STATUS[sug.status] ?? SUGGESTION_STATUS['pending'];
    const submitter  = getSuggestionSubmitter(sug);
    const subPhoto   = !sug.is_anonymous ? suggestionUserPhoto(submitter) : null;
    const subName    = sug.is_anonymous ? 'Anonymous' : suggestionUserName(submitter);
    const catIcon    = { operations: '⚙️', policy: '📜', facility: '🏫', system: '💻', other: '💡' }[sug.category ?? ''] ?? '💡';
    const pipelineIdx = SUGGESTION_PIPELINE.findIndex(p => p.status === sug.status);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <p className="text-xs font-black flex-1 truncate" style={{ color: G0 }}>Suggestion</p>
                {canManage && (
                    <button onClick={() => { setNewStatus(sug.status); setShowStatusPanel(s => !s); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black transition-all"
                        style={showStatusPanel
                            ? { background: G0, color: 'white' }
                            : { background: `${G0}12`, color: G0 }}>
                        <Edit2 className="w-3 h-3" />Manage
                    </button>
                )}
                <Link href={ideasHref(role, id)} onClick={onClose}
                    className="text-[10px] font-bold opacity-60 hover:opacity-100 flex items-center gap-0.5 flex-shrink-0" style={{ color: G0 }}>
                    <ArrowUpRight className="w-3 h-3" />Full
                </Link>
            </div>

            {/* Status success toast */}
            {statusSuccess && (
                <div className="mx-3 mt-2 px-3 py-2 rounded-xl text-white text-[11px] font-bold flex items-center gap-2 flex-shrink-0"
                    style={{ background: '#15803d', animation: 'mn2Panel 0.2s ease-out both' }}>
                    <span>✅</span>{statusSuccess}
                </div>
            )}

            {/* Admin/Staff status management panel */}
            {canManage && showStatusPanel && (
                <div className="flex-shrink-0 mx-3 mt-2 rounded-2xl border-2 overflow-hidden"
                    style={{ borderColor: `${G0}20`, background: `${G0}04` }}>
                    {/* Section title */}
                    <div className="px-3 py-2 flex items-center gap-2" style={{ background: `${G0}10` }}>
                        <Edit2 className="w-3.5 h-3.5" style={{ color: G0 }} />
                        <p className="text-[11px] font-black" style={{ color: G0 }}>Update Progress</p>
                    </div>

                    {/* Pipeline steps — horizontal scrollable */}
                    <div className="px-3 py-2.5 overflow-x-auto">
                        <div className="flex gap-1.5 min-w-max">
                            {SUGGESTION_PIPELINE.map((step, idx) => {
                                const isCurrent = sug.status === step.status;
                                const isPast    = idx < pipelineIdx;
                                const isNew     = newStatus === step.status;
                                return (
                                    <button key={step.status} type="button"
                                        onClick={() => setNewStatus(step.status)}
                                        className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border-2 transition-all min-w-[72px]"
                                        style={isNew
                                            ? { borderColor: step.color, background: step.bg }
                                            : isCurrent
                                                ? { borderColor: step.color, background: step.bg, opacity: 0.7 }
                                                : { borderColor: '#e5e7eb', background: 'white', opacity: isPast ? 0.5 : 1 }}>
                                        <span className="text-base leading-none">{step.icon}</span>
                                        <span className="text-[9px] font-black text-center leading-tight" style={{ color: isNew ? step.color : '#6b7280' }}>
                                            {step.label}
                                        </span>
                                        {isCurrent && !isNew && (
                                            <span className="text-[8px] font-black px-1 rounded" style={{ background: step.color, color: 'white' }}>NOW</span>
                                        )}
                                        {isNew && newStatus !== sug.status && (
                                            <span className="text-[8px] font-black px-1 rounded" style={{ background: step.color, color: 'white' }}>SET</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Official note */}
                    <div className="px-3 pb-3 space-y-2">
                        <textarea value={officialNote} onChange={e => setOfficialNote(e.target.value)}
                            placeholder="Official update message to the submitter (optional)…"
                            rows={2}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': `${G0}25` } as React.CSSProperties} />
                        <div className="flex gap-2">
                            <button onClick={() => { setShowStatusPanel(false); setNewStatus(''); setOfficialNote(''); }}
                                className="flex-1 py-2 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={updateStatus}
                                disabled={updatingStatus || !newStatus || newStatus === sug.status}
                                className="flex-1 py-2 rounded-xl text-white text-[11px] font-black disabled:opacity-40 flex items-center justify-center gap-1 transition-all hover:opacity-90"
                                style={{ background: GS }}>
                                {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                {newStatus && newStatus !== sug.status
                                    ? `Set → ${SUGGESTION_PIPELINE.find(p => p.status === newStatus)?.label}`
                                    : 'No change'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">

                {/* Submitter card */}
                <div className="flex items-start gap-2.5">
                    {subPhoto ? (
                        <img src={subPhoto} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                            onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    ) : (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                            style={{ background: sug.is_anonymous ? '#9ca3af' : GS }}>
                            {sug.is_anonymous ? '?' : subName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-black text-gray-800">{subName}</p>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{ago(sug.created_at)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                            <Badge label={st.label} color={st.color} bg={st.bg} />
                            <span className="text-[10px] text-gray-400">{catIcon} {sug.category_label ?? sug.category}</span>
                        </div>
                    </div>
                </div>

                {/* Title + body */}
                <div>
                    <p className="text-sm font-black text-gray-900 leading-snug mb-1.5">{sug.title}</p>
                    {sug.body && <p className="text-xs text-gray-600 leading-relaxed">{sug.body}</p>}
                </div>

                {/* Official update banner (if set) */}
                {sug.official_update && (
                    <div className="flex gap-2.5 p-3 rounded-xl border-l-4"
                        style={{ background: `${G0}06`, borderColor: G0 }}>
                        <Megaphone className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: G0 }} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wide mb-0.5" style={{ color: G0 }}>Official Update</p>
                            <p className="text-xs text-gray-700 leading-relaxed">{sug.official_update}</p>
                        </div>
                    </div>
                )}

                {/* Voting */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: `${G0}06` }}>
                    <button type="button" onClick={() => vote('up')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                        style={sug.my_vote === 'up' ? { background: '#dcfce7', color: '#15803d' } : { background: '#f3f4f6', color: '#6b7280' }}>
                        <ThumbsUp className="w-3.5 h-3.5" />Upvote
                    </button>
                    <div className="flex-1 text-center">
                        <p className="text-lg font-black leading-none" style={{ color: G0 }}>{sug.votes_count ?? 0}</p>
                        <p className="text-[9px] text-gray-400">votes</p>
                    </div>
                    <button type="button" onClick={() => vote('down')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                        style={sug.my_vote === 'down' ? { background: '#fee2e2', color: '#b91c1c' } : { background: '#f3f4f6', color: '#6b7280' }}>
                        <ThumbsDown className="w-3.5 h-3.5" />Downvote
                    </button>
                </div>

                {/* Comments */}
                {(sug.comments?.length ?? 0) > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-2">
                            Comments ({sug.comments!.length})
                        </p>
                        <div className="space-y-2">
                            {sug.comments!.map(c => {
                                const cu         = c.commenter ?? c.user;
                                const cuPhoto    = cu ? suggestionUserPhoto(cu as SuggestionUser) : null;
                                const cuName     = cu ? suggestionUserName(cu as SuggestionUser) : 'Unknown';
                                const isOfficial = c.is_official_comment ||
                                    (cu as any)?.role === 'admin' || (cu as any)?.role === 'staff';
                                return (
                                    <div key={c.id} className="flex gap-2">
                                        {cuPhoto ? (
                                            <img src={cuPhoto} className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-100"
                                                onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] flex-shrink-0"
                                                style={{ background: isOfficial ? G0 : GS }}>
                                                {cuName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="px-2.5 py-2 rounded-xl rounded-tl-sm"
                                                style={isOfficial
                                                    ? { background: `${G0}0d`, border: `1px solid ${G0}20` }
                                                    : { background: '#f3f4f6' }}>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] font-black"
                                                        style={{ color: isOfficial ? G0 : '#374151' }}>
                                                        {cuName}
                                                    </span>
                                                    {isOfficial && (
                                                        <span className="text-[9px] font-black px-1 py-0.5 rounded"
                                                            style={{ background: `${G0}15`, color: G0 }}>Staff</span>
                                                    )}
                                                    <span className="text-[9px] text-gray-400 ml-auto">
                                                        {c.time_ago ?? ago(c.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-700 leading-relaxed">
                                                    {c.content ?? c.body}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Comment compose */}
            <div className="flex-shrink-0 px-3 py-2.5 border-t border-gray-100 flex gap-2 items-end">
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                    placeholder={canManage ? 'Add official comment or feedback…' : 'Add a comment…'}
                    rows={2}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 resize-none focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': `${G0}25` } as React.CSSProperties} />
                <button onClick={addComment} disabled={submitting || !comment.trim()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-white disabled:opacity-40 flex-shrink-0 transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// ─── Online Status Selector ────────────────────────────────────────────────────
function OnlineStatusMenu({ myStatus, onSet }: { myStatus: OnlineStatus; onSet: (s: OnlineStatus) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const current = STATUS_ONLINE[myStatus];
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/20 text-white text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full" style={{ background: current.color }} />
                {current.label}
                <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[120px]">
                    {(Object.keys(STATUS_ONLINE) as OnlineStatus[]).map(s => {
                        const cfg = STATUS_ONLINE[s];
                        return (
                            <button key={s} onClick={() => { onSet(s); setOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                                {cfg.label}
                                {myStatus === s && <Check className="w-3 h-3 ml-auto text-gray-400" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Panel Header ──────────────────────────────────────────────────────────────
interface PanelHeaderProps {
    user: AuthUser;
    totalBadge: number;
    myStatus: OnlineStatus;
    onSetStatus: (s: OnlineStatus) => void;
    isDesktop: boolean;
    onMinimize: () => void;
    onClose: () => void;
}

function PanelHeader({ user, totalBadge, myStatus, onSetStatus, isDesktop, onMinimize, onClose }: PanelHeaderProps) {
    const displayName = user.first_name ?? user.name ?? 'You';
    return (
        <div className="flex flex-col flex-shrink-0" style={{ background: GS }}>
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                        <Avatar user={user} size={8} />
                        <span className="absolute -bottom-0.5 -right-0.5 block rounded-full border-2 border-transparent"
                            style={{ width: 10, height: 10, background: STATUS_ONLINE[myStatus].color, borderColor: G0 }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-black text-xs leading-none truncate">{displayName}</p>
                        <OnlineStatusMenu myStatus={myStatus} onSet={onSetStatus} />
                    </div>
                    {totalBadge > 0 && (
                        <span className="ml-1 flex items-center justify-center rounded-full bg-red-500 text-white font-black flex-shrink-0"
                            style={{ minWidth: '1.15rem', height: '1.15rem', fontSize: '9px', padding: '0 3px' }}>
                            {totalBadge > 99 ? '99+' : totalBadge}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <button onPointerDown={e => { e.stopPropagation(); onMinimize(); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white"
                        style={{ background: 'rgba(255,255,255,0.12)' }}>
                        {isDesktop ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onPointerDown={e => { e.stopPropagation(); onClose(); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white"
                        style={{ background: 'rgba(255,255,255,0.12)' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2 px-4 pb-2.5">
                <MessageSquare className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                <p className="text-white/70 text-[11px] font-semibold tracking-wide">Communications Center</p>
            </div>
        </div>
    );
}

// ─── Panel Body ────────────────────────────────────────────────────────────────
interface PanelBodyProps {
    activeTab: Tab;
    setActiveTab: (t: Tab) => void;
    user: AuthUser;
    role: UserRole;
    unreadCount: number;
    supportBadge: number;
    markTicketSeen: (id: number, status: string) => void;
    onClose: () => void;
}

function PanelBody({ activeTab, setActiveTab, user, role, unreadCount, supportBadge, markTicketSeen, onClose }: PanelBodyProps) {
    return (
        <div className="flex flex-col flex-1 overflow-hidden bg-white min-h-0">
            <div className="px-3 pt-3 pb-0 flex-shrink-0">
                <div className="flex gap-1 rounded-xl p-1" style={{ background: '#eef0f6' }}>
                    {TABS.map(tab => {
                        const badgeCount =
                            tab.id === 'chat'    ? unreadCount  :
                            tab.id === 'support' ? supportBadge : 0;
                        const showBadge = badgeCount > 0;
                        return (
                            <button key={tab.id} type="button"
                                onPointerDown={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all select-none relative ${
                                    activeTab === tab.id ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                                style={activeTab === tab.id ? { color: G0 } : {}}>
                                <tab.Icon className="w-3.5 h-3.5" />
                                {tab.label}
                                {showBadge && (
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-black"
                                        style={{
                                            background: tab.id === 'support' ? '#dc2626' : '#ef4444',
                                            minWidth: '1rem', height: '1rem', fontSize: '8px', padding: '0 2px',
                                        }}>
                                        {badgeCount > 9 ? '9+' : badgeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="flex-1 overflow-hidden min-h-0 mt-1">
                {activeTab === 'chat'    && <ChatPanel    user={user} role={role} onClose={onClose} />}
                {activeTab === 'support' && <SupportPanel user={user} role={role} markTicketSeen={markTicketSeen} onClose={onClose} />}
                {activeTab === 'ideas'   && <IdeasPanel   user={user} role={role} onClose={onClose} />}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: CommsButton
// ════════════════════════════════════════════════════════════════════════════
export default function CommsButton() {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;
    const role = (user?.role ?? 'teacher') as UserRole;

    const [open,          setOpen]         = useState(false);
    const [minimized,     setMinimized]     = useState(false);
    const [activeTab,     setActiveTab]     = useState<Tab>('chat');
    const [totalBadge,    setTotalBadge]    = useState(0);
    const [supportBadge,  setSupportBadge]  = useState(0);
    const [isDesktop,     setIsDesktop]     = useState(false);

    const { myStatus, setMyStatus } = useOnlineStatus(user?.id);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        setIsDesktop(mq.matches);
        const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', h);
        return () => mq.removeEventListener('change', h);
    }, []);

    const fetchBadge = useCallback(async () => {
        if (!user) return;
        const data = await apiGet<{ unread_count?: number }[]>('/api/conversations?per_page=50');
        if (data) setTotalBadge(data.reduce((s, c) => s + (c.unread_count ?? 0), 0));
    }, [user]);

    // localStorage key for seen ticket statuses per user
    const seenKey = user ? `mn2_seen_tickets_${user.id}` : null;

    function getSeenStatuses(): Record<number, string> {
        if (!seenKey) return {};
        try { return JSON.parse(localStorage.getItem(seenKey) ?? '{}'); } catch { return {}; }
    }

    function markTicketSeen(ticketId: number, status: string) {
        if (!seenKey) return;
        try {
            const seen = getSeenStatuses();
            seen[ticketId] = status;
            localStorage.setItem(seenKey, JSON.stringify(seen));
            // Recompute badge immediately
            fetchSupportBadge();
        } catch { /* ignore */ }
    }

    const fetchSupportBadge = useCallback(async () => {
        if (!user || !seenKey) return;
        const data = await apiGet<SupportTicket[]>('/api/support-tickets?per_page=50');
        if (!data) return;

        let seenMap: Record<number, string> = {};
        try { seenMap = JSON.parse(localStorage.getItem(seenKey) ?? '{}'); } catch {}

        let count = 0;
        if (role === 'admin' || role === 'staff') {
            // Admin/staff: unseen NEW tickets (tickets they haven't acknowledged yet)
            count = data.filter(t =>
                t.status === 'new' && seenMap[t.id] !== 'new'
            ).length;
        } else {
            // Teachers/TLs: tickets whose status changed since they last viewed them
            // i.e. staff updated it (in_progress, resolved) but user hasn't re-opened it
            count = data.filter(t => {
                const seen = seenMap[t.id];
                // Count if status changed to something "staff did" and user hasn't seen it yet
                const isStaffUpdate = t.status === 'in_progress' || t.status === 'resolved' || t.status === 'assigned';
                return isStaffUpdate && seen !== t.status;
            }).length;
        }
        setSupportBadge(count);
    }, [user, role, seenKey]);

    useEffect(() => {
        if (!user) return;
        fetchBadge();
        fetchSupportBadge();
        const iv1 = setInterval(fetchBadge, 30_000);
        const iv2 = setInterval(fetchSupportBadge, 15_000);
        return () => { clearInterval(iv1); clearInterval(iv2); };
    }, [fetchBadge, fetchSupportBadge, user]);

    useEffect(() => {
        return router.on('start', () => { setOpen(false); setMinimized(false); });
    }, []);

    useEffect(() => {
        document.body.style.overflow = (open && !minimized && !isDesktop) ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open, minimized, isDesktop]);

    if (!user) return null;

    const doOpen     = () => { setOpen(true); setMinimized(false); };
    const doMinimize = () => setMinimized(true);
    const doMaximize = () => setMinimized(false);
    const doClose    = () => { setOpen(false); setMinimized(false); };

    const headerProps: PanelHeaderProps = { user, totalBadge, myStatus, onSetStatus: setMyStatus, isDesktop, onMinimize: doMinimize, onClose: doClose };
    const bodyProps: PanelBodyProps     = { activeTab, setActiveTab, user, role, unreadCount: totalBadge, supportBadge, markTicketSeen, onClose: doClose };

    const FAB = (
        <button onClick={doOpen} aria-label="Open Communications"
            className="fixed bottom-6 right-6 z-[55] group flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-2xl text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all duration-200 select-none"
            style={{ background: GS, boxShadow: '0 8px 24px rgba(13,27,62,0.35)' }}>
            <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full border-2"
                style={{ background: STATUS_ONLINE[myStatus].color, borderColor: G0 }} />
            <div className="relative w-5 h-5 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
                {totalBadge > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center rounded-full bg-red-500 text-white font-black animate-bounce"
                        style={{ minWidth: '1.1rem', height: '1.1rem', fontSize: '9px', padding: '0 2px', boxShadow: `0 0 0 2px ${G0}` }}>
                        {totalBadge > 9 ? '9+' : totalBadge}
                    </span>
                )}
            </div>
            <span className="leading-none relative">Chat · Support · Ideas</span>
        </button>
    );

    // ── DESKTOP ────────────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <>
                {!open && FAB}
                {open && (
                    <>
                        <div className="fixed inset-0 z-[59]" onClick={doClose} style={{ background: 'transparent' }} />
                        <div className="fixed top-0 right-0 z-[60] flex"
                            style={{ height: '100dvh', width: minimized ? '48px' : 'min(420px, 38vw)', pointerEvents: 'auto' }}>
                            {minimized && (
                                <div className="flex flex-col items-center justify-between py-4 cursor-pointer select-none w-full"
                                    style={{ background: GS, boxShadow: '-4px 0 24px rgba(13,27,62,0.25)', animation: 'mn2SlideIn 0.22s cubic-bezier(0.34,1.2,0.64,1) both' }}
                                    onClick={doMaximize}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                            <ChevronLeft className="w-4 h-4 text-white" />
                                        </div>
                                        {totalBadge > 0 && (
                                            <span className="flex items-center justify-center rounded-full bg-red-500 text-white font-black"
                                                style={{ minWidth: '1.2rem', height: '1.2rem', fontSize: '9px', padding: '0 3px' }}>
                                                {totalBadge > 9 ? '9+' : totalBadge}
                                            </span>
                                        )}
                                        <span className="w-3 h-3 rounded-full border-2 border-white/50"
                                            style={{ background: STATUS_ONLINE[myStatus].color }} />
                                    </div>
                                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                        className="text-white font-black text-[11px] tracking-wider opacity-80">
                                        COMMUNICATIONS
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        {TABS.map(t => (
                                            <button key={t.id}
                                                onClick={e => { e.stopPropagation(); setActiveTab(t.id); doMaximize(); }}
                                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white"
                                                style={{ background: activeTab === t.id ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)' }}>
                                                <t.Icon className="w-4 h-4" />
                                            </button>
                                        ))}
                                        <button onClick={e => { e.stopPropagation(); doClose(); }}
                                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white mt-1"
                                            style={{ background: 'rgba(255,255,255,0.08)' }}>
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!minimized && (
                                <div className="flex flex-col w-full h-full overflow-hidden"
                                    style={{ background: 'white', boxShadow: '-8px 0 40px rgba(13,27,62,0.20)', animation: 'mn2DrawerSlide 0.28s cubic-bezier(0.34,1.2,0.64,1) both' }}>
                                    <PanelHeader {...headerProps} />
                                    <PanelBody {...bodyProps} />
                                </div>
                            )}
                        </div>
                    </>
                )}
                <style>{`
                    @keyframes mn2DrawerSlide { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }
                    @keyframes mn2SlideIn     { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }
                `}</style>
            </>
        );
    }

    // ── MOBILE ─────────────────────────────────────────────────────────────────
    return (
        <>
            {!open && FAB}
            {open && (
                <>
                    {!minimized && (
                        <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
                            style={{ background: 'white', animation: 'mn2MobileSlide 0.28s cubic-bezier(0.34,1.1,0.64,1) both' }}>
                            <PanelHeader {...headerProps} />
                            <PanelBody {...bodyProps} />
                        </div>
                    )}
                    {minimized && (
                        <div className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col overflow-hidden shadow-2xl"
                            style={{ animation: 'mn2Panel 0.2s ease-out both' }}>
                            <div className="flex items-center justify-between px-4 py-3" style={{ background: GS }}>
                                <div className="flex items-center gap-2.5 flex-1 cursor-pointer" onClick={doMaximize}>
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <p className="text-white font-black text-sm">Communications</p>
                                    {totalBadge > 0 && (
                                        <span className="flex items-center justify-center rounded-full bg-red-500 text-white font-black"
                                            style={{ minWidth: '1.15rem', height: '1.15rem', fontSize: '9px', padding: '0 3px' }}>
                                            {totalBadge > 9 ? '9+' : totalBadge}
                                        </span>
                                    )}
                                    <span className="w-2 h-2 rounded-full border border-white/50" style={{ background: STATUS_ONLINE[myStatus].color }} />
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                    <button onClick={doMaximize} className="p-1.5 rounded-lg text-white/70 hover:text-white" style={{ background: 'rgba(255,255,255,0.10)' }}>
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={doClose} className="p-1.5 rounded-lg text-white/70 hover:text-white" style={{ background: 'rgba(255,255,255,0.10)' }}>
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center px-4 py-2 gap-3 cursor-pointer" style={{ background: '#f7f8fc' }} onClick={doMaximize}>
                                <span className="text-[11px] font-semibold flex-1" style={{ color: G0 }}>Tap to expand</span>
                                {TABS.map(t => (
                                    <button key={t.id}
                                        onClick={e => { e.stopPropagation(); setActiveTab(t.id); doMaximize(); }}
                                        className="flex items-center gap-1 text-[11px] font-bold opacity-70"
                                        style={{ color: G0 }}>
                                        <t.Icon className="w-3.5 h-3.5" />{t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
            <style>{`
                @keyframes mn2Panel       { from { opacity:0; transform:translateY(16px); }  to { opacity:1; transform:translateY(0); } }
                @keyframes mn2MobileSlide { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
            `}</style>
        </>
    );
}