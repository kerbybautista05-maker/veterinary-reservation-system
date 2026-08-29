import { Link } from '@inertiajs/react';
import { CalendarCheck, ShieldCheck, Heart, Clock, CheckCircle, ChevronRight } from 'lucide-react';

interface HeroSectionProps {
    isLoaded: boolean;
}

export default function HeroSection({ isLoaded }: HeroSectionProps) {
    const stats = [
        { value: '15+', label: 'Years Experience' },
        { value: '10K+', label: 'Happy Pets' },
        { value: '24/7', label: 'Emergency Ready' },
    ];

    return (
        <section
            id="home"
            className="relative min-h-screen flex items-center overflow-hidden"
            style={{ background: 'linear-gradient(155deg, #0B2545 0%, #1D6FA5 45%, #0D47A1 100%)' }}
        >
            {/* Banner image with low opacity */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'url(/images/hero/banner.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.30,
                }}
            />

            {/* Subtle dot grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                }}
            />
            {/* Glowing orbs */}
            <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(144,202,249,0.12) 0%, transparent 65%)' }} />
            <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(187,222,251,0.10) 0%, transparent 65%)' }} />

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-28">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

                    {/* LEFT COPY */}
                    <div
                        style={{
                            opacity: isLoaded ? 1 : 0,
                            transform: isLoaded ? 'translateY(0)' : 'translateY(24px)',
                            transition: 'opacity 0.7s ease, transform 0.7s ease',
                        }}
                    >
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border border-white/15 bg-white/10 text-white mb-6">
                            <Heart className="w-3.5 h-3.5" /> Trusted Since 2009
                        </span>

                        <h1
                            className="text-white leading-[1.08] tracking-tight mb-6"
                            style={{ fontSize: 'clamp(2.5rem, 5.5vw, 3.75rem)', fontWeight: 900, fontFamily: "'Georgia', serif" }}
                        >
                            Compassionate Care<br />
                            <span style={{ color: '#90CAF9' }}>for Your Pets</span>
                        </h1>

                        <p className="text-blue-100 text-base sm:text-lg leading-relaxed mb-9 max-w-md">
                            From wellness exams to emergency care — NEVET provides compassionate, science-backed veterinary
                            services for pets and their families in Cabanatuan City, Nueva Ecija.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-10">
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2.5 bg-white font-bold px-7 py-3.5 rounded-xl shadow-2xl hover:-translate-y-0.5 transition-all text-sm"
                                style={{ color: '#0B2545' }}
                            >
                                <CalendarCheck className="w-4 h-4" />
                                Book an Appointment
                                <ChevronRight className="w-4 h-4 opacity-60" />
                            </Link>
                            <a
                                href="#services"
                                className="inline-flex items-center gap-2 border border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-white/20 transition-all text-sm"
                            >
                                See Our Services
                            </a>
                        </div>

                        {/* Trust row */}
                        <div className="flex flex-wrap gap-5 pt-2">
                            {[
                                { Icon: ShieldCheck, label: 'PRC Licensed Vets' },
                                { Icon: Clock, label: 'Mon–Sat 9AM–5:30PM' },
                                { Icon: Heart, label: 'Compassionate Care' },
                                { Icon: CheckCircle, label: 'Modern Equipment' },
                            ].map(({ Icon, label }) => (
                                <div key={label} className="flex items-center gap-1.5 text-blue-200 text-xs font-semibold">
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Clinic info card */}
                    <div
                        style={{
                            opacity: isLoaded ? 1 : 0,
                            transform: isLoaded ? 'translateY(0)' : 'translateY(32px)',
                            transition: 'opacity 0.7s ease 0.18s, transform 0.7s ease 0.18s',
                        }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-[450px] mx-auto lg:ml-auto border border-blue-200/40">

                            {/* Top bar */}
                            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0B2545' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden">
                                        <img src="/logo.png" alt="NEVET" className="w-8 h-8 object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white text-[9px] font-black">NE</span>';
                                            }} />
                                    </div>
                                    <p className="text-white text-xs font-black tracking-wide">NE VETERINARY CLINIC</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className="text-white text-[10px] font-bold leading-tight">Cabanatuan City</p>
                                        <p className="text-blue-200 text-[9px]">Nueva Ecija</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/40"
                                        style={{ background: '#42A5F5' }}>
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-[10px]">NE</div>
                                    </div>
                                </div>
                            </div>

                            {/* Body: services overview */}
                            <div className="p-5 bg-gray-50">
                                <div className="flex items-center gap-2 mb-4">
                                    <p className="text-sm font-black" style={{ color: '#0B2545' }}>Our Services</p>
                                </div>

                                <div className="space-y-2.5">
                                    {[
                                        { title: 'Wellness Exams', desc: 'Thorough checkups & preventive care', color: '#059669' },
                                        { title: 'Vaccinations', desc: 'Core & lifestyle vaccines', color: '#2563EB' },
                                        { title: 'Surgery', desc: 'Soft tissue & orthopedic procedures', color: '#7C3AED' },
                                        { title: 'Dental Care', desc: 'Scaling, polishing & oral health', color: '#D97706' },
                                        { title: 'Emergency Care', desc: 'Urgent consultations & stabilization', color: '#DC2626' },
                                    ].map((s) => (
                                        <div key={s.title} className="flex items-center gap-3 bg-white rounded-xl px-3.5 py-2.5 border border-gray-100">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold text-gray-800">{s.title}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA footer */}
                            <Link
                                href="/register"
                                className="flex items-center justify-center gap-1.5 w-full py-2.5 text-white text-xs font-bold hover:opacity-90 transition-opacity"
                                style={{ background: '#0B2545' }}
                            >
                                Register Your Pet Today
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom wave */}
            <div className="absolute bottom-0 left-0 right-0 leading-none pointer-events-none">
                <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none" className="w-full block">
                    <path d="M0 40C360 80 1080 0 1440 40V80H0V40Z" fill="white" />
                </svg>
            </div>
        </section>
    );
}
