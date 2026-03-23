import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Search,
    User,
    Mail,
    Phone,
    Filter,
    Download,
    CheckCircle2,
    Clock,
    UserCircle,
    Activity,
    Users as UsersIcon,
    ArrowUpDown,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Visitors = () => {
    const { id: eventId } = useParams();
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [customColumns, setCustomColumns] = useState([]);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchVisitors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    ticket_types!inner (
                        name,
                        event_id
                    ),
                    orders (
                        status
                    )
                `)
                .eq('ticket_types.event_id', eventId);

            if (error) throw error;
            setVisitors(data || []);
        } catch (error) {
            console.error('Error fetching visitors:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchEventSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('custom_form')
                    .eq('id', eventId)
                    .single();

                if (error) throw error;

                if (data?.custom_form) {
                    let rawData = data.custom_form;
                    if (typeof rawData === 'string') {
                        try {
                            rawData = JSON.parse(rawData);
                        } catch (e) {
                            rawData = [];
                        }
                    }

                    if (Array.isArray(rawData)) {
                        setCustomColumns(rawData.filter(field => field.active && field.label));
                    } else if (typeof rawData === 'object' && rawData !== null) {
                        const fields = Object.entries(rawData)
                            .filter(([_, val]) => val && (val.active || val.label))
                            .map(([key, val]) => ({
                                id: key,
                                active: !!val.active,
                                label: val.label || ''
                            }))
                            .filter(f => f.active && f.label);
                        setCustomColumns(fields);
                    }
                }
            } catch (err) {
                console.error('Error fetching event settings:', err);
            }
        };

        if (eventId) {
            fetchVisitors();
            fetchEventSettings();
        }
    }, [eventId]);

    const filteredVisitors = visitors.filter(v =>
        v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.qr_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredVisitors.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedVisitors = filteredVisitors.slice(startIndex, startIndex + rowsPerPage);

    // Reset to page 1 when search or rowsPerPage changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, rowsPerPage]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 }
        }
    };

    const stats = [
        { label: 'Total Peserta', value: visitors.length, icon: UsersIcon, color: 'blue' },
        { label: 'Selesai Check-in', value: visitors.filter(v => v.status === 'used').length, icon: CheckCircle2, color: 'emerald' },
        { label: 'Belum Datang', value: visitors.filter(v => v.status !== 'used').length, icon: Clock, color: 'orange' }
    ];

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity size={20} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] block">MEMUAT DAFTAR</span>
                    <span className="text-[10px] text-slate-400 font-bold">Harap tunggu, kami sedang menyiapkan database pengunjung...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-20">

            <motion.div 
                className="relative z-10 space-y-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Unified Header & Stats Card */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 space-y-10"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                    Visitor Database
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Pengunjung</span>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    Database Peserta <UsersIcon className="text-blue-600" size={32} />
                                </h1>
                                <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                                    Kelola seluruh data pengunjung, status pembayaran, dan riwayat kehadiran dalam satu tabel interaktif.
                                </p>
                            </div>
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all group shrink-0"
                        >
                            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                            Export CSV
                        </motion.button>
                    </div>

                    {/* Integrated Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="flex items-center gap-5">
                                <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600`}>
                                    <stat.icon size={22} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{stat.value.toLocaleString()}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Search & Filter Controls (Glassmorphism) */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-4 rounded-[1.75rem] border border-white shadow-xl shadow-slate-200/30 flex flex-col md:flex-row gap-4"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau ID tiket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all placeholder:text-slate-300 text-sm"
                        />
                    </div>
                    
                    {/* Rows Per Page Selector */}
                    <div className="flex items-center gap-3 px-4 border-l border-slate-100/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Show</span>
                        <select 
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="bg-transparent font-black text-slate-900 text-sm outline-none cursor-pointer hover:text-blue-600 transition-colors"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <button className="h-[60px] px-8 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95 group">
                        <Filter size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Advanced Filter</span>
                    </button>
                </motion.div>

                {/* Table Overhaul with Premium Styling */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">Pengunjung <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Tiket</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontak & Data</th>
                                    {customColumns.map(col => (
                                        <th key={col.id || col.label} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Bayar</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Check-in</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {paginatedVisitors.length === 0 ? (
                                        <motion.tr 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <td colSpan="100%" className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 shadow-inner">
                                                        <UserCircle size={40} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-900 uppercase tracking-widest">Tidak Ada Data</p>
                                                        <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">
                                                            Pencarian "{searchTerm}" tidak menemukan hasil apapun dalam database.
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ) : (
                                        paginatedVisitors.map((visitor, idx) => (
                                            <motion.tr 
                                                key={visitor.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50 last:border-none"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform duration-300">
                                                            {visitor.full_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                                {visitor.full_name}
                                                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                                                            </p>
                                                            <p className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-tighter">{visitor.qr_code}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="inline-flex px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                                                        {visitor.ticket_types?.name}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 space-y-2">
                                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold group-hover:text-slate-900 transition-colors">
                                                        <div className="w-5 h-5 rounded-lg bg-slate-50 flex items-center justify-center"><Mail size={12} /></div>
                                                        {visitor.email || '-'}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold group-hover:text-slate-900 transition-colors">
                                                        <div className="w-5 h-5 rounded-lg bg-slate-50 flex items-center justify-center"><Phone size={12} /></div>
                                                        {visitor.phone || '-'}
                                                    </div>
                                                </td>
                                                {customColumns.map(col => (
                                                    <td key={col.id || col.label} className="px-8 py-6">
                                                        <p className="text-xs font-black text-slate-700">
                                                            {visitor.custom_responses?.[col.label] || <span className="text-slate-200">N/A</span>}
                                                        </p>
                                                    </td>
                                                ))}
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`
                                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest
                                                        ${visitor.orders?.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}
                                                    `}>
                                                        {visitor.orders?.status === 'paid' ? 'Paid' : (visitor.orders?.status || 'Pending')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className={`
                                                        inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm
                                                        ${visitor.status === 'used' ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-amber-50 text-amber-600'}
                                                    `}>
                                                        {visitor.status === 'used' ? 'Selesai' : 'Belum'}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Info & Pagination */}
                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-200 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync Enabled</span>
                            </div>
                            <div className="text-[10px] font-black text-slate-300">|</div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredVisitors.length)} of {filteredVisitors.length}
                            </span>
                        </div>
                        
                        {/* Pagination Controls */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:border-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all active:scale-95"
                            >
                                Prev
                            </button>
                            <div className="flex items-center gap-1 px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                <span className="text-blue-600">{currentPage}</span>
                                <span className="text-slate-300">/</span>
                                <span>{totalPages || 1}</span>
                            </div>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:border-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all active:scale-95"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Visitors;
