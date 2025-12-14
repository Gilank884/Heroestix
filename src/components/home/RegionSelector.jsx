import {
    FaCity,
    FaLandmark,
    FaGopuram,
    FaDragon,
    FaSun,
    FaLeaf,
    FaMosque,
    FaWater,
    FaMonument,
} from "react-icons/fa";

const regions = [
    { name: "SUMATERA", icon: FaMonument },
    { name: "JABODETABEK", icon: FaCity },
    { name: "JAWA BARAT", icon: FaLandmark },
    { name: "DIY", icon: FaGopuram },
    { name: "JAWA TENGAH", icon: FaMonument },
    { name: "JAWA TIMUR", icon: FaDragon },
    { name: "KALIMANTAN", icon: FaLeaf },
    { name: "SULAWESI", icon: FaMosque },
    { name: "INDONESIA TIMUR", icon: FaSun },
];


export default function RegionSelector() {
    return (
        <section className="w-full  py-16 px-4">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">
                    Temukan Event Menarik di Kotamu!
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-8">
                    {regions.map((region, i) => {
                        const Icon = region.icon;
                        return (
                            <button
                                key={i}
                                className="group flex flex-col items-center gap-4"
                            >
                                <div className="w-20 h-20 flex items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-all duration-300 group-hover:scale-110">
                                    <Icon className="text-blue-600 text-4xl" />
                                </div>

                                <span className="text-sm font-semibold text-gray-900 text-center">
                                    {region.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
