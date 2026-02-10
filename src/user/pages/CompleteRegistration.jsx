import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { RxCheckCircled } from "react-icons/rx"; // Import added

const CompleteRegistration = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userId, setUserId] = useState("");

    // Form State
    const [form, setForm] = useState({
        nama: "",
        tanggal_lahir: "",
        termsAgreed: false
    });

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/masuk");
                return;
            }
            setUserId(session.user.id);
            setUserEmail(session.user.email);

            // Pre-fill name if available from Google metadata
            if (session.user.user_metadata?.full_name) {
                setForm(prev => ({ ...prev, nama: session.user.user_metadata.full_name }));
            } else if (session.user.user_metadata?.name) {
                setForm(prev => ({ ...prev, nama: session.user.user_metadata.name }));
            }
        };
        checkSession();
    }, [navigate]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({
            ...form,
            [e.target.name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        if (!form.nama || !form.tanggal_lahir) {
            setErrorMsg("Mohon lengkapi semua data.");
            setLoading(false);
            return;
        }

        if (!form.termsAgreed) {
            setErrorMsg("Anda harus menyetujui Syarat & Ketentuan.");
            setLoading(false);
            return;
        }

        try {
            // Fetch current profile to avoid downgrading role
            const { data: existingProfile } = await supabase.from("profiles").select("role").eq("id", userId).single();
            const currentRole = existingProfile?.role || 'user';

            // Only upgrade to creator/dev, never downgrade from them to user.
            const finalRole = (currentRole === 'creator' || currentRole === 'developer') ? currentRole : intendedRole;

            // Create Profile
            const { error } = await supabase.from("profiles").upsert({
                id: userId,
                email: userEmail,
                full_name: form.nama,
                role: finalRole,
                tanggal_lahir: form.tanggal_lahir
            });

            if (error) throw error;

            // Success
            localStorage.removeItem("auth_role");
            localStorage.setItem("auth_mode", "login"); // Trigger redirection logic in App.jsx

            const { getSubdomainUrl } = await import("../../lib/navigation");
            const targetSub = intendedRole === "creator" ? "creator" : (intendedRole === "developer" ? "dev" : null);

            window.location.href = getSubdomainUrl(targetSub, "/");

        } catch (err) {
            console.error("Profile Creation Error:", err);
            setErrorMsg(err.message || "Gagal menyimpan data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-20 px-4 relative overflow-hidden flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                                Lengkapi Profil
                            </h2>
                            <p className="text-sm text-slate-500 font-medium">
                                Satu langkah lagi untuk menyelesaikan pendaftaran Anda.
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
                                <span className="font-bold">{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    name="nama"
                                    placeholder="Sesuai ID"
                                    value={form.nama}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold placeholder:text-slate-400"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tanggal Lahir</label>
                                <input
                                    type="date"
                                    name="tanggal_lahir"
                                    value={form.tanggal_lahir}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-sm outline-none transition-all font-bold text-slate-500"
                                />
                            </div>

                            {/* Terms Checkbox */}
                            <div
                                className={`flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border cursor-pointer transition-all ${errorMsg && !form.termsAgreed ? 'border-red-300 bg-red-50 animate-shake' : 'border-slate-100'
                                    }`}
                                onClick={() => setForm({ ...form, termsAgreed: !form.termsAgreed })}
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.termsAgreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                    {form.termsAgreed && <RxCheckCircled className="text-white text-xs" />}
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    I agree to the <Link target="_blank" to="/terms" className="text-blue-600 font-bold hover:underline">Terms and Conditions</Link> and <Link target="_blank" to="/privacy" className="text-blue-600 font-bold hover:underline">Privacy Policy</Link> applicable at Heroestix.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-4 flex items-center justify-center disabled:opacity-50"
                            >
                                {loading ? "Simpan & Lanjutkan" : "Simpan & Lanjutkan"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteRegistration;
