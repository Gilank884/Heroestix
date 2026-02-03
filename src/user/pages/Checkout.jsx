import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { HiCalendar, HiUser, HiMail, HiPhone, HiChevronDown } from "react-icons/hi";
import { ClipboardList } from "lucide-react";
import { FaMale, FaFemale } from "react-icons/fa";
import useAuthStore from "../../auth/useAuthStore";
import { supabase } from "../../lib/supabaseClient";

const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

const PAYMENT_METHODS = [
    {
        category: "Virtual Account",
        methods: [
            { id: "bca", name: "BCA", logo: "BCA" },
            { id: "bri", name: "BRI", logo: "BRI" },
            { id: "mandiri", name: "Mandiri", logo: "Mandiri" },
            { id: "bni", name: "BNI", logo: "BNI" },
            { id: "cimb", name: "CIMB Niaga", logo: "CIMB" },
            { id: "permata", name: "Permata", logo: "Permata" },
            { id: "bsi", name: "BSI", logo: "BSI" },
            { id: "bjb", name: "BJB", logo: "BJB" },
            { id: "sahabat", name: "Bank Sahabat Sampoerna", logo: "BSS" },
        ]
    },
    {
        category: "Ewallet & QRIS",
        methods: [
            { id: "qris", name: "QRIS", logo: "QRIS" },
            { id: "ovo", name: "OVO", logo: "OVO" },
            { id: "dana", name: "DANA", logo: "DANA" },
            { id: "shopeepay", name: "ShopeePay", logo: "SPay" },
            { id: "linkaja", name: "LinkAja", logo: "LAja" },
            { id: "astrapay", name: "AstraPay", logo: "APay" },
        ]
    }
];

