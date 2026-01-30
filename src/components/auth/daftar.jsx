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

    // REFINED COMPACT & PROFESSIONAL REGISTRATION
    if (role === "creator") {
        return (
            <div className="min-h-screen bg-[#F8FAFC] py-24 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Mitra Creator</h1>
                        <p className="text-[13px] text-slate-500 font-medium max-w-sm mx-auto">
                            Lengkapi informasi di bawah untuk mulai mengelola event Anda secara profesional.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-8 md:p-12">
                            {/* Error Alert */}
                            {errorMsg && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                    <span className="font-semibold">{errorMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleEmailRegister} className="space-y-10">
                                {/* Section 1: Akun Dasar */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">1</div>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Informasi Akun</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                name="nama"
                                                placeholder="Sesuai kartu identitas"
                                                value={form.nama}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all font-medium placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Alamat Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="email@bisnis.com"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all font-medium placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Kata Sandi</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    placeholder="Minimal 8 karakter"
                                                    value={form.password}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all font-medium placeholder:text-slate-400 pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Konfirmasi Sandi</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    name="confirm_password"
                                                    placeholder="Ulangi kata sandi"
                                                    value={form.confirm_password}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all font-medium placeholder:text-slate-400 pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Tanggal Lahir</label>
                                            <input
                                                type="date"
                                                name="tanggal_lahir"
                                                value={form.tanggal_lahir}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all font-medium text-slate-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Informasi Brand & Finansial */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">2</div>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Detail Bisnis</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Nama Brand / EO</label>
                                            <input
                                                type="text"
                                                name="brand_name"
                                                placeholder="Nama yang akan tertera bagi pembeli"
                                                value={form.brand_name}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all font-medium placeholder:text-slate-400"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Nama Bank</label>
                                                <input
                                                    type="text"
                                                    name="bank_name"
                                                    placeholder="Contoh: BCA, Mandiri"
                                                    value={form.bank_name}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all font-medium placeholder:text-slate-400"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Nomor Rekening</label>
                                                <input
                                                    type="text"
                                                    name="bank_account"
                                                    placeholder="Untuk keperluan pencairan dana"
                                                    value={form.bank_account}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all font-medium placeholder:text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-6">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 h-14 flex items-center justify-center"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Mendaftarkan...</span>
                                            </div>
                                        ) : "Daftar sebagai Mitra"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 rounded-xl py-3.5 text-xs font-bold hover:bg-slate-50 transition-all active:scale-[0.98] h-14"
                                    >
                                        <FcGoogle size={22} />
                                        <span>Daftar dengan Akun Google</span>
                                    </button>

                                    <p className="text-[13px] text-slate-500 font-medium">
                                        Sudah punya akun?{" "}
                                        <Link to="/masuk" className="text-blue-600 font-bold hover:underline underline-offset-4 ml-0.5">Masuk Portal</Link>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-[11px] text-slate-400 font-medium">
                        &copy; 2024 Heroestix. Dengan mendaftar, Anda menyetujui Ketentuan Layanan kami.
                    </p>
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
