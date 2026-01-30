import React from "react";
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import { motion } from "framer-motion";

export default function AboutUsPage() {
    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <main>
                {/* Hero Section - Home Style */}
                <section className="pt-40 pb-24 px-6 bg-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8"
                        >
                            Tentang Kami
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-8 leading-tight"
                        >
                            Mendigitalkan <span className="text-blue-600">Pengalaman</span> Event Anda
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-500 font-medium leading-relaxed"
                        >
                            Heroestix hadir sebagai solusi modern untuk manajemen tiket dan event.
                            Kami percaya setiap momen berharga layak mendapatkan sistem yang mulus, aman, dan efisien.
                        </motion.p>
                    </div>
                </section>

                {/* Mission Section - Clean Grid */}
                <section className="py-24 px-6 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                    Visi Kami untuk <br />
                                    <span className="text-blue-600">Masa Depan Event</span>
                                </h2>
                                <p className="text-slate-600 text-lg font-medium leading-relaxed">
                                    Menjadi platform ticketing terpercaya yang menghubungkan creator dengan audiens melalui teknologi inovatif dan layanan yang berfokus pada pengguna.
                                </p>
                                <div className="grid grid-cols-2 gap-8 pt-4">
                                    <div>
                                        <div className="text-3xl font-black text-blue-600 mb-1">100%</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaksi Aman</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-blue-600 mb-1">24/7</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dukungan Sistem</div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-blue-100 rounded-[3rem] blur-2xl opacity-20" />
                                <div className="relative aspect-video rounded-[2.5rem] bg-slate-200 overflow-hidden border border-slate-100 shadow-2xl">
                                    <img
                                        src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000"
                                        alt="Vision"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-32 px-6 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nilai-Nilai Kami</h2>
                            <div className="w-12 h-1.5 bg-blue-600 mx-auto mt-6 rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "Inovasi", desc: "Terus mengembangkan fitur-fitur baru mengikuti tren teknologi terkini." },
                                { title: "Integritas", desc: "Menjaga kepercayaan pengguna dengan transparansi dan keamanan data." },
                                { title: "Kolaborasi", desc: "Membangun ekosistem yang saling menguntungkan bagi semua pihak." }
                            ].map((value, idx) => (
                                <div
                                    key={idx}
                                    className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 font-black text-xl">
                                        {idx + 1}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">{value.title}</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">
                                        {value.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
