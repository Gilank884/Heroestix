import React from "react";
import { Link } from "react-router-dom";
import {
    MapPin,
    Calendar,
    ChevronRight,
    Tag
} from "lucide-react";
import { getCategoryName } from "../../constants/categories";

// ✅ SAFE RUPIAH FORMATTER
const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

const EventCard = ({ id, image, title, date, location, price, status, variant, category, isEnded }) => {
    // Render "Load More" card variant
    if (variant === "more") {
        return (
            <div className="bg-slate-900/5 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer group shadow-sm">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white shadow-md transition-all duration-500">
                    <ChevronRight className="text-slate-400 dark:text-slate-300 group-hover:text-white" size={24} />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">See More</p>
            </div>
        );
    }

    if (!title) return null;
    const isAvailable = status !== "soldout";

    return (
        <Link
            to={`/event/${id}`}
            className="group block bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 dark:hover:shadow-blue-900/20 transition-all duration-500 flex flex-col h-full"
        >
            {/* CARD TOP: IMAGE */}
            <div className="relative aspect-[16/9] overflow-hidden">
                <img
                    src={image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                    alt={title}
                    className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${( !isAvailable || isEnded ) ? "grayscale opacity-70" : ""}`}
                />

                {/* Subtle Overlay */}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                        <span className="bg-white/90 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-[0.2em] text-slate-900">Sold Out</span>
                    </div>
                )}

                {isEnded && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                        <span className="bg-white/90 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-[0.2em] text-slate-900">Ended</span>
                    </div>
                )}

                {/* Category Badge */}
                {category && (
                    <div className="absolute top-3 left-3">
                        <div className="px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-[#1a36c7] dark:text-blue-400 rounded-lg text-[9px] font-medium uppercase tracking-wider shadow-sm border border-blue-100/50 dark:border-slate-700/50 flex items-center gap-1">
                            <Tag size={9} />
                            {getCategoryName(category)}
                        </div>
                    </div>
                )}
            </div>

            {/* CARD BODY: CONTENT */}
            <div className="p-4 flex-1 flex flex-col justify-start">
                <div className="space-y-3">
                    <h3 className="font-medium text-[#111827] dark:text-slate-100 text-[15px] uppercase leading-tight tracking-tight line-clamp-2">
                        {title}
                    </h3>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#374151] dark:text-slate-300">
                            <Calendar size={14} className={`${isEnded ? 'text-slate-400 dark:text-slate-500' : 'text-blue-600 dark:text-blue-400'} shrink-0`} />
                            <p className={`text-[14px] font-medium ${isEnded ? 'text-slate-400 dark:text-slate-500 uppercase italic' : ''}`}>
                                {isEnded ? "Event Telah Berakhir" : (date || "Coming Soon")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                            <MapPin size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                            <p className="text-[13px] font-medium truncate">
                                {location || "Venue TBA"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD FOOTER: PRICE */}
            <div className={`mt-auto px-4 py-3.5 ${isEnded ? 'bg-slate-100/50 dark:bg-slate-800/10 opacity-60' : 'bg-slate-50/50 dark:bg-slate-800/30'} border-t border-slate-100 dark:border-slate-800 flex items-center justify-between`}>
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    Mulai Dari
                </span>
                <span className="text-[15px] font-medium text-slate-900 dark:text-white">
                    {price === 0 ? "FREE" : rupiah(price)}
                </span>
            </div>
        </Link>
    );
};

export default EventCard;
