import React from "react";
import { motion } from "framer-motion";

const AboutHero = () => {
    return (
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#fdf5f2]">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 45, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] bg-[#b1451a]/10 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -45, 0],
                        opacity: [0.1, 0.15, 0.1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/4 -right-1/4 w-[70vw] h-[70vw] bg-[#f28b2a]/10 rounded-full blur-[100px]"
                />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="inline-block px-4 py-1.5 mb-6 text-xs font-black tracking-[0.2em] uppercase text-[#b1451a] bg-[#b1451a]/10 rounded-full">
                        Tentang Hai-Ticket
                    </span>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-800 tracking-tighter leading-[0.9] mb-8">
                        Solusi Tiket <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b1451a] to-[#d66a4a]">
                            Tanpa Ribet.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                        Hai-Ticket hadir sebagai platform ticketing digital terdepan yang memudahkan Anda dalam memesan, mengelola, dan mendistribusikan tiket event dengan sistem yang aman dan instan.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                    className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <div className="flex -space-x-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-12 h-12 rounded-full border-4 border-white overflow-hidden shadow-sm">
                                <img src={`https://ui-avatars.com/api/?name=U${i}&background=b1451a&color=fff`} alt="User" />
                            </div>
                        ))}
                    </div>
                    <p className="text-sm font-bold text-slate-400">
                        Dipercaya oleh <span className="text-slate-800">5,000+</span> Pengguna Aktif
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default AboutHero;
