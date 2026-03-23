import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    BarChart3,
    TrendingUp,
    Ticket,
    ArrowDownLeft,
    Search,
    Calendar,
    ArrowLeft,
    User,
    Mail,
    Phone,
    X,
    CreditCard,
    Tag,
    Clock,
    ClipboardList,
    FileText,
    Download,
    Layers,
    Activity,
    RefreshCw,
    ExternalLink,
    ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VerificationPending from '../components/VerificationPending';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function EventSalesReport() {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [eventData, setEventData] = useState(null);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        ticketsSold: 0
    });
    const [orderTicketCounts, setOrderTicketCounts] = useState({});
    const [customFieldKeys, setCustomFieldKeys] = useState([]);
    const [isVerified, setIsVerified] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(20);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (user?.id && eventId) {
            fetchEventSalesData();
        }
    }, [user?.id, eventId]);

    const fetchEventSalesData = async () => {
        setLoading(true);
        try {
            const { data: creatorData } = await supabase
                .from('creators')
                .select('verified')
                .eq('id', user.id)
                .single();

            const verified = creatorData?.verified ?? false;
            setIsVerified(verified);
            if (!verified) { setLoading(false); return; }

            const { data: event } = await supabase
                .from('events')
                .select('title')
                .eq('id', eventId)
                .single();
            setEventData(event);

            const { data: eventTax } = await supabase
                .from('event_taxes')
                .select('*')
                .eq('event_id', eventId)
                .maybeSingle();

            const { data: ticketTypes } = await supabase
                .from('ticket_types')
                .select('id')
                .eq('event_id', eventId);

            const ttIds = ticketTypes?.map(t => t.id) || [];

            if (ttIds.length > 0) {
                const { data: ticketsWithOrders, error: tError } = await supabase
                    .from('tickets')
                    .select(`
                        id,
                        order_id,
                        qr_code,
                        full_name,
                        email,
                        gender,
                        birth_date,
                        phone,
                        custom_responses,
                        orders!inner (id, total, status, created_at, discount_amount),
                        ticket_types!inner (id, price, event_id)
                    `)
                    .in('ticket_type_id', ttIds)
                    .eq('orders.status', 'paid');

                if (tError) throw tError;

                if (ticketsWithOrders && ticketsWithOrders.length > 0) {
                    const orderIds = [...new Set(ticketsWithOrders.map(t => t.order_id))];
                    const { data: allTicketsInOrders } = await supabase
                        .from('tickets')
                        .select('order_id')
                        .in('order_id', orderIds);

                    const counts = {};
                    allTicketsInOrders?.forEach(t => {
                        counts[t.order_id] = (counts[t.order_id] || 0) + 1;
                    });
                    setOrderTicketCounts(counts);

                    const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
                    const isTaxIncluded = eventTax ? eventTax.is_included : false;

                    let calculatedNetRevenue = 0;
                    ticketsWithOrders.forEach(t => {
                        const totalTicketsInOrder = counts[t.order_id] || 1;
                        const basePrice = Number(t.ticket_types?.price || 0);
                        let ticketIncome = basePrice;
                        if (!isTaxIncluded && taxRate > 0) {
                            ticketIncome += (basePrice * taxRate / 100);
                        }
                        const discountShare = Number(t.orders?.discount_amount || 0) / totalTicketsInOrder;
                        ticketIncome -= discountShare;
                        calculatedNetRevenue += ticketIncome;
                        t.calculated_revenue = ticketIncome;
                    });

                    const keys = new Set();
                    ticketsWithOrders.forEach(t => {
                        let customData = {};
                        try {
                            customData = typeof t.custom_responses === 'string' ? JSON.parse(t.custom_responses) : (t.custom_responses || {});
                        } catch (e) { }
                        Object.keys(customData).forEach(k => keys.add(k));
                    });
                    setCustomFieldKeys(Array.from(keys));

                    setStats({ totalRevenue: calculatedNetRevenue, ticketsSold: ticketsWithOrders.length });
                    setHistory(ticketsWithOrders || []);
                }
            }
        } catch (error) {
            console.error('Error fetching event sales data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item => {
        const matchesSearch =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.qr_code?.toLowerCase().includes(searchQuery.toLowerCase());

        const itemDate = item.orders?.created_at ? new Date(item.orders.created_at).toISOString().split('T')[0] : null;
        const matchesStartDate = !startDate || (itemDate && itemDate >= startDate);
        const matchesEndDate = !endDate || (itemDate && itemDate <= endDate);

        return matchesSearch && matchesStartDate && matchesEndDate;
    });

    const filteredStats = React.useMemo(() => {
        let revenue = 0;
        filteredHistory.forEach(t => { revenue += (t.calculated_revenue || 0); });
        return { totalRevenue: revenue, ticketsSold: filteredHistory.length };
    }, [filteredHistory]);

    const exportToExcel = () => {
        const headers = ["Order ID", "QR Code", "Nama Pembeli", "Email", "Kelamin", "Tgl Lahir", "Potensi Pendapatan"];
        customFieldKeys.forEach(key => headers.push(key));
        const rows = filteredHistory.map(item => {
            let customData = {};
            try { customData = typeof item.custom_responses === 'string' ? JSON.parse(item.custom_responses) : (item.custom_responses || {}); } catch (e) { }
            const row = [item.orders?.id || '-', item.qr_code || '-', item.full_name || '-', item.email || '-', item.gender || '-', item.birth_date || '-', item.calculated_revenue || 0];
            customFieldKeys.forEach(key => row.push(customData[key] || '-'));
            return row;
        });
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Sales_Report_${eventData?.title || 'Event'}.csv`);
        link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
    };

    if (loading && !eventData) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BarChart3 size={20} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] block">GENERATING REPORT</span>
                    <span className="text-[10px] text-slate-400 font-bold">Harap tunggu, kami sedang menyusun laporan penjualan Anda...</span>
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
                {/* Unified Header & Analytics Card */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 space-y-10"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                    Sales Hub
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Laporan Penjualan</span>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    Sales Analytics <BarChart3 className="text-blue-600" size={32} />
                                </h1>
                                <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed text-balance">
                                    Laporan mendalam mengenai performa penjualan tiket untuk event <span className="text-slate-900 font-bold italic">"{eventData?.title}"</span>.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <motion.button 
                                onClick={() => window.print()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all group"
                            >
                                <FileText size={14} className="group-hover:text-blue-500 transition-colors" />
                                PDF Report
                            </motion.button>
                            <motion.button 
                                onClick={exportToExcel}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all group shrink-0"
                            >
                                <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                                Export CSV
                            </motion.button>
                        </div>
                    </div>

                    {/* Integrated Summary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10 border-t border-slate-100">
                        {[
                            { label: 'Tiket Terjual', value: filteredStats.ticketsSold, icon: Ticket, color: 'blue', desc: 'Total Inventory' },
                            { label: 'Estimasi Pendapatan', value: rupiah(filteredStats.totalRevenue), icon: TrendingUp, color: 'emerald', desc: 'Sudah Terhitung Pajak' },
                            { label: 'Status Laporan', value: 'Terverifikasi', icon: ClipboardList, color: 'indigo', desc: 'Update Real-time' }
                        ].map((stat, idx) => (
                            <div key={idx} className="flex items-start gap-5">
                                <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 shrink-0`}>
                                    <stat.icon size={22} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{stat.value}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{stat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Filters Area (Glassmorphism) */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-5 rounded-[2.25rem] border border-white shadow-xl shadow-slate-200/30 space-y-5"
                >
                    <div className="flex flex-col xl:flex-row gap-5">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama, email, atau ID pesanan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all placeholder:text-slate-300 text-sm"
                            />
                        </div>

                        {/* Date Range & Page Size */}
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center gap-3 bg-white/50 border border-slate-100 rounded-2xl px-5 py-3 shadow-sm grow md:grow-0">
                                <Calendar size={16} className="text-slate-400" />
                                <div className="flex items-center gap-2">
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-700 p-0 w-24 outline-none focus:ring-0" />
                                    <span className="text-slate-200">-</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-700 p-0 w-24 outline-none focus:ring-0" />
                                </div>
                                {(startDate || endDate) && (
                                    <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 px-6 bg-white/50 border border-slate-100 rounded-2xl py-3 shadow-sm h-full grow md:grow-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Grid</span>
                                <select 
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className="bg-transparent font-black text-slate-900 text-sm outline-none cursor-pointer hover:text-blue-600 transition-colors"
                                >
                                    <option value={20}>20 Rows</option>
                                    <option value={50}>50 Rows</option>
                                    <option value={100}>100 Rows</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Sales Table Overhaul */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pembeli</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email & Phone</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender & B-Day</th>
                                    {customFieldKeys.map(key => (
                                        <th key={key} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</th>
                                    ))}
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">Waktu Order <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Potensi Pendapatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filteredHistory.length === 0 ? (
                                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <td colSpan="100%" className="px-8 py-24 text-center text-slate-400 italic font-medium">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <Search size={40} />
                                                    <p className="text-xs uppercase tracking-[0.2em] font-black">Laporan tidak ditemukan</p>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ) : (
                                        filteredHistory.slice(0, pageSize).map((item, idx) => {
                                            let customData = {};
                                            try { customData = typeof item.custom_responses === 'string' ? JSON.parse(item.custom_responses) : (item.custom_responses || {}); } catch (e) { }
                                            
                                            return (
                                                <motion.tr 
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.01 }}
                                                    onClick={() => navigate(`/manage/event/${eventId}/sales-report/${item.id}`)}
                                                    className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50 last:border-none cursor-pointer"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-[10px] border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                {(idx + 1).toString().padStart(2, '0')}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                                    {item.full_name || 'N/A'}
                                                                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </p>
                                                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{item.qr_code}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 space-y-1">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                            <Mail size={10} className="text-slate-300" />
                                                            {item.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                            <Phone size={10} className="text-slate-300" />
                                                            {item.phone}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md inline-block">{item.gender || '-'}</span>
                                                            <p className="text-[10px] font-black text-slate-700">{item.birth_date || '-'}</p>
                                                        </div>
                                                    </td>
                                                    {customFieldKeys.map(key => (
                                                        <td key={key} className="px-8 py-6">
                                                            <span className="text-xs font-black text-slate-700">{customData[key] || '-'}</span>
                                                        </td>
                                                    ))}
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-700 tracking-tight">
                                                                {item.orders?.created_at ? new Date(item.orders.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Paid Order</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <p 
                                                            className="text-base font-black text-blue-600 tabular-nums group-hover:scale-110 transition-transform"
                                                            style={shadowTextStyle}
                                                        >
                                                            +{rupiah(item.calculated_revenue)}
                                                        </p>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Report Footer */}
                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-200 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Real-time</span>
                            </div>
                            <div className="text-[10px] font-black text-slate-300">|</div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Result: {filteredHistory.length} Transactions</span>
                        </div>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                             HEROESTIX <Activity size={10} /> SALES REPORT ENGINE
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

const shadowTextStyle = {
    textShadow: '0 10px 20px rgba(37, 99, 235, 0.1)'
};
