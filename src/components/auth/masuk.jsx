import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import { getBaseDomain, getSubdomainUrl } from "../../lib/navigation";
import useAuthStore from "../../auth/useAuthStore";


const Masuk = ({ role = "user" }) => {
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(window.location.search);
    const urlError = queryParams.get("error");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(urlError === "unregistered" ? "Akun anda belum registrasi. Silahkan daftar terlebih dahulu." : "");
    const [successMsg, setSuccessMsg] = useState("");
    const [view, setView] = useState("login"); // login, forgot
    const { user: storeUser, isAuthenticated, login, isChecking } = useAuthStore();

    // Redirection is now handled by App.jsx or the Guards. 
    // We removed the auto-navigate useEffect to prevent recursion loops.

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        console.log("Attempting manual login for email:", email);
        localStorage.setItem("auth_mode", role);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error("Login error:", authError.message);
            setErrorMsg(authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            console.log("Logged in successfully. Fetching profile for user:", authData.user.id);
            const { data: profile, error: profileErr } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", authData.user.id)
                .single();

            const profileRole = profile?.role || "user";
            console.log(`[Masuk] Login successful. User ID: ${authData.user.id}, Detected Role from DB: ${profileRole}`);

            if (profileErr) {
                console.error("Error fetching profile after login:", profileErr.message);
                navigate("/");
                setLoading(false);
                return;
            }

            const host = window.location.hostname;
            const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");

            // SYNC STORE LOCALLY FIRST
            login(authData.user, authData.session.access_token, profileRole);

            // Redirection is now handled centrally by App.jsx or explicitly here ONLY if it's a cross-subdomain bridge
            if (profileRole === "creator" && role === "creator") {
                const target = getSubdomainUrl("creator", isLocalhost ? `#access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}` : "");
                console.log(`[Masuk] Creator login detected via Creator Gateway. Redirecting to: ${target}`);
                window.location.href = target;
            } else if (profileRole === "developer" && role === "developer") {
                const target = getSubdomainUrl("dev", isLocalhost ? `#access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}` : "");
                console.log(`[Masuk] Developer login detected via Dev Gateway. Redirecting to: ${target}`);
                window.location.href = target;
            } else {
                const target = getSubdomainUrl(null, isLocalhost ? `#access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}` : "");
                const targetOrigin = new URL(target).origin;
                if (window.location.origin !== targetOrigin) {
                    console.log(`[Masuk] Login via ${role} gateway. Redirecting to base domain: ${target}`);
                    window.location.href = target;
                } else {
                    console.log(`[Masuk] Login via ${role} gateway on base domain. App.jsx will handle navigation.`);
                }
            }
        }
        setLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "https://heroestix.com/reset-password",
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            setSuccessMsg("Tautan reset password telah dikirim ke email anda.");
        }
        setLoading(false);
    };


    const isInternalPortal = role === "creator" || role === "developer";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 px-4 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className="w-full max-w-[420px] relative z-10">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-medium uppercase tracking-widest mb-6">
                            <div className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                            {isInternalPortal ? `${role.toUpperCase()} ACCESS` : "Hello Heroes"}
                        </div>
                        <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
                            {view === "forgot" ? "Lupa Kata Sandi" : (isInternalPortal ? "Masuk Portal" : "Selamat Datang")}
                        </h1>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                            {view === "forgot" ? "Masukkan email anda untuk menerima tautan reset password" : "Silakan masuk menggunakan akun Heroestix Anda"}
                        </p>
                    </div>

                    {/* Feedback Messages */}
                    {errorMsg && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
                            <span className="font-medium">{errorMsg}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
                            <span className="font-medium">{successMsg}</span>
                        </div>
                    )}

                    {/* FORMS */}
                    {view === "login" ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">Sandi</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setView("forgot");
                                            setErrorMsg("");
                                            setSuccessMsg("");
                                        }}
                                        className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-widest"
                                    >
                                        Lupa?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-12"
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
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center"
                            >
                                {loading ? "Menghubungkan..." : "Masuk Sekarang"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center"
                            >
                                {loading ? "Mengirim Tautan..." : "Kirim Tautan Reset"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setView("login");
                                    setErrorMsg("");
                                    setSuccessMsg("");
                                }}
                                className="w-full text-[12px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 transition-colors py-2 uppercase tracking-widest"
                            >
                                Kembali ke Masuk
                            </button>
                        </form>
                    )}

                </div>

                <div className="mt-8 text-center space-y-4">
                    {!isInternalPortal ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Belum punya akun?{" "}
                            <Link
                                to="/daftar"
                                className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-4"
                            >
                                Daftar Sekarang
                            </Link>
                        </p>
                    ) : null}
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">
                        &copy; 2024 Heroestix Ticket.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Masuk;
