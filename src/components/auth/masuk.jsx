import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import { getBaseDomain, getSubdomainUrl } from "../../lib/navigation";


const Masuk = ({ role = "user" }) => {
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(window.location.search);
    const urlError = queryParams.get("error");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(urlError === "unregistered" ? "Akun anda belum registrasi. Silahkan daftar terlebih dahulu." : "");

    // 🔄 Auto-redirect if already logged in (Sync with subdomain)
    React.useEffect(() => {
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                if (profile) {
                    const profileRole = profile.role;
                    const host = window.location.hostname;

                    // Already on the right place? Redirect to dashboard
                    if (profileRole === "creator" && host.startsWith("creator.")) {
                        navigate("/");
                    } else if (profileRole === "developer" && host.startsWith("dev.")) {
                        navigate("/");
                    }
                }
            }
        };
        checkExistingSession();
    }, [navigate]);

    // 🔐 Login Email & Password (LOGIC ASLI)
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        localStorage.setItem("auth_mode", "login");

        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // Fetch profile to get role
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", authData.user.id)
                .single();

            if (profileError) {
                console.error("Error fetching profile:", profileError.message);
                navigate("/");
                setLoading(false);
                return;
            }

            const profileRole = profile.role;
            const host = window.location.hostname;
            const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
            const port = window.location.port ? `:${window.location.port}` : "";

            const baseDomain = getBaseDomain();
            const isBaseDomain = host === baseDomain;

            // Redirection logic: Only redirect if on a DIFFERENT/WRONG subdomain
            // If on base domain (home), STAY at home.
            if (profileRole === "creator") {
                if (host.startsWith("dev.") || (!host.startsWith("creator.") && !isBaseDomain)) {
                    window.location.href = getSubdomainUrl("creator", isLocalhost ? `#access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}` : "");
                } else {
                    navigate("/");
                }
            } else if (profileRole === "developer") {
                if (host.startsWith("creator.") || (!host.startsWith("dev.") && !isBaseDomain)) {
                    window.location.href = getSubdomainUrl("dev", isLocalhost ? `#access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}` : "");
                } else {
                    navigate("/");
                }
            } else if (profileRole === "user" && (host.startsWith("creator.") || host.startsWith("dev."))) {
                window.location.href = getSubdomainUrl(null);
            } else {
                navigate("/");
            }
        }

        setLoading(false);
    };

    // 🔐 Login Google (LOGIC ASLI)
    const handleGoogleLogin = async () => {
        // If we are on a specific portal (creator/dev), treat as register to ensure profile has correct role
        if (role !== "user") {
            localStorage.setItem("auth_mode", "register");
            localStorage.setItem("auth_role", role);
        } else {
            localStorage.setItem("auth_mode", "login");
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + "/",
            },
        });

        if (error) {
            console.error("Google login error:", error.message);
        }
    };

    // REFINED COMPACT & PROFESSIONAL LAYOUT
    if (role === "creator" || role === "developer") {
        const isCreator = role === "creator";

        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
                <div className="w-full max-w-[400px]">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm relative overflow-hidden">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <h1 className="text-xl font-bold text-slate-900 mb-1.5">
                                {isCreator ? "Creator Portal" : "Dev Console"}
                            </h1>
                            <p className="text-[13px] text-slate-500 font-medium">
                                Masuk ke dashboard pengelolaan Heroestix
                            </p>
                        </div>

                        {/* Error */}
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3 animate-in fade-in duration-300">
                                <div className="w-1 h-1 rounded-full bg-red-600" />
                                <span className="font-semibold">{errorMsg}</span>
                            </div>
                        )}

                        {/* FORM */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-0.5">Alamat Email</label>
                                <input
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 font-medium"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-0.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kata Sandi</label>
                                    <button type="button" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-tight">Lupa sandi?</button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 font-medium pr-12"
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
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 mt-4 h-12 flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Menghubungkan...</span>
                                    </div>
                                ) : "Masuk Sekarang"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-8">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                Atau
                            </span>
                            <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        {/* Google */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 rounded-xl py-3 text-[13px] font-bold hover:bg-slate-50 transition-all active:scale-[0.98] h-12"
                        >
                            <FcGoogle size={20} />
                            <span>Lanjutkan dengan Google</span>
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        {isCreator && (
                            <p className="text-[13px] text-slate-500 font-medium">
                                Belum terdaftar?{" "}
                                <Link
                                    to="/daftar"
                                    className="text-blue-600 font-bold hover:underline underline-offset-4"
                                >
                                    Gabung Mitra Heroestix
                                </Link>
                            </p>
                        )}
                        <p className="mt-6 text-[11px] text-slate-400 font-medium">
                            &copy; 2024 Heroestix. Platform Manajemen Tiket Modern.
                        </p>
                    </div>
                </div>
            </div>
        );
    }


    // ORIGINAL SPLIT LAYOUT (For regular Users)
    return (
        <div className="min-h-screen flex">
            {/* ================= LEFT (FORM) ================= */}
            <div className="w-full md:w-[30%] flex items-center justify-center bg-gradient-to-b from-[#b1451a] to-[#8e3715] px-8">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-8 mt-10 text-center">
                        <h1 className="text-3xl font-bold text-white mb-2 italic uppercase tracking-tighter">
                            Heroestix Login
                        </h1>
                        <p className="text-[#f9e2d2] text-sm">
                            Masuk ke akun Heroestix kamu
                        </p>
                    </div>

                    {/* Error */}
                    {errorMsg && (
                        <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-lg mb-5">
                            {errorMsg}
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="
                                w-full rounded-xl px-4 py-3
                                bg-[#b1451a] text-white
                                focus:ring-2 focus:ring-white outline-none
                                autofill:bg-[#b1451a] border border-white/10
                            "
                            style={{
                                WebkitBoxShadow:
                                    "0 0 0 1000px rgb(177 69 26) inset",
                                WebkitTextFillColor: "white",
                            }}
                        />

                        <input
                            type="password"
                            placeholder="Sandi"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="
                                w-full rounded-xl px-4 py-3
                                bg-[#b1451a] text-white
                                focus:ring-2 focus:ring-white outline-none
                                autofill:bg-[#b1451a] border border-white/10
                            "
                            style={{
                                WebkitBoxShadow:
                                    "0 0 0 1000px rgb(177 69 26) inset",
                                WebkitTextFillColor: "white",
                            }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#8e3715] text-white py-3 rounded-xl font-semibold hover:bg-[#5e240a] transition disabled:opacity-50"
                        >
                            {loading ? "Memproses..." : "Masuk"}
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
                            Masuk dengan Google
                        </span>
                    </button>

                    {/* Footer */}
                    <p className="text-sm mt-8 text-[#f9e2d2] text-center">
                        Belum punya akun?{" "}
                        <Link
                            to="/daftar"
                            className="text-white font-semibold hover:underline"
                        >
                            Daftar
                        </Link>
                    </p>
                </div>
            </div>

            {/* ================= RIGHT (IMAGE + GRID) ================= */}
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

                {/* Banner */}
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
        </div>
    );
};

export default Masuk;
