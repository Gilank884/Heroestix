import React, { useState, useEffect, useMemo } from 'react';
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
    ShieldAlert,
    Activity,
    Trophy,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import VerificationPending from '../components/VerificationPending';

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
    const [status, setStatus] = useState(null);
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

            setStatus({ type: 'success', message: 'Profil Anda telah berhasil diperbarui!' });
            setTimeout(() => setStatus(null), 4000);
        } catch (error) {
            setStatus({ type: 'error', message: 'Terjadi kesalahan sistem: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    const completionPercentage = useMemo(() => {
        const fields = [
            form.brand_name,
            form.description,
            form.address,
            form.bank_name,
            form.bank_account,
            form.instagram_url || form.tiktok_url || form.x_url || form.facebook_url,
            photoPreview
        ];
        return (fields.filter(Boolean).length / fields.length) * 100;
    }, [form, photoPreview]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                >
                    <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity size={24} className="text-blue-600 animate-pulse" />
                    </div>
                </motion.div>
                <div className="text-center space-y-1">
                    <p className="text-slate-900 font-black text-xs uppercase tracking-[0.3em]">Identity System</p>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Synchronizing secure credentials...</p>
                </div>
            </div>
        );
    }

    if (!form.verified) return <VerificationPending />;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto space-y-6 pb-20"
        >
            {/* Compact Header Section - Enhanced Shadows */}
            <motion.div variants={itemVariants} className="relative group">
                <div className="relative bg-white border border-slate-100/60 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] transition-all duration-500 overflow-hidden">
                    {/* Subtle Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        {/* Compact Avatar Section */}
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                                id="profile-photo-upload"
                            />
                            <label
                                htmlFor="profile-photo-upload"
                                className="block relative w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100/50 p-1 shadow-md group-hover:shadow-xl group-hover:shadow-blue-500/10 overflow-hidden cursor-pointer group/label transition-all duration-500"
                            >
                                <div className="w-full h-full rounded-xl overflow-hidden bg-white relative">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover/label:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <Camera size={20} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/label:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                        <Upload size={14} />
                                        <span className="text-[8px] font-bold uppercase tracking-widest mt-1 text-white/90">Update</span>
                                    </div>
                                </div>
                            </label>
                            {form.verified && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-lg shadow-[0_4px_12px_rgba(37,99,235,0.4)] border-2 border-white flex items-center justify-center text-white">
                                    <ShieldCheck size={12} />
                                </div>
                            )}
                        </div>

                        {/* Title & Simplified Progress */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${form.verified ? 'bg-blue-50 text-blue-600 border border-blue-100/50' : 'bg-amber-50 text-amber-600 border border-amber-100/50'}`}>
                                        {form.verified ? 'Verified Creator' : 'Verification Pending'}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none uppercase">
                                    {form.brand_name || "New Profile"}
                                </h1>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1 opacity-70">{form.address || 'Address not set'}</p>
                            </div>

                            {/* Minimalist Progress Bar */}
                            <div className="mt-4 max-w-xs mx-auto md:mx-0 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                                <div className="flex justify-between items-center mb-1.5 px-0.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Profile Status</span>
                                    <span className="text-[9px] font-bold text-blue-600">{Math.round(completionPercentage)}%</span>
                                </div>
                                <div className="h-1 bg-white rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completionPercentage}%` }}
                                        transition={{ duration: 0.8 }}
                                        className="h-full bg-blue-600 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Notification Toast - Compact */}
            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`fixed bottom-8 right-8 z-[100] p-4 rounded-xl flex items-center gap-3 border shadow-2xl backdrop-blur-md ${status.type === 'success' ? 'bg-white text-slate-900 border-slate-100' : 'bg-red-50 text-red-800 border-red-100'}`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.type === 'success' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        </div>
                        <p className="text-xs font-bold leading-tight">{status.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* Brand Meta Section - Optimized */}
                    <Section
                        title="Identity"
                        description="Configure how your brand appears across the ecosystem."
                        icon={<Building2 size={18} />}
                    >
                        <div className="grid grid-cols-1 gap-5 p-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Brand Name</label>
                                <Input
                                    name="brand_name"
                                    value={form.brand_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Heroic Productions"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Narrative / Description</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    required
                                    placeholder="Articulate your mission..."
                                    rows={3}
                                    className="w-full bg-slate-50/30 border border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all resize-none placeholder:text-slate-300 text-xs leading-relaxed shadow-sm hover:shadow-md"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Headquarters Address</label>
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    required
                                    placeholder="Physical address..."
                                    rows={2}
                                    className="w-full bg-slate-50/30 border border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all resize-none placeholder:text-slate-300 text-xs shadow-sm hover:shadow-md"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Financial Infrastructure - Optimized */}
                    <Section
                        title="Finances"
                        description="Verified settlement account for revenue distribution."
                        icon={<CreditCard size={18} />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                                <Input
                                    name="bank_name"
                                    value={form.bank_name}
                                    onChange={handleChange}
                                    placeholder="e.g. BCA"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                                <Input
                                    name="bank_account"
                                    value={form.bank_account}
                                    onChange={handleChange}
                                    placeholder="000000000"
                                    required
                                />
                            </div>
                        </div>
                    </Section>
                </div>

                <div className="space-y-6">
                    {/* Social Ecosystem - Compact */}
                    <Section
                        title="Socials"
                        description="Connect digital footprints."
                        icon={<Share2 size={16} />}
                    >
                        <div className="space-y-3 p-6">
                            <SocialInput
                                icon={<Instagram size={16} className="text-rose-500" />}
                                name="instagram_url"
                                value={form.instagram_url}
                                onChange={handleChange}
                                placeholder="instagram.com/handle"
                            />
                            <SocialInput
                                icon={<TikTokIcon size={16} className="text-slate-900" />}
                                name="tiktok_url"
                                value={form.tiktok_url}
                                onChange={handleChange}
                                placeholder="tiktok.com/@handle"
                            />
                            <SocialInput
                                icon={<XIcon size={14} />}
                                name="x_url"
                                value={form.x_url}
                                onChange={handleChange}
                                placeholder="x.com/handle"
                            />
                        </div>
                    </Section>

                    {/* Action Hub - Neat */}
                    <div className="bg-slate-900 rounded-xl p-6 shadow-xl shadow-slate-900/20 group/save hover:shadow-blue-600/20 transition-all duration-500 relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover/save:scale-150 transition-transform duration-700" />
                        
                        <div className="space-y-1 relative z-10">
                            <h3 className="text-white font-bold text-sm tracking-tight uppercase">Update Profile</h3>
                            <p className="text-slate-400 text-[9px] font-bold leading-tight uppercase tracking-widest opacity-80">
                                Push changes globally to events.
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="mt-4 w-full relative z-10 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={14} />
                                    <span>Sync Profile</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Branding Tip - Compact */}
                    <div className="p-5 bg-white border border-slate-100/50 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col gap-3 group hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/50 shadow-inner group-hover:rotate-6 transition-transform">
                                <Sparkles className="text-blue-600" size={14} />
                            </div>
                            <p className="text-[10px] font-black text-slate-900 uppercase">Premium Visibility</p>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest opacity-80">
                            Consistent branding increases conversion by up to <span className="text-blue-600 font-bold">24%</span>.
                        </p>
                    </div>
                </div>
            </form>
        </motion.div>
    );
}

