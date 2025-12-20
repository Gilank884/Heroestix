import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import EventNavbar from "../components/Layout/EventNavbar";
import Footer from "../components/Layout/Footer";
import { HiCalendar, HiUser, HiMail, HiPhone, HiChevronDown, HiCreditCard, HiCheckCircle } from "react-icons/hi";
import { FaMale, FaFemale, FaWallet } from "react-icons/fa";
import { MdStorefront, MdPayment } from "react-icons/md";

import topEvents from "../data/TopEvent";
import newEvents from "../data/NewEvent";
import recommendedEvents from "../data/RecommendedEvent";

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
    },
    {
        category: "Kartu Debit/Kredit",
        methods: [
            { id: "cc", name: "Credit Card / Debit Card", logo: "CC" },
        ]
    },
    {
        category: "Retail Outlets",
        methods: [
            { id: "alfamart", name: "Alfamart", logo: "Alfa" },
            { id: "indomaret", name: "Indomaret", logo: "Indo" },
        ]
    },
    {
        category: "Paylater",
        methods: [
            { id: "akulaku", name: "Akulaku", logo: "Aku" },
        ]
    }
];

export default function Checkout() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { ticketCount } = location.state || { ticketCount: 1 };

    const [event, setEvent] = useState(null);
    const [sameAsBuyer, setSameAsBuyer] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPayment, setSelectedPayment] = useState("bca");

    useEffect(() => {
        const allEvents = [...topEvents, ...newEvents, ...recommendedEvents];
        const foundEvent = allEvents.find((ev) => ev.id === parseInt(id));
        setEvent(foundEvent);
        window.scrollTo(0, 0);
    }, [id]);

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-bold tracking-widest text-gray-400">
                Memuat...
            </div>
        );
    }

    const subtotal = ticketCount * event.price;
    const internetFee = 8657; // Mock fee from image
    const total = currentStep === 1 ? subtotal : subtotal + internetFee;

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
            <EventNavbar />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* STEPPER */}
                    <div className="flex items-center justify-center gap-4 mb-10">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 1 ? 'bg-blue-700 text-white' : 'bg-slate-400 text-white'}`}>1</div>
                            <span className={`font-bold text-sm ${currentStep >= 1 ? 'text-blue-700' : 'text-slate-400'}`}>Detail Pembeli</span>
                        </div>
                        <div className={`w-16 h-[2px] ${currentStep >= 2 ? 'bg-blue-700' : 'bg-slate-200'}`}></div>
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 2 ? 'bg-blue-700 text-white' : 'bg-slate-400 text-white'}`}>2</div>
                            <span className={`font-bold text-sm ${currentStep >= 2 ? 'text-blue-700' : 'text-slate-400'}`}>Metode Pembayaran</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-8 space-y-8">

                            {currentStep === 1 ? (
                                <>
                                    {/* STEP 1: BUYER DETAILS */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <div className="flex items-center gap-3">
                                                <HiMail size={22} className="text-blue-600" />
                                                <h2 className="text-lg font-bold">Detail Pembeli</h2>
                                            </div>
                                            <button className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline">
                                                Ubah Data
                                            </button>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-5 border border-blue-50 relative">
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-800">Gilang Prasetyo</p>
                                                <p className="text-sm text-slate-500 font-medium">gilankprasetyo8@gmail.com</p>
                                            </div>
                                            <div className="mt-4 flex items-start gap-2 text-blue-700 text-[12px] font-medium bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                                                <span className="w-4 h-4 bg-blue-700 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">i</span>
                                                E-Tiket akan dikirim ke email ini
                                            </div>
                                        </div>
                                    </div>

                                    {/* VISITOR DETAILS FORM */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-6 flex items-center justify-between border-b border-slate-50">
                                            <div className="flex items-center gap-3">
                                                <HiUser size={22} className="text-green-600" />
                                                <h2 className="text-lg font-bold">Pengunjung 1</h2>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-semibold text-slate-500">Sama dengan detail pembeli</span>
                                                <button
                                                    onClick={() => setSameAsBuyer(!sameAsBuyer)}
                                                    className={`w-11 h-6 rounded-full transition-all duration-300 relative ${sameAsBuyer ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${sameAsBuyer ? 'left-6' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-8 space-y-6">
                                            <div className="space-y-4">
                                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori Tiket</p>
                                                    <p className="font-bold text-slate-800">Reguler</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Masukkan nama lengkap"
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Email</label>
                                                    <input
                                                        type="email"
                                                        placeholder="Masukkan email"
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Tanggal Lahir</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="relative">
                                                            <select className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700">
                                                                {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                                            </select>
                                                            <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        </div>
                                                        <div className="relative">
                                                            <select className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700">
                                                                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => <option key={i} value={m}>{m}</option>)}
                                                            </select>
                                                            <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        </div>
                                                        <div className="relative">
                                                            <select className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700">
                                                                {[...Array(50)].map((_, i) => <option key={2023 - i} value={2023 - i}>{2023 - i}</option>)}
                                                            </select>
                                                            <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Jenis Kelamin</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button className="flex items-center justify-between px-6 py-4 rounded-xl border-2 border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group font-bold text-slate-700">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-blue-500" />
                                                                <span>Laki - Laki</span>
                                                            </div>
                                                            <FaMale className="text-blue-500" />
                                                        </button>
                                                        <button className="flex items-center justify-between px-6 py-4 rounded-xl border-2 border-slate-100 hover:border-pink-100 hover:bg-pink-50/30 transition-all group font-bold text-slate-700">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-pink-500" />
                                                                <span>Perempuan</span>
                                                            </div>
                                                            <FaFemale className="text-pink-500" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Nomor Telepon</label>
                                                    <div className="flex gap-2">
                                                        <div className="relative w-28">
                                                            <div className="w-full h-full px-4 py-3 rounded-xl border border-slate-200 flex items-center justify-between font-bold text-slate-700">
                                                                🇮🇩 <span className="ml-1">+62</span>
                                                                <HiChevronDown className="text-slate-400" />
                                                            </div>
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            placeholder="Masukkan nomor telepon"
                                                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Keterangan</label>
                                                    <textarea
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
                                    {PAYMENT_METHODS.map((cat, idx) => (
                                        <div key={idx} className="space-y-4">
                                            <h2 className="text-lg font-bold text-slate-800">{cat.category}</h2>
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
                                        <span className="text-slate-500 font-medium">{ticketCount} Tiket Dipesan</span>
                                        <button className="text-blue-600 font-bold text-xs hover:underline">Lihat Detail</button>
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span className="text-slate-600">Subtotal</span>
                                        <span className="text-slate-900">{rupiah(subtotal)}</span>
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

                                <div className="pt-2">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="font-bold text-slate-700">Total</span>
                                        <span className="text-xl font-black text-slate-900">{rupiah(total)}</span>
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
                                                    onClick={() => navigate(`/payment/${event.id}`, { state: { total, selectedPayment } })}
                                                    className="w-full bg-[#1b3bb6] hover:bg-[#16319c] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-100"
                                                >
                                                    Bayar Sekarang
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
