import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Upload, Image as ImageIcon, Save, CheckCircle2, Tag, FileText } from 'lucide-react';
import { CATEGORIES } from '../../../constants/categories';

const GeneralInfoManagement = ({ eventId, eventData: initialData, onUpdate }) => {
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
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
            // Simplify path to match CreateEvent convention but specifically for this event
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

            setShowSuccess(true);
            if (onUpdate) onUpdate();
            setTimeout(() => setShowSuccess(false), 3000);
            setNewBannerFile(null); // Reset file selection after save
        } catch (error) {
            alert('Gagal menyimpan perubahan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const activeCategory = CATEGORIES.find(c => c.id === formData.category);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900">Informasi Umum</h3>
                    {showSuccess && (
                        <div className="flex items-center gap-2 text-green-600 text-xs font-bold animate-in fade-in slide-in-from-right-2">
                            <CheckCircle2 size={14} />
                            Tersimpan!
                        </div>
                    )}
                </div>

                <div className="p-8 space-y-10">
                    {/* Banner Section */}
                    <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Banner Utama</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div className="relative group/banner">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="banner-upload"
                                />
                                <label
                                    htmlFor="banner-upload"
                                    className={`
                                        relative aspect-video w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2
                                        ${previewUrl ? 'border-transparent' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-[#1a36c7]'}
                                    `}
                                >
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/banner:opacity-100 transition-all flex items-center justify-center">
                                                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 border border-white/20">
                                                    <Upload size={14} /> Ganti Visual
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-50">
                                                <ImageIcon size={24} />
                                            </div>
                                            <p className="text-xs font-bold text-[#1a36c7] uppercase tracking-widest">Pilih Banner Utama</p>
                                        </>
                                    )}
                                </label>
                            </div>
                            <div className="space-y-4 py-2">
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                                    <ImageIcon className="text-[#1a36c7] shrink-0" size={16} />
                                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                        Gunakan gambar berkualitas tinggi untuk menarik minat pembeli. Rekomendasi 1440x810px.
                                    </p>
                                </div>
                                <ul className="text-[10px] text-slate-400 space-y-1.5 font-bold uppercase tracking-wider list-disc pl-4">
                                    <li>Maksimal 5MB</li>
                                    <li>Format JPG, JPEG, PNG</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        {/* Title */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nama Event</label>
                            <input
                                type="text"
                                maxLength={100}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all text-[15px]"
                                placeholder="Nama Event"
                            />
                        </div>

                        {/* Category Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Kategori</label>
                                <div className="relative">
                                    <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value, sub_category: '' })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-12 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 appearance-none"
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Sub Kategori</label>
                                <div className="relative">
                                    <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <select
                                        value={formData.sub_category}
                                        onChange={e => setFormData({ ...formData, sub_category: e.target.value })}
                                        disabled={!formData.category}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-12 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Pilih Sub Kategori</option>
                                        {activeCategory?.subcategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Deskripsi Event</label>
                            <div className="relative">
                                <FileText className="absolute left-6 top-6 text-slate-300" size={18} />
                                <textarea
                                    rows={6}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all resize-none leading-relaxed text-sm"
                                    placeholder="Jelaskan detail event Anda di sini..."
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || uploading}
                        className="w-full bg-[#1a36c7] text-white py-4 rounded-2xl font-bold hover:bg-[#152ba3] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {saving || uploading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {saving || uploading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneralInfoManagement;
