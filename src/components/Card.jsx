import React from "react";

const rupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);

const Card = ({ image, title, date, location, price, status }) => {
    return (
        <div
            className="
                bg-white rounded-xs shadow-sm overflow-hidden
                hover:shadow-md transition-all duration-300
                transform hover:-translate-y-1

                /* JARAK */
                mx-2 my-3
            "
        >
            {/* Gambar */}
            <div className="relative">
                <img
                    src={image}
                    alt={title}
                    className={`w-full h-48 object-cover transition-all duration-300 ${status === "expired" ? "grayscale opacity-70" : ""
                        }`}
                />
            </div>

            {/* Konten */}
            <div className="p-2">
                <h3 className="text-xs font-bold text-gray-800 leading-tight line-clamp-2">
                    {title}
                </h3>
                <p className="text-xs text-gray-600 mt-1">{date}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {location}
                </p>
            </div>

            {/* Harga */}
            <div className="border-t border-gray-200 px-2 py-3 flex items-center justify-between text-sm font-semibold">
                <span className="text-gray-500">Mulai Dari</span>
                <span className="text-gray-900">{rupiah(price)}</span>
            </div>
        </div>
    );
};

export default Card;
