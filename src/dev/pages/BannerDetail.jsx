import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
    Save, 
    Image as ImageIcon, 
    Layout, 
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Trash2,
    Link as LinkIcon,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BannerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        link_url: '',
        image_url: '',
        is_active: true
    });

    useEffect(() => {
        if (id) fetchBanner();
    }, [id]);

    const fetchBanner = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            if (data) setFormData(data);
        } catch (err) {
            console.error('Error fetching banner:', err);
            navigate('/banners');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('banner-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('banner-assets')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (err) {
            alert('Error uploading image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const { error } = await supabase
                .from('banners')
                .update({
                    title: formData.title,
                    link_url: formData.link_url,
                    image_url: formData.image_url,
                    is_active: formData.is_active
                })
                .eq('id', id);

            if (error) throw error;
            
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            alert('Error updating banner: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteBanner = async () => {
        if (!window.confirm('Hapus banner ini?')) return;
        try {
            const { error } = await supabase
                .from('banners')
                .delete()
                .eq('id', id);

            if (error) throw error;
            navigate('/banners');
        } catch (err) {
            alert('Error deleting banner: ' + err.message);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-transparent p-10 font-['Outfit']">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retreiving...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 font-['Outfit'] flex flex-col items-center">
            {/* Minimal Header */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl flex items-center justify-between mb-6"
            >
                <button 
                    onClick={() => navigate('/banners')}
                    className="flex items-center gap-2 group text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Kembali</span>
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={deleteBanner} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Simpan'}
                    </button>
                </div>
            </motion.div>

            {/* Simple Focused Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-2xl shadow-slate-200/40 overflow-hidden"
            >
                <div className="p-8 md:p-10 space-y-8">
                    {/* Header Text */}
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Detail Banner</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Sesuaikan tampilan & link promosi</p>
                    </div>

                    {/* Image Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={14} className="text-blue-500" />
                                Preview (18:6)
                            </label>
                            <label className="cursor-pointer text-blue-600 text-[9px] font-black uppercase tracking-widest hover:underline">
                                Ganti Gambar
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </div>
                        <div className="relative aspect-[18/6] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-100 overflow-hidden group">
                           <img 
                                src={formData.image_url} 
                                alt="Banner" 
                                className="w-full h-full object-cover"
                            />
                            {uploading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center">
                                    <Loader2 className="animate-spin text-blue-600" size={24} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layout size={14} className="text-blue-500" />
                                Deskripsi
                            </label>
                            <input 
                                type="text"
                                placeholder="Judul atau deskripsi banner..."
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-bold transition-all text-sm"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <LinkIcon size={14} className="text-blue-500" />
                                Link URL
                            </label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    placeholder="/events/example atau https://..."
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 font-bold transition-all text-sm pr-12"
                                    value={formData.link_url}
                                    onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                                />
                                <button 
                                    type="button"
                                    onClick={() => window.open(formData.link_url.startsWith('http') ? formData.link_url : window.location.origin + formData.link_url, '_blank')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-blue-600 transition-colors"
                                >
                                    <ExternalLink size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Notification Toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-10 z-[200] flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl border border-white/10"
                    >
                        <CheckCircle2 size={18} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Detail Disimpan</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
