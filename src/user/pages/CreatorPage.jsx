import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/Layout/Navbar";
import BottomBar from "../../components/Layout/Footer";
import {
    Building2,
    MapPin,
    Instagram,
    Facebook,
    Ticket,
    Search
} from "lucide-react";

// Custom X (Twitter) icon
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

// Simple Event Card for Creator Page
const SimpleEventCard = ({ id, image, title, description }) => {
    return (
        <Link
            to={`/event/${id}`}
            className="group block bg-white rounded-xl overflow-hidden border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300 flex flex-col h-full"
        >
            <div className="relative aspect-[16/10] overflow-hidden">
                <img
                    src={image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>
            <div className="p-4 flex-1 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {title}
                </h3>
                <p className="text-[12px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {description || "Tidak ada deskripsi tersedia."}
                </p>
            </div>
        </Link>
    );
};

export default function CreatorPage() {
    const { id } = useParams();
    const [creator, setCreator] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCreatorData();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchCreatorData = async () => {
        setLoading(true);
        try {
            // Fetch Creator Info
            const { data: creatorData, error: creatorError } = await supabase
                .from("creators")
                .select("*")
                .eq("id", id)
                .single();

            if (creatorError) throw creatorError;
            setCreator(creatorData);

            // Fetch Creator Events
            const { data: eventsData, error: eventsError } = await supabase
                .from("events")
                .select(`*`)
                .eq("creator_id", id)
                .neq("status", "archived")
                .order('created_at', { ascending: false });

            if (eventsError) throw eventsError;

            const formattedEvents = (eventsData || []).map(ev => ({
                id: ev.id,
                title: ev.title,
                description: ev.description,
                image: ev.poster_url,
            }));

            setEvents(formattedEvents);
        } catch (error) {
            console.error("Error fetching creator data:", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white uppercase font-bold tracking-widest text-slate-300 text-xs">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                Memuat Profil...
            </div>
        );
    }

    if (!creator) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Kreator tidak ditemukan</h2>
            <Link to="/" className="text-blue-600 font-bold hover:underline text-sm">Kembali ke Beranda</Link>
        </div>
    );

    const socials = [
        {
            id: 'instagram',
            label: 'Instagram',
            icon: <Instagram size={14} />,
            url: creator.instagram_url,
            color: 'text-[#E4405F]',
            bg: 'bg-[#E4405F]/5',
            border: 'border-[#E4405F]/10',
            hover: 'hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F]'
        },
        {
            id: 'x',
            label: 'X',
            icon: <XIcon size={14} />,
            url: creator.x_url,
            color: 'text-slate-900',
            bg: 'bg-slate-900/5',
            border: 'border-slate-900/10',
            hover: 'hover:bg-slate-900 hover:text-white hover:border-slate-900'
        },
        {
            id: 'tiktok',
            label: 'TikTok',
            icon: <TikTokIcon size={14} />,
            url: creator.tiktok_url,
            color: 'text-black',
            bg: 'bg-black/5',
            border: 'border-black/10',
            hover: 'hover:bg-black hover:text-white hover:border-black'
        },
        {
            id: 'facebook',
            label: 'FB',
            icon: <Facebook size={14} />,
            url: creator.facebook_url,
            color: 'text-[#1877F2]',
            bg: 'bg-[#1877F2]/5',
            border: 'border-[#1877F2]/10',
            hover: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]'
        }
    ].filter(s => s.url);

    return (
        <div className="bg-slate-50/30 min-h-screen font-sans text-slate-900 pb-10">
            <Navbar alwaysScrolled={true} />

            <main className="pt-28 pb-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* CREATOR PROFILE CARD */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-12 overflow-hidden">
                        <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                            {/* Avatar */}
                            <div className="shrink-0">
                                {creator.image_url ? (
                                    <div className="w-32 h-32 rounded-2xl border-2 border-white shadow-xl overflow-hidden">
                                        <img
                                            src={creator.image_url}
                                            alt={creator.brand_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border-2 border-white shadow-xl">
                                        <Building2 size={40} />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                            {creator.brand_name || "Official Organizer"}
                                        </h1>
                                        {creator.verified && (
                                            <div className="bg-blue-600 p-0.5 rounded-full text-white">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {creator.address && (
                                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-slate-400 font-medium">
                                            <MapPin size={12} className="text-blue-500" />
                                            <span className="text-[11px] italic">{creator.address}</span>
                                        </div>
                                    )}
                                </div>

                                {creator.description && (
                                    <p className="text-slate-500 leading-relaxed max-w-xl text-sm font-medium">
                                        {creator.description}
                                    </p>
                                )}

                                {/* Socials */}
                                {socials.length > 0 && (
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                                        {socials.map(social => (
                                            <a
                                                key={social.id}
                                                href={social.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`
                                                    flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border
                                                    ${social.bg} ${social.color} ${social.border} ${social.hover}
                                                    active:scale-95 shadow-sm
                                                `}
                                            >
                                                {social.icon}
                                                <span>{social.label}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="shrink-0 hidden md:block border-l border-slate-100 pl-8 self-center">
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4 min-w-[120px] text-center shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Total Event</p>
                                    <p className="text-3xl font-black text-slate-900 leading-none relative z-10">{events.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EVENTS GRID */}
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row items-baseline gap-2">

                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Event Yang Diselenggarakan</p>
                        </div>

                        {events.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {events.map((ev) => (
                                    <SimpleEventCard key={ev.id} {...ev} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-50">
                                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Search size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Belum ada event</h3>
                                <p className="text-slate-500 mt-1 text-sm font-medium">Kreator ini belum menerbitkan event apapun.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <BottomBar />
        </div>
    );
}
