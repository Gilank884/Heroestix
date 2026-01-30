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
            const baseDomain = getBaseDomain();
            const isBaseDomain = host === baseDomain;

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

    const handleGoogleLogin = async () => {
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

    const isInternalPortal = role === "creator" || role === "developer";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className="w-full max-w-[420px] relative z-10">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
                            <div className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
                            {isInternalPortal ? `${role.toUpperCase()} ACCESS` : "Beli Tiket Event"}
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {isInternalPortal ? "Masuk Portal" : "Selamat Datang"}
                        </h1>
                        <p className="text-[13px] text-slate-500 font-medium mt-1">
                            Silakan masuk menggunakan akun Heroestix Anda
                        </p>
                    </div>

                    {/* Error */}
                    {errorMsg && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
                            <span className="font-bold">{errorMsg}</span>
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email</label>
                            <input
                                type="email"
                                placeholder="nama@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sandi</label>
                                <button type="button" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">Lupa?</button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400 pr-12"
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
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center"
                        >
                            {loading ? "Menghubungkan..." : "Masuk Sekarang"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Atau</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    {/* Google */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-900 rounded-2xl py-3.5 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                    >
                        <FcGoogle size={20} />
                        <span>Google</span>
                    </button>
                </div>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm text-slate-500 font-bold">
                        Belum punya akun?{" "}
                        <Link
                            to="/daftar"
                            className="text-blue-600 hover:underline underline-offset-4"
                        >
                            Daftar Sekarang
                        </Link>
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                        &copy; 2024 Heroestix Ticket.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Masuk;
