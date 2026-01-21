import React from "react";
import { HiLocationMarker } from "react-icons/hi";
import { FiCalendar, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

// ✅ SAFE RUPIAH FORMATTER
const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

const Card = ({ id, image, title, date, location, price, status, variant }) => {
    // Render "Load More" card variant
    if (variant === "more") {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-8 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer group shadow-2xl">
                <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#39e011] group-hover:text-black transition-all duration-500">
                    <span className="text-3xl font-bold text-white">+</span>
                </div>
                <p className="text-sm font-bold text-white uppercase tracking-widest">See More</p>
            </div>
        );
    }

    if (!title || !image) return null;
    const isAvailable = status !== "soldout";

    return (
        <div className="group relative bg-white rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)] transition-all duration-700 hover:-translate-y-2 flex flex-col h-full">
            {/* TICKET TOP: IMAGE */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={image || "/assets/placeholder.png"}
                    alt={title}
                    className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${!isAvailable ? "grayscale opacity-70" : ""}`}
                />

                {/* STATUS BADGE */}
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md ${isAvailable ? "bg-[#39e011] text-black" : "bg-black text-white"
                        }`}>
                        {isAvailable ? "ACTIVE" : "EXPIRED"}
                    </span>
                </div>
            </div>

            {/* TICKET NOTCH DIVIDER */}
            <div className="relative h-8 bg-white flex items-center justify-center">
                {/* Left Notch */}
                <div className="absolute -left-4 w-8 h-8 bg-[#5d3a24] rounded-full"></div>
                {/* Right Notch */}
                <div className="absolute -right-4 w-8 h-8 bg-[#5d3a24] rounded-full"></div>
                {/* Perforation Line */}
                <div className="w-[85%] border-t-2 border-dashed border-gray-100"></div>
            </div>

            {/* TICKET BOTTOM: CONTENT */}
            <div className="p-6 pt-2 flex-1 flex flex-col bg-white">
                <div className="flex-1 space-y-4">
                    <h3 className="font-black text-black text-lg leading-[1.2] transition-colors duration-300 line-clamp-2 uppercase tracking-tight">
                        {title}
                    </h3>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5 text-gray-500">
                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                <HiLocationMarker size={16} className="text-black" />
                            </div>
                            <span className="text-[10px] font-bold truncate uppercase tracking-tight">{location || "Venue TBA"}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-gray-500">
                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                <FiCalendar size={16} className="text-black" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tight">{date || "Coming Soon"}</span>
                        </div>
                    </div>
                </div>

                {/* ACTION FOOTER */}
                <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-black leading-none tracking-tighter">
                            {price === 0 ? "FREE" : rupiah(price)}
                        </span>
                    </div>

                    <Link
                        to={`/event/${id}`}
                        className="flex items-center justify-center px-5 py-2.5 bg-[#39e011] text-black text-[10px] font-black uppercase tracking-[0.15em] rounded-lg shadow-lg shadow-green-900/10 hover:bg-[#2fb90d] hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                        Buy Ticket
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Card;
