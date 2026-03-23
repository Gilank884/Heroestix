import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Upload, Image as ImageIcon, Save, CheckCircle2, Tag, FileText, Info } from 'lucide-react';
import { CATEGORIES } from '../../../constants/categories';
import Toast from '../../../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const GeneralInfoManagement = ({ eventId, eventData: initialData, onUpdate }) => {
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        sub_category: '',
        poster_url: ''
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [newBannerFile, setNewBannerFile] = useState(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                category: initialData.category || '',
                sub_category: initialData.sub_category || '',
                poster_url: initialData.poster_url || ''
            });
            setPreviewUrl(initialData.poster_url);
        }
    }, [initialData]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File terlalu besar. Maksimal 5MB.');
                return;
            }
            setNewBannerFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const uploadBanner = async () => {
        if (!newBannerFile) return formData.poster_url;

        setUploading(true);
        try {
            const fileExt = newBannerFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `events/${eventId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('banners')
                .upload(filePath, newBannerFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('banners')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading banner:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const finalPosterUrl = await uploadBanner();

            const { error } = await supabase
                .from('events')
                .update({
                    ...formData,
                    poster_url: finalPosterUrl
                })
                .eq('id', eventId);

            if (error) throw error;

            setShowToast(true);
            if (onUpdate) onUpdate();
            setNewBannerFile(null); // Reset file selection after save
        } catch (error) {
            alert('Gagal menyimpan perubahan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const activeCategory = CATEGORIES.find(c => c.id === formData.category);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
        >
            <Toast
                show={showToast}
                message="Informasi umum event berhasil diperbarui!"
                onClose={() => setShowToast(false)}
            />

            <div className="space-y-12">
                {/* Banner Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visual Event • Banner Utama</label>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic flex items-center gap-1.5">
                            <Info size={10} /> Rasio 16:9
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="relative group/banner">
                            <input
                                type="file"
                                opacity="0"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                                id="banner-upload"
                            />
                            <div className={`
                                relative aspect-[16/9] w-full rounded-[2rem] border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-3 shadow-sm
                                ${previewUrl ? 'border-transparent' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-blue-200'}
                            `}>
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-110" />
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/banner:opacity-100 transition-all flex items-center justify-center">
                                            <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-white/20 shadow-2xl">
                                                <Upload size={14} /> Ganti Visual
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-50 group-hover/banner:scale-110 transition-transform">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Pilih Banner</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Seret & Lepas Gambar</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/50 border border-slate-100 rounded-[2rem] p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <ImageIcon className="text-blue-600" size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Kualitas Visual</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rekomendasi 1440 × 810px</p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    Gunakan gambar berkualitas tinggi untuk menarik minat pembeli. Visual yang estetik meningkatkan kepercayaan calon pengunjung.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="px-3 py-1 bg-slate-100 text-[9px] font-black text-slate-600 uppercase tracking-widest rounded-lg">MAX 5MB</span>
                                    <span className="px-3 py-1 bg-slate-100 text-[9px] font-black text-slate-600 uppercase tracking-widest rounded-lg">JPG, PNG, WEBP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Fields Section */}
                <div className="space-y-10 pt-4 border-t border-slate-100/50">
                    {/* Nama Event */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Event Identity • Nama Event</label>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-focus-within:text-blue-600 group-focus-within:border-blue-100 transition-colors">
                                <FileText size={16} />
                            </div>
                            <input
                                type="text"
                                maxLength={100}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl pl-20 pr-8 py-5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 transition-all text-base"
                                placeholder="Masukkan nama event Anda..."
                            />
                        </div>
                    </div>

                    {/* Category Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Kategori Utama</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-focus-within:text-blue-600 group-focus-within:border-blue-100 transition-colors">
                                    <Tag size={16} />
                                </div>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value, sub_category: '' })}
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-20 pr-12 py-5 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 appearance-none text-xs uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    <option value="">Pilih Kategori</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Upload size={14} className="rotate-180" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Sub Kategori</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-focus-within:text-blue-600 group-focus-within:border-blue-100 transition-colors">
                                    <Tag size={16} />
                                </div>
                                <select
                                    value={formData.sub_category}
                                    onChange={e => setFormData({ ...formData, sub_category: e.target.value })}
                                    disabled={!formData.category}
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-20 pr-12 py-5 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 appearance-none disabled:opacity-50 text-xs uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    <option value="">Pilih Sub Kategori</option>
                                    {activeCategory?.subcategories.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Upload size={14} className="rotate-180" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Rincian Narasi • Deskripsi</label>
                        <div className="relative">
                            <textarea
                                rows={8}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-[2.5rem] px-8 py-8 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 transition-all resize-none leading-relaxed text-[15px] shadow-inner"
                                placeholder="Tuliskan deskripsi lengkap event Anda di sini..."
                            />
                            <div className="absolute bottom-6 right-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                {formData.description.length} / 2000
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 group">
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading}
                        className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 relative overflow-hidden"
                    >
                        {saving || uploading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-white animate-glow group-hover:text-blue-600 transition-colors">
                                    <Save size={14} />
                                </div>
                                <span className="relative z-10">Simpan Detail Perubahan</span>
                            </div>
                        )}
                    </button>
                    <p className="text-center mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                        <CheckCircle2 size={12} className="text-blue-600" /> Auto-sync enabled for secure database update
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default GeneralInfoManagement;
