import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, Link } from "react-router-dom";

const Masuk = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // 🔐 Login Email & Password
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
            navigate("/profile");
        }

        setLoading(false);
    };

    // 🔐 Login Google
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                {/* Title */}
                <h1 className="text-2xl font-bold text-center mb-2">
                    Masuk
                </h1>
                <p className="text-center text-gray-500 mb-6">
                    Masuk ke akun HaiTicket kamu
                </p>

                {/* ❌ Error */}
                {errorMsg && (
                    <p className="text-sm text-red-500 mb-4 text-center">
                        {errorMsg}
                    </p>
                )}

                {/* 🔵 FORM LOGIN */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="password"
                        placeholder="Sandi"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? "Memproses..." : "Masuk"}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-400">atau</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* 🔴 GOOGLE */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 hover:bg-gray-100 transition"
                >
                    <FcGoogle size={22} />
                    <span className="font-medium">
                        Masuk dengan Google
                    </span>
                </button>

                {/* Footer */}
                <p className="text-sm text-gray-500 text-center mt-6">
                    Belum punya akun?{" "}
                    <Link
                        to="/daftar"
                        className="text-blue-600 font-medium hover:underline"
                    >
                        Daftar
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Masuk;
