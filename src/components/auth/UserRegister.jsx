import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const UserRegister = () => {
    const [step, setStep] = useState(1);
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
    const [otpCode, setOtpCode] = useState("");

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({
            ...form,
            [e.target.name]: value,
        });
    };

    const handleGoogleLogin = async () => {
        localStorage.setItem("auth_mode", "register");
        localStorage.setItem("auth_role", "user");
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + "/",
            },
        });
        if (error) console.error("Google login error:", error.message);
    };

    const handleStep1Submit = async (e) => {
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

                setStep(2); // Go to OTP
            }

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

        const { data, error } = await supabase.auth.verifyOtp({
            email: form.email,
            token: otpCode,
            type: 'signup'
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            // Create entries in profiles table
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email: form.email,
                full_name: form.nama,
                role: 'user',
            });

            alert("Verifikasi berhasil! Akun Anda telah aktif, Silahkan Masuk.");

            // Clear session to force login
            await supabase.auth.signOut();

            window.location.href = "/masuk";
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
            alert("Kode OTP baru telah dikirim ke email Anda. Silakan cek Inbox atau Spam.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-20 px-4 relative overflow-hidden flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    {/* Header Steps */}
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                        <div className="flex items-center justify-between max-w-[200px] mx-auto mb-8 relative">
                            {/* Line */}
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10" />

                            {/* Step 1 Indicator */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border border-slate-200'}`}>1</div>

                            {/* Step 2 Indicator */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border border-slate-200'}`}>2</div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                                {step === 1 && "Daftar Akun"}
                                {step === 2 && "Verifikasi Email"}
                            </h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {step === 1 && "Nikmati kemudahan beli tiket konser & event."}
                                {step === 2 && `Masukkan OTP yang dikirim ke ${form.email}`}
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
                                <span className="font-bold">{errorMsg}</span>
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleStep1Submit} className="space-y-5">
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
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email</label>
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
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Konfirmasi Kata Sandi</label>
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

                                {/* Terms Checkbox */}
                                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer" onClick={() => setForm({ ...form, termsAgreed: !form.termsAgreed })}>
                                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.termsAgreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                        {form.termsAgreed ? (
                                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        I agree to the <Link target="_blank" to="/terms-of-service" className="text-blue-600 font-bold hover:underline">Terms and Conditions</Link> and <Link target="_blank" to="/privacy" className="text-blue-600 font-bold hover:underline">Privacy Policy</Link> applicable at Heroestix.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-4 flex items-center justify-center disabled:opacity-50"
                                >
                                    {loading ? "Memproses..." : "Buat Akun Sekarang"}
                                </button>

                                <div className="flex items-center gap-4 w-full my-6">
                                    <div className="flex-1 h-px bg-slate-100" />
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">atau</span>
                                    <div className="flex-1 h-px bg-slate-100" />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-900 rounded-2xl py-3.5 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                                >
                                    <FcGoogle size={20} />
                                    <span>Lanjut dengan Google</span>
                                </button>

                                <p className="text-center text-[13px] text-slate-500 font-bold mt-6">
                                    Sudah punya akun?{" "}
                                    <Link to="/masuk" className="text-blue-600 hover:underline underline-offset-4">Masuk</Link>
                                </p>
                            </form>
                        )}

                        {step === 2 && (
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

export default UserRegister;
