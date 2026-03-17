import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FiEye, FiEyeOff, FiMusic, FiStar, FiCalendar, FiActivity } from "react-icons/fi";
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
        <div className="min-h-screen flex items-start justify-center bg-[#F8FAFC] dark:bg-slate-950 px-4 pt-24 pb-12 md:pt-32 md:pb-20 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className="w-full max-w-[850px] flex flex-col md:flex-row bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden relative z-10 transition-all duration-500 hover:shadow-blue-500/10">

                {/* Left Card: Welcome & Character */}
                <div className="hidden md:flex w-1/2 bg-zinc-100 p-10 relative flex-col justify-between overflow-hidden">
                    {/* Minimal Light Decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-200/50 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-100/30 rounded-full -ml-10 -mb-10 blur-2xl" />
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-md text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border border-zinc-200">
                            {role === "creator" ? "Creator Portal" : "Halo Heroes !"}
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-2">
                            {role === "creator" ? "Kelola Event" : "Selamat Datang"} <br /> 
                            <span className="text-blue-600">{role === "creator" ? "Lebih Mudah!" : "Kembali!"}</span>
                        </h2>
                    </div>

                    {/* Floating Icons Background */}
                    <div className="absolute inset-0 z-0 overflow-hidden opacity-20 pointer-events-none">
                        {role === "creator" ? (
                            <>
                                <FiActivity className="absolute top-[20%] left-[15%] text-blue-400 text-4xl -rotate-12" />
                                <FiStar className="absolute top-[60%] right-[10%] text-blue-300 text-3xl rotate-12" />
                                <FiCalendar className="absolute bottom-[25%] left-[10%] text-blue-400 text-2xl -rotate-6" />
                                <FiMusic className="absolute top-[10%] right-[20%] text-blue-300 text-5xl opacity-50 rotate-45" />
                            </>
                        ) : (
                            <>
                                <FiMusic className="absolute top-[20%] left-[15%] text-blue-400 text-4xl -rotate-12" />
                                <FiStar className="absolute top-[60%] right-[10%] text-blue-300 text-3xl rotate-12" />
                                <FiCalendar className="absolute bottom-[25%] left-[10%] text-blue-400 text-2xl -rotate-6" />
                                <FiActivity className="absolute top-[10%] right-[20%] text-blue-300 text-5xl opacity-50 rotate-45" />
                            </>
                        )}
                    </div>

                    {/* Static Character Image (Dynamic based on role) */}
                    <div className="relative z-10 -mt-2 md:-mt-4 flex justify-center">
                        <img 
                            src={role === "creator" ? "/assets/character_creator.png" : "/assets/character.png"} 
                            alt="Character" 
                            className="w-full max-w-[260px] h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                        />
                    </div>

                    {/* Footer Left */}
                    <div className="relative z-10 mt-6">
                        <p className="text-slate-400/60 dark:text-slate-500/60 text-[10px] font-semibold uppercase tracking-widest">
                            &copy; 2025 Heroestix Official.
                        </p>
                    </div>
                </div>

                {/* Right Card: Login Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
                    <div className="max-w-[340px] mx-auto w-full">
                        {/* Header Mobile Only */}
                        <div className="md:hidden text-center mb-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-medium uppercase tracking-widest mb-6">
                                <div className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                                {isInternalPortal ? `${role.toUpperCase()} ACCESS` : "Hello Heroes"}
                            </div>
                            <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
                                {view === "forgot" ? "Lupa Kata Sandi" : "Selamat Datang"}
                            </h1>
                        </div>

                        {/* Title for Desktop Form Side */}
                        <div className="hidden md:block mb-8">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {view === "forgot" ? "Reset Password" : "Masuk Akun"}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                                {view === "forgot" ? "Kami akan mengirimkan email reset." : "Masukkan detail login Anda di bawah ini."}
                            </p>
                        </div>

                        {/* Feedback Messages */}
                        {errorMsg && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-[12px] px-4 py-3 rounded-2xl mb-6 flex items-center gap-3 animate-shake">
                                <span className="font-medium">{errorMsg}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[12px] px-4 py-3 rounded-2xl mb-6 flex items-center gap-3">
                                <span className="font-medium">{successMsg}</span>
                            </div>
                        )}

                        {/* FORMS */}
                        {view === "login" ? (
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="nama@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full rounded-2xl px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Kata Sandi</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setView("forgot");
                                                setErrorMsg("");
                                                setSuccessMsg("");
                                            }}
                                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-widest transition-colors"
                                        >
                                            Lupa?
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full rounded-2xl px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.2)] active:scale-[0.98] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : "Masuk Sekarang"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="nama@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full rounded-2xl px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.2)] active:scale-[0.98] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Mengirim...</span>
                                        </>
                                    ) : "Kirim Tautan Reset"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setView("login");
                                        setErrorMsg("");
                                        setSuccessMsg("");
                                    }}
                                    className="w-full text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 transition-colors py-2 uppercase tracking-[0.1em]"
                                >
                                    Kembali ke Masuk
                                </button>
                            </form>
                        )}

                        {!isInternalPortal && (
                            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                                    Belum punya akun?{" "}
                                    <Link
                                        to="/daftar"
                                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4 ml-1"
                                    >
                                        Daftar Gratis
                                    </Link>
                                </p>
                            </div>
                        )}

                        {/* Mobile Footer */}
                        <div className="md:hidden mt-8 text-center">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                                &copy; 2024 Heroestix Ticket.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default Masuk;
