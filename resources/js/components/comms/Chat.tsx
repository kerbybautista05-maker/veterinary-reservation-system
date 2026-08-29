// components/comms/Chat.tsx
// ─── Chat panel: conversation list + thread + people + group/announcement modals

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@inertiajs/react';
import {
    MessageSquare, X, ChevronLeft, Plus, Search, ArrowUpRight, Loader2,
    MessageCircle, Users, Megaphone, Send, Paperclip, ThumbsUp, ThumbsDown,
    Check, Pin, Image, FileText, MoreHorizontal, Edit2, Trash2, Reply,
    SmilePlus, Bell, Shield, AlertCircle, RefreshCw, UserPlus, UserX,
} from 'lucide-react';

import { apiFetch, apiGet, apiPost, apiDelete } from './comms.api';
import {
    AuthUser, UserRole, Colleague, Conversation, Message, Participant,
    G0, G1, GS,
    ago, userName, userDisplayName, initials, userPhoto, getParticipants,
    getLastMessage, getPreviewText, normalizeMessages, normalizeReactions,
    playNewMessageSound, getStoredStatus, chatHref, chatMgmtHref,
    OnlineStatus, AnyUser, Reaction, MsgRead,
} from './comms.types';
import { Avatar, Badge, Spinner, Empty, SeenAvatars } from './CommsUI';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏', '✅', '💯'];

// ════════════════════════════════════════════════════════════════════════════
// PEOPLE PANEL
// ════════════════════════════════════════════════════════════════════════════


function MentionRow({ c, onSelect }: { c: Colleague; onSelect: () => void }) {
    return (
        <button onClick={onSelect} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left">
            <Avatar user={c} size={7} />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{userDisplayName(c)}</p>
                <p className="text-[10px] text-gray-400 capitalize">{c.role.replace('_', ' ')}</p>
            </div>
        </button>
    );
}


// Extended Colleague type that includes branch info returned by /api/comms/colleagues
interface ColleagueEx extends Colleague {
    branch_id?: number | null;
    branch_name?: string | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
    admin:       'Admin',
    staff:       'Staff',
    team_leader: 'Team Leader',
    teacher:     'Teacher',
};

const ROLE_COLORS: Record<UserRole, { color: string; bg: string }> = {
    admin:       { color: '#b91c1c', bg: '#fee2e2' },
    staff:       { color: '#0369a1', bg: '#e0f2fe' },
    team_leader: { color: '#15803d', bg: '#dcfce7' },
    teacher:     { color: '#6d28d9', bg: '#ede9fe' },
};

// Group colleagues by role for the People panel
function groupByRole(list: ColleagueEx[]): { role: UserRole; label: string; items: ColleagueEx[] }[] {
    const order: UserRole[] = ['admin', 'staff', 'team_leader', 'teacher'];
    return order
        .map(r => ({ role: r, label: ROLE_LABELS[r], items: list.filter(c => c.role === r) }))
        .filter(g => g.items.length > 0);
}

function PersonRow({ c, onStartDM, startingDM }: { c: ColleagueEx; onStartDM: (c: ColleagueEx) => void; startingDM: number | null }) {
    const isStarting = startingDM === c.id;
    const status = c.online_status ?? 'offline';
    const STATUS_COLORS: Record<OnlineStatus, string> = { online: '#22c55e', away: '#f59e0b', busy: '#ef4444', offline: '#9ca3af' };
    const STATUS_LABELS: Record<OnlineStatus, string> = { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' };
    const roleStyle = ROLE_COLORS[c.role] ?? { color: '#6b7280', bg: '#f3f4f6' };
    const isOnline = status !== 'offline';
    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-0">
            {/* Avatar with status dot */}
            <div className="relative flex-shrink-0">
                <Avatar user={c} size={11} />
                <span
                    className="absolute bottom-0 right-0 block w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                    style={{ background: STATUS_COLORS[status] }}
                />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-bold text-gray-900 truncate leading-tight">{userDisplayName(c)}</p>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 leading-none"
                        style={{ color: roleStyle.color, background: roleStyle.bg }}>
                        {ROLE_LABELS[c.role]}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold" style={{ color: STATUS_COLORS[status] }}>
                        {STATUS_LABELS[status]}
                    </span>
                    {c.branch_name && (
                        <>
                            <span className="text-gray-200 text-[10px]">·</span>
                            <span className="text-[10px] text-gray-400 truncate">{c.branch_name}</span>
                        </>
                    )}
                </div>
            </div>
            {/* DM button */}
            <button
                onClick={() => onStartDM(c)}
                disabled={isStarting}
                title={`Message ${userDisplayName(c)}`}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-40 active:scale-90"
                style={{ background: isOnline ? GS : '#f3f4f6' }}>
                {isStarting
                    ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: isOnline ? 'white' : '#9ca3af' }} />
                    : <MessageCircle className="w-4 h-4" style={{ color: isOnline ? 'white' : '#9ca3af' }} />}
            </button>
        </div>
    );
}

