// components/comms/Support.tsx
// ─── Support ticket panel: list + thread + create form ────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@inertiajs/react';
import {
    X, ChevronLeft, ChevronRight, Plus, Search, ArrowUpRight, Loader2,
    HelpCircle, FileText, Send, Paperclip, Bell, Shield,
    AlertCircle, UserCheck,
} from 'lucide-react';

import { apiFetch, apiGet, apiPost } from './comms.api';
import {
    AuthUser, UserRole, SupportTicket, TicketUser,
    G0, GS,
    ago, userName, userDisplayName, initials, userPhoto,
    getTicketSubmitter, ticketUserPhoto, ticketUserName, ticketInitials,
    TICKET_STATUS, TICKET_PRIORITY, TICKET_SORT_PRIORITY, PRIORITY_SORT,
    SUPPORT_CATEGORIES, supportHref, supportMgmtHref, AnyUser,
} from './comms.types';
import { Avatar, Badge, Spinner, Empty } from './CommsUI';

// ════════════════════════════════════════════════════════════════════════════
// SUPPORT PANEL (list)
// ════════════════════════════════════════════════════════════════════════════

export function SupportPanel({ user, role, markTicketSeen, onClose, onUnreadChange }: {
    user: AuthUser; role: UserRole;
    markTicketSeen: (id: number, status: string) => void;
    onClose: () => void;
    /** Reports the total unread-ticket count up to the parent (e.g. for a
     *  "Support" tab badge) — same convention as ChatPanel's onUnreadChange. */
    onUnreadChange?: (count: number) => void;
}) {
    const [tickets, setTickets]           = useState<SupportTicket[]>([]);
    const [loading, setLoading]           = useState(false);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    const [showCreate, setShowCreate]     = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [search, setSearch]             = useState('');
    const [toast, setToast]               = useState<{ msg: string; color: string } | null>(null);
    const prevStatusRef  = useRef<Record<number, string>>({});
    const initialLoadRef = useRef(false);

    const canCreate = role === 'teacher' || role === 'team_leader' || role === 'staff';

    function showToast(msg: string, color = '#15803d') {
        setToast({ msg, color });
        setTimeout(() => setToast(null), 4000);
    }

    const loadTickets = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const data = await apiGet<SupportTicket[]>('/api/support-tickets?per_page=50');
        if (data) {
            if (silent && initialLoadRef.current) {
                data.forEach(t => {
                    const prev = prevStatusRef.current[t.id];
                    if (prev && prev !== t.status) {
                        const st = TICKET_STATUS[t.status];
                        const shortNum = t.ticket_number?.split('-').pop() ?? String(t.id);
                        if (role === 'teacher' || role === 'team_leader') showToast(`#${shortNum} → ${st?.label ?? t.status}`, st?.color ?? G0);
                        if ((role === 'admin' || role === 'staff') && t.status === 'new') showToast(`New ticket #${shortNum}: ${t.subject.slice(0, 40)}`, '#0369a1');
                    }
                });
            }
            const newMap: Record<number, string> = {};
            data.forEach(t => { newMap[t.id] = t.status; });
            prevStatusRef.current = newMap;
            initialLoadRef.current = true;
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
    useEffect(() => { const iv = setInterval(() => loadTickets(true), 10_000); return () => clearInterval(iv); }, [loadTickets]);

    // Report the total unread-ticket count up to the parent (e.g. a red
    // counter badge on the "Support" tab), same convention ChatPanel uses.
    useEffect(() => {
        const total = tickets.reduce((sum, t) => sum + (t.unread_count ?? (t.has_unread ? 1 : 0)), 0);
        onUnreadChange?.(total);
    }, [tickets, onUnreadChange]);

    const filtered = tickets.filter(t => {
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !(t.ticket_number ?? '').toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    if (showCreate) return <CreateTicketForm role={role} onBack={() => { setShowCreate(false); loadTickets(); }} onClose={onClose} />;
    if (activeTicketId !== null) return (
        <TicketThread ticketId={activeTicketId} user={user} role={role}
            onBack={() => { setActiveTicketId(null); loadTickets(true); }} onClose={onClose}
            markTicketSeen={markTicketSeen}
            // Seed with whatever we already have from the list (subject,
            // status, priority, submitter, etc.) so the thread can render
            // immediately instead of blanking to a full-screen spinner while
            // it re-fetches — that blank-then-flash-in was the "glitchy
            // white blink" people were seeing on every single ticket open.
            initialTicket={tickets.find(t => t.id === activeTicketId)} />
    );

    const STATUS_FILTERS = ['all', 'new', 'under_review', 'in_progress', 'resolved', 'closed'];
    const statusCounts = tickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

    return (
        <div className="flex flex-col h-full relative">
            {toast && (
                <div className="absolute top-2 left-3 right-3 z-50 flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg text-white text-[11px] font-bold transition-all"
                    style={{ background: toast.color, animation: 'mn2Panel 0.2s ease-out both' }}>
                    <Bell className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1">{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            <div className="px-3 pt-3 pb-2 flex gap-2 flex-shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none placeholder-gray-400" />
                </div>
                {canCreate && (
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-bold whitespace-nowrap" style={{ background: GS }}>
                        <Plus className="w-3.5 h-3.5" />New Ticket
                    </button>
                )}
                {supportMgmtHref(role) && (
                    <Link href={supportMgmtHref(role)!} onClick={onClose} className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-red-50 whitespace-nowrap" style={{ color: '#b91c1c' }}>
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
                                    style={filterStatus === s ? { background: 'rgba(255,255,255,0.25)' } : isAlert && count > 0 ? { background: '#fecaca', color: '#b91c1c' } : { background: '#e5e7eb' }}>
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
                    const catLabel = ({ technical_issue: '🔧', attendance_concern: '📋', schedule_concern: '📅', equipment_concern: '🖥️', account_lock_concern: '🔒', contract_concern: '📄', other: '💬' } as Record<string, string>)[ticket.category ?? ''] ?? '🎫';
                    // FIX: this used to guess "something's new" purely from
                    // status (new for staff/admin; in_progress/resolved for
                    // teacher/TL) — so it stayed lit forever once a status
                    // was reached, whether or not the person had actually
                    // seen the latest reply, and never lit up again for a
                    // SECOND reply under the same status. has_unread is a
                    // real per-user count of unread Notification rows tied
                    // to this ticket, so it now reflects genuinely new
                    // activity for THIS person and clears the moment they
                    // open it.
                    const hasAlert = !!ticket.has_unread;
                    const submitter = getTicketSubmitter(ticket);
                    const submitterPhoto = ticketUserPhoto(submitter);

                    return (
                        <button key={ticket.id}
                            onClick={() => {
                                setActiveTicketId(ticket.id);
                                markTicketSeen(ticket.id, ticket.status);
                                // Optimistic clear — the detail view's own
                                // fetch marks it read server-side; this just
                                // removes the badge immediately instead of
                                // waiting for the next 10s poll.
                                setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, has_unread: false, unread_count: 0 } : t));
                            }}
                            className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left group"
                            style={hasAlert ? { background: '#fff7f7' } : {}}>
                            <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base relative" style={{ background: hasAlert ? '#fee2e2' : `${G0}0d` }}>
                                    {catLabel}
                                    {hasAlert && (
                                        ticket.unread_count && ticket.unread_count > 1 ? (
                                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 border-2 border-white text-white text-[9px] font-black flex items-center justify-center">{ticket.unread_count}</span>
                                        ) : (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                                        )
                                    )}
                                </div>
                                {submitter && (
                                    <div className="flex-shrink-0" title={userDisplayName(submitter as AnyUser)}>
                                        {submitterPhoto ? <img src={submitterPhoto} className="w-5 h-5 rounded-full object-cover border border-gray-200" /> : (
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[8px]" style={{ background: GS }}>{initials(submitter as AnyUser)}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="text-[10px] text-gray-400 font-mono">{ticket.ticket_number}</span>
                                    <span className="text-[10px] text-gray-400">{ago(ticket.updated_at ?? ticket.created_at)}</span>
                                </div>
                                <p className={`text-xs leading-snug line-clamp-2 ${hasAlert ? 'font-black text-gray-900' : 'font-semibold text-gray-800'} group-hover:text-blue-900`}>{ticket.subject}</p>
                                {(role === 'admin' || role === 'staff') && submitter && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">by {ticketUserName(submitter)}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                    <Badge label={st.label} color={st.color} bg={st.bg} />
                                    {pr && <Badge label={pr.label} color={pr.color} bg={pr.bg} />}
                                    {hasAlert && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#b91c1c' }}>{(role === 'admin' || role === 'staff') ? '● Needs attention' : '● New update'}</span>}
                                    <ChevronRight className="w-3 h-3 text-gray-300 ml-auto group-hover:text-gray-400" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2 flex gap-2" style={{ background: '#f7f8fc' }}>
                {canCreate && (
                    <button onClick={() => setShowCreate(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-white transition-colors" style={{ color: G0 }}>
                        <Plus className="w-3.5 h-3.5" />New Ticket
                    </button>
                )}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE TICKET FORM
// ════════════════════════════════════════════════════════════════════════════

function CreateTicketForm({ role, onBack, onClose }: { role: UserRole; onBack: () => void; onClose: () => void }) {
    const [step, setStep]             = useState<'category' | 'details'>('category');
    const [form, setForm]             = useState({ subject: '', description: '', category: '', priority: 'medium' });
    const [attachFiles, setAttachFiles] = useState<File[]>([]);
    const [errors, setErrors]         = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone]             = useState(false);
    const attachRef = useRef<HTMLInputElement>(null);

    const selectedCat = SUPPORT_CATEGORIES.find(c => c.id === form.category);

    function removeAttach(i: number) { setAttachFiles(prev => prev.filter((_, j) => j !== i)); }

    async function submit() {
        if (submitting) return;
        const e: Record<string, string> = {};
        if (!form.subject.trim())     e.subject     = 'Subject is required';
        if (!form.description.trim()) e.description = 'Description is required';
        if (!form.category)           e.category    = 'Category is required';
        setErrors(e);
        if (Object.keys(e).length) return;
        setSubmitting(true);
        try {
            let res;
            if (attachFiles.length > 0) {
                const fd = new FormData();
                fd.append('subject', form.subject); fd.append('description', form.description);
                fd.append('category', form.category); fd.append('priority', form.priority);
                attachFiles.forEach(f => fd.append('attachments[]', f));
                res = await apiPost('/api/support-tickets', fd);
            } else { res = await apiPost('/api/support-tickets', form); }
            if (res.success) { setDone(true); setTimeout(onBack, 1600); }
            else if (res.errors) setErrors(Object.fromEntries(Object.entries(res.errors).map(([k, v]) => [k, (v as string[])[0]])));
            else setErrors({ submit: res.message ?? 'Failed to submit ticket' });
        } finally { setSubmitting(false); }
    }

    if (done) return (
        <div className="flex flex-col items-center justify-center gap-3 h-full px-6 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: '#dcfce7' }}>✅</div>
            <p className="text-sm font-black text-gray-800">Ticket Submitted!</p>
            <p className="text-xs text-gray-500">Our team will review it shortly.</p>
        </div>
    );

    if (step === 'category') return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                <div className="flex-1">
                    <p className="text-xs font-black" style={{ color: G0 }}>New Support Ticket</p>
                    <p className="text-[10px] text-gray-400">Step 1 of 2 — Select category</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-wide px-1 mb-3">What is your concern about?</p>
                {SUPPORT_CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => { setForm(p => ({ ...p, category: cat.id })); setStep('details'); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all hover:border-blue-200 hover:bg-blue-50 group" style={{ borderColor: '#e5e7eb', background: 'white' }}>
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

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={() => setStep('category')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                <div className="flex-1">
                    <div className="flex items-center gap-1.5"><span className="text-base">{selectedCat?.icon}</span><p className="text-xs font-black" style={{ color: G0 }}>{selectedCat?.label}</p></div>
                    <p className="text-[10px] text-gray-400">Step 2 of 2 — Describe your concern</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1">Subject *</label>
                    <input value={form.subject} onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(p => ({ ...p, subject: '' })); }}
                        placeholder={`Brief title — e.g. "${selectedCat?.desc.split(',')[0]}"`}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: errors.subject ? '#ef4444' : '#e5e7eb', '--tw-ring-color': `${G0}25` } as React.CSSProperties} />
                    {errors.subject && <p className="text-[10px] text-red-500 mt-0.5">{errors.subject}</p>}
                </div>
                <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1.5">Priority</label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {(['low', 'medium', 'high', 'critical'] as const).map(p => {
                            const cfg = TICKET_PRIORITY[p];
                            return (
                                <button key={p} type="button" onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                                    className="py-2 rounded-xl text-[10px] font-black border-2 transition-all"
                                    style={form.priority === p ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : { background: '#f9fafb', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                                    {cfg.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1">Description *</label>
                    <textarea value={form.description} onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setErrors(p => ({ ...p, description: '' })); }}
                        placeholder="Please describe your concern in detail…" rows={5}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-none transition-all"
                        style={{ borderColor: errors.description ? '#ef4444' : '#e5e7eb', '--tw-ring-color': `${G0}25` } as React.CSSProperties} />
                    {errors.description && <p className="text-[10px] text-red-500 mt-0.5">{errors.description}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{form.description.length} chars</p>
                </div>
                <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide block mb-1.5">Attachments <span className="text-gray-400 font-normal normal-case">(screenshots, videos — optional)</span></label>
                    <input ref={attachRef} type="file" multiple accept="image/*,video/*,application/pdf,.doc,.docx,.xlsx,.xls" className="hidden"
                        onChange={e => setAttachFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])} />
                    {attachFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {attachFiles.map((f, i) => (
                                <div key={i} className="relative group flex-shrink-0">
                                    {f.type.startsWith('image/') ? <img src={URL.createObjectURL(f)} className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200" />
                                    : f.type.startsWith('video/') ? <div className="w-16 h-16 rounded-xl border-2 border-gray-200 bg-gray-100 flex flex-col items-center justify-center gap-1"><span className="text-xl">🎬</span><span className="text-[8px] text-gray-500 truncate w-14 text-center px-1">{f.name}</span></div>
                                    : <div className="w-16 h-16 rounded-xl border-2 border-gray-200 bg-gray-100 flex flex-col items-center justify-center gap-1 p-1"><FileText className="w-5 h-5 text-gray-400" /><span className="text-[8px] text-gray-500 truncate w-full text-center">{f.name}</span></div>}
                                    <button onClick={() => removeAttach(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button type="button" onClick={() => attachRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                        <Paperclip className="w-4 h-4" />
                        {attachFiles.length > 0 ? `${attachFiles.length} file${attachFiles.length > 1 ? 's' : ''} attached — tap to add more` : 'Attach screenshot, video or document'}
                    </button>
                </div>
                {errors.submit && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <p className="text-[11px] text-red-600">{errors.submit}</p>
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 px-3 py-2.5 border-t border-gray-100 flex gap-2">
                <button onClick={() => setStep('category')} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">Back</button>
                <button onClick={submit} disabled={submitting || !form.subject.trim() || !form.description.trim()}
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-black disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all hover:opacity-90" style={{ background: GS }}>
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Submit Ticket
                </button>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// TICKET THREAD
// ════════════════════════════════════════════════════════════════════════════

function TicketThread({ ticketId, user, role, onBack, onClose, markTicketSeen, initialTicket }: {
    ticketId: number; user: AuthUser; role: UserRole; onBack: () => void; onClose: () => void;
    markTicketSeen?: (id: number, status: string) => void;
    /** Already-known summary from the list (subject/status/priority/etc.) —
     *  used to render the shell immediately instead of blanking to a
     *  full-screen spinner while the full detail (comments, attachments,
     *  description) loads in the background. */
    initialTicket?: SupportTicket | null;
}) {
    interface CommentAttachment { id: number; file_name: string; file_path: string; mime_type?: string; file_url?: string; formatted_file_size?: string; }
    interface Comment { id: number; content?: string; body?: string; is_internal?: boolean; created_at: string; time_ago?: string; user?: AnyUser & { role?: string; profile_photo_path?: string; profile_photo_url?: string }; attachments?: CommentAttachment[]; }
    interface TicketAttachment { id: number; file_name: string; file_path: string; mime_type?: string; file_url?: string; formatted_file_size?: string; }
    interface TicketDetail extends SupportTicket { description?: string; submittedBy?: TicketUser; comments?: Comment[]; attachments?: TicketAttachment[]; }

    // Seed from the list summary when we have one — lets the shell (header,
    // subject, status/priority badges, submitter) paint on the very first
    // frame instead of showing nothing while the network round-trip for the
    // full detail (comments/description/attachments) is still in flight.
    const [ticket, setTicket]         = useState<TicketDetail | null>((initialTicket as TicketDetail) ?? null);
    const [loading, setLoading]       = useState(!initialTicket);
    const [comment, setComment]       = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyFiles, setReplyFiles] = useState<File[]>([]);
    const replyFileRef = useRef<HTMLInputElement>(null);
    const transitioningRef = useRef(false);
    const canManage = role === 'admin' || role === 'staff' || role === 'team_leader';

    const load = useCallback(async (silent = false) => {
        // Only show the full loading state when we truly have nothing to
        // show yet (e.g. a deep link straight into a ticket with no seed).
        // If we already have a seed OR existing ticket data, this fetch
        // always happens quietly in the background.
        if (!silent && !ticket) setLoading(true);
        const data = await apiGet<TicketDetail>(`/api/support-tickets/${ticketId}`);
        if (data) { setTicket(data); markTicketSeen?.(ticketId, data.status); }
        setLoading(false);
    }, [ticketId, markTicketSeen, ticket]);

    useEffect(() => { load(); }, [ticketId]);
    useEffect(() => { const iv = setInterval(() => load(true), 8_000); return () => clearInterval(iv); }, [ticketId]);

    async function addComment(internal = false) {
        if ((!comment.trim() && replyFiles.length === 0) || submitting) return;
        setSubmitting(true);
        try {
            let res;
            if (replyFiles.length > 0) {
                const fd = new FormData();
                fd.append('content', comment.trim() || '(attachment)');
                fd.append('is_internal', internal ? '1' : '0');
                replyFiles.forEach(f => fd.append('attachments[]', f));
                res = await apiPost(`/api/support-tickets/${ticketId}/comments`, fd);
            } else { res = await apiPost(`/api/support-tickets/${ticketId}/comments`, { content: comment, is_internal: internal }); }
            if (res.success) { setComment(''); setIsInternal(false); setReplyFiles([]); load(true); }
        } finally { setSubmitting(false); }
    }

    async function transition(action: string, body?: Record<string, string>) {
        if (transitioningRef.current) return;
        transitioningRef.current = true;
        const res = await apiPost(`/api/support-tickets/${ticketId}/${action}`, body ?? {});
        transitioningRef.current = false;
        if (res.success) load(true);
    }

    // Only blank the whole view when there's genuinely nothing to show yet
    // (e.g. a deep link straight into a ticket, no list seed available).
    // Whenever we DO have a seed, we skip straight to rendering the shell
    // below and let comments/description/attachments simply pop in once the
    // background fetch resolves — no more flash-to-white on every open.
    if (loading && !ticket) return <div className="h-full flex items-center justify-center"><Spinner label="Loading ticket…" /></div>;
    if (!ticket) return <div className="h-full flex items-center justify-center"><Empty Icon={AlertCircle} title="Ticket not found" /></div>;

    const st = TICKET_STATUS[ticket.status] ?? TICKET_STATUS['new'];
    const pr = ticket.priority ? TICKET_PRIORITY[ticket.priority] : null;
    const cat = SUPPORT_CATEGORIES.find(c => c.id === ticket.category);

    const nextActions: { label: string; action: string; color: string; body?: Record<string, string> }[] = [];
    if (canManage) {
        if (ticket.status === 'new')          nextActions.push({ label: 'Review',      action: 'under-review', color: '#b45309' });
        if (ticket.status === 'under_review') nextActions.push({ label: 'In Progress', action: 'in-progress', color: '#0369a1' });
        if (ticket.status === 'in_progress')  nextActions.push({ label: 'Resolve',     action: 'resolve',     color: '#15803d', body: { resolution_notes: 'Resolved via support panel.' } });
        if (ticket.status === 'resolved')     nextActions.push({ label: 'Close',       action: 'close',       color: '#6b7280' });
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0" style={{ background: '#f7f8fc' }}>
                <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-mono">{ticket.ticket_number}</p>
                    <p className="text-xs font-black truncate" style={{ color: G0 }}>{ticket.subject}</p>
                </div>
                <Link href={supportHref(role, ticketId)} onClick={onClose} className="text-[10px] font-bold opacity-60 hover:opacity-100 flex items-center gap-0.5 flex-shrink-0" style={{ color: G0 }}>
                    <ArrowUpRight className="w-3 h-3" />Full
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
                {/* Submitter card */}
                {(() => {
                    const submitter = getTicketSubmitter(ticket);
                    const submitterPhoto = ticketUserPhoto(submitter);
                    return (
                        <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-gray-50">
                            <div className="flex-shrink-0">
                                {submitterPhoto ? <img src={submitterPhoto} className="w-10 h-10 rounded-xl object-cover border border-gray-200" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: GS }}>{ticketInitials(submitter)}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-black text-gray-800 truncate">{ticketUserName(submitter)}</p>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{ago(ticket.created_at)}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                    {cat && <span className="text-sm">{cat.icon}</span>}
                                    <Badge label={st.label} color={st.color} bg={st.bg} />
                                    {pr && <Badge label={pr.label} color={pr.color} bg={pr.bg} />}
                                    {ticket.assignee && <span className="text-[10px] text-gray-500 flex items-center gap-1"><UserCheck className="w-3 h-3" />{userName(ticket.assignee as AnyUser)}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {ticket.description && (
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-[11px] text-gray-700 leading-relaxed">{ticket.description}</p>
                    </div>
                )}

                {(ticket.attachments?.length ?? 0) > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1.5">Attachments ({ticket.attachments!.length})</p>
                        <div className="flex flex-wrap gap-2">
                            {ticket.attachments!.map(att => {
                                const isImg = att.mime_type?.startsWith('image/');
                                const isVid = att.mime_type?.startsWith('video/');
                                const url   = att.file_url ?? `/storage/${att.file_path}`;
                                return (
                                    <a key={att.id} href={url} target="_blank" rel="noreferrer" className="flex-shrink-0 block rounded-xl overflow-hidden border-2 border-gray-100 hover:border-blue-300 transition-colors" title={att.file_name}>
                                        {isImg ? <img src={url} className="w-20 h-20 object-cover" />
                                        : isVid ? <div className="w-20 h-20 bg-gray-100 flex flex-col items-center justify-center gap-1"><span className="text-2xl">🎬</span><span className="text-[9px] text-gray-500 px-1 truncate w-full text-center">{att.file_name}</span></div>
                                        : <div className="w-20 h-20 bg-gray-100 flex flex-col items-center justify-center gap-1 p-1"><FileText className="w-6 h-6 text-gray-400" /><span className="text-[9px] text-gray-500 truncate w-full text-center px-1">{att.file_name}</span></div>}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}

                {nextActions.length > 0 && (
                    <div className="flex gap-2">
                        {nextActions.map(a => (
                            <button key={a.action} onClick={() => transition(a.action, a.body)} className="flex-1 py-2 rounded-xl text-white text-[11px] font-black transition-all hover:opacity-90" style={{ background: a.color }}>{a.label}</button>
                        ))}
                    </div>
                )}

                {(ticket.comments?.length ?? 0) > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-2">Replies ({ticket.comments!.length})</p>
                        <div className="space-y-2">
                            {ticket.comments!.map(c => {
                                const isOfficial = c.user?.role === 'admin' || c.user?.role === 'staff' || c.user?.role === 'team_leader';
                                const cu = c.user as TicketUser | undefined;
                                const cp = ticketUserPhoto(cu);
                                return (
                                    <div key={c.id} className="flex gap-2">
                                        {cp ? <img src={cp} className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] flex-shrink-0" style={{ background: GS }}>{ticketInitials(cu)}</div>}
                                        <div className="flex-1 min-w-0">
                                            <div className="px-2.5 py-2 rounded-xl rounded-tl-sm" style={c.is_internal ? { background: '#fef9ec', border: '1px solid #fde68a' } : { background: isOfficial ? `${G0}0d` : '#f3f4f6' }}>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] font-black" style={{ color: isOfficial ? G0 : '#374151' }}>{ticketUserName(cu)}</span>
                                                    {isOfficial && <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ background: `${G0}15`, color: G0 }}>Staff</span>}
                                                    {c.is_internal && <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ background: '#fef3c7', color: '#b45309' }}>Internal</span>}
                                                    <span className="text-[9px] text-gray-400 ml-auto">{c.time_ago ?? ago(c.created_at)}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-700 leading-relaxed">{c.content ?? c.body}</p>
                                                {(c.attachments?.length ?? 0) > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                        {c.attachments!.map(att => {
                                                            const isImg = att.mime_type?.startsWith('image/');
                                                            const isVid = att.mime_type?.startsWith('video/');
                                                            const url   = att.file_url ?? `/storage/${att.file_path}`;
                                                            return (
                                                                <a key={att.id} href={url} target="_blank" rel="noreferrer" className="flex-shrink-0 block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
                                                                    {isImg ? <img src={url} className="w-16 h-16 object-cover" />
                                                                    : isVid ? <div className="w-16 h-16 bg-gray-100 flex flex-col items-center justify-center gap-0.5"><span className="text-lg">🎬</span><span className="text-[8px] text-gray-400 truncate w-14 text-center px-1">{att.file_name}</span></div>
                                                                    : <div className="w-16 h-16 bg-gray-100 flex flex-col items-center justify-center gap-0.5 p-1"><FileText className="w-4 h-4 text-gray-400" /><span className="text-[8px] text-gray-400 truncate w-full text-center">{att.file_name}</span></div>}
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

            {ticket.status !== 'closed' ? (
                <div className="flex-shrink-0 border-t border-gray-100 p-3 space-y-2">
                    {canManage && (
                        <div className="flex gap-1.5">
                            <button onClick={() => setIsInternal(false)} className="flex-1 py-1.5 rounded-lg text-[10px] font-black border-2 transition-all" style={!isInternal ? { background: G0, color: 'white', borderColor: G0 } : { background: 'white', color: '#9ca3af', borderColor: '#e5e7eb' }}>Public Reply</button>
                            <button onClick={() => setIsInternal(true)} className="flex-1 py-1.5 rounded-lg text-[10px] font-black border-2 transition-all" style={isInternal ? { background: '#fef9ec', color: '#b45309', borderColor: '#fde68a' } : { background: 'white', color: '#9ca3af', borderColor: '#e5e7eb' }}>🔒 Internal Note</button>
                        </div>
                    )}
                    <input ref={replyFileRef} type="file" multiple accept="image/*,video/*,application/pdf,.doc,.docx,.xlsx" className="hidden"
                        onChange={e => setReplyFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])} />
                    {replyFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1">
                            {replyFiles.map((f, i) => (
                                <div key={i} className="relative group flex-shrink-0">
                                    {f.type.startsWith('image/') ? <img src={URL.createObjectURL(f)} className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200" />
                                    : f.type.startsWith('video/') ? <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-0.5"><span className="text-lg">🎬</span><span className="text-[8px] text-gray-400 truncate w-12 text-center">{f.name}</span></div>
                                    : <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-0.5 p-1"><FileText className="w-4 h-4 text-gray-400" /><span className="text-[8px] text-gray-400 truncate w-full text-center">{f.name}</span></div>}
                                    <button onClick={() => setReplyFiles(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-2.5 h-2.5" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-1.5 items-end">
                        <button onClick={() => replyFileRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors"
                            style={replyFiles.length > 0 ? { background: `${G0}15`, color: G0 } : { background: '#f3f4f6', color: '#9ca3af' }}>
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <textarea value={comment} onChange={e => setComment(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(isInternal); } }}
                            placeholder={isInternal ? 'Internal note (only visible to staff)…' : 'Type your reply…'} rows={2}
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 resize-none focus:outline-none focus:ring-2 transition-all"
                            style={{ '--tw-ring-color': `${G0}25`, ...(isInternal ? { background: '#fef9ec', borderColor: '#fde68a' } : {}) } as React.CSSProperties} />
                        <button onClick={() => addComment(isInternal)} disabled={submitting || (!comment.trim() && replyFiles.length === 0)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-white disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
                            style={{ background: isInternal ? 'linear-gradient(135deg,#b45309,#d97706)' : GS }}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-shrink-0 px-3 py-3 text-center border-t border-gray-100" style={{ background: '#f7f8fc' }}>
                    <p className="text-[11px] text-gray-500 font-semibold">This ticket is closed.</p>
                </div>
            )}
        </div>
    );
}

export default SupportPanel;