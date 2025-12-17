import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { FcGoogle } from "react-icons/fc";

const Daftar = () => {
    const [form, setForm] = useState({
        nama: "",
        email: "",
        password: "",
        tanggal_lahir: "",
    });

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Handle input
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // 🔐 Daftar dengan Email & Password
    const handleEmailRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    nama: form.nama,
                    tanggal_lahir: form.tanggal_lahir,
                    provider: "email",
                },
            },
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            alert("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
        }

        setLoading(false);
    };

    // 🔐 Login / Daftar dengan Google
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
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
                    Daftar Akun
                </h1>
                <p className="text-center text-gray-500 mb-6">
                    Buat akun untuk melanjutkan ke HaiTicket
                </p>

                {/* ❌ Error */}
                {errorMsg && (
                    <p className="text-sm text-red-500 mb-4 text-center">
                        {errorMsg}
                    </p>
                )}

                {/* 🔵 FORM EMAIL */}
                <form onSubmit={handleEmailRegister} className="space-y-4">
                    <input
                        type="text"
                        name="nama"
                        placeholder="Nama Lengkap"
                        value={form.nama}
                        onChange={handleChange}
                        required
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Sandi"
                        value={form.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="date"
                        name="tanggal_lahir"
                        value={form.tanggal_lahir}
                        onChange={handleChange}
                        required
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? "Memproses..." : "Daftar"}
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
                        Daftar dengan Google
                    </span>
                </button>

                {/* Footer */}
                <p className="text-xs text-gray-400 text-center mt-6">
                    Dengan mendaftar, kamu menyetujui{" "}
                    <span className="underline cursor-pointer">
                        Syarat & Ketentuan
                    </span>{" "}
                    dan{" "}
                    <span className="underline cursor-pointer">
                        Kebijakan Privasi
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Daftar;
