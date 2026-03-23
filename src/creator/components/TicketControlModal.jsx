import React, { useState } from 'react';
import { X, QrCode, Search, CheckCircle, AlertCircle, Info, Scan, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

const TicketControlModal = ({ isOpen, onClose }) => {
    const [qrValue, setQrValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticketInfo, setTicketInfo] = useState(null);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSearch = async () => {
        if (!qrValue.trim()) return;
        setLoading(true);
        setError(null);
        setTicketInfo(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    ticket_types (
                        name,
                        events (
                            title
                        )
                    )
                `)
                .eq('qr_code', qrValue.trim())
                .single();

            if (fetchError || !data) {
                setError("Data tiket tidak ditemukan atau kode QR tidak valid.");
            } else {
                setTicketInfo(data);
            }
        } catch (err) {
            setError("Gagal melakukan pencarian tiket.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAccess = async () => {
        if (!ticketInfo) return;
        setLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('tickets')
                .update({ status: 'used' })
                .eq('id', ticketInfo.id);

            if (updateError) throw updateError;

            setTicketInfo(prev => ({ ...prev, status: 'used' }));
        } catch (err) {
            alert("Error verifikasi akses: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                        onClick={onClose} 
                    />

                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                                    <Scan size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Control</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Ticket Verification System</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all active:scale-90"
                            >
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-10">
                            {/* Search Area */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Manual QR / Ticket ID Entry</label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            value={qrValue}
                                            onChange={(e) => setQrValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Masukkan Kode QR..."
                                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearch}
                                        disabled={loading || !qrValue.trim()}
                                        className="bg-slate-900 text-white px-10 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-30 disabled:hover:bg-slate-900 active:scale-95 shadow-xl shadow-slate-200"
                                    >
                                        {loading ? "..." : "CARI"}
                                    </button>
                                </div>
                            </div>

                            {/* Info Message */}
                            <div className="bg-blue-50/50 border border-blue-100/50 p-6 rounded-3xl flex gap-4">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-blue-100">
                                    <Info size={16} />
                                </div>
                                <p className="text-xs text-blue-900 font-bold leading-relaxed uppercase tracking-wider">
                                    Dalam lingkungan produksi, modul ini akan terhubung dengan kamera untuk pemindaian langsung. Gunakan input manual untuk simulasi.
                                </p>
                            </div>

                            {/* Result Area */}
                            <div className="min-h-[250px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2.5rem] p-10 bg-slate-50/30">
                                {ticketInfo ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full space-y-8"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ticket Class</p>
                                                <p className="text-3xl font-black text-slate-900 tracking-tighter">{ticketInfo.ticket_types?.name}</p>
                                            </div>
                                            <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${ticketInfo.status === 'unused' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                                                }`}>
                                                <div className={`w-2 h-2 rounded-full ${ticketInfo.status === 'unused' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                {ticketInfo.status === 'unused' ? 'Ready for Entry' : 'Already Used'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Event</p>
                                                <p className="text-sm font-black text-slate-700 uppercase tracking-tight line-clamp-1">{ticketInfo.ticket_types?.events?.title}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QR Payload</p>
                                                <p className="text-xs font-mono text-slate-500 break-all">{ticketInfo.qr_code}</p>
                                            </div>
                                        </div>

                                        {ticketInfo.status === 'unused' ? (
                                            <button
                                                onClick={handleVerifyAccess}
                                                disabled={loading}
                                                className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                            >
                                                <ShieldCheck size={20} />
                                                Verify & Authorize Entry
                                            </button>
                                        ) : (
                                            <div className="w-full py-6 bg-slate-100 text-slate-400 rounded-[1.5rem] font-black uppercase tracking-[0.2em] border border-slate-200 flex items-center justify-center gap-3 cursor-not-allowed">
                                                <AlertCircle size={20} />
                                                Ticket Already Scanned
                                            </div>
                                        )}
                                    </motion.div>
                                ) : error ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center space-y-4"
                                    >
                                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-red-100 border border-red-100">
                                            <AlertCircle size={40} />
                                        </div>
                                        <p className="font-black text-slate-900 uppercase tracking-widest text-sm">{error}</p>
                                    </motion.div>
                                ) : (
                                    <div className="text-center space-y-6">
                                        <motion.div 
                                            animate={{ 
                                                scale: [1, 1.1, 1],
                                                opacity: [0.5, 1, 0.5]
                                            }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto shadow-xl shadow-slate-100 border border-white"
                                        >
                                            <QrCode size={48} strokeWidth={1} />
                                        </motion.div>
                                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic">Waiting for scan data...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer hint */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Heroestix Security Protocol v2.5.0</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TicketControlModal;
