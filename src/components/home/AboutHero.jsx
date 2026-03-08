import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ArrowRight, Star, ShieldCheck, Zap, Users } from "lucide-react";

const AboutHero = () => {
    const heroRef = useRef(null);
    const textRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Background Animation
            gsap.to(".floating-orb", {
                y: "random(-30, 30)",
                x: "random(-20, 20)",
                duration: "random(4, 6)",
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: 0.5,
            });

            // Entrance Text
            gsap.fromTo(
                textRef.current.children,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out" }
            );

            // Image Reveal
            gsap.fromTo(
                imageRef.current,
                { scale: 0.8, opacity: 0, rotation: -2 },
                { scale: 1, opacity: 1, rotation: 0, duration: 1.2, ease: "power3.out", delay: 0.3 }
            );
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={heroRef} className="relative w-full min-h-[85vh] pt-32 pb-20 px-6 bg-slate-950 overflow-hidden flex items-center">
            {/* BACKGROUND ELEMENTS */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="floating-orb absolute -top-20 -left-20 w-[40vw] h-[40vw] bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="floating-orb absolute top-1/2 -right-20 w-[35vw] h-[35vw] bg-purple-600/15 rounded-full blur-[100px]"></div>

                {/* Noise & Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
            </div>

            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                {/* LEFT: TEXT */}
                <div ref={textRef} className="space-y-8 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm font-bold backdrop-blur-sm">
                        <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                        <span>Revolusi Event Digital</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
                        Lebih Dari Sekadar <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                            Platform Tiket.
                        </span>
                    </h1>

                    <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                        Heroestix membangun ekosistem di mana setiap kreator dapat bersinar dan setiap penonton mendapatkan pengalaman yang tak terlupakan.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start pt-4">
                        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <ShieldCheck className="text-green-400" size={24} />
                            <div className="text-left">
                                <p className="text-white font-bold text-sm">100% Aman</p>
                                <p className="text-slate-500 text-xs">Transaksi Terjamin</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Users className="text-blue-400" size={24} />
                            <div className="text-left">
                                <p className="text-white font-bold text-sm">Komunitas</p>
                                <p className="text-slate-500 text-xs">Ribuan Creator</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: HERO IMAGE */}
                <div ref={imageRef} className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-2xl rotate-6 blur-md"></div>

                    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/50 backdrop-blur-sm group">
                        <img
                            src="/Logo/Hero.png"
                            alt="About Heroestix"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                        {/* Floating Badge */}
                        <div className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-lg">
                            <p className="text-white font-bold text-lg">Since 2024</p>
                            <p className="text-blue-300 text-sm">Building the Future</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutHero;
