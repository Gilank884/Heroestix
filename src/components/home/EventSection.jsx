import React from "react";
import { Link } from "react-router-dom";
import {
    MapPin,
    Calendar,
    ArrowRight,
    Tag,
    Clock,
    ChevronRight
} from "lucide-react";

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
            <div className="bg-slate-900/5 backdrop-blur-md rounded-xl border border-slate-200 flex flex-col items-center justify-center p-8 text-center hover:bg-blue-50/50 hover:border-blue-400 transition-all duration-300 cursor-pointer group shadow-sm">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white shadow-md transition-all duration-500">
                    <ChevronRight className="text-slate-400 group-hover:text-white" size={24} />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">See More</p>
            </div>
        );
    }

    if (!title) return null;
    const isAvailable = status !== "soldout";

    return (
        <Link
            to={`/event/${id}`}
            className="group block bg-white rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 flex flex-col h-full"
        >
            {/* CARD TOP: IMAGE */}
            <div className="relative aspect-[16/9] overflow-hidden">
                <img
                    src={image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                    alt={title}
                    className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${!isAvailable ? "grayscale opacity-70" : ""}`}
                />

                {/* Subtle Overlay */}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                        <span className="bg-white/90 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-[0.2em] text-slate-900">Sold Out</span>
                    </div>
                )}
            </div>

            {/* CARD BODY: CONTENT */}
            <div className="p-4 flex-1 flex flex-col justify-start">
                <div className="space-y-3">
                    <h3 className="font-extrabold text-[#111827] text-[15px] uppercase leading-tight tracking-tight line-clamp-2">
                        {title}
                    </h3>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#374151]">
                            <Calendar size={14} className="text-blue-600 shrink-0" />
                            <p className="text-[14px] font-bold">
                                {date || "Coming Soon"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <MapPin size={14} className="text-blue-600 shrink-0" />
                            <p className="text-[13px] font-medium truncate">
                                {location || "Venue TBA"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD FOOTER: PRICE */}
            <div className="mt-auto px-4 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-500">
                    Mulai Dari
                </span>
                <span className="text-[15px] font-extrabold text-slate-900">
                    {price === 0 ? "FREE" : rupiah(price)}
                </span>
            </div>
        </Link>
    );
};

export default Card;

