import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import EventNavbar from "../../components/Layout/EventNavbar";
import Footer from "../../components/Layout/Footer";
import { HiOutlineDuplicate } from "react-icons/hi";
import { emailService } from "../../services/email";
import { supabase } from "../../lib/supabaseClient";

const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function Payment() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { total, selectedPayment, orderId, eventTitle, visitorEmail, virtualAccountNo, bankName, expiredDate } = location.state || { total: 0, selectedPayment: "bayarind", orderId: null, eventTitle: "", visitorEmail: "", virtualAccountNo: "", bankName: "BAYARIND", expiredDate: "" };

    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // Default 24h
    const [activeTab, setActiveTab] = useState("MBanking");
    const [loading, setLoading] = useState(false);
    const [statusChecking, setStatusChecking] = useState(false);

    useEffect(() => {
        if (!orderId || !virtualAccountNo) {
            navigate(`/`);
            return;
        }

        // Calculate time left from expiredDate if available
        if (expiredDate) {
            const expiry = new Date(expiredDate).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((expiry - now) / 1000);
            if (diff > 0) setTimeLeft(diff);
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [orderId, virtualAccountNo, expiredDate, navigate]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Nomor Virtual Account disalin!");
    };

    const handleCheckStatus = async () => {
        setStatusChecking(true);
        try {
            // Check status via inquiry endpoint
            const { data, error } = await supabase.functions.invoke('payment-gateway', {
                body: {
                    action: "inquiry", // or whatever action identifies inquiry check locally
                    order_id: orderId
                }
            });

            // Alternatively, just check the orders table directly for status update
            const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();

            if (order?.status === 'paid' || data?.status === 'success') {
                alert("Pembayaran Berhasil!");
                navigate(`/payment/receipt`, { state: { orderId } });
            } else {
                alert("Pembayaran belum diterima. Silakan selesaikan pembayaran Anda.");
            }
        } catch (err) {
            console.error("Status check error:", err);
            // Fallback: check DB directly
            const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
            if (order?.status === 'paid') {
                navigate(`/payment/receipt`, { state: { orderId } });
            } else {
                alert("Status pembayaran belum berubah.");
            }
        } finally {
            setStatusChecking(false);
        }
    };

    return (
        <div className="bg-white min-h-screen font-sans text-slate-900">
            <EventNavbar />

            <div className="pt-32 pb-20">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="text-center space-y-2 mb-8">
                        <p className="font-bold text-slate-700">Selesaikan Pembayaran dalam</p>
                        <p className="text-3xl font-black text-orange-500 tracking-wider">
                            {formatTime(timeLeft)}
                        </p>
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-6">
                        <div className="flex divide-x divide-slate-50">
                            <div className="flex-1 p-6 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Nomor Akun Virtual ({bankName})</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-black text-slate-800 tracking-tight">{virtualAccountNo}</p>
                                        <button onClick={() => copyToClipboard(virtualAccountNo)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                            <HiOutlineDuplicate size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Total Tagihan</p>
                                    <p className="text-lg font-black text-slate-800">{rupiah(total)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Event</p>
                                    <p className="text-sm font-bold text-slate-700">{eventTitle}</p>
                                </div>
                            </div>
                            <div className="w-1/3 p-6 flex items-center justify-center bg-slate-50/50">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center min-w-[100px]">
                                    <img
                                        src="https://api.bayarind.id/assets/images/logo.png"
                                        alt="Bayarind"
                                        className="h-8 w-auto object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentNode.innerHTML = '<span className="font-black text-blue-700 italic text-xl">BAYARIND</span>';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <button
                            disabled={statusChecking}
                            onClick={handleCheckStatus}
                            className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-xl ${statusChecking ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                        >
                            {statusChecking ? "MEMERIKSA STATUS..." : "CEK STATUS PEMBAYARAN"}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 rounded-xl border border-slate-100 text-slate-400 font-bold text-sm hover:bg-slate-50 transition-all mb-6"
                    >
                        Kembali ke Checkout
                    </button>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-50 bg-white">
                            <h2 className="text-lg font-bold text-slate-800">Cara Membayar</h2>
                        </div>
                        <div className="flex border-b border-slate-50">
                            {["MBanking", "ATM"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-blue-700' : 'text-slate-400 bg-slate-50/20'}`}
                                >
                                    {tab}
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-700" />}
                                </button>
                            ))}
                        </div>
                        <div className="p-8 space-y-8 bg-white">
                            <div className="space-y-4">
                                <h3 className="font-black text-slate-800">Instruksi Pembayaran</h3>
                                <ul className="space-y-2 text-sm font-medium text-slate-600 list-decimal pl-4">
                                    <li>Gunakan ATM atau M-Banking pilihan Anda</li>
                                    <li>Pilih menu <strong>Transfer ke Bank Lain</strong> atau <strong>Virtual Account</strong></li>
                                    <li>Pilih Bank Tujuan: <strong>BAYARIND</strong> atau masukkan kode bank <strong>901</strong></li>
                                    <li>Masukkan Nomor Virtual Account: <strong>{virtualAccountNo}</strong></li>
                                    <li>Pastikan nominal pembayaran sesuai: <strong>{rupiah(total)}</strong></li>
                                    <li>Konfirmasi pembayaran dan simpan struk sebagai bukti</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
