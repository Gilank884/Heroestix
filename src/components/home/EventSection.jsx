import React, { useState, useEffect, useMemo } from "react";
import { Search, Ticket } from "lucide-react";
import { FiSearch } from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";
import EventCard from "./EventCard";

export default function EventSection({ searchTerm = "" }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Always fetch fresh data on mount
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
    }, []);

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
                    <div key={i} className="bg-slate-200 rounded-xl aspect-[16/20] w-[280px] animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
                <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                    <FiSearch size={40} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Oops! Something went wrong</h3>
                <p className="text-slate-500 mt-2 font-medium">{error}</p>
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
            <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                    <Search size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No events found</h3>
                <p className="text-slate-500 mt-2 font-medium">Try using different keywords or filters</p>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap justify-center gap-10">
            {filteredEvents.map((ev) => (
                <div key={ev.id} className="w-full max-w-[320px]">
                    <EventCard {...ev} />
                </div>
            ))}
        </div>
    );
}
