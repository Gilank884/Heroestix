import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/Layout/Navbar";
import BottomBar from "../../components/Layout/Footer";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Upload,
    CheckCircle2,
    XCircle,
    User,
    Loader2,
    ShieldCheck,
    AlertCircle,
    Copy,
    Image as ImageIcon,
    MoveRight,
    MessageCircle,
    ExternalLink,
    Info
} from "lucide-react";
import { Link } from "react-router-dom";

export default function TicketValidation() {
    const [mode, setMode] = useState("manual"); // "manual" or "image"
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleManualSubmit = async (e) => {
        if (e) e.preventDefault();
        validateTicket(inputValue);
    };

    const validateTicket = async (code) => {
        if (!code) return;
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const cleanCode = code.trim();
            const { data, error: fetchError } = await supabase
                .from("tickets")
                .select("id,qr_code,status,full_name,ticket_types(events(id,title))")
                .eq("qr_code", cleanCode)
                .single();

            if (fetchError || !data) {
                setError("Opps! Tiket tidak ditemukan. Silakan periksa kembali kodenya.");
            } else {
                setResult(data);
            }
        } catch (err) {
            setError("Gagal memverifikasi. Silakan coba lagi sebentar lagi.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const html5QrCode = new Html5Qrcode("reader");
            const decodedResult = await html5QrCode.scanFile(file, true);
            validateTicket(decodedResult);
        } catch (err) {
            setError("Waduh, QR Code tidak terbaca. Gunakan foto yang lebih terang dan jelas ya!");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFF] dark:bg-[#020617] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-600">
            <Navbar />

            <main className="flex-1 relative flex flex-col items-center justify-center px-4 py-24 overflow-hidden">
                {/* Dynamic Background Blurs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.03, 0.05, 0.03]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-blue-600 blur-[150px] rounded-full pointer-events-none"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        opacity: [0.03, 0.05, 0.03]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-indigo-600 blur-[150px] rounded-full pointer-events-none"
                />

                <div className="max-w-xl w-full relative z-10 space-y-12 mt-10">
                    {/* Header: Centered & Minimal */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-6"
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full shadow-sm cursor-default"
                        >
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Live Ticket Verifier</span>
                        </motion.div>
                        <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                            Cek <span className="text-blue-600">Tiket</span>
                        </h1>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold max-w-sm mx-auto">
                            Validasi keaslian tiket event Anda secara instan dan aman melalui sistem HeroesTix.
                        </p>
                    </motion.div>

                    {/* Interaction Hub */}
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-blue-900/10 p-3"
                        >
                            {/* Premium Tab Switcher */}
                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50/50 dark:bg-slate-800/40 rounded-[3rem]">
                                <button
                                    onClick={() => { setMode("manual"); setResult(null); setError(null); }}
                                    className={`relative flex items-center justify-center gap-3 py-5 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${mode === "manual" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xl shadow-blue-900/5 ring-1 ring-slate-100 dark:ring-slate-800" : "text-slate-400 hover:text-slate-500"}`}
                                >
                                    <Search size={18} /> Guna Kode
                                </button>
                                <button
                                    onClick={() => { setMode("image"); setResult(null); setError(null); }}
                                    className={`relative flex items-center justify-center gap-3 py-5 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${mode === "image" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xl shadow-blue-900/5 ring-1 ring-slate-100 dark:ring-slate-800" : "text-slate-400 hover:text-slate-500"}`}
                                >
                                    <Upload size={18} /> Unggah Foto
                                </button>
                            </div>

                            <div className="px-6 py-10">
                                <AnimatePresence mode="wait">
                                    {mode === "manual" ? (
                                        <motion.form
                                            key="manual"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            onSubmit={handleManualSubmit}
                                            className="space-y-5"
                                        >
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                                                    placeholder="TULIS KODE QR DISINI"
                                                    className="w-full px-8 py-7 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent rounded-[2.5rem] text-3xl font-black text-slate-900 dark:text-white outline-none focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-200 text-center uppercase tracking-tighter"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loading || !inputValue}
                                                className="w-full py-7 bg-[#1a36c7] hover:bg-blue-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-blue-900/30 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-40"
                                            >
                                                {loading ? <Loader2 className="animate-spin" size={24} /> : <>VERIFIKASI SEKARANG <MoveRight size={20} /></>}
                                            </button>
                                        </motion.form>
                                    ) : (
                                        <motion.div
                                            key="image"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="space-y-6"
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                disabled={loading}
                                                className="w-full h-52 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center gap-5 hover:border-blue-500/40 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group"
                                            >
                                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-100 transition-all shadow-sm">
                                                    <ImageIcon size={36} />
                                                </div>
                                                <div className="text-center px-10">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Pilih Gambar Tiket</p>
                                                    <p className="text-[11px] text-slate-400 font-bold mt-1.5">Klik untuk mengunggah screenshot QR Tiket</p>
                                                </div>
                                            </button>
                                            <div id="reader" className="hidden"></div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Instructional Tip */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="px-8 flex items-center gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-500"
                        >
                            <Info size={14} className="text-blue-500" />
                            Kode tiket biasanya terdiri dari 12 karakter alfanumerik.
                        </motion.div>
                    </div>

                    {/* Result Display Hub */}
                    <div className="min-h-[300px] pt-4">
                        <AnimatePresence mode="wait">
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-center py-20 space-y-6"
                                >
                                    <div className="relative inline-block">
                                        <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ShieldCheck size={28} className="text-blue-600 animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.5em] animate-pulse">Menghubungkan Server...</p>
                                </motion.div>
                            )}

                            {error && !loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/40 rounded-[2.5rem] p-10 flex flex-col items-center text-center gap-6"
                                >
                                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600">
                                        <AlertCircle size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black text-red-900 dark:text-red-400 uppercase tracking-tight">Verifikasi Gagal</h4>
                                        <p className="text-red-600/70 dark:text-red-300/60 text-sm font-bold max-w-xs">{error}</p>
                                    </div>
                                    <button
                                        onClick={() => setError(null)}
                                        className="px-8 py-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all"
                                    >
                                        Coba Lagi
                                    </button>
                                </motion.div>
                            )}

                            {result && !loading && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-3xl shadow-blue-900/5 dark:shadow-none overflow-hidden"
                                >
                                    {/* Success/Used Status Header */}
                                    <div className={`px-10 py-12 flex flex-col items-center text-center gap-6 ${result.status === 'unused' ? 'bg-green-50/30 dark:bg-green-900/5' : 'bg-red-50/30 dark:bg-red-900/5'}`}>
                                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl ${result.status === 'unused' ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-red-500 text-white shadow-red-500/30'}`}>
                                            {result.status === 'unused' ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className={`text-5xl font-black tracking-tighter leading-none ${result.status === 'unused' ? 'text-green-600' : 'text-red-600'}`}>
                                                {result.status === 'unused' ? 'VALID' : 'EXPIRED'}
                                            </h3>
                                            <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[0.3em]">{result.status === 'unused' ? 'Tiket Asli HeroesTix' : 'Tiket Sudah Digunakan'}</p>
                                        </div>
                                    </div>

                                    {/* Event Context Card */}
                                    <div className="px-5 pb-5">
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] p-8 space-y-10">
                                                {/* Event Info Row */}
                                                <div className="border-b border-slate-200/50 dark:border-slate-700/50 pb-8 text-center">
                                                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Event</p>
                                                    <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase">
                                                        {result.ticket_types?.events?.title}
                                                    </h4>
                                                </div>

                                                {/* Order Details Grid */}
                                                <div className="space-y-6">
                                                    <div className="space-y-2 text-center">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemegang Tiket</p>
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                                <User size={18} />
                                                            </div>
                                                            <p className="font-black text-slate-900 dark:text-white text-xl uppercase">{result.full_name || "HEROES_MEMBER"}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-2 text-center border-t border-slate-200/50 dark:border-slate-700/50 pt-6">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode Verifikasi</p>
                                                        <div className="flex items-center justify-center gap-3">
                                                            <p className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-wider uppercase">{result.qr_code}</p>
                                                            <button
                                                                onClick={() => { navigator.clipboard.writeText(result.qr_code); alert("Kode tersalin!"); }}
                                                                className="p-1.5 px-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 hover:text-blue-600 transition-colors shadow-sm"
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col gap-3 pt-4">
                                                <button
                                                    onClick={() => { setResult(null); setInputValue(""); }}
                                                    className="w-full py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                                                >
                                                    Selesai
                                                </button>
                                                {result.status === 'unused' ? (
                                                    <Link
                                                        to={`/event/${result.ticket_types?.events?.id}`}
                                                        className="w-full py-5 bg-[#1a36c7] text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                                                    >
                                                        <ExternalLink size={14} /> Halaman Event
                                                    </Link>
                                                ) : (
                                                    <a
                                                        href="https://wa.me/6282332901726"
                                                        target="_blank"
                                                        className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3"
                                                    >
                                                        <MessageCircle size={14} /> Hubungi CS
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center space-y-6 opacity-40 px-10"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
                            <ShieldCheck size={20} className="text-slate-400 shrink-0" />
                            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] leading-relaxed">
                            Secured by HeroesGate AI Verifier &copy; 2026
                        </p>
                    </motion.div>
                </div>
            </main>

            <BottomBar />

            <style dangerouslySetInnerHTML={{
                __html: `
                body { scrollbar-width: none; }
                body::-webkit-scrollbar { display: none; }
                @keyframes orbit {
                    from { transform: rotate(0deg) translateX(100px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
                }
            ` }} />
        </div>
    );
}