// Ultra-Compact Subcomponents - Improved Shadows
const Section = ({ title, description, icon, children }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 }
        }}
        className="bg-white border border-slate-100/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.08)] transition-all duration-500 overflow-hidden relative group/section"
    >
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover/section:bg-blue-50 group-hover/section:text-blue-600 transition-all shadow-inner border border-slate-100/50">
                    {React.cloneElement(icon, { size: 18 })}
                </div>
                <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase leading-none">{title}</h2>
                    <p className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-widest leading-none opacity-80">{description}</p>
                </div>
            </div>
            <div className="text-slate-200 group-hover/section:text-blue-500 group-hover/section:translate-x-1 transition-all">
                <ChevronRight size={14} />
            </div>
        </div>
        <div className="relative z-10 bg-white">
            {children}
        </div>
    </motion.div>
);

const Input = (props) => (
    <input
        {...props}
        className="w-full bg-slate-50/20 border border-slate-100 rounded-lg px-4 py-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-300 text-xs shadow-sm hover:shadow-md"
    />
);

const SocialInput = ({ icon, ...props }) => (
    <div className="relative group/s-input">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-all group-focus-within/s-input:text-blue-600 group-focus-within/s-input:scale-110">
            {icon}
        </div>
        <input
            {...props}
            className="w-full bg-slate-50/20 border border-slate-100 rounded-lg pl-10 pr-4 py-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-xs placeholder:text-slate-200 shadow-sm hover:shadow-md"
        />
    </div>
);
