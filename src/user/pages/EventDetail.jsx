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
    Facebook,
    Twitter,
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
    MessageCircle,
    Tag
} from "lucide-react";
import { getCategoryName, getSubCategoryName } from "../../constants/categories";
import { supabase } from "../../lib/supabaseClient";
import EventCard from "../../components/home/EventCard";

const XIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
);

const TikTokIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

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
    const [isEnded, setIsEnded] = useState(false);

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
                const target = activeTickets.length > 0 ? activeTickets[0] : tickets[0];
                displayPrice = target.price_gross || target.price;
                inactive = tickets.some(t => t.status === 'inactive');
            }

            // Determine if event has ended
            let ended = false;
            if (data.event_date) {
                const eventDate = new Date(data.event_date);
                if (data.event_time) {
                    const [hours, minutes] = data.event_time.split(':');
                    eventDate.setHours(parseInt(hours), parseInt(minutes), 0);
                } else {
                    eventDate.setHours(23, 59, 59);
                }
                ended = new Date() > eventDate;
            }

            setEvent({
                ...data,
                image: data.poster_url,
                date: data.event_date,
                price: displayPrice
            });
            setHasInactiveTickets(inactive);
            setIsEnded(ended);

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
            price: ev.ticket_types?.length > 0 ? Math.min(...ev.ticket_types.map(t => t.price_gross || t.price)) : 0,
            status: ev.status,
            category: ev.category
        }));
        setRecommendations(formatted);
    };

    const handleBuyNow = () => {
        navigate(`/select-ticket/${id}?qty=${quantity}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 uppercase tracking-widest text-slate-300 dark:text-slate-600">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                Memuat Event...
            </div>
        );
    }

    if (!event) return null;

    const CreatorProfileSection = () => {
        const creator = event.creators;
        if (!creator) return null;

        const socials = [
            {
                id: 'instagram',
                label: 'Instagram',
                icon: <Instagram size={16} />,
                url: creator.instagram_url,
                color: 'text-[#E4405F]',
                bg: 'bg-[#E4405F]/5',
                border: 'border-[#E4405F]/20',
                hover: 'hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F]'
            },
            {
                id: 'x',
                label: 'X (Twitter)',
                icon: <XIcon size={16} />,
                url: creator.x_url,
                color: 'text-slate-900 dark:text-white',
                bg: 'bg-slate-900/5 dark:bg-white/5',
                border: 'border-slate-900/20 dark:border-white/20',
                hover: 'hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 hover:border-slate-900 dark:hover:border-white'
            },
            {
                id: 'tiktok',
                label: 'TikTok',
                icon: <TikTokIcon size={16} />,
                url: creator.tiktok_url,
                color: 'text-black dark:text-white',
                bg: 'bg-black/5 dark:bg-white/5',
                border: 'border-black/20 dark:border-white/20',
                hover: 'hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:border-black dark:hover:border-white'
            },
            {
                id: 'facebook',
                label: 'Facebook',
                icon: <Facebook size={16} />,
                url: creator.facebook_url,
                color: 'text-[#1877F2]',
                bg: 'bg-[#1877F2]/5',
                border: 'border-[#1877F2]/20',
                hover: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]'
            }
        ].filter(s => s.url);

        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <Link
                        to={`/creator/${creator.id}`}
                        className="flex items-center gap-4 flex-shrink-0 group/creator hover:opacity-80 transition-all"
                    >
                        {creator.image_url ? (
                            <div className="w-16 h-16 rounded-full border-2 border-blue-100 dark:border-blue-900 shadow-sm overflow-hidden flex-shrink-0 group-hover/creator:border-blue-600 dark:group-hover/creator:border-blue-500 transition-colors">
                                <img
                                    src={creator.image_url}
                                    alt={creator.brand_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center border border-blue-100 dark:border-blue-800 shadow-sm flex-shrink-0 group-hover/creator:border-blue-600 dark:group-hover/creator:border-blue-500 transition-colors">
                                <Building2 size={28} />
                            </div>
                        )}
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">Profil Kreator</p>
                            <h3 className="text-lg text-[#111827] dark:text-slate-100 leading-tight group-hover/creator:text-blue-600 dark:group-hover/creator:text-blue-400 transition-colors">
                                {creator.brand_name || "Official Organizer"}
                            </h3>
                        </div>
                    </Link>

                    {/* Middle: Description & Address */}
                    <div className="flex-1 space-y-3">
                        {creator.description && (
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {creator.description}
                            </p>
                        )}
                        {creator.address && (
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[12px] text-slate-500 leading-relaxed italic">
                                    {creator.address}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Social Media */}
                    {socials.length > 0 && (
                        <div className="flex-shrink-0 self-center md:self-start">
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-3 text-center md:text-left">Social Media</p>
                            <div className="flex flex-wrap items-center gap-3">
                                {socials.map(social => (
                                    <a
                                        key={social.id}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all border
                                            ${social.bg} ${social.color} ${social.border} ${social.hover}
                                            active:scale-95 shadow-sm hover:shadow-md
                                        `}
                                    >
                                        {social.icon}
                                        <span>{social.label}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-50/30 dark:bg-slate-950/30 min-h-screen font-sans text-slate-900 dark:text-slate-100 pb-10">
            <Navbar alwaysScrolled={true} />

            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT COLUMN: BANNER & DESCRIPTION */}
                        <div className="lg:col-span-7 space-y-8">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-800 group">
                                <img
                                    src={event.image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                                    alt={event.title}
                                    className={`w-full h-auto object-cover aspect-[4/3] lg:aspect-auto transition-transform duration-700 group-hover:scale-105 ${isEnded ? 'grayscale opacity-70' : ''}`}
                                />
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Deskripsi</h2>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm whitespace-pre-wrap">
                                    {event.description || "Tidak ada deskripsi tersedia untuk event ini."}
                                </p>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: INFO CARDS */}
                        <div className="lg:col-span-5 space-y-4">
                            {/* EVENT MAIN INFO CARD */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                                <h1 className="text-xl md:text-2xl text-slate-900 dark:text-slate-50 leading-tight tracking-tight">
                                    {event.title}
                                </h1>

                                {event.category && (
                                    <div className="flex flex-wrap gap-2">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-[10px] uppercase tracking-wider border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
                                            <Tag size={10} />
                                            {getCategoryName(event.category)}
                                        </div>
                                        {event.sub_category && (
                                            <div className="inline-flex items-center px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] uppercase tracking-wider border border-slate-100 dark:border-slate-700">
                                                {getSubCategoryName(event.category, event.sub_category)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div className="flex items-start gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Tanggal</p>
                                            <p className={`text-sm ${isEnded ? 'text-red-600 dark:text-red-400 font-bold uppercase italic' : 'text-slate-900 dark:text-slate-100'}`}>
                                                {isEnded ? "Event Telah Berakhir" : event.date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Waktu</p>
                                            <p className="text-sm text-slate-900 dark:text-slate-100">{event.event_time?.substring(0, 5) || "10:00"} WIB</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Lokasi</p>
                                            <p className="text-sm text-slate-900 dark:text-slate-100 leading-snug">{event.location}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                    {event.creators?.image_url ? (
                                        <img src={event.creators.image_url} alt="" className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><User size={14} /></div>
                                    )}
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Creator</p>
                                        <p className="text-xs text-slate-900 dark:text-slate-100">{event.creators?.brand_name || "Official Organizer"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* PRICE & PURCHASE CARD */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 uppercase tracking-wide mb-1">Ticket Start From</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl text-slate-900 dark:text-slate-100">{rupiah(event.price)}</span>
                                            {hasInactiveTickets && (
                                                <span className="text-[10px] px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full border border-red-100 dark:border-red-900/50">Terbatas</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Ticket size={20} />
                                    </div>
                                </div>

                                <button
                                    onClick={handleBuyNow}
                                    disabled={isEnded}
                                    className={`w-full ${isEnded ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30'} py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
                                >
                                    {isEnded ? "Event Telah Berakhir" : "Beli Tiket"}
                                    {!isEnded && <ChevronLeft size={16} className="rotate-180" />}
                                </button>

                                <p className="text-center text-[10px] text-slate-400">
                                    Transaksi Aman & Terpercaya
                                </p>
                            </div>


                        </div>
                    </div>

                    {/* FULL WIDTH CREATOR PROFILE */}
                    <div className="mt-12">
                        <CreatorProfileSection />
                    </div>
                </div>
            </main>

            <BottomBar />
        </div>
    );
}
