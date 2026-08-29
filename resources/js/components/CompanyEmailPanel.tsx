// resources/js/pages/Staff/Recruitment/components/CompanyEmailPanel.tsx
//
// Drop-in admin panel for the "System Generated Company Email"
// section of the applicant Show page.
//
// Administrator Actions:
// • Generate Company Email
// • Copy Email
// • Mark as Active
// • Regenerate
//
// This feature is for onboarding/internal reference only.
// The applicant's personal email remains the primary
// communication email throughout the recruitment process.

import { useState } from 'react';
import {
    Mail,
    Copy,
    Check,
    RefreshCw,
    Sparkles,
    Clock,
    ShieldCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';

const C = {
    navy: '#3A3ABF',
    blue: '#5559DF',
};

function getCsrf(): string {
    return (
        (
            document.querySelector(
                'meta[name="csrf-token"]'
            ) as HTMLMetaElement
        )?.content ?? ''
    );
}

async function apiPost(url: string) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrf(),
        },
        credentials: 'same-origin',
    });

    return res.json();
}

interface CompanyEmailSub {
    id: number;
    applicant_name?: string | null;
    company_email?: string | null;
    company_email_status?: 'pending_creation' | 'active' | null;
    company_email_generated_at?: string | null;
    companyEmailCreator?: {
        first_name?: string;
        last_name?: string;
        real_name?: string;
    } | null;
}

function fmtDate(d?: string | null) {
    if (!d) return '—';

    return new Date(d).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function CompanyEmailPanel({
    sub,
    onRefresh,
}: {
    sub: CompanyEmailSub;
    onRefresh: () => void | Promise<void>;
}) {
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);

    const status = sub.company_email_status;
    const isActive = status === 'active';

    const creator = sub.companyEmailCreator
        ? sub.companyEmailCreator.real_name ||
          `${sub.companyEmailCreator.first_name ?? ''} ${
              sub.companyEmailCreator.last_name ?? ''
          }`.trim()
        : null;

    const run = async (
        url: string,
        confirmMsg?: string
    ) => {
        if (confirmMsg) {
            const r = await Swal.fire({
                title: confirmMsg,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: C.blue,
                confirmButtonText: 'Yes, continue',
            });

            if (!r.isConfirmed) return;
        }

        setBusy(true);

        try {
            const res = await apiPost(url);

            if (res.success) {
                await onRefresh();
            } else {
                Swal.fire(
                    'Error',
                    res.message ?? 'Action failed.',
                    'error'
                );
            }
        } catch {
            Swal.fire(
                'Error',
                'Network error. Please try again.',
                'error'
            );
        }

        setBusy(false);
    };

    const copyEmail = async () => {
        if (!sub.company_email) return;

        try {
            await navigator.clipboard.writeText(
                sub.company_email
            );

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch {
            Swal.fire(
                'Copy failed',
                'Please copy the email manually.',
                'error'
            );
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* HEADER */}
            <div
                className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3"
                style={{ background: '#FAFBFF' }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: C.blue }}
                >
                    <Mail className="w-4 h-4 text-white" />
                </div>

                <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Recruitment → Onboarding
                    </p>

                    <p className="text-sm font-black text-gray-900">
                        System Generated Company Email
                    </p>
                </div>

                {sub.company_email && (
                    <span
                        className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black"
                        style={
                            isActive
                                ? {
                                      background: '#E6FAF1',
                                      color: '#00C875',
                                  }
                                : {
                                      background: '#FFF3E3',
                                      color: '#FDAB3D',
                                  }
                        }
                    >
                        {isActive ? (
                            <ShieldCheck className="w-3 h-3" />
                        ) : (
                            <Clock className="w-3 h-3" />
                        )}

                        {isActive
                            ? 'Active'
                            : 'Pending Activation'}
                    </span>
                )}
            </div>

            {/* BODY */}
            <div className="p-4 space-y-3">
                {!sub.company_email ? (
                    <div className="text-center py-6">
                        <Mail className="w-8 h-8 text-gray-200 mx-auto mb-2" />

                        <p className="text-xs text-gray-400 font-semibold mb-3">
                            No company email has been generated yet.
                            A system-generated company email can be
                            generated once the applicant reaches{' '}
                            <strong>
                                Interview Scheduled
                            </strong>
                            , or you may generate one manually.
                        </p>

                        <button
                            onClick={() =>
                                run(
                                    `/api/applicant-submissions/${sub.id}/company-email/generate`
                                )
                            }
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
                            style={{
                                background: C.blue,
                            }}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate Company Email
                        </button>
                    </div>
                ) : (
                    <>
                        {/* EMAIL */}
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="flex-1 text-sm font-black font-mono text-gray-800 break-all">
                                {sub.company_email}
                            </p>

                            <button
                                onClick={copyEmail}
                                title="Copy email"
                                className="shrink-0 p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        {/* META */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60">
                                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">
                                    Created By
                                </p>

                                <p className="text-xs font-bold text-gray-700">
                                    {creator ??
                                        'System Generated'}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60">
                                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">
                                    Date Generated
                                </p>

                                <p className="text-xs font-bold text-gray-700">
                                    {fmtDate(
                                        sub.company_email_generated_at
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {!isActive && (
                                <button
                                    onClick={() =>
                                        run(
                                            `/api/applicant-submissions/${sub.id}/company-email/activate`,
                                            `Mark ${sub.company_email} as Active? This will update the generated company email status to Active.`
                                        )
                                    }
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-colors disabled:opacity-50"
                                    style={{
                                        background:
                                            '#00C875',
                                    }}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Mark as Active
                                </button>
                            )}

                            <button
                                onClick={() =>
                                    run(
                                        `/api/applicant-submissions/${sub.id}/company-email/regenerate`,
                                        `Regenerate a new company email for ${
                                            sub.applicant_name ??
                                            'this applicant'
                                        }? The current address (${sub.company_email}) will be replaced and reset to Pending Activation.`
                                    )
                                }
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={`w-3.5 h-3.5 ${
                                        busy
                                            ? 'animate-spin'
                                            : ''
                                    }`}
                                />

                                Regenerate
                            </button>
                        </div>

                        {/* FOOTER */}
                        <p className="text-[10px] text-gray-400 leading-relaxed pt-1">
                            This is a
                            system-generated company
                            email intended for onboarding
                            and internal reference
                            purposes. The applicant's
                            personal email remains the
                            primary email address used
                            for all recruitment
                            notifications, application
                            updates, and communication
                            throughout the hiring
                            process.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}