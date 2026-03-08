import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2 } from "lucide-react";
import { HiCurrencyDollar, HiPresentationChartLine, HiRocketLaunch } from "react-icons/hi2";

gsap.registerPlugin(ScrollTrigger);

const AboutDescription = () => {
    const sectionRef = useRef(null);
    const contentRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Text Animation
            gsap.fromTo(
                contentRef.current.children,
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    stagger: 0.2,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 80%",
                        toggleActions: "play none none reverse",
                    },
                }
            );

            // Image Animation
            gsap.fromTo(
                imageRef.current,
                { x: 50, opacity: 0, scale: 0.95 },
                {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 1.2,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 75%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
            // Floating Cards Animation
            gsap.fromTo(
                ".floating-card",
                { y: 20, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.2,
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 60%",
                        toggleActions: "play none none reverse",
                    },
                }
            );

            // Floating Hover Effect
            gsap.to(".floating-card", {
                y: "-=10",
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: {
                    each: 0.5,
                    from: "random"
                }
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 px-6 bg-white dark:bg-[#0f172a] overflow-hidden">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* LEFT: CONTENT */}
                <div ref={contentRef} className="space-y-8">
                    <div className="inline-block">
                        <span className="text-blue-600 font-bold tracking-wider uppercase text-sm border-b-2 border-blue-600 pb-1">
                            Who We Are
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                        Platform Event <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                            Tanpa Batas.
                        </span>
                    </h2>

                    <div className="space-y-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        <p>
                            <span className="text-slate-900 dark:text-white font-bold">Heroestix</span> adalah jembatan digital yang menghubungkan imajinasi kreator dengan antusiasme penonton.
                        </p>
                        <p>
                            Kami bukan sekadar tempat menjual tiket. Kami adalah ekosistem yang dirancang untuk mempermudah setiap langkah dalam manajemen event, mulai dari promosi, penjualan, hingga analisis pasca-acara.
                        </p>
                    </div>

                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            "Manajemen Tiket Terpusat",
                            "Analisis Data Real-Time",
                            "Pembayaran Terintegrasi",
                            "Dukungan Komunitas Creator"
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <CheckCircle2 className="text-blue-500 shrink-0" size={20} />
                                <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div ref={imageRef} className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl -rotate-2"></div>
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 aspect-[4/3] group z-10 bg-white dark:bg-slate-900">
                        <img
                            src="/assets/become.png"
                            alt="Become a Heroestix Creator"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-500"></div>
                    </div>

                    {/* Floating Card 1: Income (Top Left) */}
                    <div className="floating-card absolute top-10 -left-6 md:-left-12 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl z-20 flex items-center gap-4 max-w-[200px] border border-slate-50 dark:border-slate-700">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <HiCurrencyDollar size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Potensi Income</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Unlimited</p>
                        </div>
                    </div>

                    {/* Floating Card 2: Analytics (Bottom Right) */}
                    <div className="floating-card absolute bottom-20 -right-6 md:-right-10 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl z-20 border border-slate-50 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <HiPresentationChartLine size={16} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Growth</span>
                        </div>
                        <div className="w-32 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="w-[90%] h-full bg-blue-600 dark:bg-blue-500 rounded-full"></div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Audience Reach <span className="text-blue-600 dark:text-blue-400 font-bold">90%</span></p>
                    </div>

                    {/* Floating Card 3: Status (Bottom Left) */}
                    <div className="floating-card absolute -bottom-6 left-10 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl z-20">
                        <div className="flex items-center gap-3 mb-1">
                            <HiRocketLaunch size={20} className="text-yellow-400" />
                            <span className="text-sm font-bold">Siap Mengudara?</span>
                        </div>
                        <p className="text-xs text-slate-400">Gabung sekarang juga</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutDescription;
