import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";

const Daftar = ({ role = "user" }) => {
    const [form, setForm] = useState({
        nama: "",
        email: "",
        password: "",
        tanggal_lahir: "",
        brand_name: "",
        bank_name: "",
        bank_account: "",
    });

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleEmailRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        // 1. Validation: Prevent existing 'user' from becoming 'creator'
        if (role === 'creator') {
            const { data: existingProfile, error: checkError } = await supabase
                .from('profiles')
                .select('role')
                .eq('email', form.email)
                .single();

            if (existingProfile && existingProfile.role === 'user') {
                setErrorMsg("Email ini sudah terdaftar sebagai User. Silahkan gunakan email lain untuk akun Creator.");
                setLoading(false);
                return;
            }
        }

        // 2. Auth Sign Up
        const { data: authData, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    nama: form.nama,
                    tanggal_lahir: form.tanggal_lahir,
                    provider: "email",
                    role: role,
                },
            },
        });

        if (error) {
            setErrorMsg(error.message);
        } else if (authData.user) {
            // 3. Populate Creators table if role is creator
            if (role === 'creator') {
                const { error: creatorError } = await supabase
                    .from('creators')
                    .insert({
                        id: authData.user.id,
                        brand_name: form.brand_name,
                        bank_name: form.bank_name,
                        bank_account: form.bank_account,
                        verified: false
                    });

                if (creatorError) {
                    console.error("Error creating creator profile:", creatorError.message);
                }
            }
            alert("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
        }

        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + (role === "creator" ? "/dashboard" : "/"),
                queryParams: {
                    role: role // Optional: pass role if supported by your auth hook/handle
                }
            },
        });

        if (error) {
            console.error("Google login error:", error.message);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ================= LEFT ================= */}
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

                {/* Banner Card */}
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

            {/* ================= RIGHT ================= */}
            <div className="w-full md:w-[30%] flex items-center justify-center bg-gradient-to-b from-[#b1451a] to-[#8e3715] px-8">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 mt-10">

                            Daftar Akun
                        </h1>
                        <p className="text-[#f9e2d2] text-sm">
                            Buat akun untuk mulai menggunakan Heroestix
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-lg mb-5">
                            {errorMsg}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleEmailRegister} className="space-y-4">
                        <input
                            type="text"
                            name="nama"
                            placeholder="Nama Lengkap"
                            value={form.nama}
                            onChange={handleChange}
                            required
                            className="
    w-full rounded-xl px-4 py-3
    bg-[#b1451a] text-white
    focus:ring-2 focus:ring-white outline-none
    autofill:bg-[#b1451a]
  "
                            style={{
                                WebkitBoxShadow: "0 0 0 1000px rgb(177 69 26) inset",
                                WebkitTextFillColor: "white",
                            }}
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="
    w-full rounded-xl px-4 py-3
    bg-[#b1451a] text-white
    focus:ring-2 focus:ring-white outline-none
    autofill:bg-[#b1451a]
  "
                            style={{
                                WebkitBoxShadow: "0 0 0 1000px rgb(177 69 26) inset",
                                WebkitTextFillColor: "white",
                            }}
                        />


                        <input
                            type="password"
                            name="password"
                            placeholder="Sandi"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="
    w-full rounded-xl px-4 py-3
    bg-[#b1451a] text-white
    focus:ring-2 focus:ring-white outline-none
    autofill:bg-[#b1451a]
  "
                            style={{
                                WebkitBoxShadow: "0 0 0 1000px rgb(177 69 26) inset",
                                WebkitTextFillColor: "white",
                            }}
                        />

                        <div>
                            <label className="block text-sm text-white mb-1">
                                Tanggal Lahir
                            </label>
                            <input
                                type="date"
                                name="tanggal_lahir"
                                value={form.tanggal_lahir}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl px-4 py-3 bg-[#b1451a] text-white focus:ring-2 focus:ring-white outline-none "
                            />
                        </div>

                        {role === 'creator' && (
                            <>
                                <input
                                    type="text"
                                    name="brand_name"
                                    placeholder="Nama Brand / Organisasi"
                                    value={form.brand_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl px-4 py-3 bg-[#b1451a] text-white focus:ring-2 focus:ring-white outline-none"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="bank_name"
                                        placeholder="Nama Bank"
                                        value={form.bank_name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl px-4 py-3 bg-[#b1451a] text-white focus:ring-2 focus:ring-white outline-none"
                                    />
                                    <input
                                        type="text"
                                        name="bank_account"
                                        placeholder="No. Rekening"
                                        value={form.bank_account}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl px-4 py-3 bg-[#b1451a] text-white focus:ring-2 focus:ring-white outline-none"
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#8e3715] text-white py-3 rounded-xl font-semibold hover:bg-[#5e240a] transition disabled:opacity-50"
                        >
                            {loading ? "Memproses..." : "Daftar"}
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
                        className="w-full flex items-center justify-center gap-3 bg-[#b1451a] text-white rounded-xl py-3 hover:bg-[#8e3715] transition shadow-md"
                    >
                        <FcGoogle size={22} />
                        <span className="font-medium">
                            Daftar dengan Google
                        </span>
                    </button>

                    {/* Footer */}
                    <p className="text-sm mt-8 text-[#f9e2d2] text-center">
                        Sudah punya akun?{" "}
                        <Link
                            to="/masuk"
                            className="text-white font-semibold hover:underline"
                        >
                            Masuk
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Daftar;
