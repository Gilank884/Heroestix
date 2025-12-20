import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import EventNavbar from "../components/Layout/EventNavbar";
import Footer from "../components/Layout/Footer";
import { HiCalendar, HiLocationMarker } from "react-icons/hi";

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

export default function SelectTicket() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [ticketCount, setTicketCount] = useState(0);

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

    const totalPrice = ticketCount * event.price;

    return (
        <div className="bg-[#fbffff] min-h-screen font-sans text-slate-900">
            <EventNavbar />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* LEFT COLUMN: TICKET CATEGORIES */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <h2 className="text-xl font-bold">Kategori Tiket</h2>
                                </div>
                                <div className="p-6">
                                    <div className="border border-slate-200 rounded-xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold">Reguler</h3>
                                                <p className="text-blue-600 font-extrabold text-lg">{rupiah(event.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {ticketCount > 0 && (
                                                    <button
                                                        onClick={() => setTicketCount(prev => Math.max(0, prev - 1))}
                                                        className="w-10 h-10 rounded-xl border-2 border-blue-600 text-blue-600 font-bold flex items-center justify-center hover:bg-blue-50 transition-all"
                                                    >
                                                        -
                                                    </button>
                                                )}
                                                {ticketCount > 0 && <span className="text-lg font-bold w-6 text-center">{ticketCount}</span>}
                                                <button
                                                    onClick={() => setTicketCount(prev => prev + 1)}
                                                    className={`px-6 py-2 rounded-xl font-bold transition-all ${ticketCount > 0 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'}`}
                                                >
                                                    {ticketCount > 0 ? "+" : "Tambah"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                            <p className="text-[14px] text-slate-600 leading-relaxed line-clamp-2">
                                                <strong>Blackdove Management</strong> berinisiatif menggelar sebuah event bertajuk <strong>{event.title}</strong> sebuah kegiatan bersama memgelilingi kota yang dikemas dengan konsep kreatif dan energik.
                                            </p>
                                            <button className="text-blue-600 text-xs font-bold hover:underline">Tampilkan Lebih Banyak</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ORDER DETAILS */}
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

                                <hr className="border-slate-100" />

                                <div className="flex items-center justify-between text-sm font-medium">
                                    <span className="text-slate-500">{ticketCount} Tiket Dipesan</span>
                                    <span className="text-slate-900 font-bold">{rupiah(totalPrice)}</span>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="font-bold">Total</span>
                                        <span className="text-xl font-black">{rupiah(totalPrice)}</span>
                                    </div>

                                    <button
                                        disabled={ticketCount === 0}
                                        onClick={() => navigate(`/checkout/${event.id}`, { state: { ticketCount } })}
                                        className={`w-full py-4 rounded-xl font-bold transition-all ${ticketCount > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        {ticketCount > 0 ? "Checkout" : "Pilih Tiket Dulu"}
                                    </button>
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
