// resources/js/pages/Owner/Chat/Index.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { chatService } from '@/services';
import { PageHeader, C } from '@/pages/Owner/_shared/OwnerUI';

// Pet Owners only ever have one conversation with the clinic (see
// ChatConversationController::store, which reuses an existing open thread).
// This page just starts/finds it and redirects straight to Chat/Show so
// there's no redundant "list of 1" screen.

export default function OwnerChatIndex() {
    useEffect(() => {
        (async () => {
            const res = await chatService.startConversation();
            if (res.success && res.data) {
                router.visit(`/owner/chat/${res.data.id}`, { replace: true });
            }
        })();
    }, []);

    return (
        <AppLayout>
            <Head title="Live Chat" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={MessageSquare} title="Live Chat" />
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: C.sky, borderTopColor: 'transparent' }} />
                    <p className="text-sm text-gray-400 mt-3">Opening your conversation…</p>
                </div>
            </div>
        </AppLayout>
    );
}
