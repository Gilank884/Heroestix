import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    List as ListIcon,
    Wallet,
    Ticket,
    Activity,
    RefreshCw,
    Users
} from 'lucide-react';
import VerificationPending from '../components/VerificationPending';
import { motion } from 'framer-motion';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

const Events = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [ticketsData, setTicketsData] = useState([]);
    const [taxMap, setTaxMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(true);
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
            // Check Verification
            const { data: creatorData } = await supabase
                .from('creators')
                .select('verified')
                .eq('id', user.id)
                .single();

            const isVerifiedCreator = creatorData?.verified ?? false;

            // Determine if we should show the "Verification Pending" screen.
            // If they are a creator, they must be verified to use the portal normally.
            // However, we'll fetch events first to see if they are a staff member.

            // 1. Fetch created events
            const { data: createdEvents, error: createdError } = await supabase
                .from('events')
                .select(`
                    *,
                    ticket_types (
                        id,
                        price,
                        quota,
                        sold
                    )
                `)
                .eq('creator_id', user.id)
                .order('event_date', { ascending: true });

            if (createdError) throw createdError;

            // 2. Fetch staff events
            const { data: staffData, error: staffError } = await supabase
                .from('event_staffs')
                .select(`
                    events (
                        *,
                        ticket_types (
                            id,
                            price,
                            quota,
                            sold
                        )
                    )
                `)
                .eq('staff_id', user.id);

            if (staffError) throw staffError;

            const staffEvents = staffData?.map(item => item.events).filter(Boolean) || [];

            // Combine and Dedup
            const allEventsRaw = [...(createdEvents || []), ...staffEvents];
            const uniqueEvents = Array.from(new Map(allEventsRaw.map(item => [item.id, item])).values())
                .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

            // LOGIC: If they have a creator record but it's not verified, 
            // AND they are NOT staff for any events, show the pending screen.
            // If they are staff, we let them through to manage those specific events.
            if (creatorData && !isVerifiedCreator && staffEvents.length === 0) {
                setIsVerified(false);
                setLoading(false);
                return;
            }
            setIsVerified(true);

            const eventIds = uniqueEvents.map(e => e.id);

            if (eventIds.length > 0) {
                // Fetch Taxes and Paid Tickets for accurate Revenue
                const [taxRes, ticketRes] = await Promise.all([
                    supabase.from('event_taxes').select('*').in('event_id', eventIds),
                    supabase
                        .from('tickets')
                        .select(`
                            id,
                            order_id,
                            ticket_types!inner (id, price, event_id),
                            orders!inner (id, status, discount_amount)
                        `)
                        .in('ticket_types.event_id', eventIds)
                        .eq('orders.status', 'paid')
                ]);

                const newTaxMap = {};
                taxRes.data?.forEach(t => {
                    newTaxMap[t.event_id] = t;
                });
                setTaxMap(newTaxMap);

                if (ticketRes.data && ticketRes.data.length > 0) {
                    const orderIds = [...new Set(ticketRes.data.map(t => t.order_id))];
                    const { data: allTicketsInOrders } = await supabase
                        .from('tickets')
                        .select('order_id')
                        .in('order_id', orderIds);

                    const orderCounts = {};
                    allTicketsInOrders?.forEach(t => {
                        orderCounts[t.order_id] = (orderCounts[t.order_id] || 0) + 1;
                    });

                    // Add order count to ticket data for revenue split
                    const ticketsWithSplitData = ticketRes.data.map(t => ({
                        ...t,
                        totalTicketsInOrder: orderCounts[t.order_id] || 1
                    }));
                    setTicketsData(ticketsWithSplitData);
                } else {
                    setTicketsData([]);
                }
            }

            setEvents(uniqueEvents);
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

    const globalStats = useMemo(() => {
        let totalSold = 0;
        let totalRevenue = 0;
        let totalQuota = 0;

        // Accurate Revenue Calculation using Fair-Share Logic
        const eventRevenueMap = {};

        ticketsData.forEach(t => {
            const eventId = t.ticket_types?.event_id;
            const eventTax = taxMap[eventId];
            const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
            const isTaxIncluded = eventTax ? eventTax.is_included : false;
            const basePrice = Number(t.ticket_types?.price || 0);

            let ticketIncome = basePrice;
            if (!isTaxIncluded && taxRate > 0) {
                ticketIncome += (basePrice * taxRate / 100);
            }

            const discountShare = Number(t.orders?.discount_amount || 0) / (t.totalTicketsInOrder || 1);
            ticketIncome -= discountShare;

            totalRevenue += ticketIncome;
            eventRevenueMap[eventId] = (eventRevenueMap[eventId] || 0) + ticketIncome;
        });

        events.forEach(ev => {
            (ev.ticket_types || []).forEach(tt => {
                totalSold += (tt.sold || 0);
                totalQuota += (tt.quota || 0);
            });
            // We can add the calculated revenue to each event object here if needed for per-card display
            ev.calculatedRevenue = eventRevenueMap[ev.id] || 0;
        });

        return {
            totalEvents: events.length,
            totalSold,
            totalRevenue,
            totalQuota,
            scaleRate: totalQuota > 0 ? (totalSold / totalQuota) * 100 : 0
        };
    }, [events, ticketsData, taxMap]);

    const tabs = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'past', label: 'Completed' },
        { id: 'archived', label: 'Archived' }
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Synchronizing Events</span>
                </div>
            </div>
        );
    }

    if (!isVerified) return <VerificationPending />;

    return (
        <div className="relative min-h-screen pb-20">
            <motion.div
                className="relative z-10 space-y-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Overhaul - Unified Glassmorphism Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-8"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                Global Tracking
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statistics Center</span>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Event Analytics <Activity className="text-blue-600" size={32} />
                            </h1>
                            <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                                Manage your event campaigns with real-time data, monitor revenue distribution, and track ticket sales performance.
                            </p>
                        </div>
                    </div>

                    <motion.button
                        onClick={() => navigate('/events/create')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all group shrink-0"
                    >
                        <Plus size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                        Create New Event
                    </motion.button>
                </motion.div>

                {/* Metrics Overview - Unified Divided Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {[
                            { label: 'Total Campaigns', value: globalStats.totalEvents, icon: LayoutGrid, color: 'blue', suffix: 'Active' },
                            { label: 'Net Revenue', value: rupiah(globalStats.totalRevenue), icon: Wallet, color: 'emerald', suffix: 'Net' },
                            { label: 'Tickets Sold', value: globalStats.totalSold.toLocaleString(), icon: Ticket, color: 'purple', suffix: `${globalStats.scaleRate.toFixed(1)}% Rate` }
                        ].map((stat, idx) => (
                            <div key={idx} className={`flex items-start gap-6 ${idx > 0 ? 'md:pl-12' : ''} ${idx < 2 ? 'pb-8 md:pb-0' : 'pt-8 md:pt-0'}`}>
                                <div className={`w-14 h-14 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 shrink-0`}>
                                    <stat.icon size={28} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
                                    <h4 className={`text-2xl md:text-3xl font-black text-slate-900 tabular-nums tracking-tighter`}>
                                        {stat.value}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-1 rounded-full bg-${stat.color}-500`} />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.suffix}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Tidy Row - Search & Tabs */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center gap-4">
                    <div className="bg-white/60 backdrop-blur-xl p-2 rounded-[1.5rem] border border-white shadow-xl shadow-slate-200/40 flex items-center gap-1 w-full md:w-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all
                                    ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 group w-full">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search specific event..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/60 backdrop-blur-xl border border-white focus:border-blue-500 rounded-[1.5rem] py-4 pl-16 pr-6 text-[11px] font-black outline-none text-slate-700 placeholder:text-slate-300 transition-all shadow-xl shadow-slate-200/40"
                        />
                    </div>
                </motion.div>

                {/* Enhanced Event Analytics List */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((ev) => {
                            const eventSold = (ev.ticket_types || []).reduce((acc, tt) => acc + (tt.sold || 0), 0);
                            const eventQuota = (ev.ticket_types || []).reduce((acc, tt) => acc + (tt.quota || 0), 0);
                            const eventRevenue = ev.calculatedRevenue || 0;
                            const soldPercent = eventQuota > 0 ? (eventSold / eventQuota) * 100 : 0;

                            return (
                                <div key={ev.id} className="group bg-white border border-slate-100/60 rounded-2xl p-5 flex flex-col lg:flex-row items-center gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(59,130,246,0.12)] transition-all duration-500 border-l-4 border-l-slate-200 hover:border-l-blue-600">
                                    {/* Thumbnail - Compact */}
                                    <div className="w-full lg:w-48 h-32 rounded-xl overflow-hidden shadow-inner relative shrink-0">
                                        <img
                                            src={ev.poster_url || '/assets/placeholder.png'}
                                            alt={ev.title}
                                            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${new Date(ev.event_date) < new Date() ? 'grayscale opacity-70' : ''}`}
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest shadow-lg ${ev.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                                                {ev.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Main Info & Real-time Stats */}
                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-center w-full">
                                        {/* Event Meta */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-bold text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                                                {ev.title}
                                            </h3>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    <Calendar size={12} className="text-slate-300" />
                                                    <span>{new Date(ev.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} • {ev.event_time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                                                    <MapPin size={12} className="text-slate-300" />
                                                    <span className="truncate">{ev.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sales Analytics Mini */}
                                        <div className="space-y-3">
                                            <div className="flex items-end justify-between">
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sales Performance</p>
                                                    <h4 className="text-sm font-bold text-slate-900 tabular-nums">{eventSold} / {eventQuota} <span className="text-[10px] text-slate-400 font-medium">Sold</span></h4>
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 tabular-nums">{soldPercent.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${soldPercent}%` }}
                                                    className={`h-full bg-blue-600 transition-all duration-1000 ${soldPercent > 90 ? 'bg-emerald-500' : ''}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Financial Mini Stats */}
                                        <div className="flex items-center gap-8 xl:justify-end">
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Net Revenue</p>
                                                <h4 className="text-sm font-black text-slate-900 whitespace-nowrap">{rupiah(eventRevenue)}</h4>
                                            </div>
                                            <Link
                                                to={`/manage/event/${ev.id}`}
                                                className="p-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 hover:bg-blue-600 hover:scale-110 transition-all active:scale-95 group/btn"
                                            >
                                                <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Calendar size={32} strokeWidth={1} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">No Events Tracked</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Adjust filters or create your first campaign.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Events;
