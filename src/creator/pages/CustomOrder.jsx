import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ClipboardList, 
    Plus, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Package,
    Users,
    ChevronRight,
    Search,
    ArrowLeft
} from 'lucide-react';

const CustomOrder = () => {
    const { user } = useAuthStore();
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    
    const [eventData, setEventData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form State
    const [selectedItems, setSelectedItems] = useState([]);
    const [description, setDescription] = useState('');

    const requestItems = [
        { id: 'Gelang tiket', label: 'Gelang Tiket', icon: Package },
        { id: 'Jersey', label: 'Jersey', icon: Package },
        { id: 'Medali', label: 'Medali', icon: Package },
        { id: 'BIB Number', label: 'BIB Number', icon: Package },
        { id: 'Tootbag', label: 'Tote Bag', icon: Package },
        { id: 'Man Power Ticketing', label: 'Man Power Ticketing', icon: Users },
    ];

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user?.id, eventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch event data if eventId is present
            if (eventId) {
                const { data: ev } = await supabase
                    .from('events')
                    .select('title')
                    .eq('id', eventId)
                    .single();
                setEventData(ev);
            }

            // Fetch existing requests for this specific event
            let query = supabase
                .from('custom_orders')
                .select(`
                    *,
                    events (title)
                `)
                .eq('creator_id', user.id);
            
            if (eventId) {
                query = query.eq('event_id', eventId);
            }

            const { data: orderData } = await query.order('created_at', { ascending: false });

            setOrders(orderData || []);
        } catch (error) {
            console.error('Error fetching data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (itemId) => {
        setSelectedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId) 
                : [...prev, itemId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            alert('Minimal satu item yang diperlukan');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('custom_orders')
                .insert({
                    creator_id: user.id,
                    event_id: eventId,
                    items: selectedItems,
                    description: description,
                });

            if (error) throw error;

            // Reset Form
            setSelectedItems([]);
            setDescription('');
            
            // Refresh List
            fetchData();
            alert('Order berhasil dikirim!');
        } catch (error) {
            console.error('Error submitting order:', error.message);
            alert('Gagal mengirim order: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-500';
            case 'processed': return 'bg-blue-500';
            case 'completed': return 'bg-emerald-500';
            case 'cancelled': return 'bg-rose-500';
            default: return 'bg-slate-500';
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Synchronizing Orders</span>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-8"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-[#1a36c7] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Event Logistics
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Request</span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                            Custom Order <ClipboardList className="text-[#1a36c7]" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed italic uppercase tracking-tight">
                            Event: <span className="text-slate-900 font-black tracking-normal not-italic">{eventData?.title || 'Unknown Event'}</span>
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Request Form */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-5 space-y-6"
                >
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 h-full">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kebutuhan Perlengkapan</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {requestItems.map((item) => {
                                        const isSelected = selectedItems.includes(item.id);
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleItem(item.id)}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                                                    isSelected 
                                                        ? 'bg-blue-50 border-[#1a36c7] text-[#1a36c7] shadow-sm' 
                                                        : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#1a36c7] text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                                                {isSelected && <CheckCircle2 size={16} className="ml-auto" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Spesifikasi Detail</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Misal: Ukuran jersey, jumlah gelang, atau spesifikasi lainnya..."
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-[#1a36c7] focus:bg-white rounded-2xl p-4 text-[11px] font-black uppercase outline-none transition-all h-40 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#1a36c7] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : <Plus size={14} />}
                                Ajukan Pesanan
                            </button>
                        </form>
                    </div>
                </motion.div>

                {/* Request History */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-7 space-y-6"
                >
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 min-h-[600px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                Riwayat Pesanan <Clock size={16} className="text-slate-400" />
                            </h3>
                        </div>

                        {orders.length > 0 ? (
                            <div className="space-y-4">
                                {orders.map((req) => (
                                    <div key={req.id} className="group bg-slate-50 border border-slate-100 rounded-3xl p-6 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-slate-200 hover:border-l-[#1a36c7]">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-full text-white shadow-lg ${getStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {req.items.map((item, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-white border border-slate-100 text-[9px] font-bold text-slate-500 rounded-lg uppercase tracking-tight">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                                {req.description && (
                                                    <p className="text-[10px] text-slate-400 font-bold italic mt-2 uppercase tracking-tight">
                                                        "{req.description}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden md:block">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">REF ID</p>
                                                <p className="text-[10px] font-bold text-slate-400">#{req.id.slice(0, 8)}</p>
                                            </div>
                                            <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-300 group-hover:text-[#1a36c7] transition-colors">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center border border-slate-100">
                                    <ClipboardList size={32} strokeWidth={1} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Belum Ada Pesanan</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Pesanan Anda akan muncul di sini.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CustomOrder;
