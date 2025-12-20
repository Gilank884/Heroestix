import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import BottomBar from "../components/Layout/Footer";
import { HiLocationMarker, HiCalendar, HiTicket, HiClock } from "react-icons/hi";
import { FiChevronLeft } from "react-icons/fi";
import { FaInstagram, FaTiktok } from "react-icons/fa";

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

export default function EventDetail() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);

    const [showFullDesc, setShowFullDesc] = useState(false);

    useEffect(() => {
        const allEvents = [...topEvents, ...newEvents, ...recommendedEvents];
        const foundEvent = allEvents.find((ev) => ev.id === parseInt(id));
        setEvent(foundEvent);
        window.scrollTo(0, 0);
    }, [id]);

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-bold tracking-widest text-gray-400">
                Memuat Event...
            </div>
        );
    }

    return (
        <div className="bg-[#fbffff] min-h-screen font-sans text-slate-900">
            <Navbar />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* LEFT COLUMN: IMAGE & DESCRIPTION */}
                        <div className="lg:col-span-8">
                            <div className="rounded-2xl overflow-hidden shadow-sm mb-10">
                                <img
                                    src={event.image || "/assets/placeholder.png"}
                                    alt={event.title}
                                    className="w-full h-auto object-cover aspect-[16/9]"
                                />
                            </div>

                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold">Deskripsi</h2>
                                <div className={`text-slate-600 leading-relaxed space-y-4 ${!showFullDesc && "line-clamp-4 relative"}`}>
                                    <p>
                                        Bersiaplah menyaksikan keajaiban di <strong>{event.title}</strong>! Sebuah pertunjukan spektakuler yang memadukan musik, kreativitas, dan aura magis. Diselenggarakan oleh <strong>Yayasan Pendidikan Budi Insan Cendikia</strong>, acara ini mengajak Anda memasuki hari penuh pesona dengan aksi musisi terbaik, dekorasi bertema sihir yang memukau, serta atmosfer yang luar biasa.
                                    </p>
                                    {showFullDesc && (
                                        <>
                                            <p>
                                                Nikmati pengalaman tak terlupakan di {event.title}. Event ini dirancang untuk memberikan kemeriahan dan kesan mendalam bagi setiap pengunjung. Jangan lewatkan kesempatan untuk menjadi bagian dari momen spesial ini.
                                            </p>
                                            <p>
                                                Pastikan Anda datang tepat waktu dan membawa tiket yang sudah dipesan. Informasi lebih lanjut mengenai jadwal dan rundown akan diupdate melalui email yang terdaftar.
                                            </p>
                                        </>
                                    )}
                                    {!showFullDesc && (
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#fbffff] to-transparent" />
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowFullDesc(!showFullDesc)}
                                    className="text-blue-700 font-bold hover:underline py-2"
                                >
                                    {showFullDesc ? "Tampilkan Lebih Sedikit" : "Tampilkan Lebih Banyak"}
                                </button>
                            </section>

                            <hr className="my-12 border-slate-100" />
                        </div>

                        {/* RIGHT COLUMN: EVENT INFO, PRICE, SOCIAL MEDIA */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* EVENT INFO CARD */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                                <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
                                    {event.title}
                                </h1>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <HiCalendar className="text-xl shrink-0" />
                                        <span className="text-[15px] font-medium">{event.date}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <HiClock className="text-xl shrink-0" />
                                        <span className="text-[15px] font-medium">10:00 WIB</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-slate-600">
                                        <HiLocationMarker className="text-xl shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-[14px] leading-tight font-medium">{event.location}</p>
                                            <a href="#" className="text-blue-600 font-bold text-xs hover:underline block">Petunjuk Arah</a>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="space-y-1">
                                    <p className="text-slate-400 text-[13px]">Dibuat Oleh</p>
                                    <p className="font-bold text-[15px] text-slate-800">Yayasan Pendidikan Budi Insan Cendikia</p>
                                </div>
                            </div>

                            {/* PRICE & ACTION CARD */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[15px] font-medium text-slate-700">Mulai Dari</span>
                                    <span className="text-xl font-black text-slate-900">{rupiah(event.price)}</span>
                                </div>
                                <button
                                    className="w-full bg-[#1b3bb6] hover:bg-[#16319c] text-white py-4 rounded-xl font-bold transition-all"
                                >
                                    Beli Sekarang
                                </button>
                            </div>

                            {/* SOCIAL MEDIA SECTION */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold">Media Sosial</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 transition-all">
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white">
                                            <FaInstagram className="text-sm" />
                                        </div>
                                        <span className="font-bold text-sm">Instagram</span>
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 transition-all">
                                        <FaTiktok className="text-xl" />
                                        <span className="font-bold text-sm">Tiktok</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <BottomBar />
        </div>
    );
}
