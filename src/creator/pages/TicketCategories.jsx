import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Search,
    Plus,
    MoreVertical,
    Edit2,
    Trash2,
    Ticket,
    Activity,
    Calendar,
    ChevronRight,
    Filter,
    Info,
    Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const TicketCategories = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTickets = async () => {
        try {
            const { data, error } = await supabase
                .from('ticket_types')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setTickets(data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [eventId]);



    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const filteredTickets = tickets.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        {
            label: 'Total Kategori',
            value: tickets.length,
            icon: Tag,
            color: 'bg-blue-50 text-blue-600'
        },
        {
            label: 'Total Kuota',
            value: tickets.reduce((acc, t) => acc + (t.quota || 0), 0),
            icon: Ticket,
            color: 'bg-purple-50 text-purple-600'
        },
        {
            label: 'Tiket Terjual',
            value: tickets.reduce((acc, t) => acc + (t.sold || 0), 0),
            icon: Activity,
            color: 'bg-emerald-50 text-emerald-600'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    if (loading && tickets.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Ticket size={20} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] block underline decoration-blue-500/30 underline-offset-8">INVENTORY</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Memuat kategori tiket...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-20">

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative z-10 space-y-10 max-w-6xl mx-auto px-4 md:px-0"
            >
                {/* Unified Header & Stats Card */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 space-y-10"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-left">
                                <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                    Ticket Inventory
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen Kategori</span>
                            </div>
                            <div className="text-left">
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 leading-none">
                                    Kategori Tiket <Ticket className="text-blue-600" size={32} />
                                </h1>
                                <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                                    Kelola berbagai jenis tiket, harga, dan kuota tersedia untuk event Anda dalam satu platform terintegrasi.
                                </p>
                            </div>
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('create')}
                            className="flex items-center gap-3 px-8 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all shrink-0 active:scale-95 overflow-hidden"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Tambah Tiket
                        </motion.button>
                    </div>

                    {/* Integrated Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="flex items-center gap-5">
                                <div className={`w-12 h-12 ${stat.color.split(' ')[0]} ${stat.color.split(' ')[1]} rounded-2xl flex items-center justify-center shadow-inner`}>
                                    <stat.icon size={22} />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{loading ? '...' : stat.value.toLocaleString()}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Search & Action Header (Glass Card) */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-4 rounded-[1.75rem] border border-white shadow-xl shadow-slate-200/30 flex flex-col md:flex-row gap-4"
                >
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Cari kategori tiket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 h-16 bg-slate-50/50 border border-slate-100 rounded-3xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/30 transition-all placeholder:text-slate-300 text-[13px]"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button className="h-16 px-8 rounded-3xl bg-white/40 border border-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:border-slate-300 hover:shadow-lg transition-all flex items-center gap-3">
                            <Filter size={18} className="text-slate-400" />
                            Filters
                        </button>
                    </div>
                </motion.div>

                {/* Table View Section */}
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 overflow-hidden text-left min-h-[500px] flex flex-col relative z-10">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategori Tiket</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Harga</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        [...Array(3)].map((_, i) => (
                                            <tr key={`skeleton-${i}`} className="animate-pulse">
                                                <td colSpan={4} className="px-8 py-10 bg-slate-50/10">
                                                    <div className="h-4 bg-slate-100 rounded-full w-3/4 mx-auto" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredTickets.length === 0 ? (
                                        <motion.tr 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <td colSpan={4} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6 max-w-sm mx-auto group">
                                                    <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center shadow-inner relative overflow-hidden transition-transform group-hover:scale-105">
                                                        <Ticket size={40} strokeWidth={1.5} />
                                                        <div className="absolute inset-0 bg-blue-600/5 rotate-45 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                                    </div>
                                                    <div className="space-y-2 text-center">
                                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Belum Ada Tiket</h4>
                                                        <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest max-w-[280px] mx-auto">Mulai buat kategori tiket pertama Anda untuk event ini!</p>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate('create')}
                                                        className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-slate-900/20 transition-all hover:-translate-y-1"
                                                    >
                                                        Buat Kategori
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ) : filteredTickets.map((ticket, index) => (
                                        <motion.tr
                                            key={ticket.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => navigate(`/manage/event/${eventId}/ticket-categories/${ticket.id}/edit`)}
                                            className="group hover:bg-slate-50/50 transition-all cursor-pointer relative"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-start gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:shadow-md transition-all shrink-0 font-black text-[10px] text-slate-300">
                                                        {index + 1}
                                                    </div>
                                                    <div className="space-y-2 min-w-0 text-left">
                                                        <p className="font-black text-slate-900 text-base tracking-tighter group-hover:text-blue-600 transition-colors leading-none">{ticket.name}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5 bg-slate-100/50 px-2 py-0.5 rounded-md border border-slate-100/50">
                                                                <Activity size={10} className="text-blue-600" />
                                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest tabular-nums">{ticket.sold} / {ticket.quota} Sold</span>
                                                            </div>
                                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner p-[1px]">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.min((ticket.sold / (ticket.quota || 1)) * 100, 100)}%` }}
                                                                    className={`h-full rounded-full transition-all duration-500 ${ (ticket.sold / (ticket.quota || 1)) > 0.8 ? 'bg-amber-500' : 'bg-blue-600' }`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center justify-center">
                                                    <span className="text-[13px] font-black text-blue-600 bg-blue-50/50 px-4 py-2.5 rounded-xl border border-blue-100/50 tabular-nums">
                                                        {formatPrice(ticket.price)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest shadow-sm border ${
                                                    ticket.status === 'active' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' 
                                                    : 'bg-slate-100 text-slate-400 border-slate-200/50'
                                                }`}>
                                                    {ticket.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm bg-white/50 border border-slate-100/50">
                                                        <Edit2 size={16} />
                                                    </div>
                                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                                                        <ChevronRight size={20} />
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Info */}
                    <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse active-glow shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">INVENTORY SYSTEM • LIVE UPDATE</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TicketCategories;
