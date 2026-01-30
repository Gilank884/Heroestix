import React from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { motion } from "framer-motion";
import { HiRocketLaunch, HiCurrencyDollar, HiPresentationChartLine } from "react-icons/hi2";
import { getSubdomainUrl } from "../../lib/navigation";


const BecomeCreator = () => {
    const benefits = [
        {
            icon: <HiRocketLaunch size={32} className="text-blue-600" />,
            title: "Mudah & Cepat",
            description: "Buat event dan mulai jualan tiket hanya dalam hitungan menit.",
            bgColor: "bg-blue-50/50",
            borderColor: "border-blue-100"
        },
        {
            icon: <HiCurrencyDollar size={32} className="text-blue-600" />,
            title: "Komisi Rendah",
            description: "Nikmati bagi hasil yang kompetitif dan transparan untuk setiap tiket.",
            bgColor: "bg-blue-50/50",
            borderColor: "border-blue-100"
        },
        {
            icon: <HiPresentationChartLine size={32} className="text-blue-600" />,
            title: "Analitik Real-time",
            description: "Pantau performa penjualan event kamu kapan saja dengan dashboard canggih.",
            bgColor: "bg-blue-50/50",
            borderColor: "border-blue-100"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section - Professional & Tech-focused */}
            <section className="relative pt-40 pb-28 px-6 overflow-hidden">
                {/* Modern Grid Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />
                </div>

                {/* Decorative Blobs */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-40 z-0" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-50 rounded-full blur-[120px] opacity-60 z-0" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/5 border border-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-10 shadow-sm"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Mitra Creator Portal
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.95]"
                    >
                        Jadi Bagian dari <br />
                        <span className="text-blue-600">Ekosistem Event</span> Terbesar
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-14 font-medium leading-relaxed"
                    >
                        Kelola event kamu dengan profesional, jangkau audiens lebih luas, <br className="hidden md:block" />
                        dan tingkatkan pendapatan kamu bersama platform terbaik.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col sm:flex-row justify-center items-center gap-5"
                    >
                        <a
                            href={getSubdomainUrl("creator", "/daftar")}
                            className="w-full sm:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] font-black tracking-wide shadow-2xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm uppercase"
                        >
                            Daftar Sekarang
                        </a>
                        <a
                            href={getSubdomainUrl("creator", "/masuk")}
                            className="w-full sm:w-auto px-12 py-5 bg-white text-slate-900 rounded-[1.25rem] font-bold tracking-wide border border-slate-200 hover:border-slate-800 transition-all active:scale-[0.98] text-sm"
                        >
                            Masuk Dashboard
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Benefits - Home Style Cards */}
            <section className="py-24 px-6 bg-slate-50/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900">Mengapa Memilih Kami?</h2>
                        <div className="w-12 h-1.5 bg-blue-600 mx-auto mt-6 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-10 rounded-[2.5rem] border ${benefit.borderColor} ${benefit.bgColor} flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 border border-slate-50">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">{benefit.title}</h3>
                                <p className="text-slate-600 leading-relaxed font-medium">{benefit.description}</p>
                            </motion.div>
                        ))}
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
