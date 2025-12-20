import React, { useState } from "react";
import Navbar from "../components/Layout/Navbar";
import Card from "../components/home/EventSection";
import HeroSection from "../components/home/HeroSection";
import BottomBar from "../components/Layout/Footer";
import ImageBanner from "../components/home/ImageBanner";
import RegionSelector from "../components/home/RegionSelector";
import MidSection from "../components/home/MidSection";



import topEvents from "../data/TopEvent";
import newEvents from "../data/NewEvent";
import recommendedEvents from "../data/RecommendedEvent";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ITEMS = 5;

function EventSection({ title, data }) {
    const [page, setPage] = useState(0);
    const [fade, setFade] = useState(true);

    const totalPage = Math.ceil(data.length / ITEMS);

    const currentEvents = data.slice(
        page * ITEMS,
        page * ITEMS + ITEMS
    );

    const next = () => {
        if (page < totalPage - 1) {
            setFade(false);
            setTimeout(() => {
                setPage(page + 1);
                setFade(true);
            }, 200);
        }
    };

    const prev = () => {
        if (page > 0) {
            setFade(false);
            setTimeout(() => {
                setPage(page - 1);
                setFade(true);
            }, 200);
        }
    };

    return (
        <section className="mb-20">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                    {title}
                </h2>

                <div className="flex gap-2">
                    <button
                        onClick={prev}
                        disabled={page === 0}
                        className="p-2 rounded-full border disabled:opacity-40"
                    >
                        <FiChevronLeft />
                    </button>

                    <button
                        onClick={next}
                        disabled={page === totalPage - 1}
                        className="p-2 rounded-full border disabled:opacity-40"
                    >
                        <FiChevronRight />
                    </button>
                </div>
            </div>

            {/* CARD */}
            <div
                className={`
                    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6
                    transition-opacity duration-300
                    ${fade ? "opacity-100" : "opacity-0"}
                `}
            >
                {currentEvents.map((ev) => (
                    <Card key={ev.id} {...ev} />
                ))}

                <Card variant="more" />
            </div>
        </section>
    );
}

export default function Home() {
    return (
        <>
            <div className="bg-transparent h-40 w-full fixed top-0 left-0 z-40" />
            <Navbar />
            <HeroSection />

            <div className="bg-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-28">


                    <EventSection
                        title="Event Teratas"
                        data={topEvents}
                    />


                    <EventSection
                        title="Event Terbaru"
                        data={newEvents}
                    />

                    <ImageBanner
                        image="/assets/Dongker.png"
                        alt="Customer Care Yesplis"
                        href="/contact"
                    />

                    <EventSection
                        title="Rekomendasi Untuk Anda"
                        data={recommendedEvents}
                    />


                </div>

                <MidSection />
                <section className="w-full bg-white -mt-24">
                    <RegionSelector />
                </section>


                <section className="relative w-full">
                    {/* BACKGROUND PATTERN */}
                    <div
                        className="
            w-full
            h-[280px] md:h-[200px]
            bg-[url('/assets/Footer.png')]
            bg-no-repeat  
            bg-center
        "
                    />
                </section>



                <BottomBar />
            </div>
        </>
    );
}
