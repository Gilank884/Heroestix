import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import {
    Plus,
    Search,
    Calendar,
    MapPin,
    Clock,
    ChevronRight,
    Filter,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import CreateEventModal from '../components/CreateEventModal';

const Events = () => {
    const { user } = useAuthStore();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, archived
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.id) {
            fetchEvents();
        }
    }, [user?.id]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    ticket_types (
                        price,
                        quota,
                        sold
                    )
                `)
                .eq('creator_id', user.id)
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = useMemo(() => {
        const now = new Date();
        return events.filter(ev => {
            const eventDate = new Date(ev.event_date);

            // Tab Filtering
            let matchesTab = false;
            if (activeTab === 'upcoming') {
                matchesTab = eventDate >= now && ev.status !== 'archived';
            } else if (activeTab === 'past') {
                matchesTab = eventDate < now && ev.status !== 'archived';
            } else if (activeTab === 'archived') {
                matchesTab = ev.status === 'archived';
            }

            // Search Filtering
            const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ev.location.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesTab && matchesSearch;
        });
    }, [events, activeTab, searchTerm]);

    const tabs = [
        { id: 'upcoming', label: 'Akan Datang' },
        { id: 'past', label: 'Berakhir' },
        { id: 'archived', label: 'Arsip' }
    ];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#1a36c7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#1a202c]">Daftar Event</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#1a36c7] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-[#152ba3] transition-all shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    Buat Event
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 text-sm font-bold transition-all relative
                            ${activeTab === tab.id ? 'text-[#1a36c7]' : 'text-gray-400 hover:text-gray-600'}
                        `}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1a36c7]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a36c7] transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Cari event..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm shadow-sm"
                />
            </div>

            {/* Events List */}
            <div className="space-y-4">
                {filteredEvents.length > 0 ? filteredEvents.map((ev) => (
                    <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
                        {/* Thumbnail */}
                        <div className="w-full md:w-56 h-32 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <img
                                src={ev.poster_url || '/assets/placeholder.png'}
                                alt={ev.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm bg-white text-gray-700`}>
                                    {ev.status === 'active' ? 'Publish' : ev.status}
                                </span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-3">
                            <h3 className="text-lg font-bold text-[#1a202c] truncate group-hover:text-[#1a36c7] transition-colors">
                                {ev.title}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <MapPin size={16} className="text-gray-400" />
                                    <span className="truncate">{ev.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span>{new Date(ev.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Clock size={16} className="text-gray-400" />
                                    <span>{ev.event_time || '00:00'} WIB</span>
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="w-full md:w-auto flex-shrink-0">
                            <Link
                                to={`/manage/event/${ev.id}`}
                                className="w-full md:w-auto px-6 py-2.5 bg-[#f0f4ff] text-[#1a36c7] rounded-lg text-sm font-bold hover:bg-[#1a36c7] hover:text-white transition-all text-center inline-block"
                            >
                                Kelola Event
                            </Link>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center bg-white rounded-3xl border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Belum ada event</h3>
                        <p className="text-gray-400 text-sm mt-1">Coba sesuaikan filter atau cari event lain.</p>
                    </div>
                )}
            </div>

            <CreateEventModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                creatorId={user?.id}
                onRefresh={fetchEvents}
            />
        </div>
    );
};

export default Events;
