// resources/js/pages/Home.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    PawPrint, Menu, X, Shield, Star, Heart, Clock, CalendarCheck, Award,
    ChevronDown, ChevronRight, ChevronUp, Phone, Mail, MapPin, Stethoscope,
    UserRound, ClipboardCheck, HeartPulse, Home as HomeIcon, Syringe,
    AlertTriangle, Scissors, Sparkles, Utensils, Facebook, Instagram,
    Scale, Ambulance, Megaphone,
} from 'lucide-react';
import { useReveal, useCountUp } from '@/hooks/useReveal';
import type { Announcement } from '@/services';

const C = {
    navy: '#0B2545', blue: '#1D6FA5', sky: '#4FA8DA', teal: '#14B8A6', red: '#DC2626',
};

// ─── Reveal wrapper ─────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    const { ref, visible } = useReveal<HTMLDivElement>();
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(28px)',
                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

function SectionKicker({ icon: Icon, label, dark = false }: { icon: React.ElementType; label: string; dark?: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${
            dark ? 'bg-white/10 border-white/15 text-white' : 'bg-blue-50 border-blue-100'
        }`} style={!dark ? { color: C.blue } : undefined}>
            <Icon className="w-3.5 h-3.5" /> {label}
        </span>
    );
}

function GradientDivider() {
    return <div className="w-14 h-1 rounded-full mx-auto my-5" style={{ background: `linear-gradient(90deg, ${C.teal}, ${C.blue})` }} />;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const links = [
        { label: 'Home', href: '#home' },
        { label: 'Services', href: '#services' },
        { label: 'About', href: '#about' },
        { label: 'Announcements', href: '#announcements' },
        { label: 'Contact', href: '#contact' },
    ];

    return (
        <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="#home" className="flex items-center gap-2 sm:gap-2.5 font-black text-base sm:text-lg shrink-0" style={{ color: scrolled ? C.navy : '#fff' }}>
                            <span className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0 bg-white shadow-sm">
                                <img
                                    src="/logo.png"
                                    alt="NE Veterinary Clinic"
                                    className="w-full h-full object-contain p-1"
                                    onError={e => {
                                        const img = e.currentTarget as HTMLImageElement;
                                        img.style.display = 'none';
                                        img.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                              
                            </span>
                        </a>

                <div className="hidden lg:flex items-center gap-8">
                    {links.map(l => (
                        <a key={l.label} href={l.href}
                            className={`text-sm font-bold transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/85 hover:text-white'}`}>
                            {l.label}
                        </a>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-3">
                    <Link href="/login" className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}>
                        Sign In
                    </Link>
                    <Link href="/register" className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.blue})` }}>
                        <PawPrint className="w-3.5 h-3.5" /> Get Started
                    </Link>
                </div>

                <button onClick={() => setMobileOpen(v => !v)} className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}>
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </nav>

            {mobileOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl px-4 py-4 space-y-1">
                    {links.map(l => (
                        <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                            className="block px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">
                            {l.label}
                        </a>
                    ))}
                    <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-2">
                        <Link href="/login" className="px-4 py-2.5 rounded-xl text-sm font-bold text-center text-gray-700 border border-gray-200">Sign In</Link>
                        <Link href="/register" className="px-4 py-2.5 rounded-xl text-sm font-bold text-center text-white" style={{ background: C.navy }}>Get Started</Link>
                    </div>
                </div>
            )}
        </header>
    );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
    const { ref, visible } = useReveal<HTMLDivElement>(0.3);
    const years = useCountUp(15, visible);
    const pets = useCountUp(10, visible);

    return (
        <section id="home" className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28" style={{ background: C.navy }}>
            {/* Background banner photo */}
            <div className="absolute inset-0">
                <img
                    src="/images/hero/banner.png"
                    alt="Happy pets cared for at NE Veterinary Clinic"
                    className="w-full h-full object-cover object-[70%_center] animate-kenburns"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                {/* Mobile/tablet: strong solid scrim so text stays readable over the busy photo */}
                <div className="absolute inset-0 lg:hidden" style={{ background: 'linear-gradient(180deg, rgba(11,37,69,0.94) 0%, rgba(11,37,69,0.90) 45%, rgba(11,37,69,0.80) 100%)' }} />
                {/* Desktop: left-to-right fade so the pet photo shows through on the right */}
                <div className="absolute inset-0 hidden lg:block" style={{ background: 'linear-gradient(90deg, rgba(11,37,69,0.98) 0%, rgba(11,37,69,0.94) 28%, rgba(11,37,69,0.68) 50%, rgba(11,37,69,0.15) 72%, rgba(11,37,69,0) 88%)' }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
                <div className="max-w-xl" style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-5">
                        Compassionate Care for Your Beloved Companions
                    </h1>
                    <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-6 max-w-lg">
                        From wellness exams to emergency care — NEVET provides compassionate, science-backed veterinary
                        services for pets and their families in Cabanatuan City, Nueva Ecija.
                    </p>

                  

                    <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-black text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                        style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.blue})` }}>
                        <CalendarCheck className="w-4 h-4" /> Book an Appointment
                    </Link>

                

                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-white/60 text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><UserRound className="w-3.5 h-3.5" /> Certified by PRC Licensed Vets</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Open Now Mon–Sat 9AM–5:30PM</span>
                    </div>
                </div>
            </div>

            {/* Feature marquee */}
            <div className="relative mt-16 sm:mt-20">
                <div className="overflow-hidden border-t border-white/10 py-6">
                    <div className="flex gap-10 whitespace-nowrap animate-marquee">
                        {[...FEATURE_STRIP, ...FEATURE_STRIP].map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-2.5 text-white/80 text-xs font-bold uppercase tracking-wide shrink-0">
                                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${C.teal}25` }}>
                                    <f.icon className="w-3.5 h-3.5" style={{ color: C.teal }} />
                                </span>
                                {f.label}<span className="text-white/40 ml-1">— {f.sub}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 28s linear infinite; }
                @keyframes kenburns { 0% { transform: scale(1.06) translateX(0); } 100% { transform: scale(1.14) translateX(-1%); } }
                .animate-kenburns { animation: kenburns 22s ease-in-out infinite alternate; }
            `}</style>
        </section>
    );
}

