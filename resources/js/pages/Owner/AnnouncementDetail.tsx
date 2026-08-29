// resources/js/pages/Owner/AnnouncementDetail.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { announcementService } from '@/services';
import type { Announcement } from '@/services';
import { PageHeader, BackLink, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPHDate } from '@/pages/Shared/helpers';

export default function OwnerAnnouncementDetail({ announcementId }: { announcementId: number | string }) {
    const [item, setItem] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await announcementService.getAnnouncement(Number(announcementId));
            if (res.success) setItem(res.data ?? null);
            setLoading(false);
        })();
    }, [announcementId]);

    if (loading) return <AppLayout><Head title="Announcement" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!item) return <AppLayout><Head title="Announcement" /><div className="p-10 text-center text-sm text-gray-400">Announcement not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={item.title} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Megaphone} title="Announcement" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/owner/announcements" label="Back to Announcements" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {item.image_url && <img src={item.image_url} className="w-full h-56 object-cover" />}
                        <div className="p-6">
                            <h1 className="text-xl font-black text-gray-800">{item.title}</h1>
                            <p className="text-xs text-gray-400 mt-1">By {item.author?.full_name ?? item.author?.name} · {formatPHDate(item.published_at ?? item.created_at)}</p>
                            <div className="prose prose-sm max-w-none mt-5 text-gray-700" dangerouslySetInnerHTML={{ __html: item.body }} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
