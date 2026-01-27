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
    Clock
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
            const newCount = Math.max(0, currentCount + delta);
            return { ...prev, [ticketId]: newCount };
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 uppercase font-bold tracking-widest text-slate-300">
                Memuat Tiket...
            </div>
        );
    }

    const totalItems = Object.values(selectedTickets).reduce((acc, curr) => acc + curr, 0);
    const totalAmount = ticketTypes.reduce((acc, tt) => acc + (selectedTickets[tt.id] || 0) * tt.price, 0);

    return (
        <div className="bg-slate-50/30 min-h-screen font-sans text-slate-900">
            <Navbar alwaysScrolled={true} />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

                    {/* BACK BUTTON */}
                    <button
                        onClick={() => navigate(`/event/${id}`)}
                        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold transition-colors group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Event Details
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* LEFT COLUMN: EVENT INFO & TICKET CATEGORIES */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* SIMPLIFIED HEADER (Matches EventDetail Info Card Style) */}
                            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
                                <h1 className="text-xl md:text-2xl font-extrabold text-[#111827] leading-tight">
                                    {event.title}
                                </h1>

                                <div className="flex flex-wrap gap-x-8 gap-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <Calendar size={18} className="text-slate-400" />
                                        <p className="text-sm font-bold text-slate-700">{event.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <Clock size={18} className="text-slate-400" />
                                        <p className="text-sm font-bold text-slate-700">{event.event_time?.substring(0, 5) || "10:00"} WIB</p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <MapPin size={18} className="text-slate-400" />
                                        <p className="text-sm font-bold text-slate-700">{event.location}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                                <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-900">Pilih Kategori Tiket</h2>
                                    <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest">
                                        Limited Supply
                                    </div>
                                </div>
                                <div className="p-8 space-y-8">
                                    {ticketTypes.map((tt) => {
                                        const now = new Date();
                                        const saleStart = tt.start_date ? new Date(tt.start_date) : null;
                                        const saleEnd = tt.end_date ? new Date(tt.end_date) : null;
                                        const isSoldOut = (tt.quota - tt.sold) <= 0;
                                        const isNotStarted = saleStart && now < saleStart;
                                        const isEnded = saleEnd && now > saleEnd;
                                        const isInactive = tt.status === 'inactive';

                                        const isAvailable = !isInactive && !isSoldOut && !isNotStarted && !isEnded;

                                        const getStatusLabel = () => {
                                            if (isInactive || isNotStarted) return "Segera";
                                            if (isSoldOut) return "Habis";
                                            if (isEnded) return "Berakhir";
                                            return "Pilih";
                                        };

                                        return (
                                            <div key={tt.id} className={`group border rounded-2xl p-6  transition-all duration-300 ${isAvailable ? 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/20' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="text-left space-y-2">
                                                        <h3 className="text-xl font-bold text-slate-900">{tt.name}</h3>
                                                        <p className="text-blue-600 font-extrabold text-2xl">{rupiah(tt.price)}</p>

                                                        <div className="flex flex-wrap gap-2 mt-4">
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                                <Info size={12} className="text-blue-500" />
                                                                Quota: {tt.quota - tt.sold} Remaining
                                                            </div>
                                                            {isNotStarted && (
                                                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                                                    Starts: {saleStart.toLocaleDateString('id-ID')}
                                                                </p>
                                                            )}
                                                            {isEnded && (
                                                                <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                                                                    Sale Ended
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start md:self-center">
                                                        {(selectedTickets[tt.id] || 0) > 0 && (
                                                            <button
                                                                onClick={() => handleTicketChange(tt.id, -1)}
                                                                className="w-10 h-10 rounded-xl border border-slate-100 text-slate-400 font-bold flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                                                            >
                                                                <Minus size={18} />
                                                            </button>
                                                        )}
                                                        {(selectedTickets[tt.id] || 0) > 0 && <span className="text-xl font-extrabold w-8 text-center text-slate-900">{selectedTickets[tt.id]}</span>}
                                                        <button
                                                            disabled={!isAvailable}
                                                            onClick={() => handleTicketChange(tt.id, 1)}
                                                            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${isAvailable
                                                                ? ((selectedTickets[tt.id] || 0) > 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-white hover:bg-blue-600')
                                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            {isAvailable && (selectedTickets[tt.id] || 0) === 0 && <Plus size={18} />}
                                                            {getStatusLabel()}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ORDER DETAILS */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8 sticky top-32">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                    <ShoppingBag size={22} className="text-blue-600" />
                                    Ringkasan Pesanan
                                </h2>

                                <div className="flex gap-5">
                                    <div className="w-24 h-16 rounded-xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
                                        <img
                                            src={event.image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="space-y-1 overflow-hidden">
                                        <h3 className="font-bold text-sm leading-tight text-slate-900 truncate">{event.title}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                                            <Calendar size={12} className="text-blue-500" />
                                            <span>{event.date}</span>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-50" />

                                <div className="space-y-4">
                                    {ticketTypes.map(tt => (selectedTickets[tt.id] || 0) > 0 && (
                                        <div key={tt.id} className="flex items-center justify-between text-sm group">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 font-bold">{tt.name}</span>
                                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">{selectedTickets[tt.id]} Ticket</span>
                                            </div>
                                            <span className="text-slate-900 font-bold">{rupiah(selectedTickets[tt.id] * tt.price)}</span>
                                        </div>
                                    ))}
                                    {totalItems === 0 && (
                                        <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 text-xs font-medium italic">Belum ada tiket terpilih</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-slate-50">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Bayar</span>
                                            <span className="text-2xl font-black text-slate-900">{rupiah(totalAmount)}</span>
                                        </div>
                                    </div>

                                    <button
                                        disabled={totalItems === 0}
                                        onClick={() => navigate(`/checkout/${event.id}`, { state: { selectedTickets, totalAmount, event } })}
                                        className={`w-full py-5 rounded-[1.25rem] font-extrabold transition-all text-sm uppercase tracking-widest ${totalItems > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-[0.98]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                                    >
                                        {totalItems > 0 ? "Continue to Checkout" : "Pilih Tiket"}
                                    </button>
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
