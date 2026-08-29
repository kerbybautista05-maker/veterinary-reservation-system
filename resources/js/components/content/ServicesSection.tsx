import { HeartPulse, UserRound, Sparkles, Syringe, Ambulance, Stethoscope } from 'lucide-react';

const services = [
    {
        icon: HeartPulse,
        title: 'Wellness Exams',
        description: 'Thorough checkups, physical assessments, nutritional counseling, and preventive care plans tailored to your pet.',
        popular: true,
    },
    {
        icon: Syringe,
        title: 'Vaccinations',
        description: 'Core and lifestyle vaccines on a schedule tailored to your pet, protecting against life-threatening preventable diseases.',
        popular: true,
    },
    {
        icon: UserRound,
        title: 'Surgery',
        description: 'Soft tissue, orthopedic, and dental surgical procedures performed with modern equipment and gentle post-operative care.',
        popular: false,
    },
    {
        icon: Sparkles,
        title: 'Dental Care',
        description: 'Scaling, polishing, and oral health assessments for fresh breath and healthy gums. Prevent dental disease before it starts.',
        popular: false,
    },
    {
        icon: Ambulance,
        title: 'Emergency Care',
        description: 'Urgent consultations and stabilization for sudden illness or injury. Our team is ready when your pet needs us most.',
        popular: false,
    },
    {
        icon: Stethoscope,
        title: 'Health Monitoring',
        description: 'Ongoing health tracking, follow-up reminders, and medical records accessible anytime through your account.',
        popular: false,
    },
];

export default function ServicesSection() {
    return (
        <section id="services" className="py-24" style={{ background: '#F0F6FF' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <span
                        className="inline-block text-[10px] font-black uppercase tracking-[0.22em] px-4 py-1.5 rounded-full mb-4"
                        style={{ background: '#DBEAFE', color: '#1D6FA5' }}
                    >
                        Veterinary Services
                    </span>
                    <h2
                        className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight"
                        style={{ fontFamily: "'Georgia', serif" }}
                    >
                        Complete Pet Care Under One Roof
                    </h2>
                    <p className="text-gray-500 text-lg max-w-md mx-auto">
                        From wellness exams to emergency care — expert veterinary services for every stage of your pet's life.
                    </p>
                </div>

                {/* Card grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {services.map(({ icon: Icon, title, description, popular }) => (
                        <div
                            key={title}
                            className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#1D6FA5]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Popular badge */}
                            {popular && (
                                <span
                                    className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                    style={{ background: '#1D6FA5', color: '#fff' }}
                                >
                                    Popular
                                </span>
                            )}

                            {/* Icon */}
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                                style={{ background: '#DBEAFE' }}
                            >
                                <Icon className="w-5 h-5" style={{ color: '#1D6FA5' }} />
                            </div>

                            <h3 className="text-sm font-black text-gray-900 mb-2 leading-snug pr-12">{title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-5">{description}</p>

                            <a
                                href="#contact"
                                className="inline-flex items-center gap-1 text-sm font-bold"
                                style={{ color: '#1D6FA5' }}
                            >
                                Learn More
                            </a>
                        </div>
                    ))}
                </div>

                {/* Note */}
                <div className="mt-10 text-center">
                    <p className="text-sm text-gray-400 max-w-lg mx-auto">
                        Consultation fees vary by service type. Our team is happy to give you an estimate — just contact the clinic or book online.
                    </p>
                </div>
            </div>
        </section>
    );
}