const FEATURE_STRIP = [
    { icon: Shield, label: 'Safe Procedures', sub: 'Sterile, modern protocols' },
    { icon: Heart, label: 'Calm Environment', sub: 'Stress-free pet experience' },
    { icon: Sparkles, label: 'Modern Equipment', sub: 'Advanced diagnostics' },
    { icon: MapPin, label: 'Cabanatuan City', sub: 'Serving Nueva Ecija since 2009' },
    { icon: Award, label: 'Licensed Vets', sub: 'PRC-registered professionals' },
];

// ─── About ────────────────────────────────────────────────────────────────────

function About() {


    return (
        <section id="about" className="py-20 sm:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
                <Reveal>
                    <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3]" style={{ background: `linear-gradient(135deg, ${C.red}, #991B1B)` }}>
                        {/* Drop a photo at public/images/about/dog-cat.png (or update the path) */}
                        <img
                            src="/images/about/dog-cat.png"
                            alt="A dog and cat cared for at NE Veterinary Clinic"
                            className="w-full h-full object-cover"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 -z-10 flex items-center justify-center gap-4 text-7xl sm:text-8xl opacity-40">
                            <span>🐕</span><span>🐈</span>
                        </div>
                        <div className="absolute top-5 right-5 w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl font-black text-white">?</div>
                    </div>
                </Reveal>

                <Reveal delay={120}>
                    <SectionKicker icon={PawPrint} label="Our Story" />
                    <h2 className="text-3xl sm:text-4xl font-black leading-tight mt-4 mb-5" style={{ color: C.navy }}>
                        We Know Your Pet Isn't <span style={{ color: C.blue }}>"Just an Animal"</span>
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        They curl up next to you during hard days. They sprint to the door the moment they hear your key.
                        They've seen you at your best and your worst — and they love you unconditionally.
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-8">
                        At NEVET, we don't just treat symptoms. We treat the whole animal — with the same patience,
                        precision, and warmth that your family deserves. Serving Cabanatuan City since 2009.
                    </p>

             

                  
                </Reveal>
            </div>
        </section>
    );
}

