// ============================================
// FILE: pages/Auth/VerifyOtp.tsx
// Columban College Scheduling System - Verify OTP
// ============================================
import { Head, router } from '@inertiajs/react';
import { LoaderCircle, Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';

interface VerifyOtpProps {
    email: string;
    status?: string;
    canResend: number; 
    errors?: {
        otp?: string;
    };
}

export default function VerifyOtp({ email, status, canResend = 0, errors = {} }: VerifyOtpProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendTimer, setResendTimer] = useState(canResend);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Timer logic
    useEffect(() => {
        if (resendTimer <= 0) {
            return;
        }

        const interval = setInterval(() => {
            setResendTimer(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleResendSuccess = () => {
        setResendTimer(120); 
    };
    
    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
        setOtp(newOtp);

        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        
        if (otpValue.length !== 6) {
            return;
        }

        setIsSubmitting(true);

        router.post(route('otp.verify'), 
            { otp: otpValue },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOtp(['', '', '', '', '', '']);
                },
                onError: () => {},
                onFinish: () => {
                    setIsSubmitting(false);
                }
            }
        );
    };

    const handleResend: FormEventHandler = (e) => {
        e.preventDefault();
        if (resendTimer > 0) return;

        setIsResending(true);

        router.post(route('otp.resend'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                handleResendSuccess();
            },
            onFinish: () => {
                setIsResending(false);
            }
        });
    };

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const isResendDisabled = isResending || resendTimer > 0;
    const resendText = resendTimer > 0 ? `Resend in ${formatTime(resendTimer)}` : 'Resend Code';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Head title="Verify OTP - Columban College" />

            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
                <div className="absolute inset-0 opacity-5">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                {/* Back button */}
                <div className="mb-6">
                    <button 
                        onClick={() => router.post(route('logout'))}
                        className="inline-flex items-center text-base font-semibold text-white/80 hover:text-amber-400 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back
                    </button>
                </div>

                {/* Logo and College Info */}
                <div className="text-center mb-8">
                    <img
                        src="/logo.png"
                        alt="Columban College Logo"
                        className="mx-auto w-20 h-20 mb-4 object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <h1 className="text-2xl font-bold text-white mb-2">
                        COLUMBAN COLLEGE, INC.
                    </h1>
                    <p className="text-amber-400 text-sm font-medium italic">
                        Scheduling System
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 py-10 px-8 shadow-2xl rounded-2xl sm:px-10">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <Mail className="w-10 h-10 text-blue-950" />
                        </div>
                    </div>

                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Verify Your Email</h2>
                        <p className="text-gray-300 text-base leading-relaxed">
                            We've sent a 6-digit verification code to
                        </p>
                        <p className="text-amber-400 font-semibold text-lg mt-2">{email}</p>
                    </div>

                    {status && (
                        <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-400 rounded-xl">
                            <p className="text-green-300 text-sm font-medium text-center">
                                {status}
                            </p>
                        </div>
                    )}

                    {errors.otp && (
                        <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-xl">
                            <p className="text-red-300 text-sm font-medium text-center">
                                {errors.otp}
                            </p>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        {/* OTP Input Boxes */}
                        <div className="flex justify-center gap-3" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-white/90 text-gray-900 border-2 border-white/20 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
                                />
                            ))}
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold py-3 text-base rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center" 
                            disabled={isSubmitting || otp.join('').length !== 6}
                        >
                            {isSubmitting ? (
                                <>
                                    <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify OTP'
                            )}
                        </Button>
                    </form>

                    {/* Resend OTP */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-300 text-sm mb-3">Didn't receive the code?</p>
                        <form onSubmit={handleResend}>
                            <Button
                                type="submit"
                                variant="ghost"
                                className={`font-medium text-base inline-flex items-center ${
                                    isResendDisabled 
                                        ? 'text-white/40 bg-white/5 cursor-not-allowed' 
                                        : 'text-amber-400 hover:text-amber-300 hover:bg-white/5'
                                }`}
                                disabled={isResendDisabled}
                            >
                                {isResending ? (
                                    <>
                                        <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        {resendTimer <= 0 && <RefreshCw className="mr-2 h-4 w-4" />}
                                        {resendText}
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Logout link */}
                    <div className="mt-6 text-center">
                        <a
                            href={route('logout')}
                            onClick={(e) => {
                                e.preventDefault();
                                router.post(route('logout'));
                            }}
                            className="text-white/60 hover:text-white/80 text-sm font-medium"
                        >
                            Use a different account
                        </a>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.05); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 6s ease-in-out infinite;
                }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
}