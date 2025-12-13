import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Navbar = ({ searchTerm, setSearchTerm }) => {


    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);


    return (
        <header className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-7xl z-50">
            {/* Floating Container */}
            <div
                className={`
                    rounded-2xl px-6 py-4 flex flex-col sm:flex-row
                    sm:items-center sm:justify-between gap-4
                    transition-all duration-300 ease-in-out
                    ${scrolled
                        ? "bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg border border-gray-200"
                        : "bg-white shadow-xl"}
                `}
            >
                {/* Logo */}
                <img
                    src={scrolled ? "/Logo/Logo.png" : "/Logo/LogoBanner.png"}
                    alt="Logo"
                    className="h-10 w-auto transition-all duration-300"
                />

                {/* Search Input */}
                <div className="relative w-full sm:w-1/3">
                    <input
                        type="text"
                        placeholder="Cari event..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`
                            w-full pl-10 pr-4 py-2 rounded-xl transition
                            focus:outline-none focus:ring-2
                            ${scrolled
                                ? "border border-gray-300 focus:ring-blue-500"
                                : "border border-black bg-white/90 focus:ring-white"}
                        `}
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-5 h-5 absolute left-3 top-2.5 ${scrolled ? "text-gray-400" : "text-blue-600"
                            }`}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                        />
                    </svg>
                </div>

                {/* Right Links */}
                <div
                    className={`flex gap-6 text-sm font-medium ${scrolled ? "text-gray-700" : "text-black"
                        }`}
                >
                    <Link to="/about-us" className="hover:opacity-80">
                        Tentang Kami
                    </Link>
                    <Link to="/konsultasi" className="hover:opacity-80">
                        Konsultasi
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
