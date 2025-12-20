import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import EventNavbar from "../components/Layout/EventNavbar";
import Footer from "../components/Layout/Footer";
import { HiOutlineDuplicate, HiChevronDown } from "react-icons/hi";

import topEvents from "../data/TopEvent";
import newEvents from "../data/NewEvent";
import recommendedEvents from "../data/RecommendedEvent";

const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function TransactionDetail() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { total, selectedPayment } = location.state || { total: 46157, selectedPayment: "BCA" };

    const [event, setEvent] = useState(null);
    const [isVisitorOpen, setIsVisitorOpen] = useState(true);

    useEffect(() => {
        const allEvents = [...topEvents, ...newEvents, ...recommendedEvents];
        const foundEvent = allEvents.find((ev) => ev.id === parseInt(id));
        setEvent(foundEvent);
        window.scrollTo(0, 0);
    }, [id]);

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-bold tracking-widest text-gray-400">
                Memuat...
            </div>
        );
    }

    return (
        <div className="bg-[#fbffff] min-h-screen font-sans text-slate-900">
            <EventNavbar />

            <div className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* HEADER SECTION */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Detail Transaksi</h1>
                        <div className="flex items-center gap-3">
                            <button className="px-6 py-2.5 rounded-lg bg-pink-50 text-red-600 font-bold text-sm hover:bg-pink-100 transition-all">
                                Batalkan Transaksi
                            </button>
                            <button
                                onClick={() => navigate(`/checkout/${id}`, { state: { fromDetail: true } })}
                                className="px-6 py-2.5 rounded-lg bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
                            >
                                Bayar Sekarang
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: EVENT CARD */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-32">
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-52 object-cover"
                                />
                                <div className="p-6 space-y-4">
                                    <h2 className="text-lg font-black leading-tight">{event.title}</h2>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-700">{event.date}</p>
                                        <p className="text-sm text-slate-500 font-medium">VRTX Compund Space</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 text-center">
                                        <button className="text-blue-700 font-bold text-sm hover:underline">
                                            Lihat Detail Acara
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: DATA SECTIONS */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* DETAIL PESANAN */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-50">
                                    <h3 className="font-black text-slate-800">Detail Pesanan</h3>
                                </div>
                                <div className="grid grid-cols-2 divide-y divide-x divide-slate-50">
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nomor Faktur</p>
                                        <p className="font-bold text-slate-700">yp-1220255164105-3b284e</p>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                                        <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[11px] font-black uppercase tracking-wide">
                                            Waiting For Payment
                                        </span>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Transaksi</p>
                                        <p className="font-bold text-slate-700">20 Desember 2025, 23:41 WIB</p>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah</p>
                                        <p className="font-bold text-slate-700">1 Tiket</p>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</p>
                                        <p className="font-bold text-slate-700">{selectedPayment?.toUpperCase() || "BCA"}</p>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Akun Virtual</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-700">3816529350750232</p>
                                            <HiOutlineDuplicate size={16} className="text-slate-400 cursor-pointer hover:text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="col-span-2 p-5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pembayaran</p>
                                            <p className="text-lg font-black text-slate-800">{rupiah(total)}</p>
                                        </div>
                                        <button className="text-blue-700 font-bold text-sm hover:underline">
                                            Lihat Detail
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* DETAIL PEMBELI */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-50">
                                    <h3 className="font-black text-slate-800">Detail Pembeli</h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    <div className="p-5 space-y-1 text-sm font-medium">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p>
                                        <p className="font-bold text-slate-700">gilankprasetyo8@gmail.com</p>
                                        <p className="text-[11px] text-slate-400 italic">E-Tiket akan dikirim ke email ini</p>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</p>
                                        <p className="font-bold text-slate-700">Gilang Prasetyo</p>
                                    </div>
                                </div>
                            </div>

                            {/* DETAIL PENGUNJUNG */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-50">
                                    <h3 className="font-black text-slate-800">Detail Pengunjung</h3>
                                </div>
                                <div className="p-5">
                                    <button
                                        onClick={() => setIsVisitorOpen(!isVisitorOpen)}
                                        className="w-full flex items-center justify-between py-2 group"
                                    >
                                        <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Pengunjung 1</span>
                                        <HiChevronDown
                                            size={20}
                                            className={`text-slate-400 transition-transform duration-300 ${isVisitorOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {isVisitorOpen && (
                                        <div className="mt-4 pt-4 border-t border-slate-50 space-y-4 animate-in fade-in slide-in-from-top-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama</p>
                                                    <p className="text-sm font-bold text-slate-700">Gilang Prasetyo</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">No. Telpon</p>
                                                    <p className="text-sm font-bold text-slate-700">085253328097</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiket</p>
                                                    <p className="text-sm font-bold text-slate-700">Reguler</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
