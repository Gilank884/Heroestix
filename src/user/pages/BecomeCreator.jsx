import React from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { motion } from "framer-motion";
import { HiRocketLaunch, HiCurrencyDollar, HiPresentationChartLine } from "react-icons/hi2";
import { MdPeopleAlt } from "react-icons/md";
import { getSubdomainUrl } from "../../lib/navigation";


const BecomeCreator = () => {
    const benefits = [
        {
            icon: <HiRocketLaunch size={32} />,
            title: "Mudah & Cepat",
            description: "Buat event dan mulai jualan tiket hanya dalam hitungan menit.",
            variant: "light"
        },
        {
            icon: <HiCurrencyDollar size={32} />,
            title: "Komisi Rendah",
            description: "Nikmati bagi hasil yang kompetitif dan transparan untuk setiap tiket.",
            variant: "dark"
        },
        {
            icon: <HiPresentationChartLine size={32} />,
            title: "Analitik Real-time",
            description: "Pantau performa penjualan event kamu kapan saja dengan dashboard canggih.",
            variant: "dark"
        },
        {
            icon: <MdPeopleAlt size={32} />,
            title: "Dukungan 24/7",
            description: "Tim support kami siap membantu kendala event kamu kapanpun dibutuhkan.",
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
                                { title: "Real-time Analytics", desc: "Pantau performa penjualan tiket secara langsung kapan saja." },
                                { title: "Pencairan Dana Cepat", desc: "Withdraw pendapatan hasil penjualan tiket kapanpun Anda butuhkan." },
                                { title: "Promosi Otomatis", desc: "Jangkau ribuan calon pembeli melalui jaringan promosi kami." },
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                                    className="flex gap-4"
                                >
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-1">
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                                        <p className="text-slate-500">{item.desc}</p>
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
                                                text-2xl md:text-3xl font-bold px-2
                                                ${isDark ? 'bg-white text-slate-900' : 'bg-blue-300 text-slate-900'}
                                            `}>
                                                {benefit.title}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-start gap-6">
                                            {/* Arrow Link */}
                                            <div className="mt-auto pt-10">
                                                <div className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-transform duration-300 group-hover:rotate-45
                                                    ${isDark ? 'border-white/20 bg-white/10 text-white' : 'border-slate-900 bg-transparent text-slate-900'}
                                                `}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                                        <polyline points="7 7 17 7 17 17"></polyline>
                                                    </svg>
                                                </div>
                                                <span className={`block mt-3 text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Learn more</span>
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

            {/* Steps - Clean & Minimalist */}
            <section className="py-32 px-6 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <h2 className="text-4xl font-black text-slate-900 leading-tight">Mulai Dalam 3 Langkah Sederhana</h2>
                            <div className="space-y-10">
                                {[
                                    { step: "01", title: "Registrasi Akun", desc: "Daftar dan lengkapi profil creator kamu." },
                                    { step: "02", title: "Buat Event", desc: "Upload detail event, tiket, dan poster." },
                                    { step: "03", title: "Publikasi", desc: "Event kamu siap dikunjungi dan tiket siap terjual." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-8 items-start group">
                                        <span className="text-4xl font-black text-blue-100 group-hover:text-blue-600 transition-colors duration-500">{item.step}</span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xl mb-2">{item.title}</h4>
                                            <p className="text-slate-500 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-blue-100 rounded-[3rem] blur-2xl opacity-20" />
                            <div className="relative bg-white p-4 rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)]">
                                <div className="bg-slate-50 w-full aspect-[4/3] rounded-[2.5rem] flex items-center justify-center overflow-hidden">
                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                        <HiPresentationChartLine size={48} />
                                        <span className="text-xs font-black uppercase tracking-widest italic">Dashboard Preview</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA - Home Style Box */}
            <section className="py-24 px-6 bg-white pb-40">
                <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3.5rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-900/40">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                    <h2 className="text-3xl md:text-5xl font-black mb-10 relative z-10 tracking-tight leading-tight">Siap Menghidupkan Event Kamu?</h2>
                    <p className="text-slate-400 mb-12 text-lg max-w-2xl mx-auto relative z-10 font-medium">
                        Bergabunglah dengan ribuan creator lainnya dan berikan pengalaman tak terlupakan bagi audiens kamu.
                    </p>
                    <div className="flex justify-center relative z-10">
                        <a
                            href={getSubdomainUrl("creator", "/daftar")}
                            className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black tracking-widest uppercase text-sm hover:bg-blue-700 transition-all hover:scale-105"
                        >
                            Mulai Sekarang
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default BecomeCreator;
