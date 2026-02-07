import React from "react";
import { Link } from "react-router-dom";
import { HiUser, HiMail, HiChevronDown } from "react-icons/hi";
import { ClipboardList } from "lucide-react";
import { FaMale, FaFemale } from "react-icons/fa";
import { RxCheckCircled } from "react-icons/rx";

export default function BuyerDetails({
    user,
    visitorData,
    setVisitorData,
    ticketTypes,
    selectedTickets,
    eventData,
    event,
    termsAgreed,
    setTermsAgreed
}) {
    return (
        <div className="space-y-8">
            {/* STEP 1: BUYER DETAILS */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            Detail <span className="text-[#1a36c7]">Pembeli</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                            <HiMail size={12} className="text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Informasi Kontak & Pengiriman E-Tiket</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-blue-50 relative">
                    <div className="space-y-1">
                        <p className="font-bold text-slate-800">{user?.full_name || "Guest"}</p>
                        <p className="text-sm text-slate-500 font-medium">{user?.email || "No Email"}</p>
                    </div>
                    <div className="mt-4 flex items-start gap-2 text-blue-700 text-[12px] font-medium bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                        <span className="w-4 h-4 bg-blue-700 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">i</span>
                        E-Tiket akan dikirim ke email ini
                    </div>
                </div>
            </div>

            {/* VISITOR DETAILS FORM */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 bg-slate-50/30">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            Pengunjung <span className="text-[#1a36c7]">1</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                            <HiUser size={12} className="text-green-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Data Pemegang Tiket</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori Tiket</p>
                            <p className="font-bold text-slate-800">
                                {ticketTypes?.find(tt => selectedTickets?.[tt.id] > 0)?.name || "Tiket Terpilih"}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                            <input
                                type="text"
                                value={visitorData.full_name}
                                onChange={e => setVisitorData({ ...visitorData, full_name: e.target.value })}
                                placeholder="Masukkan nama lengkap"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Email</label>
                            <input
                                type="email"
                                value={visitorData.email}
                                onChange={e => setVisitorData({ ...visitorData, email: e.target.value })}
                                placeholder="Masukkan email"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Tanggal Lahir</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="relative">
                                    <select
                                        value={visitorData.birth_day}
                                        onChange={e => setVisitorData({ ...visitorData, birth_day: e.target.value })}
                                        className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                                    >
                                        {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                    </select>
                                    <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={visitorData.birth_month}
                                        onChange={e => setVisitorData({ ...visitorData, birth_month: e.target.value })}
                                        className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                                    >
                                        {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={visitorData.birth_year}
                                        onChange={e => setVisitorData({ ...visitorData, birth_year: e.target.value })}
                                        className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                                    >
                                        {[...Array(60)].map((_, i) => <option key={2023 - i} value={2023 - i}>{2023 - i}</option>)}
                                    </select>
                                    <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Jenis Kelamin</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setVisitorData({ ...visitorData, gender: "Laki - Laki" })}
                                    className={`flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all group font-bold ${visitorData.gender === "Laki - Laki" ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-100 hover:bg-blue-50/30'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 ${visitorData.gender === "Laki - Laki" ? 'border-blue-500 bg-blue-500' : 'border-slate-300 group-hover:border-blue-500'}`}>
                                            {visitorData.gender === "Laki - Laki" && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto mt-1" />}
                                        </div>
                                        <span className={visitorData.gender === "Laki - Laki" ? 'text-blue-700' : 'text-slate-700'}>Laki - Laki</span>
                                    </div>
                                    <FaMale className="text-blue-500" />
                                </button>
                                <button
                                    onClick={() => setVisitorData({ ...visitorData, gender: "Perempuan" })}
                                    className={`flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all group font-bold ${visitorData.gender === "Perempuan" ? 'border-pink-600 bg-pink-50' : 'border-slate-100 hover:border-pink-100 hover:bg-pink-50/30'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 ${visitorData.gender === "Perempuan" ? 'border-pink-500 bg-pink-500' : 'border-slate-300 group-hover:border-pink-500'}`}>
                                            {visitorData.gender === "Perempuan" && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto mt-1" />}
                                        </div>
                                        <span className={visitorData.gender === "Perempuan" ? 'text-pink-700' : 'text-slate-700'}>Perempuan</span>
                                    </div>
                                    <FaFemale className="text-pink-500" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Nomor Telepon</label>
                            <div className="flex gap-2">
                                <div className="relative w-28">
                                    <div className="w-full h-full px-4 py-3 rounded-xl border border-slate-200 flex items-center justify-between font-bold text-slate-700 bg-slate-50">
                                        🇮🇩 <span className="ml-1">+62</span>
                                    </div>
                                </div>
                                <input
                                    type="tel"
                                    value={visitorData.phone}
                                    onChange={e => setVisitorData({ ...visitorData, phone: e.target.value })}
                                    placeholder="Masukkan nomor telepon"
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* CUSTOM DYNAMIC FIELDS */}
                        {(() => {
                            let rawFields = eventData?.custom_form || event?.custom_form;
                            if (typeof rawFields === 'string') {
                                try { rawFields = JSON.parse(rawFields); } catch (e) { rawFields = []; }
                            }

                            const fields = (Array.isArray(rawFields)
                                ? rawFields
                                : Object.entries(rawFields || {}).map(([key, val]) => ({ id: key, ...val }))
                            ).filter(field => field.active && field.label);

                            if (fields.length === 0) return null;

                            return (
                                <div className="space-y-6 pt-6 border-t border-slate-50 mt-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                            <ClipboardList size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Informasi Tambahan</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Lengkapi data berikut untuk melanjutkan</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        {fields.map((field) => (
                                            <div key={field.id || field.label} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1a36c7]"></div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{field.label}</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={visitorData.custom_responses?.[field.label] || ""}
                                                    onChange={e => setVisitorData({
                                                        ...visitorData,
                                                        custom_responses: {
                                                            ...visitorData.custom_responses,
                                                            [field.label]: e.target.value
                                                        }
                                                    })}
                                                    placeholder={`Masukkan ${field.label.toLowerCase()}`}
                                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-slate-700 bg-slate-50/30 placeholder:text-slate-300 shadow-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}



                        {/* Terms Checkbox */}
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer" onClick={() => setTermsAgreed(!termsAgreed)}>
                            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${termsAgreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                {termsAgreed && <RxCheckCircled className="text-white text-xs" />}
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                I agree to the <Link to="/terms-of-service" target="_blank" className="text-blue-600 font-bold hover:underline">Terms and Conditions</Link> and <Link to="/privacy" target="_blank" className="text-blue-600 font-bold hover:underline">Privacy Policy</Link> applicable at Heroestix.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
