import React, { useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import EventSection from "../../components/home/EventSection";
import HeroSection from "../../components/home/HeroSection";
import FeaturesSection from "../../components/home/FeaturesSection";
import BottomBar from "../../components/Layout/Footer";

import { Ticket } from "lucide-react";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* HERO SECTION */}
            <HeroSection />

            <main className="w-full bg-slate-50 relative z-20 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 flex flex-col items-center">
                    <div className="w-full flex items-center gap-2 mb-6">
                        <Ticket className="text-gray-500" size={20} />
                        <h2 className="text-lg font-bold text-gray-500 tracking-tight">
                            Ticket Yang Tersedia
                        </h2>
                    </div>

                    {/* EVENT SECTION: Handles its own data fetching and state */}
                    <EventSection searchTerm={searchTerm} />
                </div>
            </main>

            {/* FEATURES SECTION */}
            <FeaturesSection />

            {/* FOOTER */}
            <BottomBar />
        </div>
    );
}
