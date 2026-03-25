import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    ArrowLeft, TrendingUp, ShoppingBag, Activity,
    Calendar, CheckCircle2, Search,
    Wallet, FileSpreadsheet, CreditCard
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

export default function EventCashDetail() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [paymentBreakdown, setPaymentBreakdown] = useState({});
    const [metrics, setMetrics] = useState({ totalGross: 0, ticketCount: 0 });
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
                    const totalTicketsInOrder = txTickets.length; // Approximate for this simplified view
                    
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

                    const txCleanProfit = amount - txNetRevenue - paymentFee;
                    const txPpn = txCleanProfit * 0.11;
                    const txFinalProfit = txCleanProfit - txPpn;

                    totalGrossFiltered += amount;
                    totalNetRevenue += txNetRevenue;
                    totalCleanProfit += txCleanProfit;
                    totalPpnFiltered += txPpn;
                    totalFinalProfitFiltered += txFinalProfit;
                    ticketCountFiltered += totalTicketsInOrder;

                    // Detect Payment Method
                    const methodLabelSearch = (tx.method || '').toLowerCase();
                    const providerLabelSearch = (tx.payment_provider_data?.bankName || '').toUpperCase();

                    let label = null;
                    if (methodLabelSearch.includes('bni') || providerLabelSearch.includes('BNI')) label = 'VA BNI';
                    else if (methodLabelSearch.includes('bri') || providerLabelSearch.includes('BRI')) label = 'VA BRI';
                    else if (methodLabelSearch.includes('mandiri') || providerLabelSearch.includes('MANDIRI')) label = 'VA Mandiri';
                    else if (methodLabelSearch.includes('qris') || providerLabelSearch.includes('QRIS')) label = 'QRIS';
                    else if (methodLabelSearch.includes('ovo') || providerLabelSearch.includes('OVO')) label = 'OVO';
                    else if (methodLabelSearch.includes('dana') || providerLabelSearch.includes('DANA')) label = 'Dana';
                    else if (methodLabelSearch.includes('linkaja') || providerLabelSearch.includes('LINKAJA')) label = 'LinkAja';
                    else if (methodLabelSearch.includes('shopeepay') || providerLabelSearch.includes('SHOPEEPAY')) label = 'ShopeePay';

                    if (label) breakdown[label] = (breakdown[label] || 0) + 1;

                    return {
                        ...tx,
                        methodLabel: label || 'Other',
                        customerName: txTickets[0]?.full_name || 'Customer',
                        ticketCount: txTickets.length,
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
                    totalTickets: ticketCountFiltered,
                    totalNetRevenue,
                    totalCleanProfit,
                    totalPpn: totalPpnFiltered,
                    totalFinalProfit: totalFinalProfitFiltered,
                    activeEvents: 0 // Not relevant here
                });
            }

        } catch (err) {
            console.error('Error fetching event cash detail:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!transactions.length) return;
        
        const dataToExport = transactions.map(tx => ({
            'Transaction ID': tx.id.toUpperCase(),
            'Date': new Date(tx.created_at).toLocaleString('id-ID'),
            'Customer': tx.customerName,
            'Tickets': tx.ticketCount,
            'Method': tx.methodLabel,
            'Gross (Rp)': tx.amount,
            'NetRevenue/Creator (Rp)': tx.netRevenue,
            'Bayarind Fee (Rp)': tx.paymentFee,
            'Platform Profit (Rp)': tx.cleanProfit,
            'Status': tx.status.toUpperCase()
        }));

        const fileName = `Financial_Report_${event?.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        await exportToExcel(dataToExport, fileName);
    };

    const exportFinancialReport = async () => {
        setIsExporting(true);
        try {
            await exportToPDF('financial-report-content', `Financial_Report_${event?.title || 'Event'}.pdf`);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Memuat Detail Keuangan...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-600">
                    <p className="font-bold">Error loading details</p>
                    <p className="text-sm">{error}</p>
                    <button onClick={() => navigate('/cash')} className="mt-4 text-sm font-bold underline">Kembali ke Ringkasan</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/cash')}
                        className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <img src="/Logo/Logo.png" alt="Heroestix" className="h-6 w-auto" />
                            <div className="w-px h-4 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-wider">Event Detail</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{event?.creators?.brand_name}</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">{event?.title}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={exportFinancialReport}
                        disabled={isExporting}
                        className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 hover:text-blue-600 transition-all flex items-center gap-2 group"
                        title="Export to PDF"
                    >
                        <TrendingUp size={20} className={isExporting ? 'animate-spin' : ''} />
                        <span className="hidden md:inline font-bold text-xs uppercase tracking-widest text-slate-400 group-hover:text-blue-600">Export Cash Flow</span>
                    </button>
                    <button 
                        onClick={handleExport}
                        className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 hover:text-emerald-600 transition-all flex items-center gap-2 group"
                        title="Export to Excel"
                    >
                        <FileSpreadsheet size={20} />
                        <span className="hidden md:inline font-bold text-xs uppercase tracking-widest text-slate-400 group-hover:text-emerald-600">Export Excel</span>
                    </button>
                    <button onClick={fetchDetail} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 hover:text-blue-600 transition-all">
                        <Activity size={20} />
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/30 transition-all duration-700" />
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-widest mb-1">Total Gross Revenue</p>
                            <p className="text-2xl font-black tracking-tight">{rupiah(metrics.totalGross)}</p>
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => navigate(`/cash/${eventId}/breakdown`)}
                    className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-blue-600/10 cursor-pointer hover:scale-[1.02] transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/30 transition-all duration-700" />
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest mb-1">Platform Clean Profit (After PPN)</p>
                            <p className="text-2xl font-black tracking-tight">{rupiah(metrics.totalFinalProfit)}</p>
                        </div>
                        <p className="text-[10px] font-bold text-blue-100/40 uppercase tracking-widest pt-2 border-t border-white/10 group-hover:text-white transition-colors">Click for 11% PPN Breakdown</p>
                    </div>
                </motion.div>

                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Creator Share (Netrevenue)</p>
                        <p className="text-2xl font-black text-slate-900">{rupiah(metrics.totalNetRevenue)}</p>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Tiket Terjual</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-black text-slate-900">{metrics.ticketCount}</p>
                            <p className="text-slate-400 font-bold mb-1 text-xs uppercase tracking-widest">Tiket</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <CreditCard size={20} />
                        </div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Payment Method Breakdown</h2>
                    </div>
                    <div className="px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total {transactions.length} Transaksi
                    </div>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {Object.entries(paymentBreakdown).map(([label, count]) => (
                            <div key={label} className={`p-6 rounded-2xl border transition-all ${count > 0 ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50/50 border-transparent opacity-40'}`}>
                                <div className="space-y-3 text-center">
                                    <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center p-2 ${count > 0 ? 'bg-white shadow-sm' : 'bg-slate-100'
                                        }`}>
                                        {label === 'VA BNI' && <img src="/Logo/bni.png" alt="BNI" className="max-h-full object-contain" />}
                                        {label === 'VA BRI' && <img src="/Logo/bri.png" alt="BRI" className="max-h-full object-contain" />}
                                        {label === 'VA Mandiri' && <img src="/Logo/mandiri.png" alt="Mandiri" className="max-h-full object-contain" />}
                                        {label === 'QRIS' && <img src="/Logo/qris.jpg" alt="QRIS" className="max-h-full object-contain" />}
                                        {label === 'OVO' && <img src="/Logo/ovo.png" alt="OVO" className="max-h-full object-contain" />}
                                        {label === 'Dana' && <img src="/Logo/dana.png" alt="Dana" className="max-h-full object-contain" />}
                                        {label === 'LinkAja' && <img src="/Logo/linkaja.png" alt="LinkAja" className="max-h-full object-contain" />}
                                        {label === 'ShopeePay' && <img src="/Logo/shopeepay.png" alt="ShopeePay" className="max-h-full object-contain" />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 leading-none">{label}</p>
                                        <p className="text-xl font-black text-slate-900">{count}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Transaction Logs Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-12">
                <div className="p-8 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <Activity size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Financial Logs (Successful Only)</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search transaction..."
                                    className="pl-12 pr-6 py-3 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all w-full md:w-64"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <th className="p-5 pl-8">Transaction Info</th>
                                <th className="p-5">Customer / Tickets</th>
                                <th className="p-5">Payment</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross</th>
                                <th className="px-6 py-4 text-[10px] font-black text-amber-600 uppercase tracking-widest text-right">Netrev</th>
                                <th className="px-6 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Fee</th>
                                <th className="px-6 py-4 text-[10px] font-black text-indigo-500 uppercase tracking-widest text-right">PPN</th>
                                <th className="px-6 py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest text-right">Net Profit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="p-5 pl-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                                                <Calendar size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 tracking-tight">#{tx.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{new Date(tx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <p className="text-sm font-bold text-slate-700">{tx.customerName}</p>
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{tx.ticketCount} Tiket</p>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${tx.methodLabel === 'QRIS' ? 'bg-purple-500' :
                                                tx.methodLabel.includes('VA') ? 'bg-blue-500' :
                                                    'bg-slate-400'
                                                }`} />
                                            <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{tx.methodLabel}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right font-bold text-slate-900 text-xs tabular-nums">
                                        {rupiah(tx.amount)}
                                    </td>
                                    <td className="p-5 text-right font-medium text-amber-600 text-xs tabular-nums">
                                        {rupiah(tx.netRevenue)}
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-xs font-medium text-rose-500">
                                        {rupiah(tx.paymentFee)}
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-xs font-medium text-indigo-500">
                                        {rupiah(tx.ppnValue)}
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-xs font-bold text-blue-600">
                                        {rupiah(tx.finalProfit)}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-20 text-center text-slate-400 font-bold text-sm">No transaction records found for this event.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <FormalReport 
                    type="event_cash_dev" 
                    data={{ 
                        totalSales: metrics.totalNetRevenue, 
                        totalWithdrawn: 0, 
                        eventBalance: metrics.totalNetRevenue,
                        withdrawals: [] 
                    }} 
                    metrics={metrics}
                    paymentBreakdown={paymentBreakdown}
                    creatorInfo={event?.creators} 
                    eventData={event} 
                />
            </div>
        </div>
    );
}
