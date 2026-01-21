import React from "react";

const CollaboratorSection = () => {
    const collaborators = [
        { name: "Partner 1", logo: "https://via.placeholder.com/150x80?text=EO+Partner+1" },
        { name: "Partner 2", logo: "https://via.placeholder.com/150x80?text=EO+Partner+2" },
        { name: "Partner 3", logo: "https://via.placeholder.com/150x80?text=EO+Partner+3" },
        { name: "Partner 4", logo: "https://via.placeholder.com/150x80?text=EO+Partner+4" },
        { name: "Partner 5", logo: "https://via.placeholder.com/150x80?text=EO+Partner+5" },
        { name: "Partner 6", logo: "https://via.placeholder.com/150x80?text=EO+Partner+6" },
    ];

    return (
        <section id="collaborators" className="py-20 bg-gray-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Dipercaya oleh Banyak Partner
                    </h2>
                    <div className="w-20 h-1 bg-[#b1451a] mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    {collaborators.map((partner, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center hover:shadow-md hover:border-orange-200 transition-all duration-300 transform hover:-translate-y-1 grayscale hover:grayscale-0 opacity-70 hover:opacity-100"
                        >
                            <img
                                src={partner.logo}
                                alt={partner.name}
                                className="max-h-12 w-auto object-contain"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CollaboratorSection;