// ─── Services ─────────────────────────────────────────────────────────────────

const SERVICES = [
    { icon: HeartPulse, title: 'Wellness Exams', desc: "Thorough checkups, physical assessments, nutritional counseling, and preventive care plans tailored to your pet's age and breed." },
    { icon: UserRound, title: 'Surgery', desc: 'Soft tissue, orthopedic, and dental surgical procedures performed with modern equipment and gentle post-operative care protocols.' },
    { icon: Sparkles, title: 'Dental Care', desc: 'Scaling, polishing, and oral health assessments for fresh breath and healthy gums. Prevent dental disease before it starts.' },
    { icon: Syringe, title: 'Vaccinations', desc: 'Core and lifestyle vaccines on a schedule tailored to your pet, protecting against life-threatening preventable diseases.' },
    { icon: Ambulance, title: 'Emergency Care', desc: 'Urgent consultations and stabilization for sudden illness or injury. Our team is ready when your pet needs us most.' },
];

function Services() {
    return (
        <section id="services" className="py-20 sm:py-28 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-14">
                <Reveal>
                    <SectionKicker icon={Stethoscope} label="What We Offer" />
                    <h2 className="text-3xl sm:text-4xl font-black mt-4" style={{ color: C.navy }}>Thoughtful Care at Every Stage of Life</h2>
                    <p className="text-gray-500 mt-3 max-w-xl mx-auto">From first vaccines to emergency care — each service delivered with expertise and genuine compassion.</p>
                    <GradientDivider />
                </Reveal>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
                {SERVICES.map((s, i) => (
                    <Reveal key={s.title} delay={i * 80}>
                        <div className="flex items-start gap-5 bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${C.blue}15` }}>
                                <s.icon className="w-6 h-6" style={{ color: C.blue }} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black" style={{ color: C.navy }}>{s.title}</h3>
                                <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{s.desc}</p>
                                <a href="#contact" className="inline-flex items-center gap-1 text-sm font-bold mt-3" style={{ color: C.blue }}>
                                    Learn More <ChevronRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

// ─── Visit Process ────────────────────────────────────────────────────────────

const STEPS = [
    { n: '01', icon: CalendarCheck, title: 'Book', desc: 'Reserve your slot in minutes through our online system. Choose your preferred date, time, and service type.' },
    { n: '02', icon: ClipboardCheck, title: 'Arrive', desc: 'A stress-free, welcoming environment. Our staff greets you and your pet with warmth the moment you walk in.' },
    { n: '03', icon: Stethoscope, title: 'Care', desc: 'Thorough examinations by our licensed veterinarians using modern equipment. Gentle, precise, compassionate.' },
    { n: '04', icon: HomeIcon, title: 'Thrive', desc: 'Clear aftercare guidance, follow-up reminders, and ongoing support until your pet is fully back to their best.' },
];

function VisitProcess() {
    return (
        <section className="py-20 sm:py-28 relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${C.navy}, #061428)` }}>
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center mb-14">
                <Reveal>
                    <SectionKicker icon={PawPrint} label="Your Visit" dark />
                    <h2 className="text-3xl sm:text-4xl font-black text-white mt-4">What Your Pet Experiences With Us</h2>
                    <p className="text-white/50 mt-3 max-w-xl mx-auto">Every visit is designed to minimize stress and maximize comfort for both pets and their owners.</p>
                    <GradientDivider />
                </Reveal>
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {STEPS.map((s, i) => (
                    <Reveal key={s.n} delay={i * 100}>
                        <div className="relative rounded-2xl p-6 h-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span className="absolute -top-2 right-3 text-6xl font-black text-white/5 select-none">{s.n}</span>
                            <div className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${C.sky}25` }}>
                                <s.icon className="w-5 h-5" style={{ color: C.sky }} />
                            </div>
                            <h3 className="relative text-white font-black mb-2">{s.title}</h3>
                            <p className="relative text-white/50 text-sm leading-relaxed">{s.desc}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
    { name: 'Maria Santos', pet: 'Coco (Shih Tzu)', rating: 5, quote: 'The staff are so caring and gentle with my Shih Tzu. The clinic is clean and highly recommended to all pet owners in Cabanatuan!' },
    { name: 'Jose Reyes', pet: 'Mochi (Persian Cat)', rating: 5, quote: 'Brought our cat for surgery and we were so anxious, but the team was professional and reassuring throughout. Recovered perfectly!' },
    { name: 'Ana Cruz', pet: 'Bruno (Golden Retriever)', rating: 4, quote: 'Very affordable consultation fees with excellent quality of service. Our Golden always leaves happy. Thank you NEVET!' },
    { name: 'Carlo Mendoza', pet: 'Bella (Aspin)', rating: 5, quote: 'Vaccination and deworming done smoothly. The vet explained everything clearly. Will definitely keep coming back!' },
    { name: 'Liza Domingo', pet: 'Kira (Pomeranian)', rating: 5, quote: 'Emergency visit for our Pom and they handled it so quickly and calmly. So grateful for this clinic and their team.' },
];

function Testimonials() {
    const scrollerRef = useRef<HTMLDivElement>(null);

    const scrollBy = (dx: number) => scrollerRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

    return (
        <section className="py-20 sm:py-28 bg-white overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-12">
                <Reveal>
                    <SectionKicker icon={Star} label="Happy Pet Parents" />
                    <h2 className="text-3xl sm:text-4xl font-black mt-4" style={{ color: C.navy }}>What Our Clients Say</h2>
                    <GradientDivider />
                </Reveal>
            </div>

            <Reveal>
                <div ref={scrollerRef} className="flex gap-5 overflow-x-auto px-4 sm:px-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                    {TESTIMONIALS.map(t => (
                        <div key={t.name} className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex text-amber-400 mb-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className="w-4 h-4" fill={i < t.rating ? 'currentColor' : 'none'} strokeWidth={i < t.rating ? 0 : 1.5} />
                                ))}
                            </div>
                            <p className="text-gray-600 text-sm italic leading-relaxed mb-5">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: C.blue }}>
                                    {t.name[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{t.name}</p>
                                    <p className="text-xs text-gray-400">Owner of {t.pet}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Reveal>

            <div className="flex justify-center gap-2 mt-4">
                <button onClick={() => scrollBy(-340)} className="p-2 rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 rotate-180"><ChevronRight className="w-4 h-4" /></button>
                <button onClick={() => scrollBy(340)} className="p-2 rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>

            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none} .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        </section>
    );
}

// ─── Pet Health Tips ────────────────────────────────────────────────────────────

const TIPS = [
    { tag: 'Wellness', icon: HeartPulse, title: 'Annual Wellness Checks', desc: 'Even without symptoms, yearly exams catch heartworm, dental disease, and early organ changes before they escalate into costly emergencies.' },
    { tag: 'Vaccines', icon: Syringe, title: 'Vaccine Schedules Matter', desc: 'Core vaccines protect against life-threatening diseases. Skipping boosters leaves windows of vulnerability even in indoor pets. Ask your vet today.' },
    { tag: 'Alert Signs', icon: AlertTriangle, title: 'Know the Warning Signs', desc: 'Sudden lethargy, appetite loss, vomiting over 24hrs, or difficulty breathing warrant an immediate vet visit. Early action saves lives.' },
    { tag: 'Grooming', icon: Scissors, title: 'Regular Grooming Counts', desc: "Grooming isn't just cosmetic — it prevents mats, skin infections, ear problems, and allows you to spot lumps or parasites early." },
    { tag: 'Dental', icon: Sparkles, title: "Brush Your Pet's Teeth", desc: '80% of pets develop dental disease by age 3. Brushing 2–3x per week and professional cleanings prevent pain and organ damage.' },
    { tag: 'Nutrition', icon: Utensils, title: 'Feed Age-Appropriate Food', desc: 'Breed-appropriate, age-specific nutrition approved by your vet supports optimal energy, weight, coat condition, and lifespan.' },
];

function HealthTips() {
    return (
        <section className="py-20 sm:py-28 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-14">
                <Reveal>
                    <SectionKicker icon={Sparkles} label="Pet Health Tips" />
                    <h2 className="text-3xl sm:text-4xl font-black mt-4" style={{ color: C.navy }}>Simple Habits That Keep Pets Thriving</h2>
                    <p className="text-gray-500 mt-3 max-w-xl mx-auto">Prevention is always better than treatment. These vet-recommended habits can dramatically improve your pet's quality of life.</p>
                    <GradientDivider />
                </Reveal>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {TIPS.map((t, i) => (
                    <Reveal key={t.title} delay={(i % 3) * 90}>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full hover:shadow-md hover:-translate-y-0.5 transition-all">
                            <div className="h-32 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.blue}12, ${C.teal}12)` }}>
                                <t.icon className="w-10 h-10" style={{ color: C.blue }} />
                            </div>
                            <div className="p-5">
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-blue-50" style={{ color: C.blue }}>{t.tag}</span>
                                <h3 className="text-base font-black mt-3 mb-1.5" style={{ color: C.navy }}>{t.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

// ─── Announcements ─────────────────────────────────────────────────────────

function Announcements({ items }: { items: Announcement[] }) {
    if (!items || items.length === 0) return null;
    return (
        <section id="announcements" className="py-20 sm:py-28 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-12">
                <Reveal>
                    <SectionKicker icon={Megaphone} label="Announcements" />
                    <h2 className="text-3xl sm:text-4xl font-black mt-4" style={{ color: C.navy }}>Latest Updates</h2>
                    <p className="text-gray-500 mt-3 max-w-xl mx-auto">Stay informed about clinic news, events, and important notices.</p>
                    <GradientDivider />
                </Reveal>
            </div>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 grid gap-4">
                {items.map((a, i) => (
                    <Reveal key={a.id} delay={i * 80}>
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 flex items-start gap-4 hover:shadow-sm transition-all">
                            {a.image_url && (
                                <img src={a.image_url} alt={a.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-black" style={{ color: C.navy }}>{a.title}</h3>
                                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{a.excerpt}</p>
                                {a.start_date && (
                                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">
                                        {new Date(a.start_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        {a.end_date ? ` — ${new Date(a.end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

// ─── Find Us ──────────────────────────────────────────────────────────────────

function FindUs() {
    return (
        <section id="contact" className="py-20 sm:py-28 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-12">
                <Reveal>
                    <SectionKicker icon={MapPin} label="Find Us" />
                    <h2 className="text-3xl sm:text-4xl font-black mt-4" style={{ color: C.navy }}>NE Veterinary Clinic</h2>
                    <p className="text-gray-500 mt-3 max-w-xl mx-auto">Located in the heart of Cabanatuan City — trusted by families across Nueva Ecija for over 15 years.</p>
                    <GradientDivider />
                </Reveal>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 gap-4 mb-8">
                {[
                    { icon: MapPin, title: 'Address', lines: ['634 Ortiz Bldg, Sangitan East, Cabanatuan City, 3100 Nueva Ecija, Philippines'] },
                    { icon: Phone, title: 'Phone', lines: ['+63 44 940 8350'] },
                    { icon: Clock, title: 'Clinic Hours', lines: ['Mon–Fri: 9:00 AM – 5:30 PM', 'Saturday: 9:00 AM – 4:00 PM', 'Sunday: Closed'] },
                    { icon: Mail, title: 'Email', lines: ['info@nevet.ph'] },
                ].map(c => (
                    <Reveal key={c.title}>
                        <div className="flex items-start gap-4 border border-gray-100 rounded-2xl p-5 h-full">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.blue}15` }}>
                                <c.icon className="w-5 h-5" style={{ color: C.blue }} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-800">{c.title}</p>
                                {c.lines.map(l => <p key={l} className="text-sm text-gray-500 mt-0.5">{l}</p>)}
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>

            <Reveal>
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3844.8624295889535!2d120.97303117490426!3d15.491830285107097!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x339729273faeb00b%3A0xc56ec43ef6076974!2sN.E.%20Veterinary%20Clinic!5e0!3m2!1sen!2sph!4v1784688906950!5m2!1sen!2sph"
                            width="100%"
                            height="400"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            title="N.E. Veterinary Clinic Location"
                        />
                    </div>
                </div>
            </Reveal>
        </section>
    );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
    { q: 'What services does NEVET offer?', a: 'We offer wellness exams, vaccinations, surgery, dental care, and emergency services — everything your pet needs across every stage of life.' },
    { q: 'How do I book an appointment?', a: 'Create a free account, add your pet, and book a visit online in minutes. You can choose your preferred date, time, and veterinarian.' },
    { q: 'Do you offer emergency services?', a: "Yes. We accept emergency bookings and prioritize urgent cases. Tap the Emergency button to see critical info and call us directly — no login required." },
    { q: 'How much do consultations cost?', a: 'Consultation fees vary by service type. Our team is happy to give you an estimate before your visit — just contact the clinic.' },
    { q: 'What vaccines does my pet need?', a: 'Core vaccines depend on your pet\'s species, age, and lifestyle. Our veterinarians will recommend a schedule tailored to your pet.' },
    { q: "How do I access my pet's records?", a: 'Once registered, your pet\'s full medical history, health reminders, and appointment history are available anytime from your account.' },
];

function FAQ() {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <section id="faq" className="py-20 sm:py-28 bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center mb-12">
                <Reveal>
                    <SectionKicker icon={ChevronDown} label="Common Questions" />
                    <h2 className="text-3xl sm:text-4xl font-black mt-4" style={{ color: C.navy }}>Frequently Asked Questions</h2>
                    <p className="text-gray-500 mt-3">Everything you need to know before your first visit.</p>
                    <GradientDivider />
                </Reveal>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-3">
                {FAQS.map((f, i) => {
                    const isOpen = open === i;
                    return (
                        <Reveal key={f.q} delay={i * 60}>
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left">
                                    <span className="text-sm sm:text-base font-bold text-gray-800">{f.q}</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                                    <div className="overflow-hidden">
                                        <p className="px-5 sm:px-6 pb-4 text-sm text-gray-500 leading-relaxed">{f.a}</p>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    );
                })}
            </div>
        </section>
    );
}

// ─── Final CTA + Footer ────────────────────────────────────────────────────────

function FinalCTA() {
    return (
        <section className="px-4 sm:px-6 pb-20 sm:pb-28 bg-white">
            <Reveal>
                <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative px-6 sm:px-10 py-16 sm:py-20 text-center"
                    style={{ background: `linear-gradient(160deg, ${C.navy}, #061428)` }}>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    <div className="relative">
                        <SectionKicker icon={PawPrint} label="Join Our Family" dark />
                        <h2 className="text-3xl sm:text-5xl font-black text-white mt-5 mb-4">Because They're Family Too</h2>
                        <p className="text-white/60 max-w-xl mx-auto mb-8">
                            Join thousands of Cabanatuan families who trust us with their beloved companions.
                            Registration takes less than 2 minutes — your pet's health is worth every second.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/register" className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-black bg-white text-gray-900 hover:-translate-y-0.5 transition-all shadow-xl">
                                <UserRound className="w-4 h-4" /> Register Now
                            </Link>
                            <a href="#contact" className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-black text-white border border-white/20 hover:bg-white/10 transition-all">
                                <Phone className="w-4 h-4" /> Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}

function Footer() {
    return (
        <footer className="relative overflow-hidden text-white" style={{ background: `linear-gradient(160deg, ${C.navy}, #061428)` }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-3 gap-10">
                <div>
                    <p className="flex items-center gap-2 font-black text-lg mb-3"><PawPrint className="w-5 h-5" style={{ color: C.sky }} /> NEVET</p>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">
                        Compassionate, professional pet care in Cabanatuan City, Nueva Ecija.
                        Proudly serving families and their beloved companions since 2009.
                    </p>
                    <div className="flex gap-2">
                        <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Facebook className="w-4 h-4" /></a>
                        <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Instagram className="w-4 h-4" /></a>
                        <a href="tel:+63449408350" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Phone className="w-4 h-4" /></a>
                    </div>
                </div>

                <div>
                    <p className="font-black mb-4">Contact &amp; Hours</p>
                    <ul className="space-y-2.5 text-sm text-white/60">
                        <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.sky }} /> 634 Ortiz Bldg, Sangitan East, Cabanatuan City, Nueva Ecija</li>
                        <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" style={{ color: C.sky }} /> +63 44 940 8350</li>
                        <li className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" style={{ color: C.sky }} /> Mon–Fri: 9:00 AM – 5:30 PM</li>
                        <li className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" style={{ color: C.sky }} /> Saturday: 9:00 AM – 4:00 PM</li>
                        <li className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" style={{ color: C.sky }} /> Sunday: Closed</li>
                    </ul>
                </div>

                <div>
                    <p className="font-black mb-4">Quick Links</p>
                    <ul className="space-y-2.5 text-sm text-white/60">
                        <li><a href="#home" className="hover:text-white transition-colors flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" /> Home</a></li>
                        <li><a href="#services" className="hover:text-white transition-colors flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" /> Services</a></li>
                        <li><a href="#about" className="hover:text-white transition-colors flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" /> About Us</a></li>
                        <li><a href="#contact" className="hover:text-white transition-colors flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" /> Contact</a></li>
                        <li><Link href="/login" className="hover:text-white transition-colors flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" /> Client Login</Link></li>
                        <li><Link href="/register" className="hover:text-white transition-colors flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" /> Book Appointment</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/10 py-5 text-center text-white/40 text-xs px-4">
                &copy; {new Date().getFullYear()} NEVET — NE Veterinary Clinic · Cabanatuan City, Nueva Ecija · All rights reserved.
            </div>
        </footer>
    );
}

// ─── Emergency FAB ────────────────────────────────────────────────────────────

function EmergencyFAB() {
    return (
        <Link href="/emergency"
            className="fixed z-40 flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-black shadow-2xl hover:-translate-y-0.5 transition-all animate-pulse-slow"
            style={{
                background: C.red,
                bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
                right: 'calc(1.25rem + env(safe-area-inset-right))',
            }}>
            <AlertTriangle className="w-4 h-4" /> Emergency
            <style>{`
                @keyframes pulseSlow { 0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); } 50% { box-shadow: 0 0 0 10px rgba(220,38,38,0); } }
                .animate-pulse-slow { animation: pulseSlow 2.2s ease-in-out infinite; }
            `}</style>
        </Link>
    );
}

// ─── Scroll to top ────────────────────────────────────────────────────────────

function ScrollTop() {
    const [show, setShow] = useState(false);
    useEffect(() => {
        const onScroll = () => setShow(window.scrollY > 600);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    if (!show) return null;
    return (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed z-40 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
            style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))', right: 'calc(1.25rem + env(safe-area-inset-right))' }}>
            <ChevronUp className="w-4 h-4" />
        </button>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface HomeProps {
    announcements?: Announcement[];
}

export default function Home(_props: HomeProps) {
    return (
        <div className="antialiased">
            <Head title="NE Veterinary Clinic — Compassionate Pet Care in Cabanatuan City" />
            <Nav />
            <Hero />
            <About />
            <Services />
            <Announcements items={_props.announcements ?? []} />
            <VisitProcess />
            <Testimonials />
            <HealthTips />
            <FindUs />
            <FAQ />
            <FinalCTA />
            <Footer />
            <EmergencyFAB />
            <ScrollTop />
        </div>
    );
}