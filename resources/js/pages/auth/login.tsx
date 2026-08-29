import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft, Shield, CalendarCheck, Heart } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const C = { navy: '#0B2545', blue: '#1D6FA5', sky: '#4FA8DA', teal: '#14B8A6' };

type LoginForm = { email: string; password: string; remember: boolean };
interface LoginProps { status?: string; canResetPassword: boolean }

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '', password: '', remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            <Head title="Sign In — NE Veterinary Clinic" />

            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
                @keyframes glowPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(79,168,218,0.35); } 50% { box-shadow: 0 0 0 18px rgba(79,168,218,0); } }
                .logo-glow { animation: glowPulse 3s ease-in-out infinite; }
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
                        <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: C.navy }}>Welcome Back</h2>
                        <p className="text-gray-400 text-sm mb-7">Sign in to your account</p>

                        {status && (
                            <div className="mb-5 p-3.5 rounded-xl border text-sm font-medium text-center bg-blue-50 border-blue-100" style={{ color: C.blue }}>
                                {status}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={submit}>
                            <div>
                                <Label htmlFor="email" className="text-gray-700 font-bold mb-1.5 block text-sm">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                    <Input id="email" type="email" required autoFocus tabIndex={1} autoComplete="email"
                                        value={data.email} onChange={e => setData('email', e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                </div>
                                <InputError message={errors.email} className="text-red-500 mt-1.5 text-xs font-medium" />
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-gray-700 font-bold mb-1.5 block text-sm">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                    <Input id="password" type={showPassword ? 'text' : 'password'} required tabIndex={2}
                                        autoComplete="current-password" value={data.password}
                                        onChange={e => setData('password', e.target.value)} placeholder="Enter your password"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-12 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': C.teal } as React.CSSProperties} />
                                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="text-red-500 mt-1.5 text-xs font-medium" />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="remember" checked={data.remember} onCheckedChange={checked => setData('remember', checked as boolean)} tabIndex={3} />
                                    <Label htmlFor="remember" className="text-sm text-gray-600 font-medium cursor-pointer">Remember me</Label>
                                </div>
                                {canResetPassword && (
                                    <Link href={route('password.request')} tabIndex={-1} className="text-xs font-semibold underline underline-offset-2" style={{ color: C.blue }}>
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            <Button type="submit" tabIndex={4} disabled={processing}
                                className="w-full text-white font-bold py-3.5 text-sm rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center border-0"
                                style={{ background: processing ? 'rgba(11,37,69,0.6)' : `linear-gradient(135deg, ${C.navy}, ${C.blue})` }}>
                                {processing
                                    ? <><LoaderCircle className="animate-spin mr-2 h-4 w-4" /> Signing in...</>
                                    : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>}
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-500">
                            Don't have an account?{' '}
                            <Link href={route('register')} className="font-bold underline underline-offset-2" style={{ color: C.blue }}>
                                Register here
                            </Link>
                        </p>
                    </div>

                    <div className="mt-5 text-center">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}