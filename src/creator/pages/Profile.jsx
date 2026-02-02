import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    User,
    Link as LinkIcon,
    Instagram,
    Twitter,
    Facebook,
    Building2,
    CreditCard,
    Save,
    CheckCircle2,
    Globe,
    Upload,
    Camera
} from 'lucide-react';

// Custom X (Twitter) icon since Lucide's Twitter might be old or look different
const XIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
);

const TikTokIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export default function Profile() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
    const [form, setForm] = useState({
        brand_name: '',
        bank_name: '',
        bank_account: '',
        instagram_url: '',
        x_url: '',
        tiktok_url: '',
        facebook_url: '',
        description: '',
        address: '',
        image_url: ''
    });

    const [newPhotoFile, setNewPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user?.id]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('creators')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data) {
                setForm({
                    brand_name: data.brand_name || '',
                    bank_name: data.bank_name || '',
                    bank_account: data.bank_account || '',
                    instagram_url: data.instagram_url || '',
                    x_url: data.x_url || '',
                    tiktok_url: data.tiktok_url || '',
                    facebook_url: data.facebook_url || '',
                    description: data.description || '',
                    address: data.address || '',
                    image_url: data.image_url || ''
                });
                setPhotoPreview(data.image_url || null);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        try {
            let photoUrl = form.image_url;

            if (newPhotoFile) {
                const fileExt = newPhotoFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('creator-assets')
                    .upload(filePath, newPhotoFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('creator-assets')
                    .getPublicUrl(filePath);

                photoUrl = publicUrl;
            }

            const { error } = await supabase
                .from('creators')
                .update({
                    brand_name: form.brand_name,
                    bank_name: form.bank_name,
                    bank_account: form.bank_account,
                    instagram_url: form.instagram_url,
                    x_url: form.x_url,
                    tiktok_url: form.tiktok_url,
                    facebook_url: form.facebook_url,
                    description: form.description,
                    address: form.address,
                    image_url: photoUrl
                })
                .eq('id', user.id);

            if (error) throw error;

            setStatus({ type: 'success', message: 'Profil berhasil diperbarui!' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: 'Gagal memperbarui profil: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Profil Creator</h1>
                    <p className="text-sm text-slate-500 font-medium">Lengkapi identitas brand dan media sosial Anda.</p>
                </div>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-bold">{status.message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Brand & Bank Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Building2 size={18} className="text-blue-600" />
                            Informasi Brand & Rekening
                        </h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Foto Profil / Logo (4x4)</label>
                                <div className="relative group/photo">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        id="photo-upload"
                                    />
                                    <label
                                        htmlFor="photo-upload"
                                        className={`
                                            relative aspect-square w-40 rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2
                                            ${photoPreview ? 'border-transparent' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-600'}
                                        `}
                                    >
                                        {photoPreview ? (
                                            <>
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-all flex items-center justify-center text-white">
                                                    <Camera size={24} />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-100">
                                                    <Upload size={20} />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ganti Foto</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6 w-full">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nama Brand / EO</label>
                                    <input
                                        name="brand_name"
                                        value={form.brand_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Contoh: Heroic Events"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Deskripsi Singkat</label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ceritakan tentang brand atau EO Anda..."
                                        rows={4}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Alamat Lengkap</label>
                                    <textarea
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        required
                                        placeholder="Masukkan alamat lengkap brand atau EO Anda..."
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Bank</label>
                            <input
                                name="bank_name"
                                value={form.bank_name}
                                onChange={handleChange}
                                required
                                placeholder="Contoh: BCA"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">No. Rekening</label>
                            <input
                                name="bank_account"
                                value={form.bank_account}
                                onChange={handleChange}
                                required
                                placeholder="Untuk pencairan dana"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Media Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Globe size={18} className="text-blue-600" />
                            Media Sosial
                        </h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                <Instagram size={14} className="text-pink-600" />
                                Instagram URL
                            </label>
                            <input
                                name="instagram_url"
                                value={form.instagram_url}
                                onChange={handleChange}
                                placeholder="https://instagram.com/username"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                <XIcon size={14} />
                                X (Twitter) URL
                            </label>
                            <input
                                name="x_url"
                                value={form.x_url}
                                onChange={handleChange}
                                placeholder="https://x.com/username"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                <TikTokIcon size={14} className="text-slate-900" />
                                TikTok URL
                            </label>
                            <input
                                name="tiktok_url"
                                value={form.tiktok_url}
                                onChange={handleChange}
                                placeholder="https://tiktok.com/@username"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                <Facebook size={14} className="text-blue-600" />
                                Facebook URL
                            </label>
                            <input
                                name="facebook_url"
                                value={form.facebook_url}
                                onChange={handleChange}
                                placeholder="https://facebook.com/username"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-200 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </div>
    );
}
