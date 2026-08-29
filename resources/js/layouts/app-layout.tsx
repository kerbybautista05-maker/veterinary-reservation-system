// resources/js/layouts/app-layout.tsx
import React, { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { AppHeader } from '@/components/app-header';
import { usePage } from '@inertiajs/react';
import { MessageSquare, X, Send, Paperclip } from 'lucide-react';
import { chatService } from '@/services';
import type { ChatConversation, ChatMessage } from '@/services';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthUser {
    id: number;
    role: 'pet_owner' | 'veterinarian' | 'admin';
    name?: string;
    full_name?: string;
    profile_photo_url?: string;
}

interface PageProps {
    auth?: { user?: AuthUser };
    [key: string]: unknown;
}

interface AppLayoutProps {
    children: ReactNode;
}

const ROSE = '#e11d48';

// ─── Main Layout ──────────────────────────────────────────────────────────────
//
// This is a deliberately smaller layout than the one it replaces. Dropped
// entirely because none of them map to a NE Veterinary Clinic objective:
//   - Birthday celebration system (celebrant cards, greet-and-DM flow, popups)
//   - Support Ticket panel / Ideas (Suggestion Box) panel
//   - Online-presence heartbeat (/api/ping, last_seen_at) and the logout
//     interception hack that stamped it — the vet-clinic User model has no
//     presence/last_seen_at concept
// What's kept: a single floating live-chat widget, but scoped to Pet Owners
// only (the "Live Chat with Administrator" objective). Admins already have
// full conversation management via Admin/Chat/Index + Show, and get an
// unread badge for it in AppHeader's nav, so they don't need a duplicate
// floating widget here. Veterinarians aren't part of the chat feature at all
// per the schema (chat_conversations only has owner_id/admin_id).

export default function AppLayout({ children }: AppLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;
    const isPetOwner = user?.role === 'pet_owner';

    const [open, setOpen] = useState(false);
    const [conversation, setConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Lock background scroll while the panel takes over the screen on mobile.
    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        const prevOverscroll = document.body.style.overscrollBehavior;
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.overscrollBehavior = prevOverscroll;
        };
    }, [open]);

    // ── Unread badge (polled while the panel is closed) ───────────────────────
    const fetchUnread = useCallback(async () => {
        if (!isPetOwner) return;
        try {
            const res = await chatService.getConversations({ per_page: 5 });
            if (res.success) {
                const total = (res.data ?? []).reduce((sum, c) => sum + (c.unread_count ?? 0), 0);
                setUnread(total);
            }
        } catch { /* silent */ }
    }, [isPetOwner]);

    useEffect(() => {
        if (!isPetOwner) return;
        fetchUnread();
        pollRef.current = setInterval(fetchUnread, 15_000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [fetchUnread, isPetOwner]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

    // ── Open panel: fetch/create the owner's single conversation ──────────────
    const togglePanel = async () => {
        const opening = !open;
        setOpen(opening);
        if (!opening) return;

        setUnread(0);
        setLoading(true);
        const res = await chatService.startConversation();
        if (res.success && res.data) {
            setConversation(res.data);
            const msgs = await chatService.getMessages(res.data.id, { per_page: 50 });
            if (msgs.success) setMessages(msgs.data ?? []);
        }
        setLoading(false);
    };

    const send = async (attachment?: File) => {
        if ((!text.trim() && !attachment) || !conversation) return;
        setSending(true);
        const res = await chatService.sendMessage(conversation.id, { message: text.trim() || undefined, attachment });
        setSending(false);
        if (res.success && res.data) {
            setMessages(m => [...m, res.data!]);
            setText('');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <AppHeader />

            {/* ── Floating Live Chat Button (Pet Owner only) ── */}
            {isPetOwner && (
                <button
                    onClick={togglePanel}
                    className="fixed z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 touch-manipulation"
                    style={{
                        background: ROSE,
                        bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
                        right: 'calc(1.25rem + env(safe-area-inset-right))',
                    }}
                    aria-label="Toggle live chat"
                >
                    {open ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
                    {!open && unread > 0 && (
                        <span
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-white"
                            style={{ background: '#dc2626' }}
                        >
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </button>
            )}

            {/* ── Chat Panel ── */}
            {open && isPetOwner && (
                <div
                    className="fixed z-50 flex flex-col overflow-hidden bg-white
                               inset-0 h-[100dvh] rounded-none border-0
                               sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[560px] sm:max-h-[calc(100dvh-6rem)]
                               sm:w-[360px] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-gray-100"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <div
                        className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100"
                        style={{ background: ROSE, paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
                    >
                        <p className="text-sm font-black text-white tracking-wide">Chat with the Clinic</p>
                        <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors touch-manipulation p-1 -m-1">
                            <X className="w-5 h-5 sm:w-4 sm:h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0" style={{ overscrollBehavior: 'contain' }}>
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ROSE, borderTopColor: 'transparent' }} />
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-10">Send a message and the clinic team will get back to you.</p>
                        ) : messages.map(m => {
                            const isMine = m.sender_id === user?.id;
                            return (
                                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${isMine ? 'text-white' : 'bg-gray-100 text-gray-800'}`}
                                        style={isMine ? { background: ROSE } : undefined}>
                                        {m.message}
                                        {m.attachment_url && (
                                            <a href={m.attachment_url} target="_blank" rel="noreferrer"
                                                className={`block text-xs underline mt-1 ${isMine ? 'text-white/90' : 'text-gray-600'}`}>
                                                {m.attachment_name ?? 'Attachment'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-3 border-t border-gray-100">
                        <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <input ref={fileRef} type="file" hidden onChange={e => e.target.files?.[0] && send(e.target.files[0])} />
                        <input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                            placeholder="Type a message…"
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                        <button onClick={() => send()} disabled={sending} className="p-2.5 rounded-xl text-white disabled:opacity-50" style={{ background: ROSE }}>
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}