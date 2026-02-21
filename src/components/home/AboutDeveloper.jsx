import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, Code2, Cpu, Globe2, Zap } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const AboutDeveloper = () => {
    const sectionRef = useRef(null);
    const contentRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Image Animation (Slide from Left)
            gsap.fromTo(
                imageRef.current,
                { x: -50, opacity: 0, scale: 0.95 },
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

            // Text Animation (Slide from Right)
            gsap.fromTo(
                contentRef.current.children,
                { x: 50, opacity: 0 },
                {
                    x: 0,
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
            // Floating Badges Animation
            gsap.fromTo(
                ".floating-badge",
                { scale: 0, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "back.out(1.7)",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 70%",
                    },
                }
            );

            // Continuous Floating
            gsap.to(".floating-badge", {
                y: "random(-10, 10)",
                x: "random(-5, 5)",
                duration: "random(2, 4)",
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
        <section ref={sectionRef} className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50 overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

                {/* LEFT: IMAGE */}
                <div ref={imageRef} className="relative order-2 lg:order-1">
                    <div className="absolute -inset-4 bg-gradient-to-tl from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-[2.5rem] rotate-2"></div>
                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 aspect-[4/3] group bg-white dark:bg-slate-800 p-8 flex items-center justify-center">
                        <img
                            src="/assets/peristiwa.png"
                            alt="PT Peristiwa Kreatif Nusantara"
                            className="w-2/3 h-auto object-contain transform group-hover:scale-110 transition-transform duration-700 ease-in-out dark:brightness-[0.8] dark:contrast-[1.2]"
                        />
                    </div>
                    {/* Floating Badge 1: Expert Engineers (Bottom Right) */}
                    <div className="floating-badge absolute -bottom-6 -right-2 bg-white dark:bg-slate-700 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 flex items-center gap-3 z-20">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Code2 size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Team</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Expert Engineers</p>
                        </div>
                    </div>

                    {/* Floating Badge 2: Certified (Top Left) */}
                    <div className="floating-badge absolute -top-4 -left-4 bg-white dark:bg-slate-700 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 flex items-center gap-3 z-20">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle2 size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Quality</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Certified</p>
                        </div>
                    </div>

                    {/* Floating Badge 3: Innovation (Top Right) */}
                    <div className="floating-badge absolute top-10 -right-8 bg-white dark:bg-slate-700 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 flex items-center gap-3 z-20">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Cpu size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Tech</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Innovation</p>
                        </div>
                    </div>

                    {/* Floating Badge 4: Global Scale (Bottom Left) */}
                    <div className="floating-badge absolute bottom-8 -left-8 bg-white dark:bg-slate-700 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 flex items-center gap-3 z-20">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <Globe2 size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Reach</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Global Scale</p>
                        </div>
                    </div>

                    {/* Floating Badge 5: Security (Center Right Edge) */}
                    <div className="floating-badge absolute top-1/2 -right-10 bg-white dark:bg-slate-700 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 flex items-center gap-3 z-20">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                            <CheckCircle2 size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Data</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Secure</p>
                        </div>
                    </div>

                    {/* Floating Badge 6: Creative (Center Left Edge) */}
                    <div className="floating-badge absolute top-1/2 -left-12 bg-white dark:bg-slate-700 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 flex items-center gap-3 z-20">
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                            <Zap size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Idea</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Creative</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT: CONTENT */}
                <div ref={contentRef} className="space-y-8 order-1 lg:order-2">
                    <div className="inline-block">
                        <span className="text-blue-600 font-bold tracking-wider uppercase text-sm border-b-2 border-blue-600 pb-1">
                            The Developer
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                        PT Peristiwa Kreatif <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
                            Nusantara.
                        </span>
                    </h2>

                    <div className="space-y-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        <p>
                            Di balik kecanggihan Heroestix, terdapat <span className="text-slate-900 dark:text-white font-bold">PT Peristiwa Kreatif Nusantara</span>, sebuah perusahaan teknologi yang berdedikasi untuk merevolusi industri event di Indonesia.
                        </p>
                        <p>
                            Kami menggabungkan kreativitas anak bangsa dengan teknologi terkini untuk menciptakan solusi digital yang tidak hanya fungsional, tetapi juga memberikan pengalaman pengguna yang luar biasa.
                        </p>
                    </div>

                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { text: "Teknologi Terdepan", icon: <Cpu size={18} /> },
                            { text: "Skalabilitas Tinggi", icon: <Globe2 size={18} /> },
                            { text: "Keamanan Data Prioritas", icon: <CheckCircle2 size={18} /> },
                            { text: "Inovasi Berkelanjutan", icon: <Code2 size={18} /> }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="text-blue-500 dark:text-blue-400 shrink-0">
                                    {item.icon}
                                </div>
                                <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default AboutDeveloper;