function PeoplePanel({ user, role, onStartDM, onClose }: {
    user: AuthUser; role: UserRole;
    onStartDM: (convId: number, colleague: Colleague) => void;
    onClose: () => void;
}) {
    const [colleagues, setColleagues]     = useState<ColleagueEx[]>([]);
    const [branches, setBranches]         = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [search, setSearch]             = useState('');
    const [filterRole, setFilterRole]     = useState<string>('');
    const [filterBranch, setFilterBranch] = useState<string>('');
    const [startingDM, setStartingDM]     = useState<number | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [colRes, brRes] = await Promise.all([
                apiFetch('/api/comms/colleagues'),
                apiFetch('/api/comms/branches'),
            ]);
            if (colRes.status === 403) { setError('Permission denied.'); setLoading(false); return; }
            if (!colRes.ok) { setError('Could not load colleagues.'); setLoading(false); return; }
            const j = await colRes.json();
            if (j.success && Array.isArray(j.data)) {
                setColleagues((j.data as ColleagueEx[]).filter(c => c.id !== user.id));
            }
            if (brRes.ok) {
                const bj = await brRes.json();
                if (bj.success && Array.isArray(bj.data)) setBranches(bj.data);
            }
        } catch { setError('Network error.'); }
        setLoading(false);
    }, [user.id]);

    const refreshStatus = useCallback(async () => {
        if (colleagues.length === 0) return;
        try {
            const ids = colleagues.map(c => c.id);
            const qs  = ids.map(id => `ids[]=${id}`).join('&');
            const r   = await apiFetch(`/api/users/online-status?${qs}`);
            if (!r.ok) return;
            const j = await r.json();
            if (j.success && j.data) {
                setColleagues(prev => prev.map(c => ({
                    ...c,
                    online_status: (j.data[c.id] ?? 'offline') as OnlineStatus,
                })));
            }
        } catch { /* silent */ }
    }, [colleagues]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        const iv = setInterval(refreshStatus, 30_000);
        return () => clearInterval(iv);
    }, [refreshStatus]);

    async function startDM(targetColleague: ColleagueEx) {
        setStartingDM(targetColleague.id);
        try {
            const res = await apiPost<{ id: number } | Conversation>('/api/conversations/direct', { user_id: targetColleague.id });
            if (res.success && res.data) {
                const convId = (res.data as { id: number }).id;
                if (convId) onStartDM(convId, targetColleague);
            }
        } finally { setStartingDM(null); }
    }

    // Client-side filtering
    const filtered = colleagues.filter(c => {
        const q = search.trim().toLowerCase();
        if (q) {
            const hay = [c.real_name, c.first_name, c.last_name].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        if (filterRole && c.role !== filterRole) return false;
        if (filterBranch && String(c.branch_id) !== filterBranch && !['admin', 'staff'].includes(c.role)) return false;
        return true;
    });

    const grouped  = groupByRole(filtered);
    const active   = filtered.filter(c => c.online_status && c.online_status !== 'offline');
    const offline  = filtered.filter(c => !c.online_status || c.online_status === 'offline');
    const showGrouped = !search.trim() && !filterRole;
    const availableRoles = Array.from(new Set(colleagues.map(c => c.role)));
    const onlineCount = colleagues.filter(c => c.online_status && c.online_status !== 'offline').length;
    const hasBranchFilter = branches.length > 0 && (availableRoles.includes('teacher') || availableRoles.includes('team_leader'));

    return (
        <div className="flex flex-col h-full bg-white">

            {/* ── Search bar ── */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                            ref={searchRef}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name…"
                            className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400"
                        />
                        {search && (
                            <button
                                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors">
                                <X className="w-2.5 h-2.5 text-white" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={load}
                        title="Refresh"
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0 transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Stats row */}
                {!loading && !error && colleagues.length > 0 && (
                    <div className="flex items-center gap-3 mt-2 px-0.5">
                        <span className="text-[11px] text-gray-400">
                            <span className="font-bold text-gray-700">{colleagues.length}</span> colleagues
                        </span>
                        {onlineCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                                <span className="font-bold text-green-600">{onlineCount}</span>
                                <span className="text-gray-400">online</span>
                            </span>
                        )}
                        {(filterRole || filterBranch || search) && (
                            <button
                                onClick={() => { setFilterRole(''); setFilterBranch(''); setSearch(''); }}
                                className="ml-auto text-[10px] font-bold text-blue-500 hover:text-blue-700 underline underline-offset-2">
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Role filter chips ── */}
            {!loading && !error && colleagues.length > 0 && (
                <div className="px-3 pb-2 flex-shrink-0">
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setFilterRole('')}
                            className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border"
                            style={!filterRole
                                ? { background: G0, color: 'white', borderColor: G0 }
                                : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }}>
                            All {!filterRole && filtered.length > 0 && <span className="ml-1 opacity-70 text-[9px]">{filtered.length}</span>}
                        </button>
                        {(['admin', 'staff', 'team_leader', 'teacher'] as UserRole[])
                            .filter(r => availableRoles.includes(r))
                            .map(r => {
                                const count = colleagues.filter(c => c.role === r).length;
                                const active = filterRole === r;
                                return (
                                    <button key={r}
                                        onClick={() => setFilterRole(active ? '' : r)}
                                        className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border flex items-center gap-1"
                                        style={active
                                            ? { background: ROLE_COLORS[r].color, color: 'white', borderColor: ROLE_COLORS[r].color }
                                            : { background: ROLE_COLORS[r].bg, color: ROLE_COLORS[r].color, borderColor: 'transparent' }}>
                                        {ROLE_LABELS[r]}
                                        <span className="text-[9px] opacity-70">{count}</span>
                                    </button>
                                );
                            })
                        }
                    </div>

                    {/* Branch filter — full-width select on its own row */}
                    {hasBranchFilter && (
                        <div className="mt-1.5 relative">
                            <select
                                value={filterBranch}
                                onChange={e => setFilterBranch(e.target.value)}
                                className="w-full text-xs font-semibold pl-3 pr-8 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 focus:outline-none focus:border-blue-300 appearance-none cursor-pointer">
                                <option value="">🏫 All branches</option>
                                {branches.map(b => <option key={b.id} value={String(b.id)}>🏫 {b.name}</option>)}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── List ── */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${G0}15` }}>
                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: G0 }} />
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Loading colleagues…</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-0.5">Something went wrong</p>
                            <p className="text-xs text-gray-400">{error}</p>
                        </div>
                        <button onClick={load}
                            className="text-xs font-bold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                            Try again
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-300" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-600 mb-0.5">
                                {search ? `No results for "${search}"` : 'No colleagues found'}
                            </p>
                            <p className="text-xs text-gray-400">
                                {search ? 'Try a different name' : 'No one to show here'}
                            </p>
                        </div>
                        {(search || filterRole || filterBranch) && (
                            <button onClick={() => { setSearch(''); setFilterRole(''); setFilterBranch(''); }}
                                className="text-xs font-bold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : showGrouped ? (
                    <>
                        {grouped.map(g => (
                            <div key={g.role}>
                                {/* Section header */}
                                <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2"
                                    style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ROLE_COLORS[g.role].color }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: ROLE_COLORS[g.role].color }}>
                                        {g.label}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-300 ml-0.5">— {g.items.length}</span>
                                </div>
                                {g.items.map(c => <PersonRow key={c.id} c={c} onStartDM={startDM} startingDM={startingDM} />)}
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        {active.length > 0 && (
                            <div>
                                <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2"
                                    style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
                                    <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Active</span>
                                    <span className="text-[10px] font-bold text-gray-300 ml-0.5">— {active.length}</span>
                                </div>
                                {active.map(c => <PersonRow key={c.id} c={c} onStartDM={startDM} startingDM={startingDM} />)}
                            </div>
                        )}
                        {offline.length > 0 && (
                            <div>
                                <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2"
                                    style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
                                    <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Offline</span>
                                    <span className="text-[10px] font-bold text-gray-300 ml-0.5">— {offline.length}</span>
                                </div>
                                {offline.map(c => <PersonRow key={c.id} c={c} onStartDM={startDM} startingDM={startingDM} />)}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Footer hint ── */}
            <div className="flex-shrink-0 px-4 py-2.5 border-t border-gray-100 flex items-center justify-center gap-1.5" style={{ background: '#f8fafc' }}>
                <MessageCircle className="w-3 h-3 text-gray-300" />
                <p className="text-[10px] text-gray-400">Tap the button to start a direct message</p>
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
    const [name, setName]               = useState('');
    const [desc, setDesc]               = useState('');
    const [colleagues, setColleagues]   = useState<ColleagueEx[]>([]);
    const [branches, setBranches]       = useState<{ id: number; name: string }[]>([]);
    const [selected, setSelected]       = useState<Set<number>>(new Set());
    const [loading, setLoading]         = useState(true);
    const [submitting, setSubmitting]   = useState(false);
    const [search, setSearch]           = useState('');
    const [filterRole, setFilterRole]   = useState<string>('');
    const [filterBranch, setFilterBranch] = useState<string>('');
    const [err, setErr]                 = useState('');
    const [iconFile, setIconFile]       = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        (async () => {
            const [colRes, brRes] = await Promise.all([
                apiFetch('/api/comms/colleagues'),
                apiFetch('/api/comms/branches'),
            ]);
            if (colRes.ok) {
                const j = await colRes.json();
                if (j.success && Array.isArray(j.data))
                    setColleagues((j.data as ColleagueEx[]).filter(c => c.id !== user.id));
            }
            if (brRes.ok) {
                const bj = await brRes.json();
                if (bj.success && Array.isArray(bj.data)) setBranches(bj.data);
            }
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
            const res = await apiPost<{ id: number }>('/api/conversations', {
                name: name.trim(),
                description: desc.trim() || undefined,
                participant_ids: [...selected],
            });
            if (!res.success || !res.data) { setErr(res.message ?? 'Failed to create group'); return; }
            const convId = (res.data as any).id as number;
            let finalIconUrl: string | undefined;
            if (iconFile && convId) {
                const fd = new FormData();
                fd.append('icon', iconFile);
                fd.append('name', name.trim());
                try {
                    const xsrf = document.cookie.split(';').reduce<string>((acc, c) => {
                        const [k, v] = c.trim().split('=');
                        return k === 'XSRF-TOKEN' ? decodeURIComponent(v) : acc;
                    }, '');
                    const r = await fetch(`/api/conversations/${convId}`, {
                        method: 'POST',
                        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}) },
                        credentials: 'include',
                        body: fd,
                    });
                    if (r.ok) { const j = await r.json(); finalIconUrl = j?.data?.icon_url ?? undefined; }
                } catch { /* icon upload failed */ }
            }
            onCreated(convId, name.trim(), finalIconUrl);
        } finally { setSubmitting(false); }
    }

    const availableRoles = Array.from(new Set(colleagues.map(c => c.role)));

    const filtered = colleagues.filter(c => {
        if (filterRole && c.role !== filterRole) return false;
        if (filterBranch && String(c.branch_id) !== filterBranch && !['admin', 'staff'].includes(c.role)) return false;
        if (search) {
            const hay = [c.real_name, c.first_name, c.last_name].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
    });

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.50)' }} onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col" style={{ background: 'white', maxHeight: '82dvh', animation: 'mn2Panel 0.2s ease-out both' }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: GS }}>
                    <p className="text-white font-black text-sm">New Group Chat</p>
                    <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                            <button type="button" onClick={() => iconInputRef.current?.click()}
                                className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors bg-gray-50 relative group">
                                {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Image className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                        <span className="text-[9px] text-gray-300 group-hover:text-gray-400 font-bold">ICON</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl"><Image className="w-5 h-5 text-white" /></div>
                            </button>
                            {iconPreview && (
                                <button onClick={removeIcon} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <input value={name} onChange={e => { setName(e.target.value); setErr(''); }} placeholder="Group name *"
                                className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': `${G0}30` } as React.CSSProperties} />
                            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)"
                                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': `${G0}30` } as React.CSSProperties} />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 -mt-1">Tap the box to set a group icon (JPG, PNG, WebP · max 2 MB)</p>
                    {err && <p className="text-[11px] text-red-500 mt-1">{err}</p>}
                    <input ref={iconInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg" className="hidden" onChange={handleIconChange} />
                </div>
                <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none" />
                    </div>
                    {/* Role filter chips */}
                    {!loading && availableRoles.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                            <button onClick={() => setFilterRole('')}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                                style={!filterRole ? { background: G0, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                                All
                            </button>
                            {(['admin', 'staff', 'team_leader', 'teacher'] as UserRole[])
                                .filter(r => availableRoles.includes(r))
                                .map(r => (
                                    <button key={r} onClick={() => setFilterRole(filterRole === r ? '' : r)}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                                        style={filterRole === r
                                            ? { background: ROLE_COLORS[r].color, color: 'white' }
                                            : { background: ROLE_COLORS[r].bg, color: ROLE_COLORS[r].color }}>
                                        {ROLE_LABELS[r]}
                                    </button>
                                ))
                            }
                            {/* Branch filter */}
                            {branches.length > 0 && (availableRoles.includes('teacher') || availableRoles.includes('team_leader')) && (
                                <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-600 focus:outline-none flex-shrink-0 cursor-pointer"
                                    style={{ maxWidth: 110 }}>
                                    <option value="">All branches</option>
                                    {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                                </select>
                            )}
                        </div>
                    )}
                    {selected.size > 0 && <p className="text-[10px] text-gray-500 mt-1.5">{selected.size} member{selected.size !== 1 ? 's' : ''} selected</p>}
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? <Spinner label="Loading colleagues…" /> : filtered.map(c => {
                        const roleStyle = ROLE_COLORS[c.role] ?? { color: '#6b7280', bg: '#f3f4f6' };
                        return (
                            <button key={c.id} onClick={() => setSelected(prev => {
                                const s = new Set(prev);
                                selected.has(c.id) ? s.delete(c.id) : s.add(c.id);
                                return s;
                            })} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                                <Avatar user={c} size={9} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-semibold text-gray-800 truncate">{userDisplayName(c)}</p>
                                        <span className="text-[9px] font-black px-1 py-0.5 rounded-full flex-shrink-0"
                                            style={{ color: roleStyle.color, background: roleStyle.bg }}>
                                            {ROLE_LABELS[c.role]}
                                        </span>
                                    </div>
                                    {c.branch_name && <p className="text-[10px] text-gray-400 truncate">{c.branch_name}</p>}
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.has(c.id) ? 'border-transparent' : 'border-gray-300'}`}
                                    style={selected.has(c.id) ? { background: G0 } : {}}>
                                    {selected.has(c.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
                    <button onClick={create} disabled={submitting || !name.trim() || selected.size === 0}
                        className="w-full py-2.5 rounded-xl text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: GS }}>
                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{iconFile ? 'Creating & uploading icon…' : 'Creating…'}</> : <><Users className="w-4 h-4" />Create Group ({selected.size} members)</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE ANNOUNCEMENT MODAL
// ════════════════════════════════════════════════════════════════════════════

type AudienceType = 'all_tl' | 'all_staff' | 'branch_teachers' | 'all_teachers' | 'all_tl_teachers' | 'all_staff_tl' | 'custom';

function CreateAnnouncementModal({ user, onCreated, onClose }: {
    user: AuthUser;
    onCreated: (convId: number, name: string) => void;
    onClose: () => void;
}) {
    const [name, setName]             = useState('');
    const [desc, setDesc]             = useState('');
    const [audience, setAudience]     = useState<AudienceType>('all_teachers');
    const [branchId, setBranchId]     = useState<string>('');
    const [branches, setBranches]     = useState<{ id: number; name: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr]               = useState('');

    useEffect(() => {
        apiGet<{ id: number; name: string }[]>('/api/branches').then(data => { if (data) setBranches(data); });
    }, []);

    const AUDIENCE_OPTIONS: { id: AudienceType; label: string; desc: string; icon: string; color: string }[] = [
        { id: 'all_teachers',    label: 'All Teachers',              desc: 'Every teacher across all branches',         icon: '📚', color: '#6d28d9' },
        { id: 'all_tl',         label: 'All Team Leaders',           desc: 'Every TL across all branches',             icon: '👥', color: '#15803d' },
        { id: 'all_staff',      label: 'All Staff',                  desc: 'Every staff member',                       icon: '🧑‍💼', color: '#0369a1' },
        { id: 'branch_teachers', label: 'Branch Teachers',           desc: 'All teachers in one specific branch',      icon: '🏫', color: '#b45309' },
        { id: 'all_tl_teachers', label: 'TLs + All Teachers',       desc: 'Team leaders and all teachers together',   icon: '🎓', color: '#0891b2' },
        { id: 'all_staff_tl',   label: 'Staff + Team Leaders',      desc: 'Staff and TLs only (no teachers)',         icon: '🏢', color: '#7c3aed' },
        { id: 'custom',         label: 'Everyone (All roles)',        desc: 'Admins, staff, TLs and all teachers',     icon: '🌐', color: '#0d1b3e' },
    ];

    async function create() {
        if (!name.trim()) { setErr('Channel name is required'); return; }
        if (audience === 'branch_teachers' && !branchId) { setErr('Please select a branch'); return; }
        setSubmitting(true);
        try {
            const res = await apiPost<{ id: number }>('/api/conversations', {
                type: 'announcement',
                name: name.trim(),
                description: desc.trim() || undefined,
                participant_ids: [user.id],
                audience_type: audience,
                audience_branch_id: audience === 'branch_teachers' ? Number(branchId) : undefined,
            });
            setSubmitting(false);
            if (res.success && res.data) {
                onCreated((res.data as any).id, name.trim());
            } else {
                const errMsg = res.errors ? Object.values(res.errors).flat().join(' ') : res.message ?? 'Failed to create channel';
                setErr(errMsg);
            }
        } catch { setSubmitting(false); setErr('Network error. Please try again.'); }
    }

    const selected = AUDIENCE_OPTIONS.find(o => o.id === audience);

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                style={{ background: 'white', maxHeight: '88dvh', animation: 'mn2Panel 0.2s ease-out both' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#b45309,#d97706)' }}>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors flex-shrink-0">
                        <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Megaphone className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-black text-sm leading-tight">New Announcement Channel</p>
                            <p className="text-white/60 text-[10px] leading-tight">Broadcast to your audience</p>
                        </div>
                    </div>
                </div>

                {/* Info banner */}
                <div className="px-4 py-2.5 flex items-start gap-2 flex-shrink-0"
                    style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                    <Bell className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-snug">
                        Only <strong>Admins</strong> and permitted <strong>Staff</strong> can post.
                        Selected audience members can read.
                    </p>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-4 space-y-4">

                        {/* Channel name */}
                        <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                                Channel Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={name}
                                onChange={e => { setName(e.target.value); setErr(''); }}
                                placeholder="e.g. MN2 General Announcements"
                                className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                                Description <span className="text-gray-300 font-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="What will this channel be used for?"
                                rows={2}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-amber-400 resize-none transition-colors"
                            />
                        </div>

                        {/* Audience selector */}
                        <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                Who can see this channel?
                            </label>
                            <div className="space-y-2">
                                {AUDIENCE_OPTIONS.map(opt => {
                                    const isActive = audience === opt.id;
                                    return (
                                        <button key={opt.id} type="button"
                                            onClick={() => { setAudience(opt.id); setBranchId(''); setErr(''); }}
                                            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-all"
                                            style={isActive
                                                ? { borderColor: opt.color, background: `${opt.color}0d` }
                                                : { borderColor: '#e5e7eb', background: 'white' }}>
                                            {/* Icon */}
                                            <span className="text-lg flex-shrink-0 leading-none">{opt.icon}</span>
                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-gray-800 leading-tight">{opt.label}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{opt.desc}</p>
                                            </div>
                                            {/* Radio dot */}
                                            <div className="w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                                                style={isActive
                                                    ? { borderColor: opt.color, background: opt.color }
                                                    : { borderColor: '#d1d5db', background: 'white' }}>
                                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Branch picker — shown only for branch_teachers */}
                            {audience === 'branch_teachers' && (
                                <div className="mt-2.5">
                                    <label className="text-[10px] font-black text-amber-700 uppercase tracking-wider block mb-1.5">
                                        Select Branch
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={branchId}
                                            onChange={e => { setBranchId(e.target.value); setErr(''); }}
                                            className="w-full text-sm font-semibold pl-3.5 pr-8 py-2.5 rounded-xl border-2 border-amber-300 bg-amber-50 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                                            style={{ color: '#92400e' }}>
                                            <option value="">Choose a branch…</option>
                                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Live summary pill */}
                            {selected && (
                                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                                    style={{ background: `${selected.color}12`, border: `1px solid ${selected.color}30` }}>
                                    <span className="text-sm">{selected.icon}</span>
                                    <p className="text-[11px] font-semibold" style={{ color: selected.color }}>
                                        Will be visible to: <strong>{selected.label}</strong>
                                        {audience === 'branch_teachers' && branchId && branches.find(b => String(b.id) === branchId)
                                            ? ` — ${branches.find(b => String(b.id) === branchId)?.name}`
                                            : ''}
                                    </p>
                                </div>
                            )}
                        </div>

                        {err && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                <p className="text-[11px] text-red-600 font-semibold">{err}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 flex gap-2.5 flex-shrink-0">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={create} disabled={submitting || !name.trim()}
                        className="flex-2 px-5 py-2.5 rounded-xl text-white text-xs font-black disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#b45309,#d97706)', flex: 2 }}>
                        {submitting
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Creating…</>
                            : <><Megaphone className="w-3.5 h-3.5" />Create Channel</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// MANAGE MEMBERS MODAL (add / remove group members)
// ════════════════════════════════════════════════════════════════════════════

function ManageMembersModal({ conversationId, user, conversation, initialTab, onClose }: {
    conversationId: number;
    user: AuthUser;
    conversation?: Conversation;
    initialTab?: 'members' | 'add';
    onClose: () => void;
}) {
    const [tab, setTab] = useState<'members' | 'add'>(initialTab ?? 'members');

    // ── Current members ──────────────────────────────────────────────────────
    const [members, setMembers]               = useState<Participant[]>([]);
    const [loadingMembers, setLoadingMembers]  = useState(true);
    const [kickConfirmId, setKickConfirmId]    = useState<number | null>(null);
    const [kickingId, setKickingId]            = useState<number | null>(null);

    // ── Add members (searchable, any role) ─────────────────────────────────
    const [colleagues, setColleagues]     = useState<ColleagueEx[]>([]);
    const [branches, setBranches]         = useState<{ id: number; name: string }[]>([]);
    const [loadingColleagues, setLoadingColleagues] = useState(true);
    const [search, setSearch]             = useState('');
    const [filterRole, setFilterRole]     = useState<string>('');
    const [filterBranch, setFilterBranch] = useState<string>('');
    const [selected, setSelected]         = useState<Set<number>>(new Set());
    const [adding, setAdding]             = useState(false);

    const [err, setErr] = useState('');

    const loadMembers = useCallback(async () => {
        setLoadingMembers(true);
        const data = await apiGet<Participant[]>(`/api/conversations/${conversationId}/participants`);
        setMembers(data ?? getParticipants(conversation ?? {} as Conversation));
        setLoadingMembers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    useEffect(() => { loadMembers(); }, [loadMembers]);

    useEffect(() => {
        (async () => {
            const [colRes, brRes] = await Promise.all([
                apiFetch('/api/comms/colleagues'),
                apiFetch('/api/comms/branches'),
            ]);
            if (colRes.ok) {
                const j = await colRes.json();
                if (j.success && Array.isArray(j.data)) setColleagues(j.data as ColleagueEx[]);
            }
            if (brRes.ok) {
                const bj = await brRes.json();
                if (bj.success && Array.isArray(bj.data)) setBranches(bj.data);
            }
            setLoadingColleagues(false);
        })();
    }, []);

    const memberIds = new Set(members.map(m => m.user_id));

    async function kick(userId: number) {
        setKickingId(userId);
        setErr('');
        const res = await apiDelete<unknown>(`/api/conversations/${conversationId}/participants/${userId}`);
        if (res.success) {
            setMembers(prev => prev.filter(m => m.user_id !== userId));
        } else {
            setErr(res.message ?? 'Failed to remove member');
        }
        setKickingId(null);
        setKickConfirmId(null);
    }

    async function addSelected() {
        if (selected.size === 0) return;
        setAdding(true);
        setErr('');
        const ids = [...selected];
        const results = await Promise.all(
            ids.map(id => apiPost<unknown>(`/api/conversations/${conversationId}/participants`, { user_id: id }))
        );
        const failed = results.filter(r => !r.success).length;
        setSelected(new Set());
        await loadMembers();
        setAdding(false);
        if (failed > 0) {
            setErr(failed === ids.length ? 'Failed to add members' : `${failed} member(s) could not be added`);
        } else {
            setTab('members');
        }
    }

    const availableRoles = Array.from(new Set(colleagues.map(c => c.role)));

    // Searchable across every role (admin / staff / team leader / teacher),
    // excluding people already in the group and yourself.
    const addable = colleagues.filter(c => {
        if (c.id === user.id || memberIds.has(c.id)) return false;
        if (filterRole && c.role !== filterRole) return false;
        if (filterBranch && String(c.branch_id) !== filterBranch && !['admin', 'staff'].includes(c.role)) return false;
        if (search) {
            const hay = [c.real_name, c.first_name, c.last_name].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
    });

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.50)' }} onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col" style={{ background: 'white', maxHeight: '82dvh', animation: 'mn2Panel 0.2s ease-out both' }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: GS }}>
                    <p className="text-white font-black text-sm">Group Members</p>
                    <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 flex-shrink-0">
                    <button onClick={() => setTab('members')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black transition-colors"
                        style={tab === 'members' ? { color: G0, borderBottom: `2px solid ${G0}` } : { color: '#9ca3af' }}>
                        <Users className="w-3.5 h-3.5" />Members ({members.length})
                    </button>
                    <button onClick={() => setTab('add')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black transition-colors"
                        style={tab === 'add' ? { color: G0, borderBottom: `2px solid ${G0}` } : { color: '#9ca3af' }}>
                        <UserPlus className="w-3.5 h-3.5" />Add
                    </button>
                </div>

                {err && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100 flex-shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <p className="text-[11px] text-red-600 font-semibold">{err}</p>
                    </div>
                )}

                {tab === 'members' ? (
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {loadingMembers ? <Spinner label="Loading members…" />
                        : members.length === 0 ? <Empty Icon={Users} title="No members" />
                        : members.map(m => {
                            const isSelf = m.user_id === user.id;
                            return (
                                <div key={m.user_id} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                                    <Avatar user={m.user} size={9} />
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-semibold text-gray-800 truncate">
                                                {userDisplayName(m.user)}{isSelf ? ' (You)' : ''}
                                            </p>
                                            {m.is_admin && (
                                                <span className="flex items-center gap-0.5 text-[9px] font-black px-1 py-0.5 rounded-full flex-shrink-0" style={{ color: '#b45309', background: '#fef3c7' }}>
                                                    <Shield className="w-2.5 h-2.5" />Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {!isSelf && (
                                        kickConfirmId === m.user_id ? (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button onClick={() => kick(m.user_id)} disabled={kickingId === m.user_id}
                                                    className="text-[10px] font-black px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-1">
                                                    {kickingId === m.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Remove'}
                                                </button>
                                                <button onClick={() => setKickConfirmId(null)} className="text-[10px] font-bold px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setKickConfirmId(m.user_id)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0 transition-colors" title="Remove from group">
                                                <UserX className="w-4 h-4" />
                                            </button>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
                            <div className="relative mb-2">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none" />
                            </div>
                            {!loadingColleagues && availableRoles.length > 0 && (
                                <div className="flex gap-1.5 overflow-x-auto pb-1">
                                    <button onClick={() => setFilterRole('')}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                                        style={!filterRole ? { background: G0, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                                        All
                                    </button>
                                    {(['admin', 'staff', 'team_leader', 'teacher'] as UserRole[])
                                        .filter(r => availableRoles.includes(r))
                                        .map(r => (
                                            <button key={r} onClick={() => setFilterRole(filterRole === r ? '' : r)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                                                style={filterRole === r
                                                    ? { background: ROLE_COLORS[r].color, color: 'white' }
                                                    : { background: ROLE_COLORS[r].bg, color: ROLE_COLORS[r].color }}>
                                                {ROLE_LABELS[r]}
                                            </button>
                                        ))
                                    }
                                    {branches.length > 0 && (availableRoles.includes('teacher') || availableRoles.includes('team_leader')) && (
                                        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-600 focus:outline-none flex-shrink-0 cursor-pointer"
                                            style={{ maxWidth: 110 }}>
                                            <option value="">All branches</option>
                                            {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                                        </select>
                                    )}
                                </div>
                            )}
                            {selected.size > 0 && <p className="text-[10px] text-gray-500 mt-1.5">{selected.size} selected</p>}
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {loadingColleagues ? <Spinner label="Loading colleagues…" />
                            : addable.length === 0 ? <Empty Icon={UserPlus} title="No one to add" sub="Everyone matching your search is already in the group." />
                            : addable.map(c => {
                                const roleStyle = ROLE_COLORS[c.role] ?? { color: '#6b7280', bg: '#f3f4f6' };
                                return (
                                    <button key={c.id} onClick={() => setSelected(prev => {
                                        const s = new Set(prev);
                                        selected.has(c.id) ? s.delete(c.id) : s.add(c.id);
                                        return s;
                                    })} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                                        <Avatar user={c} size={9} />
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-semibold text-gray-800 truncate">{userDisplayName(c)}</p>
                                                <span className="text-[9px] font-black px-1 py-0.5 rounded-full flex-shrink-0"
                                                    style={{ color: roleStyle.color, background: roleStyle.bg }}>
                                                    {ROLE_LABELS[c.role]}
                                                </span>
                                            </div>
                                            {c.branch_name && <p className="text-[10px] text-gray-400 truncate">{c.branch_name}</p>}
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.has(c.id) ? 'border-transparent' : 'border-gray-300'}`}
                                            style={selected.has(c.id) ? { background: G0 } : {}}>
                                            {selected.has(c.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
                            <button onClick={addSelected} disabled={adding || selected.size === 0}
                                className="w-full py-2.5 rounded-xl text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: GS }}>
                                {adding ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : <><UserPlus className="w-4 h-4" />Add{selected.size > 0 ? ` (${selected.size})` : ''}</>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAT THREAD
// ════════════════════════════════════════════════════════════════════════════

interface ChatThreadProps {
    conversationId: number;
    user: AuthUser;
    conversation?: Conversation;
    displayName?: string;
    onBack: () => void;
    onClose: () => void;
    /** Pre-fill the compose box with this text (e.g. birthday greeting) */
    prefilledMessage?: string;
}

function ChatThread({ conversationId, user, conversation, displayName, onBack, onClose, prefilledMessage }: ChatThreadProps) {
    const [messages, setMessages]           = useState<Message[]>([]);
    const [loading, setLoading]             = useState(false);
    const [sending, setSending]             = useState(false);
    const [body, setBody]                   = useState(prefilledMessage ?? '');
    const [replyTo, setReplyTo]             = useState<Message | null>(null);
    const [attachments, setAttachments]     = useState<File[]>([]);
    const [showReactions, setShowReactions] = useState<number | null>(null);
    const [showReactors, setShowReactors]   = useState<{ msgId: number; emoji: string } | null>(null);
    const [mentionList, setMentionList]     = useState<Colleague[]>([]);
    const [showMentions, setShowMentions]   = useState(false);
    const [headerImgErr, setHeaderImgErr]   = useState(false);
    const [showGroupMenu, setShowGroupMenu]       = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showManageMembers, setShowManageMembers] = useState(false);
    const [manageMembersTab, setManageMembersTab]   = useState<'members' | 'add'>('members');
    const [leaving, setLeaving]                   = useState(false);
    const [leftGroup, setLeftGroup]               = useState(false);
    const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
    const [editBody, setEditBody]         = useState('');
    // ── New-message banner ──────────────────────────────────────────────────
    const [newMsgCount, setNewMsgCount]   = useState(0);

    const bottomRef       = useRef<HTMLDivElement>(null);
    const containerRef    = useRef<HTMLDivElement>(null);
    const fileRef         = useRef<HTMLInputElement>(null);
    const imgRef          = useRef<HTMLInputElement>(null);
    const textareaRef     = useRef<HTMLTextAreaElement>(null);
    const menuRef         = useRef<HTMLDivElement>(null);
    const editRef         = useRef<HTMLTextAreaElement>(null);
    const lastMsgIdRef    = useRef<number>(0);
    const initialLoadDone = useRef(false);

    // ── Helpers ──────────────────────────────────────────────────────────────
    function isNearBottom() {
        const c = containerRef.current;
        if (!c) return true;
        return c.scrollHeight - c.scrollTop - c.clientHeight < 100;
    }

    function scrollToBottom(smooth = true) {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }

    /**
     * A message can only be considered "seen" if the person is actually
     * looking at this thread right now: the tab is visible, the window is
     * focused, the thread panel itself isn't hidden (e.g. collapsed behind
     * another screen in the app via CSS instead of being unmounted), and
     * they're scrolled down near the latest messages (not scrolled up
     * reading old history while new ones arrive underneath).
     */
    function isActivelyViewing() {
        if (document.visibilityState !== 'visible') return false;
        if (!document.hasFocus()) return false;
        const c = containerRef.current;
        // offsetParent is null when an element (or an ancestor) has
        // display:none — catches panels that stay mounted but hidden.
        if (!c || c.offsetParent === null) return false;
        return isNearBottom();
    }

    function markReadIfViewing() {
        if (!isActivelyViewing()) return;
        apiFetch(`/api/conversations/${conversationId}/mark-read`, { method: 'POST' }).catch(() => {});
    }

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

    // ── Initial load ─────────────────────────────────────────────────────────
    // FIX (Message Conversation Ordering Issue): the backend now returns the
    // true latest $per_page messages (see MessageController::index()), so we
    // no longer need to over-fetch 100 and slice(-50) — that slice was
    // guessing at "recent" from whatever page 1 happened to contain, which
    // broke completely once a conversation passed 100 total messages.
    const loadMessages = useCallback(async () => {
        setLoading(true);
        const data = await apiGet<Message[]>(`/api/conversations/${conversationId}/messages?per_page=50`);
        if (data) {
            const normalized = normalizeMessages(data);
            setMessages(normalized);
            if (normalized.length > 0) lastMsgIdRef.current = Math.max(...normalized.map(m => m.id));
        }
        setLoading(false);
        // Scroll to bottom immediately after first load (no animation)
        setTimeout(() => {
            scrollToBottom(false);
            initialLoadDone.current = true;
            // Only counts as "seen" once we've actually scrolled to the
            // latest messages and the tab is visible/focused.
            markReadIfViewing();
        }, 60);
    }, [conversationId]);

    useEffect(() => { loadMessages(); }, [loadMessages]);

    // ── Catch up on "seen" when the person actually comes back to the tab ────
    useEffect(() => {
        function handleVisibilityOrFocus() {
            if (!initialLoadDone.current) return;
            markReadIfViewing();
        }
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);
        window.addEventListener('focus', handleVisibilityOrFocus);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
            window.removeEventListener('focus', handleVisibilityOrFocus);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    // ── Auto-focus compose box when a message is pre-filled ──────────────────
    useEffect(() => {
        if (!prefilledMessage) return;
        const t = textareaRef.current;
        if (!t) return;
        // Slight delay so the thread has mounted and scrolled first
        setTimeout(() => {
            t.focus();
            t.setSelectionRange(t.value.length, t.value.length);
        }, 300);
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Polling ───────────────────────────────────────────────────────────────
    // FIX: previously re-fetched the same ?per_page=100 window every 3s no
    // matter how long the conversation was, so once a conversation passed
    // 100 total messages this loop kept re-reading the same stale oldest
    // page forever and any genuinely new message (sent hours/days later)
    // would never appear. Using after_id means we only ever ask for
    // "what's new since the last message I already have" — correct and
    // cheap regardless of how much history the conversation holds.
    //
    // We still take a lightweight pass over the current latest window to
    // pick up reaction/read-receipt changes on messages already on screen
    // (after_id alone wouldn't catch a reaction added to an older message).
    useEffect(() => {
        const iv = setInterval(async () => {
            if (!initialLoadDone.current) return;
            const cursor = lastMsgIdRef.current;

            const [newData, freshWindow] = await Promise.all([
                apiGet<Message[]>(`/api/conversations/${conversationId}/messages?after_id=${cursor}`),
                apiGet<Message[]>(`/api/conversations/${conversationId}/messages?per_page=50`),
            ]);

            const freshById = new Map((freshWindow ? normalizeMessages(freshWindow) : []).map(m => [m.id, m]));

            setMessages(prev => {
                let next = prev;

                if (newData && newData.length > 0) {
                    const normalized = normalizeMessages(newData);
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMsgs = normalized.filter(m => !existingIds.has(m.id));
                    if (newMsgs.length > 0) {
                        const hasIncoming = newMsgs.some(m => m.sender_id !== user.id);
                        if (hasIncoming) {
                            playNewMessageSound();
                            if (!isNearBottom()) {
                                setNewMsgCount(c => c + newMsgs.filter(m => m.sender_id !== user.id).length);
                            }
                        }
                        lastMsgIdRef.current = Math.max(lastMsgIdRef.current, ...newMsgs.map(m => m.id));
                        next = [...next, ...newMsgs];
                    }
                }

                if (freshById.size > 0) {
                    next = next.map(m => {
                        const fresh = freshById.get(m.id);
                        if (!fresh) return m;
                        const reactionsChanged = JSON.stringify(fresh.reaction_summary) !== JSON.stringify(m.reaction_summary);
                        const readsChanged = (fresh.reads?.length ?? 0) !== (m.reads?.length ?? 0);
                        if (!reactionsChanged && !readsChanged) return m;
                        return { ...m, reaction_summary: fresh.reaction_summary, reads: fresh.reads ?? m.reads, is_read_by_me: fresh.is_read_by_me ?? m.is_read_by_me };
                    });
                }

                return next;
            });

            // Only counts as "seen" if the person is actually looking at the
            // thread right now — not just because it's polling in the background.
            markReadIfViewing();
        }, 3_000);
        return () => clearInterval(iv);
    }, [conversationId, user.id]);

    // ── Auto-scroll only when user is already near bottom ────────────────────
    // (triggered by own sent messages OR when near bottom)
    const prevMsgCountRef = useRef(0);
    useEffect(() => {
        const prev = prevMsgCountRef.current;
        prevMsgCountRef.current = messages.length;
        if (!initialLoadDone.current) return;
        if (messages.length <= prev) return; // no new messages
        if (isNearBottom()) {
            scrollToBottom();
            setNewMsgCount(0);
        }
    }, [messages.length]);

    // ── Dismiss banner when user scrolls down manually ───────────────────────
    function handleScroll() {
        if (isNearBottom()) {
            setNewMsgCount(0);
            // Scrolling down to the latest messages is also a genuine "seen" moment.
            markReadIfViewing();
        }
    }

    useEffect(() => {
        function h(e: MouseEvent) { if (!menuRef.current?.contains(e.target as Node)) setShowGroupMenu(false); }
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    function handleBodyChange(val: string) {
        setBody(val);
        const match = val.match(/@(\w*)$/);
        if (match) {
            const q = match[1].toLowerCase();
            const list = mentionableMembers.filter(c =>
                userDisplayName(c).toLowerCase().includes(q) || (c.first_name ?? '').toLowerCase().startsWith(q)
            ).slice(0, 6);
            setMentionList(list);
            setShowMentions(list.length > 0);
        } else { setShowMentions(false); }
    }

    function insertMention(c: Colleague) {
        const name = userDisplayName(c);
        setBody(prev => prev.replace(/@\w*$/, `@${name} `));
        setShowMentions(false);
        setTimeout(() => textareaRef.current?.focus(), 0);
    }

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
                const normalized = { ...result, reaction_summary: normalizeReactions(result.reaction_summary) };
                setMessages(prev => {
                    if (prev.some(m => m.id === normalized.id)) return prev;
                    return [...prev, normalized];
                });
                lastMsgIdRef.current = Math.max(lastMsgIdRef.current, result.id);
                // Always scroll to bottom after sending your own message
                setTimeout(() => scrollToBottom(), 50);
            }
            setBody(''); setReplyTo(null); setAttachments([]);
            // Reset textarea height back to single row
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } finally { setSending(false); }
    }

    async function toggleReaction(msgId: number, emoji: string) {
        setShowReactions(null);
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            const existing: Reaction[] = Array.isArray(m.reaction_summary) ? m.reaction_summary : normalizeReactions(m.reaction_summary);
            const already = existing.find(r => r.emoji === emoji);
            let updated: Reaction[];
            if (already) {
                if (already.reacted) {
                    updated = existing.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r).filter(r => r.count > 0);
                } else {
                    updated = existing.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r);
                }
            } else { updated = [...existing, { emoji, count: 1, reacted: true }]; }
            return { ...m, reaction_summary: updated };
        }));
        apiFetch(`/api/conversations/${conversationId}/messages/${msgId}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }).catch(() => {});
    }

    async function deleteMsg(msgId: number) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        apiFetch(`/api/conversations/${conversationId}/messages/${msgId}`, { method: 'DELETE' }).catch(() => {});
    }

    async function pinMsg(msgId: number, currentlyPinned: boolean) {
        const action = currentlyPinned ? 'unpin' : 'pin';
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: !currentlyPinned } : m));
        try {
            const r = await apiFetch(`/api/conversations/${conversationId}/messages/${msgId}/${action}`, { method: 'POST' });
            if (!r.ok) setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: currentlyPinned } : m));
        } catch { setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: currentlyPinned } : m)); }
    }

    function startEdit(msg: Message) {
        setEditingMsgId(msg.id);
        setEditBody(msg.body ?? '');
        setTimeout(() => editRef.current?.focus(), 0);
    }

    async function submitEdit(msgId: number) {
        const text = editBody.trim();
        if (!text) return;
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, body: text, is_edited: true } : m));
        setEditingMsgId(null);
        apiFetch(`/api/conversations/${conversationId}/messages/${msgId}`, { method: 'PUT', body: JSON.stringify({ body: text }) }).catch(() => {});
    }

    async function leaveGroup() {
        setShowLeaveConfirm(false);
        setLeaving(true);
        const r = await apiFetch(`/api/conversations/${conversationId}/leave`, { method: 'POST' });
        setLeaving(false);
        if (r.ok) { setLeftGroup(true); setTimeout(onBack, 800); }
    }

    const otherUser = conversation?.type === 'direct'
        ? getParticipants(conversation).find(p => p.user_id !== user.id)?.user
        : undefined;

    function convLabel(): string {
        if (displayName) return displayName;
        if (conversation?.name) return conversation.name;
        if (conversation?.display_name) return conversation.display_name;
        if (conversation?.type === 'direct') { const n = userName(otherUser); if (n) return n; }
        return 'Direct Message';
    }

    const isDM = conversation?.type === 'direct' || (!conversation?.name && !!displayName);
    const participants = getParticipants(conversation ?? {} as Conversation);
    const lastMyMsg = [...messages].reverse().find(m => m.sender_id === user.id);
    const isAnnouncement = conversation?.type === 'announcement';
    const myParticipant = participants.find(p => p.user_id === user.id);
    const canPostAnnouncement = !isAnnouncement || (
        myParticipant?.is_admin === true || myParticipant?.can_post_announcements === true || user.role === 'admin' || user.role === 'staff'
    );
    const canPin = user.role === 'admin' || user.role === 'staff' || myParticipant?.is_admin === true;
    // Only the group leader (group admin) or a system admin/staff can add or kick members.
    // Regular members should not see these controls — the backend already rejects
    // non-admins with a 403, this just keeps the UI consistent with that rule.
    const isGroupLeader = myParticipant?.is_admin === true || user.role === 'admin' || user.role === 'staff';
    const canManageMembers = !isDM && isGroupLeader;
    const canDeleteAny = user.role === 'admin' || user.role === 'staff';
    const otherPhotoUrl = userPhoto(otherUser);

    function renderBody(text: string) {
        return text.split(/(@\S+)/g).map((part, i) =>
            part.startsWith('@')
                ? <span key={i} className="font-bold" style={{ color: isDM ? '#93c5fd' : '#2563eb' }}>{part}</span>
                : <span key={i}>{part}</span>
        );
    }

    function needsDivider(i: number): boolean {
        if (i === 0) return false;
        const prev = messages[i - 1], curr = messages[i];
        return new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() > 300_000;
    }

    if (leftGroup) return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center"><Check className="w-7 h-7 text-green-500" /></div>
            <p className="text-sm font-black text-gray-600">You left the group</p>
            <p className="text-xs text-gray-400">Updating your list…</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full" onClick={() => { setShowReactions(null); setShowMentions(false); setShowGroupMenu(false); setShowReactors(null); }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 flex-shrink-0">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="relative flex-shrink-0">
                    {isDM ? (
                        otherPhotoUrl && !headerImgErr ? (
                            <img src={otherPhotoUrl} className="w-8 h-8 rounded-full object-cover" onError={() => setHeaderImgErr(true)} />
                        ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs" style={{ background: GS }}>
                                {initials(otherUser ?? { first_name: displayName?.split(' ')[0], last_name: displayName?.split(' ')[1] })}
                            </div>
                        )
                    ) : (
                        conversation?.icon_url ? (
                            <img src={conversation.icon_url} className="w-8 h-8 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: '#7c3aed' }}><Users className="w-4 h-4" /></div>
                        )
                    )}
                    {isDM && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-400 block" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate leading-tight" style={{ color: G0 }}>{convLabel()}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{isDM ? 'Active now' : `${participants.length} members`}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {canManageMembers && (
                        <button onClick={e => { e.stopPropagation(); setManageMembersTab('add'); setShowManageMembers(true); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500" title="Add member">
                            <UserPlus className="w-4 h-4" />
                        </button>
                    )}
                    {!isDM && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={e => { e.stopPropagation(); setShowGroupMenu(o => !o); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {showGroupMenu && (
                                <div className="absolute right-0 top-full mt-1 z-[80] bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[170px]" onClick={e => e.stopPropagation()}>
                                    {canManageMembers && (
                                        <button onClick={e => { e.stopPropagation(); setShowGroupMenu(false); setManageMembersTab('members'); setShowManageMembers(true); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">
                                            <Users className="w-3.5 h-3.5" />
                                            Manage Members
                                        </button>
                                    )}
                                    <button onClick={e => { e.stopPropagation(); setShowGroupMenu(false); setShowLeaveConfirm(true); }} disabled={leaving}
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

            {/* Messages */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto min-h-0 px-2 py-2 relative overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
                onScroll={handleScroll}
            >
                {/* ── New messages banner ── */}
                {newMsgCount > 0 && (
                    <div className="sticky top-2 z-20 flex justify-center pointer-events-none">
                        <button
                            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[11px] font-black shadow-lg active:scale-95 transition-all"
                            style={{ background: GS, boxShadow: '0 4px 16px rgba(0,0,0,0.22)' }}
                            onClick={() => {
                                scrollToBottom();
                                setNewMsgCount(0);
                            }}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                            {newMsgCount} new message{newMsgCount !== 1 ? 's' : ''}
                        </button>
                    </div>
                )}

                {showLeaveConfirm && (
                    <div className="absolute inset-0 z-[70] flex items-center justify-center" style={{ background: 'rgba(13,27,62,0.18)', backdropFilter: 'blur(2px)' }} onClick={() => setShowLeaveConfirm(false)}>
                        <div className="mx-4 w-full max-w-[220px] bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ animation: 'mn2Panel 0.18s cubic-bezier(0.34,1.3,0.64,1) both' }} onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col items-center px-5 pt-5 pb-3">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center mb-2.5" style={{ background: '#fee2e2' }}><ArrowUpRight className="w-5 h-5 text-red-500 rotate-90" /></div>
                                <p className="text-sm font-black text-gray-800 text-center leading-snug">Leave Group?</p>
                                <p className="text-[11px] text-gray-400 text-center mt-1 leading-snug">You won't receive messages from this group anymore.</p>
                            </div>
                            <div className="flex border-t border-gray-100">
                                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100">Cancel</button>
                                <button onClick={leaveGroup} disabled={leaving} className="flex-1 py-3 text-xs font-black text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                                    {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" /> : 'Leave'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? <Spinner label="Loading messages…" />
                : messages.length === 0 ? <Empty Icon={MessageCircle} title="No messages yet" sub="Say hello! 👋" />
                : messages.map((msg, i) => {
                    const isMe          = msg.sender_id === user.id;
                    const prevMsg       = messages[i - 1];
                    const nextMsg       = messages[i + 1];
                    const showAvatar    = !isMe && msg.sender_id !== nextMsg?.sender_id;
                    const showName      = !isMe && msg.sender_id !== prevMsg?.sender_id && !isDM;
                    const isLastMine    = msg.id === lastMyMsg?.id;
                    const senderPhotoUrl = userPhoto(msg.sender);

                    return (
                        <div key={msg.id} className="mb-px">
                            {needsDivider(i) && (
                                <div className="flex items-center gap-2 my-2">
                                    <div className="flex-1 h-px bg-gray-100" />
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap px-2">{ago(prevMsg?.created_at)}</span>
                                    <div className="flex-1 h-px bg-gray-100" />
                                </div>
                            )}
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-1 group relative`}>
                                {!isMe && (
                                    <div className="w-6 flex-shrink-0 self-end mb-0.5">
                                        {showAvatar ? (
                                            senderPhotoUrl ? (
                                                <img src={senderPhotoUrl} className="w-6 h-6 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[9px]" style={{ background: G1 }}>{initials(msg.sender)}</div>
                                            )
                                        ) : null}
                                    </div>
                                )}
                                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showName && <p className="text-[10px] font-bold mb-px px-0.5" style={{ color: G0 }}>{userDisplayName(msg.sender)}</p>}
                                    {msg.reply_to && (
                                        <div className="mb-1 px-2.5 py-1.5 rounded-xl text-[10px] max-w-full"
                                            style={isMe
                                                ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', borderLeft: '2px solid rgba(255,255,255,0.4)' }
                                                : { background: '#e5e7eb', color: '#6b7280', borderLeft: `2px solid ${G0}` }}>
                                            <p className="font-bold text-[10px] mb-0.5">{msg.reply_to.sender?.first_name}</p>
                                            <p className="truncate">{msg.reply_to.body}</p>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <div className="px-2.5 py-1.5 rounded-2xl text-[11px] leading-snug"
                                            style={{
                                                background: isMe ? GS : '#f0f0f0',
                                                color: isMe ? 'white' : '#111827',
                                                borderBottomRightRadius: isMe ? 4 : undefined,
                                                borderBottomLeftRadius: !isMe ? 4 : undefined,
                                                minWidth: 48,
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word',
                                                whiteSpace: 'pre-wrap',
                                            }}>
                                            {msg.is_pinned && (
                                                <div className="flex items-center gap-1 mb-1 opacity-60"><Pin className="w-2.5 h-2.5" /><span className="text-[9px] font-bold uppercase tracking-wide">Pinned</span></div>
                                            )}
                                            {editingMsgId === msg.id ? (
                                                <div className="flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <textarea ref={editRef} value={editBody} onChange={e => setEditBody(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(msg.id); } if (e.key === 'Escape') setEditingMsgId(null); }}
                                                        rows={2} className="w-full text-[11px] px-2 py-1.5 rounded-lg resize-none focus:outline-none"
                                                        style={{ background: isMe ? 'rgba(255,255,255,0.15)' : '#e5e7eb', color: isMe ? 'white' : '#111827', minWidth: 140 }} />
                                                    <div className="flex gap-1.5 justify-end">
                                                        <button onClick={() => setEditingMsgId(null)} className="text-[10px] font-bold px-2 py-0.5 rounded-md opacity-60 hover:opacity-100" style={{ background: 'rgba(255,255,255,0.15)' }}>Cancel</button>
                                                        <button onClick={() => submitEdit(msg.id)} className="text-[10px] font-black px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.3)' }}>Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                msg.body && <p className="break-words">{renderBody(msg.body)}</p>
                                            )}
                                            {/* Attachments */}
                                            {msg.attachments?.map(att => {
                                                const isVideo = att.mime_type?.startsWith('video/') || att.attachment_type === 'video'
                                                    || /\.(mp4|mov|webm|avi|mkv|m4v|ogv|3gp|flv)$/i.test(att.file_name ?? att.file_url ?? '');
                                                const isImage = !isVideo && (att.mime_type?.startsWith('image/') || att.attachment_type === 'image');
                                                return (
                                                    <div key={att.id} className="mt-1.5">
                                                        {isImage ? (
                                                            <div className="relative group/img inline-block">
                                                                <a href={att.file_url} target="_blank" rel="noreferrer" className="block">
                                                                    <img src={att.file_url} className="rounded-xl max-w-[200px] max-h-[160px] object-cover cursor-pointer hover:opacity-90"
                                                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                </a>
                                                                <a href={att.file_url} download={att.file_name ?? 'image'}
                                                                    className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                    style={{ background: 'rgba(0,0,0,0.55)' }}
                                                                    onClick={e => e.stopPropagation()}
                                                                    title="Download">
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                                                                </a>
                                                            </div>
                                                        ) : isVideo ? (
                                                            <div className="relative rounded-xl overflow-hidden group/vid" style={{ maxWidth: 220 }}>
                                                                <video
                                                                    src={att.file_url}
                                                                    controls
                                                                    preload="metadata"
                                                                    playsInline
                                                                    className="w-full rounded-xl"
                                                                    style={{ maxHeight: 160, background: '#000', display: 'block' }}
                                                                />
                                                                <a href={att.file_url} download={att.file_name ?? 'video'}
                                                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity z-10"
                                                                    style={{ background: 'rgba(0,0,0,0.55)' }}
                                                                    onClick={e => e.stopPropagation()}
                                                                    title="Download">
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                                                                </a>
                                                                {att.file_name && (
                                                                    <p className="text-[9px] truncate px-1 pb-0.5 text-center opacity-60" style={{ color: isMe ? 'white' : '#374151' }}>{att.file_name}</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[11px] font-semibold group/file"
                                                                style={isMe ? { background: 'rgba(255,255,255,0.15)', color: 'white' } : { background: '#e5e7eb', color: '#374151' }}>
                                                                <FileText className="w-4 h-4 flex-shrink-0 opacity-70" />
                                                                <span className="truncate max-w-[120px]">{att.file_name}</span>
                                                                <a href={att.file_url} download={att.file_name ?? 'file'}
                                                                    className="ml-auto flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-opacity opacity-50 group-hover/file:opacity-100"
                                                                    style={isMe ? { background: 'rgba(255,255,255,0.2)' } : { background: 'rgba(0,0,0,0.08)' }}
                                                                    onClick={e => e.stopPropagation()}
                                                                    title="Download">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <span className="text-[9px] opacity-50 whitespace-nowrap">{ago(msg.created_at)}</span>
                                                {msg.is_edited && <span className="text-[9px] opacity-40 italic">edited</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Hover action bar — below the bubble, outside relative wrapper.
                                        Always visible on touch/mobile (no hover state exists there);
                                        hover-reveal only kicks in at sm+ for desktop. */}
                                    <div className={`flex sm:hidden sm:group-hover:flex items-center gap-0.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <button onClick={e => { e.stopPropagation(); setShowReactions(showReactions === msg.id ? null : msg.id); }} className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-100 touch-manipulation"><SmilePlus className="w-3.5 h-3.5" /></button>
                                        <button onClick={e => { e.stopPropagation(); setReplyTo(msg); setTimeout(() => textareaRef.current?.focus(), 0); }} className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-100 touch-manipulation"><Reply className="w-3.5 h-3.5" /></button>
                                        {isMe && <button onClick={e => { e.stopPropagation(); startEdit(msg); }} className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-blue-600 border border-gray-100 touch-manipulation"><Edit2 className="w-3.5 h-3.5" /></button>}
                                        {canPin && <button onClick={e => { e.stopPropagation(); pinMsg(msg.id, !!msg.is_pinned); }} className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 transition-colors touch-manipulation" style={msg.is_pinned ? { color: '#d97706' } : { color: '#9ca3af' }}><Pin className="w-3.5 h-3.5" /></button>}
                                        {(isMe || canDeleteAny) && <button onClick={e => { e.stopPropagation(); deleteMsg(msg.id); }} className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-red-400 hover:text-red-600 border border-gray-100 touch-manipulation"><Trash2 className="w-3.5 h-3.5" /></button>}
                                    </div>
                                    {/* Emoji picker — below action bar */}
                                    {showReactions === msg.id && (
                                        <div className={`mt-1 ${isMe ? 'flex justify-end' : 'flex justify-start'}`} onClick={e => e.stopPropagation()}>
                                            <div className="flex flex-wrap gap-0.5 px-2 py-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                                                {EMOJIS.map(e => <button key={e} onClick={() => toggleReaction(msg.id, e)} className="text-xl hover:scale-125 transition-transform leading-none p-0.5">{e}</button>)}
                                            </div>
                                        </div>
                                    )}
                                    {(msg.reaction_summary?.length ?? 0) > 0 && (
                                        <div className={`relative flex flex-wrap gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            {msg.reaction_summary!.map(r => (
                                                <button key={r.emoji}
                                                    onClick={e => { e.stopPropagation(); if (showReactors?.msgId === msg.id && showReactors.emoji === r.emoji) { setShowReactors(null); } else { setShowReactors({ msgId: msg.id, emoji: r.emoji }); } }}
                                                    onDoubleClick={e => { e.stopPropagation(); toggleReaction(msg.id, r.emoji); }}
                                                    className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border transition-all active:scale-95"
                                                    style={r.reacted ? { background: `${G0}12`, borderColor: `${G0}50`, color: G0, fontWeight: 700 } : { background: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>
                                                    {r.emoji}<span className="text-[10px] ml-0.5">{r.count}</span>
                                                </button>
                                            ))}
                                            {showReactors?.msgId === msg.id && (() => {
                                                const allReactors = msg.reaction_summary!;
                                                return (
                                                    <div className={`absolute z-[70] bottom-full mb-1.5 ${isMe ? 'right-0' : 'left-0'}`} onClick={e => e.stopPropagation()}>
                                                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ minWidth: 200, maxWidth: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                                                            <div className="flex border-b border-gray-100 overflow-x-auto">
                                                                <button onClick={() => setShowReactors({ msgId: msg.id, emoji: '__all__' })}
                                                                    className="px-3 py-2 text-[11px] font-black whitespace-nowrap flex-shrink-0 transition-colors"
                                                                    style={showReactors.emoji === '__all__' ? { color: G0, borderBottom: `2px solid ${G0}` } : { color: '#9ca3af', borderBottom: '2px solid transparent' }}>
                                                                    All {msg.reaction_summary!.reduce((s, r) => s + r.count, 0)}
                                                                </button>
                                                                {allReactors.map(r => (
                                                                    <button key={r.emoji} onClick={() => setShowReactors({ msgId: msg.id, emoji: r.emoji })}
                                                                        className="px-3 py-2 text-[11px] font-bold whitespace-nowrap flex-shrink-0 flex items-center gap-1 transition-colors"
                                                                        style={showReactors.emoji === r.emoji ? { color: G0, borderBottom: `2px solid ${G0}`, background: `${G0}06` } : { color: '#6b7280', borderBottom: '2px solid transparent' }}>
                                                                        <span className="text-sm">{r.emoji}</span><span>{r.count}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="max-h-44 overflow-y-auto">
                                                                {(() => {
                                                                    const filtered = showReactors.emoji === '__all__' ? allReactors : allReactors.filter(r => r.emoji === showReactors.emoji);
                                                                    type ReactorEntry = { userId?: number; name: string; emoji: string; photo?: string | null };
                                                                    const entries: ReactorEntry[] = [];
                                                                    filtered.forEach(r => {
                                                                        if (r.users && r.users.length > 0) {
                                                                            r.users.forEach(u => entries.push({ userId: u.id, name: u.name, emoji: r.emoji, photo: userPhoto({ profile_photo_path: u.profile_photo_path }) }));
                                                                        } else if (r.user_ids && r.user_ids.length > 0) {
                                                                            r.user_ids.forEach((uid: number) => {
                                                                                const p = participants.find(p => p.user_id === uid);
                                                                                entries.push({ userId: uid, name: userDisplayName(p?.user) || `User ${uid}`, emoji: r.emoji, photo: userPhoto(p?.user) });
                                                                            });
                                                                        } else { entries.push({ name: `${r.count} reaction${r.count !== 1 ? 's' : ''}`, emoji: r.emoji }); }
                                                                    });
                                                                    if (entries.length === 0) return <div className="px-4 py-3 text-center text-[11px] text-gray-400">{msg.reaction_summary!.find(r => r.emoji === showReactors.emoji)?.count ?? 0} reactions</div>;
                                                                    return entries.map((entry, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors">
                                                                            {entry.photo ? <img src={entry.photo} className="w-7 h-7 rounded-full object-cover flex-shrink-0" /> : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] flex-shrink-0" style={{ background: GS }}>{entry.name.charAt(0).toUpperCase()}</div>}
                                                                            <p className="flex-1 text-xs font-semibold text-gray-800 truncate">{entry.name}</p>
                                                                            <span className="text-base flex-shrink-0">{entry.emoji}</span>
                                                                        </div>
                                                                    ));
                                                                })()}
                                                            </div>
                                                            <div className="border-t border-gray-50 px-3 py-2 flex items-center justify-between">
                                                                <p className="text-[10px] text-gray-400">Tap emoji to react</p>
                                                                <div className="flex gap-1">
                                                                    {msg.reaction_summary!.slice(0, 5).map(r => (
                                                                        <button key={r.emoji} onClick={() => { toggleReaction(msg.id, r.emoji); setShowReactors(null); }} className="text-base hover:scale-125 transition-transform">{r.emoji}</button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                    {isMe && isLastMine && (msg.reads?.length ?? 0) > 0 && <SeenAvatars reads={msg.reads} myId={user.id} />}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Reply bar */}
            {replyTo && (
                <div className="flex-shrink-0 mx-3 mb-1 px-2.5 py-1.5 rounded-xl flex items-start gap-2 border-l-2" style={{ background: `${G0}06`, borderColor: G0 }}>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold" style={{ color: G0 }}>Replying to {userDisplayName(replyTo.sender)}</p>
                        <p className="text-[10px] text-gray-500 truncate">{replyTo.body}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"><X className="w-3 h-3" /></button>
                </div>
            )}

            {/* Attachment previews */}
            {attachments.length > 0 && (
                <div className="flex-shrink-0 flex gap-1.5 px-3 pb-1.5 overflow-x-auto">
                    {attachments.map((f, i) => (
                        <div key={i} className="relative flex-shrink-0">
                            {f.type.startsWith('image/')
                                ? <img src={URL.createObjectURL(f)} className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                                : f.type.startsWith('video/')
                                ? <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-200 flex flex-col items-center justify-center gap-1 p-1">
                                    <svg className="w-5 h-5 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    <span className="text-[8px] text-gray-300 text-center truncate w-full">{f.name}</span>
                                  </div>
                                : <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-1 p-1"><FileText className="w-5 h-5 text-gray-400" /><span className="text-[8px] text-gray-400 text-center truncate w-full">{f.name}</span></div>
                            }
                            <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow"><X className="w-2.5 h-2.5" /></button>
                        </div>
                    ))}
                </div>
            )}

            {/* Mention dropdown */}
            {showMentions && mentionList.length > 0 && (
                <div className="flex-shrink-0 mx-3 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-40 overflow-y-auto" onClick={e => e.stopPropagation()}>
                    {mentionList.map(c => <MentionRow key={c.id} c={c} onSelect={() => insertMention(c)} />)}
                </div>
            )}

            {/* Compose bar */}
            {canPostAnnouncement ? (
                <div className="flex-shrink-0 border-t border-gray-100" style={{ background: '#fafafa' }}>
                    <input type="file" ref={imgRef} multiple accept="image/*,video/*" className="hidden" onChange={e => setAttachments(prev => [...prev, ...Array.from(e.target.files ?? [])])} />
                    <input type="file" ref={fileRef} multiple className="hidden" onChange={e => setAttachments(prev => [...prev, ...Array.from(e.target.files ?? [])])} />
                    <div className="flex items-end gap-1.5 px-3 py-2.5">
                        <button onClick={() => imgRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex-shrink-0 mb-0.5"><Image className="w-4 h-4" /></button>
                        <button onClick={() => fileRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex-shrink-0 mb-0.5"><Paperclip className="w-4 h-4" /></button>
                        <textarea
                            ref={textareaRef}
                            value={body}
                            onChange={e => {
                                handleBodyChange(e.target.value);
                                // Auto-grow: reset height then set to scrollHeight
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Escape') setShowMentions(false);
                                if (e.key === 'Enter' && !e.shiftKey && !showMentions) { e.preventDefault(); send(); }
                            }}
                            placeholder={isAnnouncement ? 'Post an announcement…' : 'Type a message… (@ to mention)'}
                            rows={1}
                            className="flex-1 text-xs px-3 py-2.5 rounded-2xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
                            style={{
                                '--tw-ring-color': `${G0}30`,
                                lineHeight: '1.5',
                                minHeight: 38,
                                maxHeight: 160,
                                overflowY: 'auto',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                            } as React.CSSProperties}
                        />
                        <button onClick={send} disabled={sending || (!body.trim() && attachments.length === 0)}
                            className="w-9 h-9 flex items-center justify-center rounded-full text-white disabled:opacity-40 transition-all flex-shrink-0 hover:opacity-85 active:scale-95 mb-0.5 touch-manipulation" style={{ background: GS }}>
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-[9px] text-gray-300 text-center pb-1.5 -mt-1">Enter to send · Shift+Enter for new line</p>
                </div>
            ) : (
                <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex items-center justify-center gap-2" style={{ background: '#fef9ec' }}>
                    <p className="text-[11px] text-amber-700 font-semibold text-center">Only admins can post in this channel</p>
                </div>
            )}
            {showManageMembers && (
                <ManageMembersModal conversationId={conversationId} user={user} conversation={conversation}
                    initialTab={manageMembersTab}
                    onClose={() => setShowManageMembers(false)} />
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAT PANEL (main list view)
// ════════════════════════════════════════════════════════════════════════════

type ChatView = 'list' | 'thread' | 'people';

export function ChatPanel({ user, role, onClose, openDMWithUser, onUnreadChange }: {
    user: AuthUser;
    role: UserRole;
    onClose: () => void;
    /** When set, the panel will immediately open (or create) a DM with this user id */
    openDMWithUser?: { userId: number; displayName: string; prefilledMessage?: string } | null;
    /** Called whenever the total unread count changes so the layout can update its badge */
    onUnreadChange?: (count: number) => void;
}) {
    const [view, setView]             = useState<ChatView>('list');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading]       = useState(false);
    const [search, setSearch]         = useState('');
    const [activeConvId, setActiveConvId]   = useState<number | null>(null);
    const [threadDisplayName, setThreadDisplayName] = useState<string | undefined>(undefined);
    const [filterType, setFilterType] = useState<'all' | 'direct' | 'group' | 'announcement'>('all');
    const [showCreateGroup, setShowCreateGroup]               = useState(false);
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const canManageAnnouncement = role === 'admin' || role === 'staff';
    const initialConvoLoad = useRef(false);
    const handledDMRef    = useRef<number | null>(null);
    const [pendingDMMessage, setPendingDMMessage] = useState<string | null>(null);

    // ── Auto-open DM when openDMWithUser is set (birthday greet flow) ──────────
    useEffect(() => {
        if (!openDMWithUser) return;
        if (handledDMRef.current === openDMWithUser.userId) return; // already handled
        handledDMRef.current = openDMWithUser.userId;

        (async () => {
            try {
                const res = await apiPost<{ id: number } | Conversation>(
                    '/api/conversations/direct',
                    { user_id: openDMWithUser.userId }
                );
                if (res.success && res.data) {
                    const convId = (res.data as { id: number }).id;
                    if (convId) {
                        setPendingDMMessage(openDMWithUser.prefilledMessage ?? null);
                        setActiveConvId(convId);
                        setThreadDisplayName(openDMWithUser.displayName);
                        setView('thread');
                        loadConvos();
                    }
                }
            } catch { /* silent */ }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openDMWithUser]);

    const loadConvos = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const data = await apiGet<Conversation[]>('/api/conversations?per_page=50');
        if (data) {
            setConversations(prev => {
                if (!initialConvoLoad.current || prev.length === 0) { initialConvoLoad.current = true; return data; }
                const freshById = new Map(data.map(c => [c.id, c]));
                const freshIds  = new Set(data.map(c => c.id));
                const stillMember = prev.filter(c => freshIds.has(c.id));
                const updated = stillMember.map(c => freshById.get(c.id) ?? c);
                const existingIds = new Set(stillMember.map(c => c.id));
                const newConvs = data.filter(c => !existingIds.has(c.id));
                return newConvs.length > 0 ? [...updated, ...newConvs] : updated;
            });
        }
        if (!silent) setLoading(false);
    }, []);

    useEffect(() => { loadConvos(); }, [loadConvos]);
    useEffect(() => { const iv = setInterval(() => loadConvos(true), 8_000); return () => clearInterval(iv); }, [loadConvos]);

    // ── Heartbeat: tell the server this user is active every 30 s ────────────
    useEffect(() => {
        // Ping immediately on mount, then every 30 s
        const sendPing = () => apiFetch('/api/ping', { method: 'POST' }).catch(() => {});
        sendPing();
        const iv = setInterval(sendPing, 30_000);
        return () => clearInterval(iv);
    }, []);

    const totalUnread = conversations.reduce((s, c) => s + (c.unread_count ?? 0), 0);

    // Notify layout of current unread count so the FAB badge stays in sync
    useEffect(() => {
        onUnreadChange?.(totalUnread);
    }, [totalUnread, onUnreadChange]);

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
            return <div className="relative flex-shrink-0"><Avatar user={other?.user} size={11} /><span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-400 block" /></div>;
        }
        if (c.icon_url && !iconErr) {
            return <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-gray-100"><img src={c.icon_url} className="w-full h-full object-cover" onError={() => setIconErr(true)} /></div>;
        }
        const colors: Record<string, string> = { announcement: '#d97706', group: G1, branch_group: '#0d9488', custom: '#7c3aed', team_leaders: '#0369a1', staff_group: '#7c3aed' };
        const icons: Record<string, React.ElementType> = { announcement: Megaphone, group: Users, branch_group: Users, custom: Users, team_leaders: Users, staff_group: Users };
        const Icon = icons[c.type] ?? MessageCircle;
        return <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ background: colors[c.type] ?? G0 }}><Icon className="w-5 h-5" /></div>;
    }

 const filtered = conversations.filter(c => {
    if (filterType !== 'all') {
        if (filterType === 'group' && !['group', 'branch_group', 'custom', 'team_leaders', 'staff_group'].includes(c.type)) return false;
        if (filterType === 'direct' && c.type !== 'direct') return false;
        if (filterType === 'announcement' && c.type !== 'announcement') return false;
    }
    if (!search) return true;
    return convLabel(c).toLowerCase().includes(search.toLowerCase());
}).sort((a, b) => {
    const ta = getLastMessage(a)?.created_at ?? a.updated_at ?? a.created_at ?? '';
    const tb = getLastMessage(b)?.created_at ?? b.updated_at ?? b.created_at ?? '';
    return new Date(tb).getTime() - new Date(ta).getTime();
});

    if (view === 'people') return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 flex-shrink-0" style={{ background: GS }}>
                <button onClick={() => setView('list')}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors flex-shrink-0">
                    <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Users className="w-4 h-4 text-white/80 flex-shrink-0" />
                    <p className="text-sm font-black text-white">People</p>
                    <span className="text-xs text-white/60">— Colleagues</span>
                </div>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
                <PeoplePanel user={user} role={role}
                    onStartDM={(convId, colleague) => { setActiveConvId(convId); setThreadDisplayName(userDisplayName(colleague)); setView('thread'); loadConvos(); }}
                    onClose={onClose} />
            </div>
        </div>
    );

    if (view === 'thread' && activeConvId !== null) return (
        <ChatThread conversationId={activeConvId} user={user}
            conversation={conversations.find(c => c.id === activeConvId)}
            displayName={threadDisplayName}
            prefilledMessage={pendingDMMessage ?? undefined}
            onBack={() => { setView('list'); setThreadDisplayName(undefined); setPendingDMMessage(null); loadConvos(true); }}
            onClose={onClose} />
    );

    return (
        <div className="flex flex-col h-full">
            {showCreateGroup && <CreateGroupModal user={user} role={role}
                onCreated={(convId, name, iconUrl) => { setShowCreateGroup(false); setActiveConvId(convId); setThreadDisplayName(name); setView('thread'); loadConvos(); }}
                onClose={() => setShowCreateGroup(false)} />}
            {showCreateAnnouncement && <CreateAnnouncementModal user={user}
                onCreated={(convId, name) => { setShowCreateAnnouncement(false); setActiveConvId(convId); setThreadDisplayName(name); setView('thread'); loadConvos(true); }}
                onClose={() => setShowCreateAnnouncement(false)} />}

            {/* Search + actions */}
            <div className="px-3 pt-3 pb-2 flex gap-1.5 flex-shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none placeholder-gray-400" />
                </div>
                <button onClick={() => setShowCreateGroup(true)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Create group chat"><Plus className="w-4 h-4" /></button>
                {canManageAnnouncement && <button onClick={() => setShowCreateAnnouncement(true)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-amber-50 flex-shrink-0" style={{ color: '#d97706' }} title="Create announcement channel"><Megaphone className="w-4 h-4" /></button>}
                <button onClick={() => setView('people')} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="People"><Users className="w-4 h-4" /></button>
                <button onClick={() => loadConvos()} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><RefreshCw className="w-3.5 h-3.5" /></button>
                {chatMgmtHref(role) && <Link href={chatMgmtHref(role)!} onClick={onClose} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 whitespace-nowrap" style={{ color: G0 }}><Shield className="w-3.5 h-3.5" />Manage</Link>}
            </div>

            {/* Filter chips */}
            <div className="px-3 pb-2 flex gap-1.5 flex-shrink-0 overflow-x-auto">
                {(['all', 'direct', 'group', 'announcement'] as const).map(f => (
                    <button key={f} onClick={() => setFilterType(f)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all"
                        style={filterType === f ? { background: G0, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                        {f === 'all' ? `All${totalUnread > 0 ? ` (${totalUnread})` : ''}` : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? <Spinner label="Loading conversations…" />
                : filtered.length === 0 ? (
                    <Empty Icon={MessageSquare}
                        title={search ? 'No results' : filterType === 'announcement' ? 'No announcement channels' : filterType === 'direct' ? 'No direct messages' : filterType === 'group' ? 'No group chats' : 'No conversations'}
                        sub={filterType === 'announcement' ? (canManageAnnouncement ? 'Tap the 📣 button above to create a channel' : 'Announcement channels are created by admins') : filterType === 'direct' ? 'Tap People to message a colleague' : filterType === 'group' ? 'Tap + to create a group chat' : 'Tap + to create a group or People to message a colleague'} />
                ) : filtered.map(conv => {
                    const unread = conv.unread_count ?? 0;
                    const label  = convLabel(conv);
                    return (
                        <button key={conv.id} onClick={() => { setActiveConvId(conv.id); setThreadDisplayName(undefined); setView('thread'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                            <ConvAvatar c={conv} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-sm truncate ${unread > 0 ? 'font-black' : 'font-semibold text-gray-800'}`} style={unread > 0 ? { color: G0 } : {}}>{label}</p>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">{ago(getLastMessage(conv)?.created_at)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-1 mt-0.5">
                                    <p className={`text-[11px] truncate ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                        {(() => {
                                            const lm = getLastMessage(conv);
                                            const preview = getPreviewText(lm, conv.unread_count ?? 0);
                                            const sender = lm?.sender?.first_name;
                                            return (sender && conv.type !== 'direct' && !preview.startsWith('•') && !preview.startsWith('📢'))
                                                ? `${sender}: ${preview}` : preview;
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

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2" style={{ background: '#f7f8fc' }}>
                <div className="flex gap-2">
                    <button onClick={() => setShowCreateGroup(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50" style={{ color: G0 }}>
                        <Plus className="w-3.5 h-3.5" />New Group
                    </button>
                    {canManageAnnouncement ? (
                        <button onClick={() => setShowCreateAnnouncement(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-amber-50" style={{ color: '#d97706' }}>
                            <Megaphone className="w-3.5 h-3.5" />Channel
                        </button>
                    ) : (
                        <button onClick={() => setView('people')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50" style={{ color: G0 }}>
                            <Users className="w-3.5 h-3.5" />People
                        </button>
                    )}
                    {chatMgmtHref(role) && (
                        <Link href={chatMgmtHref(role)!} onClick={onClose} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-red-50 transition-colors" style={{ color: '#b91c1c' }}>
                            <Shield className="w-3.5 h-3.5" />Manage
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatPanel;