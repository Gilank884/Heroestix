import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ClipboardList, 
    Search, 
    Filter, 
    Calendar, 
    User, 
    Package, 
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    MoreVertical,
    ArrowUpDown,
    X,
    FileText
} from 'lucide-react';

const CustomOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('custom_orders')
                .select(`
                    *,
                    creators (brand_name, image_url),
                    events (title)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('custom_orders')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            
            setOrders(prev => prev.map(req => 
                req.id === id ? { ...req, status: newStatus } : req
            ));
        } catch (error) {
            console.error('Error updating status:', error.message);
            alert('Failed to update status: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredOrders = orders.filter(req => {
        const matchesSearch = 
            req.creators?.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.events?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending' };
            case 'processed': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: Package, label: 'Processed' };
            case 'completed': return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, label: 'Completed' };
            case 'cancelled': return { bg: 'bg-rose-100', text: 'text-rose-700', icon: XCircle, label: 'Cancelled' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-700', icon: AlertCircle, label: status };
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Orders...</span>
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
                        <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Global System
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logistics Management</span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Custom Orders <ClipboardList className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Monitor and manage all logistics, equipment, and manpower requests from creators for every event globally.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Filters Bar */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center gap-5">
                <div className="relative flex-1 group w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by creator, event, or item..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={16} className="text-slate-400 ml-2" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl py-3 px-4 text-xs font-black uppercase tracking-widest outline-none transition-all cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processed">Processed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/30 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Creator & Event</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordered Items</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence>
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((req) => {
                                        const styles = getStatusStyles(req.status);
                                        const StatusIcon = styles.icon;
                                        return (
                                            <motion.tr 
                                                key={req.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => {
                                                    console.log("Dev: Navigating to", req.id);
                                                    navigate(`/custom-orders/${req.id}`);
                                                }}
                                                className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                            >
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                                            {req.creators?.image_url ? (
                                                                <img src={req.creators.image_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase">
                                                                    {req.creators?.brand_name?.charAt(0) || 'C'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-black text-slate-900 uppercase truncate">
                                                                {req.creators?.brand_name || 'N/A'}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase truncate flex items-center gap-1.5 mt-1">
                                                                <Calendar size={10} /> {req.events?.title || 'Unknown Event'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {req.items.map((item, idx) => (
                                                            <span key={idx} className="px-2 py-1 bg-white border border-slate-200 text-[9px] font-black text-slate-500 rounded-lg uppercase tracking-tight">
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {req.description && (
                                                        <p className="text-[10px] text-slate-400 font-medium italic mt-2 line-clamp-1">
                                                            "{req.description}"
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm ${styles.bg} ${styles.text} border border-white/50 backdrop-blur-sm`}>
                                                            <StatusIcon size={12} />
                                                            <span className="text-[9px] font-black uppercase tracking-wider">{styles.label}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-900">
                                                            {new Date(req.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold">
                                                            {new Date(req.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td 
                                                    className="px-6 py-6"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex justify-end gap-2">
                                                        {updatingId === req.id ? (
                                                            <div className="w-8 h-8 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/custom-orders/${req.id}`);
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                                                                >
                                                                    Detail <ChevronRight size={14} />
                                                                </button>
                                                                <div className="flex items-center gap-1">
                                                                    {['pending', 'processed', 'completed', 'cancelled'].filter(s => s !== req.status).map(s => (
                                                                        <button
                                                                            key={s}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                updateStatus(req.id, s);
                                                                            }}
                                                                            title={`Mark as ${s}`}
                                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${getStatusStyles(s).bg} ${getStatusStyles(s).text}`}
                                                                        >
                                                                            {React.createElement(getStatusStyles(s).icon, { size: 14 })}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center border border-slate-100">
                                                    <ClipboardList size={32} strokeWidth={1} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">No Orders Found</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Try adjusting your filters or search terms.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomOrders;
