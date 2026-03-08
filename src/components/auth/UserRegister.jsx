import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FiEye, FiEyeOff } from "react-icons/fi";
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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 py-20 px-4 relative overflow-hidden flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    {/* Header Steps */}
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-center">
                            <h2 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight mb-2">
                                Daftar Akun
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Nikmati kemudahan beli tiket konser & event.
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
                                <span className="font-medium">{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    name="nama"
                                    placeholder="Sesuai ID"
                                    value={form.nama}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Tanggal Lahir</label>
                                <input
                                    type="date"
                                    name="tanggal_lahir"
                                    value={form.tanggal_lahir}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium text-slate-500 dark:text-slate-400"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="email@anda.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Kata Sandi</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-12"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Konfirmasi Kata Sandi</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirm_password"
                                        placeholder="••••••••"
                                        value={form.confirm_password}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-12"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
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
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    I agree to the <Link target="_blank" to="/terms" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Terms and Conditions</Link> and <Link target="_blank" to="/privacy" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Privacy Policy</Link> applicable at Heroestix.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-4 flex items-center justify-center disabled:opacity-50"
                            >
                                {loading ? "Memproses..." : "Buat Akun Sekarang"}
                            </button>

                            <p className="text-center text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-6">
                                Sudah punya akun?{" "}
                                <Link to="/masuk" className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-4">Masuk</Link>
                            </p>
                        </form>
                    </div>
                </div>
                <p className="mt-8 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-[0.2em]">
                    &copy; 2024 Heroestix Ticket &middot; Terms Applied
                </p>
            </div>
        </div>
    );
};

export default UserRegister;
