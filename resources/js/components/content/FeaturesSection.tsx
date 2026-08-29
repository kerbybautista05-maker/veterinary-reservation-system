import { CalendarCheck, Stethoscope, ClipboardCheck, Bell, Heart, UserRound, ArrowRight } from 'lucide-react';

const steps = [
    {
        icon: CalendarCheck,
        step: '01',
        title: 'Book an Appointment',
        description: 'Create a free account, add your pet, and schedule a visit online in minutes. Choose your preferred date, time, and service type.',
    },
    {
        icon: Stethoscope,
        step: '02',
        title: 'Visit the Clinic',
        description: 'Arrive at our clinic in Cabanatuan City where our friendly staff and licensed veterinarians welcome you and your pet.',
    },
    {
        icon: ClipboardCheck,
        step: '03',
        title: 'Receive Professional Care',
        description: 'Thorough examinations, vaccinations, surgery, or dental care — delivered with modern equipment and gentle protocols.',
    },
    {
        icon: Bell,
        step: '04',
        title: 'Stay Notified',
        description: 'Get in-app and email notifications for appointment reminders, health alerts, and follow-up schedules.',
    },
    {
        icon: Heart,
        step: '05',
        title: 'Ongoing Wellness',
        description: 'Access your pet\'s medical records, track vaccinations, and receive health reminders anytime from your account.',
    },
    {
        icon: UserRound,
        step: '06',
        title: 'Complete Pet Management',
        description: 'Manage multiple pets, view appointment history, and keep your beloved companions healthy throughout their lives.',
    },
];

const flowSteps = ['Register', 'Book', 'Visit', 'Care', 'Recover', 'Thrive'];

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <span
                        className="inline-block text-[10px] font-black uppercase tracking-[0.22em] px-4 py-1.5 rounded-full mb-4"
                        style={{ background: '#E3F2FD', color: '#1D6FA5' }}
                    >
                        How It Works
                    </span>
                    <h2
                        className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight"
                        style={{ fontFamily: "'Georgia', serif" }}
                    >
                        From Booking to Wellness
                    </h2>
                    <p className="text-gray-500 text-lg max-w-md mx-auto">
                        Six simple steps to keep your pet healthy and happy.
                    </p>
                </div>

                {/* Step cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {steps.map(({ icon: Icon, step, title, description }) => (
                        <div
                            key={step}
                            className="group relative p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-[#1D6FA5]/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Watermark number */}
                            <span
                                className="absolute -bottom-3 -right-1 text-[80px] font-black leading-none select-none pointer-events-none"
                                style={{ color: '#1D6FA5', opacity: 0.04 }}
                            >
                                {step}
                            </span>

                            {/* Icon */}
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:shadow-md"
                                style={{ background: '#E3F2FD' }}
                            >
                                <Icon className="w-5 h-5" style={{ color: '#1D6FA5' }} />
                            </div>

                            {/* Step pill */}
                            <span
                                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-3 inline-block"
                                style={{ background: '#E3F2FD', color: '#1D6FA5' }}
                            >
                                Step {step}
                            </span>

                            <h3 className="text-sm font-black text-gray-900 mb-2">{title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                        </div>
                    ))}
                </div>

                {/* Flow indicator bar */}
                <div
                    className="mt-14 rounded-2xl px-7 py-8"
                    style={{ background: 'linear-gradient(135deg, #0B2545 0%, #1D6FA5 100%)' }}
                >
                    <p className="text-center text-white/60 text-[10px] font-black uppercase tracking-[0.25em] mb-6">
                        Your Visit Flow
                    </p>
                    <div className="flex items-center justify-center flex-wrap gap-1">
                        {flowSteps.map((label, i) => (
                            <div key={label} className="flex items-center gap-1">
                                <div
                                    className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-2 rounded-lg whitespace-nowrap"
                                >
                                    <span
                                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black"
                                        style={{ background: 'rgba(255,255,255,0.2)' }}
                                    >
                                        {i + 1}
                                    </span>
                                    {label}
                                </div>
                                {i < flowSteps.length - 1 && (
                                    <ArrowRight className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
