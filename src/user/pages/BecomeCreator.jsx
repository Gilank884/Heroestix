import { useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { HiRocketLaunch, HiCurrencyDollar, HiPresentationChartLine, HiMegaphone, HiCheckBadge, HiUserCircle, HiCalendar, HiTicket } from "react-icons/hi2";
import { MdPeopleAlt, MdVerified } from "react-icons/md";
import { FiUpload, FiCheckCircle } from "react-icons/fi";
import { getSubdomainUrl } from "../../lib/navigation";


const BecomeCreator = () => {
    const [activeStep, setActiveStep] = useState(0);


    const steps = [
        {
            id: 0,
            step: "01",
            title: "Registrasi Akun",
            desc: "Buat akun sebagai Creator atau Event Organizer hanya dalam hitungan detik. Kami akan memverifikasi profilmu agar terlihat profesional dan terpercaya di mata calon pembeli.",
            icon: <HiUserCircle size={24} />
        },
        {
            id: 1,
            step: "02",
            title: "Buat Event",
            desc: "Atur detail eventmu dengan mudah, mulai dari upload poster, lokasi, hingga variasi kategori tiket. Sistem kami mendukung berbagai jenis event, baik online maupun offline.",
            icon: <HiCalendar size={24} />
        },
        {
            id: 2,
            step: "03",
            title: "Publikasi",
            desc: "Tayangkan eventmu ke ribuan audiens Heroestix. Pantau penjualan tiket secara real-time melalui dashboard analytics dan nikmati sistem check-in yang praktis saat hari-H.",
            icon: <HiTicket size={24} />
        }
    ];

    const benefits = [
        {
            icon: <HiRocketLaunch size={32} />,
            title: "Mudah & Cepat",
            description: "Platform kami dirancang untuk kemudahan Anda. Buat event, atur kategori tiket, dan mulai penjualan dalam hitungan menit tanpa proses teknis yang rumit.",
            variant: "light"
        },
        {
            icon: <HiCurrencyDollar size={32} />,
            title: "Komisi Rendah",
            description: "Kami mendukung pertumbuhan creator dengan skema bagi hasil yang sangat kompetitif. Nikmati pendapatan maksimal dari setiap tiket yang terjual.",
            variant: "dark"
        },
        {
            icon: <HiPresentationChartLine size={32} />,
            title: "Analitik Real-time",
            description: "Dapatkan wawasan mendalam tentang audiens Anda. Pantau penjualan tiket, demografi pengunjung, dan tren pendapatan secara real-time.",
            variant: "dark"
        },
        {
            icon: <MdPeopleAlt size={32} />,
            title: "Dukungan 24/7",
            description: "Jangan khawatir jika mengalami kendala. Tim support kami yang berdedikasi siap membantu Anda 24/7 untuk memastikan event berjalan lancar.",
            variant: "light"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section - Redesigned Two Column */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-white">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* LEFT COLUMN: IMAGE + FLOATING CARDS */}
                    <div className="relative">
                        {/* Main Image */}
                        <div className="relative z-10 rounded-[3rem] overflow-hidden bg-blue-50">
                            <img
                                src="/assets/creator.png"
                                alt="Happy Creator"
                                className="w-full h-auto object-cover relative z-10"
                            />
                            {/* Circle Decoration behind image */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-50 opacity-60 z-0"></div>
                        </div>

                        {/* Decoration Blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/5 rounded-full blur-3xl -z-10"></div>

                        {/* Floating Card 1: Income */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="absolute top-10 -left-6 md:-left-12 bg-white p-4 rounded-2xl shadow-xl z-20 flex items-center gap-4 max-w-[200px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <HiCurrencyDollar size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Total Pendapatan</p>
                                <p className="text-sm font-bold text-slate-900">IDR 50.000.000</p>
                            </div>
                        </motion.div>

                        {/* Floating Card 2: Analytics */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7, duration: 0.8 }}
                            className="absolute bottom-20 -right-6 md:-right-10 bg-white p-4 rounded-2xl shadow-xl z-20"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <HiPresentationChartLine size={16} />
                                </div>
                                <span className="text-xs font-bold text-slate-700">Analytics</span>
                            </div>
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="w-[85%] h-full bg-blue-600 rounded-full"></div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 font-medium">Penjualan Tiket <span className="text-blue-600 font-bold">85%</span></p>
                        </motion.div>

                        {/* Floating Card 3: Status */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.8 }}
                            className="absolute -bottom-6 left-10 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl z-20"
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <HiRocketLaunch size={20} className="text-yellow-400" />
                                <span className="text-sm font-bold">Event Live!</span>
                            </div>
                            <p className="text-xs text-slate-400">Siap menerima pesanan</p>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: TEXT CONTENT */}
                    <div className="space-y-8">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                            >

                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6"
                            >
                                Apa Saja Keuntungan Menjadi <span className="text-blue-600">Creator</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-slate-500 text-lg leading-relaxed"
                            >
                                Nikmati berbagai fitur eksklusif yang dirancang khusus untuk memaksimalkan kesuksesan event Anda, dari analitik mendalam hingga pencairan dana instan.
                            </motion.p>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-6">
                            {[
                                {
                                    icon: <HiPresentationChartLine size={24} />,
                                    title: "Real-time Analytics",
                                    desc: "Pantau performa penjualan tiket secara langsung kapan saja.",
                                    color: "from-blue-500 to-blue-600",
                                    shadow: "shadow-blue-500/30"
                                },
                                {
                                    icon: <HiCurrencyDollar size={24} />,
                                    title: "Pencairan Dana Cepat",
                                    desc: "Withdraw pendapatan hasil penjualan tiket kapanpun Anda butuhkan.",
                                    color: "from-violet-500 to-violet-600",
                                    shadow: "shadow-violet-500/30"
                                },
                                {
                                    icon: <HiMegaphone size={24} />,
                                    title: "Promosi Otomatis",
                                    desc: "Jangkau ribuan calon pembeli melalui jaringan promosi kami.",
                                    color: "from-sky-500 to-sky-600",
                                    shadow: "shadow-sky-500/30"
                                },
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                                    className="flex gap-5 items-start group"
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 shadow-lg ${item.shadow} text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                                            {item.icon}
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm">
                                            <HiCheckBadge className="text-green-500" size={20} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                        <p className="text-slate-500 text-sm md:text-base leading-relaxed">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="pt-8 flex flex-wrap gap-4"
                        >
                            <a
                                href={getSubdomainUrl("creator", "/daftar")}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
                            >
                                Daftar Sekarang
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Steps - Journey Timeline Style */}
            <section className="py-24 px-6 bg-slate-50 overflow-hidden relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }}></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-600 font-bold text-xs uppercase tracking-wider mb-4 border border-blue-200">
                            How It Works
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
                            Perjalanan Menjadi Creator
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Ikuti langkah mudah ini dan mulai perjalanan sukses event Anda bersama Heroestix.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Central Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-blue-100 -translate-x-1/2 rounded-full hidden md:block"></div>
                        <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: "100%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute left-1/2 top-0 w-1 bg-gradient-to-b from-blue-600 via-purple-600 to-blue-600 -translate-x-1/2 rounded-full hidden md:block origin-top"
                        >
                        </motion.div>

                        <div className="space-y-12 md:space-y-24 relative">
                            {steps.map((item, i) => {
                                const isEven = i % 2 === 0;
                                return (
                                    <div key={i} className={`flex flex-col md:flex-row items-center justify-between gap-8 ${isEven ? 'md:flex-row-reverse' : ''}`}>

                                        {/* Empty Space for alignment */}
                                        <div className="w-full md:w-[45%]"></div>

                                        {/* Center Node */}
                                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white border-4 border-blue-600 z-10 shadow-[0_0_0_4px_rgba(37,99,235,0.2)] hidden md:flex">
                                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                                        </div>

                                        {/* Content Card */}
                                        <motion.div
                                            initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, margin: "-100px" }}
                                            transition={{ duration: 0.6, delay: i * 0.2 }}
                                            className="w-full md:w-[45%] bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    {item.icon}
                                                </div>
                                                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                    Step {item.step}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                                {item.desc}
                                            </p>

                                            {/* PREVIEW / SIMULATION AREA */}
                                            <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden relative group-hover:shadow-lg transition-all duration-300">
                                                {/* Step 1: Profile Preview */}
                                                {i === 0 && (
                                                    <div className="p-4">
                                                        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse"></div>
                                                            <div className="flex-1">
                                                                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2 animate-pulse"></div>
                                                                <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                                                            </div>
                                                            <MdVerified className="text-green-500 text-xl" />
                                                        </div>
                                                        <div className="mt-4 flex gap-2 justify-center">
                                                            <div className="h-2 w-16 bg-blue-100 rounded-full"></div>
                                                            <div className="h-2 w-8 bg-slate-200 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Step 2: Upload UI */}
                                                {i === 1 && (
                                                    <div className="p-4 bg-slate-900 text-white relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-xs font-bold text-slate-400">Post Artist</span>
                                                            <FiCheckCircle className="text-green-500" />
                                                        </div>
                                                        <div className="w-full h-24 bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 mb-3 cursor-pointer hover:bg-white/10 transition-colors">
                                                            <FiUpload />
                                                            <span className="text-[10px] text-slate-400">Upload Media</span>
                                                        </div>
                                                        <div className="h-8 bg-blue-600 rounded-lg w-full flex items-center justify-center text-xs font-bold">
                                                            Save Event
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Step 3: Ticket Preview */}
                                                {i === 2 && (
                                                    <div className="p-3 relative">
                                                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
                                                            <div className="h-20 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                                                            <div className="p-4">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                                                                    <div className="h-4 w-12 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-[10px] font-bold">
                                                                        $150
                                                                    </div>
                                                                </div>
                                                                <div className="h-3 w-32 bg-slate-100 rounded mb-4"></div>
                                                                <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-center">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                                                                        <div className="h-2 w-12 bg-slate-100 rounded"></div>
                                                                    </div>
                                                                    <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white">
                                                                        <HiTicket size={14} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Ticket Cutouts */}
                                                            <div className="absolute top-[5rem] -left-2 w-4 h-4 bg-slate-50 rounded-full"></div>
                                                            <div className="absolute top-[5rem] -right-2 w-4 h-4 bg-slate-50 rounded-full"></div>
                                                        </div>
                                                        {/* Floating Badge */}
                                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white px-2 py-1 text-[10px] font-bold rounded-lg shadow-md rotate-6">
                                                            LIVE
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-6 flex items-center gap-2 text-slate-400 text-xs font-medium">
                                                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                                </div>
                                                Estimasi: {i === 0 ? '2 Menit' : i === 1 ? '5 Menit' : 'Instan'}
                                            </div>
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Consultation CTA - Dark Theme */}
            <section
                className="py-20 px-6 bg-slate-950 text-center"
            >
                <div className="max-w-4xl mx-auto space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-medium text-white mb-4 tracking-tight leading-tight">
                            Galau? Bingung?
                        </h2>
                        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                            Obrolin dulu aja dengan team Support Heroestix!
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <a
                            href="https://wa.me/6282332901726"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-900/50 transition-all hover:-translate-y-1"
                        >
                            <span>Klik untuk Konsultasi. Gratis!</span>
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Benefits - Bento Grid Style */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-16">
                        <div>
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider rounded mb-4">
                                Services
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 max-w-xl leading-tight">
                                Mengapa Memilih <span className="text-blue-600">Kami?</span>
                            </h2>
                        </div>
                        <p className="max-w-md text-slate-500 font-medium leading-relaxed">
                            Kami menawarkan berbagai layanan digital untuk membantu event Anda tumbuh dan sukses secara online, dengan fitur-fitur terbaik di kelasnya.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {benefits.map((benefit, index) => {
                            const isDark = benefit.variant === 'dark';
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`
                                        group relative p-8 md:p-10 rounded-[2.5rem] border-2 border-slate-900
                                        ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                                        shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-300
                                        flex flex-col justify-between min-h-[320px] overflow-hidden
                                    `}
                                >
                                    {/* Content */}
                                    <div className="relative z-10 w-full">
                                        <div className="inline-block mb-6">
                                            <span className={`
                                                text-2xl md:text-3xl font-bold
                                                ${isDark ? 'text-white' : 'text-slate-900'}
                                            `}>
                                                {benefit.title}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-start gap-6">
                                            {/* Description */}
                                            <div className="mt-auto pt-4 max-w-[65%]">
                                                <p className={`text-sm md:text-base font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    {benefit.description}
                                                </p>
                                            </div>

                                            {/* Icon/Illustration Area */}
                                            <div className="relative">
                                                <div className={`
                                                    w-24 h-24 rounded-2xl flex items-center justify-center
                                                    ${isDark ? 'bg-white/10 text-blue-300' : 'bg-slate-50 text-blue-600'}
                                                 `}>
                                                    {benefit.icon}
                                                </div>
                                                {/* Decorative Elements */}
                                                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 ${isDark ? 'border-blue-400' : 'border-slate-900'}`}></div>
                                                <div className={`absolute -bottom-2 -left-2 w-4 h-4 rounded-full ${isDark ? 'bg-blue-400' : 'bg-slate-900'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>



            <Footer />
        </div>
    );
};

export default BecomeCreator;
