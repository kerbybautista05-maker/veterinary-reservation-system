import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useRef, FormEventHandler } from 'react';
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, Shield, CalendarCheck, Heart, CheckCircle, LoaderCircle, RefreshCw } from 'lucide-react';

const C = { navy: '#0B2545', blue: '#1D6FA5', sky: '#4FA8DA', teal: '#14B8A6' };

type Step = 'email' | 'verify' | 'reset' | 'success';

export default function ForgotPassword() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    // ── Step 1: Send Code ───────────────────────────────────────────────────
    const handleSendCode: FormEventHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/forgot-password/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setStep('verify');
                setCooldown(60);
            } else {
                setError(data.message || 'No account found with that email address.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    // ── Step 2: Verify Code ─────────────────────────────────────────────────
    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        setError('');
        if (value && index < 5) {
            codeRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            codeRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = pasted.split('').concat(Array(6 - pasted.length).fill(''));
        setCode(newCode);
        if (pasted.length > 0) {
            codeRefs.current[Math.min(pasted.length, 5)]?.focus();
        }
    };

    const handleVerifyCode: FormEventHandler = async (e) => {
        e.preventDefault();
        const codeStr = code.join('');
        if (codeStr.length !== 6) {
            setError('Please enter the complete 6-digit code.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/forgot-password/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, code: codeStr }),
            });
            const data = await res.json();
            if (data.success) {
                setToken(data.token);
                setStep('reset');
            } else {
                setError(data.message || 'Invalid or expired verification code.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    const handleResendCode = async () => {
        if (cooldown > 0) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/forgot-password/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setCooldown(60);
                setCode(['', '', '', '', '', '']);
            } else {
                setError(data.message || 'Failed to resend code.');
            }
        } catch {
            setError('Something went wrong.');
        }
        setLoading(false);
    };

    // ── Step 3: Reset Password ──────────────────────────────────────────────
    const handleResetPassword: FormEventHandler = async (e) => {
        e.preventDefault();
        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/forgot-password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, token, password, password_confirmation: passwordConfirmation }),
            });
            const data = await res.json();
            if (data.success) {
                setStep('success');
                setTimeout(() => { window.location.href = '/login'; }, 3000);
            } else {
                setError(data.message || 'Failed to reset password. Please try again.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    const stepNumber = step === 'email' ? 1 : step === 'verify' ? 2 : step === 'reset' ? 3 : 4;

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            <Head title="Forgot Password — NE Veterinary Clinic" />

            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
                @keyframes glowPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(79,168,218,0.35); } 50% { box-shadow: 0 0 0 18px rgba(79,168,218,0); } }
                .logo-glow { animation: glowPulse 3s ease-in-out infinite; }
                @keyframes checkPop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
                .check-pop { animation: checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
            `}</style>

            {/* ── Left brand panel ── */}
            <div className="relative lg:w-2/5 flex flex-col items-center justify-center px-8 py-16 lg:py-0 text-center overflow-hidden"
                style={{ background: `linear-gradient(160deg, ${C.navy} 0%, #061428 100%)` }}>
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '26px 26px' }} />

                <div className="relative fade-up" style={{ animationDelay: '80ms' }}>
                    <div className="logo-glow w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-2xl overflow-hidden">
                        <img src="/logo.png" alt="NE Veterinary Clinic" className="w-24 h-24 sm:w-28 sm:h-28 object-contain" />
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">NE Veterinary Clinic</h1>
                    <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed mb-7">
                        Professional veterinary care for your beloved pets in Cabanatuan City, Nueva Ecija.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs mx-auto">
                        <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white/85" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <Shield className="w-3.5 h-3.5" style={{ color: C.teal }} /> Licensed Vets
                        </span>
                        <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white/85" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <CalendarCheck className="w-3.5 h-3.5" style={{ color: C.teal }} /> Easy Booking
                        </span>
                        <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white/85" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <Heart className="w-3.5 h-3.5" style={{ color: C.teal }} /> Compassionate
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 sm:py-16" style={{ background: 'linear-gradient(160deg, #F5F9FC, #EAF3FA)' }}>
                <div className="w-full max-w-md fade-up" style={{ animationDelay: '160ms' }}>
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 px-7 sm:px-9 py-9 sm:py-10">

                        {/* ── Step 1: Enter Email ── */}
                        {step === 'email' && (
                            <>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${C.navy}10` }}>
                                        <Lock className="w-5 h-5" style={{ color: C.navy }} />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black" style={{ color: C.navy }}>Forgot Password</h2>
                                </div>
                                <p className="text-gray-400 text-sm mb-7">Enter your email and we'll send you a code to reset it.</p>

                                {error && (
                                    <div className="mb-5 p-3.5 rounded-xl border text-sm font-medium text-center bg-red-50 border-red-100 text-red-600">
                                        {error}
                                    </div>
                                )}

                                <form className="space-y-5" onSubmit={handleSendCode}>
                                    <div>
                                        <label className="text-gray-700 font-bold mb-1.5 block text-sm">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                            <input type="email" required autoFocus value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                                                placeholder="you@example.com"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all outline-none"
                                                style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="w-full text-white font-bold py-3.5 text-sm rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center border-0"
                                        style={{ background: loading ? 'rgba(11,37,69,0.6)' : `linear-gradient(135deg, ${C.navy}, ${C.blue})` }}>
                                        {loading ? <><LoaderCircle className="animate-spin mr-2 h-4 w-4" /> Sending...</> : <><span>Send Code</span> <ArrowRight className="ml-2 w-4 h-4" /></>}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* ── Step 2: Verify Code ── */}
                        {step === 'verify' && (
                            <>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${C.navy}10` }}>
                                        <Mail className="w-5 h-5" style={{ color: C.navy }} />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black" style={{ color: C.navy }}>Verify Code</h2>
                                </div>
                                <p className="text-gray-400 text-sm mb-7">We sent a 6-digit code to <span className="font-semibold text-gray-600">{email}</span></p>

                                {error && (
                                    <div className="mb-5 p-3.5 rounded-xl border text-sm font-medium text-center bg-red-50 border-red-100 text-red-600">
                                        {error}
                                    </div>
                                )}

                                <form className="space-y-5" onSubmit={handleVerifyCode}>
                                    <div>
                                        <label className="text-gray-700 font-bold mb-3 block text-sm">Verification Code</label>
                                        <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
                                            {code.map((digit, i) => (
                                                <input key={i} ref={el => { codeRefs.current[i] = el; }}
                                                    type="text" inputMode="numeric" maxLength={1} value={digit}
                                                    onChange={e => handleCodeChange(i, e.target.value)}
                                                    onKeyDown={e => handleCodeKeyDown(i, e)}
                                                    className="w-12 h-14 text-center text-lg font-bold rounded-xl border bg-gray-50 focus:ring-2 focus:border-transparent outline-none transition-all"
                                                    style={{ borderColor: digit ? C.blue : '#E5E7EB', '--tw-ring-color': C.blue } as React.CSSProperties} />
                                            ))}
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading || code.join('').length !== 6}
                                        className="w-full text-white font-bold py-3.5 text-sm rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center border-0 disabled:opacity-50"
                                        style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.blue})` }}>
                                        {loading ? <><LoaderCircle className="animate-spin mr-2 h-4 w-4" /> Verifying...</> : <><span>Verify Code</span> <ArrowRight className="ml-2 w-4 h-4" /></>}
                                    </button>

                                    <div className="text-center">
                                        {cooldown > 0 ? (
                                            <p className="text-sm text-gray-400">Resend code in {cooldown}s</p>
                                        ) : (
                                            <button type="button" onClick={handleResendCode} disabled={loading}
                                                className="text-sm font-semibold underline underline-offset-2 inline-flex items-center gap-1.5 transition-colors"
                                                style={{ color: C.blue }}>
                                                <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </>
                        )}

                        {/* ── Step 3: Reset Password ── */}
                        {step === 'reset' && (
                            <>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${C.navy}10` }}>
                                        <Lock className="w-5 h-5" style={{ color: C.navy }} />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black" style={{ color: C.navy }}>Reset Password</h2>
                                </div>
                                <p className="text-gray-400 text-sm mb-7">Create a new password for your account.</p>

                                {error && (
                                    <div className="mb-5 p-3.5 rounded-xl border text-sm font-medium text-center bg-red-50 border-red-100 text-red-600">
                                        {error}
                                    </div>
                                )}

                                <form className="space-y-5" onSubmit={handleResetPassword}>
                                    <div>
                                        <label className="text-gray-700 font-bold mb-1.5 block text-sm">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                            <input type={showPassword ? 'text' : 'password'} required value={password}
                                                onChange={e => { setPassword(e.target.value); setError(''); }}
                                                placeholder="Min. 8 characters"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-12 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all outline-none"
                                                style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                            <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-gray-700 font-bold mb-1.5 block text-sm">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                            <input type={showConfirmPassword ? 'text' : 'password'} required value={passwordConfirmation}
                                                onChange={e => { setPasswordConfirmation(e.target.value); setError(''); }}
                                                placeholder="Re-enter your password"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-12 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all outline-none"
                                                style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                            <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="w-full text-white font-bold py-3.5 text-sm rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center border-0"
                                        style={{ background: loading ? 'rgba(11,37,69,0.6)' : `linear-gradient(135deg, ${C.navy}, ${C.blue})` }}>
                                        {loading ? <><LoaderCircle className="animate-spin mr-2 h-4 w-4" /> Updating...</> : <><span>Update Password</span> <ArrowRight className="ml-2 w-4 h-4" /></>}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* ── Step 4: Success ── */}
                        {step === 'success' && (
                            <div className="text-center py-4">
                                <div className="check-pop w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                                    <CheckCircle className="w-9 h-9" style={{ color: '#059669' }} />
                                </div>
                                <h2 className="text-2xl font-black mb-2" style={{ color: C.navy }}>Password Reset!</h2>
                                <p className="text-gray-400 text-sm mb-6">Your password has been updated successfully. Redirecting to sign in...</p>
                                <Link href="/login"
                                    className="inline-flex items-center gap-2 text-sm font-bold underline underline-offset-2 transition-colors"
                                    style={{ color: C.blue }}>
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                                </Link>
                            </div>
                        )}

                        {/* Step indicators */}
                        {step !== 'success' && (
                            <div className="mt-6 flex items-center justify-center gap-1.5">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className="h-1.5 rounded-full transition-all duration-300"
                                        style={{
                                            width: stepNumber === s ? 24 : 8,
                                            background: s <= stepNumber ? C.navy : '#E5E7EB',
                                        }} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-5 text-center">
                        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
