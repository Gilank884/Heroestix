import React from "react";
import { HiLocationMarker } from "react-icons/hi";

// ✅ SAFE RUPIAH FORMATTER
const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

const Card = ({ image, title, date, location, price, status }) => {
    // ❌ Jangan render card kalau data utama kosong
    if (!title || !image) return null;

    const isAvailable = status !== "soldout";

    return (
        <div
            className="
                bg-white rounded-xl overflow-hidden
                shadow hover:shadow-lg
                transition-all duration-300
                hover:-translate-y-1
                w-full
            "
        >
            {/* IMAGE */}
            <div className="relative">
                <img
                    src={image || "/assets/placeholder.png"}
                    alt={title}
                    className={`w-full h-44 object-cover ${!isAvailable ? "grayscale opacity-70" : ""
                        }`}
                />

                {/* BADGE */}
                <div className="absolute bottom-2 left-2 right-2">
                    <div
                        className={`
                            text-xs font-semibold text-center py-1.5 rounded-md
                            ${isAvailable
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 border border-gray-300"
                            }
                        `}
                    >
                        {isAvailable ? "Tiket Tersedia" : "Tiket Habis"}
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="p-3">
                {/* LOCATION */}
                {location && (
                    <div className="flex items-center text-gray-500 text-xs mb-1">
                        <HiLocationMarker className="mr-1 text-red-500 text-sm" />
                        <span className="truncate">{location}</span>
                    </div>
                )}

                {/* TITLE */}
                <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
                    {title}
                </h3>

                {/* DATE */}
                {date && (
                    <p className="text-xs text-gray-600 mb-3">{date}</p>
                )}

                {/* FOOTER */}
                <div className="border-t pt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Event</span>
                    <span className="text-sm font-bold text-gray-900">
                        {rupiah(price)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Card;
