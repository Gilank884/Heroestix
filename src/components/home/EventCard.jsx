import React from "react";
import { Link } from "react-router-dom";
import {
    Calendar,
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

const EventCard = ({ id, image, title, date, location, price, status, variant, category, isEnded, creator }) => {
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
            className="group block bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col"
        >
            {/* CARD TOP: IMAGE CONTAINER */}
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-t-2xl">
                <img
                    src={image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                    alt={title}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${(!isAvailable || isEnded) ? "grayscale opacity-70" : ""}`}
                />

                {/* Status Overlays */}
                {(!isAvailable || isEnded) && (
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white shadow-lg">
                            {status === "soldout" ? "Sold Out" : "Ended"}
                        </span>
                    </div>
                )}
            </div>

            {/* CARD BODY: CONTENT */}
            <div className="px-5 py-4 flex-1 flex flex-col justify-start">
                <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-[20px] leading-tight line-clamp-2">
                        {title}
                    </h3>

                    <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center border border-blue-100 dark:border-slate-700">
                            <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className={`text-[14px] font-bold ${isEnded ? 'line-through opacity-50' : 'text-slate-600'}`}>
                            {date || "Coming Soon"}
                        </p>
                    </div>

                    <p className="text-[20px] font-black text-slate-900 dark:text-white pt-1">
                        {price === 0 ? "FREE" : rupiah(price)}
                    </p>
                </div>
            </div>

            {/* CARD FOOTER: CREATOR */}
            <div className="px-5 pb-5">
                <div className="border-t border-dashed border-slate-200 dark:border-slate-700/50 pt-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm">
                        <img 
                            src={creator?.image_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + (creator?.brand_name || "C")} 
                            alt={creator?.brand_name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 truncate">
                        {creator?.brand_name || "Anonymous Creator"}
                    </p>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;
