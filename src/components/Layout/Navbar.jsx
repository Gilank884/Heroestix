import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiUser } from "react-icons/fi";
import { MdOutlineContactSupport } from "react-icons/md";
import { HiOutlineInformationCircle } from "react-icons/hi";

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
        <header className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-7xl z-50 px-4">
            <div
                className={`
          rounded-2xl px-6 py-4 flex items-center gap-6
          transition-all duration-300 ease-in-out
          ${scrolled
                        ? "bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg border border-gray-200"
                        : "bg-white shadow-xl"}
        `}
            >
                {/* 🔵 Logo + Search */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Logo */}
                    <img
                        src={scrolled ? "/Logo/Logo.png" : "/Logo/LogoBanner.png"}
                        alt="Logo"
                        className="h-10 w-auto transition-all duration-300"
                    />

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Cari event..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`
    w-full pl-10 pr-4 py-2 rounded-xl transition
    focus:outline-none focus:ring-2
    ${scrolled
                                    ? "border border-gray-300 bg-blue-500 text-white placeholder-white focus:ring-white"
                                    : "border border-black bg-white/90 text-black placeholder-gray-500 focus:ring-blue-500"}
  `}
                        />
                        <FiSearch
                            className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg
                ${scrolled ? "text-white" : "text-blue-600"}`}
                        />
                    </div>
                </div>

                {/* 🔵 Menu Kanan */}
                <div
                    className={`ml-auto flex items-center gap-6 text-sm font-medium
            ${scrolled ? "text-white" : "text-black"}`}
                >
                    <Link to="/about-us" className="flex items-center gap-2 hover:opacity-80">
                        <HiOutlineInformationCircle size={18} />
                        Tentang Kami
                    </Link>

                    <Link to="/konsultasi" className="flex items-center gap-2 hover:opacity-80">
                        <MdOutlineContactSupport size={18} />
                        Konsultasi
                    </Link>

                    <Link to="/profile" className="flex items-center gap-2 hover:opacity-80">
                        <FiUser size={18} />
                        Profile
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