export default function Checkout() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { selectedTickets, totalAmount, event } = location.state || { selectedTickets: {}, totalAmount: 0, event: null };

    const [sameAsBuyer, setSameAsBuyer] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPayment, setSelectedPayment] = useState("bca");
    const [loading, setLoading] = useState(false);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [eventData, setEventData] = useState(null);

    // Form states for first visitor
    const [visitorData, setVisitorData] = useState({
        full_name: user?.full_name || "",
        email: user?.email || "",
        phone: "",
        birth_day: "1",
        birth_month: "Januari",
        birth_year: "2000",
        gender: "Laki - Laki",
        notes: "",
        custom_responses: {}
    });

    useEffect(() => {
        if (sameAsBuyer) {
            setVisitorData(prev => ({
                ...prev,
                full_name: user?.full_name || "",
                email: user?.email || ""
            }));
        }
    }, [sameAsBuyer, user]);

    useEffect(() => {
        if (!event) {
            navigate(`/event/${id}`);
            return;
        }

        const fetchTicketTypes = async () => {
            try {
                const { data, error } = await supabase
                    .from("ticket_types")
                    .select("*")
                    .eq("event_id", id);
                if (error) throw error;
                setTicketTypes(data || []);
            } catch (error) {
                console.error("Error fetching ticket types:", error);
            }
        };

        const fetchEventData = async () => {
            try {
                const { data, error } = await supabase
                    .from("events")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (error) throw error;
                setEventData(data);
            } catch (error) {
                console.error("Error fetching event data:", error);
            }
        };

        fetchTicketTypes();
        fetchEventData();
        window.scrollTo(0, 0);
    }, [id, navigate]);

    if (!event) return null;

    const internetFee = 8500;
    const finalTotal = currentStep === 1 ? totalAmount : totalAmount + internetFee;

    const handleCreateOrder = async () => {
        if (!visitorData.full_name || !visitorData.email || !visitorData.phone) {
            alert("Harap lengkapi data pengunjung utama.");
            return;
        }

        const bookingCode = `HT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        setLoading(true);
        try {
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    user_id: user.id,
                    total: totalAmount + internetFee,
                    status: "pending",
                    booking_code: bookingCode
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Tickets for each type and quantity
            const ticketsToCreate = [];
            Object.entries(selectedTickets).forEach(([typeId, count]) => {
                for (let i = 0; i < count; i++) {
                    ticketsToCreate.push({
                        order_id: order.id,
                        ticket_type_id: typeId,
                        qr_code: `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                        status: "unused",
                        // Add visitor details (using first visitor data for all tickets in this order for simplicity)
                        full_name: visitorData.full_name,
                        email: visitorData.email,
                        phone: visitorData.phone,
                        gender: visitorData.gender,
                        birth_date: `${visitorData.birth_day} ${visitorData.birth_month} ${visitorData.birth_year}`,
                        notes: visitorData.notes,
                        custom_responses: visitorData.custom_responses
                    });
                }
            });

            const { error: ticketError } = await supabase
                .from("tickets")
                .insert(ticketsToCreate);

            if (ticketError) throw ticketError;

            // 3. Move to Payment
            navigate(`/payment/${id}`, {
                state: {
                    total: totalAmount + internetFee,
                    selectedPayment,
                    orderId: order.id,
                    eventTitle: event.title,
                    visitorEmail: visitorData.email,
                }
            });

        } catch (error) {
            alert("Error creating order: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNextStep = () => {
        setCurrentStep(2);
        window.scrollTo(0, 0);
    };

    const handlePrevStep = () => {
        setCurrentStep(1);
        window.scrollTo(0, 0);
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
            <Navbar alwaysScrolled={true} />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* STEPPER */}
                    <div className="flex items-center justify-center gap-6 mb-12">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= 1 ? 'bg-[#1a36c7] text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 text-slate-400'}`}>1</div>
                            <span className={`font-black text-xs uppercase tracking-[0.15em] ${currentStep >= 1 ? 'text-[#1a36c7]' : 'text-slate-400'}`}>Detail Pembeli</span>
                        </div>
                        <div className={`w-12 h-[2px] rounded-full transition-all duration-500 ${currentStep >= 2 ? 'bg-[#1a36c7]' : 'bg-slate-200'}`}></div>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= 2 ? 'bg-[#1a36c7] text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 text-slate-400'}`}>2</div>
                            <span className={`font-black text-xs uppercase tracking-[0.15em] ${currentStep >= 2 ? 'text-[#1a36c7]' : 'text-slate-400'}`}>Pembayaran</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-8 space-y-8">

                            {currentStep === 1 ? (
                                <>
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

                                                {/* CUSTOM DYNAMIC FIELDS (UNLIMITED) */}
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

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Keterangan</label>
                                                    <textarea
                                                        value={visitorData.notes}
                                                        onChange={e => setVisitorData({ ...visitorData, notes: e.target.value })}
                                                        placeholder="Masukkan keterangan"
                                                        rows={3}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* STEP 2: PAYMENT METHODS */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-6">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                                    Metode <span className="text-[#1a36c7]">Pembayaran</span>
                                                </h2>
                                                <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                                                    <HiChevronDown size={12} className="text-blue-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Silakan Pilih Metode Pembayaran Terfavorit</span>
                                                </div>
                                            </div>
                                        </div>

                                        {PAYMENT_METHODS.map((cat, idx) => (
                                            <div key={idx} className="space-y-4">
                                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                    <div className="w-1 h-5 bg-[#1a36c7] rounded-full"></div>
                                                    {cat.category}
                                                </h2>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {cat.methods.map((method) => (
                                                        <button
                                                            key={method.id}
                                                            onClick={() => setSelectedPayment(method.id)}
                                                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${selectedPayment === method.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedPayment === method.id ? 'border-blue-600' : 'border-slate-300'}`}>
                                                                {selectedPayment === method.id && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                                                            </div>
                                                            <div className="w-12 h-6 bg-slate-100 rounded flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                                                {method.logo}
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-sm">{method.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>


                        {/* RIGHT COLUMN: SIDEBAR */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6 sticky top-28">
                                <h2 className="text-xl font-bold">Detail Pesanan</h2>

                                <div className="flex gap-4">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-24 h-16 object-cover rounded-lg shadow-sm"
                                    />
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-sm leading-tight">{event.title}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                            <HiCalendar />
                                            <span>{event.date}</span>
                                        </div>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Duds.Space</p>
                                    </div>
                                </div>

                                <hr className="border-slate-50" />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Tiket Dipesan</span>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedTickets && Object.entries(selectedTickets).map(([typeId, count]) => {
                                            const tt = ticketTypes?.find(t => t.id === typeId);
                                            if (!count || !tt) return null;
                                            return (
                                                <div key={typeId} className="flex items-center justify-between text-sm font-bold">
                                                    <span className="text-slate-600">{count}x {tt.name}</span>
                                                    <span className="text-slate-900">{rupiah(count * (tt.price_gross || tt.price))}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-slate-50">
                                        <span className="text-slate-600">Subtotal</span>
                                        <span className="text-slate-900">{rupiah(totalAmount)}</span>
                                    </div>
                                    {currentStep === 2 && (
                                        <div className="flex items-center justify-between text-sm font-bold">
                                            <span className="text-slate-600">Internet Fee</span>
                                            <span className="text-slate-900">{rupiah(internetFee)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between gap-2">
                                    <p className="text-[13px] font-bold text-slate-700">Punya kode diskon?</p>
                                    <button className="text-blue-700 font-bold text-[13px] hover:underline">Tambahkan</button>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="font-bold text-slate-700">Total</span>
                                        <span className="text-xl font-black text-slate-900">{rupiah(finalTotal)}</span>
                                    </div>

                                    <div className="space-y-3">
                                        {currentStep === 1 ? (
                                            <button
                                                onClick={handleNextStep}
                                                className="w-full bg-[#1b3bb6] hover:bg-[#16319c] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-100"
                                            >
                                                Pilih Metode Pembayaran
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    disabled={loading}
                                                    onClick={handleCreateOrder}
                                                    className="w-full bg-[#1b3bb6] hover:bg-[#16319c] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                                                >
                                                    {loading ? "Memproses..." : "Bayar Sekarang"}
                                                </button>
                                                <button
                                                    onClick={handlePrevStep}
                                                    className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-bold transition-all hover:bg-slate-50"
                                                >
                                                    Kembali Ke Detail Pembeli
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
