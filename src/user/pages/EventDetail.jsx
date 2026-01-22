import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import EventNavbar from "../../components/Layout/EventNavbar";
import BottomBar from "../../components/Layout/Footer";
import { HiLocationMarker, HiCalendar, HiTicket, HiClock } from "react-icons/hi";
import { FiChevronLeft } from "react-icons/fi";
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-bold tracking-widest text-gray-400">
                Memuat Event...
            </div>
        );
    }

    return (
        <div className="bg-[#fdf5f2] min-h-screen font-sans text-slate-900">
            <EventNavbar />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* LEFT COLUMN: IMAGE & DESCRIPTION */}
                        <div className="lg:col-span-8">
                            <div className="rounded-2xl overflow-hidden shadow-sm mb-10">
                                <img
                                    src={event.image || "https://images.unsplash.com/photo-1540575861501-7ad05823c93f?q=80&w=2070&auto=format&fit=crop"}
                                    alt={event.title}
                                    className="w-full h-auto object-cover aspect-[16/9]"
                                />
                            </div>

                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold">Deskripsi</h2>
                                <div className={`text-slate-600 leading-relaxed space-y-4 ${!showFullDesc && "line-clamp-4 relative"}`}>
                                    <p>
                                        {event.description || "Tidak ada deskripsi untuk event ini."}
                                    </p>
                                    {!showFullDesc && (
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#fdf5f2] to-transparent" />
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowFullDesc(!showFullDesc)}
                                    className="text-[#b1451a] font-bold hover:underline py-2"
                                >
                                    {showFullDesc ? "Tampilkan Lebih Sedikit" : "Tampilkan Lebih Banyak"}
                                </button>
                            </section>

                            <hr className="my-12 border-slate-100" />
                        </div>

                        {/* RIGHT COLUMN: EVENT INFO, PRICE, SOCIAL MEDIA */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* EVENT INFO CARD */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                                <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
                                    {event.title}
                                </h1>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <HiCalendar className="text-xl shrink-0" />
                                        <span className="text-[15px] font-medium">{event.date}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <HiClock className="text-xl shrink-0" />
                                        <span className="text-[15px] font-medium">{event.event_time?.substring(0, 5)} WIB</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-slate-600">
                                        <HiLocationMarker className="text-xl shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-[14px] leading-tight font-medium">{event.location}</p>
                                            <a href="#" className="text-[#b1451a] font-bold text-xs hover:underline block">Petunjuk Arah</a>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="space-y-1">
                                    <p className="text-slate-400 text-[13px]">Dibuat Oleh</p>
                                    <p className="font-bold text-[15px] text-slate-800">{event.creators?.brand_name || "Creator"}</p>
                                </div>
                            </div>

                            {/* PRICE & ACTION CARD */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                                {hasInactiveTickets && (
                                    <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 p-3.5 rounded-xl animate-in fade-in slide-in-from-top-2 duration-700">
                                        <div className="w-8 h-8 rounded-full bg-[#b1451a]/10 flex items-center justify-center text-[#b1451a]">
                                            <HiTicket size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-[#b1451a] uppercase tracking-widest leading-none mb-1">Coming Soon</p>
                                            <p className="text-[13px] font-bold text-slate-900 leading-tight">Tiket Segera Tersedia</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-[15px] font-medium text-slate-700">Mulai Dari</span>
                                    <span className="text-xl font-black text-slate-900">{rupiah(event.price)}</span>
                                </div>
                                <button
                                    onClick={() => navigate(`/select-ticket/${event.id}`)}
                                    className="w-full bg-[#b1451a] hover:bg-[#8e3715] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-orange-900/10 active:scale-[0.98]"
                                >
                                    Beli Sekarang
                                </button>
                            </div>

                            {/* SOCIAL MEDIA SECTION */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold">Media Sosial</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 transition-all">
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white">
                                            <FaInstagram className="text-sm" />
                                        </div>
                                        <span className="font-bold text-sm">Instagram</span>
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 transition-all">
                                        <FaTiktok className="text-xl" />
                                        <span className="font-bold text-sm">Tiktok</span>
                                    </button>
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
