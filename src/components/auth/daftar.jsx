import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";

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

    if (role === "creator") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-20 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 -left-20 w-[30rem] h-[30rem] bg-orange-600 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-pulse" />
                <div className="absolute bottom-0 -right-20 w-[30rem] h-[30rem] bg-cyan-600 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-pulse delay-1000" />

                <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 shadow-2xl relative z-10">
                    <div className="relative z-10 w-full">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="mb-6 inline-block">
                                <span className="px-5 py-2 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                                    Creator Enrollment
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter italic uppercase">
                                Heroestix <span className="text-orange-500">Core</span>
                            </h1>
                            <p className="text-slate-400 font-bold max-w-md mx-auto">
                                Join the elite network of event creators and high-impact organizers
                            </p>
                        </div>

                        {/* Error */}
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-100 text-sm px-6 py-4 rounded-[1.5rem] mb-8 flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="font-bold">{errorMsg}</span>
                            </div>
                        )}

                        {/* FORM */}
                        <form onSubmit={handleEmailRegister} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Full Identity</label>
                                    <input
                                        type="text"
                                        name="nama"
                                        placeholder="Full legal name"
                                        value={form.nama}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all font-bold placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Environment Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="yourname@heroestix.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all font-bold placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Security Passkey</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="••••••••"
                                            value={form.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all font-bold placeholder:text-slate-600 pr-14"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                                        >
                                            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Confirm Security Passkey</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirm_password"
                                            placeholder="••••••••"
                                            value={form.confirm_password}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all font-bold placeholder:text-slate-600 pr-14"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                                        >
                                            {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Birth Date Reference</label>
                                <input
                                    type="date"
                                    name="tanggal_lahir"
                                    value={form.tanggal_lahir}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all font-bold text-slate-400"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-800 mt-8">
                                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-8 flex items-center gap-3">
                                    <span className="w-10 h-[2px] bg-orange-500"></span>
                                    Registry Information
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Brand / Organization Architecture</label>
                                        <input
                                            type="text"
                                            name="brand_name"
                                            placeholder="Your brand entity"
                                            value={form.brand_name}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all font-bold placeholder:text-slate-600"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Bank Institution</label>
                                            <input
                                                type="text"
                                                name="bank_name"
                                                placeholder="BCA / Mandiri / etc"
                                                value={form.bank_name}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all font-bold placeholder:text-slate-600"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Account Terminal</label>
                                            <input
                                                type="text"
                                                name="bank_account"
                                                placeholder="Account sequence"
                                                value={form.bank_account}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all font-bold placeholder:text-slate-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-cyan-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-900/40 active:scale-[0.98] disabled:opacity-50 mt-10"
                            >
                                {loading ? "Broadcasting Registry..." : "Initialize Creator Account"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-12">
                            <div className="flex-1 h-px bg-slate-800" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">
                                Or Authenticate via Network
                            </span>
                            <div className="flex-1 h-px bg-slate-800" />
                        </div>

                        {/* Google */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-slate-800 border border-slate-700 text-white rounded-2xl py-4 font-bold hover:bg-slate-700 transition-all active:scale-[0.98]"
                        >
                            <FcGoogle size={22} />
                            <span>Continue with Identity Proxy</span>
                        </button>

                        {/* Footer */}
                        <p className="text-sm mt-12 text-slate-500 text-center font-bold">
                            Already part of Core?{" "}
                            <Link
                                to="/masuk"
                                className="text-cyan-400 hover:text-cyan-300 hover:underline underline-offset-4"
                            >
                                Access Terminal
                            </Link>
                        </p>
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
