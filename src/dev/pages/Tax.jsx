import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
    Percent, 
    Search, 
    Filter, 
    Building2, 
    Calendar, 
    TrendingUp, 
    Receipt,
    Download,
    RefreshCw,
    Wallet,
    Info,
    ArrowUpRight,
    SearchCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { exportToPDF } from '../../utils/pdfExport';
import FormalReport from '../../components/Finance/FormalReport';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function Tax() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [eventSales, setEventSales] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [displayLimit, setDisplayLimit] = useState(20);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [metrics, setMetrics] = useState({
        totalGross: 0,
        totalNetRevenue: 0,
        totalCleanProfit: 0,
        totalPpn: 0,
        totalFinalProfit: 0,
        totalTickets: 0,
        eventCount: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [eventsRes, creatorsRes, profilesRes, transRes, taxesRes, bankConfigsRes] = await Promise.all([
                supabase.from('events').select('*'),
                supabase.from('creators').select('id, brand_name'),
                supabase.from('profiles').select('id, full_name'),
                supabase.from('transactions').select('id, amount, created_at, order_id, method, payment_provider_data').in('status', ['paid', 'success']),
                supabase.from('event_taxes').select('*'),
                supabase.from('bank_configs').select('bank_code, bayarind_fee')
            ]);

            if (eventsRes.error) throw eventsRes.error;
            if (transRes.error) throw transRes.error;

            const transactions = transRes.data || [];
            const events = eventsRes.data || [];
            const creators = creatorsRes.data || [];
            const profiles = profilesRes.data || [];
            const taxMap = (taxesRes.data || []).reduce((acc, t) => ({ ...acc, [t.event_id]: t }), {});
            const feeMap = (bankConfigsRes.data || []).reduce((acc, c) => ({ ...acc, [c.bank_code.toUpperCase()]: Number(c.bayarind_fee || 0) }), {});
            const creatorMap = creators.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
            const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            const orderIds = [...new Set(transactions.filter(tx => tx.order_id).map(tx => tx.order_id))];
            let orderFinancials = {}; 

            if (orderIds.length > 0) {
                const { data: ordersData } = await supabase.from('orders').select('id, discount_amount').in('id', orderIds);
                const orderDiscountMap = (ordersData || []).reduce((acc, o) => ({ ...acc, [o.id]: Number(o.discount_amount || 0) }), {});

                const { data: ticketsData } = await supabase.from('tickets').select('order_id, ticket_types(id, price, event_id)').in('order_id', orderIds);
                const orderCounts = (ticketsData || []).reduce((acc, t) => {
                    acc[t.order_id] = (acc[t.order_id] || 0) + 1;
                    return acc;
                }, {});

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

            let totalGross = 0, totalNetRevenue = 0, totalCleanProfit = 0, totalPpn = 0, totalFinalProfit = 0, totalTickets = 0;
            const salesByEvent = {};

            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            if (endDate && endDate.length <= 10) end.setHours(23, 59, 59, 999);

            transactions.forEach(tx => {
                const txDate = new Date(tx.created_at);
                if (txDate < start || txDate > end) return;

                const amount = Number(tx.amount || 0);
                if (amount <= 0) return;

                const financials = orderFinancials[tx.order_id];
                const netRevenue = financials?.netRevenue || 0;

                const method = (tx.method || '').toUpperCase();
                const provider = (tx.payment_provider_data?.bankName || '').toUpperCase();
                let feeKey = null;
                if (method.includes('BNI') || provider.includes('BNI')) feeKey = 'BNI';
                else if (method.includes('BRI') || provider.includes('BRI')) feeKey = 'BRI';
                else if (method.includes('MANDIRI') || provider.includes('MANDIRI')) feeKey = 'MANDIRI';
                else if (method.includes('QRIS') || provider.includes('QRIS')) feeKey = 'QRIS';
                else if (method.includes('OVO') || provider.includes('OVO')) feeKey = 'OVO';
                else if (method.includes('SHOPEEPAY') || provider.includes('SHOPEEPAY')) feeKey = 'SHOPEEPAY';
                else if (method.includes('LINKAJA') || provider.includes('LINKAJA')) feeKey = 'LINKAJA';

                const feeConfig = feeKey ? feeMap[feeKey] : 0;
                let paymentFee = ['QRIS', 'OVO', 'SHOPEEPAY'].includes(feeKey) ? (amount * feeConfig / 100) : feeConfig;

                const cleanProfit = amount - netRevenue - paymentFee;
                const ppnValue = cleanProfit * 0.11;
                const finalProfit = cleanProfit - ppnValue;

                totalGross += amount;
                totalNetRevenue += netRevenue;
                totalCleanProfit += cleanProfit;
                totalPpn += ppnValue;
                totalFinalProfit += finalProfit;

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
                            grossRevenue: 0,
                            netRevenue: 0,
                            paymentFee: 0,
                            cleanProfit: 0,
                            ppnValue: 0,
                            finalProfit: 0,
                            ticketsSold: 0
                        };
                    }
                    salesByEvent[eventId].grossRevenue += amount;
                    salesByEvent[eventId].netRevenue += netRevenue;
                    salesByEvent[eventId].paymentFee += paymentFee;
                    salesByEvent[eventId].cleanProfit += cleanProfit;
                    salesByEvent[eventId].ppnValue += ppnValue;
                    salesByEvent[eventId].finalProfit += finalProfit;
                    salesByEvent[eventId].ticketsSold += financials.ticketCount || 0;
                    totalTickets += financials.ticketCount || 0;
                }
            });

            const eventList = Object.values(salesByEvent).sort((a, b) => b.ppnValue - a.ppnValue);
            setEventSales(eventList);
            setMetrics({
                totalGross,
                totalNetRevenue,
                totalCleanProfit,
                totalPpn,
                totalFinalProfit,
                totalTickets,
                eventCount: events.filter(e => e.status === 'active').length
            });

        } catch (err) {
            console.error('CRITICAL: Tax Calculation Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const exportTaxReport = async () => {
        setIsExporting(true);
        try {
            await exportToPDF('platform-report-content', `Platform_Tax_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally {
            setIsExporting(false);
        }
    };

    const filteredEvents = eventSales.filter(ev => 
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.creatorBrand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Syncing Financial Matrix...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Standard Header Wrapped in Glassmorphism Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Live Audit Stream
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                            Platform Tax Matrix
                        </span>
                    </div>
                    <div className="text-left">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Tax <span className="text-blue-600">Governance</span> <SearchCheck className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Centralized tax reporting and PPN compliance monitoring. All figures are synchronized with the platform's primary settlement ledger.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/50 border border-white rounded-2xl px-4 py-2.5 shadow-sm backdrop-blur-md">
                        <Calendar size={14} className="text-blue-600" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-wider text-slate-600 w-28 cursor-pointer"
                        />
                        <span className="text-slate-300 mx-1">—</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-wider text-slate-600 w-28 cursor-pointer"
                        />
                    </div>
                    
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border border-slate-100 hover:bg-slate-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Sync Audit
                    </button>

                    <button
                        onClick={exportTaxReport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-100 border border-blue-500 hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Download size={14} className={isExporting ? 'animate-spin' : ''} />
                        {isExporting ? 'Exporting...' : 'Export Audit (PDF)'}
                    </button>
                </div>
            </motion.div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-48 -mt-48" />
                    <div className="relative z-10 text-left">
                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Platform Gross</p>
                        <h3 className="text-3xl font-black tracking-tighter tabular-nums">{rupiah(metrics.totalGross)}</h3>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-blue-600 p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
                    <div className="relative z-10 text-left">
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Platform Clean Profit (Final)</p>
                        <h3 className="text-3xl font-black tracking-tighter tabular-nums">{rupiah(metrics.totalCleanProfit)}</h3>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -mr-48 -mt-48" />
                     <div className="relative z-10 text-left">
                        <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                           <Receipt size={12} />
                           VAT Liability (PPN 11%)
                        </p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{rupiah(metrics.totalPpn)}</h3>
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-2 border-t border-slate-50 pt-2 shrink-0">
                            Synchronized with audit ledger
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Event Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden mt-6">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <Building2 size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Tax Settlement Matrix</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Event Audit Logs</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4"> 
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:border-blue-400 focus-within:text-blue-500 transition-all w-full md:w-80 shadow-sm">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search event or creator..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-slate-400 placeholder:font-bold placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest capitalize"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={displayLimit}
                                onChange={(e) => setDisplayLimit(Number(e.target.value))}
                                className="appearance-none bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl px-4 py-3 pr-8 shadow-sm cursor-pointer focus:outline-none focus:border-blue-400 transition-all"
                            >
                                <option value={10}>Show 10</option>
                                <option value={25}>Show 25</option>
                                <option value={50}>Show 50</option>
                                <option value={100}>Show 100</option>
                                <option value={eventSales.length}>Show All</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse font-sans">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event & Creator</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross</th>
                                <th className="px-8 py-6 text-[10px] font-black text-amber-600 uppercase tracking-widest text-right">Net Rev</th>
                                <th className="px-8 py-6 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Fee</th>
                                <th className="px-8 py-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-right">VAT (11%)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-blue-600 uppercase tracking-widest text-right">Final Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredEvents.slice(0, displayLimit).map((ev, idx) => (
                                <motion.tr 
                                    key={ev.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => navigate(`/tax/${ev.id}`)}
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-8 py-6 text-left">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs border border-blue-100/50 shadow-sm shrink-0">
                                                {ev.title.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-900 tracking-tight uppercase truncate">{ev.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                     <Building2 size={10} className="text-slate-300" />
                                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{ev.creatorBrand}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums">
                                        <p className="text-sm font-bold text-slate-900 tracking-tight">{rupiah(ev.grossRevenue)}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums">
                                        <p className="text-sm font-bold text-amber-600 tracking-tight">{rupiah(ev.netRevenue)}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums">
                                        <p className="text-sm font-bold text-rose-500 tracking-tight">{rupiah(ev.paymentFee)}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums bg-emerald-50/30">
                                        <p className="text-sm font-black text-emerald-600 tracking-tight">{rupiah(ev.ppnValue)}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums">
                                        <p className="text-sm font-black text-blue-600 tracking-tight">{rupiah(ev.finalProfit)}</p>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredEvents.length === 0 && (
                        <div className="p-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-6">
                                <Receipt size={40} />
                            </div>
                            <h3 className="text-slate-900 font-black text-sm uppercase tracking-widest leading-none">Safe Audit Queue</h3>
                            <p className="text-slate-400 text-[10px] font-bold mt-3 uppercase tracking-widest">No taxable transactions detected for the current filter</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Formal Report Template for Export */}
            <div style={{ position: 'absolute', left: '-10000px', top: '0', pointerEvents: 'none', background: 'white' }}>
                <FormalReport 
                    type="platform" 
                    title="Platform Tax Audit Report"
                    data={eventSales} 
                    metrics={metrics} 
                />
            </div>
        </div>
    );
}
