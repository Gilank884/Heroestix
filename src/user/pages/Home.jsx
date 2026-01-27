import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../../components/Layout/Navbar";
import Card from "../../components/home/EventSection";
import HeroSection from "../../components/home/HeroSection";
import FAQSection from "../../components/home/FAQSection";
import FeaturesSection from "../../components/home/FeaturesSection";
import BottomBar from "../../components/Layout/Footer";

import { FiSearch } from "react-icons/fi";
import { Search } from "lucide-react";
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

            <main className="w-full bg-slate-50 relative z-20 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-24">

                    {/* SECTION HEADER - Professional Style */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                Top Pick Events
                            </div>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                                Recommended <span className="text-blue-600">Experiences</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg max-w-xl">Curated collection of the best events happening right now near you.</p>
                        </div>

                        {/* Search Bar - Professional Integration */}
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search by event or venue..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all shadow-sm group-hover:border-slate-300"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-slate-200 rounded-xl aspect-[16/20] animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
                            <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                                <FiSearch size={40} className="text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Oops! Something went wrong</h3>
                            <p className="text-slate-500 mt-2 font-medium">{error}</p>
                            <button
                                onClick={fetchEvents}
                                className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/10"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredEvents.map((ev) => (
                                <Card key={ev.id} {...ev} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
                            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                <FiSearch size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No events found</h3>
                            <p className="text-slate-500 mt-2 font-medium">Try using different keywords or filters</p>
                        </div>
                    )}
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

