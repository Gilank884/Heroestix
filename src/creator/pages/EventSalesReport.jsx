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
    Layers
} from 'lucide-react';
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
        ticketsSold: 0,
        netRevenue: 0
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
            // Check Verification
            const { data: creatorData } = await supabase
                .from('creators')
                .select('verified')
                .eq('id', user.id)
                .single();

            const verified = creatorData?.verified ?? false;
            setIsVerified(verified);
            if (!verified) { setLoading(false); return; }

            // 1. Fetch Event Details
            const { data: event } = await supabase
                .from('events')
                .select('title')
                .eq('id', eventId)
                .single();
            setEventData(event);

            // Fetch Event Tax
            const { data: eventTax } = await supabase
                .from('event_taxes')
                .select('*')
                .eq('event_id', eventId)
                .maybeSingle();

            // 2. Fetch related ticket types for this event
            const { data: ticketTypes } = await supabase
                .from('ticket_types')
                .select('id')
                .eq('event_id', eventId);

            const ttIds = ticketTypes?.map(t => t.id) || [];

            if (ttIds.length > 0) {
                // 3. Fetch Tickets with joined Orders for this event
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
                    // To handle orders with multiple tickets fairly:
                    // 1. Get all unique order IDs
                    const orderIds = [...new Set(ticketsWithOrders.map(t => t.order_id))];

                    // 2. Fetch total ticket count for EACH of these orders (to split revenue)
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

                    // 3. Calculate revenue: (Price + Tax - DiscountShare)
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
                        // Attach calculated revenue to ticket object for easier filtering/exporting
                        t.calculated_revenue = ticketIncome;
                    });

                    // 4. Identify unique custom field keys
                    const keys = new Set();
                    ticketsWithOrders.forEach(t => {
                        let customData = {};
                        try {
                            customData = typeof t.custom_responses === 'string'
                                ? JSON.parse(t.custom_responses)
                                : (t.custom_responses || {});
                        } catch (e) { }
                        Object.keys(customData).forEach(k => keys.add(k));
                    });
                    setCustomFieldKeys(Array.from(keys));

                    setStats({
                        totalRevenue: calculatedNetRevenue,
                        ticketsSold: ticketsWithOrders.length
                    });
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
        filteredHistory.forEach(t => {
            revenue += (t.calculated_revenue || 0);
        });
        return {
            totalRevenue: revenue,
            ticketsSold: filteredHistory.length
        };
    }, [filteredHistory]);

    const exportToExcel = () => {
        const headers = ["Order ID", "QR Code", "Nama Pembeli", "Email", "Kelamin", "Tgl Lahir", "Potensi Pendapatan"];
        customFieldKeys.forEach(key => headers.push(key));

        const rows = filteredHistory.map(item => {
            let customData = {};
            try {
                customData = typeof item.custom_responses === 'string'
                    ? JSON.parse(item.custom_responses)
                    : (item.custom_responses || {});
            } catch (e) { }

            const row = [
                item.orders?.id || '-',
                item.qr_code || '-',
                item.full_name || '-',
                item.email || '-',
                item.gender || '-',
                item.birth_date || '-',
                item.calculated_revenue || 0
            ];
            customFieldKeys.forEach(key => row.push(customData[key] || '-'));
            return row;
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Sales_Report_${eventData?.title || 'Event'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        window.print();
    };

    if (loading && !eventData) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memproses Laporan...</span>
            </div>
        );
    }

    if (!isVerified) return <VerificationPending />;

    return (
        <div className="space-y-10 pb-20">
            {/* Top Row: Metrics & Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric: Tickets Sold */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tiket Terjual</p>
                        <div className="flex items-baseline gap-2">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tight">{filteredStats.ticketsSold}</h4>
                            <span className="text-sm font-semibold text-slate-400">Inventory</span>
                        </div>
                    </div>
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Ticket size={24} strokeWidth={2} />
                    </div>
                </div>

                {/* Metric: Total Revenue */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Pendapatan</p>
                        <h4 className="text-4xl font-black text-slate-900 tracking-tight">{rupiah(filteredStats.totalRevenue)}</h4>
                    </div>
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <TrendingUp size={24} strokeWidth={2} />
                    </div>
                </div>

                {/* Info Card: Sales Report Details */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Event Info</p>
                        <h4 className="text-lg font-black text-slate-900 line-clamp-1">{eventData?.title}</h4>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Sales Report</span>
                        </div>
                    </div>
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <BarChart3 size={24} strokeWidth={2} />
                    </div>
                </div>
            </div>

            {/* Main Content Area: Sales History Table */}
            <div className="space-y-8">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                        <div className="flex items-center gap-2 mr-2">
                            <button
                                onClick={exportToPDF}
                                className="group flex items-center gap-2 bg-slate-900 px-4 py-2.5 rounded-xl text-white hover:bg-slate-800 transition-all active:scale-95 shadow-md"
                            >
                                <FileText size={14} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">PDF</span>
                            </button>
                            <button
                                onClick={exportToExcel}
                                className="group flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                            >
                                <Download size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Excel</span>
                            </button>
                        </div>

                        <div className="h-8 w-px bg-slate-100 mx-1 hidden md:block" />

                        {/* Date Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 px-2">
                                <Calendar size={13} className="text-slate-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 p-0 w-24"
                                />
                            </div>
                            <span className="text-slate-300 font-bold">-</span>
                            <div className="flex items-center gap-2 px-2">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 p-0 w-24"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-red-500 transition-all"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        <div className="h-8 w-px bg-slate-100 mx-1 hidden md:block" />

                        <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                            <Layers size={13} className="text-slate-400" />
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="bg-transparent text-[10px] font-black text-slate-900 border-none outline-none cursor-pointer focus:ring-0 p-0"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    <div className="relative group w-full xl:w-56">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pembeli</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontak & Kelamin</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Lahir</th>
                                    {customFieldKeys.map(key => (
                                        <th key={key} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</th>
                                    ))}
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Order</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistory.length > 0 ? filteredHistory.slice(0, pageSize).map((item, index) => {
                                    let customData = {};
                                    try {
                                        customData = typeof item.custom_responses === 'string'
                                            ? JSON.parse(item.custom_responses)
                                            : (item.custom_responses || {});
                                    } catch (e) {
                                        customData = {};
                                    }

                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => navigate(`/manage/event/${eventId}/sales-report/${item.id}`)}
                                            className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 font-black text-[10px] group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 tracking-tight text-sm">{item.full_name || 'Tanpa Nama'}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{item.orders?.id?.substring(0, 8) || 'N/A'}</p>
                                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{item.qr_code}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-slate-600 italic">{item.email}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{item.gender || '-'}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">{item.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{item.birth_date || '-'}</span>
                                            </td>
                                            {customFieldKeys.map(key => (
                                                <td key={key} className="px-6 py-6">
                                                    <span className="text-slate-600 text-[11px] font-bold uppercase tracking-tight">{customData[key] || '-'}</span>
                                                </td>
                                            ))}
                                            <td className="px-6 py-6">
                                                <span className="text-slate-500 text-[11px] font-semibold">
                                                    {item.orders?.created_at
                                                        ? new Date(item.orders.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                        : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <p className="font-black text-[#1a36c7] tabular-nums text-base">
                                                    +{rupiah(item.calculated_revenue)}
                                                </p>
                                            </td>

                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6 + customFieldKeys.length} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                                                    <Search size={40} className="text-slate-200" />
                                                </div>
                                                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Belum ada data penjualan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
