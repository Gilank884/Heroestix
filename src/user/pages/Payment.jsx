import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import EventNavbar from "../../components/Layout/EventNavbar";
import Footer from "../../components/Layout/Footer";
import { HiOutlineDuplicate, HiChevronRight } from "react-icons/hi";

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
    const { total, selectedPayment } = location.state || { total: 46157, selectedPayment: "bca" };

    const [timeLeft, setTimeLeft] = useState(28 * 60 + 3); // 28:03 in seconds
    const [activeTab, setActiveTab] = useState("MBanking");

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Nomor Virtual Account disalin!");
    };

    return (
        <div className="bg-white min-h-screen font-sans text-slate-900">
            <EventNavbar />

            <div className="pt-32 pb-20">
                <div className="max-w-2xl mx-auto px-4">

                    {/* TOP SECTION: TIMER */}
                    <div className="text-center space-y-2 mb-8">
                        <p className="font-bold text-slate-700">Selesaikan Pembayaran dalam</p>
                        <p className="text-3xl font-black text-orange-500 tracking-wider">
                            {formatTime(timeLeft)}
                        </p>
                    </div>

                    {/* VA BOX */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-6">
                        <div className="flex divide-x divide-slate-50">
                            <div className="flex-1 p-6 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Nomor Akun Virtual</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-black text-slate-800 tracking-tight">3816529350750232</p>
                                        <button
                                            onClick={() => copyToClipboard("3816529350750232")}
                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            <HiOutlineDuplicate size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Total</p>
                                    <p className="text-lg font-black text-slate-800">{rupiah(total)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Nomor Faktur</p>
                                    <p className="text-sm font-bold text-slate-700">yp-1220255164105-3b284e</p>
                                </div>
                            </div>
                            <div className="w-1/3 p-6 flex items-center justify-center bg-slate-50/50">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <span className="text-blue-700 font-extrabold text-xl italic">BCA</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MAIN BUTTONS */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => navigate(`/transaction-detail/${id}`, { state: { total, selectedPayment } })}
                            className="py-3 px-4 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 transition-all text-center"
                        >
                            Lihat Detail Transaksi
                        </button>
                        <button className="py-3 px-4 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 transition-all">
                            Cek Status Pembayaran
                        </button>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 rounded-xl border border-slate-100 text-blue-700 font-bold text-sm hover:bg-slate-50 transition-all mb-6"
                    >
                        Ubah Bank Tujuan
                    </button>

                    <p className="text-center text-xs text-slate-500 font-medium mb-12">
                        Mengalami masalah dengan transaksi ini? <span className="text-blue-700 font-bold cursor-pointer hover:underline">Hubungi Kami</span>
                    </p>

                    {/* INSTRUCTIONS */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-50 bg-white">
                            <h2 className="text-lg font-bold text-slate-800">Cara Membayar</h2>
                        </div>

                        {/* TABS */}
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
                                <h3 className="font-black text-slate-800">Masuk Ke Akun Anda</h3>
                                <ul className="space-y-2 text-sm font-medium text-slate-600 list-decimal pl-4">
                                    <li>Buka Aplikasi BCA Mobile</li>
                                    <li>Pilih 'm-BCA', lalu pilih 'm-Transfer'</li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-black text-slate-800">Rincian Pembayaran</h3>
                                <ul className="space-y-3 text-sm font-medium text-slate-600 list-decimal pl-4">
                                    <li>Pilih 'm-BCA', lalu pilih 'm-Transfer'</li>
                                    <li>Masukkan Nomor Virtual Account Anda <span className="font-black text-blue-700">3816529350750232</span> lalu tekan 'OK'</li>
                                    <li>Klik tombol 'Kirim' di pojok kanan atas untuk melanjutkan</li>
                                    <li>Klik 'OK' untuk melanjutkan</li>
                                    <li>Masukkan PIN Anda untuk mengotorisasi transaksi</li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-black text-slate-800">Transaksi Selesai</h3>
                                <ul className="space-y-2 text-sm font-medium text-slate-600 list-decimal pl-4">
                                    <li>Setelah transaksi pembayaran selesai, faktur ini akan diperbarui secara otomatis. Ini mungkin memerlukan waktu hingga 5 menit</li>
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
