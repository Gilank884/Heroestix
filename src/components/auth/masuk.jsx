import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";

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

            const getBaseDomain = () => {
                if (host === "localhost" || host === "127.0.0.1") return host;
                if (host.endsWith(".localhost")) return "localhost";
                return "heroestix.com";
            };
            const baseDomain = getBaseDomain();
            const isBaseDomain = host === baseDomain;

            // Redirection logic: Only redirect if on a DIFFERENT/WRONG subdomain
            // If on base domain (home), STAY at home.
            if (profileRole === "creator") {
                if (host.startsWith("dev.") || (!host.startsWith("creator.") && !isBaseDomain)) {
                    const hash = isLocalhost ? `#access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}` : "";
                    window.location.href = `http://creator.${baseDomain}${port}/${hash}`;
                } else {
                    navigate("/");
                }
            } else if (profileRole === "developer") {
                if (host.startsWith("creator.") || (!host.startsWith("dev.") && !isBaseDomain)) {
                    const hash = isLocalhost ? `#access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}` : "";
                    window.location.href = `http://dev.${baseDomain}${port}/${hash}`;
                } else {
                    navigate("/");
                }
            } else if (profileRole === "user" && (host.startsWith("creator.") || host.startsWith("dev."))) {
                window.location.href = `http://${baseDomain}${port}/`;
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

    // CENTERED LAYOUT (For Creator / Dev)
    if (role === "creator" || role === "developer") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative z-10">
                    {/* Background Blobs */}
                    <div className="absolute top-0 -left-6 w-96 h-96 bg-orange-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse" />
                    <div className="absolute bottom-0 -right-6 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse delay-700" />

                    <div className="relative z-10 w-full">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="mb-6 inline-block">
                                <span className="px-5 py-2 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                                    {role} Portal
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-white mb-3 tracking-tighter italic uppercase">
                                Heroestix <span className="text-orange-500">Core</span>
                            </h1>
                            <p className="text-slate-400 font-medium">
                                Authentication for high-impact {role}s
                            </p>
                        </div>

                        {/* Error */}
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm px-5 py-4 rounded-2xl mb-8 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {errorMsg}
                            </div>
                        )}

                        {/* FORM */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">Environment Email</label>
                                <input
                                    type="email"
                                    placeholder="yourname@heroestix.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all placeholder:text-slate-600 font-bold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-4">Security Passkey</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-2xl px-6 py-4 bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white outline-none transition-all placeholder:text-slate-600 font-bold pr-14"
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

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-cyan-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-900/30 active:scale-[0.98] disabled:opacity-50 mt-4"
                            >
                                {loading ? "Synchronizing..." : "Initialize Session"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-8">
                            <div className="flex-1 h-px bg-slate-800" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">
                                Or Continue Identity
                            </span>
                            <div className="flex-1 h-px bg-slate-800" />
                        </div>

                        {/* Google */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-slate-800 border border-slate-700 text-white rounded-2xl py-4 font-bold hover:bg-slate-700 transition-all active:scale-[0.98]"
                        >
                            <FcGoogle size={22} />
                            <span>Continue Identity</span>
                        </button>

                        {/* Footer */}
                        {role === "creator" && (
                            <p className="text-sm mt-10 text-slate-500 text-center font-bold">
                                New here?{" "}
                                <Link
                                    to="/daftar"
                                    className="text-cyan-400 hover:text-cyan-300 hover:underline underline-offset-4"
                                >
                                    Join Core Network
                                </Link>
                            </p>
                        )}
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
