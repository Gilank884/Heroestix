import React from "react";
import { motion } from "framer-motion";

const AboutVision = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-[#b1451a]/5 rounded-full blur-2xl" />
                        <span className="text-sm font-black text-[#b1451a] tracking-widest uppercase mb-4 block">Visi & Misi</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight mb-8">
                            Visi Kami Adalah <br />
                            <span className="text-[#b1451a]">Digitalisasi Event.</span>
                        </h2>
                        <div className="space-y-6 text-slate-500 font-medium text-lg leading-relaxed">
                            <p>
                                Visi kami adalah menjadi ekosistem digital ticketing nomor satu di Indonesia yang memberikan kemudahan mutlak bagi penyelenggara event dan pembeli tiket.
                            </p>
                            <p>
                                Kami berkomitmen untuk menghadirkan teknologi gate-entry yang cepat, sistem e-ticket yang aman, dan proses manajemen event yang sepenuhnya terotomasi.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative grid grid-cols-2 gap-4"
                    >
                        {/* Decorative image blocks representing energy/events */}
                        <div className="space-y-4">
                            <div className="h-64 rounded-3xl bg-gradient-to-b from-[#b1451a] to-[#d66a4a] shadow-xl overflow-hidden flex items-center justify-center p-8">
                                <p className="text-white text-3xl font-black text-center leading-none">Kecepatan</p>
                            </div>
                            <div className="h-44 rounded-3xl bg-slate-100 flex items-center justify-center">
                                <div className="w-12 h-12 bg-[#b1451a]/20 rounded-full animate-ping" />
                            </div>
                        </div>
                        <div className="space-y-4 pt-12">
                            <div className="h-44 rounded-3xl bg-[#fdf5f2] flex items-center justify-center">
                                <div className="w-16 h-1 w-16 bg-[#b1451a] rounded-full blur-sm animate-pulse" />
                            </div>
                            <div className="h-64 rounded-3xl bg-slate-900 shadow-2xl overflow-hidden flex items-center justify-center p-8 text-center text-white">
                                <p className="text-2xl font-black italic opacity-50 tracking-widest">TRANSPARANSI</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AboutVision;
