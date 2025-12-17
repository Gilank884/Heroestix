import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, Link } from "react-router-dom";

const Masuk = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // 🔐 Login Email & Password (LOGIC ASLI)
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            navigate("/");
        }

        setLoading(false);
    };

    // 🔐 Login Google (LOGIC ASLI)
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + "/profile",
            },
        });

        if (error) {
            console.error("Google login error:", error.message);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ================= LEFT (FORM) ================= */}
            <div className="w-full md:w-[30%] flex items-center justify-center bg-gradient-to-b from-blue-950 to-blue-900 px-8">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-8 mt-10">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Masuk
                        </h1>
                        <p className="text-blue-200 text-sm">
                            Masuk ke akun Hai Ticket kamu
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
                                bg-blue-950 text-white
                                focus:ring-2 focus:ring-white outline-none
                                autofill:bg-blue-950
                            "
                            style={{
                                WebkitBoxShadow:
                                    "0 0 0 1000px rgb(23 37 84) inset",
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
                                bg-blue-950 text-white
                                focus:ring-2 focus:ring-white outline-none
                                autofill:bg-blue-950
                            "
                            style={{
                                WebkitBoxShadow:
                                    "0 0 0 1000px rgb(23 37 84) inset",
                                WebkitTextFillColor: "white",
                            }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-950 text-white py-3 rounded-xl font-semibold hover:bg-blue-900 transition disabled:opacity-50"
                        >
                            {loading ? "Memproses..." : "Masuk"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-blue-400/30" />
                        <span className="text-sm text-blue-200">
                            atau lanjutkan dengan
                        </span>
                        <div className="flex-1 h-px bg-blue-400/30" />
                    </div>

                    {/* Google */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-blue-950 text-white rounded-xl py-3 hover:bg-blue-900 transition shadow-md"
                    >
                        <FcGoogle size={22} />
                        <span className="font-medium">
                            Masuk dengan Google
                        </span>
                    </button>

                    {/* Footer */}
                    <p className="text-sm mt-8 text-blue-200 text-center">
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
                            alt="Hai Ticket Banner"
                            className="w-full h-[220px] object-cover"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Masuk;
