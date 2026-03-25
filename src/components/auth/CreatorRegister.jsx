import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { generateMOUPDF } from "../../utils/pdfGenerator";
import MOUDocument from "../shared/MOUDocument";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    UserCheck,
    Building2,
    Briefcase,
    Users,
    ShieldCheck,
    CreditCard,
    CheckCircle2,
    ArrowRight,
    Lock,
    Mail,
    Phone,
    User,
    Eye,
    EyeOff,
    Camera,
    Image,
    FileText,
    Download
} from "lucide-react";

const CreatorRegister = () => {
    const [activeTab, setActiveTab] = useState('pemberkasan'); // mou, pemberkasan, dokumentasi
    const [step, setStep] = useState(1); // 1: Legal, 2: Akun (Internal to Pemberkasan)
    const [acceptedMOU, setAcceptedMOU] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

    const handleDownloadPDF = async () => {
        setIsDownloadingPDF(true);
        try {
        await generateMOUPDF({
            ...form,
            // Map local previews to the URL fields expected by the generator
            ktp_pic_url: filePreviews.ktp_pic,
            npwp_pic_url: filePreviews.npwp_pic,
            npwp_company_url: filePreviews.npwp_company,
            akte_notaris_url: filePreviews.akte_notaris,
            nib_url: filePreviews.nib,
            bank_book_pic_url: filePreviews.bank_book_pic
        });
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    const ENTITY_TYPES = [
        { id: "PT Perseorangan", icon: <UserCheck size={20} />, desc: "Untuk usaha mandiri berbadan hukum" },
        { id: "PT Perseroan", icon: <Building2 size={20} />, desc: "Untuk korporasi skala menengah/besar" },
        { id: "CV", icon: <Briefcase size={20} />, desc: "Untuk persekutuan komanditer" },
        { id: "Komunitas", icon: <Users size={20} />, desc: "Untuk kelompok hobi or kemitraan lokal" }
    ];

    // Form State
    const [form, setForm] = useState({
        // Step 1: Legal & Identity
        golongan: "", // PT Perseorangan, PT Perseroan, CV, Komunitas
        director_name: "",
        company_address: "",
        bank_name: "",
        bank_account_number: "",
        bank_account_holder: "",
        pkp_number: "",
        other_data: "", // For Komunitas

        // Step 2: Account & Brand
        brand_name: "", // Nama Creator/EO
        phone: "",
        email: "",
        password: "",
        confirm_password: "",
        address: "", // Brand address (can be same as company)
        description: "",
        social_instagram: "",
        social_tiktok: "",
        social_x: "",
        social_facebook: "",
        photoUrl: "",
        termsAgreed: false
    });

    // File States for Step 1
    const [files, setFiles] = useState({
        ktp_pic: null,
        npwp_pic: null,
        npwp_company: null,
        akte_notaris: null,
        sk_kumham: null,
        surat_kuasa: null,
        nib: null,
        sertifikat_pendirian: null,
        pernyataan_pendirian: null
    });

    const [filePreviews, setFilePreviews] = useState({});

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    useEffect(() => {
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                setForm(prev => ({ ...prev, email: session.user.email }));
            }
        };
        checkExistingSession();
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({
            ...form,
            [e.target.name]: value,
        });
    };

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [fieldName]: file }));

            // Create preview if it's an image
            if (file.type.startsWith('image/')) {
                setFilePreviews(prev => ({ ...prev, [fieldName]: URL.createObjectURL(file) }));
            } else {
                setFilePreviews(prev => ({ ...prev, [fieldName]: 'document' }));
            }
        }
    };


    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        // 1. Account Validation
        if (!form.brand_name || !form.phone || !form.email || !form.password || !form.confirm_password) {
            setErrorMsg("Mohon lengkapi data akun.");
            setLoading(false);
            return;
        }

        if (form.password !== form.confirm_password) {
            setErrorMsg("Kata sandi tidak cocok.");
            setLoading(false);
            return;
        }

        if (!form.termsAgreed) {
            setErrorMsg("Anda harus menyetujui Syarat & Ketentuan.");
            setLoading(false);
            return;
        }

        // 2. Cek apakah email sudah terdaftar
        setIsCheckingEmail(true);
        try {
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id, role')
                .eq('email', form.email.trim())
                .maybeSingle();

            if (existingProfile) {
                const roleLabel = existingProfile.role === 'creator'
                    ? 'Creator'
                    : existingProfile.role === 'developer'
                        ? 'Developer'
                        : 'Pengguna (User)';
                setErrorMsg(`Email ini sudah digunakan sebagai ${roleLabel}. Harap gunakan email lain.`);
                setIsCheckingEmail(false);
                setLoading(false);
                return;
            }
        } catch (err) {
            console.error('Email check error:', err);
        }
        setIsCheckingEmail(false);

        try {
            // 3. Multi-File Upload
            const uploadedUrls = {};
            const filesToUpload = {
                ...files,
                avatar: photoFile // Step 2 photo
            };

            for (const [key, file] of Object.entries(filesToUpload)) {
                if (file) {
                    try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Date.now()}_${key}.${fileExt}`;
                        const filePath = `${key === 'avatar' ? 'avatars' : 'legal_docs'}/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('creator-assets')
                            .upload(filePath, file);

                        if (!uploadError) {
                            const { data: { publicUrl } } = supabase.storage
                                .from('creator-assets')
                                .getPublicUrl(filePath);
                            uploadedUrls[key] = publicUrl;
                        } else {
                            console.warn(`Gagal upload ${key}:`, uploadError);
                        }
                    } catch (uploadErr) {
                        console.warn(`Error saat memproses ${key}:`, uploadErr);
                    }
                }
            }

            // 4. Daftar akun baru
            let authUser = null;
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: form.email.trim(),
                password: form.password,
                options: {
                    emailRedirectTo: window.location.origin + "/creator/dashboard",
                    data: {
                        full_name: form.brand_name,
                        brand_name: form.brand_name,
                        role: 'creator'
                    }
                }
            });

            if (signUpError) throw signUpError;
            authUser = authData.user;

            if (!authUser) {
                throw new Error("Failed to identify user for registration");
            }

            // 5. Profile Upsert
            const { error: profileUpsertError } = await supabase.from('profiles').upsert({
                id: authUser.id,
                full_name: form.brand_name,
                email: form.email.trim(),
                role: 'creator'
            }, { onConflict: 'id' });

            if (profileUpsertError) throw profileUpsertError;

            // 6. Creator Data Upsert (Comprehensive)
            const isKomunitas = form.golongan === "Komunitas";
            const creatorPayload = {
                id: authUser.id,
                brand_name: form.brand_name,
                description: form.description,
                address: form.address, // Brand address
                image_url: uploadedUrls.avatar || "",
                instagram_url: form.social_instagram,
                tiktok_url: form.social_tiktok,
                x_url: form.social_x,
                facebook_url: form.social_facebook,
                verified: false,

                // New Legal & Financial data
                golongan: form.golongan,
                director_name: form.director_name,
                company_address: form.company_address,
                bank_name: form.bank_name,
                bank_account: form.bank_account_number,
                bank_holder_name: form.bank_account_holder,
                pkp_number: form.pkp_number,
                other_data: form.other_data,

                // Multi-Document URLs with special mapping for Komunitas
                ktp_pic_url: uploadedUrls.ktp_pic || null,
                npwp_pic_url: uploadedUrls.npwp_pic || null,
                npwp_company_url: uploadedUrls.npwp_company || null,
                akte_notaris_url: isKomunitas ? uploadedUrls.ktp_pic : (uploadedUrls.akte_notaris || null),
                sk_kumham_url: isKomunitas ? uploadedUrls.npwp_pic : (uploadedUrls.sk_kumham || null),
                surat_kuasa_url: uploadedUrls.surat_kuasa || null,
                nib_url: uploadedUrls.nib || null,
                sertifikat_pendirian_url: uploadedUrls.sertifikat_pendirian || null,
                pernyataan_pendirian_url: uploadedUrls.pernyataan_pendirian || null
            };

            const { error: profileError } = await supabase.from("creators").upsert(creatorPayload, { onConflict: 'id' });

            if (profileError) throw profileError;

            // Step 3 is now Success within Pemberkasan tab
            setStep(3);

        } catch (err) {
            console.error("Registration Error:", err);
            setErrorMsg(err.message || "Terjadi kesalahan saat mendaftar.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-[#F8FAFC] py-20 px-4 relative overflow-hidden flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className="w-full max-w-5xl relative z-10">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Header Steps */}
                    {/* Tab Navigation */}
                    <div className="bg-slate-50/80 border-b border-slate-100 p-2">
                        <div className="flex bg-white rounded-xl p-1 shadow-sm max-w-2xl mx-auto">
                            {[
                                { id: 'mou', label: 'MOU', icon: <ShieldCheck size={16} /> },
                                { id: 'pemberkasan', label: 'Pemberkasan', icon: <Briefcase size={16} /> },
                                { id: 'dokumentasi', label: 'Dokumentasi', icon: <Building2 size={16} /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                                        ${activeTab === tab.id 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
                                    `}
                                >
                                    {tab.icon}
                                    <span className="hidden md:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 md:p-10">
                        <AnimatePresence mode="wait">
                            {activeTab === 'mou' && (
                                <motion.div
                                    key="mou_tab"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 md:p-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Kemitraan & Kerjasama</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memorandum of Understanding (MOU)</p>
                                            </div>
                                            <button 
                                                onClick={handleDownloadPDF}
                                                disabled={isDownloadingPDF}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-blue-100 transition-colors disabled:opacity-50"
                                            >
                                                {isDownloadingPDF ? (
                                                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                                                ) : (
                                                    <Download size={14} />
                                                )}
                                                {isDownloadingPDF ? "Menyiapkan PDF..." : "Download PDF"}
                                            </button>
                                        </div>

                                        <MOUDocument data={form} containerId="mou-document-container" />

                                        <div className="mt-8 flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors cursor-pointer group" onClick={() => setAcceptedMOU(!acceptedMOU)}>
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${acceptedMOU ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-slate-50 group-hover:border-blue-300'}`}>
                                                {acceptedMOU && <CheckCircle2 size={14} />}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 select-none">Saya telah membaca, memahami, dan menyetujui seluruh isi MOU di atas.</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { if(acceptedMOU) setActiveTab('pemberkasan'); }}
                                        disabled={!acceptedMOU}
                                        className={`w-full py-5 rounded-[2rem] font-black text-sm transition-all flex items-center justify-center gap-2 group shadow-xl ${acceptedMOU ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 active:scale-[0.98]' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                                    >
                                        Mulai Pemberkasan Data
                                        <ArrowRight size={18} className={`${acceptedMOU ? 'group-hover:translate-x-1' : ''} transition-transform`} />
                                    </button>
                                </motion.div>
                            )}

                            {activeTab === 'pemberkasan' && (
                                <div className="space-y-6">
                                    {step === 1 && (
                                        <motion.div
                                            key="pemberkasan_step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                    {/* Pilihan Golongan - Redesigned */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldCheck size={16} className="text-blue-600" />
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pilih Tipe Entitas</label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {ENTITY_TYPES.map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, golongan: type.id })}
                                                    className={`group relative p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${form.golongan === type.id
                                                        ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-600/5'
                                                        : 'border-slate-100 bg-white hover:border-blue-200'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`p-3 rounded-xl transition-colors ${form.golongan === type.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                                            {type.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-xs font-black uppercase tracking-wider mb-0.5 ${form.golongan === type.id ? 'text-blue-700' : 'text-slate-900'}`}>
                                                                {type.id}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                                                {type.desc}
                                                            </div>
                                                        </div>
                                                        {form.golongan === type.id && (
                                                            <div className="absolute top-4 right-4 text-blue-600">
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-12 pt-4 border-t border-slate-50">
                                        {/* Left Side: Personal/Company Data */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <User size={16} className="text-blue-600" />
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Identitas</h3>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nama Direktur / PIC</label>
                                                <input
                                                    type="text"
                                                    name="director_name"
                                                    placeholder="Nama lengkap sesuai KTP"
                                                    value={form.director_name}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Alamat Perusahaan / Domisili</label>
                                                <textarea
                                                    name="company_address"
                                                    placeholder="Alamat lengkap..."
                                                    value={form.company_address}
                                                    onChange={handleChange}
                                                    required
                                                    rows={3}
                                                    className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 resize-none focus:ring-4 focus:ring-blue-600/5"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nomor Pendaftaran PKP (Jika Ada)</label>
                                                <input
                                                    type="text"
                                                    name="pkp_number"
                                                    placeholder="XXXX-XXXX-XXXX"
                                                    value={form.pkp_number}
                                                    onChange={handleChange}
                                                    className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Korespondensi</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    placeholder="email@bisnis.com"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">No. Handphone</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    placeholder="0812xxxx"
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5"
                                                />
                                            </div>
                                        </div>

                                        {/* Right Side: Banking Data */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <CreditCard size={16} className="text-blue-600" />
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rekening Perusahaan</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nama Bank</label>
                                                    <input
                                                        type="text"
                                                        name="bank_name"
                                                        placeholder="Contoh: BCA / Mandiri"
                                                        value={form.bank_name}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">No Rekening</label>
                                                    <input
                                                        type="text"
                                                        name="bank_account_number"
                                                        placeholder="000-000-000"
                                                        value={form.bank_account_number}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nama Pemilik</label>
                                                    <input
                                                        type="text"
                                                        name="bank_account_holder"
                                                        placeholder="Nama Buku Tabungan"
                                                        value={form.bank_account_holder}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload Section - Stays full width but below the split grid */}
                                    <div className="space-y-6 pt-10 border-t border-slate-50 mt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Upload size={16} className="text-blue-600" />
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload Foto Identitas</h3>
                                            </div>
                                            {form.golongan === "Komunitas" && <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Khusus Komunitas</span>}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FileUploader id="ktp_pic" label="KTP Direktur/PIC" onChange={handleFileChange} preview={filePreviews.ktp_pic} />
                                            <FileUploader id="npwp_pic" label="NPWP Direktur/PIC" onChange={handleFileChange} preview={filePreviews.npwp_pic} />
                                            {form.golongan !== "Komunitas" && (
                                                <FileUploader id="npwp_company" label="NPWP Perusahaan" onChange={handleFileChange} preview={filePreviews.npwp_company} />
                                            )}
                                        </div>

                                        {form.golongan && (
                                            <div className="space-y-6 pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <ShieldCheck size={16} className="text-blue-600" />
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                        {form.golongan === "Komunitas" ? "Berkas Tambahan" : "Berkas Legalitas"}
                                                    </h3>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {(form.golongan === "PT Perseroan" || form.golongan === "CV" || form.golongan === "Komunitas") && (
                                                        <>
                                                            <FileUploader
                                                                id="akte_notaris"
                                                                label={form.golongan === "Komunitas" ? "Berkas Lainnya 1" : "Akte Notaris"}
                                                                onChange={handleFileChange}
                                                                preview={filePreviews.akte_notaris}
                                                            />
                                                            <FileUploader
                                                                id="sk_kumham"
                                                                label={form.golongan === "Komunitas" ? "Berkas Lainnya 2" : "SK Kumham"}
                                                                onChange={handleFileChange}
                                                                preview={filePreviews.sk_kumham}
                                                            />
                                                        </>
                                                    )}
                                                    <FileUploader
                                                        id="surat_kuasa"
                                                        label={form.golongan === "Komunitas" ? "Berkas Lainnya 3" : "Surat Kuasa"}
                                                        onChange={handleFileChange}
                                                        preview={filePreviews.surat_kuasa}
                                                    />
                                                    <FileUploader
                                                        id="nib"
                                                        label={form.golongan === "Komunitas" ? "Berkas Lainnya 4" : "NIB"}
                                                        onChange={handleFileChange}
                                                        preview={filePreviews.nib}
                                                    />
                                                    {form.golongan === "PT Perseorangan" && (
                                                        <>
                                                            <FileUploader id="sertifikat_pendirian" label="Sertifikat Pendirian" onChange={handleFileChange} preview={filePreviews.sertifikat_pendirian} />
                                                            <FileUploader id="pernyataan_pendirian" label="Pernyataan Pendirian" onChange={handleFileChange} preview={filePreviews.pernyataan_pendirian} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Brand & Account Details - Integrated from Old Step 2 */}
                                    <div className="space-y-12 pt-12 border-t border-slate-100 mt-12">
                                        {/* Profil Brand */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Building2 size={16} className="text-blue-600" />
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profil Brand / Organizer</h3>
                                            </div>
                                            <div className="flex flex-col md:flex-row gap-8">
                                                <div className="w-full md:w-1/3">
                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3 ml-1 block text-center">Logo Brand</label>
                                                    <div className="relative group/photo w-full">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    setPhotoFile(file);
                                                                    setPhotoPreview(URL.createObjectURL(file));
                                                                }
                                                            }}
                                                            className="hidden"
                                                            id="photo-upload"
                                                        />
                                                        <label
                                                            htmlFor="photo-upload"
                                                            className={`
                                                                relative w-full aspect-square rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3
                                                                ${photoPreview ? 'border-transparent' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-600 shadow-inner'}
                                                            `}
                                                        >
                                                            {photoPreview ? (
                                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <>
                                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><Upload size={20} /></div>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upload Logo</span>
                                                                </>
                                                            )}
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="w-full md:w-2/3 space-y-6">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nama Brand / EO</label>
                                                        <input type="text" name="brand_name" placeholder="Nama publik organizer" value={form.brand_name} onChange={handleChange} required className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Deskripsi</label>
                                                        <textarea name="description" placeholder="Ceritakan tentang organizer anda..." value={form.description} onChange={handleChange} rows={3} className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold resize-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Social Links */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users size={16} className="text-blue-600" />
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Koneksi Sosial (Link)</h3>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {["instagram", "tiktok", "x", "facebook"].map((sm) => (
                                                    <div key={sm} className="space-y-1.5">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 capitalize">{sm}</label>
                                                        <input
                                                            type="text"
                                                            name={`social_${sm}`}
                                                            placeholder={`https://${sm}.com/...`}
                                                            value={form[`social_${sm}`]}
                                                            onChange={handleChange}
                                                            className="w-full rounded-2xl px-5 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Security */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Lock size={16} className="text-blue-600" />
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Keamanan Akun</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Kata Sandi</label>
                                                    <div className="relative">
                                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required className="w-full rounded-2xl px-12 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold" />
                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Konfirmasi Sandi</label>
                                                    <div className="relative">
                                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input type={showConfirmPassword ? "text" : "password"} name="confirm_password" placeholder="••••••••" value={form.confirm_password} onChange={handleChange} required className="w-full rounded-2xl px-12 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold" />
                                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Terms & Submit */}
                                        <div className="space-y-6 pt-6">
                                            <div
                                                className={`flex items-start gap-4 p-6 bg-slate-50 rounded-[2rem] border transition-all cursor-pointer hover:bg-white hover:border-blue-200 ${form.termsAgreed ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}
                                                onClick={() => setForm({ ...form, termsAgreed: !form.termsAgreed })}
                                            >
                                                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${form.termsAgreed ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'border-slate-200 bg-white'}`}>
                                                    {form.termsAgreed && <CheckCircle2 size={14} />}
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                                                    Saya menyatakan bahwa seluruh data yang diisi adalah benar dan menyetujui <span className="text-blue-600">Syarat & Ketentuan</span> serta <span className="text-blue-600">Kebijakan Privasi</span> Heroestix.
                                                </p>
                                            </div>

                                            <form onSubmit={handleSubmit}>
                                                <button
                                                    type="submit"
                                                    disabled={loading || !form.termsAgreed}
                                                    className="w-full bg-blue-600 text-white py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                                                >
                                                    {loading ? (
                                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                                                    ) : (
                                                        <>Kirim Pendaftaran <CheckCircle2 size={20} /></>
                                                    )}
                                                </button>
                                            </form>

                                            <p className="text-center text-[13px] text-slate-500 font-bold mt-6">
                                                Sudah punya akun?{" "}
                                                <Link to="/masuk" className="text-blue-600 hover:underline underline-offset-4">Masuk</Link>
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {step === 3 && (
                                <motion.div
                                    key="step3_success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-10 text-center"
                                >
                                    <div className="relative w-24 h-24 mx-auto mb-8">
                                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                                        <div className="relative w-full h-full bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
                                            <CheckCircle2 size={48} />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Pendaftaran Dikirim!</h3>
                                    <p className="text-slate-500 mb-10 leading-relaxed max-w-sm mx-auto font-medium text-sm">
                                        Data Anda sedang dalam proses verifikasi tim kami. Estimasi waktu verifikasi adalah <strong>1x24 jam kerja</strong>.
                                    </p>
                                    <div className="space-y-4 max-w-sm mx-auto">
                                        <Link
                                            to="/creator/dashboard"
                                            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.95] flex items-center justify-center gap-3"
                                        >
                                            Ke Dashboard Creator <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {activeTab === 'dokumentasi' && (
                        <motion.div
                            key="dokumentasi_tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-8 md:p-10 text-center"
                        >
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                                <div className="relative w-full h-full bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
                                    <Building2 size={32} />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Pusat Dokumentasi</h3>
                            <p className="text-slate-500 mb-10 leading-relaxed max-w-sm mx-auto font-medium text-xs">
                                Pelajari cara memaksimalkan penggunaan platform Heroestix dengan panduan resmi kami.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Briefcase size={20} />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Panduan Creator</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mb-4">Pelajari cara mengelola event & penjualan tiket.</p>
                                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                                        Unduh PDF <ArrowRight size={12} />
                                    </button>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Building2 size={20} />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Manual Book Heroestix</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mb-4">Panduan teknis penggunaan dashboard & fitur.</p>
                                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                                        Unduh PDF <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    </div>
</div>
    );
};

const FileUploader = ({ id, label, onChange, preview }) => {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1 block">{label}</label>
            <div className="relative group/file">
                <input
                    type="file"
                    onChange={(e) => onChange(e, id)}
                    className="hidden"
                    id={`file-${id}`}
                />
                <label
                    htmlFor={`file-${id}`}
                    className={`
                        relative w-full aspect-square md:aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2
                        ${preview
                            ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-600/5'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-md hover:shadow-blue-600/5'
                        }
                    `}
                >
                    {preview ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/40 backdrop-blur-[2px]">
                            {preview === 'document' ? (
                                <div className="p-4 bg-blue-600 text-white rounded-[1.25rem] shadow-xl shadow-blue-600/30 scale-110 animate-in zoom-in duration-300">
                                    <ShieldCheck size={24} />
                                </div>
                            ) : (
                                <div className="absolute inset-0">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-blue-600/10" />
                                    <div className="absolute top-3 right-3 p-1.5 bg-blue-600 text-white rounded-full shadow-lg">
                                        <CheckCircle2 size={12} />
                                    </div>
                                </div>
                            )}
                            {preview === 'document' && (
                                <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                                    Berkas Terpilih
                                </span>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm transition-all group-hover/file:scale-110 group-hover/file:text-blue-600 group-hover/file:shadow-md">
                                <Upload size={20} />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover/file:text-blue-600 transition-colors">Pilih File</span>
                        </>
                    )}
                </label>
            </div>
        </div>
    );
};

export default CreatorRegister;
