import React from "react";
import { Link } from "react-router-dom";
import {
    Twitter,
    Instagram,
    Linkedin,
    Github
} from "lucide-react";

export default function BottomBar() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white py-20 border-t border-slate-100">
            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center">
                    {/* Brand Mark - Minimalist */}
                    <div className="mb-12">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] shadow-lg shadow-blue-600/10">
                                <img
                                    src="/Logo/Logo.png"
                                    alt="Heroestix"
                                    className="h-6 w-auto brightness-0 invert"
                                />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">
                                Heroestix
                            </span>
                        </Link>
                    </div>

                    {/* Navigation - Clean Typography */}
                    <nav className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-12">
                        {[
                            { name: "Beranda", path: "/" },
                            { name: "Become a creator", path: "/become-creator" },
                            { name: "About Us", path: "/about-us" },
                            { name: "Contact Us", path: "https://wa.me/6282332901726", isExternal: true }
                        ].map((link, idx) => (
                            link.isExternal ? (
                                <a
                                    key={idx}
                                    href={link.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                                >
                                    {link.name}
                                </a>
                            ) : (
                                <Link
                                    key={idx}
                                    to={link.path}
                                    className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}
                    </nav>

                    {/* Socials - Simple Icons */}
                    <div className="flex gap-8 mb-12">
                        {[
                            { icon: <Instagram size={18} />, path: "#" },
                            { icon: <Twitter size={18} />, path: "#" },
                            { icon: <Linkedin size={18} />, path: "#" }
                        ].map((item, idx) => (
                            <a
                                key={idx}
                                href={item.path}
                                className="text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                {item.icon}
                            </a>
                        ))}
                    </div>

                    {/* Footnote - Minimalist Secondary Info */}
                    <div className="w-full pt-12 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-[13px] text-slate-400 font-medium">
                            &copy; {currentYear} Heroestix Platform. Built for the community.
                        </p>

                        <div className="flex gap-8">
                            <Link to="/privacy" className="text-[13px] text-slate-400 font-medium hover:text-slate-900 transition-colors">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="text-[13px] text-slate-400 font-medium hover:text-slate-900 transition-colors">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
