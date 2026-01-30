import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import BottomBar from "../../components/Layout/Footer";
import {
    MapPin,
    Calendar,
    Ticket,
    Clock,
    ChevronLeft,
    Share2,
    Instagram,
    ExternalLink,
    AlertCircle,
    Building2,
    Minus,
    Plus,
    User,
    ChevronDown,
    Flag,
    Navigation,
    MessageCircle
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import EventCard from "../../components/home/EventCard";

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
    const [quantity, setQuantity] = useState(1);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        fetchEventDetail();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchEventDetail = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("events")
                .select("*, creators(*), ticket_types(*)")
                .eq("id", id)
                .single();

            if (error) throw error;

            const tickets = data.ticket_types || [];
            let displayPrice = 0;
            let inactive = false;

            if (tickets.length > 0) {
                const activeTickets = tickets.filter(t => t.status === 'active');
                displayPrice = activeTickets.length > 0 ? activeTickets[0].price : tickets[0].price;
                inactive = tickets.some(t => t.status === 'inactive');
            }

            setEvent({
                ...data,
                image: data.poster_url,
                date: data.event_date,
                price: displayPrice
            });
            setHasInactiveTickets(inactive);

            fetchRecommendations(data.category, data.id);

        } catch (error) {
            console.error("Error fetching event details:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendations = async (category, currentId) => {
        try {
            let query = supabase
                .from("events")
                .select("*, ticket_types(price)")
                .neq("id", currentId)
                .neq("status", "archived")
                .limit(4);

            if (category) {
                query = query.eq("category", category);
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error } = await query;
            if (error) throw error;
            if (data) processRecs(data);
        } catch (err) {
            console.error("Error fetching recommendations:", err);
        }
    };

    const processRecs = (data) => {
        const formatted = data.map(ev => ({
            id: ev.id,
            title: ev.title,
            location: ev.location,
            date: ev.event_date,
            image: ev.poster_url,
            price: ev.ticket_types?.length > 0 ? Math.min(...ev.ticket_types.map(t => t.price)) : 0,
            status: ev.status
        }));
        setRecommendations(formatted);
    };

    const handleBuyNow = () => {
        navigate(`/select-ticket/${id}?qty=${quantity}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white uppercase font-bold tracking-widest text-slate-300">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                Memuat Event...
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="bg-slate-50/30 min-h-screen font-sans text-slate-900 pb-10">
            <Navbar alwaysScrolled={true} />

            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT COLUMN: BANNER & DESCRIPTION */}
                        <div className="lg:col-span-7 space-y-8">
                            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
                                <img
                                    src={event.image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                                    alt={event.title}
                                    className="w-full h-auto object-cover aspect-[4/3] lg:aspect-auto"
                                />
                            </div>

                            <div className="space-y-4 px-2">
                                <h2 className="text-xl font-bold text-slate-900 transition-all">Deskripsi</h2>
                                <p className="text-slate-500 leading-relaxed text-sm font-medium line-clamp-2 md:line-clamp-none whitespace-pre-wrap">
                                    {event.description || "Tidak ada deskripsi tersedia untuk event ini."}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: INFO CARDS */}
                        <div className="lg:col-span-5 space-y-4">
                            {/* EVENT MAIN INFO CARD */}
                            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-6">
                                <h1 className="text-lg md:text-xl font-extrabold text-[#111827] leading-tight">
                                    {event.title}
                                </h1>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Calendar size={18} className="text-slate-400 mt-0.5" />
                                        <p className="text-sm font-bold text-slate-700">{event.date}</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock size={18} className="text-slate-400 mt-0.5" />
                                        <p className="text-sm font-bold text-slate-700">{event.event_time?.substring(0, 5) || "10:00"} WIB</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-slate-400 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-700 leading-tight">{event.location}</p>
                                            <button className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
                                                Petunjuk Arah
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <p className="text-[12px] font-medium text-slate-400 mb-1">Dibuat Oleh</p>
                                    <p className="text-sm font-bold text-slate-900">{event.creators?.brand_name || "Official Organizer"}</p>
                                </div>
                            </div>

                            {/* PRICE & PURCHASE CARD */}
                            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-500">Mulai Dari</span>
                                    <span className="text-xl font-extrabold text-slate-900">{rupiah(event.price)}</span>
                                </div>
                                <button
                                    onClick={handleBuyNow}
                                    className="w-full bg-[#1b3bb6] hover:bg-[#16319c] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/10 active:scale-[0.98]"
                                >
                                    Beli Sekarang
                                </button>
                            </div>

                            {/* SOCIAL MEDIA CARD */}
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-slate-700">Media Sosial</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700">
                                        <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                                            <Instagram size={18} className="text-pink-600" />
                                        </div>
                                        Instagram
                                    </button>
                                    <button className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                            <MessageCircle size={18} className="text-green-600" />
                                        </div>
                                        WhatsApp
                                    </button>
                                </div>
                            </div>

                            {/* AUTHENTICITY NOTICE */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                                <p className="text-[11px] font-medium text-slate-500 italic">
                                    Beli tiket dari orang lain? Cek keaslian tiketmu <Link to="/" className="text-blue-600 font-bold hover:underline">disini</Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RECOMMENDATIONS SECTION (Hidden as user wants simple, but keep code for future) */}
                    {/* {recommendations.length > 0 && (
                        <div className="mt-24 space-y-10 border-t border-slate-100 pt-16">
                            ...
                        </div>
                    )} */}
                </div>
            </main>

            <BottomBar />
        </div>
    );
}
