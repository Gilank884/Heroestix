import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { HiOutlineDuplicate, HiChevronDown } from "react-icons/hi";
import { supabase } from "../../lib/supabaseClient";
import { QRCode } from "react-qr-code";

import topEvents from "../../data/TopEvent";
import newEvents from "../../data/NewEvent";
import recommendedEvents from "../../data/RecommendedEvent";

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

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVisitorOpen, setIsVisitorOpen] = useState(true);

    useEffect(() => {
        fetchTransactionDetail();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchTransactionDetail = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`
                    *,
                    tickets (
                        *,
                        ticket_types (
                            *,
                            events (*)
                        )
                    )
                `)
                .eq("id", id)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error("Error fetching order:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-bold tracking-widest text-gray-400">
                Memuat Detail Transaksi...
            </div>
        );
    }

    const firstEvent = order.tickets?.[0]?.ticket_types?.events;

    return (
        <div className="bg-[#fbffff] min-h-screen font-sans text-slate-900">
            <Navbar alwaysScrolled={true} />

            <div className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: EVENT CARD */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-32">
                                <img
                                    src={firstEvent?.poster_url || "/assets/placeholder.png"}
                                    alt={firstEvent?.title}
                                    className="w-full h-52 object-cover"
                                />
                                <div className="p-6 space-y-4 text-left">
                                    <h2 className="text-lg font-black leading-tight">{firstEvent?.title}</h2>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-700">{firstEvent?.event_date}</p>
                                        <p className="text-sm text-slate-500 font-medium">{firstEvent?.location}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 text-center">
                                        <button
                                            onClick={() => navigate(`/event/${firstEvent?.id}`)}
                                            className="text-[#b1451a] font-bold text-sm hover:underline"
                                        >
                                            Lihat Detail Acara
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: DATA SECTIONS */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* DETAIL PESANAN */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-left">
                                <div className="p-5 border-b border-slate-50">
                                    <h3 className="font-black text-slate-800">Detail Pesanan</h3>
                                </div>
                                <div className="grid grid-cols-2 divide-y divide-x divide-slate-50 border-b border-slate-50">
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nomor Faktur</p>
                                        <p className="font-bold text-slate-700 text-sm">{order.id.toUpperCase()}</p>
                                    </div>
                                    <div className="p-5 space-y-1 bg-blue-50/50">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Kode Booking</p>
                                        <p className="font-black text-blue-700 text-lg tracking-widest">{order.booking_code || "-"}</p>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide ${order.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Transaksi</p>
                                        <p className="font-bold text-slate-700 text-sm">
                                            {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                                        </p>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah</p>
                                        <p className="font-bold text-slate-700 text-sm">{order.tickets?.length} Tiket</p>
                                    </div>
                                </div>
                                <div className="p-5 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pembayaran</p>
                                        <p className="text-lg font-black text-slate-800">{rupiah(order.total)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* DETAIL PENGUNJUNG / TIKET (REDESIGNED) */}
                            <div className="space-y-6">
                                <h3 className="font-black text-slate-800 text-lg px-2">E-Tiket Anda ({order.tickets?.length})</h3>

                                {order.tickets?.map((ticket, idx) => (
                                    <div key={ticket.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 relative group transition-all hover:shadow-xl">
                                        {/* Ticket Header (Blue Top) */}
                                        <div className="bg-[#1b3bb6] p-6 text-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                            <div className="relative z-10 flex justify-between items-start">
                                                <div>
                                                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Tiket {idx + 1}</p>
                                                    <h3 className="text-2xl font-black">{ticket.ticket_types?.name}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-white/20 backdrop-blur-sm`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* QR Code Section (Center & Large) */}
                                        <div className="p-8 flex flex-col items-center justify-center bg-white relative">
                                            <div className="p-1 rounded-2xl border-2 border-slate-100 shadow-sm bg-white">
                                                {ticket.qr_code ? (
                                                    <QRCode
                                                        size={200}
                                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                        value={ticket.qr_code}
                                                        viewBox={`0 0 256 256`}
                                                    />
                                                ) : (
                                                    <div className="w-48 h-48 bg-slate-50 flex items-center justify-center text-slate-400 font-bold rounded-xl">
                                                        NO QR
                                                    </div>
                                                )}
                                            </div>
                                            <p className="mt-4 text-xs font-mono text-slate-400 font-bold tracking-widest">{ticket.qr_code}</p>

                                            {/* Cutout Lines (Visual Effect) */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#fbffff] rounded-r-full" />
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#fbffff] rounded-l-full" />
                                            <div className="absolute left-4 right-4 top-1/2 border-t-2 border-dashed border-slate-100 -z-10" />
                                        </div>

                                        {/* Visitor Detail Footer */}
                                        <div className="bg-slate-50 p-6 border-t border-slate-100">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Pengunjung</p>
                                                    <p className="font-bold text-slate-800 line-clamp-1">{ticket.full_name || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                                    <p className="font-bold text-slate-800 line-clamp-1">{ticket.email || "-"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
