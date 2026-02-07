import React, { useState, useEffect } from "react";

const HeroSection = () => {
    const banners = [
        "/assets/banner1.png",
        "/assets/banner2.png",
        "/assets/banner3.png",
        "/assets/banner4.png",
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate banners every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    return (
        <section className="relative w-full pt-32 md:pt-40 pb-16 px-4 sm:px-6 lg:px-12 overflow-hidden bg-slate-950">
            {/* PROFESSIONAL BLUE & SLATE BACKGROUND */}
            <div className="absolute inset-0">
                {/* Deep Background Gradient */}
                <div className="absolute inset-0 bg-slate-950"></div>

                {/* Modern Lens Flare / Glows */}
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[100px] rounded-full"></div>

                {/* Subtle Grid - Professional Tech Look */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Main Headline (Static) */}
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                        Rasakan Pengalaman Event Tak Terlupakan
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                        Gerbang utama Anda menuju konser eksklusif, festival meriah, dan pengalaman budaya yang memukau.
                    </p>
                </div>

                {/* 21:9 or 16:9 Aspect Ratio Container - Sleek & High fidelity */}
                <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10">
                    {banners.map((banner, index) => (
                        <div
                            key={index}
                            className={`
                                absolute inset-0 transition-all duration-1000 ease-in-out transform
                                ${index === currentIndex ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0"}
                            `}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10"></div>
                            <img
                                src={banner}
                                alt={`Banner ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}

                    {/* Navigation Dots - Professional Style */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`
                                    h-1.5 rounded-full transition-all duration-500
                                    ${index === currentIndex ? "w-10 bg-blue-500" : "w-4 bg-white/30 hover:bg-white/50"}
                                `}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

