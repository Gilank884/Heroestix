import React from "react";

const MidBanner = () => {
    return (
        <div
            className="w-full h-64 md:h-80 lg:h-96 rounded-sm overflow-hidden my-8 bg-cover bg-center"
            style={{
                backgroundImage: "url('/assets/landscape_banner.png')", // path gambar di public/assets
            }}
        ></div>
    );
};

export default MidBanner;
