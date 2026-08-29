// resources/js/pages/Owner/_shared/OwnerUI.tsx
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import type { PaginationData, UserSummary } from '@/services';
import { getDisplayName, getInitials } from '@/pages/Shared/helpers';

export const C = {
    sky: '#2E86C1', light: '#4FA8DA', navy: '#0B2545', bg: '#F5F9FC',
    ink: '#1F2937', slate: '#64748B',
    green: '#059669', red: '#DC2626', amber: '#D97706',
};

// ─── Page Header ────────────────────────────────────────────────────────────

export function PageHeader({
    icon: Icon, title, subtitle, action, onRefresh,
}: {
    icon: React.ElementType; title: string; subtitle?: string;
    action?: React.ReactNode; onRefresh?: () => void;
}) {
    return (
        <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.sky} 0%, ${C.light} 100%)` }}>
            <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-white/15 shrink-0">
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">NE Veterinary Clinic</p>
                            <h1 className="text-xl font-black text-white leading-tight truncate">{title}</h1>
                            {subtitle && <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {onRefresh && (
                            <button onClick={onRefresh} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold transition-all border border-white/10">
                                <RefreshCw className="w-3.5 h-3.5" /> Refresh
                            </button>
                        )}
                        {action}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

export function StatCard({ icon: Icon, label, value, color = C.sky }: {
    icon: React.ElementType; label: string; value: React.ReactNode; color?: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide truncate">{label}</p>
                <p className="text-xl font-black text-gray-800 leading-tight">{value}</p>
            </div>
        </div>
    );
}

// ─── Status Pill ────────────────────────────────────────────────────────────

export function StatusPill({ label, color }: { label: string; color?: string }) {
    const c = color ?? '#64748B';
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${colorToHex(c)}18`, color: colorToHex(c) }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: colorToHex(c) }} />
            {label}
        </span>
    );
}

function colorToHex(name: string): string {
    if (name.startsWith('#')) return name;
    const map: Record<string, string> = {
        gray: '#6B7280', grey: '#6B7280', green: '#059669', red: '#DC2626',
        blue: '#2563EB', yellow: '#D97706', amber: '#D97706', orange: '#EA580C',
        indigo: '#4F46E5', purple: '#7C3AED',
    };
    return map[name] ?? '#6B7280';
}

// ─── Empty State ────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, message, action }: {
    icon: React.ElementType; title: string; message?: string; action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 mb-3">
                <Icon className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-600">{title}</p>
            {message && <p className="text-xs text-gray-400 mt-1 max-w-sm">{message}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

export function Avatar({ user, size = 'md' }: { user?: UserSummary | null; size?: 'sm' | 'md' | 'lg' }) {
    const sizeMap = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-12 h-12 text-sm' };
    const cls = `${sizeMap[size]} rounded-xl flex items-center justify-center font-bold shrink-0`;
    if (user?.profile_photo_url) {
        return <img src={user.profile_photo_url} alt={getInitials(user)} className={`${cls} object-cover border border-gray-100`} />;
    }
    return (
        <div className={`${cls} text-white`} style={{ background: `linear-gradient(135deg, ${C.sky} 0%, ${C.light} 100%)` }}>
            {getInitials(user)}
        </div>
    );
}

// ─── Pet Avatar (photo or paw icon) ──────────────────────────────────────────

export function PetAvatar({ photoUrl, size = 'md' }: { photoUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
    const sizeMap = { sm: 'w-9 h-9', md: 'w-12 h-12', lg: 'w-16 h-16' };
    const cls = `${sizeMap[size]} rounded-xl object-cover shrink-0 border border-gray-100`;
    if (photoUrl) return <img src={photoUrl} className={cls} />;
    return (
        <div className={`${sizeMap[size]} rounded-xl flex items-center justify-center shrink-0`} style={{ background: `${C.sky}15` }}>
            <span style={{ color: C.sky }}>🐾</span>
        </div>
    );
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export function Pagination({ pagination, onPageChange }: {
    pagination?: PaginationData; onPageChange: (page: number) => void;
}) {
    if (!pagination || pagination.last_page <= 1) return null;
    const { current_page, last_page, total } = pagination;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
                Page <span className="font-bold text-gray-600">{current_page}</span> of{' '}
                <span className="font-bold text-gray-600">{last_page}</span> · {total} total
            </p>
            <div className="flex items-center gap-1.5">
                <button onClick={() => onPageChange(current_page - 1)} disabled={current_page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => onPageChange(current_page + 1)} disabled={current_page >= last_page}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Confirm dialog (SweetAlert2 wrapper) ────────────────────────────────────

export async function confirmAction(opts: {
    title: string; text?: string; confirmText?: string; danger?: boolean;
}): Promise<boolean> {
    const res = await Swal.fire({
        title: opts.title,
        text: opts.text,
        icon: opts.danger ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonText: opts.confirmText ?? 'Confirm',
        confirmButtonColor: opts.danger ? C.red : C.sky,
        cancelButtonColor: '#9CA3AF',
    });
    return res.isConfirmed;
}

export function toastSuccess(message: string) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: message, showConfirmButton: false, timer: 2200, timerProgressBar: true });
}

export function toastError(message: string) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: message, showConfirmButton: false, timer: 2800, timerProgressBar: true });
}

// ─── Breadcrumb back link ────────────────────────────────────────────────────

export function BackLink({ href, label = 'Back' }: { href: string; label?: string }) {
    return (
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-3">
            <ChevronLeft className="w-3.5 h-3.5" /> {label}
        </Link>
    );
}

// ─── Star Rating (interactive) ───────────────────────────────────────────────

export function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => onChange(n)} className="text-2xl leading-none transition-transform hover:scale-110">
                    <span style={{ color: n <= value ? '#F59E0B' : '#E5E7EB' }}>★</span>
                </button>
            ))}
        </div>
    );
}
