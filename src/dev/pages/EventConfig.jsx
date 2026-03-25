import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    ArrowLeft,
    Check,
    CreditCard as PaymentIcon,
    ToggleLeft,
    ToggleRight,
    Settings,
    Save,
    Layout
} from 'lucide-react';
import { motion } from 'framer-motion';

const PAYMENT_CHANNELS = [
    { code: 'BNI', name: 'BNI Virtual Account', type: 'va' },
    { code: 'BRI', name: 'BRI Virtual Account', type: 'va' },
    { code: 'MANDIRI', name: 'Mandiri Virtual Account', type: 'va' },
    { code: 'QRIS', name: 'QRIS', type: 'ewallet' },
    { code: 'OVO', name: 'OVO', type: 'ewallet' },
    { code: 'LINKAJA', name: 'LinkAja', type: 'ewallet' },
    { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet' }
];

const EventConfig = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feeData, setFeeData] = useState({ name: 'Platform Fee', type: 'fixed', value: 5000 });
    const [paymentConfigs, setPaymentConfigs] = useState({});
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('platform');
    const [successMessage, setSuccessMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (eventId) {
            fetchEventData();
        }
    }, [eventId]);

    // Auto-hide toast
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
    };

    const fetchEventData = async () => {
        setLoading(true);
        try {
            // Fetch Event Title
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('id, title, creator_id')
                .eq('id', eventId)
                .single();

            if (eventError) throw eventError;
            setEvent(eventData);

            // Fetch Platform Fee
            const { data: pfData } = await supabase
                .from('event_platform_fees')
                .select('*')
                .eq('event_id', eventId)
                .maybeSingle();

            if (pfData) {
                setFeeData({
                    name: pfData.name || 'Platform Fee',
                    type: pfData.type || 'fixed',
                    value: pfData.value || 0
                });
            }

            // Fetch Payment Configs
            const { data: pcData } = await supabase
                .from('event_payment_configs')
                .select('*')
                .eq('event_id', eventId);

            const configs = {};
            PAYMENT_CHANNELS.forEach(ch => {
                const existing = pcData?.find(p => p.method_code === ch.code);
                configs[ch.code] = existing ? {
                    is_enabled: existing.is_enabled,
                    fee_type: existing.fee_type,
                    fee_value: existing.fee_value
                } : {
                    is_enabled: true,
                    fee_type: 'fixed',
                    fee_value: 0
                };
            });
            setPaymentConfigs(configs);

        } catch (error) {
            console.error("Error fetching event config:", error);
            alert("Event not found.");
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFee = async () => {
        setSaving(true);
        try {
            const payload = {
                event_id: eventId,
                name: feeData.name,
                type: feeData.type,
                value: parseFloat(feeData.value) || 0
            };

            const { data: existing } = await supabase
                .from('event_platform_fees')
                .select('id')
                .eq('event_id', eventId)
                .maybeSingle();

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('event_platform_fees')
                    .update(payload)
                    .eq('event_id', eventId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('event_platform_fees')
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;
            
            triggerToast(`System synchronised: Platform Fee updated!`);
        } catch (error) {
            alert('Failed to save: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSavePaymentConfigs = async () => {
        setSaving(true);
        try {
            const promises = Object.entries(paymentConfigs).map(async ([code, config]) => {
                const payload = {
                    event_id: eventId,
                    method_code: code,
                    is_enabled: config.is_enabled,
                    fee_type: config.fee_type,
                    fee_value: parseFloat(config.fee_value) || 0
                };

                const { data: existing } = await supabase
                    .from('event_payment_configs')
                    .select('id')
                    .eq('event_id', eventId)
                    .eq('method_code', code)
                    .maybeSingle();

                if (existing) {
                    return supabase
                        .from('event_payment_configs')
                        .update(payload)
                        .eq('id', existing.id);
                } else {
                    return supabase
                        .from('event_payment_configs')
                        .insert(payload);
                }
            });

            const results = await Promise.all(promises);
            const error = results.find(r => r.error);
            if (error) throw error.error;

            triggerToast(`System synchronised: Payment Channels updated!`);
        } catch (error) {
            alert('Failed to save: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-20 relative">
            {/* Premium Toast Notification (matches Checkout style) */}
            <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-slate-800">
                    <div className="bg-blue-500 rounded-full p-1.5 shrink-0 animate-pulse">
                        <Check size={16} className="text-white" />
                    </div>
                    {toastMessage}
                </div>
            </div>

            {/* Header section */}
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
                        <ArrowLeft size={14} /> Back to Events
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Operational Control
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Event Configuration
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            System <span className="text-blue-600">Engine</span> <Settings className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Fine-tune platform fees, payment channel availability, and financial logic for <span className="text-slate-900 font-bold">"{event?.title}"</span>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-mono tracking-wider shadow-lg">
                        ID: {event?.id}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mr-1">
                        Priority Deployment
                    </span>
                </div>
            </motion.div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1a36c7] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                Operational Control
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 italic mt-0.5 font-mono">ID: {event?.id}</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
                        <button
                            onClick={() => setActiveTab('platform')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'platform' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Platform Fee
                        </button>
                        <button
                            onClick={() => setActiveTab('payment')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payment' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Payment Channels
                        </button>
                    </div>
                </div>


                <div className="p-8 space-y-8">
                    {activeTab === 'platform' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Label Name</label>
                                <input
                                    type="text"
                                    value={feeData.name}
                                    onChange={e => setFeeData({ ...feeData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                                    placeholder="e.g. Platform Fee"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Fee Engine</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                                        {['fixed', 'percentage'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setFeeData({ ...feeData, type })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feeData.type === type
                                                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                                        {feeData.type === 'fixed' ? 'Nominal Value (IDR)' : 'Percentage Value (%)'}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={feeData.value}
                                            onChange={e => setFeeData({ ...feeData, value: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-xl"
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl group-focus-within:text-blue-600 transition-colors">
                                            {feeData.type === 'fixed' ? 'Rp' : '%'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveFee}
                                disabled={saving}
                                className="w-full bg-[#1a36c7] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#152ba3] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save size={18} className="group-hover:rotate-12 transition-transform" />
                                )}
                                {saving ? 'Updating System...' : 'Synchronize Fee Data'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 gap-4">
                                {PAYMENT_CHANNELS.map((ch) => {
                                    const config = paymentConfigs[ch.code] || { is_enabled: true, fee_type: 'fixed', fee_value: 0 };
                                    return (
                                        <div key={ch.code} className={`p-5 rounded-2xl border transition-all ${config.is_enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div 
                                                        onClick={() => setPaymentConfigs({
                                                            ...paymentConfigs,
                                                            [ch.code]: { ...config, is_enabled: !config.is_enabled }
                                                        })}
                                                        className={`cursor-pointer transition-colors ${config.is_enabled ? 'text-blue-600' : 'text-slate-300'}`}
                                                    >
                                                        {config.is_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{ch.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ch.type === 'va' ? 'Virtual Account' : 'E-Wallet / QRIS'}</p>
                                                    </div>
                                                </div>

                                                <div className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${config.is_enabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                    {config.is_enabled ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleSavePaymentConfigs}
                                disabled={saving}
                                className="w-full bg-[#1a36c7] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#152ba3] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save size={18} className="group-hover:rotate-12 transition-transform" />
                                )}
                                {saving ? 'Synchronizing Channels...' : 'Enable Selected Channels'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventConfig;
