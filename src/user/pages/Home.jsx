import React, { useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import EventSection from "../../components/home/EventSection";
import HeroSection from "../../components/home/HeroSection";
import FeaturesSection from "../../components/home/FeaturesSection";
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
        <div className="min-h-screen bg-white relative">
            <Navbar />

            <div className="relative" onMouseMove={handleMouseMove}>
                {/* UNIFIED GRID BACKGROUND - Restricted to Hero + Event + Features sections */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {/* BASE LIGHT GRID (Gray) */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_60%,transparent_100%)]"></div>

                    {/* INTERACTIVE GLOWING GRID (Blue - Neon Glow Layer) */}
                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_2px,transparent_2px),linear-gradient(to_bottom,#3b82f6_2px,transparent_2px)] bg-[size:2.5rem_2.5rem] blur-[2px]"
                        style={{
                            maskImage: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                            WebkitMaskImage: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                            opacity: 0.8
                        }}
                    ></div>

                    {/* INTERACTIVE GLOWING GRID (Blue - Sharp Core Layer) */}
                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_1.5px,transparent_1.5px),linear-gradient(to_bottom,#3b82f6_1.5px,transparent_1.5px)] bg-[size:2.5rem_2.5rem]"
                        style={{
                            maskImage: `radial-gradient(150px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                            WebkitMaskImage: `radial-gradient(150px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                        }}
                    ></div>
                </div>

                <div className="relative z-10">
                    {/* HERO SECTION */}
                    <HeroSection />

                    <main className="w-full bg-transparent relative z-20 pb-32">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 flex flex-col items-center">
                            <div className="w-full flex items-center gap-2 mb-6">
                                <Ticket className="text-black" size={20} />
                                <h2 className="text-lg font-bold text-black tracking-tight">
                                    Pilih Tiket Anda
                                </h2>
                            </div>

                            {/* EVENT SECTION: Handles its own data fetching and state */}
                            <EventSection searchTerm={searchTerm} />
                        </div>
                    </main>

                    {/* FEATURES SECTION - Now inside the grid wrapper */}
                    <FeaturesSection />
                </div>
            </div>

            {/* FOOTER */}
            <BottomBar />
        </div>
    );
}
