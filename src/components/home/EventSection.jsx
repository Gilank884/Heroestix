import React, { useState, useEffect, useMemo } from "react";
import { Search, Ticket } from "lucide-react";
import { FiSearch } from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";
import EventCard from "./EventCard.jsx";
import useAuthStore from "../../auth/useAuthStore";

export default function EventSection({ searchTerm = "" }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isChecking, isAuthenticated } = useAuthStore();

    useEffect(() => {
        // Wait for auth check to finish before fetching
        if (isChecking) return;

        fetchEvents(true);

        // REAL-TIME SYNC
        const channel = supabase
            .channel('event_section_sync')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'events'
            }, () => {
                fetchEvents(false);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isChecking, isAuthenticated]);

    const fetchEvents = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        setError(null);
        console.log("EventSection: Starting fetchEvents...");
        try {
            // Simplified query to ensure maximum compatibility and speed
            const { data, error, status, statusText } = await supabase
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

            console.log(`EventSection: Supabase response status: ${status} ${statusText}`);

            if (error) throw error;

            console.log("EventSection: Fetched events count:", data?.length || 0);
            if (data) {
                console.log("EventSection: First event title (if any):", data[0]?.title);
            }

            // Map the data for the EventCard component
            const formatted = (data || []).map(ev => {
                const tt_data = ev.ticket_types || [];
                // If ticket_types is not an array (due to some Supabase join edge case), handle it
                const tt_array = Array.isArray(tt_data) ? tt_data : [tt_data];
                const prices = tt_array.map(tt => tt.price).filter(p => p !== undefined && p !== null) || [];
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                // Determine if event has ended
                let isEnded = false;
                if (ev.event_date) {
                    const eventDate = new Date(ev.event_date);
                    if (ev.event_time) {
                        const [hours, minutes] = ev.event_time.split(':');
                        eventDate.setHours(parseInt(hours), parseInt(minutes), 0);
                    } else {
                        eventDate.setHours(23, 59, 59);
                    }
                    isEnded = new Date() > eventDate;
                }

                return {
                    id: ev.id,
                    title: ev.title,
                    location: ev.location,
                    date: ev.event_date,
                    image: ev.poster_url,
                    price: minPrice,
                    status: ev.status,
                    category: ev.category,
                    isEnded: isEnded
                };
            });

            setEvents(formatted);

            // ⚡️ RETRY LOGIC: If no events found, maybe it's a cold start or session race
            if (formatted.length === 0 && showLoading) {
                console.warn("EventSection: No events found on initial load. Retrying in 2 seconds...");
                setTimeout(() => fetchEvents(false), 2000);
            }
        } catch (error) {
            console.error("EventSection: Error fetching events:", error.message);
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

    if (loading) {
        return (
            <div className="flex flex-wrap justify-center gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-200 dark:bg-slate-800 rounded-xl aspect-[16/20] w-[280px] animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="bg-red-50 dark:bg-red-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-800">
                    <FiSearch size={40} className="text-red-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100">Oops! Something went wrong</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{error}</p>
                <button
                    onClick={() => fetchEvents(true)}
                    className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/10"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (filteredEvents.length === 0) {
        return (
            <div className="w-full flex justify-center py-12">
                <div className="relative overflow-hidden w-full max-w-lg rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100/50 dark:border-blue-900/50 shadow-sm p-10 text-center">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-100/50 dark:bg-blue-900/50 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-indigo-100/50 dark:bg-indigo-900/50 rounded-full blur-2xl"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 transform rotate-[-5deg] transition-transform hover:rotate-0 duration-300">
                            <FiSearch className="text-blue-500 dark:text-blue-400 w-8 h-8" />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
                            Wah Sepertinya Event Kamu Belum Ada Deh
                        </h3>

                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-[280px]">
                            Coba cari dengan kata kunci lain atau lihat event menarik lainnya di bawah ini.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 dark:hover:bg-slate-100 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                        >
                            Jelajahi Semua Event
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap justify-center gap-6">
            {filteredEvents.map((ev) => (
                <div key={ev.id} className="w-full max-w-[240px]">
                    <EventCard {...ev} />
                </div>
            ))}
        </div>
    );
}
