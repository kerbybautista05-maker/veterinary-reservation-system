// components/comms/Ideas.tsx
// ─── Ideas / Suggestions panel: list + detail + create form ──────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@inertiajs/react';
import {
    ChevronLeft, ArrowUpRight, Loader2, Lightbulb, Send, Shield,
    ThumbsUp, ThumbsDown, Megaphone, Edit2, Check, Sparkles,
} from 'lucide-react';

import { apiGet, apiPost } from './comms.api';
import {
    AuthUser, UserRole, Suggestion, SuggestionUser,
    G0, GS,
    ago, userDisplayName,
    getSuggestionSubmitter, suggestionUserName, suggestionUserPhoto,
    SUGGESTION_STATUS, SUGGESTION_PIPELINE, ideasHref, ideasMgmtHref, AnyUser,
} from './comms.types';
import { Avatar, Badge, Spinner, Empty } from './CommsUI';

// ════════════════════════════════════════════════════════════════════════════
// IDEAS PANEL (list)
// ════════════════════════════════════════════════════════════════════════════

export function IdeasPanel({ user, role, onClose, onUnreadChange }: {
    user: AuthUser; role: UserRole; onClose: () => void;
    /** Reports the total unread-suggestion count up to the parent (e.g. for
     *  an "Ideas" tab badge) — same convention as ChatPanel's onUnreadChange. */
    onUnreadChange?: (count: number) => void;
}) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading]         = useState(false);
    const [showCreate, setShowCreate]   = useState(false);
    const [activeId, setActiveId]       = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sort, setSort]               = useState<'votes' | 'newest'>('votes');

    const canCreate = ['teacher', 'team_leader', 'staff'].includes(role);
    const votingRef = useRef<Set<number>>(new Set());

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const url = `/api/suggestions?per_page=50&sort_by=${sort === 'votes' ? 'votes_count' : 'created_at'}&sort_order=desc`;
        const data = await apiGet<Suggestion[]>(url);
        if (data) setSuggestions(data);
        if (!silent) setLoading(false);
    }, [sort]);

    useEffect(() => { load(); }, [load]);

    // Report the total unread-suggestion count up to the parent (e.g. a red
    // counter badge on the "Ideas" tab), same convention ChatPanel uses.
    useEffect(() => {
        const total = suggestions.reduce((sum, s) => sum + (s.unread_count ?? (s.has_unread ? 1 : 0)), 0);
        onUnreadChange?.(total);
    }, [suggestions, onUnreadChange]);

    async function vote(e: React.MouseEvent, id: number, type: 'up' | 'down') {
        e.stopPropagation();
        e.preventDefault();
        if (votingRef.current.has(id)) return;
        votingRef.current.add(id);
        setSuggestions(prev => prev.map(s => {
            if (s.id !== id) return s;
            const wasVoted = s.my_vote === type;
            return { ...s, my_vote: wasVoted ? null : type, votes_count: (s.votes_count ?? 0) + (wasVoted ? -1 : s.my_vote ? 0 : 1) };
        }));
        await apiPost(`/api/suggestions/${id}/vote`, { vote: type });
        votingRef.current.delete(id);
        load(true);
    }

    const filtered = suggestions.filter(s => filterStatus === 'all' || s.status === filterStatus);
    const STATUS_FILTERS = ['all', 'submitted', 'under_review', 'planned', 'in_development', 'implemented', 'rejected'];

    if (showCreate) return <CreateSuggestionForm role={role} user={user} onBack={() => { setShowCreate(false); load(); }} onClose={onClose} />;
    if (activeId !== null) return (
        <SuggestionDetail id={activeId} user={user} role={role}
            onBack={() => { setActiveId(null); load(true); }} onClose={onClose}
            // Seed with what we already have from the list so the detail
            // view renders immediately instead of blanking to a full-screen
            // spinner while it re-fetches — avoids the "flash to white" on
            // every single open.
            initialSuggestion={suggestions.find(s => s.id === activeId)} />
    );

    return (
        <div className="flex flex-col h-full">
            <div className="px-3 pt-3 pb-2 flex gap-1.5 flex-shrink-0">
                <div className="flex gap-1 flex-1">
                    {(['votes', 'newest'] as const).map(s => (
                        <button key={s} onClick={() => setSort(s)}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                            style={sort === s ? { background: G0, color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                            {s === 'votes' ? '🔥 Top' : '🆕 New'}
                        </button>
                    ))}
                </div>
                {canCreate && (
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
                        <Sparkles className="w-3.5 h-3.5" />Suggest
                    </button>
                )}
                {ideasMgmtHref(role) && (
                    <Link href={ideasMgmtHref(role)!} onClick={onClose} className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-red-50" style={{ color: '#b91c1c' }}>
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
                                <span className="text-[9px] px-1 rounded-full" style={filterStatus === s ? { background: 'rgba(255,255,255,0.25)' } : { background: '#e5e7eb' }}>{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Suggestion list */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-2">
                {loading ? <Spinner label="Loading ideas…" />
                : filtered.length === 0 ? <Empty Icon={Lightbulb} title="No suggestions yet" sub={canCreate ? 'Share your idea with the team!' : 'No suggestions to show'} />
                : filtered.map(sug => {
                    const st        = SUGGESTION_STATUS[sug.status] ?? SUGGESTION_STATUS['pending'];
                    const submitter = getSuggestionSubmitter(sug);
                    const photo     = !sug.is_anonymous ? suggestionUserPhoto(submitter) : null;
                    const name      = sug.is_anonymous ? 'Anonymous' : suggestionUserName(submitter);
                    const catIcon   = ({ operations: '⚙️', policy: '📜', facility: '🏫', system: '💻', other: '💡' } as Record<string, string>)[sug.category ?? ''] ?? '💡';
                    // Real per-user unread indicator — a new comment or an
                    // official status update on this suggestion that THIS
                    // person hasn't seen yet. Clears the moment it's opened.
                    const hasAlert  = !!sug.has_unread;

                    return (
                        <div key={sug.id}
                            onClick={() => {
                                setActiveId(sug.id);
                                // Optimistic clear — the detail view's own
                                // fetch marks it read server-side; this just
                                // removes the badge immediately.
                                setSuggestions(prev => prev.map(s => s.id === sug.id ? { ...s, has_unread: false, unread_count: 0 } : s));
                            }}
                            className="flex items-start gap-2.5 px-3 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 cursor-pointer group"
                            style={hasAlert ? { background: '#fff7f7' } : {}}>
                            {/* Vote column */}
                            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-1" onClick={e => e.stopPropagation()}>
                                <button onClick={e => vote(e, sug.id, 'up')} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                                    style={sug.my_vote === 'up' ? { background: '#dcfce7', color: '#15803d' } : { background: '#f3f4f6', color: '#9ca3af' }}>
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[11px] font-black leading-none py-0.5" style={{ color: sug.votes_count && sug.votes_count > 0 ? G0 : '#9ca3af' }}>{sug.votes_count ?? 0}</span>
                                <button onClick={e => vote(e, sug.id, 'down')} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                                    style={sug.my_vote === 'down' ? { background: '#fee2e2', color: '#b91c1c' } : { background: '#f3f4f6', color: '#9ca3af' }}>
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    {photo ? <img src={photo} className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-gray-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    : <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[8px] flex-shrink-0" style={{ background: sug.is_anonymous ? '#9ca3af' : GS }}>{sug.is_anonymous ? '?' : name.charAt(0).toUpperCase()}</div>}
                                    <span className="text-[10px] font-semibold text-gray-600 truncate">{name}</span>
                                    <span className="text-[9px] text-gray-300 mx-0.5">·</span>
                                    <span className="text-[9px]">{catIcon}</span>
                                    <span className="text-[9px] text-gray-400 ml-auto flex-shrink-0">{ago(sug.created_at)}</span>
                                </div>
                                <p className={`text-xs leading-snug line-clamp-2 group-hover:text-blue-900 ${hasAlert ? 'font-black text-gray-900' : 'font-bold text-gray-800'}`}>{sug.title}</p>
                                {sug.excerpt && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{sug.excerpt}</p>}
                                <div className="flex items-center gap-1 mt-1.5">
                                    <Badge label={st.label} color={st.color} bg={st.bg} />
                                    {sug.category_label && <span className="text-[10px] text-gray-400">{sug.category_label}</span>}
                                    {hasAlert && (
                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                                            ● {sug.unread_count && sug.unread_count > 1 ? `${sug.unread_count} New` : 'New'}
                                        </span>
                                    )}
                                    <ChevronLeft className="w-3 h-3 text-gray-300 ml-auto group-hover:text-gray-400 rotate-180" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2 flex gap-2" style={{ background: '#f7f8fc' }}>
                {canCreate && (
                    <button onClick={() => setShowCreate(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-amber-50 transition-colors" style={{ color: '#d97706' }}>
                        <Sparkles className="w-3.5 h-3.5" />New Idea
                    </button>
                )}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE SUGGESTION FORM
// ════════════════════════════════════════════════════════════════════════════

function CreateSuggestionForm({ role, user, onBack, onClose }: { role: UserRole; user: AuthUser; onBack: () => void; onClose: () => void }) {
    const CATS = ['operations', 'policy', 'facility', 'system', 'other'];
    const CAT_LABELS: Record<string, string> = { operations: 'Operations', policy: 'Policy', facility: 'Facility', system: 'System', other: 'Other' };
    const [form, setForm]             = useState({ title: '', body: '', category: '', is_anonymous: false });
    const [errors, setErrors]         = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone]             = useState(false);

    async function submit() {
        if (submitting) return;
        const e: Record<string, string> = {};
        if (!form.title.trim())    e.title    = 'Title is required';
        if (!form.body.trim())     e.body     = 'Description is required';
        if (!form.category)        e.category = 'Category is required';
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
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}><Sparkles className="w-7 h-7 text-green-600" /></div>
            <p className="text-sm font-black text-gray-800">Idea submitted!</p>
            <p className="text-xs text-gray-500">Thank you for sharing.</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                <p className="text-xs font-black" style={{ color: G0 }}>New Suggestion</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="What's your suggestion about?"
                        className="w-full text-xs px-3 py-2 rounded-lg border focus:outline-none" style={{ borderColor: errors.title ? '#ef4444' : '#e5e7eb' }} />
                    {errors.title && <p className="text-[10px] text-red-500 mt-0.5">{errors.title}</p>}
                </div>
                <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Category *</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full text-xs px-3 py-2 rounded-lg border focus:outline-none bg-white" style={{ borderColor: errors.category ? '#ef4444' : '#e5e7eb' }}>
                        <option value="">Select category…</option>
                        {CATS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </select>
                    {errors.category && <p className="text-[10px] text-red-500 mt-0.5">{errors.category}</p>}
                </div>
                <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Description *</label>
                    <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Describe your idea in detail…" rows={4}
                        className="w-full text-xs px-3 py-2 rounded-lg border focus:outline-none resize-none" style={{ borderColor: errors.body ? '#ef4444' : '#e5e7eb' }} />
                    {errors.body && <p className="text-[10px] text-red-500 mt-0.5">{errors.body}</p>}
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm(p => ({ ...p, is_anonymous: e.target.checked }))} className="sr-only" />
                        <div className="w-9 h-5 rounded-full transition-all" style={{ background: form.is_anonymous ? G0 : '#d1d5db' }}>
                            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: form.is_anonymous ? 'translateX(16px)' : 'translateX(0)' }} />
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
                <button onClick={submit} disabled={submitting} className="flex-1 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}Submit
                </button>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// SUGGESTION DETAIL
// ════════════════════════════════════════════════════════════════════════════

function SuggestionDetail({ id, user, role, onBack, onClose, initialSuggestion }: {
    id: number; user: AuthUser; role: UserRole; onBack: () => void; onClose: () => void;
    /** Already-known summary from the list — renders the shell immediately
     *  instead of blanking to a full-screen spinner while comments load. */
    initialSuggestion?: Suggestion | null;
}) {
    interface CommentUser { id?: number; first_name?: string; last_name?: string; real_name?: string; profile_photo_path?: string; profile_photo_url?: string; role?: string; }
    interface SugComment { id: number; content?: string; body?: string; is_official_comment?: boolean; created_at: string; time_ago?: string; commenter?: CommentUser; user?: CommentUser; }
    interface SugDetail extends Suggestion { official_update?: string; comments?: SugComment[]; }

    const [sug, setSug]               = useState<SugDetail | null>((initialSuggestion as SugDetail) ?? null);
    const [loading, setLoading]       = useState(!initialSuggestion);
    const [comment, setComment]       = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showStatusPanel, setShowStatusPanel] = useState(false);
    const [newStatus, setNewStatus]             = useState('');
    const [officialNote, setOfficialNote]       = useState('');
    const [updatingStatus, setUpdatingStatus]   = useState(false);
    const [statusSuccess, setStatusSuccess]     = useState('');

    const canManage = role === 'admin' || role === 'staff';
    const votingRef = useRef(false);

    const load = useCallback(async (silent = false) => {
        // Only show the full loading state when there's truly nothing
        // seeded yet — otherwise this always fetches quietly in the
        // background and just merges in comments/official_update once ready.
        if (!silent && !sug) setLoading(true);
        const data = await apiGet<SugDetail>(`/api/suggestions/${id}`);
        if (data) setSug(data);
        setLoading(false);
    }, [id]);

    useEffect(() => { load(); }, [id]);

    async function vote(type: 'up' | 'down') {
        if (votingRef.current) return;
        votingRef.current = true;
        setSug(prev => prev ? { ...prev, my_vote: prev.my_vote === type ? null : type, votes_count: (prev.votes_count ?? 0) + (prev.my_vote === type ? -1 : prev.my_vote ? 0 : 1) } : prev);
        await apiPost(`/api/suggestions/${id}/vote`, { vote: type });
        votingRef.current = false;
        load(true);
    }

    async function addComment() {
        if (!comment.trim() || submitting) return;
        setSubmitting(true);
        const res = await apiPost(`/api/suggestions/${id}/comments`, { body: comment });
        if (res.success) { setComment(''); load(true); }
        setSubmitting(false);
    }

    async function updateStatus() {
        if (!newStatus || updatingStatus) return;
        setUpdatingStatus(true);
        const res = await apiPost(`/api/suggestions/${id}/status`, { status: newStatus, note: officialNote.trim() || undefined });
        setUpdatingStatus(false);
        if (res.success) {
            setStatusSuccess(`Status updated to "${SUGGESTION_PIPELINE.find(p => p.status === newStatus)?.label}"!`);
            setOfficialNote(''); setShowStatusPanel(false); load(true);
            setTimeout(() => setStatusSuccess(''), 3000);
        }
    }

    // Only blank the whole view when there's genuinely nothing seeded yet —
    // otherwise render the shell right away and let comments/official_update
    // pop in once the background fetch resolves (no more flash-to-white).
    if (loading && !sug) return <div className="h-full flex items-center justify-center"><Spinner label="Loading…" /></div>;
    if (!sug) return <div className="h-full flex items-center justify-center"><Empty title="Suggestion not found" /></div>;

    const st          = SUGGESTION_STATUS[sug.status] ?? SUGGESTION_STATUS['pending'];
    const submitter   = getSuggestionSubmitter(sug);
    const subPhoto    = !sug.is_anonymous ? suggestionUserPhoto(submitter) : null;
    const subName     = sug.is_anonymous ? 'Anonymous' : suggestionUserName(submitter);
    const catIcon     = ({ operations: '⚙️', policy: '📜', facility: '🏫', system: '💻', other: '💡' } as Record<string, string>)[sug.category ?? ''] ?? '💡';
    const pipelineIdx = SUGGESTION_PIPELINE.findIndex(p => p.status === sug.status);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                <p className="text-xs font-black flex-1 truncate" style={{ color: G0 }}>Suggestion</p>
                {canManage && (
                    <button onClick={() => { setNewStatus(sug.status); setShowStatusPanel(s => !s); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black transition-all"
                        style={showStatusPanel ? { background: G0, color: 'white' } : { background: `${G0}12`, color: G0 }}>
                        <Edit2 className="w-3 h-3" />Manage
                    </button>
                )}
                <Link href={ideasHref(role, id)} onClick={onClose} className="text-[10px] font-bold opacity-60 hover:opacity-100 flex items-center gap-0.5 flex-shrink-0" style={{ color: G0 }}>
                    <ArrowUpRight className="w-3 h-3" />Full
                </Link>
            </div>

            {statusSuccess && (
                <div className="mx-3 mt-2 px-3 py-2 rounded-xl text-white text-[11px] font-bold flex items-center gap-2 flex-shrink-0" style={{ background: '#15803d', animation: 'mn2Panel 0.2s ease-out both' }}>
                    <span>✅</span>{statusSuccess}
                </div>
            )}

            {/* Status management panel */}
            {canManage && showStatusPanel && (
                <div className="flex-shrink-0 mx-3 mt-2 rounded-2xl border-2 overflow-hidden" style={{ borderColor: `${G0}20`, background: `${G0}04` }}>
                    <div className="px-3 py-2 flex items-center gap-2" style={{ background: `${G0}10` }}>
                        <Edit2 className="w-3.5 h-3.5" style={{ color: G0 }} />
                        <p className="text-[11px] font-black" style={{ color: G0 }}>Update Progress</p>
                    </div>
                    <div className="px-3 py-2.5 overflow-x-auto">
                        <div className="flex gap-1.5 min-w-max">
                            {SUGGESTION_PIPELINE.map((step, idx) => {
                                const isCurrent = sug.status === step.status;
                                const isPast    = idx < pipelineIdx;
                                const isNew     = newStatus === step.status;
                                return (
                                    <button key={step.status} type="button" onClick={() => setNewStatus(step.status)}
                                        className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border-2 transition-all min-w-[72px]"
                                        style={isNew ? { borderColor: step.color, background: step.bg } : isCurrent ? { borderColor: step.color, background: step.bg, opacity: 0.7 } : { borderColor: '#e5e7eb', background: 'white', opacity: isPast ? 0.5 : 1 }}>
                                        <span className="text-base leading-none">{step.icon}</span>
                                        <span className="text-[9px] font-black text-center leading-tight" style={{ color: isNew ? step.color : '#6b7280' }}>{step.label}</span>
                                        {isCurrent && !isNew && <span className="text-[8px] font-black px-1 rounded" style={{ background: step.color, color: 'white' }}>NOW</span>}
                                        {isNew && newStatus !== sug.status && <span className="text-[8px] font-black px-1 rounded" style={{ background: step.color, color: 'white' }}>SET</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="px-3 pb-3 space-y-2">
                        <textarea value={officialNote} onChange={e => setOfficialNote(e.target.value)} placeholder="Official update message to the submitter (optional)…" rows={2}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': `${G0}25` } as React.CSSProperties} />
                        <div className="flex gap-2">
                            <button onClick={() => { setShowStatusPanel(false); setNewStatus(''); setOfficialNote(''); }} className="flex-1 py-2 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={updateStatus} disabled={updatingStatus || !newStatus || newStatus === sug.status}
                                className="flex-1 py-2 rounded-xl text-white text-[11px] font-black disabled:opacity-40 flex items-center justify-center gap-1 transition-all hover:opacity-90" style={{ background: GS }}>
                                {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                {newStatus && newStatus !== sug.status ? `Set → ${SUGGESTION_PIPELINE.find(p => p.status === newStatus)?.label}` : 'No change'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {/* Submitter card */}
                <div className="flex items-start gap-2.5">
                    {subPhoto ? <img src={subPhoto} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-gray-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: sug.is_anonymous ? '#9ca3af' : GS }}>{sug.is_anonymous ? '?' : subName.charAt(0).toUpperCase()}</div>}
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

                <div>
                    <p className="text-sm font-black text-gray-900 leading-snug mb-1.5">{sug.title}</p>
                    {sug.body && <p className="text-xs text-gray-600 leading-relaxed">{sug.body}</p>}
                </div>

                {sug.official_update && (
                    <div className="flex gap-2.5 p-3 rounded-xl border-l-4" style={{ background: `${G0}06`, borderColor: G0 }}>
                        <Megaphone className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: G0 }} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wide mb-0.5" style={{ color: G0 }}>Official Update</p>
                            <p className="text-xs text-gray-700 leading-relaxed">{sug.official_update}</p>
                        </div>
                    </div>
                )}

                {/* Voting */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: `${G0}06` }}>
                    <button type="button" onClick={() => vote('up')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                        style={sug.my_vote === 'up' ? { background: '#dcfce7', color: '#15803d' } : { background: '#f3f4f6', color: '#6b7280' }}>
                        <ThumbsUp className="w-3.5 h-3.5" />Upvote
                    </button>
                    <div className="flex-1 text-center">
                        <p className="text-lg font-black leading-none" style={{ color: G0 }}>{sug.votes_count ?? 0}</p>
                        <p className="text-[9px] text-gray-400">votes</p>
                    </div>
                    <button type="button" onClick={() => vote('down')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                        style={sug.my_vote === 'down' ? { background: '#fee2e2', color: '#b91c1c' } : { background: '#f3f4f6', color: '#6b7280' }}>
                        <ThumbsDown className="w-3.5 h-3.5" />Downvote
                    </button>
                </div>

                {/* Comments */}
                {(sug.comments?.length ?? 0) > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-2">Comments ({sug.comments!.length})</p>
                        <div className="space-y-2">
                            {sug.comments!.map(c => {
                                const cu         = c.commenter ?? c.user;
                                const cuPhoto    = cu ? suggestionUserPhoto(cu as SuggestionUser) : null;
                                const cuName     = cu ? suggestionUserName(cu as SuggestionUser) : 'Unknown';
                                const isOfficial = c.is_official_comment || (cu as any)?.role === 'admin' || (cu as any)?.role === 'staff';
                                return (
                                    <div key={c.id} className="flex gap-2">
                                        {cuPhoto ? <img src={cuPhoto} className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] flex-shrink-0" style={{ background: isOfficial ? G0 : GS }}>{cuName.charAt(0).toUpperCase()}</div>}
                                        <div className="flex-1 min-w-0">
                                            <div className="px-2.5 py-2 rounded-xl rounded-tl-sm" style={isOfficial ? { background: `${G0}0d`, border: `1px solid ${G0}20` } : { background: '#f3f4f6' }}>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] font-black" style={{ color: isOfficial ? G0 : '#374151' }}>{cuName}</span>
                                                    {isOfficial && <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ background: `${G0}15`, color: G0 }}>Staff</span>}
                                                    <span className="text-[9px] text-gray-400 ml-auto">{c.time_ago ?? ago(c.created_at)}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-700 leading-relaxed">{c.content ?? c.body}</p>
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
                    placeholder={canManage ? 'Add official comment or feedback…' : 'Add a comment…'} rows={2}
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

export default IdeasPanel;