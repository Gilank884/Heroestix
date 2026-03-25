import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    ArrowLeft, TrendingUp, ShoppingBag, Activity,
    Calendar, CheckCircle2, Search,
    Wallet, FileSpreadsheet, CreditCard, Receipt, SearchCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToExcel } from '../../utils/excelExport';
import { exportToPDF } from '../../utils/pdfExport';
import FormalReport from '../../components/Finance/FormalReport';
import { useRef } from 'react';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function TaxDetail() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [paymentBreakdown, setPaymentBreakdown] = useState({});
    const [metrics, setMetrics] = useState({ 
        totalGross: 0, 
        totalNetRevenue: 0, 
        totalCleanProfit: 0, 
        totalPpn: 0, 
        totalFinalProfit: 0,
        ticketCount: 0 
    });
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (eventId) {
            fetchDetail();
        }
    }, [eventId]);

    const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Event Details and Tax
            const [eventRes, taxRes, bankConfigsRes] = await Promise.all([
                supabase.from('events').select('*, creators(brand_name)').eq('id', eventId).single(),
                supabase.from('event_taxes').select('*').eq('event_id', eventId).maybeSingle(),
                supabase.from('bank_configs').select('bank_code, bayarind_fee')
            ]);

            if (eventRes.error) throw eventRes.error;
            setEvent(eventRes.data);
            const eventTax = taxRes.data;
            const feeMap = (bankConfigsRes.data || []).reduce((acc, c) => ({ ...acc, [c.bank_code.toUpperCase()]: Number(c.bayarind_fee || 0) }), {});

            // 2. Fetch Ticket Types to get Ticket IDs
            const { data: ticketTypes } = await supabase
                .from('ticket_types')
                .select('id, price')
                .eq('event_id', eventId);

            const typeIds = ticketTypes?.map(t => t.id) || [];
            const priceMap = (ticketTypes || []).reduce((acc, tt) => ({ ...acc, [tt.id]: Number(tt.price || 0) }), {});

            // 3. Fetch Tickets to get Order IDs
            const { data: eventTickets, error: etError } = await supabase
                .from('tickets')
                .select('id, order_id, ticket_type_id, full_name, email, created_at')
                .in('ticket_type_id', typeIds);

            if (etError) throw etError;

            const orderIds = [...new Set(eventTickets?.map(t => t.order_id).filter(Boolean))];

            // 4. Fetch Transactions and Orders
            if (orderIds.length > 0) {
                const [transRes, ordersRes] = await Promise.all([
                    supabase.from('transactions').select('*').in('order_id', orderIds).in('status', ['paid', 'success']),
                    supabase.from('orders').select('id, discount_amount').in('id', orderIds)
                ]);

                if (transRes.error) throw transRes.error;
                const transData = transRes.data || [];
                const orderDiscountMap = (ordersRes.data || []).reduce((acc, o) => ({ ...acc, [o.id]: Number(o.discount_amount || 0) }), {});

                // 5. Map Tickets to Transactions and calculate financial split
                const orderToTickets = eventTickets.reduce((acc, t) => {
                    if (!acc[t.order_id]) acc[t.order_id] = [];
                    acc[t.order_id].push(t);
                    return acc;
                }, {});

                // 6. Aggregate
                let totalGrossFiltered = 0;
                let totalNetRevenue = 0;
                let totalCleanProfit = 0;
                let totalPpnFiltered = 0;
                let totalFinalProfitFiltered = 0;
                let ticketCountFiltered = 0;
                
                const breakdown = {
                    'VA BNI': 0, 'VA BRI': 0, 'VA Mandiri': 0, 'QRIS': 0,
                    'OVO': 0, 'Dana': 0, 'LinkAja': 0, 'ShopeePay': 0
                };

                const processedTrans = transData.map(tx => {
                    const amount = Number(tx.amount || 0);
                    const txTickets = orderToTickets[tx.order_id] || [];
                    const totalTicketsInOrder = txTickets.length;
                    
                    if (totalTicketsInOrder === 0) return null;

                    // Calculate Netrevenue (Creator Share)
                    let txNetRevenue = 0;
                    txTickets.forEach(t => {
                        const basePrice = priceMap[t.ticket_type_id] || 0;
                        const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
                        const isTaxIncluded = eventTax ? eventTax.is_included : false;
                        
                        let ticketIncome = basePrice;
                        if (!isTaxIncluded && taxRate > 0) {
                            ticketIncome += (basePrice * taxRate / 100);
                        }
                        
                        const discountShare = (orderDiscountMap[tx.order_id] || 0) / totalTicketsInOrder;
                        ticketIncome -= discountShare;
                        txNetRevenue += ticketIncome;
                    });

                    // Calculate Payment Fee
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

                    const txCleanProfit = amount - txNetRevenue - paymentFee;
                    const txPpn = txCleanProfit * 0.11;
                    const txFinalProfit = txCleanProfit - txPpn;

                    totalGrossFiltered += amount;
                    totalNetRevenue += txNetRevenue;
                    totalCleanProfit += txCleanProfit;
                    totalPpnFiltered += txPpn;
                    totalFinalProfitFiltered += txFinalProfit;
                    ticketCountFiltered += totalTicketsInOrder;

                    // Detect Payment Method Label
                    let label = null;
                    if (method.includes('BNI') || provider.includes('BNI')) label = 'VA BNI';
                    else if (method.includes('BRI') || provider.includes('BRI')) label = 'VA BRI';
                    else if (method.includes('MANDIRI') || provider.includes('MANDIRI')) label = 'VA Mandiri';
                    else if (method.includes('QRIS')) label = 'QRIS';
                    else if (method.includes('OVO')) label = 'OVO';
                    else if (method.includes('DANA')) label = 'Dana';
                    else if (method.includes('LINKAJA')) label = 'LinkAja';
                    else if (method.includes('SHOPEEPAY')) label = 'ShopeePay';

                    if (label) breakdown[label] = (breakdown[label] || 0) + 1;

                    return {
                        ...tx,
                        methodLabel: label || 'Other',
                        customerName: txTickets[0]?.full_name || 'Customer',
                        ticketCount: totalTicketsInOrder,
                        netRevenue: txNetRevenue,
                        cleanProfit: txCleanProfit,
                        ppnValue: txPpn,
                        finalProfit: txFinalProfit,
                        paymentFee
                    };
                }).filter(Boolean);

                setTransactions(processedTrans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
                setPaymentBreakdown(breakdown);
                setMetrics({
                    totalGross: totalGrossFiltered,
                    ticketCount: ticketCountFiltered,
                    totalNetRevenue,
                    totalCleanProfit,
                    totalPpn: totalPpnFiltered,
                    totalFinalProfit: totalFinalProfitFiltered,
                    activeEvents: 0
                });
            }

        } catch (err) {
            console.error('Error fetching tax detail:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!transactions.length) return;
        
        const dataToExport = transactions.map(tx => ({
            'Transaction ID': tx.id.toUpperCase(),
            'Date': new Date(tx.created_at).toLocaleString('en-US'),
            'Customer': tx.customerName,
            'Tickets': tx.ticketCount,
            'Method': tx.methodLabel,
            'Gross (Rp)': tx.amount,
            'Net Revenue/Creator (Rp)': tx.netRevenue,
            'Fee (Rp)': tx.paymentFee,
            'Tax PPN 11% (Rp)': tx.ppnValue,
            'Platform Net (Rp)': tx.finalProfit,
            'Status': tx.status.toUpperCase()
        }));

        const fileName = `Tax_Audit_Report_${event?.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        await exportToExcel(dataToExport, fileName);
    };

    const exportFinancialReport = async () => {
        setIsExporting(true);
        try {
            await exportToPDF('platform-report-content', `Tax_Audit_${event?.title || 'Event'}.pdf`);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase animate-pulse">Syncing Audit Stream...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 text-red-600 shadow-xl">
                    <p className="font-black uppercase tracking-widest text-[10px] mb-2">Internal Sync Error</p>
                    <p className="text-sm font-medium">{error}</p>
                    <button onClick={() => navigate('/tax')} className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6 py-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95">
                        <ArrowLeft size={14} /> Back to Audit Matrix
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Standard Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10"
            >
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate('/tax')}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors mb-2"
                    >
                        <ArrowLeft size={14} /> Back to Audit Matrix
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Live Transaction Audit
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate max-w-[200px]">
                            {event?.creators?.brand_name}
                        </span>
                    </div>
                    <div className="text-left">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Event <span className="text-blue-600">Audit</span> <SearchCheck className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Granular transaction audit for event <span className="text-slate-900 font-bold uppercase underline decoration-blue-500/30 decoration-4">"{event?.title}"</span>. Syncing directly with platform settlement ledger.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={exportFinancialReport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200 border border-slate-800 hover:bg-slate-800"
                    >
                        <TrendingUp size={14} className={isExporting ? 'animate-spin' : ''} />
                        Export Audit (PDF)
                    </button>
                    
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border border-slate-100 hover:bg-slate-50"
                    >
                        <FileSpreadsheet size={14} className="text-emerald-500" />
                        Export Audit (Excel)
                    </button>

                    <button
                        onClick={fetchDetail}
                        className="p-3.5 bg-white text-slate-400 rounded-2xl border border-slate-100 shadow-sm hover:text-blue-600 transition-all active:scale-95"
                    >
                        <Activity size={18} />
                    </button>
                </div>
            </motion.div>

            {/* Audit Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Platform Gross</p>
                    <h3 className="text-2xl font-black tabular-nums tracking-tight">{rupiah(metrics.totalGross)}</h3>
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{metrics.ticketCount} Tickets Audited</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden group">
                     <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Receipt size={12} />
                        Total PPN 11%
                     </p>
                     <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">{rupiah(metrics.totalPpn)}</p>
                     <div className="mt-4 pt-4 border-t border-slate-50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Liability Value</p>
                    </div>
                </div>

                <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-2">Platform Clean Net</p>
                    <h3 className="text-2xl font-black tabular-nums tracking-tight">{rupiah(metrics.totalFinalProfit)}</h3>
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-[9px] font-bold text-blue-100/60 uppercase tracking-widest">Settled Amount</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
                    <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest mb-2">Creator Share</p>
                    <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">{rupiah(metrics.totalNetRevenue)}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Disbursed to Creator</p>
                    </div>
                </div>
            </div>

            {/* Detailed Transaction Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden mt-6">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <Activity size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Audit Logs</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transaction-Level Breakdown</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Total {transactions.length} Records
                        </div>
                        <select
                            value={displayLimit}
                            onChange={(e) => setDisplayLimit(Number(e.target.value))}
                            className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={10}>Show 10</option>
                            <option value={25}>Show 25</option>
                            <option value={50}>Show 50</option>
                            <option value={100}>Show 100</option>
                            <option value={transactions.length}>Show All</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse font-sans">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Info</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross</th>
                                <th className="px-8 py-6 text-[10px] font-black text-amber-600 uppercase tracking-widest text-right">Net Creator</th>
                                <th className="px-8 py-6 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Fee</th>
                                <th className="px-8 py-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-right">VAT (11%)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-blue-600 uppercase tracking-widest text-right">Platform Net</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.slice(0, displayLimit).map((tx, idx) => (
                                <motion.tr 
                                    key={tx.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100 group-hover:bg-white transition-colors">
                                                <Calendar size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900 tracking-tighter uppercase whitespace-nowrap">Order #{tx.order_id.slice(0, 8)}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {new Date(tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums">
                                        <p className="text-[13px] font-bold text-slate-900 tracking-tight">{rupiah(tx.amount)}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{tx.methodLabel}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums">
                                        <p className="text-[13px] font-bold text-amber-600 tracking-tight">{rupiah(tx.netRevenue)}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums text-rose-500">
                                        <p className="text-[13px] font-medium tracking-tight">{rupiah(tx.paymentFee)}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums bg-emerald-50/30">
                                        <p className="text-[13px] font-black text-emerald-600 tracking-tight">{rupiah(tx.ppnValue)}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right tabular-nums">
                                        <p className="text-[13px] font-black text-blue-600 tracking-tight">{rupiah(tx.finalProfit)}</p>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Formal Report component for PDF Export */}
            <div style={{ position: 'absolute', left: '-10000px', top: '0', pointerEvents: 'none', background: 'white' }}>
                 <FormalReport 
                    type="platform" 
                    title={`Tax Audit Report: ${event?.title}`}
                    data={[{
                         title: event?.title,
                         ticketsSold: metrics.ticketCount,
                         finalProfit: metrics.totalFinalProfit
                    }]} 
                    metrics={{
                        totalGross: metrics.totalGross,
                        totalNetRevenue: metrics.totalNetRevenue,
                        totalCleanProfit: metrics.totalCleanProfit,
                        totalPpn: metrics.totalPpn,
                        totalFinalProfit: metrics.totalFinalProfit
                    }} 
                />
            </div>
        </div>
    );
}
