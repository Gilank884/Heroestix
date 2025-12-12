import React from "react";
import { Link } from "react-router-dom";
import LogoBanner from "../../../public/Logo/LogoBanner.png";

const Navbar = ({ searchTerm, setSearchTerm }) => {
    return (
        <header className="w-full shadow-md">
            {/* 🔹 Topbar dengan gradient biru */}
            <div className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white text-sm px-6 py-2 flex justify-end gap-6">
                <Link to="/about-us" className="hover:underline">
                    Tentang Kami
                </Link>
                <Link to="/konsultasi" className="hover:underline">
                    Konsultasi
                </Link>
            </div>

            {/* 🔸 Navbar utama */}
            <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-10 lg:px-20 py-4 bg-orange-100">
                {/* Logo */}
                <img
                    src={LogoBanner}
                    Link to="/home"
                    alt="Logo"
                    className="h-10 w-auto"
                />

                {/* Search Input */}
                <div className="relative w-full sm:w-1/3">
                    <input
                        type="text"
                        placeholder="Cari event..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                        />
                    </svg>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
