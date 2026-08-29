import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, MapPin, ArrowLeft, Shield, CalendarCheck, Heart } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const C = { navy: '#0B2545', blue: '#1D6FA5', sky: '#4FA8DA', teal: '#14B8A6' };

type RegisterForm = {
    first_name: string; last_name: string; middle_name: string; suffix: string;
    email: string; phone_number: string; address: string;
    password: string; password_confirmation: string; terms_accepted: boolean;
};

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        first_name: '', last_name: '', middle_name: '', suffix: '',
        email: '', phone_number: '', address: '',
        password: '', password_confirmation: '', terms_accepted: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            <Head title="Create an Account — NE Veterinary Clinic" />

            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
                @keyframes glowPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(79,168,218,0.35); } 50% { box-shadow: 0 0 0 18px rgba(79,168,218,0); } }
                .logo-glow { animation: glowPulse 3s ease-in-out infinite; }
            `}</style>

            {/* ── Left brand panel ── */}
            <div className="relative lg:w-2/5 flex flex-col items-center justify-center px-8 py-14 lg:py-0 text-center overflow-hidden"
                style={{ background: `linear-gradient(160deg, ${C.navy} 0%, #061428 100%)` }}>
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '26px 26px' }} />

                <div className="relative fade-up" style={{ animationDelay: '80ms' }}>
                    <div className="logo-glow w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-2xl overflow-hidden">
                        <img src="/logo.png" alt="NE Veterinary Clinic" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Join the NEVET Family</h1>
                    <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed mb-7">
                        Register in minutes to book appointments, track health records, and get reminders for your pets.
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
            <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: 'linear-gradient(160deg, #F5F9FC, #EAF3FA)' }}>
                <div className="w-full max-w-lg fade-up" style={{ animationDelay: '160ms' }}>
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 px-7 sm:px-9 py-9 sm:py-10">
                        <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: C.navy }}>Create an Account</h2>
                        <p className="text-gray-400 text-sm mb-7">Register as a pet owner — approval usually takes less than a day</p>

                        <form className="space-y-5" onSubmit={submit}>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="first_name" className="text-gray-700 font-bold mb-1.5 block text-sm">First Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                        <Input id="first_name" required autoFocus tabIndex={1} value={data.first_name}
                                            onChange={e => setData('first_name', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                            style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                    </div>
                                    <InputError message={errors.first_name} className="text-red-500 mt-1.5 text-xs font-medium" />
                                </div>
                                <div>
                                    <Label htmlFor="last_name" className="text-gray-700 font-bold mb-1.5 block text-sm">Last Name</Label>
                                    <Input id="last_name" required tabIndex={2} value={data.last_name}
                                        onChange={e => setData('last_name', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                    <InputError message={errors.last_name} className="text-red-500 mt-1.5 text-xs font-medium" />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="middle_name" className="text-gray-700 font-bold mb-1.5 block text-sm">Middle Name <span className="text-gray-300 font-medium">(optional)</span></Label>
                                    <Input id="middle_name" tabIndex={3} value={data.middle_name}
                                        onChange={e => setData('middle_name', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                </div>
                                <div>
                                    <Label htmlFor="suffix" className="text-gray-700 font-bold mb-1.5 block text-sm">Suffix <span className="text-gray-300 font-medium">(optional)</span></Label>
                                    <Input id="suffix" tabIndex={4} placeholder="Jr., Sr., III…" value={data.suffix}
                                        onChange={e => setData('suffix', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="email" className="text-gray-700 font-bold mb-1.5 block text-sm">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                    <Input id="email" type="email" required tabIndex={5} autoComplete="email" value={data.email}
                                        onChange={e => setData('email', e.target.value)} placeholder="you@example.com"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                </div>
                                <InputError message={errors.email} className="text-red-500 mt-1.5 text-xs font-medium" />
                            </div>

                            <div>
                                <Label htmlFor="phone_number" className="text-gray-700 font-bold mb-1.5 block text-sm">Phone Number <span className="text-gray-300 font-medium">(optional)</span></Label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                    <Input id="phone_number" tabIndex={6} value={data.phone_number}
                                        onChange={e => setData('phone_number', e.target.value)} placeholder="09xx xxx xxxx"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                </div>
                                <InputError message={errors.phone_number} className="text-red-500 mt-1.5 text-xs font-medium" />
                            </div>

                            <div>
                                <Label htmlFor="address" className="text-gray-700 font-bold mb-1.5 block text-sm">Address <span className="text-gray-300 font-medium">(optional)</span></Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                    <textarea id="address" tabIndex={7} rows={2} value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all focus:outline-none"
                                        style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="password" className="text-gray-700 font-bold mb-1.5 block text-sm">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                        <Input id="password" type={showPassword ? 'text' : 'password'} required tabIndex={8}
                                            autoComplete="new-password" value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                            style={{ '--tw-ring-color': C.teal } as React.CSSProperties} />
                                        <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} className="text-red-500 mt-1.5 text-xs font-medium" />
                                </div>
                                <div>
                                    <Label htmlFor="password_confirmation" className="text-gray-700 font-bold mb-1.5 block text-sm">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.blue }} />
                                        <Input id="password_confirmation" type={showConfirm ? 'text' : 'password'} required tabIndex={9}
                                            autoComplete="new-password" value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 py-3 text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
                                            style={{ '--tw-ring-color': C.teal } as React.CSSProperties} />
                                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <Checkbox id="terms_accepted" checked={data.terms_accepted}
                                    onCheckedChange={checked => setData('terms_accepted', checked as boolean)} tabIndex={10} className="mt-0.5" />
                                <Label htmlFor="terms_accepted" className="text-sm text-gray-600 font-medium cursor-pointer leading-snug">
                                    I agree to the clinic's terms of service and privacy policy.
                                </Label>
                            </div>
                            <InputError message={errors.terms_accepted} className="text-red-500 -mt-3 text-xs font-medium" />

                            <Button type="submit" tabIndex={11} disabled={processing}
                                className="w-full text-white font-bold py-3.5 text-sm rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center border-0"
                                style={{ background: processing ? 'rgba(11,37,69,0.6)' : `linear-gradient(135deg, ${C.navy}, ${C.blue})` }}>
                                {processing
                                    ? <><LoaderCircle className="animate-spin mr-2 h-4 w-4" /> Creating account...</>
                                    : <><UserPlus className="mr-2 h-4 w-4" /> Create Account</>}
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link href={route('login')} className="font-bold underline underline-offset-2" style={{ color: C.blue }}>
                                Sign in
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