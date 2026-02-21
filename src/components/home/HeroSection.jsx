import React, { useState, useEffect } from "react";

const HeroSection = () => {
    const banners = [
        "/assets/banner01.png",
        "/assets/banner02.png",
        "/assets/banner03.png",
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
        <section className="relative w-full pt-32 md:pt-40 pb-4 px-4 sm:px-6 lg:px-12 overflow-hidden bg-transparent">
            <div className="max-w-4xl mx-auto relative z-10">
                {/* 21:9 or 16:9 Aspect Ratio Container - Sleek & High fidelity */}
                <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    {banners.map((banner, index) => (
                        <div
                            key={index}
                            className={`
                                absolute inset-0 transition-all duration-1000 ease-in-out transform
                                ${index === currentIndex ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0"}
                            `}
                        >
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
                                aria-label={`Go to slide ${index + 1}`}
                                className={`
                                    h-1.5 rounded-full transition-all duration-500
                                    ${index === currentIndex ? "w-10 bg-blue-600" : "w-4 bg-slate-400/50 hover:bg-slate-400/80"}
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

