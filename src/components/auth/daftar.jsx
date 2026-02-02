import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";
import { getSubdomainUrl } from "../../lib/navigation";


const Daftar = ({ role = "user" }) => {
    const [form, setForm] = useState({
        nama: "",
        email: "",
        password: "",
        confirm_password: "",
        tanggal_lahir: "",
        brand_name: "",
        bank_name: "",
        bank_account: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isOtpStage, setIsOtpStage] = useState(false);
    const [otpCode, setOtpCode] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleEmailRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        if (form.password !== form.confirm_password) {
            setErrorMsg("Security Passkeys do not match.");
            setLoading(false);
            return;
        }

        if (role === 'creator') {
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('email', form.email)
                .single();

            if (existingProfile && existingProfile.role === 'user') {
                setErrorMsg("Email ini sudah terdaftar sebagai User. Silahkan gunakan email lain untuk akun Creator.");
                setLoading(false);
                return;
            }
        }

        const { data: authData, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    nama: form.nama,
                    tanggal_lahir: form.tanggal_lahir,
                    provider: "email",
                    role: role,
                    brand_name: form.brand_name,
                    bank_name: form.bank_name,
                    bank_account: form.bank_account,
                },
            },
        });

        console.log("Signup debug - authData:", authData);
        console.log("Signup debug - error:", error);

        if (error) {
            setErrorMsg(error.message);
        } else if (authData.user) {
            const hasIdentities = authData.user.identities && authData.user.identities.length > 0;
            if (!hasIdentities) {
                setErrorMsg("Email ini sudah terdaftar dan terverifikasi. Silakan masuk (login) atau hapus akun lama Anda melalui menu Profil.");
            } else {
                setIsOtpStage(true);
            }
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const { data, error } = await supabase.auth.verifyOtp({
            email: form.email,
            token: otpCode,
            type: 'signup'
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            // Create user data manually if needed (Supabase might handle this via triggers)
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email: form.email,
                full_name: form.nama,
                role: role,
            });

            if (role === 'creator') {
                await supabase.from('creators').insert({
                    id: data.user.id,
                    brand_name: form.brand_name,
                    bank_name: form.bank_name,
                    bank_account: form.bank_account,
                    verified: false
                });
            }

            alert("Verifikasi berhasil! Akun Anda telah aktif.");
            window.location.href = role === "creator" ? "/masuk" : "/";
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setErrorMsg("");
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: form.email,
        });
        if (error) {
            setErrorMsg(error.message);
        } else {
            alert("Kode OTP baru telah dikirim ke email Anda.");
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        localStorage.setItem("auth_mode", "register");
        localStorage.setItem("auth_role", role);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + (role === "creator" ? "/dashboard" : "/"),
            },
        });
        if (error) console.error("Google login error:", error.message);
    };

    const isCreator = role === "creator";

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-20 px-4 relative overflow-hidden flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className={`w-full ${isCreator ? "max-w-2xl" : "max-w-[420px]"} relative z-10`}>
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="p-8 md:p-10 text-center border-b border-slate-50">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
                            <div className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
                            {isOtpStage ? "EMAIL VERIFICATION" : (isCreator ? "CREATOR REGISTRATION" : "USER REGISTRATION")}
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {isOtpStage ? "Verifikasi Email" : (isCreator ? "Mulai Kelola Event" : "Gabung Heroestix")}
                        </h1>
                        <p className="text-[13px] text-slate-500 font-medium mt-1">
                            {isOtpStage
                                ? `Masukan kode OTP yang dikirim ke ${form.email}`
                                : (isCreator ? "Lengkapi detail untuk jadi partner kami" : "Nikmati kemudahan beli tiket konser & event")}
                        </p>
                    </div>

                    <div className="p-8 md:p-10">
                        {/* Error Alert */}
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
                                <span className="font-bold">{errorMsg}</span>
                            </div>
                        )}

                        {isOtpStage ? (
                            /* OTP STAGE */
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
                                <div className="space-y-4">
                                    <button
                                        type="submit"
                                        disabled={loading || otpCode.length !== 6}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {loading ? "Memverifikasi..." : "Verifikasi Sekarang"}
                                    </button>
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={loading}
                                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest disabled:opacity-50"
                                        >
                                            Tidak menerima kode? Kirim ulang
                                        </button>
                                    </div>
                                    <div className="text-center pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsOtpStage(false)}
                                            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                                        >
                                            Ganti Email
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            /* REGISTRATION STAGE */
                            <form onSubmit={handleEmailRegister} className="space-y-8">
                                {/* Section 1: Akun */}
                                <div className="space-y-4">
                                    {isCreator && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">01. Informasi Akun</h3>
                                            <div className="flex-1 h-px bg-slate-100" />
                                        </div>
                                    )}

                                    <div className={`grid grid-cols-1 ${isCreator ? "md:grid-cols-2" : ""} gap-4`}>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                name="nama"
                                                placeholder="Sesuai ID"
                                                value={form.nama}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Alamat Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="email@anda.com"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
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
                                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 pr-12"
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Konfirmasi</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    name="confirm_password"
                                                    placeholder="••••••••"
                                                    value={form.confirm_password}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 pr-12"
                                                />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className={`space-y-1.5 ${isCreator ? "md:col-span-2" : ""}`}>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tanggal Lahir</label>
                                            <input
                                                type="date"
                                                name="tanggal_lahir"
                                                value={form.tanggal_lahir}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold text-slate-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Creator Only */}
                                {isCreator && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">02. Detail Bisnis</h3>
                                            <div className="flex-1 h-px bg-slate-100" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nama Brand / EO</label>
                                                <input
                                                    type="text"
                                                    name="brand_name"
                                                    placeholder="Contoh: Heroic Events"
                                                    value={form.brand_name}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Bank</label>
                                                    <input
                                                        type="text"
                                                        name="bank_name"
                                                        placeholder="Contoh: BCA"
                                                        value={form.bank_name}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">No. Rekening</label>
                                                    <input
                                                        type="text"
                                                        name="bank_account"
                                                        placeholder="Untuk pencairan dana"
                                                        value={form.bank_account}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-slate-50 space-y-4 flex flex-col items-center">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {loading ? "Memproses..." : isCreator ? "Daftar Jadi Partner" : "Buat Akun Sekarang"}
                                    </button>

                                    {!isCreator && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleGoogleLogin}
                                                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-900 rounded-2xl py-3.5 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                                            >
                                                <FcGoogle size={20} />
                                                <span>Lanjut dengan Google</span>
                                            </button>
                                        </>
                                    )}

                                    <p className="text-[13px] text-slate-500 font-bold mt-2">
                                        Sudah punya akun?{" "}
                                        <Link to="/masuk" className="text-blue-600 hover:underline underline-offset-4">Masuk</Link>
                                    </p>
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

export default Daftar;
