import React from "react";
import { Link } from "react-router-dom";
import { HiUser, HiMail, HiChevronDown } from "react-icons/hi";
import { ClipboardList, Copy } from "lucide-react";
import { FaMale, FaFemale } from "react-icons/fa";
import { RxCheckCircled } from "react-icons/rx";

export default function BuyerDetails({
    user,
    ticketHolders,
    setTicketHolders,
    ticketTypes,
    selectedTickets,
    eventData,
    event,
    termsAgreed,
    setTermsAgreed,
    showValidationErrors
}) {

    const updateHolder = (index, field, value) => {
        setTicketHolders(prev => {
            const newHolders = [...prev];
            newHolders[index] = {
                ...newHolders[index],
                [field]: value
            };
            // If updating custom_responses
            if (field === 'custom_responses') {
                // value is already the object or we handle it differently
            }
            return newHolders;
        });
    };

    const updateCustomResponse = (index, label, value) => {
        setTicketHolders(prev => {
            const newHolders = [...prev];
            newHolders[index] = {
                ...newHolders[index],
                custom_responses: {
                    ...newHolders[index].custom_responses,
                    [label]: value
                }
            };
            return newHolders;
        });
    };

    const copyBuyerData = (index) => {
        if (!user) return;
        updateHolder(index, 'full_name', user.full_name || "");
        updateHolder(index, 'email', user.email || "");
    };

    const copyPreviousData = (index) => {
        if (index === 0) return;
        setTicketHolders(prev => {
            const newHolders = [...prev];
            const prevHolder = newHolders[index - 1];
            newHolders[index] = {
                ...newHolders[index],
                full_name: prevHolder.full_name,
                email: prevHolder.email,
                phone: prevHolder.phone,
                gender: prevHolder.gender,
                birth_day: prevHolder.birth_day,
                birth_month: prevHolder.birth_month,
                birth_year: prevHolder.birth_year,
                // Do not copy custom responses for now unless requested
            };
            return newHolders;
        });
    };

    return (
        <div className="space-y-8">
            {/* STEP 1: BUYER DETAILS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            Detail <span className="text-[#1a36c7] dark:text-blue-400">Pembeli</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1.5 text-slate-400 dark:text-slate-500">
                            <HiMail size={12} className="text-blue-500 dark:text-blue-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Informasi Kontak & Pengiriman E-Tiket</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-blue-50 dark:border-slate-700 relative">
                    <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{user?.full_name || "Guest"}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{user?.email || "No Email"}</p>
                    </div>
                    <div className="mt-4 flex items-start gap-2 text-blue-700 dark:text-blue-300 text-[12px] font-medium bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800 italic">
                        <span className="w-4 h-4 bg-blue-700 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">i</span>
                        E-Tiket akan dikirim ke email ini
                    </div>
                </div>
            </div>

            {/* VISITOR DETAILS FORMS LOOP */}
            {ticketHolders.map((holder, index) => (
                <div key={holder.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                Pengunjung <span className="text-[#1a36c7] dark:text-blue-400">{index + 1}</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5 text-slate-400 dark:text-slate-500">
                                <HiUser size={12} className="text-green-500 dark:text-green-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Ticket: {holder.ticketName}</span>
                            </div>
                        </div>

                        {/* Copy Buttons */}
                        <div className="flex gap-2">
                            {index === 0 && user && (
                                <button
                                    onClick={() => copyBuyerData(index)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    <Copy size={12} />
                                    Isi data saya
                                </button>
                            )}
                            {index > 0 && (
                                <button
                                    onClick={() => copyPreviousData(index)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Copy size={12} />
                                    Salin data sebelumnya
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                            <input
                                type="text"
                                value={holder.full_name}
                                onChange={e => updateHolder(index, 'full_name', e.target.value)}
                                placeholder="Masukkan nama lengkap"
                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:bg-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${showValidationErrors && !holder.full_name ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
                            <input
                                type="email"
                                value={holder.email}
                                onChange={e => updateHolder(index, 'email', e.target.value)}
                                placeholder="Masukkan email"
                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:bg-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${showValidationErrors && !holder.email ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tanggal Lahir</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="relative">
                                    <select
                                        value={holder.birth_day}
                                        onChange={e => updateHolder(index, 'birth_day', e.target.value)}
                                        className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                                    >
                                        {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                    </select>
                                    <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={holder.birth_month}
                                        onChange={e => updateHolder(index, 'birth_month', e.target.value)}
                                        className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                                    >
                                        {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={holder.birth_year}
                                        onChange={e => updateHolder(index, 'birth_year', e.target.value)}
                                        className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                                    >
                                        {[...Array(60)].map((_, i) => <option key={2023 - i} value={2023 - i}>{2023 - i}</option>)}
                                    </select>
                                    <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Jenis Kelamin</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => updateHolder(index, 'gender', "Laki - Laki")}
                                    className={`flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all group font-bold ${holder.gender === "Laki - Laki" ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500' : 'border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 ${holder.gender === "Laki - Laki" ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-500 dark:group-hover:border-blue-400'}`}>
                                            {holder.gender === "Laki - Laki" && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto mt-1" />}
                                        </div>
                                        <span className={holder.gender === "Laki - Laki" ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}>Laki - Laki</span>
                                    </div>
                                    <FaMale className="text-blue-500 dark:text-blue-400" />
                                </button>
                                <button
                                    onClick={() => updateHolder(index, 'gender', "Perempuan")}
                                    className={`flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all group font-bold ${holder.gender === "Perempuan" ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/30 dark:border-pink-500' : 'border-slate-100 dark:border-slate-800 hover:border-pink-100 dark:hover:border-pink-800 hover:bg-pink-50/30 dark:hover:bg-pink-900/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 ${holder.gender === "Perempuan" ? 'border-pink-500 bg-pink-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-pink-500 dark:group-hover:border-pink-400'}`}>
                                            {holder.gender === "Perempuan" && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto mt-1" />}
                                        </div>
                                        <span className={holder.gender === "Perempuan" ? 'text-pink-700 dark:text-pink-400' : 'text-slate-700 dark:text-slate-300'}>Perempuan</span>
                                    </div>
                                    <FaFemale className="text-pink-500 dark:text-pink-400" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nomor Telepon</label>
                            <div className="flex gap-2">
                                <div className="relative w-28">
                                    <div className="w-full h-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">
                                        🇮🇩 <span className="ml-1">+62</span>
                                    </div>
                                </div>
                                <input
                                    type="tel"
                                    value={holder.phone}
                                    onChange={e => updateHolder(index, 'phone', e.target.value)}
                                    placeholder="Masukkan nomor telepon"
                                    className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:bg-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${showValidationErrors && !holder.phone ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700'
                                        }`}
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
                                <div className="space-y-6 pt-6 border-t border-slate-50 dark:border-slate-800 mt-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                                            <ClipboardList size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Informasi Tambahan</h3>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Lengkapi data berikut untuk melanjutkan</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        {fields.map((field) => (
                                            <div key={field.id || field.label} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1a36c7] dark:bg-blue-500"></div>
                                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{field.label}</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={holder.custom_responses?.[field.label] || ""}
                                                    onChange={e => updateCustomResponse(index, field.label, e.target.value)}
                                                    placeholder={`Masukkan ${field.label.toLowerCase()}`}
                                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all font-bold text-slate-700 dark:text-slate-200 bg-slate-50/30 dark:bg-slate-800/50 placeholder:text-slate-300 dark:placeholder:text-slate-500 shadow-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            ))}

            {/* Terms Checkbox */}
            <div
                className={`flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border cursor-pointer transition-all ${showValidationErrors && !termsAgreed ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20 animate-shake' : 'border-slate-100 dark:border-slate-800'
                    }`}
                onClick={() => setTermsAgreed(!termsAgreed)}
            >
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${termsAgreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent'}`}>
                    {termsAgreed && <RxCheckCircled className="text-white text-xs" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    I agree to the <Link target="_blank" to="/terms" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Terms and Conditions</Link> and <Link target="_blank" to="/privacy" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Privacy Policy</Link> applicable at Heroestix.
                </p>
            </div>
        </div>
    );
}
