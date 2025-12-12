import React from "react";
import Navbar from "../components/Layout/Navbar";
import Card from "../components/Card";
import events from "../data/events";
import MidBanner from "../components/MidBanner";
import Footer from "../components/Layout/Footer";

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="p-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {events.map((ev) => (
                        <Card key={ev.id} {...ev} />
                    ))}
                </div>

                <MidBanner />
            </main>

            <Footer />
        </div>
    );
}
