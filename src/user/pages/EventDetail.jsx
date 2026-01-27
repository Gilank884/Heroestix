import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import EventNavbar from "../../components/Layout/EventNavbar";
import BottomBar from "../../components/Layout/Footer";
import {
    MapPin,
    Calendar,
    Ticket,
    Clock,
    ChevronLeft,
    Share2,
    Instagram,
    ExternalLink
} from "lucide-react";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import { supabase } from "../../lib/supabaseClient";

const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasInactiveTickets, setHasInactiveTickets] = useState(false);

    const [showFullDesc, setShowFullDesc] = useState(false);

    useEffect(() => {
        fetchEventDetail();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchEventDetail = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("events")
                .select("*, creators(brand_name)")
                .eq("id", id)
                .single();

            if (error) throw error;

            setEvent({
                ...data,
                image: data.poster_url, // Map for UI compatibility
                price: 0 // Will be determined by ticket types
            });

            // Fetch the minimum price from ticket_types and check for inactive status
            const { data: tickets } = await supabase
                .from("ticket_types")
                .select("*")
                .eq("event_id", id)
                .order("price", { ascending: true });

            if (tickets?.length > 0) {
                // Find minimum price among ACTIVE tickets
                const activeTickets = tickets.filter(t => t.status === 'active');
                if (activeTickets.length > 0) {
                    setEvent(prev => ({ ...prev, price: activeTickets[0].price }));
                } else {
                    setEvent(prev => ({ ...prev, price: tickets[0].price }));
                }

                // Check if any ticket is inactive
                const inactive = tickets.some(t => t.status === 'inactive');
                setHasInactiveTickets(inactive);
            }

        } catch (error) {
            console.error("Error fetching event details:", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 uppercase font-bold tracking-widest text-slate-300">
                Memuat Event...
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
            <EventNavbar />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

                    {/* BACK BUTTON */}
                    <button
                        onClick={() => navigate("/")}
                        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold transition-colors group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Events
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* LEFT COLUMN: IMAGE & DESCRIPTION */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/5 border border-slate-100 relative group">
                                <img
                                    src={event.image || "https://images.unsplash.com/photo-1540575861501-7ad05823c93f?q=80&w=2070&auto=format&fit=crop"}
                                    alt={event.title}
                                    className="w-full h-auto object-cover aspect-[21/9] md:aspect-[16/8]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                            </div>

                            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                                        Deskripsi Event
                                    </h2>
                                    <button className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                                <div className={`text-slate-600 leading-relaxed space-y-4 text-lg ${!showFullDesc && "line-clamp-6 relative"}`}>
                                    <p>
                                        {event.description || "Tidak ada deskripsi untuk event ini."}
                                    </p>
                                    {!showFullDesc && (
                                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowFullDesc(!showFullDesc)}
                                    className="text-blue-600 font-bold hover:text-blue-700 transition-colors py-2 flex items-center gap-2"
                                >
                                    {showFullDesc ? "Tampilkan Lebih Sedikit" : "Tampilkan Lebih Banyak"}
                                </button>
                            </section>

                            <hr className="my-12 border-slate-200/50" />
                        </div>

                        {/* RIGHT COLUMN: EVENT INFO, PRICE, SOCIAL MEDIA */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* EVENT INFO CARD */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8 sticky top-32">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                                        Official Event
                                    </div>
                                    <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-slate-900">
                                        {event.title}
                                    </h1>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 text-slate-600 group">
                                        <div className="p-3 rounded-2xl bg-slate-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                            <Calendar size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Date</span>
                                            <span className="text-[15px] font-bold text-slate-700">{event.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-600 group">
                                        <div className="p-3 rounded-2xl bg-slate-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                            <Clock size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gate Open</span>
                                            <span className="text-[15px] font-bold text-slate-700">{event.event_time?.substring(0, 5)} WIB</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 text-slate-600 group">
                                        <div className="p-3 rounded-2xl bg-slate-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</span>
                                            <p className="text-[14px] leading-tight font-bold text-slate-700 mb-1">{event.location}</p>
                                            <a href="#" className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1">
                                                Open Maps <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-bold italic">
                                        {event.creators?.brand_name?.charAt(0) || "C"}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Organized By</p>
                                        <p className="font-bold text-[15px] text-slate-900">{event.creators?.brand_name || "Creator"}</p>
                                    </div>
                                </div>

                                {/* PRICE & ACTION SECTION */}
                                <div className="space-y-6 pt-4">
                                    {hasInactiveTickets && (
                                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-700">
                                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                                                <Ticket size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Coming Soon</p>
                                                <p className="text-[13px] font-bold text-slate-900 leading-tight">Ticket availability update soon</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ticket Price Starting At</span>
                                        <span className="text-3xl font-black text-blue-600">{rupiah(event.price)}</span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/select-ticket/${event.id}`)}
                                        className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-[1.25rem] font-bold transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                                    >
                                        Beli Sekarang
                                        <Ticket className="group-hover:rotate-12 transition-transform" size={20} />
                                    </button>
                                </div>

                                {/* SOCIAL MEDIA COMPACT */}
                                <div className="pt-4 flex items-center justify-center gap-6">
                                    <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100">
                                        <FaInstagram size={18} />
                                    </a>
                                    <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100">
                                        <FaTiktok size={18} />
                                    </a>
                                    <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100">
                                        <Share2 size={18} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <BottomBar />
        </div>
    );
}

