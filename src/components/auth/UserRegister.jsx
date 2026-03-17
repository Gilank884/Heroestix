import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FiEye, FiEyeOff, FiMusic, FiStar, FiCalendar, FiActivity } from "react-icons/fi";
import { Link } from "react-router-dom";
import { RxCheckCircled } from "react-icons/rx"; // Import added

const UserRegister = () => {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Form State
    const [form, setForm] = useState({
        nama: "",
        email: "",
        password: "",
        confirm_password: "",
        tanggal_lahir: "",
        termsAgreed: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({
            ...form,
            [e.target.name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        // Basic Validation
        if (!form.nama || !form.email || !form.password || !form.confirm_password || !form.tanggal_lahir) {
            setErrorMsg("Mohon lengkapi semua data.");
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

        try {
            // Sign Up
            const { data: authData, error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    emailRedirectTo: window.location.origin + "/",
                    data: {
                        full_name: form.nama,
                        nama: form.nama, // Keeping 'nama' for backward compatibility if used elsewhere
                        tanggal_lahir: form.tanggal_lahir,
                        role: 'user',
                        provider: 'email'
                    },
                },
            });

            console.log("DEBUG REGISTRATION:", { authData, error });

            if (error) throw error;

            if (authData.user) {
                // IMPORTANT: If identities is empty/null, the user ALREADY EXISTS.
                if (authData.user.identities && authData.user.identities.length === 0) {
                    setErrorMsg("Email ini sudah terdaftar. Silakan Login atau gunakan email berbeda.");
                    setLoading(false);
                    return;
                }

                // DIRECT REGISTER: No OTP. 
                await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: form.email,
                    full_name: form.nama,
                    role: 'user',
                });

                alert("Pendaftaran berhasil! Silahkan Masuk.");

                // Clear session to force login logic if needed, or just redirect
                await supabase.auth.signOut();

                window.location.href = "/masuk";
            }

        } catch (err) {
            console.error("Registration Error:", err);
            setErrorMsg(err.message || "Terjadi kesalahan saat mendaftar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-start justify-center bg-[#F8FAFC] dark:bg-slate-950 px-4 pt-24 pb-12 md:pt-32 md:pb-20 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className="w-full max-w-[850px] flex flex-col md:flex-row bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden relative z-10 transition-all duration-500 hover:shadow-blue-500/10">

                {/* Left Card: Registration Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 order-2 md:order-1">
                    <div className="max-w-[340px] mx-auto w-full">
                        {/* Header for Form */}
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4">
                                Halo Heroes !
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Daftar Akun
                            </h1>
                        </div>

                        {errorMsg && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-[12px] px-4 py-3 rounded-2xl mb-6 flex items-center gap-3 animate-shake">
                                <span className="font-medium">{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    name="nama"
                                    placeholder="Masukkan Nama Lengkap"
                                    value={form.nama}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Lahir</label>
                                    <input
                                        type="date"
                                        name="tanggal_lahir"
                                        value={form.tanggal_lahir}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="email@anda.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Kata Sandi</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-12"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Konfirmasi Sandi</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirm_password"
                                        placeholder="••••••••"
                                        value={form.confirm_password}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-12"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                                        {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div
                                className={`flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border cursor-pointer transition-all ${errorMsg && !form.termsAgreed ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/10 animate-shake' : 'border-slate-100 dark:border-slate-700'
                                    }`}
                                onClick={() => setForm({ ...form, termsAgreed: !form.termsAgreed })}
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.termsAgreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                                    {form.termsAgreed && <RxCheckCircled className="text-white text-xs" />}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Saya menyetujui <Link target="_blank" to="/terms" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Syarat & Ketentuan</Link> Heroestix.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.2)] active:scale-[0.98] mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : "Daftar Sekarang"}
                            </button>

                            <p className="text-center text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-6">
                                Sudah punya akun?{" "}
                                <Link to="/masuk" className="text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4 ml-1">Masuk</Link>
                            </p>
                        </form>
                    </div>
                </div>

                {/* Right Card: Welcome & Character */}
                <div className="hidden md:flex w-1/2 bg-zinc-100 p-10 relative flex-col justify-between overflow-hidden order-1 md:order-2">
                    {/* Minimal Light Decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-200/50 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="absolute bottom-4 left-4 w-48 h-48 bg-blue-100/30 rounded-full -ml-10 -mb-10 blur-2xl" />

                    <div className="relative z-10 text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-md text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border border-zinc-200">
                            Ayo Bergabung
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-2">
                            Mulai <br />
                            <span className="text-blue-600">Petualanganmu!</span>
                        </h2>
                    </div>

                    {/* Floating Icons Background */}
                    <div className="absolute inset-0 z-0 overflow-hidden opacity-20 pointer-events-none">
                        <FiMusic className="absolute top-[25%] right-[15%] text-blue-400 text-4xl rotate-12" />
                        <FiStar className="absolute top-[65%] left-[10%] text-blue-300 text-3xl -rotate-12" />
                        <FiCalendar className="absolute bottom-[20%] right-[10%] text-blue-400 text-2xl rotate-6" />
                        <FiActivity className="absolute top-[15%] left-[20%] text-blue-300 text-5xl opacity-50 -rotate-45" />
                    </div>

                    {/* Static Character Image (Ultra Large) */}
                    <div className="relative z-10 -mt-10 md:-mt-20 flex justify-center">
                        <img
                            src="/assets/character_signup.png"
                            alt="Character Register"
                            className="w-full max-w-[580px] h-auto drop-shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                        />
                    </div>

                    {/* Footer Left */}
                    <div className="relative z-10 mt-6 text-right">
                        <p className="text-slate-400/60 dark:text-slate-500/60 text-[10px] font-semibold uppercase tracking-widest">
                            &copy; 2025 Heroestix Official.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default UserRegister;
