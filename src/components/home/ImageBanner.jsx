import React from "react";

export default function ImageBanner({ image, alt = "Banner", href }) {
    const Wrapper = href ? "a" : "div";

    return (
        <Wrapper
            {...(href ? { href } : {})}
            className="block w-full rounded-2xl overflow-hidden mb-16"
        >
            <img
                src={image}
                alt={alt}
                className="
                    w-full
                    h-[160px] sm:h-[200px] md:h-[240px]
                    object-cover
                "
            />
        </Wrapper>
    );
}
