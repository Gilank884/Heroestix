import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
    Plus, 
    Image as ImageIcon, 
    Layout, 
    ArrowLeft,
    Loader2,
    AlertCircle,
    CheckCircle2,
    X,
    Save
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AddBanner() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        link_url: '',
        image_url: '',
        is_active: true,
        sort_order: 0
    });

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
            
            // Get current max sort order to append
            const { data: existing } = await supabase
                .from('banners')
                .select('sort_order')
                .order('sort_order', { ascending: false })
                .limit(1);
            
            const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

            const { error } = await supabase
                .from('banners')
                .insert([{ ...formData, sort_order: nextOrder }]);

            if (error) throw error;
            
            navigate('/banners');
        } catch (err) {
            alert('Error creating banner: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-10 font-['Outfit']">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white shadow-2xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/banners')}
                            className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all text-slate-600"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Banner Creation
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Add New <span className="text-blue-600">Banner</span> <Plus className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Configure new promotional graphics and destination routing for the user homepage.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Form Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 backdrop-blur-md rounded-3xl border border-white shadow-2xl overflow-hidden max-w-4xl mx-auto"
            >
                <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Details */}
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Layout size={14} className="text-blue-500" />
                                    Banner Title
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. Summer Festival 2026"
                                    className="w-full px-7 py-5 bg-slate-50/50 border-2 border-slate-50 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all text-base placeholder:text-slate-300"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                                <p className="text-[10px] text-slate-400 font-medium px-1 italic">Internal reference name for the banner.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <ImageIcon size={14} className="text-blue-500" />
                                    Destination Link
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="/events/example or https://..."
                                    className="w-full px-7 py-5 bg-slate-50/50 border-2 border-slate-50 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all text-base placeholder:text-slate-300"
                                    value={formData.link_url}
                                    onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                                />
                                <p className="text-[10px] text-slate-400 font-medium px-1">Internal routes start with <code className="text-blue-600 bg-blue-50 px-1 rounded">/</code>, external links with <code className="text-blue-600 bg-blue-50 px-1 rounded">https://</code></p>
                            </div>
                        </div>

                        {/* Image Upload Area */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Banner Graphic (18:6 Aspect)</label>
                            <div className="relative aspect-square md:aspect-auto md:h-full min-h-[300px] rounded-2xl bg-slate-50/50 border-4 border-dashed border-slate-100 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-200 transition-colors">
                                {formData.image_url ? (
                                    <>
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                            <label className="cursor-pointer bg-white text-slate-900 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                                                Replace Image
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-10 text-center space-y-4">
                                        <div className="p-6 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 group-hover:scale-110 transition-transform">
                                            {uploading ? <Loader2 className="animate-spin text-blue-600" size={32} /> : <ImageIcon className="text-slate-300" size={32} />}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Upload Banner Asset</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-relaxed">
                                                PNG, JPG or WebP<br/>
                                                Recommended: 1800 x 600 px
                                            </p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
                        <div className="flex items-center gap-4 bg-blue-50/50 px-6 py-3 rounded-2xl border border-blue-100">
                            <AlertCircle size={18} className="text-blue-500" />
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                Banners are set to <span className="underline">Active</span> by default
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button 
                                type="button"
                                onClick={() => navigate('/banners')}
                                className="flex-1 md:flex-none px-8 py-4 bg-white text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all border border-slate-100"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSubmitting || !formData.image_url}
                                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-12 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-100 border border-blue-500"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save Banner
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
