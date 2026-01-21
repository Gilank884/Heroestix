import React, { useState, useMemo } from "react";
import Navbar from "../../components/Layout/Navbar";
import Card from "../../components/home/EventSection";
import HeroSection from "../../components/home/HeroSection";
import FAQSection from "../../components/home/FAQSection";
import FeaturesSection from "../../components/home/FeaturesSection";
import BottomBar from "../../components/Layout/Footer";

import topEvents from "../../data/TopEvent";
import newEvents from "../../data/NewEvent";
import recommendedEvents from "../../data/RecommendedEvent";

import { FiSearch } from "react-icons/fi";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");

    // Combine all events for a unified searchable list
    const allEvents = useMemo(() => {
        const combined = [...topEvents, ...newEvents, ...recommendedEvents];
        // Remove duplicates if any (by id)
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
    }, []);

    // Filter logic
    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            return event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location?.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [allEvents, searchTerm]);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* HERO SECTION */}
            <HeroSection />

            {/* MARQUEE SECTION - Seamless Divider */}
            <section className="relative z-30 overflow-hidden -mt-10">
                <div className="w-full bg-[#b1451a] py-6 shadow-[0_15px_30px_rgba(0,0,0,0.1)] skew-y-[-1deg] border-y-4 border-orange-300/30">
                    <div className="flex whitespace-nowrap animate-marquee">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className="text-3xl md:text-5xl font-black text-white px-8 uppercase tracking-tighter italic">
                                LETS COLLABORATE WITH US •
                            </span>
                        ))}
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        display: flex;
                        width: max-content;
                        animation: marquee 20s linear infinite;
                    }
                    @keyframes marquee-reverse {
                        0% { transform: translateX(-50%); }
                        100% { transform: translateX(0); }
                    }
                    .animate-marquee-reverse {
                        display: flex;
                        width: max-content;
                        animation: marquee-reverse 20s linear infinite;
                    }
                `}} />
            </section>

            <main className="w-full bg-[#5d3a24] relative z-20 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-16">
                    {/* EVENTS GRID */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                                UPCOMING <span className="text-[#b1451a]">EVENTS</span>
                            </h2>
                            <p className="text-orange-200/60 font-medium">Temukan event seru yang akan datang</p>
                        </div>
                        <div className="hidden md:flex gap-2">
                            <span className="text-sm font-bold text-white py-2.5 px-6 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">Explore Semuanya</span>
                        </div>
                    </div>

                    {filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredEvents.map((ev) => (
                                <Card key={ev.id} {...ev} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white/5 rounded-xl border-2 border-dashed border-white/10 backdrop-blur-sm">
                            <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                                <FiSearch size={40} className="text-orange-200" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Event tidak ditemukan</h3>
                            <p className="text-gray-500 mt-2">Coba gunakan kata kunci atau filter lain</p>
                        </div>
                    )}
                </div>

                {/* BOTTOM REVERSE MARQUEE */}
                <div className="mt-20 overflow-hidden">
                    <div className="w-full bg-[#b1451a] py-6 shadow-[0_-15px_30px_rgba(0,0,0,0.1)] skew-y-[1deg] border-y-4 border-orange-300/30">
                        <div className="flex whitespace-nowrap animate-marquee-reverse">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <span key={i} className="text-3xl md:text-5xl font-black text-white px-8 uppercase tracking-tighter italic">
                                    HEROESTIX BY PERISTIWA •
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* FEATURES SECTION */}
            <FeaturesSection />

            {/* FAQ SECTION */}
            <FAQSection />

            {/* FOOTER */}
            <BottomBar />
        </div>
    );
}
