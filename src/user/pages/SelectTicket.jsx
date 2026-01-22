import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EventNavbar from "../../components/Layout/EventNavbar";
import Footer from "../../components/Layout/Footer";
import { HiCalendar, HiLocationMarker } from "react-icons/hi";
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
                image: eventData.poster_url
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-bold tracking-widest text-gray-400">
                Memuat...
            </div>
        );
    }

    const totalItems = Object.values(selectedTickets).reduce((acc, curr) => acc + curr, 0);
    const totalAmount = ticketTypes.reduce((acc, tt) => acc + (selectedTickets[tt.id] || 0) * tt.price, 0);

    return (
        <div className="bg-[#fbffff] min-h-screen font-sans text-slate-900">
            <EventNavbar />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* LEFT COLUMN: TICKET CATEGORIES */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <h2 className="text-xl font-bold">Kategori Tiket</h2>
                                </div>
                                <div className="p-6 space-y-6">
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
                                            return (selectedTickets[tt.id] || 0) > 0 ? "+" : "Tambah";
                                        };

                                        return (
                                            <div key={tt.id} className={`border rounded-xl p-6 space-y-4 transition-all ${isAvailable ? 'border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-left">
                                                        <h3 className="text-lg font-bold">{tt.name}</h3>
                                                        <p className="text-[#b1451a] font-extrabold text-lg">{rupiah(tt.price)}</p>

                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-100">
                                                                Quota: {tt.quota - tt.sold} Remaining
                                                            </p>
                                                            {isNotStarted && (
                                                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                                    Starts: {saleStart.toLocaleDateString('id-ID')}
                                                                </p>
                                                            )}
                                                            {isEnded && (
                                                                <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                                                    Sale Ended
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {(selectedTickets[tt.id] || 0) > 0 && (
                                                            <button
                                                                onClick={() => handleTicketChange(tt.id, -1)}
                                                                className="w-10 h-10 rounded-xl border-2 border-[#b1451a] text-[#b1451a] font-bold flex items-center justify-center hover:bg-orange-50 transition-all"
                                                            >
                                                                -
                                                            </button>
                                                        )}
                                                        {(selectedTickets[tt.id] || 0) > 0 && <span className="text-lg font-bold w-6 text-center">{selectedTickets[tt.id]}</span>}
                                                        <button
                                                            disabled={!isAvailable}
                                                            onClick={() => handleTicketChange(tt.id, 1)}
                                                            className={`px-6 py-2 rounded-xl font-bold transition-all ${isAvailable
                                                                ? ((selectedTickets[tt.id] || 0) > 0 ? 'bg-[#b1451a] text-white' : 'bg-orange-50 text-[#b1451a] border border-orange-100 hover:bg-orange-100')
                                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                                }`}
                                                        >
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
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6 sticky top-28">
                                <h2 className="text-xl font-bold">Detail Pesanan</h2>

                                <div className="flex gap-4">
                                    <img
                                        src={event.image || "https://images.unsplash.com/photo-1540575861501-7ad05823c93f?q=80&w=2070&auto=format&fit=crop"}
                                        alt={event.title}
                                        className="w-24 h-16 object-cover rounded-lg shadow-sm"
                                    />
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-sm leading-tight">{event.title}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                            <HiCalendar />
                                            <span>{event.event_date}</span>
                                        </div>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{event.location}</p>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="space-y-3">
                                    {ticketTypes.map(tt => (selectedTickets[tt.id] || 0) > 0 && (
                                        <div key={tt.id} className="flex items-center justify-between text-sm font-medium">
                                            <span className="text-slate-500">{selectedTickets[tt.id]}x {tt.name}</span>
                                            <span className="text-slate-900 font-bold">{rupiah(selectedTickets[tt.id] * tt.price)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="font-bold">Total</span>
                                        <span className="text-xl font-black">{rupiah(totalAmount)}</span>
                                    </div>

                                    <button
                                        disabled={totalItems === 0}
                                        onClick={() => navigate(`/checkout/${event.id}`, { state: { selectedTickets, totalAmount, event } })}
                                        className={`w-full py-4 rounded-xl font-bold transition-all ${totalItems > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        {totalItems > 0 ? "Checkout" : "Pilih Tiket Dulu"}
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
