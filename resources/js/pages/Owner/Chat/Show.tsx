// resources/js/pages/Owner/Chat/Show.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageSquare, Send, Paperclip } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { chatService } from '@/services';
import type { ChatConversation, ChatMessage } from '@/services';
import { PageHeader, StatusPill, toastError, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPHTime } from '@/pages/Shared/helpers';

export default function OwnerChatShow({ conversationId }: { conversationId: number | string }) {
    const [conversation, setConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        const res = await chatService.getConversation(Number(conversationId));
        if (res.success && res.data) {
            setConversation(res.data);
            const msgs = await chatService.getMessages(Number(conversationId), { per_page: 100 });
            if (msgs.success) setMessages(msgs.data ?? []);
        }
        setLoading(false);
    }, [conversationId]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

    const send = async (attachment?: File) => {
        if (!text.trim() && !attachment) return;
        setSending(true);
        const res = await chatService.sendMessage(Number(conversationId), { message: text.trim() || undefined, attachment });
        setSending(false);
        if (res.success && res.data) {
            setMessages(m => [...m, res.data!]);
            setText('');
        } else {
            toastError(res.message ?? 'Failed to send message.');
        }
    };

    if (loading) return <AppLayout><Head title="Chat" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!conversation) return <AppLayout><Head title="Chat" /><div className="p-10 text-center text-sm text-gray-400">Conversation not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title="Chat with the Clinic" />
            <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
                <PageHeader icon={MessageSquare} title="Chat with the Clinic" />

                <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden" style={{ minHeight: 480 }}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-800">NE Veterinary Clinic Support</p>
                            <StatusPill label={conversation.status} color={conversation.status === 'open' ? 'green' : conversation.status === 'closed' ? 'gray' : 'amber'} />
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {messages.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-10">Send a message and the clinic team will get back to you.</p>
                            ) : messages.map(m => {
                                const isMine = m.sender_id === conversation.owner_id;
                                return (
                                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${!isMine ? 'bg-gray-100 text-gray-800' : 'text-white'}`}
                                            style={isMine ? { background: C.sky } : undefined}>
                                            {m.message && <p className="text-sm">{m.message}</p>}
                                            {m.attachment_url && (
                                                <a href={m.attachment_url} target="_blank" rel="noreferrer" className={`text-xs underline block mt-1 ${!isMine ? 'text-gray-600' : 'text-white/90'}`}>
                                                    {m.attachment_name ?? 'Attachment'}
                                                </a>
                                            )}
                                            <p className={`text-[10px] mt-1 ${!isMine ? 'text-gray-400' : 'text-white/70'}`}>{formatPHTime(m.created_at)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                            <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><Paperclip className="w-4 h-4" /></button>
                            <input ref={fileRef} type="file" hidden onChange={e => e.target.files?.[0] && send(e.target.files[0])} />
                            <input
                                value={text} onChange={e => setText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                placeholder="Type a message…" disabled={conversation.status === 'closed'}
                                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-gray-50"
                            />
                            <button onClick={() => send()} disabled={sending || conversation.status === 'closed'}
                                className="p-2.5 rounded-xl text-white disabled:opacity-50" style={{ background: C.sky }}>
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
