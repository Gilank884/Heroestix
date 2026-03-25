import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Wallet, Search, Filter, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, Building2, TrendingUp, RefreshCw, ShoppingBag, CreditCard, Activity, AlertCircle, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToPDF } from '../../utils/pdfExport';
import { useRef } from 'react';
import FormalReport from '../../components/Finance/FormalReport';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function Cash() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({ totalGross: 0, totalTickets: 0, activeEvents: 0, totalNetRevenue: 0, totalCleanProfit: 0, totalPpn: 0, totalFinalProfit: 0 });
    const [eventSales, setEventSales] = useState([]);
    const [paymentBreakdown, setPaymentBreakdown] = useState({});
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [debugData, setDebugData] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching platform data...');
            
            // 1. Fetch auxiliary data in parallel
            const [eventsRes, creatorsRes, profilesRes, transRes, taxesRes, bankConfigsRes] = await Promise.all([
                supabase.from('events').select('*'),
                supabase.from('creators').select('id, brand_name'),
                supabase.from('profiles').select('id, full_name'),
                supabase.from('transactions').select('id, amount, created_at, order_id, method, payment_provider_data').in('status', ['paid', 'success']),
                supabase.from('event_taxes').select('*'),
                supabase.from('bank_configs').select('bank_code, bayarind_fee')
            ]);

            if (eventsRes.error) throw eventsRes.error;
            if (transRes.error) {
                console.error('Supabase Transaction Error:', transRes.error);
                throw transRes.error;
            }

            const transactions = transRes.data || [];
            const taxMap = (taxesRes.data || []).reduce((acc, t) => ({ ...acc, [t.event_id]: t }), {});
            const feeMap = (bankConfigsRes.data || []).reduce((acc, c) => ({ ...acc, [c.bank_code.toUpperCase()]: Number(c.bayarind_fee || 0) }), {});
            console.log('Transactions fetched:', transactions.length);

            // 2. Fetch Orders, Tickets, and Ticket Types to calculate Netrevenue
            const orderIds = [...new Set(transactions.filter(tx => tx.order_id).map(tx => tx.order_id))];
            
            let orderFinancials = {}; // order_id -> { netRevenue, ticketCount, eventId }
            
            if (orderIds.length > 0) {
                // Fetch orders to get discounts
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('id, discount_amount')
                    .in('id', orderIds);

                const orderDiscountMap = (ordersData || []).reduce((acc, o) => ({ ...acc, [o.id]: Number(o.discount_amount || 0) }), {});

                // Fetch tickets with ticket_types
                const { data: ticketsData } = await supabase
                    .from('tickets')
                    .select('order_id, ticket_types(id, price, event_id)')
                    .in('order_id', orderIds);

                // Group tickets by order to calculate total tickets in order for discount splitting
                const orderCounts = (ticketsData || []).reduce((acc, t) => {
                    acc[t.order_id] = (acc[t.order_id] || 0) + 1;
                    return acc;
                }, {});

                // Calculate Netrevenue (Creator Share) per order
                ticketsData?.forEach(t => {
                    const ticketType = t.ticket_types;
                    if (!ticketType) return;

                    const oId = t.order_id;
                    const eId = ticketType.event_id;
                    const eventTax = taxMap[eId];
                    const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
                    const isTaxIncluded = eventTax ? eventTax.is_included : false;
                    const basePrice = Number(ticketType.price || 0);

                    let ticketIncome = basePrice;
                    if (!isTaxIncluded && taxRate > 0) {
                        ticketIncome += (basePrice * taxRate / 100);
                    }

                    const totalTicketsInOrder = orderCounts[oId] || 1;
                    const discountShare = (orderDiscountMap[oId] || 0) / totalTicketsInOrder;
                    ticketIncome -= discountShare;

                    if (!orderFinancials[oId]) {
                        orderFinancials[oId] = { netRevenue: 0, ticketCount: 0, eventId: eId };
                    }
                    orderFinancials[oId].netRevenue += ticketIncome;
                    orderFinancials[oId].ticketCount += 1;
                });
            }

            const events = eventsRes.data || [];
            const creators = creatorsRes.data || [];
            const profiles = profilesRes.data || [];

            // Lookups
            const creatorMap = creators.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
            const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            // 3. Filter and Aggregate
            let totalGross = 0;
            let totalNetRevenue = 0; // Total Creator Share
            let totalCleanProfit = 0; // Total Platform Share
            let totalPpn = 0;
            let totalFinalProfit = 0;
            let totalTickets = 0;
            const salesByEvent = { _paymentBreakdown: {} };

            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            if (endDate && endDate.length <= 10) end.setHours(23, 59, 59, 999);

            transactions.forEach(tx => {
                const txDate = new Date(tx.created_at);
                if (txDate < start || txDate > end) return;

                const amount = Number(tx.amount || 0);
                if (amount <= 0) return; // Skip withdrawals/payouts for Gross Sales report
                const financials = orderFinancials[tx.order_id];
                
                // If it's a manual transaction without order_id, we assume Netrevenue is 0 for now
                const netRevenue = financials?.netRevenue || 0;
                
                // Calculate Payment Fee (Deducted from Platform Share)
                const method = (tx.method || '').toUpperCase();
                const provider = (tx.payment_provider_data?.bankName || '').toUpperCase();
                
                let paymentFee = 0;
                let feeKey = null;

                if (method.includes('BNI') || provider.includes('BNI')) feeKey = 'BNI';
                else if (method.includes('BRI') || provider.includes('BRI')) feeKey = 'BRI';
                else if (method.includes('MANDIRI') || provider.includes('MANDIRI')) feeKey = 'MANDIRI';
                else if (method.includes('QRIS') || provider.includes('QRIS')) feeKey = 'QRIS';
                else if (method.includes('OVO') || provider.includes('OVO')) feeKey = 'OVO';
                else if (method.includes('SHOPEEPAY') || provider.includes('SHOPEEPAY')) feeKey = 'SHOPEEPAY';
                else if (method.includes('LINKAJA') || provider.includes('LINKAJA')) feeKey = 'LINKAJA';

                const feeConfig = feeKey ? feeMap[feeKey] : 0;
                if (['QRIS', 'OVO', 'SHOPEEPAY'].includes(feeKey)) {
                    paymentFee = (amount * feeConfig / 100);
                } else {
                    paymentFee = feeConfig;
                }

                const cleanProfit = amount - netRevenue - paymentFee;
                const ppnValue = cleanProfit * 0.11;
                const finalProfit = cleanProfit - ppnValue;

                totalGross += amount;
                totalNetRevenue += netRevenue;
                totalCleanProfit += cleanProfit; 
                totalPpn += ppnValue;
                totalFinalProfit += finalProfit;

                // 4. Payment Breakdown (Platform-wide)
                const methodLabel = method.includes('BNI') ? 'VA BNI' :
                                   method.includes('BRI') ? 'VA BRI' :
                                   method.includes('MANDIRI') ? 'VA Mandiri' :
                                   method.includes('QRIS') ? 'QRIS' :
                                   method.includes('OVO') ? 'OVO' : 'Other';
                
                if (!salesByEvent._paymentBreakdown) salesByEvent._paymentBreakdown = {};
                salesByEvent._paymentBreakdown[methodLabel] = (salesByEvent._paymentBreakdown[methodLabel] || 0) + 1;

                const eventId = financials?.eventId;
                if (eventId) {
                    if (!salesByEvent[eventId]) {
                        const event = events.find(e => e.id === eventId);
                        const creator = creatorMap[event?.creator_id];
                        salesByEvent[eventId] = {
                            id: eventId,
                            title: event?.title || 'Unknown Event',
                            creatorBrand: creator?.brand_name || profileMap[event?.creator_id]?.full_name || 'Anonymous',
                            eventDate: event?.event_date || 'N/A',
                            ticketsSold: 0,
                            grossRevenue: 0,
                            netRevenue: 0,
                            paymentFee: 0,
                            cleanProfit: 0
                        };
                    }
                    
                    salesByEvent[eventId].grossRevenue += amount;
                    salesByEvent[eventId].netRevenue += netRevenue;
                    salesByEvent[eventId].paymentFee += paymentFee;
                    salesByEvent[eventId].cleanProfit += cleanProfit;
                    salesByEvent[eventId].ppnValue = (salesByEvent[eventId].ppnValue || 0) + ppnValue;
                    salesByEvent[eventId].finalProfit = (salesByEvent[eventId].finalProfit || 0) + finalProfit;
                    salesByEvent[eventId].ticketsSold += financials.ticketCount || 0;
                    totalTickets += financials.ticketCount || 0;
                }
            });

            const eventList = Object.entries(salesByEvent)
                .filter(([key]) => key !== '_paymentBreakdown')
                .map(([_, value]) => value)
                .sort((a, b) => b.cleanProfit - a.cleanProfit);

            setMetrics({
                totalGross,
                totalNetRevenue,
                totalCleanProfit,
                totalPpn,
                totalFinalProfit,
                totalTickets,
                activeEvents: events.filter(e => e.status === 'active').length
            });
            setEventSales(eventList);
            setPaymentBreakdown(salesByEvent._paymentBreakdown || {});
            setDebugData({
                count: transactions.length,
                orderIdsCount: orderIds.length,
                financialsCount: Object.keys(orderFinancials).length,
                metrics: { totalGross, totalNetRevenue, totalCleanProfit, totalPpn, totalFinalProfit, totalTickets }
            });

        } catch (err) {
            console.error('Error refactoring cash data:', err);
            setError(err.message || 'Failed to sync financial data.');
            setDebugData({ error: err.message });
        } finally {
            setLoading(false);
        }
    };

    const exportFinancialReport = async () => {
        setIsExporting(true);
        try {
            await exportToPDF('platform-report-content', `Platform_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading && eventSales.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest animate-pulse">Calculating Platform Sales...</p>
            </div>
        );
    }

    const filteredEvents = eventSales.filter(e =>
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.creatorBrand?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <img src="/Logo/Logo.png" alt="Heroestix" className="h-8 w-auto" />
                            <div className="w-1 h-6 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Live Revenue Stream</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-medium tracking-tight text-slate-900 italic">Platform <span className="text-blue-600 not-italic">Gross Sales</span></h1>
                        <p className="text-slate-500 font-medium text-sm mt-2">Laporan penjualan kotor seluruh event tanpa potongan.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            <Calendar size={14} className="text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs font-medium text-slate-600 w-28 cursor-pointer"
                            />
                            <span className="text-slate-300 mx-1">—</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs font-medium text-slate-600 w-28 cursor-pointer"
                            />
                        </div>
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Sync Data
                        </button>
                        <button
                            onClick={exportFinancialReport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            <TrendingUp size={14} className={isExporting ? 'animate-spin' : ''} />
                            Export Cash Flow (PDF)
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-1 bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group shadow-2xl shadow-slate-900/10"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-48 -mt-48" />
                    <div className="relative z-10 space-y-4">
                        <p className="text-blue-400 text-[10px] font-medium uppercase tracking-widest mb-1">Gross Platform Revenue</p>
                        <h3 className="text-3xl font-medium tracking-tighter tabular-nums">{rupiah(metrics.totalGross)}</h3>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => navigate('/cash/breakdown')}
                    className="md:col-span-1 bg-blue-600 p-8 rounded-3xl text-white relative overflow-hidden group shadow-2xl shadow-blue-600/20 cursor-pointer hover:scale-[1.02] transition-all"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48 group-hover:bg-white/20 transition-all duration-700" />
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Platform Net Profit (Hasil Akhir)</p>
                            <TrendingUp size={16} className="text-blue-200 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter tabular-nums">{rupiah(metrics.totalFinalProfit)}</h3>
                        <p className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest pt-2 border-t border-white/10 group-hover:text-white transition-colors flex justify-between items-center">
                            <span>Click to view breakdown</span>
                            <span className="bg-white/10 px-2 py-0.5 rounded-lg text-white">Incl. 11% PPN</span>
                        </p>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[9px] font-medium uppercase tracking-widest">Creator Share (Netrevenue)</p>
                            <h3 className="text-xl font-medium text-slate-900 tabular-nums">{rupiah(metrics.totalNetRevenue)}</h3>
                        </div>
                    </motion.div>
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
                        >
                            <p className="text-slate-400 text-[8px] font-medium uppercase tracking-widest mb-1">Sold</p>
                            <h3 className="text-lg font-medium text-slate-900 tabular-nums">{metrics.totalTickets}</h3>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
                        >
                            <p className="text-slate-400 text-[8px] font-medium uppercase tracking-widest mb-1">Active</p>
                            <h3 className="text-lg font-medium text-slate-900">{metrics.activeEvents}</h3>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Event Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                            <Building2 size={20} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 tracking-tight">Event Sales Performance</h3>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:border-blue-400 focus-within:text-blue-500 transition-all w-full md:w-80 shadow-sm">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search event or creator..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-slate-400 text-slate-800"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Event & Creator</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Gross</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-amber-600 uppercase tracking-widest text-right">Netrevenue</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-rose-500 uppercase tracking-widest text-right">Bayarind Fee</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-indigo-500 uppercase tracking-widest text-right">PPN (11%)</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-blue-600 uppercase tracking-widest text-right">Hasil Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredEvents.map((e, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.02 }}
                                    key={e.id}
                                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/cash/${e.id}`)}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm">
                                                {e.title.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm tracking-tight line-clamp-1">{e.title}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{e.creatorBrand}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-slate-500 text-xs font-medium">
                                        {e.eventDate}
                                    </td>
                                    <td className="px-8 py-5 text-right font-medium text-slate-900 tabular-nums text-xs">
                                        {rupiah(e.grossRevenue)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-medium text-amber-600 tabular-nums text-xs">
                                        {rupiah(e.netRevenue)}
                                        <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{e.ticketsSold} SOLD</span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-medium text-rose-500 tabular-nums text-xs">
                                        {rupiah(e.paymentFee)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-medium text-indigo-500 tabular-nums text-xs">
                                        {rupiah(e.ppnValue)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-blue-600 tabular-nums">
                                        {rupiah(e.finalProfit)}
                                    </td>
                                </motion.tr>
                            ))}
                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center text-slate-300 text-sm italic font-medium uppercase tracking-widest opacity-60">
                                        No sales records matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Debug Info (Hidden in Prod, but useful for now) */}
            <div className="mt-20 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 opacity-50 text-[10px] font-mono whitespace-pre">
                <p className="font-bold mb-2 uppercase tracking-widest text-slate-400">System Debug Trace</p>
                {JSON.stringify({ 
                    transactionsCount: debugData?.count, 
                    supabaseError: debugData?.error, 
                    schemaKeys: debugData?.sample,
                    metrics: metrics 
                }, null, 2)}
            </div>

            {/* Hidden Platform Financial Report Template */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <FormalReport 
                    type="platform" 
                    data={eventSales} 
                    metrics={metrics} 
                    paymentBreakdown={paymentBreakdown}
                />
            </div>
        </div>
    );
}
