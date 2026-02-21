import React from "react";
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import AboutHero from "../../components/home/AboutHero";
import AboutDescription from "../../components/home/AboutDescription";
import AboutDeveloper from "../../components/home/AboutDeveloper";
import { motion } from "framer-motion";

export default function AboutUsPage() {
    return (
        <div className="bg-white dark:bg-[#0f172a] min-h-screen">
            <Navbar />

            <main>
                {/* Hero Section - Redesigned with GSAP & Hero.png */}
                <AboutHero />

                {/* What is Heroestix Section */}
                <AboutDescription />

                {/* Developer Section - PT Peristiwa Kreatif Nusantara */}
                <AboutDeveloper />



            </main>

            <Footer />
        </div>
    );
}
