// export array of event objects
const events = [
    {
        id: 1,
        image: "/assets/ticket3.png",
        title: "[SURABAYA] TUR PERTUNJUKAN",
        date: "17 Januari 2026",
        location: "TBA | Surabaya, Jawa Timur, Indonesia",
        price: 70000
    },
    {
        id: 2,
        image: "/assets/ticket1.png",
        title: "[PURWOKERTO] TUR PERTUNJUKAN",
        date: "06 Desember 2025",
        location: "TBA | Purwokerto, Kabupaten Banyumas, Jawa Tengah",
        price: 70000
    },
    {
        id: 3,
        image: "/assets/ticket5.png",
        title: "HERBALIFE SUPERHERO RUN",
        date: "08 Februari 2026",
        location: "Area Pameran Temanggung Tilung | Palangka Raya",
        price: 175000
    },
    {
        id: 4,
        image: "/assets/ticket3.png",
        title: "MARPESTA",
        date: "21 Februari 2026",
        location: "Auditorium Driyarkara | Sanata Dharma",
        price: 20000
    },
    {
        id: 5,
        image: "/assets/ticket4.png",
        title: "FESTIVAL MUSIK INDIE",
        date: "15 Maret 2026",
        location: "Lapangan Merdeka, Jakarta",
        price: 120000
    },
    {
        id: 6,
        image: "/assets/ticket6.png",
        title: "ART EXHIBITION 2026",
        date: "28 April 2026",
        location: "Museum Seni Modern, Bandung",
        price: 50000
    },
    {
        id: 7,
        image: "/assets/ticket7.png",
        title: "TEATER ANAK BANGSA",
        date: "10 Mei 2026",
        location: "Gedung Kesenian Jakarta",
        price: 90000
    },
    {
        id: 8,
        image: "/assets/ticket8.png",
        title: "TECH CONFERENCE 2026",
        date: "05 Juni 2026",
        location: "ICE BSD, Tangerang",
        price: 250000
    },
    {
        id: 1,
        image: "/assets/ticket1.png",
        title: "[SURABAYA] TUR PERTUNJUKAN",
        date: "17 Januari 2026",
        location: "TBA | Surabaya, Jawa Timur, Indonesia",
        price: 70000
    },
    {
        id: 2,
        image: "/assets/ticket2.png",
        title: "[PURWOKERTO] TUR PERTUNJUKAN",
        date: "06 Desember 2025",
        location: "TBA | Purwokerto, Kabupaten Banyumas, Jawa Tengah",
        price: 70000
    },
    {
        id: 3,
        image: "/assets/ticket5.png",
        title: "HERBALIFE SUPERHERO RUN",
        date: "08 Februari 2026",
        location: "Area Pameran Temanggung Tilung | Palangka Raya",
        price: 175000
    },
    {
        id: 4,
        image: "/assets/ticket3.png",
        title: "MARPESTA",
        date: "21 Februari 2026",
        location: "Auditorium Driyarkara | Sanata Dharma",
        price: 20000
    },
    {
        id: 5,
        image: "/assets/ticket4.png",
        title: "FESTIVAL MUSIK INDIE",
        date: "15 Maret 2026",
        location: "Lapangan Merdeka, Jakarta",
        price: 120000
    },
    {
        id: 6,
        image: "/assets/ticket6.png",
        title: "ART EXHIBITION 2026",
        date: "28 April 2026",
        location: "Museum Seni Modern, Bandung",
        price: 50000
    },
    {
        id: 7,
        image: "/assets/ticket7.png",
        title: "TEATER ANAK BANGSA",
        date: "10 Mei 2026",
        location: "Gedung Kesenian Jakarta",
        price: 90000
    },
    {
        id: 8,
        image: "/assets/ticket8.png",
        title: "TECH CONFERENCE 2026",
        date: "05 Juni 2026",
        location: "ICE BSD, Tangerang",
        price: 250000
    },
    {
        id: 1,
        image: "/assets/ticket1.png",
        title: "[SURABAYA] TUR PERTUNJUKAN",
        date: "17 Januari 2026",
        location: "TBA | Surabaya, Jawa Timur, Indonesia",
        price: 70000
    },
    {
        id: 2,
        image: "/assets/ticket2.png",
        title: "[PURWOKERTO] TUR PERTUNJUKAN",
        date: "06 Desember 2025",
        location: "TBA | Purwokerto, Kabupaten Banyumas, Jawa Tengah",
        price: 70000
    },
    {
        id: 3,
        image: "/assets/ticket5.png",
        title: "HERBALIFE SUPERHERO RUN",
        date: "08 Februari 2026",
        location: "Area Pameran Temanggung Tilung | Palangka Raya",
        price: 175000
    },
    {
        id: 4,
        image: "/assets/ticket3.png",
        title: "MARPESTA",
        date: "21 Februari 2026",
        location: "Auditorium Driyarkara | Sanata Dharma",
        price: 20000
    },
    {
        id: 5,
        image: "/assets/ticket4.png",
        title: "FESTIVAL MUSIK INDIE",
        date: "15 Maret 2026",
        location: "Lapangan Merdeka, Jakarta",
        price: 120000
    },
    {
        id: 6,
        image: "/assets/ticket6.png",
        title: "ART EXHIBITION 2026",
        date: "28 April 2026",
        location: "Museum Seni Modern, Bandung",
        price: 50000
    },
    {
        id: 7,
        image: "/assets/ticket7.png",
        title: "TEATER ANAK BANGSA",
        date: "10 Mei 2026",
        location: "Gedung Kesenian Jakarta",
        price: 90000
    },
    {
        id: 8,
        image: "/assets/ticket8.png",
        title: "TECH CONFERENCE 2026",
        date: "05 Juni 2026",
        location: "ICE BSD, Tangerang",
        price: 250000
    },
    {
        id: 9,
        image: "/assets/ticket1.png",
        title: "[SURABAYA] TUR PERTUNJUKAN",
        date: "17 Januari 2026",
        location: "TBA | Surabaya, Jawa Timur, Indonesia",
        price: 70000
    },
    {
        id: 10,
        image: "/assets/ticket2.png",
        title: "[PURWOKERTO] TUR PERTUNJUKAN",
        date: "06 Desember 2025",
        location: "TBA | Purwokerto, Kabupaten Banyumas, Jawa Tengah",
        price: 70000
    },
    {
        id: 3,
        image: "/assets/ticket5.png",
        title: "HERBALIFE SUPERHERO RUN",
        date: "08 Februari 2026",
        location: "Area Pameran Temanggung Tilung | Palangka Raya",
        price: 175000
    },
    {
        id: 4,
        image: "/assets/ticket3.png",
        title: "MARPESTA",
        date: "21 Februari 2026",
        location: "Auditorium Driyarkara | Sanata Dharma",
        price: 20000
    },
    {
        id: 5,
        image: "/assets/ticket4.png",
        title: "FESTIVAL MUSIK INDIE",
        date: "15 Maret 2026",
        location: "Lapangan Merdeka, Jakarta",
        price: 120000
    },
    {
        id: 6,
        image: "/assets/ticket6.png",
        title: "ART EXHIBITION 2026",
        date: "28 April 2026",
        location: "Museum Seni Modern, Bandung",
        price: 50000
    },
    {
        id: 7,
        image: "/assets/ticket7.png",
        title: "TEATER ANAK BANGSA",
        date: "10 Mei 2026",
        location: "Gedung Kesenian Jakarta",
        price: 90000
    },
    {
        id: 8,
        image: "/assets/ticket8.png",
        title: "TECH CONFERENCE 2026",
        date: "05 Juni 2026",
        location: "ICE BSD, Tangerang",
        price: 250000
    },
    {
        id: 1,
        image: "/assets/ticket1.png",
        title: "[SURABAYA] TUR PERTUNJUKAN",
        date: "17 Januari 2026",
        location: "TBA | Surabaya, Jawa Timur, Indonesia",
        price: 70000
    },
    {
        id: 2,
        image: "/assets/ticket2.png",
        title: "[PURWOKERTO] TUR PERTUNJUKAN",
        date: "06 Desember 2025",
        location: "TBA | Purwokerto, Kabupaten Banyumas, Jawa Tengah",
        price: 70000
    },
    {
        id: 3,
        image: "/assets/ticket5.png",
        title: "HERBALIFE SUPERHERO RUN",
        date: "08 Februari 2026",
        location: "Area Pameran Temanggung Tilung | Palangka Raya",
        price: 175000
    },
    {
        id: 4,
        image: "/assets/ticket3.png",
        title: "MARPESTA",
        date: "21 Februari 2026",
        location: "Auditorium Driyarkara | Sanata Dharma",
        price: 20000
    },
    {
        id: 5,
        image: "/assets/ticket4.png",
        title: "FESTIVAL MUSIK INDIE",
        date: "15 Maret 2026",
        location: "Lapangan Merdeka, Jakarta",
        price: 120000
    },
    {
        id: 6,
        image: "/assets/ticket6.png",
        title: "ART EXHIBITION 2026",
        date: "28 April 2026",
        location: "Museum Seni Modern, Bandung",
        price: 50000
    },
    {
        id: 7,
        image: "/assets/ticket7.png",
        title: "TEATER ANAK BANGSA",
        date: "10 Mei 2026",
        location: "Gedung Kesenian Jakarta",
        price: 90000
    },
    {
        id: 8,
        image: "/assets/ticket8.png",
        title: "TECH CONFERENCE 2026",
        date: "05 Juni 2026",
        location: "ICE BSD, Tangerang",
        price: 250000
    }
];

export default events;
