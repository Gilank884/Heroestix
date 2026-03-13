import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import EventNavbar from "../../components/Layout/EventNavbar";
import Footer from "../../components/Layout/Footer";
import { HiOutlineDuplicate } from "react-icons/hi";
import { CheckCircle, Mail, Loader2 } from "lucide-react";
import { emailService } from "../../services/email";
import { supabase } from "../../lib/supabaseClient";
import QRCode from "react-qr-code";

const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};


const StatusModal = ({ isOpen, type, onClose, orderId }) => {
    if (!isOpen) return null;

    const isPending = type === 'pending';

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800" style={{ animation: 'zoomIn 0.3s ease-out' }}>
                <div className="p-8 text-center">
                    <div className={`w-20 h-20 ${isPending ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500' : 'bg-red-50 dark:bg-red-900/30 text-red-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                        {isPending ? (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        ) : (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        )}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                        {isPending ? 'Belum Terbayar' : 'Pembayaran Gagal'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 text-sm">
                        {isPending
                            ? 'Kami belum menerima konfirmasi pembayaran Anda. Jika Anda baru saja membayar, tunggu 1-2 menit lalu cek kembali.'
                            : 'Maaf, terjadi kesalahan atau pembayaran Anda dibatalkan oleh sistem.'}
                    </p>

                    <button
                        onClick={onClose}
                        className={`w-full py-4 rounded-full font-bold ${isPending ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'} text-white shadow-lg active:scale-[0.98] transition-all`}
                    >
                        {isPending ? 'Selesaikan Pembayaran' : 'Tutup'}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default function Payment() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { total, selectedPayment, orderId, eventTitle, visitorEmail, virtualAccountNo, bankName, expiredDate, redirectUrl, redirectData, urlQris, appPaymentUrl, deeplink } = location.state || { total: 0, selectedPayment: "bayarind", orderId: null, eventTitle: "", visitorEmail: "", visitorPhone: "", virtualAccountNo: "", bankName: "BAYARIND", expiredDate: "" };

    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // Default 24h
    const [activeTab, setActiveTab] = useState("MBanking");
    const [loading, setLoading] = useState(false);
    const [statusChecking, setStatusChecking] = useState(false);
    const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);
    const [redirectTriggered, setRedirectTriggered] = useState(false);
    const formRef = useRef(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [modalType, setModalType] = useState('pending'); // pending, failed


    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const [toastType, setToastType] = useState("success"); // success or warning

    const triggerToast = (msg, type = "success") => {
        setToastMsg(msg);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    useEffect(() => {
        if (!orderId || !virtualAccountNo) {
            navigate(`/`);
            return;
        }

        // 1. Countdown Timer
        if (expiredDate) {
            const expiry = new Date(expiredDate).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((expiry - now) / 1000);
            if (diff > 0) setTimeLeft(diff);
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // 2. Realtime Status Check
        const channel = supabase
            .channel(`order-status-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload) => {
                    console.log('[Realtime] Order update:', payload);
                    if (payload.new.status === 'paid' || payload.new.status === 'success') {
                        navigate(`/payment/success/${orderId}`, { replace: true });
                    } else if (payload.new.status === 'failed' || payload.new.status === 'expired' || payload.new.status === 'canceled' || payload.new.status === 'cancelled') {
                        navigate(`/payment/failed/${orderId}`, { replace: true });
                    }
                }
            )
            .subscribe();

        return () => {
            clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, [orderId, virtualAccountNo, expiredDate, navigate, statusChecking]);

    // 3. Expired Payment Handling
    useEffect(() => {
        if (timeLeft === 0) {
            triggerToast("Waktu pembayaran habis", "warning");
        }
    }, [timeLeft]);

    useEffect(() => {
        const isEwallet = ['OVO', 'SHOPEEPAY', 'LINKAJA'].includes(bankName?.toUpperCase());
        if (isEwallet && (redirectUrl || appPaymentUrl || deeplink || redirectData)) {
            if (redirectTriggered) return;
            setRedirectTriggered(true);

            console.log(`[Payment] E-Wallet detected (${bankName}). Initializing auto-redirect...`);
            setIsAutoRedirecting(true);

            const timer = setTimeout(() => {
                let processedData = null;
                if (redirectData) {
                    if (typeof redirectData === "string") {
                        try {
                            processedData = JSON.parse(redirectData);
                        } catch {
                            processedData = null;
                        }
                    } else if (typeof redirectData === "object") {
                        processedData = redirectData;
                    }
                }

                if (bankName?.toUpperCase() === 'LINKAJA' && processedData && typeof processedData === 'object') {
                    // LINKAJA / POST REDIRECT
                    console.log("[Payment] Auto-submitting POST form for LinkAja...");
                    formRef.current?.submit();
                } else if (bankName?.toUpperCase() === 'SHOPEEPAY' && processedData && typeof processedData === 'object') {
                    // SHOPEEPAY / DIRECT REDIRECT (redirectData has redirect_url_http or redirect_url_app)
                    const target = processedData.redirect_url_app || processedData.redirect_url_http || deeplink || appPaymentUrl || redirectUrl;
                    console.log("[Payment] Auto-redirecting to ShopeePay:", target);
                    window.location.href = target;
                } else {
                    // OVO / DIRECT REDIRECT
                    const target = deeplink || appPaymentUrl || redirectUrl;
                    console.log("[Payment] Auto-redirecting to:", target);
                    window.location.href = target;
                }
            }, 2500); // 2.5s delay for UX

            return () => clearTimeout(timer);
        }
    }, [bankName, redirectUrl, redirectData, appPaymentUrl, deeplink]);

    // Redirect when payment is detected manually
    const handlePaymentSuccess = () => {
        navigate(`/payment/success/${orderId}`, { replace: true });
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        triggerToast("Nomor Virtual Account disalin!", "success");
    };

    const handleCheckStatus = async () => {
        setStatusChecking(true);
        try {
            // Check status via inquiry endpoint
            const { data, error } = await supabase.functions.invoke('inquiry-status', {
                body: {
                    order_id: orderId
                }
            });

            if (error) throw error;

            console.log("[Status Check] Response:", data);

            if (data?.success) {
                handlePaymentSuccess();
            } else {
                setModalType('pending');
                setShowStatusModal(true);
            }
        } catch (err) {
            console.error("Status check error:", err);
            // Fallback: check DB directly
            const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
            if (order?.status === 'paid' || order?.status === 'success') {
                handlePaymentSuccess();
            } else {
                setModalType('failed');
                setShowStatusModal(true);
            }
        } finally {
            setStatusChecking(false);
        }
    };

    return (
        <div className="bg-white min-h-screen font-sans text-slate-900 relative">
            <EventNavbar />

            <StatusModal
                isOpen={showStatusModal}
                type={modalType}
                onClose={() => setShowStatusModal(false)}
                orderId={orderId}
            />

            <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className={`${toastType === 'warn' ? 'bg-amber-600' : 'bg-slate-900'} dark:bg-white text-white dark:text-slate-900 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-slate-800 dark:border-slate-200`}>
                    <div className={`${toastType === 'warn' ? 'bg-amber-400' : 'bg-emerald-500'} rounded-full p-1.5 shrink-0`}>
                        {toastType === 'warn' ? (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        ) : (
                            <CheckCircle size={16} className="text-white" />
                        )}
                    </div>
                    {toastMsg}
                </div>
            </div>

            {/* Auto Redirecting Overlay */}
            {isAutoRedirecting && (
                <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/50 animate-bounce">
                        <Loader2 size={40} className="text-white animate-spin-slow" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Mengalihkan ke {bankName}...</h2>
                    <p className="text-blue-200 font-medium">Jangan tutup atau refresh halaman ini.</p>
                    <div className="mt-8 flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                    </div>
                </div>
            )}

            <div className="pt-32 pb-20">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="text-center space-y-2 mb-8">
                        <p className="font-bold text-slate-700">Selesaikan Pembayaran dalam</p>
                        <p className="text-3xl font-black text-orange-500 tracking-wider">
                            {formatTime(timeLeft)}
                        </p>
                    </div>

                    {/* Payment Details Card */}
                    <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none mb-8 bg-white dark:bg-slate-900 transition-all">
                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-50 dark:divide-slate-800">
                            {/* Left Side: Info */}
                            <div className="flex-1 p-8 space-y-6">
                                {bankName === 'QRIS' ? (
                                    <div className="space-y-4 text-center">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scan QRIS</p>
                                        <div className="flex justify-center">
                                            <div className="bg-white p-4 rounded-3xl shadow-inner border-4 border-slate-50 inline-block overflow-hidden transition-all hover:scale-105 duration-500">
                                                {(urlQris?.startsWith('http') || urlQris?.startsWith('data:image')) ? (
                                                    <div className="p-2 bg-white flex flex-col items-center">
                                                        <img src={urlQris} alt="QRIS" className="w-[180px] h-auto rounded-lg" />
                                                        <div className="mt-4 flex flex-col items-center gap-3">
                                                            <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-400 tracking-tighter uppercase">
                                                                Pindai untuk membayar
                                                            </div>
                                                            <img src="/Logo/qris.jpg" alt="QRIS Logo" className="h-8 w-auto object-contain" />
                                                        </div>
                                                    </div>
                                                ) : virtualAccountNo ? (
                                                    <div className="p-2 bg-white flex flex-col items-center">
                                                        <QRCode
                                                            value={virtualAccountNo}
                                                            size={180}
                                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                            viewBox={`0 0 256 256`}
                                                            className="rounded-lg"
                                                        />
                                                        <div className="mt-4 flex flex-col items-center gap-3">
                                                            <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-400 tracking-tighter uppercase">
                                                                Pindai untuk membayar
                                                            </div>
                                                            <img src="/Logo/qris.jpg" alt="QRIS Logo" className="h-8 w-auto object-contain" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-48 h-48 bg-slate-50 animate-pulse flex items-center justify-center rounded-2xl">
                                                        <span className="text-[10px] font-black text-slate-300">GENERATING QR...</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {selectedPayment?.includes('va') || ['BNI', 'BRI', 'MANDIRI'].includes(bankName) ? `Nomor Akun Virtual (${bankName})` : `ID Pembayaran (${bankName})`}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{virtualAccountNo}</p>
                                            <button
                                                onClick={() => copyToClipboard(virtualAccountNo)}
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-90"
                                            >
                                                <HiOutlineDuplicate size={22} />
                                            </button>
                                        </div>
                                        {(redirectUrl || appPaymentUrl || deeplink || redirectData) && (
                                            <div className="pt-2">
                                                {(() => {
                                                    let processedData = null;
                                                    if (redirectData) {
                                                        if (typeof redirectData === "string") {
                                                            try {
                                                                processedData = JSON.parse(redirectData);
                                                            } catch {
                                                                processedData = null;
                                                            }
                                                        } else if (typeof redirectData === "object") {
                                                            processedData = redirectData;
                                                        }
                                                    }

                                                    if (bankName?.toUpperCase() === 'LINKAJA' && processedData && typeof processedData === 'object') {
                                                        return (
                                                            <form ref={formRef} method="POST" action={redirectUrl}>
                                                                {Object.entries(processedData).map(([key, val]) => (
                                                                    <input key={key} type="hidden" name={key} value={val} />
                                                                ))}
                                                                <button
                                                                    type="submit"
                                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
                                                                >
                                                                    {isAutoRedirecting ? 'Mengalihkan ke Pembayaran...' : `Bayar dengan Aplikasi ${bankName}`}
                                                                </button>
                                                            </form>
                                                        );
                                                    } else {
                                                        const targetUrl = bankName?.toUpperCase() === 'SHOPEEPAY' && processedData
                                                            ? (processedData.redirect_url_app || processedData.redirect_url_http || deeplink || appPaymentUrl || redirectUrl)
                                                            : (deeplink || appPaymentUrl || redirectUrl);

                                                        return (
                                                            <a
                                                                href={targetUrl}
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
                                                            >
                                                                {isAutoRedirecting
                                                                    ? 'Mengalihkan ke Aplikasi...'
                                                                    : (appPaymentUrl || deeplink || redirectData ? `Buka Aplikasi ${bankName}` : `Bayar dengan Aplikasi ${bankName}`)
                                                                }
                                                            </a>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
                                        <p className="text-xl font-black text-[#1b3bb6] dark:text-blue-400">{rupiah(total)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Event</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{eventTitle}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Logo */}
                            <div className={`md:w-1/3 p-8 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 ${bankName === 'QRIS' ? 'hidden md:flex' : ''}`}>
                                {bankName !== 'QRIS' && (
                                    <div className={`${bankName === 'BAYARIND' ? 'bg-[#003380]' : 'bg-white'} p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center min-w-[120px] transition-transform hover:scale-105`}>
                                        <img
                                            src={
                                                bankName === 'BNI' ? '/Logo/bni.png' :
                                                    bankName === 'BRI' ? '/Logo/bri.png' :
                                                        bankName === 'MANDIRI' ? '/Logo/mandiri.png' :
                                                            bankName === 'OVO' ? '/Logo/ovo.png' :
                                                                bankName === 'LINKAJA' ? '/Logo/linkaja.png' :
                                                                    bankName === 'SHOPEEPAY' ? '/Logo/shopeepay.png' :
                                                                        '/Logo/bayarind.png'
                                            }
                                            alt={bankName}
                                            className="h-10 w-auto object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-8">
                        <button
                            disabled={statusChecking}
                            onClick={handleCheckStatus}
                            className={`w-full py-5 rounded-2xl font-black text-white transition-all shadow-xl active:scale-[0.98] ${statusChecking
                                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                                : 'bg-[#1b3bb6] hover:bg-[#16319c] shadow-blue-600/20 border-b-4 border-[#122a84]'
                                }`}
                        >
                            {statusChecking ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>MEMERIKSA STATUS...</span>
                                </div>
                            ) : "SUDAH BAYAR? CEK STATUS SEKARANG"}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all mb-12"
                    >
                        Kembali ke Checkout
                    </button>

                    {/* Instructions Section */}
                    <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#1b3bb6] rounded-full" />
                            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Cara Membayar</h2>
                        </div>

                        {['OVO', 'LINKAJA', 'SHOPEEPAY'].includes(bankName) ? (
                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">1</span>
                                        Instruksi {bankName}
                                    </h3>
                                    <ul className="space-y-3 text-sm font-bold text-slate-600 dark:text-slate-400 list-none">
                                        <li className="flex gap-3"><span className="text-blue-500">•</span> Buka aplikasi {bankName} di ponsel Anda</li>
                                        <li className="flex gap-3"><span className="text-blue-500">•</span> Periksa notifikasi atau menu pembayaran</li>
                                        <li className="flex gap-3"><span className="text-blue-500">•</span> Konfirmasi pembayaran sebesar <strong>{rupiah(total)}</strong></li>
                                        <li className="flex gap-3"><span className="text-blue-500">•</span> Masukkan PIN Anda untuk menyelesaikan transaksi</li>
                                    </ul>
                                </div>
                            </div>
                        ) : bankName === 'QRIS' ? (
                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">1</span>
                                        Instruksi QRIS
                                    </h3>
                                    <ul className="space-y-3 text-sm font-bold text-slate-600 dark:text-slate-400 list-none">
                                        <li className="flex gap-3"><span className="text-blue-500">•</span> Buka aplikasi pembayaran pilihan Anda (Gopay, ShopeePay, OVO, LinkAja, atau MBanking)</li>
                                        <li className="flex gap-3"><span className="text-blue-500">•</span> Pilih menu <strong>Scan / Bayar</strong></li>
                                        <li className="flex gap-3"><span className="text-blue-500">•</span> Arahkan kamera ke kode QR yang muncul di layar</li>
                                        <li className="flex gap-3"><span className="text-blue-500">•</span> Pastikan nominal dan nama merchant sudah sesuai</li>
                                        <li className="flex gap-3"><span className="text-blue-500">•</span> Masukkan PIN dan selesaikan pembayaran</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex border-b border-slate-50 dark:border-slate-800">
                                    {["MBanking", "ATM"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 py-5 text-xs font-black transition-all relative uppercase tracking-widest ${activeTab === tab ? 'text-[#1b3bb6] bg-white' : 'text-slate-400 bg-slate-50/50 dark:bg-slate-800/30'}`}
                                        >
                                            {tab}
                                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#1b3bb6]" />}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-8 space-y-8 bg-white dark:bg-slate-900/50">
                                    <div className="space-y-4">
                                        <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">1</span>
                                            {activeTab === 'MBanking' ? 'Mobile Banking' : 'ATM / Mesin ATM'}
                                        </h3>
                                        <ul className="space-y-3 text-sm font-bold text-slate-600 dark:text-slate-400 list-none">
                                            <li className="flex gap-3"><span className="text-blue-500">•</span> Masuk ke {activeTab === 'MBanking' ? 'Aplikasi M-Banking' : 'Menu ATM'} Anda</li>
                                            <li className="flex gap-3"><span className="text-blue-500">•</span> Pilih menu <strong>Transfer</strong> &gt; <strong>Virtual Account</strong> atau <strong>Bank Lain</strong></li>
                                            <li className="flex gap-3"><span className="text-blue-500">•</span> Masukkan Kode Bank: <strong>901</strong> (Bayarind)</li>
                                            <li className="flex gap-3"><span className="text-blue-500">•</span> Masukkan Nomor VA: <strong className="text-slate-900 dark:text-white uppercase">{virtualAccountNo}</strong></li>
                                            <li className="flex gap-3"><span className="text-blue-500">•</span> Masukkan nominal: <strong>{rupiah(total)}</strong></li>
                                            <li className="flex gap-3"><span className="text-blue-500">•</span> Konfirmasi transaksi dan simpan bukti bayar</li>
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}