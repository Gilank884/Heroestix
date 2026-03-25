import React, { useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import EventSection from "../../components/home/EventSection";
import BannerSlider from "../../components/home/BannerSlider";
import BottomBar from "../../components/Layout/Footer";

import { Ticket } from "lucide-react";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f172a] relative">
            <Navbar searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} />

            <div className="relative min-h-screen" onMouseMove={handleMouseMove}>
                {/* UNIFIED GRID BACKGROUND - Restricted to Hero + Event + Features sections */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {/* BASE LIGHT GRID (Gray) */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_60%,transparent_100%)] opacity-30"></div>

                    {/* INTERACTIVE GLOWING GRID (Blue - Neon Glow Layer) */}
                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_2px,transparent_2px),linear-gradient(to_bottom,#3b82f6_2px,transparent_2px)] bg-[size:2.5rem_2.5rem] blur-[2px]"
                        style={{
                            maskImage: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                            WebkitMaskImage: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                            opacity: 0.3
                        }}
                    ></div>

                    {/* INTERACTIVE GLOWING GRID (Blue - Sharp Core Layer) */}
                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_1.5px,transparent_1.5px),linear-gradient(to_bottom,#3b82f6_1.5px,transparent_1.5px)] bg-[size:2.5rem_2.5rem]"
                        style={{
                            maskImage: `radial-gradient(150px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                            WebkitMaskImage: `radial-gradient(150px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                            opacity: 0.4
                        }}
                    ></div>
                </div>

                <div className="relative">
                    {/* Banner Slider - Higher z-index to overlay content and prevent clipping */}
                    <div className="relative z-30">
                        {!searchTerm && <BannerSlider />}
                    </div>

                    <main className={`w-full bg-transparent relative z-10 ${searchTerm ? 'pt-36 pb-32' : 'pb-32'}`}>
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 pt-10 flex flex-col items-center">
                            <div className="w-full flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Ticket className="text-blue-600 dark:text-blue-400" size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        Pilih Tiket Anda
                                    </h2>
                                </div>
                            </div>

                            {/* EVENT SECTION: Handles its own data fetching and state */}
                            <EventSection searchTerm={searchTerm} />
                        </div>
                    </main>
                </div>
            </div>

            {/* FOOTER */}
            <BottomBar />
        </div>
    );
}
