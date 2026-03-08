import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
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
    Camera,
    MapPin,
    AlertCircle,
    ChevronRight,
    ShieldCheck,
    Share2,
    ShieldAlert
} from 'lucide-react';
import VerificationPending from '../components/VerificationPending';

// Custom X (Twitter) icon
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
        image_url: '',
        verified: false
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
                    image_url: data.image_url || '',
                    verified: data.verified || false
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
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-medium text-xs uppercase tracking-widest animate-pulse">Memuat Identitas...</p>
            </div>
        );
    }

    if (!form.verified) return <VerificationPending />;

    const completionPercentage = [
        form.brand_name,
        form.description,
        form.address,
        form.bank_name,
        form.bank_account,
        form.instagram_url || form.tiktok_url || form.x_url || form.facebook_url,
        photoPreview
    ].filter(Boolean).length / 7 * 100;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-6 md:p-12 shadow-xl shadow-slate-200/40">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-50" />

                <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-12">
                    <div className="relative group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                            id="hero-photo-upload"
                        />
                        <label
                            htmlFor="hero-photo-upload"
                            className="block relative w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-white shadow-2xl shadow-blue-200/50 overflow-hidden cursor-pointer group"
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Upload size={24} />
                                    <span className="text-[10px] font-medium uppercase tracking-widest">Logo</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Camera size={24} />
                            </div>
                        </label>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest ${form.verified ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {form.verified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                            {form.verified ? 'Verified Creator Account' : 'Account Under Review'}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-medium text-slate-900 tracking-tight">
                                {form.brand_name || "Halo, Creator!"}
                            </h1>
                        </div>

                        <div className="w-full md:w-80 space-y-2">
                            <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest text-slate-400">
                                <span>Profile Completion</span>
                                <span>{Math.round(completionPercentage)}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionPercentage}%` }}
                                    className="h-full bg-blue-600 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 border shadow-lg ${status.type === 'success'
                            ? 'bg-green-50 text-green-700 border-green-100 shadow-green-200/20'
                            : 'bg-red-50 text-red-700 border-red-100 shadow-red-200/20'
                            }`}
                    >
                        {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="text-sm font-medium">{status.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* Brand Information */}
                    <Section
                        title="Detail Brand & Bisnis"
                        description="Informasi utama yang akan ditampilkan di halaman publik Anda."
                        icon={<Building2 className="text-blue-600" size={20} />}
                    >
                        <div className="grid grid-cols-1 gap-6 p-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 ml-1">Nama Brand / EO</label>
                                <Input
                                    name="brand_name"
                                    value={form.brand_name}
                                    onChange={handleChange}
                                    placeholder="Contoh: Heroic Events"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 ml-1">Deskripsi Singkat</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ceritakan tentang visi dan keunikan brand Anda..."
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none placeholder:text-slate-300 placeholder:font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                    <MapPin size={12} className="text-red-500" /> Alamat Warehouse / Kantor
                                </label>
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    required
                                    placeholder="Masukkan alamat lengkap operasional Anda..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none placeholder:text-slate-300 placeholder:font-medium"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Bank Information */}
                    <Section
                        title="Informasi Rekening"
                        description="Detail rekening untuk proses pencairan dana hasil penjualan tiket."
                        icon={<CreditCard className="text-blue-600" size={20} />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 ml-1">Nama Bank</label>
                                <Input
                                    name="bank_name"
                                    value={form.bank_name}
                                    onChange={handleChange}
                                    placeholder="Contoh: Bank Central Asia (BCA)"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 ml-1">Nomor Rekening</label>
                                <Input
                                    name="bank_account"
                                    value={form.bank_account}
                                    onChange={handleChange}
                                    placeholder="Contoh: 1234567890"
                                    required
                                />
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-500 ml-1 italic">
                                    <ShieldCheck size={10} /> Data ini dienkripsi & aman.
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

                <div className="space-y-8">
                    {/* Social Media */}
                    <Section
                        title="Media Sosial"
                        description="Hubungkan audience Anda dengan sosial media."
                        icon={<Share2 className="text-blue-600" size={20} />}
                    >
                        <div className="space-y-5 p-6 md:p-6">
                            <SocialInput
                                icon={<Instagram size={18} className="text-pink-500" />}
                                name="instagram_url"
                                value={form.instagram_url}
                                onChange={handleChange}
                                placeholder="instagram.com/username"
                            />
                            <SocialInput
                                icon={<TikTokIcon size={18} className="text-slate-900" />}
                                name="tiktok_url"
                                value={form.tiktok_url}
                                onChange={handleChange}
                                placeholder="tiktok.com/@username"
                            />
                            <SocialInput
                                icon={<XIcon size={16} />}
                                name="x_url"
                                value={form.x_url}
                                onChange={handleChange}
                                placeholder="x.com/username"
                            />
                            <SocialInput
                                icon={<Facebook size={18} className="text-blue-600" />}
                                name="facebook_url"
                                value={form.facebook_url}
                                onChange={handleChange}
                                placeholder="facebook.com/username"
                            />
                        </div>
                    </Section>

                    {/* Save Action */}
                    <div className="bg-slate-900 rounded-2xl p-6 space-y-4 shadow-xl shadow-slate-200">
                        <div className="space-y-2">
                            <h3 className="text-white font-medium text-lg">Siap Meluncur?</h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Pastikan semua data sudah benar sebelum menyimpan. Data brand akan tampil di tiket pengunjung.
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-500/20 group"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                    <span>Simpan Perubahan</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="p-6 bg-blue-50/30 rounded-[1.5rem] border border-blue-100 flex gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                            <Globe className="text-blue-600" size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Global Link</p>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">Profil Anda akan dapat diakses oleh ribuan calon pembeli tiket di platform Heroestix.</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

// Subcomponents
const Section = ({ title, description, icon, children }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg font-medium text-slate-900 tracking-tight">{title}</h2>
                    <p className="text-xs text-slate-400 font-medium">{description}</p>
                </div>
            </div>
            <ChevronRight size={18} className="text-slate-200" />
        </div>
        {children}
    </div>
);

const Input = (props) => (
    <input
        {...props}
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-300 placeholder:font-medium"
    />
);

const SocialInput = ({ icon, ...props }) => (
    <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600">
            {icon}
        </div>
        <input
            {...props}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-5 py-4 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-sm placeholder:text-slate-300 placeholder:font-medium"
        />
    </div>
);
