import React from "react";
import AboutHero from '../../components/about-us/AboutHero';
import AboutVision from '../../components/about-us/AboutVision';
import AboutValues from '../../components/about-us/AboutValues';
import TicketSystemSection from '../../components/about-us/TicketSystemSection';
import ClientSection from '../../components/about-us/ClientSection';
import PaymentSection from '../../components/about-us/PaymentSection';
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import { motion } from "framer-motion";

export default function AboutUsPage() {
    return (
        <div className="bg-[#fdf5f2] selection:bg-[#b1451a]/10">
            <Navbar />

            <main>
                <AboutHero />

                <AboutVision />

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="py-12 bg-white"
                >
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="h-px bg-slate-100 w-full" />
                    </div>
                </motion.div>

                <AboutValues />

                <div className="bg-white py-24 pb-32">
                    <div className="max-w-7xl mx-auto px-6 space-y-32">
                        <TicketSystemSection />
                        <ClientSection />
                        <PaymentSection />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
