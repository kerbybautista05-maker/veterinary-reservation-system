// components/comms/CommsUI.tsx
// ─── Shared primitive UI components used across all comms panels ──────────────

import { useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { AnyUser, G0, GS, initials, userPhoto } from './comms.types';

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ user, size = 8 }: { user?: AnyUser; size?: number }) {
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

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <span
            className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
            style={{ color, background: bg }}
        >
            {label}
        </span>
    );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ label }: { label?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: G0 }} />
            {label && <p className="text-xs text-gray-400">{label}</p>}
        </div>
    );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

export function Empty({
    Icon = MessageSquare,
    title,
    sub,
}: {
    Icon?: React.ElementType;
    title: string;
    sub?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
            <Icon className="w-8 h-8 text-gray-200" />
            <p className="text-sm font-semibold text-gray-500">{title}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
    );
}

// ─── Facebook-style seen avatars ──────────────────────────────────────────────

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

export function SeenAvatars({ reads, myId }: { reads?: MsgRead[]; myId: number }) {
    if (!reads || reads.length === 0) return null;
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
            {extra > 0 && <span className="text-[9px] text-gray-400 ml-0.5">+{extra}</span>}
        </div>
    );
}