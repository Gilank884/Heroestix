import React from "react";
import { Link } from "react-router-dom";
import { FaLinkedinIn, FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import LogoBanner from "../../../public/Logo/LogoBanner.png";

export default function Footer() {
    return (
        <footer className="bg-orange-100 text-gray-800 border-t mt-16">
            <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {/* Logo dan Deskripsi */}
                <div className="col-span-2">
                    <div className="flex items-center space-x-1">
                        <img
                            src={LogoBanner}
                            alt="Logo"
                            Link to="/home"
                            className="h-10 w-auto"
                        />
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-gray-600">
                        GAASSSS GAK SIH BELUM BELI TICKET
                    </p>
                </div>

                {/* Program */}
                <div>
                    <h3 className="font-semibold text-lg mb-3">Product</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/bootcamp" className="hover:text-blue-600">Ticket</Link></li>
                        <li><Link to="/video-course" className="hover:text-blue-600">Event Organizing</Link></li>
                        <li><Link to="/event-workshop" className="hover:text-blue-600">Sponsorship</Link></li>
                        <li><Link to="/digital-product" className="hover:text-blue-600">Event Production</Link></li>
                    </ul>
                </div>
                {/* About */}
                <div>
                    <h3 className="font-semibold text-lg mb-3">About</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/about-us" className="hover:text-blue-600">Tentang Kami</Link></li>
                        <li><Link to="/alumni" className="hover:text-blue-600">Terms And Condition</Link></li>
                        <li><Link to="/karir" className="hover:text-blue-600">Career</Link></li>
                        <li><Link to="/blog" className="hover:text-blue-600">Pusat Dan Bantuan</Link></li>
                    </ul>
                </div>

                {/* Bantuan */}
                <div>
                    <h3 className="font-semibold text-lg mb-3">Bantuan</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/faq" className="hover:text-blue-600">FAQ</Link></li>
                        <li><Link to="/verifikasi-sertifikat" className="hover:text-blue-600">Verifikasi Sertifikat</Link></li>
                        <li><Link to="/syarat-ketentuan" className="hover:text-blue-600">Syarat & Ketentuan</Link></li>
                        <li><Link to="/kebijakan-privasi" className="hover:text-blue-600">Kebijakan Privasi</Link></li>
                        <li><Link to="/kebijakan-garansi" className="hover:text-blue-600">Kebijakan Garansi</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t mt-8 py-6 text-center text-sm text-gray-500">
                <div className="flex justify-center space-x-5 mb-4">
                    <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <FaLinkedinIn />
                    </a>
                    <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <FaFacebookF />
                    </a>
                    <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <FaInstagram />
                    </a>
                    <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <FaTwitter />
                    </a>
                </div>

                <p>© . All rights reserved.</p>
            </div>
        </footer>
    );
}
