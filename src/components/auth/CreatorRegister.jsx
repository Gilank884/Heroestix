import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";
import { HiCamera } from "react-icons/hi";
import { Upload } from "lucide-react";
import { RxCheckCircled } from "react-icons/rx";

const CreatorRegister = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Form State
    const [form, setForm] = useState({
        brand_name: "", // Nama Creator/EO
        phone: "",
        email: "",
        password: "",
        confirm_password: "", // Not explicitly asked but good practice? User said "Kata sandi". I will imply single or add confirm if standard. Let's stick to single password field as per specific request "Dan Kata sandi" (singular). But visually safe to have confirm? I'll stick to the user's specific list to avoid clutter: "Nama, HP, Email, Password".

        // Step 2
        address: "",
        description: "",
        social_instagram: "",
        social_tiktok: "",
        social_x: "",
        social_facebook: "",
        photoUrl: "", // Added for persistence
        termsAgreed: false
    });

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [userId, setUserId] = useState(null); // Store User ID for verification step

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({
            ...form,
            [e.target.name]: value,
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleStep1Submit = (e) => {
        e.preventDefault();
        setErrorMsg("");

        // Basic Validation
        if (!form.brand_name || !form.phone || !form.email || !form.password || !form.confirm_password) {
            setErrorMsg("Mohon lengkapi semua data.");
            return;
        }

        if (form.password !== form.confirm_password) {
            setErrorMsg("Kata sandi tidak cocok.");
            return;
        }

        // Proceed to Step 2
        setStep(2);
    };

    const handleStep2Submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        if (!form.termsAgreed) {
            setErrorMsg("Anda harus menyetujui Syarat & Ketentuan.");
            setLoading(false);
            return;
        }

        try {
            // 1. Upload Photo if exists
            let photoUrl = "";
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('creator-assets')
                    .upload(filePath, photoFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('creator-assets')
                    .getPublicUrl(filePath);

                photoUrl = publicUrl;
                setForm(prev => ({ ...prev, photoUrl: publicUrl })); // Save to state
            }

            // 2. Use Supabase Auth OTP (creates user in auth.users + triggers profile creation)
            const { error } = await supabase.auth.signInWithOtp({
                email: form.email,
                options: {
                    data: {
                        full_name: form.brand_name,
                        brand_name: form.brand_name,
                        role: 'creator',
                        phone: form.phone,
                        address: form.address,
                        description: form.description,
                        photo_url: photoUrl
                    }
                }
            });

            if (error) throw error;

            console.log("OTP sent to:", form.email);
            setStep(3); // Go to OTP

        } catch (err) {
            console.error("Registration Error:", err);
            setErrorMsg(err.message || "Terjadi kesalahan saat mendaftar.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            // Verify OTP using Supabase Auth
            const { data, error } = await supabase.auth.verifyOtp({
                email: form.email,
                token: otpCode,
                type: 'email'
            });

            if (error) throw error;

            if (!data.user) {
                throw new Error("Verifikasi gagal");
            }

            console.log("OTP verified, user logged in:", data.user.id);

            // User now exists in auth.users and profiles (created by trigger)
            // Call edge function to create creator record ONLY
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const functionUrl = "https://qftuhnkzyegcxfozdfyz.supabase.co/functions/v1/create-creator-profile";

            const response = await fetch(functionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: data.user.id,
                    email: form.email,
                    brand_name: form.brand_name,
                    phone: form.phone,
                    address: form.address,
                    description: form.description,
                    photo_url: form.photoUrl,
                    social_media: {
                        instagram: form.social_instagram,
                        tiktok: form.social_tiktok,
                        x: form.social_x,
                        facebook: form.social_facebook
                    }
                })
            });

            const funcData = await response.json();

            if (!response.ok) {
                console.error("Function Error:", funcData);
                throw new Error("Gagal membuat profil: " + (funcData.error || "Unknown Error"));
            }

            // Success
            alert("Verifikasi berhasil! Akun Anda telah aktif.");
            window.location.href = "/creator/dashboard";
        } catch (err) {
            console.error("Verification Error:", err);
            setErrorMsg(err.message || "Terjadi kesalahan saat verifikasi.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setErrorMsg("");

        const { error } = await supabase.auth.signInWithOtp({
            email: form.email
        });

        if (error) {
            setErrorMsg("Gagal mengirim ulang OTP: " + error.message);
        } else {
            alert("Kode OTP baru telah dikirim ke email Anda.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-20 px-4 relative overflow-hidden flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className="w-full max-w-2xl relative z-10">
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    {/* Header Steps */}
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                        <div className="flex items-center justify-between max-w-sm mx-auto mb-8 relative">
                            {/* Line */}
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10" />

                            {/* Step 1 Indicator */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border border-slate-200'}`}>1</div>

                            {/* Step 2 Indicator */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border border-slate-200'}`}>2</div>

                            {/* Step 3 Indicator */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 3 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border border-slate-200'}`}>3</div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                                {step === 1 && "Informasi Dasar"}
                                {step === 2 && "Profil Creator"}
                                {step === 3 && "Verifikasi Email"}
                            </h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {step === 1 && "Lengkapi data akun untuk memulai."}
                                {step === 2 && "Beritahu audiens tentang organizer kamu."}
                                {step === 3 && `Masukkan OTP yang dikirim ke ${form.email}`}
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
                                <span className="font-bold">{errorMsg}</span>
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleStep1Submit} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nama Creator / EO</label>
                                    <input
                                        type="text"
                                        name="brand_name"
                                        placeholder="Contoh: Heroes Creators"
                                        value={form.brand_name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nomor Handphone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="0812xxxx"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="email@anda.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Kata Sandi</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="••••••••"
                                            value={form.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 pr-12"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Konfirmasi Kata Sandi</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirm_password"
                                            placeholder="••••••••"
                                            value={form.confirm_password}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 pr-12"
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-4 flex items-center justify-center disabled:opacity-50"
                                >
                                    {loading ? "Memproses..." : "Lanjutkan"}
                                </button>

                                <p className="text-center text-[13px] text-slate-500 font-bold mt-6">
                                    Sudah punya akun?{" "}
                                    <Link to="/masuk" className="text-blue-600 hover:underline underline-offset-4">Masuk</Link>
                                </p>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleStep2Submit} className="space-y-6">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Left: Image Upload */}
                                    <div className="w-full md:w-1/3 flex flex-col items-center">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Foto Creator</label>
                                        <div className="relative group/photo w-full">
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
                                                    relative w-full aspect-square rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3
                                                    ${photoPreview ? 'border-transparent' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-600'}
                                                `}
                                            >
                                                {photoPreview ? (
                                                    <>
                                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-all flex items-center justify-center text-white">
                                                            <HiCamera size={24} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm text-blue-600">
                                                            <Upload size={24} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Upload Logo</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Right: Details */}
                                    <div className="w-full md:w-2/3 space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Alamat</label>
                                            <input
                                                type="text"
                                                name="address"
                                                placeholder="Alamat lengkap..."
                                                value={form.address}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Description About Organizer</label>
                                            <textarea
                                                name="description"
                                                placeholder="Deskripsikan organizer anda..."
                                                value={form.description}
                                                onChange={handleChange}
                                                rows={4}
                                                className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media */}
                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Social Media (Link)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Instagram</label>
                                            <input
                                                type="text"
                                                name="social_instagram"
                                                placeholder="https://instagram.com/..."
                                                value={form.social_instagram}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl px-5 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">TikTok</label>
                                            <input
                                                type="text"
                                                name="social_tiktok"
                                                placeholder="https://tiktok.com/@..."
                                                value={form.social_tiktok}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl px-5 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">X (Twitter)</label>
                                            <input
                                                type="text"
                                                name="social_x"
                                                placeholder="https://x.com/..."
                                                value={form.social_x}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl px-5 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Facebook</label>
                                            <input
                                                type="text"
                                                name="social_facebook"
                                                placeholder="https://facebook.com/..."
                                                value={form.social_facebook}
                                                onChange={handleChange}
                                                className="w-full rounded-2xl px-5 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Terms Checkbox */}
                                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer" onClick={() => setForm({ ...form, termsAgreed: !form.termsAgreed })}>
                                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.termsAgreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                        {form.termsAgreed && <RxCheckCircled className="text-white text-xs" />}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        I agree to the <Link target="_blank" to="/terms-of-service" className="text-blue-600 font-bold hover:underline">Terms and Conditions</Link> and <Link target="_blank" to="/privacy" className="text-blue-600 font-bold hover:underline">Privacy Policy</Link> applicable at Heroestix.
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-1/3 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-2/3 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {loading ? "Memproses..." : "Sign Up"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-8">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Kode OTP 6-Digit</label>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        required
                                        className="w-full rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-2xl tracking-[0.5em] text-center outline-none transition-all font-black placeholder:text-slate-200"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || otpCode.length !== 6}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? "Memverifikasi..." : "Verifikasi Sekarang"}
                                </button>
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest disabled:opacity-50"
                                    >
                                        Tidak menerima kode? Kirim ulang
                                    </button>
                                </div>
                            </form>
                        )}

                    </div>
                </div>
                <p className="mt-8 text-center text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    &copy; 2024 Heroestix Ticket &middot; Terms Applied
                </p>
            </div>
        </div>
    );
};

export default CreatorRegister;
