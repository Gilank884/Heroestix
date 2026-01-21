import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import topEvents from "../../data/TopEvent";

const INTERVAL = 8000;

export default function MidSection() {
    const [index, setIndex] = useState(0);

    // Ambil 4 event per slide
    const visibleEvents = topEvents.slice(index, index + 4);

    useEffect(() => {
        if (topEvents.length <= 4) return;

        const timer = setInterval(() => {
            setIndex((prev) =>
                prev + 4 >= topEvents.length ? 0 : prev + 4
            );
        }, INTERVAL);

        return () => clearInterval(timer);
    }, []);

    return (
        <section className="w-full py-24 bg-gradient-to-r from-[#b1451a] via-[#f28b2a] to-[#d66a4a] overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 text-center text-white">

                {/* HEADER */}
                <h2 className="text-2xl md:text-3xl font-bold -mt-8 mb-3">
                    Event Terpopuler
                </h2>
                <p className="text-white/80 mb-14 max-w-2xl mx-auto">
                    Event yang paling banyak diminati oleh pengguna Hai-Ticket.
                </p>

                {/* IMAGE SLIDER */}
                <div className="relative h-[200px] md:h-[220px] flex justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{
                                duration: 0.6,
                                ease: "easeInOut",
                            }}
                            className="absolute grid grid-cols-2 md:grid-cols-4 gap-18"
                        >
                            {visibleEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="
                                        rounded-xl overflow-hidden
                                        shadow-xl hover:shadow-2xl
                                        transition-all duration-300
                                        hover:-translate-y-2
                                    "
                                >
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="
                                            w-[200px] md:w-[260px]
                                        h-[140px] md:h-[180px]

                                            object-cover
                                        "
                                    />

                                </div>

                            ))}
                        </motion.div>
                    </AnimatePresence>

                </div>
                <p className="text-white/80 mb-14 max-w-2xl mx-auto">
                    Pilih event favoritmu dan jangan sampai ketinggalan!
                </p>
            </div>
        </section>
    );
}
