import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


gsap.registerPlugin(ScrollTrigger);


export default function useFadeIn() {
    const ref = useRef(null);
    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        const ctx = gsap.context(() => {
            gsap.from(el, {
                opacity: 0,
                y: 30,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
            });
        }, el);


        return () => ctx.revert();
    }, []);


    return ref;
}