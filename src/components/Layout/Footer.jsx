import React from "react";
import { Link } from "react-router-dom";
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from "react-icons/fi";

export default function BottomBar() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#1a1a1a] text-white pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {/* Column 1: Brand Info */}
                <div className="space-y-6">
                    <img
                        src="/Logo/Logo.png"
                        alt="Heroestix Logo"
                        className="h-12 w-auto brightness-0 invert"
                    />
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Heroestix adalah platform ticketing modern yang memudahkan Anda untuk menemukan dan memesan tiket event favorit dengan mudah, cepat, dan aman.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-[#b1451a] transition-all">
                            <FiFacebook size={18} />
                        </a>
                        <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-[#b1451a] transition-all">
                            <FiTwitter size={18} />
                        </a>
                        <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-[#b1451a] transition-all">
                            <FiInstagram size={18} />
                        </a>
                    </div>
                </div>

                {/* Column 2: Quick Links */}
                <div>
                    <h4 className="text-lg font-bold mb-8">Tautan Cepat</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><Link to="/" className="hover:text-white transition-colors">Beranda</Link></li>
                        <li><Link to="/#events" className="hover:text-white transition-colors">Cari Event</Link></li>
                        <li><Link to="/#collaborators" className="hover:text-white transition-colors">Jadi Kolaborator</Link></li>
                        <li><Link to="/#faq" className="hover:text-white transition-colors">Bantuan (FAQ)</Link></li>
                        <li><Link to="/about-us" className="hover:text-white transition-colors">Tentang Kami</Link></li>
                    </ul>
                </div>

                {/* Column 3: Legal & Support */}
                <div>
                    <h4 className="text-lg font-bold mb-8">Dukungan</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Kebijakan Merchant</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Pusat Bantuan</a></li>
                    </ul>
                </div>

                {/* Column 4: Contact Info */}
                <div>
                    <h4 className="text-lg font-bold mb-8">Hubungi Kami</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li className="flex items-center gap-3">
                            <FiMail className="text-[#b1451a]" size={18} />
                            <span>support@heroestix.com</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiPhone className="text-[#b1451a]" size={18} />
                            <span>+62 (21) 1234 5678</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiMapPin className="text-[#b1451a]" size={18} />
                            <span>Jakarta, Indonesia</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/10 text-center">
                <p className="text-gray-500 text-xs">
                    &copy; {currentYear} Heroestix – Platform Ticketing Terpercaya. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
