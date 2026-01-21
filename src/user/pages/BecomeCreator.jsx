import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { motion } from "framer-motion";
import { HiCheckCircle, HiRocketLaunch, HiCurrencyDollar, HiPresentationChartLine } from "react-icons/hi2";

const BecomeCreator = () => {
    const benefits = [
        {
            icon: <HiRocketLaunch className="text-4xl text-orange-500" />,
            title: "Mudah & Cepat",
            description: "Buat event dan mulai jualan tiket hanya dalam hitungan menit."
        },
        {
            icon: <HiCurrencyDollar className="text-4xl text-green-500" />,
            title: "Komisi Rendah",
            description: "Nikmati bagi hasil yang kompetitif dan transparan untuk setiap tiket."
        },
        {
            icon: <HiPresentationChartLine className="text-4xl text-blue-500" />,
            title: "Analitik Real-time",
            description: "Pantau performa penjualan event kamu kapan saja dengan dashboard canggih."
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar showSearch={false} />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black tracking-tight mb-6"
                    >
                        Jadi Bagian dari <span className="text-orange-500">Ekosistem Event</span> Terbesar
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10"
                    >
                        Kelola event kamu dengan profesional, jangkau audiens lebih luas, dan tingkatkan pendapatan kamu bersama Hai-Ticket.
                    </motion.p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a
                            href="http://creator.localhost:3000/daftar"
                            className="px-10 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black tracking-wide shadow-xl shadow-orange-900/20 transition-all transform hover:scale-105"
                        >
                            Daftar Sebagai Creator
                        </a>
                        <a
                            href="http://creator.localhost:3000/masuk"
                            className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black tracking-wide border border-white/10 backdrop-blur-sm transition-all"
                        >
                            Masuk Dashboard Creator
                        </a>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-slate-900">Mengapa Memilih Kami?</h2>
                    <div className="w-20 h-1.5 bg-orange-500 mx-auto mt-4 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-3xl border border-slate-100 hover:shadow-2xl hover:shadow-orange-500/5 transition-all"
                        >
                            <div className="mb-6 flex justify-center">{benefit.icon}</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                            <p className="text-slate-500 leading-relaxed">{benefit.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Steps */}
            <section className="py-24 bg-slate-50 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 mb-8 leading-tight">Mulai Dalam 3 Langkah Sederhana</h2>
                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Registrasi Akun", desc: "Daftar dan lengkapi profil creator kamu." },
                                    { step: "02", title: "Buat Event", desc: "Upload detail event, tiket, dan poster." },
                                    { step: "03", title: "Publikasi", desc: "Event kamu siap dikunjungi dan tiket siap terjual." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <span className="text-3xl font-black text-orange-200">{item.step}</span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{item.title}</h4>
                                            <p className="text-slate-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-slate-200">
                            <div className="bg-slate-100 w-full aspect-video rounded-3xl flex items-center justify-center text-slate-400 font-bold">
                                Visual Dashboard Preview
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4">
                <div className="max-w-5xl mx-auto bg-orange-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-orange-500/20">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32" />
                    <h2 className="text-3xl md:text-5xl font-black mb-8 relative z-10">Siap Menghidupkan Event Kamu?</h2>
                    <p className="text-orange-100 mb-12 text-lg max-w-2xl mx-auto relative z-10">
                        Bergabunglah dengan ribuan creator lainnya dan berikan pengalaman tak terlupakan bagi audiens kamu.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                        <a
                            href="http://creator.localhost:3000/daftar"
                            className="px-12 py-5 bg-white text-orange-600 rounded-2xl font-black tracking-widest uppercase text-sm hover:bg-slate-50 transition-colors"
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
