import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Plus,
    Trash2,
    Tag,
    Activity,
    Calendar,
    Filter,
    ChevronRight,
    Loader2,
    Ticket,
    MousePointer2,
    AlertCircle
} from 'lucide-react';
import AddVoucherModal from '../components/AddVoucherModal';

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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const EventVouchers = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchVouchers = async () => {
        try {
            const { data, error } = await supabase
                .from('vouchers')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVouchers(data);
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, [eventId]);

    const handleToggleStatus = async (e, voucherId, currentStatus) => {
        e.stopPropagation();
        const newStatus = !currentStatus;
        try {
            const { error } = await supabase
                .from('vouchers')
                .update({ is_active: newStatus })
                .eq('id', voucherId);

            if (error) throw error;
            setVouchers(vouchers.map(v =>
                v.id === voucherId ? { ...v, is_active: newStatus } : v
            ));
        } catch (error) {
            alert('Error updating status: ' + error.message);
        }
    };

    const handleDelete = async (e, voucherId) => {
        e.stopPropagation();
        if (!window.confirm('Hapus voucher ini secara permanen?')) return;
        try {
            const { error } = await supabase
                .from('vouchers')
                .delete()
                .eq('id', voucherId);

            if (error) throw error;
            setVouchers(vouchers.filter(v => v.id !== voucherId));
        } catch (error) {
            alert('Error deleting voucher: ' + error.message);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const filteredVouchers = vouchers.filter(v =>
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        {
            label: 'Total Voucher',
            value: vouchers.length,
            icon: Ticket,
            color: 'bg-blue-500',
            bg: 'bg-blue-50/50'
        },
        {
            label: 'Voucher Aktif',
            value: vouchers.filter(v => v.is_active).length,
            icon: Activity,
            color: 'bg-emerald-500',
            bg: 'bg-emerald-50/50'
        },
        {
            label: 'Total Penggunaan',
            value: vouchers.reduce((acc, v) => acc + (v.used_count || 0), 0),
            icon: MousePointer2,
            color: 'bg-indigo-500',
            bg: 'bg-indigo-50/50'
        }
    ];

    if (loading && vouchers.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Ticket size={20} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] block underline decoration-blue-500/30 underline-offset-8">VOUCHERS</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Memuat database promo...</span>
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 text-left">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                    Campaigns Database
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen Voucher</span>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 leading-none">
                                    Voucher Promo <Ticket className="text-blue-600" size={32} />
                                </h1>
                                <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                                    Kelola seluruh kode promo, kuota penukaran, dan strategi diskon untuk mendorong penjualan tiket event Anda secara efektif.
                                </p>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-3 px-8 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all shrink-0 active:scale-95 overflow-hidden"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Create Voucher
                        </motion.button>
                    </div>

                    {/* Integrated Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="flex items-center gap-5">
                                <div className={`w-12 h-12 ${stat.bg} ${stat.color.replace('bg-', 'text-')} rounded-2xl flex items-center justify-center`}>
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

                {/* Search & Filter Controls Card (Separate) */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-4 rounded-[1.75rem] border border-white shadow-xl shadow-slate-200/30 flex flex-col md:flex-row gap-4"
                >
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Cari kode atau nama voucher..."
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

                {/* Voucher Table View (Main Table Section) */}
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 overflow-hidden text-left min-h-[500px] flex flex-col relative z-10">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kode & Deskripsi</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Benefit</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Usage Limit</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={`skeleton-${i}`} className="animate-pulse">
                                                <td colSpan={5} className="px-8 py-8">
                                                    <div className="h-4 bg-slate-100 rounded-full w-3/4 mx-auto" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredVouchers.length === 0 ? (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <td colSpan={5} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6 max-w-sm mx-auto group">
                                                    <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center shadow-inner relative overflow-hidden transition-transform group-hover:scale-105">
                                                        <Tag size={40} strokeWidth={1.5} />
                                                        <div className="absolute inset-0 bg-blue-600/5 rotate-45 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Voucher Belum Ready</h4>
                                                        <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest max-w-[280px] mx-auto text-center">Tingkatkan konversi tiket dengan promo spesial hari ini.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsModalOpen(true)}
                                                        className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-slate-900/20 transition-all hover:-translate-y-1"
                                                    >
                                                        Create Now
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ) : filteredVouchers.map((voucher, idx) => (
                                        <motion.tr
                                            key={voucher.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => navigate(`/manage/event/${eventId}/vouchers/${voucher.id}/edit`)}
                                            className="group hover:bg-slate-50/50 transition-all cursor-pointer relative"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:shadow-md transition-all shrink-0">
                                                        <Ticket size={20} className="text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900 text-base tracking-tighter uppercase mb-0.5 group-hover:text-blue-600 transition-colors">{voucher.code}</p>
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <Calendar size={12} className="text-slate-300 shrink-0" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                                Exp: {voucher.end_date ? new Date(voucher.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Lifetime'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex flex-col items-center gap-1 text-center">
                                                    <span className="text-sm font-black text-slate-900 leading-none">
                                                        {voucher.type === 'percentage' ? `${voucher.value}% OFF` : formatPrice(voucher.value)}
                                                    </span>
                                                    {voucher.min_purchase > 0 && (
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded shadow-inner mt-1">
                                                            Min Purchase: {formatPrice(voucher.min_purchase)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex flex-col items-center gap-2">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-sm font-black text-slate-900 leading-none">{voucher.used_count || 0}</span>
                                                        <span className="text-[10px] font-bold text-slate-300">/</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{voucher.quota || '∞'}</span>
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-slate-100/50 rounded-full overflow-hidden shadow-inner p-[1px]">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: voucher.quota ? `${Math.min(((voucher.used_count || 0) / voucher.quota) * 100, 100)}%` : '100%' }}
                                                            className={`h-full rounded-full ${voucher.quota && (voucher.used_count / voucher.quota) > 0.8 ? 'bg-amber-500' : 'bg-blue-600'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={(e) => handleToggleStatus(e, voucher.id, voucher.is_active)}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm transition-all active:scale-95 ${voucher.is_active
                                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100/50'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200/50'
                                                        }`}
                                                >
                                                    {voucher.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => handleDelete(e, voucher.id)}
                                                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm bg-white border border-slate-100"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
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
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse active-glow shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">VOUCHER ENGINE • LIVE UPDATE</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <AddVoucherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventId={eventId}
                onRefresh={fetchVouchers}
            />
        </div>
    );
};

export default EventVouchers;
