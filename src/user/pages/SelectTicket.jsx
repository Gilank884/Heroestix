import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import {
    Calendar,
    MapPin,
    Minus,
    Plus,
    ChevronLeft,
    ShoppingBag,
    Info,
    Clock,
    Ticket
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function SelectTicket() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState({}); // { ticketTypeId: count }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEventAndTickets();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchEventAndTickets = async () => {
        setLoading(true);
        try {
            // 1. Fetch Event
            const { data: eventData, error: eventError } = await supabase
                .from("events")
                .select("*")
                .eq("id", id)
                .single();

            if (eventError) throw eventError;
            setEvent({
                ...eventData,
                image: eventData.poster_url,
                date: eventData.event_date
            });

            // 2. Fetch Ticket Types
            const { data: ticketData, error: ticketError } = await supabase
                .from("ticket_types")
                .select("*")
                .eq("event_id", id)
                .order("price", { ascending: true });

            if (ticketError) throw ticketError;
            setTicketTypes(ticketData || []);

        } catch (error) {
            console.error("Error fetching tickets:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTicketChange = (ticketId, delta) => {
        setSelectedTickets(prev => {
            const currentCount = prev[ticketId] || 0;
            const currentTotal = Object.values(prev).reduce((a, b) => a + b, 0);

            if (delta > 0 && currentTotal >= 5) {
                alert("Maksimal pembelian adalah 5 tiket per akun.");
                return prev;
            }

            const newCount = Math.max(0, currentCount + delta);
            return { ...prev, [ticketId]: newCount };
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white uppercase font-bold tracking-widest text-slate-300">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                Memuat Tiket...
            </div>
        );
    }

    const totalItems = Object.values(selectedTickets).reduce((acc, curr) => acc + curr, 0);
    const totalAmount = ticketTypes.reduce((acc, tt) => acc + (selectedTickets[tt.id] || 0) * (tt.price_gross || tt.price), 0);

    return (
        <div className="bg-slate-50/30 min-h-screen font-sans text-slate-900">
            <Navbar alwaysScrolled={true} />

            <div className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* BACK BUTTON */}
                    <button
                        onClick={() => navigate(`/event/${id}`)}
                        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-600 group-hover:text-blue-600 transition-all">
                            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        Kembali ke Detail Event
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: EVENT INFO & TICKET CATEGORIES */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* EVENT HEADER */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-sm shrink-0">
                                    <img
                                        src={event.image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="space-y-4 flex-1">
                                    <h1 className="text-xl font-bold text-slate-900 leading-tight">
                                        {event.title}
                                    </h1>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Calendar size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">{event.date}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Clock size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">{event.event_time?.substring(0, 5) || "10:00"} WIB</p>
                                        </div>
                                        <div className="flex items-center gap-3 sm:col-span-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <MapPin size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 w-full truncate">{event.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TICKET LIST */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Ticket size={20} className="text-blue-600" />
                                        Pilih Kategori Tiket
                                    </h2>
                                </div>

                                <div className="p-6 space-y-6">
                                    {ticketTypes.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400">
                                            Tidak ada tiket tersedia saat ini.
                                        </div>
                                    ) : (
                                        ticketTypes.map((tt) => {
                                            const now = new Date();
                                            const saleStart = tt.start_date ? new Date(tt.start_date) : null;
                                            const saleEnd = tt.end_date ? new Date(tt.end_date) : null;
                                            const isSoldOut = (tt.quota - tt.sold) <= 0;
                                            const isNotStarted = saleStart && now < saleStart;
                                            const isEnded = saleEnd && now > saleEnd;
                                            const isInactive = tt.status === 'inactive';

                                            const isAvailable = !isInactive && !isSoldOut && !isNotStarted && !isEnded;
                                            const count = selectedTickets[tt.id] || 0;

                                            return (
                                                <div
                                                    key={tt.id}
                                                    className={`
                                                        relative border rounded-xl p-5 transition-all duration-300
                                                        ${count > 0 ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-200'}
                                                        ${!isAvailable && 'opacity-60 bg-slate-50'}
                                                    `}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="space-y-2 flex-1">
                                                            <div className="flex items-start justify-between">
                                                                <h3 className="text-lg font-bold text-slate-900">{tt.name}</h3>
                                                                {!isAvailable && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-200 text-slate-500 rounded-md">
                                                                        {isSoldOut ? "Habis" : isNotStarted ? "Segera" : "Berakhir"}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="space-y-0.5">
                                                                <p className="text-xl font-bold text-blue-600">{rupiah(tt.price_gross || tt.price)}</p>
                                                                {tt.price_net && (
                                                                    <p className="text-xs font-medium text-slate-400 italic">
                                                                        Termasuk pajak & biaya admin
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-3 pt-2">
                                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                                                                    <Info size={12} />
                                                                    Sisa: {tt.quota - tt.sold}
                                                                </div>
                                                                {isNotStarted && (
                                                                    <span className="text-[10px] text-blue-600 font-bold">
                                                                        Mulai: {saleStart.toLocaleDateString('id-ID')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* COUNTER */}
                                                        {isAvailable && (
                                                            <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start md:self-center">
                                                                <button
                                                                    onClick={() => handleTicketChange(tt.id, -1)}
                                                                    disabled={count === 0}
                                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${count === 0 ? 'text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-red-500'}`}
                                                                >
                                                                    <Minus size={16} />
                                                                </button>
                                                                <span className="w-8 text-center font-bold text-slate-900 text-lg">{count}</span>
                                                                <button
                                                                    onClick={() => handleTicketChange(tt.id, 1)}
                                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${totalItems >= 5 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                                                    disabled={totalItems >= 5}
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ORDER DETAILS */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-24 space-y-6">
                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-50">
                                        <ShoppingBag size={20} className="text-blue-600" />
                                        Ringkasan Pesanan
                                    </h2>

                                    <div className="space-y-3">
                                        {ticketTypes.map(tt => (selectedTickets[tt.id] || 0) > 0 && (
                                            <div key={tt.id} className="flex items-center justify-between text-sm group animate-fade-in-up">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 font-bold">{tt.name}</span>
                                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{selectedTickets[tt.id]} x {rupiah(tt.price_gross || tt.price)}</span>
                                                </div>
                                                <span className="text-slate-900 font-bold">{rupiah(selectedTickets[tt.id] * (tt.price_gross || tt.price))}</span>
                                            </div>
                                        ))}
                                        {totalItems === 0 && (
                                            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 text-xs font-medium">Belum ada tiket dipilih</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">Total Pembayaran</span>
                                            <span className="text-xl font-bold text-slate-900">{rupiah(totalAmount)}</span>
                                        </div>

                                        <button
                                            disabled={totalItems === 0}
                                            onClick={() => navigate(`/checkout/${event.id}`, { state: { selectedTickets, totalAmount, event } })}
                                            className={`w-full py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${totalItems > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-[0.98]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                                        >
                                            Lanjut Pembayaran
                                        </button>
                                    </div>
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
