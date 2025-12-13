import React from "react";
import Navbar from "../components/Layout/Navbar";
import Card from "../components/Card";
import events from "../data/events";
import MidBanner from "../components/MidBanner";
import Footer from "../components/Layout/Footer";

export default function Home() {
    return (
        <>

            <div className="bg-transparent h-40 w-full fixed top-0 left-0 z-40" />

            {/* NAVBAR */}
            <Navbar />

            {/* 🟢 KONTEN PUTIH */}
            <MidBanner />
            <div className="bg-white min-h-screen">

                {/* Section Card */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-28">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {events.map((ev) => (
                            <Card key={ev.id} {...ev} />
                        ))}
                    </div>
                </section>

                <Footer />
            </div>
        </>
    );
}
