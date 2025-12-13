import React from "react";

const MidBanner = () => {
    return (
        <section className="relative w-full bg-blue-600 py-24">
            {/* Floating Banner */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-20 w-[90%] max-w-5xl">
                <div className="rounded-2xl overflow-hidden shadow-2xl bg-white">
                    <img
                        src="/assets/landscape_banner.png"
                        alt="Banner"
                        className="w-full h-[220px] md:h-[280px] lg:h-[340px] object-cover"
                    />
                </div>
            </div>

            {/* Spacer biar section bawah ga ketiban */}
            <div className="h-24"></div>
        </section>
    );
};

export default MidBanner;
