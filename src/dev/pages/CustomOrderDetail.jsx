import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
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
    AlertCircle,
    XCircle,
    User,
    ChevronRight
} from 'lucide-react';

const DevCustomOrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetail();
        }
    }, [orderId]);

    const fetchOrderDetail = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('custom_orders')
                .select(`
                    *,
                    creators (brand_name, image_url),
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

    const updateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('custom_orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            setOrder(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error('Error updating status:', error.message);
            alert('Gagal update status: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'pending': return { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-700', icon: Clock, label: 'Pending' };
            case 'processed': return { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-700', icon: Package, label: 'Processed' };
            case 'completed': return { bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2, label: 'Completed' };
            case 'cancelled': return { bg: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-700', icon: XCircle, label: 'Cancelled' };
            default: return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700', icon: AlertCircle, label: status };
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Loading Administrative Data</span>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-20 text-center">
                <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900 uppercase">Order Tidak Ditemukan</h2>
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-6 text-blue-600 font-bold flex items-center gap-2 mx-auto hover:underline"
                >
                    <ArrowLeft size={16} /> Kembali ke Admin Console
                </button>
            </div>
        );
    }

    const styles = getStatusStyles(order.status);
    const StatusIcon = styles.icon;

    return (
        <div className="space-y-10 pb-20">
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
                        <ArrowLeft size={14} /> Back to Custom Orders
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Global System
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Logistics Management
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Order Detail <ClipboardList className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Review and manage the logistical requirements for <span className="text-slate-900 font-bold">"{order.events?.title}"</span> initiated by <span className="text-slate-900 font-bold uppercase">{order.creators?.brand_name}</span>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className={`px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm border ${styles.bg} ${styles.border} ${styles.text}`}>
                        <StatusIcon size={18} />
                        <span className="text-sm font-black uppercase tracking-wider">{styles.label}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mr-2">
                        System Priority: Standard
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
                            <Package className="text-blue-600" size={20} /> Kebutuhan Logistik
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-600 transition-all shadow-sm">
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
                            <FileText className="text-blue-600" size={20} /> Spesifikasi Detail
                        </h3>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 min-h-[200px]">
                            <p className="text-sm font-medium text-slate-600 leading-relaxed uppercase tracking-tight whitespace-pre-wrap">
                                {order.description || "Tidak ada spesifikasi tambahan yang diberikan."}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Sidebar Info */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-4 space-y-8"
                >
                    {/* Creator Identity */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Creator Identity</h3>
                        <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0 group-hover:scale-105 transition-transform duration-500">
                                {order.creators?.image_url ? (
                                    <img src={order.creators.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-blue-600 font-black text-2xl">
                                        {order.creators?.brand_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                                    {order.creators?.brand_name}
                                </h4>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Authorized Creator</span>
                                    <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Administrative Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['pending', 'processed', 'completed', 'cancelled'].map((s) => {
                                const sStyles = getStatusStyles(s);
                                const SIcon = sStyles.icon;
                                const isActive = order.status === s;
                                
                                return (
                                    <button
                                        key={s}
                                        onClick={() => updateStatus(s)}
                                        disabled={updating || isActive}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all group ${
                                            isActive 
                                                ? `${sStyles.bg} ${sStyles.border} ${sStyles.text} scale-[0.98]` 
                                                : 'bg-white border-slate-50 text-slate-400 hover:border-blue-600 hover:text-blue-600'
                                        }`}
                                    >
                                        <SIcon size={18} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                                        <span className="text-[9px] font-black uppercase tracking-tight">{sStyles.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] -mr-16 -mt-16 opacity-30 group-hover:opacity-50 transition-opacity" />
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 relative z-10">Data Audit</h3>
                        <div className="space-y-5 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-white/50 uppercase">Submission Ref</span>
                                <span className="text-[10px] font-mono text-white/80">#{order.id.slice(0, 16)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-white/50 uppercase">Timestamp</span>
                                <span className="text-[10px] font-bold text-white/80 uppercase">
                                    {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DevCustomOrderDetail;
