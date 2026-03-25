import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BannerSlider() {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const { data, error } = await supabase
                    .from('banners')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });
                
                if (error) throw error;
                setBanners(data || []);
            } catch (err) {
                console.error('Error fetching banners:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [banners]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    if (loading || banners.length === 0) return null;

    return (
        <div className="relative w-full pt-32 md:pt-40 pb-4 px-4 sm:px-6 lg:px-12 bg-transparent group">
            <div className="max-w-4xl mx-auto relative z-10 transition-all duration-700">
                <div className="relative aspect-[18/6] rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_32px_64px_-20px_rgba(59,130,246,0.3)] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.6, ease: "circOut" }}
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => {
                                const url = banners[currentIndex].link_url;
                                if (!url) return;
                                if (url.startsWith('http')) {
                                    window.open(url, '_blank');
                                } else {
                                    navigate(url);
                                }
                            }}
                        >
                            <img 
                                src={banners[currentIndex].image_url} 
                                alt={banners[currentIndex].title}
                                className="w-full h-full object-cover"
                            />

                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    {banners.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-20"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-20"
                            >
                                <ChevronRight size={20} />
                            </button>

                            {/* Pagination Dots */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                                {banners.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                        className={`h-1.5 transition-all rounded-full ${idx === currentIndex ? 'w-8 bg-blue-500' : 'w-2 bg-white/40 hover:bg-white'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
