import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ClipboardList, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    ArrowLeft,
    Package,
    FileText,
    AlertCircle
} from 'lucide-react';

const CreatorCustomOrderDetail = () => {
    const { user } = useAuthStore();
    const { orderId, id: eventId } = useParams();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id && orderId) {
            fetchOrderDetail();
        }
    }, [user?.id, orderId]);

    const fetchOrderDetail = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('custom_orders')
                .select(`
                    *,
                    events (title)
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order detail:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-500';
            case 'processed': return 'bg-blue-600';
            case 'completed': return 'bg-emerald-500';
            case 'cancelled': return 'bg-rose-500';
            default: return 'bg-slate-500';
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Loading Details</span>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-20 text-center">
                <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900 uppercase">Order Not Found</h2>
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-6 text-blue-600 font-bold flex items-center gap-2 mx-auto hover:underline"
                >
                    <ArrowLeft size={16} /> Back to List
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 text-left">
            {/* Header Area */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-8"
            >
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors mb-2"
                    >
                        <ArrowLeft size={14} /> Back to List
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Request Detail
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            REF ID: #{order.id.slice(0, 8)}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Custom Order <ClipboardList className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Full information regarding logistics requirements for event <span className="text-slate-900 font-bold">"{order.events?.title}"</span>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg ${getStatusColor(order.status)} text-white`}>
                        <Clock size={16} />
                        <span className="text-xs font-black uppercase tracking-wider">{order.status}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">
                        Latest Status
                    </span>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-8 space-y-10"
                >
                    {/* Items Section */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-xl shadow-slate-200/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <Package className="text-blue-600" size={20} /> Logistics Requirements
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-600 transition-colors">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                                        <Package size={18} />
                                    </div>
                                    <span className="text-xs font-black uppercase text-slate-700">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-xl shadow-slate-200/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <FileText className="text-blue-600" size={20} /> Detailed Specifications
                        </h3>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 min-h-[200px]">
                            <p className="text-sm font-medium text-slate-600 leading-relaxed uppercase tracking-tight whitespace-pre-wrap">
                                {order.description || "No additional specifications provided."}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Sidebar Info */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-4 space-y-6"
                >
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 sticky top-10">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Submission Info</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                    <Calendar size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Submission Date</span>
                                    <span className="text-xs font-bold text-slate-900">
                                        {new Date(order.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                    <Clock size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Submission Time</span>
                                    <span className="text-xs font-bold text-slate-900">
                                        {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-6 bg-blue-50 rounded-3xl border border-blue-100 italic font-sans">
                            <p className="text-[10px] text-blue-600 leading-relaxed font-medium uppercase tracking-tight text-center">
                                Your request is currently in the review queue by the HeroesTix logistics team.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CreatorCustomOrderDetail;
