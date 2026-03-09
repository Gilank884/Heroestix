import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { HiQrcode, HiCheckCircle, HiExclamationCircle, HiChevronLeft, HiCamera, HiPencilAlt, HiLightningBolt } from 'react-icons/hi';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../lib/supabaseClient';

const PublicScan = () => {
    const { eventId, token } = useParams();
    const [event, setEvent] = useState(null);
    const [qrValue, setQrValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticketInfo, setTicketInfo] = useState(null);
    const [error, setError] = useState(null);
    const [isValidating, setIsValidating] = useState(true);
    const [scanMode, setScanMode] = useState('camera'); // camera | manual
    const [isScanning, setIsScanning] = useState(false);

    const scannerRef = useRef(null);
    const qrRegionId = "public-reader";

    useEffect(() => {
        validateAssistant();
    }, [eventId, token]);

    useEffect(() => {
        if (scanMode === 'camera' && event && !isScanning) {
            startScanner();
        } else if (scanMode === 'manual') {
            stopScanner();
        }
        return () => stopScanner();
    }, [scanMode, event]);

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

    const startScanner = async () => {
        try {
            const html5QrCode = new Html5Qrcode(qrRegionId);
            scannerRef.current = html5QrCode;

            const config = { fps: 15, qrbox: { width: 250, height: 250 } };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    handleDecodedText(decodedText);
                }
            );
            setIsScanning(true);
        } catch (err) {
            console.error("Camera error:", err);
            setScanMode('manual');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        }
    };

    const handleDecodedText = (text) => {
        setQrValue(text);
        processScan(text);
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const processScan = async (value) => {
        if (!value.trim() || !event) return;
        setLoading(true);
        setError(null);
        setTicketInfo(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    ticket_types!inner (
                        name,
                        event_id
                    )
                `)
                .eq('qr_code', value.trim())
                .eq('ticket_types.event_id', eventId)
                .single();

            if (fetchError || !data) {
                setError("Tiket tidak ditemukan.");
            } else {
                setTicketInfo(data);
            }
        } catch (err) {
            setError("Kesalahan koneksi.");
        } finally {
            setLoading(false);
            if (scanMode === 'manual') setQrValue('');
        }
    };

    const handleVerifyAccess = async () => {
        if (!ticketInfo) return;
        setLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('tickets')
                .update({ status: 'used', used_at: new Date().toISOString() })
                .eq('id', ticketInfo.id);

            if (updateError) throw updateError;
            setTicketInfo(prev => ({ ...prev, status: 'used' }));
        } catch (err) {
            alert("Gagal: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-slate-100">
                    <HiExclamationCircle size={40} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Akses Ditolak</h2>
                    <p className="text-slate-500 text-sm mb-6">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Tighter Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                        <HiLightningBolt size={16} />
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-blue-600 leading-tight">Scanner Assistant</p>
                        <h2 className="text-[13px] font-bold text-slate-900 truncate max-w-[180px] leading-tight mt-0.5">{event?.title}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-green-600">Ready</span>
                </div>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full px-5 py-6 space-y-6">
                {/* Tighter Mode Selector */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                    <button
                        onClick={() => setScanMode('camera')}
                        className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight transition-all ${scanMode === 'camera' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
                            }`}
                    >
                        <HiCamera size={14} /> Scan Kamera
                    </button>
                    <button
                        onClick={() => setScanMode('manual')}
                        className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight transition-all ${scanMode === 'manual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
                            }`}
                    >
                        <HiPencilAlt size={14} /> Input Manual
                    </button>
                </div>

                {/* Scan Area - STAYS LARGE */}
                <div className="space-y-6">
                    {scanMode === 'camera' ? (
                        <div className="relative">
                            <div className="bg-black rounded-3xl shadow-xl relative overflow-hidden aspect-square border-4 border-white">
                                <div id={qrRegionId} className="w-full h-full" />
                                {isScanning && (
                                    <div className="absolute left-0 top-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,1)] animate-[scan_2.5s_linear_infinite] z-10 pointer-events-none" />
                                )}
                            </div>
                            <p className="text-center mt-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Arahkan kamera ke QR tiket</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <input
                                autoFocus
                                type="text"
                                value={qrValue}
                                onChange={(e) => setQrValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && processScan(qrValue)}
                                placeholder="Masukkan Kode Manual..."
                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-center text-lg font-bold text-blue-600 placeholder:text-slate-200 focus:border-blue-500 outline-none shadow-sm"
                            />
                            <button
                                onClick={() => processScan(qrValue)}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Cari Tiket
                            </button>
                        </div>
                    )}
                </div>

                {/* Tighter Result Card */}
                <div className="min-h-[220px]">
                    {ticketInfo ? (
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">{ticketInfo.ticket_types?.name}</p>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{ticketInfo.full_name || 'GUEST_USER'}</h3>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${ticketInfo.status === 'unused' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {ticketInfo.status === 'unused' ? 'UNUSED' : 'Terpakai'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Waktu Masuk</p>
                                    <p className="text-[10px] font-bold text-slate-700">
                                        {ticketInfo.used_at
                                            ? new Date(ticketInfo.used_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                            : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                        } WIB
                                    </p>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ID Tiket</p>
                                    <p className="text-[10px] font-mono font-bold text-slate-500 truncate">{ticketInfo.qr_code}</p>
                                </div>
                            </div>

                            {ticketInfo.status === 'unused' ? (
                                <button
                                    onClick={handleVerifyAccess}
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {loading ? "PROSES..." : <><HiCheckCircle size={18} /> Konfirmasi</>}
                                </button>
                            ) : (
                                <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                                    <HiExclamationCircle size={18} /> Sudah Digunakan
                                </div>
                            )}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 rounded-2xl border border-red-100 p-6 text-center">
                            <HiExclamationCircle size={24} className="text-red-500 mx-auto mb-2" />
                            <p className="text-red-700 font-bold text-xs uppercase tracking-widest">{error}</p>
                        </div>
                    ) : (
                        <div className="text-center py-10 opacity-30">
                            <HiQrcode size={32} className="mx-auto mb-3 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menunggu Input/Scan</p>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                #public-reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                #public-reader {
                    border: none !important;
                }
            `}} />

            <div className="mt-auto p-6 text-center">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Verified by HeroesTix</p>
            </div>
        </div>
    );
};

export default PublicScan;
