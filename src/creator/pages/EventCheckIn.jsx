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
    Check
} from 'lucide-react';

export default function EventCheckIn() {
    const { id: eventId } = useParams();
    const [mode, setMode] = useState('qr'); // 'qr' or 'manual'
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { status: 'success' | 'error', ticket: any, message: string }
    const inputRef = useRef(null);
    const scannerRef = useRef(null);
    const scannerContainerId = "qr-reader";

    useEffect(() => {
        if (inputRef.current && mode === 'manual') {
            inputRef.current.focus();
        }
    }, [mode]);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
            }
        };
    }, []);

    const startScanner = async () => {
        setIsCameraActive(true);
        setResult(null);
        try {
            const html5QrCode = new Html5Qrcode(scannerContainerId);
            scannerRef.current = html5QrCode;

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    handleCheckIn(decodedText);
                    stopScanner(); // Stop after successful scan
                },
                (errorMessage) => {
                    // Ignore common errors as they are frequent during scanning
                }
            );
        } catch (err) {
            console.error("Camera error:", err);
            setIsCameraActive(false);
            alert("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
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
    };

    const handleCheckIn = async (code) => {
        if (!code) return;
        setLoading(true);
        setResult(null);

        try {
            // 1. Fetch ticket and check if it belongs to this event
            const { data: ticket, error: fetchError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    ticket_types!inner (
                        name,
                        event_id,
                        events (
                            title
                        )
                    ),
                    orders (
                        status
                    )
                `)
                .eq('qr_code', code)
                .eq('ticket_types.event_id', eventId)
                .single();

            if (fetchError || !ticket) {
                setResult({
                    status: 'error',
                    message: 'Tiket tidak ditemukan atau tidak terdaftar untuk event ini.'
                });
                return;
            }

            // 2. Validate ticket status
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

            // 3. Update ticket status to 'used'
            const { error: updateError } = await supabase
                .from('tickets')
                .update({ status: 'used' })
                .eq('id', ticket.id);

            if (updateError) throw updateError;

            setResult({
                status: 'success',
                ticket,
                message: 'Check-in berhasil! Selamat datang.'
            });

            // Clear input for next scan if in QR mode
            if (mode === 'qr') {
                setInputValue('');
            }

        } catch (error) {
            console.error('Check-in error:', error);
            setResult({
                status: 'error',
                message: 'Terjadi kesalahan sistem. Silakan coba lagi.'
            });
        } finally {
            setLoading(false);
            // Re-focus input after processing
            if (mode === 'manual') {
                setTimeout(() => {
                    if (inputRef.current) inputRef.current.focus();
                }, 100);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleCheckIn(inputValue);
    };

    return (
        <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in duration-700">
            {/* Mode Switcher */}
            <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex gap-1">
                <button
                    onClick={() => { setMode('qr'); setInputValue(''); setResult(null); stopScanner(); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${mode === 'qr' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                    <QrCode size={16} />
                    Auto Scanner
                </button>
                <button
                    onClick={() => { setMode('manual'); setInputValue(''); setResult(null); stopScanner(); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${mode === 'manual' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                    <Keyboard size={16} />
                    Input Kode
                </button>
            </div>

            {/* Input & Action Area */}
            <div className="w-full max-w-xl space-y-8 text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Cek Tiket Pengunjung
                    </h1>
                    <p className="text-slate-400 font-medium text-sm">
                        {mode === 'qr'
                            ? 'Pindai QR code menggunakan kamera atau alat scanner.'
                            : 'Masukkan kode unik yang tertera pada tiket.'}
                    </p>
                </div>

                {mode === 'qr' && (
                    <div className="flex flex-col items-center gap-6">
                        {isCameraActive ? (
                            <div className="relative w-full max-w-xs aspect-square bg-black rounded-2xl overflow-hidden border-2 border-blue-600 shadow-xl">
                                <div id={scannerContainerId} className="w-full h-full" />
                                <button
                                    onClick={stopScanner}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-lg"
                                >
                                    <CameraOff size={14} />
                                    Matikan Kamera
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={startScanner}
                                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-blue-100 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
                            >
                                <Camera size={20} />
                                Gunakan Kamera HP
                            </button>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={`relative ${isCameraActive ? 'hidden' : 'block'}`}>
                    <div className="relative flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={mode === 'qr' ? 'Menunggu Scan...' : 'Masukkan kode tiket...'}
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold text-xl text-slate-900 outline-none focus:border-blue-600 transition-all text-center placeholder:text-slate-200 shadow-sm"
                        />
                        {mode === 'manual' && (
                            <button
                                type="submit"
                                disabled={loading || !inputValue}
                                className="px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                            </button>
                        )}
                    </div>
                </form>

                {/* Status Displays */}
                <div className="min-h-[260px] flex items-center justify-center">
                    {!result && !loading && !isCameraActive && (
                        <div className="text-center opacity-30 space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-200 text-slate-400">
                                {mode === 'qr' ? <QrCode size={32} /> : <Search size={32} />}
                            </div>
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Siap Melakukan Validasi</p>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                                <Loader2 size={32} className="animate-spin" />
                            </div>
                            <p className="font-bold text-blue-600 uppercase tracking-widest text-[10px]">Memverifikasi Tiket...</p>
                        </div>
                    )}

                    {result && !loading && (
                        <div className={`w-full bg-white rounded-2xl p-8 border shadow-xl animate-in zoom-in-95 duration-300 ${result.status === 'success' ? 'border-green-100' : 'border-red-100'}`}>
                            <div className="flex flex-col items-center gap-6">
                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${result.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {result.status === 'success' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                                </div>

                                <div className="space-y-4 w-full">
                                    <div className="space-y-1">
                                        <h3 className={`text-2xl font-bold ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                            {result.status === 'success' ? 'Check-in Berhasil' : 'Check-in Gagal'}
                                        </h3>
                                        <p className="text-slate-500 font-semibold text-xs">{result.message}</p>
                                    </div>

                                    {result.ticket && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Pengunjung</p>
                                                <p className="font-bold text-slate-800 text-sm truncate">{result.ticket.full_name}</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tipe Tiket</p>
                                                <p className="font-bold text-slate-800 text-sm truncate">{result.ticket.ticket_types?.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setResult(null); setInputValue(''); if (mode === 'qr' && !isCameraActive) startScanner(); }}
                                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all"
                                    >
                                        Lanjut Check-in
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Input for Hardware Scanners */}
            {mode === 'qr' && !isCameraActive && (
                <div className="opacity-0 absolute -z-50 pointer-events-none">
                    <input
                        autoFocus
                        type="text"
                        onChange={(e) => handleCheckIn(e.target.value)}
                    />
                </div>
            )}
        </div>
    );
}
