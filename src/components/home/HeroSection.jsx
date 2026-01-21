import React, { useState, useEffect } from "react";

const HeroSection = () => {
    const banners = [
        "/assets/banner1.png",
        "/assets/banner2.png",
        "/assets/banner3.png"
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
        <section className="relative w-full pt-28 md:pt-36 pb-10 px-4 sm:px-6 lg:px-12 overflow-hidden">
            {/* BROWN GRADIENT & PATTERN BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4a2e1d] via-[#b1451a] to-[#f59e0b]">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>

                {/* Decorative Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-400 blur-[120px] rounded-full opacity-30"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-900 blur-[150px] rounded-full opacity-20"></div>
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* 16:9 Aspect Ratio Container */}
                <div className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-xl">
                    {banners.map((banner, index) => (
                        <div
                            key={index}
                            className={`
                                absolute inset-0 transition-opacity duration-1000 ease-in-out
                                ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"}
                            `}
                        >
                            <img
                                src={banner}
                                alt={`Banner ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}

                    {/* Navigation Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`
                                    w-2 h-2 rounded-full transition-all duration-300
                                    ${index === currentIndex ? "w-6 bg-white" : "bg-white/50"}
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
