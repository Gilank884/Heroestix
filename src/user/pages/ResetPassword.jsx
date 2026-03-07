import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import RegisterNav from "../../components/Layout/RegisterNav";
import { motion } from "framer-motion";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isSessionActive, setIsSessionActive] = useState(false);

    useEffect(() => {
        // Check if we have a session or if we are in recovery mode
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsSessionActive(true);
            }

            // Clean up the hash after Supabase has processed it
            if (window.location.hash) {
                window.history.replaceState(null, null, window.location.pathname);
            }
        };
        checkSession();
    }, []);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        if (password !== confirmPassword) {
            setErrorMsg("Password tidak cocok.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            setSuccessMsg("Password berhasil diperbarui. Mengalihkan ke halaman masuk...");
            setTimeout(() => {
                navigate("/masuk");
            }, 3000);
        }
        setLoading(false);
    };

    return (
        <>
            <RegisterNav role="user" />
            <motion.main
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.9,
                    ease: [0.22, 1, 0.36, 1],
                }}
                className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 px-4 relative overflow-hidden"
            >
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
                </div>

                <div className="w-full max-w-[420px] relative z-10">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm">
                        <div className="text-center mb-10">
                            <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
                                Atur Ulang Kata Sandi
                            </h1>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                                Silakan masukkan kata sandi baru anda
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8">
                                {errorMsg}
                            </div>
                        )}
                        {successMsg && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[12px] px-4 py-3 rounded-xl mb-8">
                                {successMsg}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Kata Sandi Baru</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium pr-12"
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
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Konfirmasi Kata Sandi</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 mt-4"
                            >
                                {loading ? "Memperbarui..." : "Perbarui Kata Sandi"}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.main>
        </>
    );
}
