// resources/js/pages/Admin/Reports.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import {
    ScrollText, Wallet, CalendarClock, Star, Users, Stethoscope,
    TrendingUp, AlertTriangle, Clock, BarChart3, PieChart as PieIcon,
    Ban, UserX, Activity,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import AppLayout from '@/layouts/app-layout';
import { reportService } from '../../services';
import type { ReportsData } from '../../services';
import { PageHeader, StatCard, C } from './_shared/AdminUI';
import { formatPeso } from '../Shared/helpers';

const PERIOD_OPTIONS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
] as const;

const PIE_COLORS = ['#3B82F6', '#22C55E', '#EAB308', '#EF4444', '#6B7280', '#6366F1', '#F97316'];

function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function EmptyCard({ message }: { message: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-400 text-center py-8">{message}</p>
        </div>
    );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-black text-gray-800">{title}</p>
        </div>
    );
}

function CardShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>{children}</div>;
}

export default function AdminReports() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportsData | null>(null);

    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const [from, setFrom] = useState(monthStart);
    const [to, setTo] = useState(today);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await reportService.getReports({ from, to, period });
        if (res.success && res.data) setData(res.data);
        setLoading(false);
    }, [from, to, period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const o = data?.overview;
    const c = data?.clientPetAnalytics;
    const op = data?.operational;
    const s = data?.serviceType;
    const r = data?.revenue;

    return (
        <AppLayout>
            <Head title="Reports" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={ScrollText} title="Reports" subtitle="Clinic analytics & insights" onRefresh={fetchData} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                    {/* ── Date Range Filter ──────────────────────────────────── */}
                    <CardShell>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-bold text-gray-500">Date Range:</span>
                            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-200" />
                            <span className="text-xs text-gray-400">to</span>
                            <input type="date" value={to} onChange={e => setTo(e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-200" />
                            <div className="flex items-center gap-1 ml-2">
                                {PERIOD_OPTIONS.map(p => (
                                    <button key={p.value} onClick={() => setPeriod(p.value)}
                                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                                            period === p.value ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                                        }`}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardShell>

                    {/* ════════════════════════════════════════════════════════ */}
                    {/* 1. APPOINTMENTS OVERVIEW                                */}
                    {/* ════════════════════════════════════════════════════════ */}
                    <SectionHeader icon={CalendarClock} title="Appointments Overview" />

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                        </div>
                    ) : o ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard icon={CalendarClock} label="Total Appointments" value={o.total_appointments} color={C.rose} />
                            <StatCard icon={Ban} label="No-show Rate" value={`${o.no_show_rate}%`} color="#6B7280" />
                            <StatCard icon={AlertTriangle} label="Cancellation Rate" value={`${o.cancellation_rate}%`} color="#EF4444" />
                            <StatCard icon={TrendingUp} label="Avg / Day" value={o.avg_appointments_per_day} color={C.blue} />
                        </div>
                    ) : <EmptyCard message="No appointment data available." />}

                    {/* Appointments by Status + Trend */}
                    {!loading && o && (
                        <div className="grid sm:grid-cols-2 gap-4">
                            <CardShell>
                                <SectionHeader icon={BarChart3} title="Appointments by Status" />
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={o.appointments_by_status} layout="vertical" margin={{ left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 11 }} />
                                        <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={90} />
                                        <Tooltip />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                            {o.appointments_by_status.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardShell>

                            <CardShell>
                                <SectionHeader icon={TrendingUp} title="Appointments Trend" />
                                {o.appointments_trend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={o.appointments_trend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill={C.rose} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-xs text-gray-400 text-center py-8">No trend data for this period.</p>}
                            </CardShell>
                        </div>
                    )}

                    {/* Peak Hours + Peak Days */}
                    {!loading && o && (
                        <div className="grid sm:grid-cols-2 gap-4">
                            <CardShell>
                                <SectionHeader icon={Clock} title="Peak Hours" />
                                {o.peak_hours.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={o.peak_hours}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-xs text-gray-400 text-center py-8">No data.</p>}
                            </CardShell>

                            <CardShell>
                                <SectionHeader icon={BarChart3} title="Peak Days of Week" />
                                {o.peak_days.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={o.peak_days}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill={C.blue} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-xs text-gray-400 text-center py-8">No data.</p>}
                            </CardShell>
                        </div>
                    )}

                    {/* Cancellation Reasons */}
                    {!loading && o && o.cancellation_reasons.length > 0 && (
                        <CardShell>
                            <SectionHeader icon={AlertTriangle} title="Top Cancellation Reasons" />
                            <div className="space-y-2">
                                {o.cancellation_reasons.map((cr, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-gray-500 flex-1 truncate">{cr.cancellation_reason}</span>
                                        <span className="text-xs font-bold text-gray-700">{cr.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardShell>
                    )}

                    {/* ════════════════════════════════════════════════════════ */}
                    {/* 2. CLIENT & PET ANALYTICS                               */}
                    {/* ════════════════════════════════════════════════════════ */}
                    <SectionHeader icon={Users} title="Client & Pet Analytics" />

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                        </div>
                    ) : c ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <StatCard icon={Users} label="Pet Owners" value={c.total_pet_owners} color={C.blue} />
                            <StatCard icon={PieIcon} label="Total Pets" value={c.total_pets} color="#22C55E" />
                            <StatCard icon={Stethoscope} label="Staff" value={c.total_staff} color={C.rose} />
                        </div>
                    ) : <EmptyCard message="No client data available." />}

                    {/* New Clients + Pet Species */}
                    {!loading && c && (
                        <div className="grid sm:grid-cols-2 gap-4">
                            <CardShell>
                                <SectionHeader icon={TrendingUp} title="New Clients per Month" />
                                {c.new_clients_per_month.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={c.new_clients_per_month}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke={C.blue} strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-xs text-gray-400 text-center py-8">No registration data for this period.</p>}
                            </CardShell>

                            <CardShell>
                                <SectionHeader icon={PieIcon} title="Pet Types (Species)" />
                                {c.pet_species.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={c.pet_species} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                {c.pet_species.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-xs text-gray-400 text-center py-8">No pet data.</p>}
                            </CardShell>
                        </div>
                    )}

                    {/* Pet Breeds */}
                    {!loading && c && c.pet_breeds.length > 0 && (
                        <CardShell>
                            <SectionHeader icon={BarChart3} title="Most Common Breeds" />
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={c.pet_breeds}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#F97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardShell>
                    )}

                    {/* ════════════════════════════════════════════════════════ */}
                    {/* 3. OPERATIONAL METRICS                                  */}
                    {/* ════════════════════════════════════════════════════════ */}
                    <SectionHeader icon={Activity} title="Operational Metrics" />

                    {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                        </div>
                    ) : op ? (
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard icon={Clock} label="Avg Booking Lead Time" value={`${op.avg_booking_lead_time_hours}h`} color="#6366F1" />
                            <StatCard icon={BarChart3} label="Slot Utilization" value={`${op.slot_utilization_rate}%`} color={C.green} />
                        </div>
                    ) : <EmptyCard message="No operational data available." />}

                    {/* ════════════════════════════════════════════════════════ */}
                    {/* 4. SERVICE TYPE ANALYTICS                               */}
                    {/* ════════════════════════════════════════════════════════ */}
                    <SectionHeader icon={BarChart3} title="Service Type Analytics" />

                    {!loading && s && s.services.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                            <CardShell>
                                <SectionHeader icon={BarChart3} title="Most Requested Services" />
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={s.services}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={C.rose} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardShell>

                            {s.revenue_by_service.length > 0 && (
                                <CardShell>
                                    <SectionHeader icon={Wallet} title="Revenue by Service" />
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={s.revenue_by_service}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip formatter={(v: number) => formatPeso(v)} />
                                            <Bar dataKey="revenue" fill={C.green} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardShell>
                            )}
                        </div>
                    ) : !loading ? <EmptyCard message="No service type data for this period." /> : null}

                    {/* ════════════════════════════════════════════════════════ */}
                    {/* 5. REVENUE / FINANCIAL                                  */}
                    {/* ════════════════════════════════════════════════════════ */}
                    <SectionHeader icon={Wallet} title="Revenue & Financials" />

                    {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                        </div>
                    ) : r ? (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard icon={Wallet} label="Total Revenue" value={formatPeso(r.total)} color={C.green} />
                                <StatCard icon={BarChart3} label="Transactions" value={r.over_time.reduce((a, b) => a + b.count, 0)} color={C.blue} />
                            </div>

                            {r.over_time.length > 0 && (
                                <CardShell>
                                    <SectionHeader icon={TrendingUp} title="Revenue Over Time" />
                                    <ResponsiveContainer width="100%" height={220}>
                                        <LineChart data={r.over_time}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip formatter={(v: number) => formatPeso(v)} />
                                            <Line type="monotone" dataKey="revenue" stroke={C.green} strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardShell>
                            )}

                            {r.by_payment_method.length > 0 && (
                                <CardShell>
                                    <SectionHeader icon={PieIcon} title="Revenue by Payment Method" />
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={r.by_payment_method.map(m => ({ name: m.payment_method.replace('_', ' '), value: m.total }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                {r.by_payment_method.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(v: number) => formatPeso(v)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardShell>
                            )}
                        </>
                    ) : <EmptyCard message="No revenue data available." />}

                    {/* ════════════════════════════════════════════════════════ */}
                    {/* 6. EXISTING CARDS (Staff & Feedback) — kept as-is      */}
                    {/* ════════════════════════════════════════════════════════ */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-2"><Stethoscope className="w-4 h-4 text-gray-400" /><p className="text-sm font-black text-gray-800">Staff</p></div>
                            <p className="text-2xl font-black text-gray-800">{loading ? '—' : c?.total_staff ?? 0}</p>
                            <p className="text-xs text-gray-400">Active veterinarians</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-gray-400" /><p className="text-sm font-black text-gray-800">Feedback</p></div>
                            <p className="text-2xl font-black text-gray-800">{loading ? '—' : o?.feedback_count ?? 0}</p>
                            <p className="text-xs text-gray-400">Total submissions · Avg rating: {o?.avg_rating ?? '—'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
