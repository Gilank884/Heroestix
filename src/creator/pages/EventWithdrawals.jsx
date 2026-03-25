import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    Wallet,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    XCircle,
    PlusCircle,
    Building2,
    CreditCard,
    Info,
    AlertCircle,
    Search,
    TrendingUp,
    FileCheck,
    Activity,
    RefreshCw,
    ArrowUpDown,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function EventWithdrawals() {
    const { id: eventId } = useParams();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [eventData, setEventData] = useState(null);
    const [balance, setBalance] = useState(0);
    const [requests, setRequests] = useState([]);
    const [totalWithdrawn, setTotalWithdrawn] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [creatorInfo, setCreatorInfo] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id && eventId) {
            fetchEventFinancials();
            fetchCreatorInfo();
        }
    }, [user?.id, eventId]);

    const fetchCreatorInfo = async () => {
        const { data } = await supabase
            .from('creators')
            .select('*')
            .eq('id', user.id)
            .single();
        setCreatorInfo(data);
    };

    const fetchEventFinancials = async () => {
        setLoading(true);
        try {
            const { data: event } = await supabase
                .from('events')
                .select('title')
                .eq('id', eventId)
                .single();
            setEventData(event);

            const { data: ticketTypes } = await supabase
                .from('ticket_types')
                .select('id')
                .eq('event_id', eventId);

            const ttIds = (ticketTypes || []).map(tt => tt.id);

            let salesTotal = 0;
            if (ttIds.length > 0) {
                const { data: eventTax } = await supabase
                    .from('event_taxes')
                    .select('*')
                    .eq('event_id', eventId)
                    .maybeSingle();

                const { data: eventTickets, error: etError } = await supabase
                    .from('tickets')
                    .select(`
                        id,
                        order_id,
                        orders!inner (id, total, status, discount_amount),
                        ticket_types!inner (id, price, event_id)
                    `)
                    .in('ticket_type_id', ttIds)
                    .eq('orders.status', 'paid');

                if (etError) throw etError;

                if (eventTickets && eventTickets.length > 0) {
                    const orderIds = [...new Set(eventTickets.map(t => t.order_id))];
                    const { data: allTicketsInOrders } = await supabase
                        .from('tickets')
                        .select('order_id')
                        .in('order_id', orderIds);

                    const orderTicketCounts = {};
                    allTicketsInOrders?.forEach(t => {
                        orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                    });

                    const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
                    const isTaxIncluded = eventTax ? eventTax.is_included : false;

                    eventTickets.forEach(t => {
                        const totalTicketsInOrder = orderTicketCounts[t.order_id] || 1;
                        const basePrice = Number(t.ticket_types?.price || 0);
                        let ticketIncome = basePrice;
                        if (!isTaxIncluded && taxRate > 0) {
                            ticketIncome += (basePrice * taxRate / 100);
                        }
                        const discountShare = Number(t.orders?.discount_amount || 0) / totalTicketsInOrder;
                        ticketIncome -= discountShare;
                        salesTotal += ticketIncome;
                    });
                }
            }

            const { data: withdrawalData } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            const eventWithdrawals = (withdrawalData || []).filter(w =>
                (w.description && w.description.includes(eventId)) || w.event_id === eventId
            );

            const withdrawnTotal = eventWithdrawals
                .filter(w => w.status === 'approved')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            setBalance(salesTotal - withdrawnTotal);
            setTotalWithdrawn(withdrawnTotal);
            setRequests(eventWithdrawals);

        } catch (error) {
            console.error('Error fetching event financials:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestWithdrawal = () => {
        navigate(`/manage/event/${eventId}/withdrawals/request`);
    };

    const filteredRequests = requests.filter(req =>
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.amount.toString().includes(searchQuery) ||
        req.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, rowsPerPage]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
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

    if (loading && !eventData) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Wallet size={20} className="text-indigo-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] block">FINANCIAL SYNC</span>
                    <span className="text-[10px] text-slate-400 font-bold">Harap tunggu, kami sedang menghitung saldo event...</span>
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
                {/* Unified Header & Financials Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 space-y-10"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-200">
                                    Financial Hub
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penarikan Saldo</span>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    Manajemen Saldo <Wallet className="text-indigo-600" size={32} />
                                </h1>
                                <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                                    Pantau arus kas event Anda, kelola pencairan dana, dan riwayat penarikan secara transparan.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <motion.button
                                onClick={fetchEventFinancials}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl shadow-sm hover:text-indigo-600 hover:border-indigo-600 transition-all group"
                            >
                                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                            </motion.button>
                            <motion.button
                                onClick={handleRequestWithdrawal}
                                disabled={balance < 100000}
                                whileHover={balance >= 100000 ? { scale: 1.05 } : {}}
                                whileTap={balance >= 100000 ? { scale: 0.95 } : {}}
                                className={`flex items-center gap-2 px-8 py-4 px-6 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-xl transition-all group shrink-0 ${balance >= 100000
                                        ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-indigo-600'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                <PlusCircle size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                Tarik Saldo Sekarang
                            </motion.button>
                        </div>
                    </div>

                    {/* Integrated Summary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10 border-t border-slate-100">
                        {[
                            { label: 'Saldo Tersedia', value: rupiah(balance), icon: Wallet, color: 'indigo', desc: 'Min. Rp 100rb' },
                            { label: 'Total Telah Cair', value: rupiah(totalWithdrawn), icon: FileCheck, color: 'emerald', desc: 'Disetujui Admin' },
                            { label: 'Rekening Utama', value: creatorInfo?.bank_name || 'Belum Diatur', icon: Building2, color: 'blue', desc: creatorInfo?.bank_account || 'N/A' }
                        ].map((stat, idx) => (
                            <div key={idx} className="flex items-start gap-5">
                                <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 shrink-0`}>
                                    <stat.icon size={22} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{stat.value}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${idx === 0 && balance < 100000 ? 'text-amber-500' : 'text-slate-300'}`}>{stat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Controls Area (Search & Rows) */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-4 rounded-[1.75rem] border border-white shadow-xl shadow-slate-200/30 flex flex-col md:flex-row gap-4"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari ID penarikan atau nominal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:bg-white focus:border-indigo-600 transition-all placeholder:text-slate-300 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3 px-6 border-l border-slate-100/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Show</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="bg-transparent font-black text-slate-900 text-sm outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                        >
                            <option value={10}>10 Rows</option>
                            <option value={20}>20 Rows</option>
                            <option value={50}>50 Rows</option>
                        </select>
                    </div>
                </motion.div>

                {/* Transaction History Overhaul */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">#</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referensi</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">Tanggal Berkas <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nominal Cair</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {paginatedRequests.length === 0 ? (
                                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <td colSpan="5" className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 shadow-inner">
                                                        <AlertCircle size={40} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-900 uppercase tracking-widest">Riwayat Kosong</p>
                                                        <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">
                                                            Belum ada data penarikan saldo yang ditemukan untuk pencarian ini.
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ) : (
                                        paginatedRequests.map((req, idx) => (
                                            <motion.tr
                                                key={req.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                onClick={() => navigate(`/manage/event/${eventId}/withdrawals/${req.id}`)}
                                                className="group hover:bg-indigo-50/30 transition-all duration-300 border-b border-slate-50 last:border-none cursor-pointer"
                                            >
                                                <td className="px-8 py-6">
                                                    <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-600 transition-colors tracking-widest">
                                                        {String(startIndex + idx + 1).padStart(2, '0')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm font-black text-slate-900 tracking-tight">WD-{req.id.substring(0, 8).toUpperCase()}</p>
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity uppercase">Detail</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-700 tracking-tight">
                                                            {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Waktu Settlement</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <p className="text-base font-black text-slate-900 tabular-nums">{rupiah(req.amount)}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-end">
                                                        <StatusBadge status={req.status} />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-200 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Verified</span>
                            </div>
                            <div className="text-[10px] font-black text-slate-300">|</div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                Page {currentPage} of {totalPages || 1} ({filteredRequests.length} Transactions)
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(prev - 1, 1)); }}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-600 disabled:opacity-30 transition-all active:scale-95"
                            >
                                Previous
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(prev + 1, totalPages)); }}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-600 disabled:opacity-30 transition-all active:scale-95"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        pending: { label: 'Prosedur', icon: Clock, className: 'bg-amber-50 text-amber-600 border-amber-100' },
        approved: { label: 'Tercairkan', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        rejected: { label: 'Ditolak', icon: XCircle, className: 'bg-rose-50 text-rose-600 border-rose-100' },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.10em] flex items-center gap-2 w-fit border-2 ${config.className} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={12} strokeWidth={3} />
            {config.label}
        </div>
    );
}
