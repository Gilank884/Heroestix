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
                    <div className="flex flex-col items-center gap-4 mb-12">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                            <Ticket size={28} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight text-center">
                            Ticket Yang <span className="text-blue-600">Tersedia</span>
                        </h2>
                        <div className="h-1.5 w-12 bg-blue-600 rounded-full" />
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
