import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Calendar,
    Search,
    MapPin,
    Clock,
    Building2,
    ArrowRight,
    Filter,
    MoreHorizontal,
    ExternalLink,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch everything separately to bypass relationship/join issues
            const [eventsRes, creatorsRes, profilesRes] = await Promise.all([
                supabase.from('events').select('*').order('created_at', { ascending: false }),
                supabase.from('creators').select('*'),
                supabase.from('profiles').select('id, full_name')
            ]);

            if (eventsRes.error) throw eventsRes.error;

            const eventsData = eventsRes.data || [];
            const creatorsData = creatorsRes.data || [];
            const profilesData = profilesRes.data || [];

            console.log('Diagnostic: Events count:', eventsData.length);
            console.log('Diagnostic: Creators count:', creatorsData.length);
            console.log('Diagnostic: Profiles count:', profilesData.length);

            // Create maps for quick lookup
            const profileMap = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            const creatorMap = creatorsData.reduce((acc, c) => {
                return {
                    ...acc,
                    [c.id]: {
                        ...c,
                        profiles: profileMap[c.id] || null // Assuming creator.id maps to profile.id
                    }
                };
            }, {});

            const combined = eventsData.map(ev => ({
                ...ev,
                creators: creatorMap[ev.creator_id] || null
            }));

            setEvents(combined);
        } catch (err) {
            console.error('CRITICAL: Error merging event data:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    const filteredEvents = events.filter(event => {
        const matchesStatus = statusFilter === 'all' ? true : event.status === statusFilter;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.creators?.brand_name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'draft':
                return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'archived':
                return 'bg-red-50 text-red-600 border-red-100';
            default:
                return 'bg-blue-50 text-blue-600 border-blue-100';
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Synchronizing Event Catalog...</span>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <img src="/Logo/Logo.png" alt="Heroestix" className="h-8 w-auto" />
                            <div className="w-1 h-6 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Global Catalog</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-medium tracking-tight text-slate-900 italic">Event <span className="text-blue-600 not-italic">Manager</span></h1>
                        <p className="text-slate-500 font-medium text-sm mt-2">Oversee all platform listings and creator assignments.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchEvents} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm">
                            Refresh Sync
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Search & Filters */}
                <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm">
                            {['all', 'active', 'draft', 'archived'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === f
                                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:border-blue-400 focus-within:text-blue-500 transition-all w-full lg:w-96 shadow-sm">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search events or creators..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-slate-400 text-slate-800"
                        />
                    </div>
                </div>

                {/* Error Display */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-8 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-600 text-xs font-bold"
                        >
                            <AlertCircle size={16} />
                            <span>System Error: {error}. This might be due to an unrecognized relationship name.</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table View */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Identification</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creator Entity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Venue & Schedule</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredEvents.map((event, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    key={event.id}
                                    className="group hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-12 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex-shrink-0 shadow-sm group-hover:border-blue-200 transition-all">
                                                <img
                                                    src={event.poster_url || 'https://via.placeholder.com/150'}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight group-hover:text-blue-600 transition-colors">{event.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5 font-mono">ID: {event.id.substring(0, 12)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shadow-sm">
                                                {event.creators?.brand_name?.charAt(0) || 'C'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-[11px] truncate uppercase tracking-tight">{event.creators?.brand_name || 'System Merchant'}</p>
                                                <div className="flex flex-col mt-0.5">
                                                    <p className="text-[10px] font-bold text-slate-500 italic truncate leading-none mb-0.5">
                                                        Owner: {event.creators?.profiles?.full_name || 'Anonymous Creator'}
                                                    </p>
                                                    <p className="text-[9px] font-medium text-slate-400 truncate tracking-tight">{event.creators?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <MapPin size={12} className="text-blue-500" />
                                                <span className="text-[11px] font-bold truncate max-w-[150px] uppercase tracking-tight">{event.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-bold italic">
                                                    {new Date(event.event_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${getStatusStyles(event.status)}`}>
                                                {event.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 shadow-sm hover:shadow-blue-100/20">
                                                <ExternalLink size={16} />
                                            </button>
                                            <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}

                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-24">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <Layout size={48} className="text-slate-300 mb-4" />
                                            <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] italic">No event records found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total Catalog Volume: <span className="text-slate-900">{filteredEvents.length} Units</span>
                    </p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all shadow-sm">Previous</button>
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all shadow-sm">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Events;
