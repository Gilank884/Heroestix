import React from 'react';
import { ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const VerificationPending = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-xl w-full text-center space-y-10"
            >
                <div className="relative inline-block">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="w-32 h-32 bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white shadow-2xl shadow-blue-200/20 flex items-center justify-center text-blue-600 relative z-10"
                    >
                        <ShieldCheck size={56} strokeWidth={1.5} />
                    </motion.div>
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-4 -right-4 w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-lg shadow-blue-100/50"
                    >
                        <Sparkles size={20} />
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight text-balance">
                        Akun Dalam <span className="text-blue-600">Peninjauan</span>
                    </h2>
                    <p className="text-slate-400 text-lg font-bold uppercase tracking-widest leading-relaxed max-w-lg mx-auto flex items-center justify-center gap-3">
                        <Clock size={18} className="text-blue-500" /> Verifikasi Profil Sedang Berlangsung
                    </p>
                </div>

                <div className="bg-white/60 backdrop-blur-md border border-white rounded-3xl p-8 shadow-xl shadow-slate-200/20 text-left">
                    <p className="text-slate-500 leading-relaxed font-medium">
                        Halo Creator! Tim kami sedang melakukan verifikasi menyeluruh terhadap profil dan data yang Anda kirimkan. Proses ini dilakukan untuk menjaga keamanan dan kualitas platform Heroestix.
                    </p>
                    <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-black text-xs">
                            24h
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Estimasi waktu verifikasi: <span className="text-slate-900 font-black italic">1x24 jam kerja</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VerificationPending;
