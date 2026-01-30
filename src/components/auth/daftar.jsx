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

        // 0. Password Confirmation check
        if (form.password !== form.confirm_password) {
            setErrorMsg("Security Passkeys do not match.");
            setLoading(false);
            return;
        }

        // 1. Validation: Prevent existing 'user' from becoming 'creator'
        if (role === 'creator') {
            const { data: existingProfile, error: checkError } = await supabase
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

        // 2. Auth Sign Up
        const { data: authData, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    nama: form.nama,
                    tanggal_lahir: form.tanggal_lahir,
                    provider: "email",
                    role: role,
                },
            },
        });

        if (error) {
            setErrorMsg(error.message);
        } else if (authData.user) {
            // 3. Upsert to profiles table to ensure role is 'creator' or 'user'
            // We use upsert because the user might already exist in auth but not profiles (or vice versa)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: form.email,
                    full_name: form.nama,
                    role: role,
                });

            if (profileError) {
                console.error("Error creating/updating profile:", profileError.message);
            }

            // 4. Populate Creators table if role is creator
            if (role === 'creator') {
                const { error: creatorError } = await supabase
                    .from('creators')
                    .insert({
                        id: authData.user.id,
                        brand_name: form.brand_name,
                        bank_name: form.bank_name,
                        bank_account: form.bank_account,
                        verified: false
                    });

                if (creatorError) {
                    console.error("Error creating creator profile:", creatorError.message);
                }
            }
            alert("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
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
                queryParams: {
                    role: role // Optional: pass role if supported by your auth hook/handle
                }
            },
        });

        if (error) {
            console.error("Google login error:", error.message);
        }
    };

    // CLEAN & PROFESSIONAL REGISTRATION (For Creator)
    if (role === "creator") {
        return (
            <div className="min-h-screen bg-slate-50 py-20 px-4 relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />

                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12 relative z-10">
                        <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                                <img src="/Logo/Logo.png" alt="Logo" className="h-8 w-auto brightness-0 invert" />
                            </div>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">Heroestix</span>
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Jadilah Mitra Creator</h1>
                        <p className="text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
                            Mulai kelola event kamu dengan profesional dan jangkau lebih banyak audiens.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.04)] overflow-hidden relative z-10">
                        {/* Form Body */}
                        <div className="p-8 md:p-16">
                            {/* Error Alert */}
                            {errorMsg && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-6 py-4 rounded-2xl mb-10 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                                    <span className="font-bold">{errorMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleEmailRegister} className="space-y-12">
                                {/* Section 1: Akun Dasat */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">01</div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Informasi Akun</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                name="nama"
                                                placeholder="Nama sesuai KTP"
                                                value={form.nama}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl px-6 py-4 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all font-semibold placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Mitra</label>
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="email@bisnis.com"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl px-6 py-4 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all font-semibold placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Sandi Keamanan</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    placeholder="Minimal 8 karakter"
                                                    value={form.password}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-2xl px-6 py-4 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all font-semibold placeholder:text-slate-400 pr-14"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Konfirmasi Sandi</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    name="confirm_password"
                                                    placeholder="Ulangi sandi"
                                                    value={form.confirm_password}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-2xl px-6 py-4 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all font-semibold placeholder:text-slate-400 pr-14"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tanggal Lahir</label>
                                            <input
                                                type="date"
                                                name="tanggal_lahir"
                                                value={form.tanggal_lahir}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl px-6 py-4 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all font-semibold text-slate-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Informasi Brand & Finansial */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">02</div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Identitas Bisnis</h3>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nama Brand / Organisasi</label>
                                            <input
                                                type="text"
                                                name="brand_name"
                                                placeholder="Nama yang akan tampil di tiket"
                                                value={form.brand_name}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl px-6 py-4 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all font-semibold placeholder:text-slate-400"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nama Bank</label>
                                                <input
                                                    type="text"
                                                    name="bank_name"
                                                    placeholder="Contoh: BCA / Mandiri / BNI"
                                                    value={form.bank_name}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-2xl px-6 py-4 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all font-semibold placeholder:text-slate-400"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nomor Rekening</label>
                                                <input
                                                    type="text"
                                                    name="bank_account"
                                                    placeholder="Untuk pencairan dana"
                                                    value={form.bank_account}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-2xl px-6 py-4 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white text-slate-900 outline-none transition-all font-semibold placeholder:text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loading ? "Mendaftarkan Akun..." : "Daftar Sekarang"}
                                    </button>

                                    <div className="flex items-center gap-4 my-10">
                                        <div className="flex-1 h-px bg-slate-100" />
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">Atau Daftar Dengan</span>
                                        <div className="flex-1 h-px bg-slate-100" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 rounded-[2rem] py-5 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all active:scale-[0.98]"
                                    >
                                        <FcGoogle size={24} />
                                        <span>Gunakan Akun Google</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Summary Footer */}
                        <div className="bg-slate-50 px-8 py-8 text-center border-t border-slate-100">
                            <p className="text-slate-400 font-bold text-sm">
                                Sudah punya akun mitra?{" "}
                                <Link to="/masuk" className="text-blue-600 hover:underline underline-offset-4 ml-1">Masuk Portal</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    // ORIGINAL SPLIT LAYOUT (For regular Users)
    return (
        <div className="min-h-screen flex">
            {/* ================= LEFT ================= */}
            <div className="hidden md:flex w-[70%] relative items-center justify-center bg-white overflow-hidden">
                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
                        backgroundSize: "36px 36px",
                    }}
                />

                {/* Banner Card */}
                <div className="relative z-10 w-[70%]">
                    <div className="rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
                        <img
                            src="/assets/Dongker.png"
                            alt="Heroestix Banner"
                            className="w-full h-[220px] object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* ================= RIGHT ================= */}
            <div className="w-full md:w-[30%] flex items-center justify-center bg-gradient-to-b from-[#b1451a] to-[#8e3715] px-8">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-white mb-2 mt-10 italic uppercase tracking-tighter">
                            Heroestix Daftar
                        </h1>
                        <p className="text-[#f9e2d2] text-sm">
                            Buat akun untuk mulai menggunakan Heroestix
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-lg mb-5">
                            {errorMsg}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleEmailRegister} className="space-y-4">
                        <input
                            type="text"
                            name="nama"
                            placeholder="Nama Lengkap"
                            value={form.nama}
                            onChange={handleChange}
                            required
                            className="
    w-full rounded-xl px-4 py-3
    bg-[#b1451a] text-white
    focus:ring-2 focus:ring-white outline-none
    autofill:bg-[#b1451a] border border-white/10
  "
                            style={{
                                WebkitBoxShadow: "0 0 0 1000px rgb(177 69 26) inset",
                                WebkitTextFillColor: "white",
                            }}
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="
    w-full rounded-xl px-4 py-3
    bg-[#b1451a] text-white
    focus:ring-2 focus:ring-white outline-none
    autofill:bg-[#b1451a] border border-white/10
  "
                            style={{
                                WebkitBoxShadow: "0 0 0 1000px rgb(177 69 26) inset",
                                WebkitTextFillColor: "white",
                            }}
                        />


                        <input
                            type="password"
                            name="password"
                            placeholder="Sandi"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="
    w-full rounded-xl px-4 py-3
    bg-[#b1451a] text-white
    focus:ring-2 focus:ring-white outline-none
    autofill:bg-[#b1451a] border border-white/10
  "
                            style={{
                                WebkitBoxShadow: "0 0 0 1000px rgb(177 69 26) inset",
                                WebkitTextFillColor: "white",
                            }}
                        />

                        <div>
                            <label className="block text-xs font-bold text-[#f9e2d2] mb-1 uppercase tracking-widest pl-2">
                                Tanggal Lahir
                            </label>
                            <input
                                type="date"
                                name="tanggal_lahir"
                                value={form.tanggal_lahir}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl px-4 py-3 bg-[#b1451a] text-white focus:ring-2 focus:ring-white outline-none border border-white/10"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#8e3715] text-white py-3 rounded-xl font-semibold hover:bg-[#5e240a] transition disabled:opacity-50"
                        >
                            {loading ? "Memproses..." : "Daftar"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-[#f9e2d2]/30" />
                        <span className="text-sm text-[#f9e2d2]">
                            Atau lanjutkan dengan
                        </span>
                        <div className="flex-1 h-px bg-[#f9e2d2]/30" />
                    </div>

                    {/* Google */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-[#b1451a] text-white rounded-xl py-3 hover:bg-[#8e3715] transition shadow-md border border-white/10"
                    >
                        <FcGoogle size={22} />
                        <span className="font-medium">
                            Daftar dengan Google
                        </span>
                    </button>

                    {/* Footer */}
                    <p className="text-sm mt-8 text-[#f9e2d2] text-center">
                        Sudah punya akun?{" "}
                        <Link
                            to="/masuk"
                            className="text-white font-semibold hover:underline"
                        >
                            Masuk
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Daftar;
