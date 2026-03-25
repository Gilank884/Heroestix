import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
    ArrowLeft, Building2, Code2, Palette, Settings, 
    TrendingUp, Calendar, LayoutDashboard, Wallet,
    ChevronRight, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function ProfitBreakdown() {
    const { eventId: paramEventId } = useParams();
    const [searchParams] = useSearchParams();
    const eventId = paramEventId || searchParams.get('eventId');
    
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [totalProfit, setTotalProfit] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Global Data Setup (Bank Configs)
            const { data: bankConfigs } = await supabase.from('bank_configs').select('bank_code, bayarind_fee');
            const feeMap = (bankConfigs || []).reduce((acc, c) => ({ ...acc, [c.bank_code.toUpperCase()]: Number(c.bayarind_fee || 0) }), {});

            if (eventId) {
                // SPECIFIC EVENT LOGIC
                const [eventRes, ttRes, taxRes] = await Promise.all([
                    supabase.from('events').select('*, creators(brand_name)').eq('id', eventId).single(),
                    supabase.from('ticket_types').select('id, price').eq('event_id', eventId),
                    supabase.from('event_taxes').select('*').eq('event_id', eventId).maybeSingle()
                ]);

                if (eventRes.error) throw eventRes.error;
                setEvent(eventRes.data);

                const ticketTypes = ttRes.data || [];
                const eventTax = taxRes.data;
                const priceMap = ticketTypes.reduce((acc, tt) => ({ ...acc, [tt.id]: Number(tt.price || 0) }), {});
                const typeIds = ticketTypes.map(t => t.id);

                const { data: tickets, error: etError } = await supabase
                    .from('tickets')
                    .select('id, order_id, ticket_type_id')
                    .in('ticket_type_id', typeIds);
                if (etError) throw etError;

                const orderIds = [...new Set(tickets?.map(t => t.order_id).filter(Boolean))];

                if (orderIds.length === 0) {
                    setTotalProfit(0);
                    return;
                }

                const [transRes, ordersRes] = await Promise.all([
                    supabase.from('transactions').select('*').in('order_id', orderIds).in('status', ['paid', 'success']),
                    supabase.from('orders').select('id, discount_amount').in('id', orderIds)
                ]);
                
                if (transRes.error) throw transRes.error;
                const txs = transRes.data || [];
                const orderDiscountMap = (ordersRes.data || []).reduce((acc, o) => ({ ...acc, [o.id]: Number(o.discount_amount || 0) }), {});

                const orderToTickets = tickets.reduce((acc, t) => {
                    if (!acc[t.order_id]) acc[t.order_id] = [];
                    acc[t.order_id].push(t);
                    return acc;
                }, {});

                let calculatedProfit = 0;
                txs.forEach(tx => {
                    const amount = Number(tx.amount || 0);
                    const orderTickets = orderToTickets[tx.order_id] || [];
                    const totalTicketsInOrder = orderTickets.length;
                    
                    let txNetRevenue = 0;
                    orderTickets.forEach(t => {
                        const basePrice = priceMap[t.ticket_type_id] || 0;
                        const taxValue = eventTax ? parseFloat(eventTax.value || 0) : 0;
                        const isTaxIncluded = eventTax ? eventTax.is_included : false;
                        
                        let ticketIncome = basePrice;
                        if (!isTaxIncluded && taxValue > 0) {
                            ticketIncome += (basePrice * taxValue / 100);
                        }
                        
                        const discountShare = (orderDiscountMap[tx.order_id] || 0) / (totalTicketsInOrder || 1);
                        ticketIncome -= discountShare;
                        txNetRevenue += ticketIncome;
                    });

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

                    const cleanProfit = amount - txNetRevenue - paymentFee;
                    const ppnAmount = cleanProfit * 0.11;
                    calculatedProfit += (cleanProfit - ppnAmount);
                });

                setTotalProfit(calculatedProfit);

            } else {
                // GLOBAL PLATFORM LOGIC (Using Separate Fetches to avoid join issues)
                
                // 1. Fetch all successful transactions
                const { data: txs, error: txErr } = await supabase
                    .from('transactions')
                    .select('*')
                    .in('status', ['paid', 'success']);
                
                if (txErr) throw txErr;
                const orderIds = [...new Set(txs.map(tx => tx.order_id).filter(Boolean))];

                if (orderIds.length === 0) {
                    setTotalProfit(0);
                    return;
                }

                // 2. Fetch all orders and their tickets for these transactions
                const { data: orders, error: oErr } = await supabase
                    .from('orders')
                    .select(`
                        id, discount_amount,
                        tickets (
                            id, ticket_type_id,
                            ticket_types (
                                id, price, event_id
                            )
                        )
                    `)
                    .in('id', orderIds);

                if (oErr) throw oErr;

                // 3. Fetch all event taxes to map correctly
                const { data: eventTaxes } = await supabase.from('event_taxes').select('*');
                const taxMap = (eventTaxes || []).reduce((acc, t) => ({ 
                    ...acc, 
                    [t.event_id]: { value: Number(t.value || 0), isIncluded: t.is_included } 
                }), {});

                // 4. Map Orders for lookup
                const orderMap = (orders || []).reduce((acc, o) => ({ ...acc, [o.id]: o }), {});

                let globalProfit = 0;

                txs.forEach(tx => {
                    const amount = Number(tx.amount || 0);
                    const order = orderMap[tx.order_id];
                    if (!order) return;

                    const tickets = order.tickets || [];
                    const totalTicketsInOrder = tickets.length;
                    if (totalTicketsInOrder === 0) return;

                    // Calculate Creator Share
                    let txCreatorShare = 0;
                    tickets.forEach(t => {
                        const tt = t.ticket_types;
                        if (!tt) return;

                        const basePrice = Number(tt.price || 0);
                        const taxConfig = taxMap[tt.event_id] || { value: 0, isIncluded: false };
                        
                        let ticketIncome = basePrice;
                        if (!taxConfig.isIncluded && taxConfig.value > 0) {
                            ticketIncome += (basePrice * taxConfig.value / 100);
                        }
                        
                        const discountShare = Number(order.discount_amount || 0) / totalTicketsInOrder;
                        ticketIncome -= discountShare;
                        txCreatorShare += ticketIncome;
                    });

                    // Calculate Payment Fee
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

                    const feeValue = feeKey ? (feeMap[feeKey] || 0) : 0;
                    let paymentFee = 0;
                    if (['QRIS', 'OVO', 'SHOPEEPAY'].includes(feeKey)) {
                        paymentFee = (amount * feeValue / 100);
                    } else {
                        paymentFee = feeValue;
                    }

                    // Platform Clean Profit calculation
                    const cleanProfit = amount - txCreatorShare - paymentFee;
                    const finalProfit = cleanProfit > 0 ? (cleanProfit * 0.89) : 0;
                    globalProfit += finalProfit;
                });

                setTotalProfit(globalProfit);
            }
        } catch (err) {
            console.error('Error fetching breakdown:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const breakdown = [
        { label: 'Corporate', percentage: 35, color: 'bg-blue-600', icon: Building2, desc: 'Corporate growth and operations' },
        { label: 'Developer', percentage: 35, color: 'bg-indigo-600', icon: Code2, desc: 'Core platform engineering' },
        { label: 'UI/UX', percentage: 15, color: 'bg-purple-600', icon: Palette, desc: 'Interface and experience design' },
        { label: 'Maintenance', percentage: 15, color: 'bg-slate-600', icon: Settings, desc: 'Infrastructure and security' },
    ];

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Calculating Revenue Split...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10"
            >
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors mb-2"
                    >
                        <ArrowLeft size={14} /> Back to Summary
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Revenue Breakdown
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {event ? event.title : 'Global Platform'}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Profit <span className="text-blue-600">Distribution</span> <TrendingUp className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Platform algorithmic revenue split between corporate, engineering, design, and infrastructure maintenance.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 shadow-sm hover:text-blue-600 transition-all active:scale-95"
                    >
                        <Activity size={20} />
                    </button>
                    
                    <div className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 border border-slate-800">
                         PPN: 11% Included
                    </div>
                </div>
            </motion.div>

            <div className="bg-slate-900 rounded-[40px] p-12 text-center relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-blue-600/30 transition-all duration-1000" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -ml-32 -mb-32 group-hover:bg-indigo-600/20 transition-all duration-1000" />
                
                <div className="relative z-10 space-y-4">
                    <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-blue-400 mx-auto border border-white/5 shadow-inner">
                        <TrendingUp size={40} />
                    </div>
                    <div>
                        <p className="text-blue-200/60 text-xs font-black uppercase tracking-[0.4em] mb-3">Net Profit to Distribute</p>
                        <h2 className="text-6xl font-black text-white tracking-tighter tabular-nums mb-2">
                            {rupiah(totalProfit)}
                        </h2>
                        <div className="flex items-center justify-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest pt-4 border-t border-white/5 inline-block mx-auto px-8">
                            <Calendar size={12} />
                            <span>After 11% PPN Deduction</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {breakdown.map((item, idx) => {
                    const amount = (totalProfit * item.percentage) / 100;
                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all border-b-4"
                            style={{ borderBottomColor: `var(--${item.color.split('-')[1]}-500)` }}
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className={`w-16 h-16 ${item.color} rounded-3xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                    <item.icon size={32} />
                                </div>
                                <div className="text-right">
                                    <span className={`px-4 py-1.5 ${item.color.replace('bg-', 'bg-').replace('-600', '-50')} ${item.color.replace('bg-', 'text-')} text-xs font-black rounded-full uppercase tracking-widest`}>
                                        {item.percentage}% Share
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">{item.label}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                                </div>
                                
                                <div className="pt-6 border-t border-slate-50">
                                    <p className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                                        {rupiah(amount)}
                                    </p>
                                    <div className="w-full h-2 bg-slate-50 rounded-full mt-4 overflow-hidden outline outline-1 outline-slate-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.percentage}%` }}
                                            transition={{ duration: 1.5, delay: 0.5 + idx * 0.1, ease: "easeOut" }}
                                            className={`h-full ${item.color}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="bg-blue-50/50 rounded-[32px] p-8 border border-blue-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Distribution Policy</p>
                        <p className="text-[10px] font-bold text-blue-600/80 uppercase tracking-widest">Calculated from total platform net profit after creator share and payment fees.</p>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/cash')}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                    Back to Cash Summary
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
