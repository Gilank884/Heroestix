import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../../components/Layout/Navbar";
import Card from "../../components/home/EventSection";
import HeroSection from "../../components/home/HeroSection";
import FAQSection from "../../components/home/FAQSection";
import FeaturesSection from "../../components/home/FeaturesSection";
import BottomBar from "../../components/Layout/Footer";

import { FiSearch } from "react-icons/fi";
import { Search, Ticket } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("Home component mounted");
        fetchEvents(true);

        // ⚡️ REAL-TIME SYNC
        const channel = supabase
            .channel('home_events_sync')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'events'
            }, () => {
                console.log("Real-time update triggered on Home");
                fetchEvents(false); // Silent refresh for real-time updates
            })
            .subscribe();

        return () => {
            console.log("Home component unmounted");
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchEvents = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            // Simplified query to ensure maximum compatibility and speed
            const { data, error } = await supabase
                .from("events")
                .select(`
                    *,
                    ticket_types (
                        price,
                        quota,
                        sold
                    )
                `)
                .neq("status", "archived")
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log("Fetched events count:", data?.length || 0);

            // Map the data for the Card component
            const formatted = (data || []).map(ev => {
                const prices = ev.ticket_types?.map(tt => tt.price) || [];
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                return {
                    id: ev.id,
                    title: ev.title,
                    location: ev.location,
                    date: ev.event_date,
                    image: ev.poster_url,
                    price: minPrice,
                    status: ev.status
                };
            });

            setEvents(formatted);
        } catch (error) {
            console.error("Error fetching events:", error.message);
            setError("Gagal memuat event. Silakan periksa koneksi internet Anda.");
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-16">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                            <Ticket size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Ticket Yang Tersedia
                        </h2>
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
                                <Search size={40} className="text-slate-300" />
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
