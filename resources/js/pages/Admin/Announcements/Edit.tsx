// resources/js/pages/Admin/Announcements/Edit.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Megaphone, Save, ImagePlus, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { announcementService } from '../../../services';
import type { Announcement } from '../../../services';
import { PageHeader, BackLink, toastSuccess, toastError, C } from '../_shared/AdminUI';
import { RichEditor } from '../../Shared/RichEditor';

export default function AnnouncementEdit({ announcementId }: { announcementId: number | string }) {
    const [item, setItem] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        (async () => {
            const res = await announcementService.getAnnouncement(Number(announcementId));
            if (res.success && res.data) {
                setItem(res.data);
                setTitle(res.data.title);
                setBody(res.data.body);
                setStartDate(res.data.start_date ?? '');
                setEndDate(res.data.end_date ?? '');
                setPreview(res.data.image_url ?? null);
            }
            setLoading(false);
        })();
    }, [announcementId]);

    const onPickImage = (file?: File) => {
        if (!file) return;
        setImage(file);
        setRemoveImage(false);
        setPreview(URL.createObjectURL(file));
    };

    const onRemoveImage = () => {
        setImage(null);
        setPreview(null);
        setRemoveImage(true);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        if (!startDate || !endDate) {
            setErrors({ start_date: ['Start date and end date are required.'] });
            setSaving(false);
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            setErrors({ end_date: ['End date must not be earlier than start date.'] });
            setSaving(false);
            return;
        }

        const res = await announcementService.updateAnnouncement(Number(announcementId), {
            title, body,
            image: image ?? undefined, remove_image: removeImage,
            start_date: startDate,
            end_date: endDate,
        });
        setSaving(false);
        if (res.success) {
            toastSuccess('Announcement updated.');
            router.visit('/admin/announcements');
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to update announcement.');
        }
    };

    if (loading) return <AppLayout><Head title="Edit Announcement" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!item) return <AppLayout><Head title="Edit Announcement" /><div className="p-10 text-center text-sm text-gray-400">Announcement not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={`Edit — ${item.title}`} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Megaphone} title="Edit Announcement" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/admin/announcements" label="Back to Announcements" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)}
                                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.title ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-rose-200 focus:border-rose-300'}`} />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Image</label>
                            {preview ? (
                                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                                    <img src={preview} className="w-full h-full object-cover" />
                                    <button type="button" onClick={onRemoveImage}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-rose-300 hover:text-rose-500 transition-colors">
                                    <ImagePlus className="w-5 h-5" /><span className="text-xs font-semibold">Click to upload</span>
                                </button>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onPickImage(e.target.files?.[0])} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Body</label>
                            <RichEditor value={body} onChange={setBody} error={errors.body?.[0]} />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Start Date <span className="text-red-400">*</span></label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.start_date ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-rose-200 focus:border-rose-300'}`} />
                                {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date[0]}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">End Date <span className="text-red-400">*</span></label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.end_date ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-rose-200 focus:border-rose-300'}`} />
                                {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date[0]}</p>}
                            </div>
                        </div>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.rose }}>
                            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
