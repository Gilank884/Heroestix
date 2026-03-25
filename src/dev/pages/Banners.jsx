import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
    Plus, 
    Image as ImageIcon, 
    Layout, 
    Trash2, 
    ExternalLink, 
    Search,
    Eye,
    EyeOff,
    Loader2,
    Calendar,
    Link as LinkIcon,
    AlertCircle,
    CheckCircle2,
    X,
    GripVertical,
    ChevronRight,
    ArrowRight,
    Settings2,
    Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Banners() {
    const navigate = useNavigate();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .order('sort_order', { ascending: true });
            
            if (error) throw error;
            setBanners(data || []);
        } catch (err) {
            console.error('Error fetching banners:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (banner) => {
        try {
            const { error } = await supabase
                .from('banners')
                .update({ is_active: !banner.is_active })
                .eq('id', banner.id);

            if (error) throw error;
            fetchBanners();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const deleteBanner = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;
        try {
            const { error } = await supabase
                .from('banners')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchBanners();
        } catch (err) {
            console.error('Error deleting banner:', err);
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-10 font-['Outfit']">
            {/* Standard Header Wrapped in Glassmorphism Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white shadow-2xl shadow-slate-200/40 flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10"
            >
                <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Marketing Engine
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Promotion Matrix
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Banner <span className="text-blue-600">Settings</span> <Layout className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Manage home page promotional sliders and marketing assets with real-time CMS synchronization and visual audit capabilities.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="hidden md:flex flex-col items-end px-6 border-r border-slate-200">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Banners</span>
                        <span className="text-2xl font-black text-slate-900">{banners.filter(b => b.is_active).length}</span>
                    </div>

                    <button 
                        onClick={() => navigate('/banners/add')}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-100 border border-blue-500 hover:bg-blue-700"
                    >
                        <Plus size={14} />
                        Add New Banner
                    </button>
                </div>
            </motion.div>

            {/* Banner List - Landscape Layout */}
            <div className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="text-blue-600 animate-spin" size={40} />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Banners...</span>
                    </div>
                ) : banners.length === 0 ? (
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center flex flex-col items-center">
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <ImageIcon className="text-slate-300" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase">No Banners Found</h3>
                        <p className="text-slate-400 font-medium mt-2">Start by creating your first promotional banner.</p>
                        <button 
                            onClick={() => navigate('/banners/add')}
                            className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                        >
                            Create First Banner
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {banners.map((banner, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={banner.id}
                                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col md:flex-row md:items-center min-h-[160px]"
                            >
                                {/* Drag Handle (Simulated for UI) */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {/* Image Preview - Fixed Landscape Aspect Ratio (18:6) */}
                                <div 
                                    onClick={() => navigate(`/banners/${banner.id}`)}
                                    className="md:w-[320px] aspect-[18/6] relative overflow-hidden bg-slate-100 cursor-pointer group/img shrink-0 m-4 rounded-xl shadow-md border border-slate-200"
                                >
                                    <img 
                                        src={banner.image_url} 
                                        alt={banner.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 transition-all flex items-center justify-center">
                                        <Edit3 className="text-white drop-shadow-md opacity-0 group-hover/img:opacity-100 transition-all" size={24} />
                                    </div>
                                    {!banner.is_active && (
                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                                            <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/30">
                                                Inactive
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="p-6 md:p-8 flex-1 flex flex-col justify-center min-w-0">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="space-y-3 min-w-0 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    Order {banner.sort_order || 0}
                                                </span>
                                                {banner.is_active ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        <CheckCircle2 size={10} /> Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        <EyeOff size={10} /> Draft
                                                    </span>
                                                )}
                                            </div>
                                            <h3 
                                                onClick={() => navigate(`/banners/${banner.id}`)}
                                                className="text-xl font-black text-slate-900 tracking-tight truncate cursor-pointer hover:text-blue-600 transition-colors inline-block"
                                            >
                                                {banner.title || 'Untitled Banner'}
                                            </h3>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 truncate">
                                                    <LinkIcon size={12} />
                                                    {banner.link_url || 'No destination link'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex items-center bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
                                                <button 
                                                    onClick={() => toggleStatus(banner)}
                                                    className={`p-2 rounded-xl transition-all ${banner.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                    title={banner.is_active ? 'Set to Draft' : 'Set to Active'}
                                                >
                                                    {banner.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                                <div className="w-px h-6 bg-slate-100 mx-1" />
                                                <button 
                                                    onClick={() => deleteBanner(banner.id)}
                                                    className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                                                    title="Delete Banner"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    onClick={() => window.open(banner.link_url.startsWith('http') ? banner.link_url : window.location.origin + banner.link_url, '_blank')}
                                                    className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all border border-slate-100 cursor-pointer"
                                                    title="Live Preview"
                                                >
                                                    <ArrowRight size={18} />
                                                </div>
                                                <button 
                                                    onClick={() => navigate(`/banners/${banner.id}`)}
                                                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 border border-blue-500"
                                                >
                                                    Manage
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
