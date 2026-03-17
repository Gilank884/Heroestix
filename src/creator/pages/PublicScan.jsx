import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Html5Qrcode } from 'html5-qrcode';
import {
    QrCode,
    Keyboard,
    CheckCircle2,
    XCircle,
    Search,
    User,
    Ticket,
    ArrowRight,
    Loader2,
    Camera,
    CameraOff,
    Layers,
    Zap
} from 'lucide-react';

export default function PublicScan() {
    const { eventId, token } = useParams();
    const [event, setEvent] = useState(null);
    const [isValidating, setIsValidating] = useState(true);
    const [error, setError] = useState(null);

    const [mode, setMode] = useState('qr'); // 'qr' or 'manual'
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [hasUserClosedCamera, setHasUserClosedCamera] = useState(false);
    const inputRef = useRef(null);
    const scannerRef = useRef(null);
    const scannerContainerId = "public-reader";

    useEffect(() => {
        validateAssistant();
    }, [eventId, token]);

    useEffect(() => {
        if (event && mode === 'qr' && !isCameraActive && !result && !hasUserClosedCamera) {
            // Small delay to ensure DOM is ready for scanner container
            const timer = setTimeout(() => {
                startScanner();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [event, mode, result, hasUserClosedCamera]);

    useEffect(() => {
        if (inputRef.current && mode === 'manual') {
            inputRef.current.focus();
        }
    }, [mode]);

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
            }
        };
    }, []);

    const validateAssistant = async () => {
        setIsValidating(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('events')
                .select('id, title, assistant_token')
                .eq('id', eventId)
                .single();

            if (fetchError || !data || data.assistant_token !== token) {
                setError("Akses Ditolak. Link perbantuan tidak valid.");
            } else {
                setEvent(data);
            }
        } catch (err) {
            setError("Gagal memverifikasi akses.");
        } finally {
            setIsValidating(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
        setIsCameraActive(false);
        setHasUserClosedCamera(true);
    };

    const startScanner = async () => {
        if (scannerRef.current) await stopScanner();

        setIsCameraActive(true);
        setResult(null);
        setHasUserClosedCamera(false);
        
        try {
            const html5QrCode = new Html5Qrcode(scannerContainerId);
            scannerRef.current = html5QrCode;
            
            // Dynamic qrbox size based on container width
            const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
                let minEdgePercentage = 0.7; // 70%
                let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                return {
                    width: qrboxSize,
                    height: qrboxSize
                };
            };

            const config = { 
                fps: 20, 
                qrbox: qrboxFunction,
                aspectRatio: 1.0
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    handleCheckIn(decodedText);
                    stopScanner();
                }
            );
        } catch (err) {
            console.error("Camera error:", err);
            setIsCameraActive(false);
        }
    };

    const handleCheckIn = async (code) => {
        if (!code || !event) return;
        setLoading(true);
        setResult(null);

        try {
            const { data: ticket, error: fetchError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    ticket_types!inner (
                        name,
                        event_id
                    ),
                    orders (
                        status
                    )
                `)
                .eq('qr_code', code.trim())
                .eq('ticket_types.event_id', eventId)
                .single();

            if (fetchError || !ticket) {
                setResult({
                    status: 'error',
                    message: 'Tiket tidak ditemukan atau tidak terdaftar untuk event ini.'
                });
                return;
            }

            if (ticket.orders?.status !== 'paid') {
                setResult({
                    status: 'error',
                    ticket,
                    message: 'Tiket belum dibayar.'
                });
                return;
            }

            if (ticket.status === 'used') {
                setResult({
                    status: 'error',
                    ticket,
                    message: 'Tiket sudah digunakan sebelumnya.'
                });
                return;
            }

            const { error: updateError } = await supabase
                .from('tickets')
                .update({ status: 'used', used_at: new Date().toISOString() })
                .eq('id', ticket.id);

            if (updateError) throw updateError;

            setResult({
                status: 'success',
                ticket,
                message: 'Check-in berhasil! Selamat datang.'
            });

            if (mode === 'qr') setInputValue('');

        } catch (error) {
            setResult({
                status: 'error',
                message: 'Terjadi kesalahan sistem.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleCheckIn(inputValue);
    };

    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white font-sans">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-slate-100">
                    <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1a36c7] rounded-lg flex items-center justify-center shadow-lg">
                        <Layers size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#1a36c7] leading-none mb-1">Backstage Assistant</p>
                        <h2 className="text-[13px] font-bold text-slate-900 truncate max-w-[180px] leading-tight">
                            {event?.title}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full border border-green-100">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold uppercase text-green-600 tracking-wider">Ready</span>
                </div>
            </div>

            <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6 space-y-6">
                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
                    <button
                        onClick={() => { setMode('qr'); setInputValue(''); setResult(null); stopScanner(); setHasUserClosedCamera(false); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all ${mode === 'qr' ? 'bg-[#1a36c7] text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <QrCode size={16} /> Auto Scanner
                    </button>
                    <button
                        onClick={() => { setMode('manual'); setInputValue(''); setResult(null); stopScanner(); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all ${mode === 'manual' ? 'bg-[#1a36c7] text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <Keyboard size={16} /> Input Kode
                    </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden">
                    {mode === 'qr' && (
                        <div className="w-full flex flex-col items-center gap-6">
                            <div className={`relative w-full max-w-[300px] aspect-square bg-slate-900 rounded-2xl overflow-hidden border-4 border-white shadow-2xl transition-all duration-500 ${isCameraActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute pointer-events-none'}`}>
                                <div id={scannerContainerId} className="w-full h-full" />
                                
                                {/* Scanning Overlay Interface */}
                                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                                    <div className="w-full h-full border-2 border-white/50 relative">
                                        {/* Corner Accents */}
                                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#1a36c7]" />
                                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#1a36c7]" />
                                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#1a36c7]" />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#1a36c7]" />
                                        
                                        {/* Moving Laser Line */}
                                        <div className="absolute left-0 w-full h-0.5 bg-[#1a36c7] shadow-[0_0_15px_rgba(26,54,199,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                                    </div>
                                </div>

                                <button
                                    onClick={stopScanner}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600/90 backdrop-blur-sm text-white rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-lg border border-red-500/50 active:scale-95 transition-all"
                                >
                                    <CameraOff size={12} /> Tutup Kamera
                                </button>
                            </div>

                            {!isCameraActive && (
                                <button
                                    onClick={startScanner}
                                    className="px-8 py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center gap-4 text-slate-400 hover:border-[#1a36c7] hover:text-[#1a36c7] group transition-all w-full max-w-[300px]"
                                >
                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <Camera size={40} className="text-slate-300 group-hover:text-[#1a36c7]" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-black text-xs uppercase tracking-widest mb-1">Kamera Mati</span>
                                        <span className="text-[10px] font-bold text-slate-400">Klik untuk menyalakan ulang</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={`w-full max-w-xs transition-all ${isCameraActive ? 'mt-8' : (mode === 'qr' ? 'mt-4' : '')}`}>
                        <div className="relative flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={mode === 'qr' ? 'Awaiting QR...' : 'Scan / Input Kode...'}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-slate-900 outline-none focus:border-[#1a36c7] focus:bg-white transition-all text-center placeholder:text-slate-300 shadow-inner"
                            />
                            {mode === 'manual' && (
                                <button
                                    type="submit"
                                    disabled={loading || !inputValue}
                                    className="px-5 bg-[#1a36c7] text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20 active:scale-95"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="min-h-[220px]">
                    {!result && !loading && (
                        <div className="text-center py-10 opacity-20 space-y-4">
                            {mode === 'qr' ? <QrCode size={48} className="mx-auto" /> : <Search size={48} className="mx-auto" />}
                            <p className="font-bold text-slate-900 uppercase tracking-[0.2em] text-[10px]">Ready for validation</p>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-10 space-y-4">
                            <div className="relative inline-block">
                                <Loader2 size={48} className="text-[#1a36c7] animate-spin" />
                                <Zap size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1a36c7]" />
                            </div>
                            <p className="font-bold text-[#1a36c7] uppercase tracking-[0.2em] text-[10px] animate-pulse">Verifying Access...</p>
                        </div>
                    )}

                    {result && !loading && (
                        <div className={`bg-white rounded-3xl p-6 border shadow-2xl animate-in zoom-in-95 duration-300 ${result.status === 'success' ? 'border-green-100 shadow-green-900/5' : 'border-red-100 shadow-red-900/5'}`}>
                            <div className="flex flex-col items-center gap-6">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${result.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {result.status === 'success' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                                </div>

                                <div className="space-y-4 w-full text-center">
                                    <div className="space-y-1">
                                        <h3 className={`text-2xl font-black tracking-tight ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                            {result.status === 'success' ? 'VALID' : 'INVALID'}
                                        </h3>
                                        <p className="text-slate-500 font-bold text-[11px] uppercase tracking-wide">{result.message}</p>
                                    </div>

                                    {result.ticket && (
                                        <div className="grid grid-cols-1 gap-3 text-left">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitor Name</p>
                                                <p className="font-black text-slate-900 text-base">{result.ticket.full_name || 'GUEST_USER'}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Type</p>
                                                <p className="font-black text-slate-700 text-sm">{result.ticket.ticket_types?.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setResult(null); setInputValue(''); if (mode === 'qr' && !hasUserClosedCamera) startScanner(); }}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-800 transition-all mt-4"
                                    >
                                        Lanjut Scan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="p-8 text-center pb-12">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Authorized by HeroesTix</p>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                #public-reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                #public-reader {
                    border: none !important;
                }
                @keyframes scan {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
            `}} />
        </div>
    );
}
