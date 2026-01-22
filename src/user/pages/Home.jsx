import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../../components/Layout/Navbar";
import Card from "../../components/home/EventSection";
import HeroSection from "../../components/home/HeroSection";
import FAQSection from "../../components/home/FAQSection";
import FeaturesSection from "../../components/home/FeaturesSection";
import BottomBar from "../../components/Layout/Footer";

import { FiSearch } from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEvents();

        // ⚡️ REAL-TIME SYNC
        const channel = supabase
            .channel('home_events_sync')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'events'
            }, () => {
                fetchEvents();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from("events")
                .select("*, ticket_types(price)")
                .eq("status", "active");


            if (error) throw error;

            // Map the data for the Card component
            const formatted = data.map(ev => {
                const prices = ev.ticket_types?.map(tt => tt.price) || [];
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                return {
                    id: ev.id,
                    title: ev.title,
                    location: ev.location,
                    date: ev.event_date,
                    image: ev.poster_url,
                    price: minPrice
                };
            });

            setEvents(formatted);
        } catch (error) {
            console.error("Error fetching events:", error.message);
            setError(error.message || "Gagal memuat event. Silakan periksa koneksi internet Anda.");
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            return event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location?.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [events, searchTerm]);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* HERO SECTION */}
            <HeroSection />

            {/* MARQUEE SECTION - Seamless Divider */}
            <section className="relative z-30 overflow-hidden -mt-10">
                <div className="w-full bg-[#b1451a] py-6 shadow-[0_15px_30px_rgba(0,0,0,0.1)] skew-y-[-1deg] border-y-4 border-orange-300/30">
                    <div className="flex whitespace-nowrap animate-marquee">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className="text-3xl md:text-5xl font-black text-white px-8 uppercase tracking-tighter italic">
                                LETS COLLABORATE WITH US •
                            </span>
                        ))}
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        display: flex;
                        width: max-content;
                        animation: marquee 20s linear infinite;
                    }
                    @keyframes marquee-reverse {
                        0% { transform: translateX(-50%); }
                        100% { transform: translateX(0); }
                    }
                    .animate-marquee-reverse {
                        display: flex;
                        width: max-content;
                        animation: marquee-reverse 20s linear infinite;
                    }
                `}} />
            </section>

            <main className="w-full bg-[#5d3a24] relative z-20 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-16">
                    {/* EVENTS GRID */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                                UPCOMING <span className="text-[#b1451a]">EVENTS</span>
                            </h2>
                            <p className="text-orange-200/60 font-medium">Temukan event seru yang akan datang</p>
                        </div>
                        <div className="hidden md:flex gap-2">
                            <span className="text-sm font-bold text-white py-2.5 px-6 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">Explore Semuanya</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white/5 rounded-xl aspect-[4/5] animate-pulse border border-white/10" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-24 bg-white/5 rounded-xl border-2 border-dashed border-red-500/20 backdrop-blur-sm">
                            <div className="bg-red-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/10">
                                <FiSearch size={40} className="text-red-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Oops! Terjadi Kesalahan</h3>
                            <p className="text-red-200/60 mt-2 font-medium">{error}</p>
                            <button
                                onClick={fetchEvents}
                                className="mt-8 px-8 py-3 bg-[#b1451a] hover:bg-[#8e3715] text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-900/40"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredEvents.map((ev) => (
                                <Card key={ev.id} {...ev} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white/5 rounded-xl border-2 border-dashed border-white/10 backdrop-blur-sm">
                            <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                                <FiSearch size={40} className="text-orange-200" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Event tidak ditemukan</h3>
                            <p className="text-orange-200/60 mt-2 font-medium">Coba gunakan kata kunci atau filter lain</p>
                        </div>
                    )}
                </div>

                {/* BOTTOM REVERSE MARQUEE */}
                <div className="mt-20 overflow-hidden">
                    <div className="w-full bg-[#b1451a] py-6 shadow-[0_-15px_30px_rgba(0,0,0,0.1)] skew-y-[1deg] border-y-4 border-orange-300/30">
                        <div className="flex whitespace-nowrap animate-marquee-reverse">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <span key={i} className="text-3xl md:text-5xl font-black text-white px-8 uppercase tracking-tighter italic">
                                    HEROESTIX BY PERISTIWA •
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* FEATURES SECTION */}
            <FeaturesSection />

            {/* FAQ SECTION */}
            <FAQSection />

            {/* FOOTER */}
            <BottomBar />
        </div>
    );
}
