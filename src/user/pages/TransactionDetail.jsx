import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import EventNavbar from "../../components/Layout/EventNavbar";
import Footer from "../../components/Layout/Footer";
import { HiOutlineDuplicate, HiChevronDown } from "react-icons/hi";

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
            <EventNavbar />

            <div className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* HEADER SECTION */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-left">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Detail Transaksi</h1>
                        <div className="flex items-center gap-3">
                            {order.status !== 'paid' && (
                                <button className="px-6 py-2.5 rounded-lg bg-pink-50 text-red-600 font-bold text-sm hover:bg-pink-100 transition-all">
                                    Batalkan Transaksi
                                </button>
                            )}
                            {order.status !== 'paid' && (
                                <button
                                    onClick={() => navigate(`/checkout/${firstEvent?.id}`, { state: { orderId: order.id } })}
                                    className="px-6 py-2.5 rounded-lg bg-[#b1451a] text-white font-bold text-sm hover:bg-[#8e3715] transition-all shadow-lg shadow-orange-100"
                                >
                                    Bayar Sekarang
                                </button>
                            )}
                        </div>
                    </div>

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

                            {/* DETAIL PENGUNJUNG / TIKET */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-left">
                                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                                    <h3 className="font-black text-slate-800">Detail Tiket</h3>
                                    <button
                                        onClick={() => setIsVisitorOpen(!isVisitorOpen)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <HiChevronDown size={24} className={`transition-transform duration-300 ${isVisitorOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                                {isVisitorOpen && (
                                    <div className="divide-y divide-slate-50">
                                        {order.tickets?.map((ticket, idx) => (
                                            <div key={ticket.id} className="p-6 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-bold text-slate-700">Tiket {idx + 1}</p>
                                                    <span className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black uppercase text-[#b1451a] border border-[#b1451a]/10">
                                                        {ticket.ticket_types?.name}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Tiket</p>
                                                        <p className="text-sm font-bold text-slate-700 uppercase">{ticket.status}</p>
                                                    </div>
                                                    <div className="lg:col-span-2">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PayLoad / ID</p>
                                                        <p className="text-sm font-mono text-slate-500 break-all">{ticket.qr_code}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
