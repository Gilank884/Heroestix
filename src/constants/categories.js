export const CATEGORIES = [
    {
        id: 'musik',
        name: 'Musik',
        subcategories: [
            { id: 'konser', name: 'Konser' },
            { id: 'festival_musik', name: 'Festival Musik' },
            { id: 'pertunjukan_seni', name: 'Pertunjukan Seni' },
            { id: 'lainnya', name: 'Lainnya' }
        ]
    },
    {
        id: 'olahraga',
        name: 'Olahraga',
        subcategories: [
            { id: 'sepak_bola', name: 'Sepak Bola' },
            { id: 'basket', name: 'Basket' },
            { id: 'lari', name: 'Lari / Marathon' },
            { id: 'e_sport', name: 'E-Sport' },
            { id: 'lainnya', name: 'Lainnya' }
        ]
    },
    {
        id: 'hiburan',
        name: 'Hiburan',
        subcategories: [
            { id: 'nightlife', name: 'Nightlife' },
            { id: 'comedy', name: 'Comedy Show' },
            { id: 'atraksi', name: 'Atraksi' },
            { id: 'lainnya', name: 'Lainnya' }
        ]
    },
    {
        id: 'seminar',
        name: 'Seminar',
        subcategories: [
            { id: 'workshop', name: 'Workshop' },
            { id: 'konferensi', name: 'Konferensi' },
            { id: 'webinar', name: 'Webinar' },
            { id: 'lainnya', name: 'Lainnya' }
        ]
    },
    {
        id: 'festival',
        name: 'Festival',
        subcategories: [
            { id: 'kuliner', name: 'Kuliner' },
            { id: 'budaya', name: 'Budaya' },
            { id: 'pameran', name: 'Pameran' },
            { id: 'lainnya', name: 'Lainnya' }
        ]
    },
    {
        id: 'workshop',
        name: 'Workshop',
        subcategories: [
            { id: 'kelas_seni', name: 'Kelas Seni' },
            { id: 'kelas_masak', name: 'Kelas Masak' },
            { id: 'kelas_bisnis', name: 'Kelas Bisnis' },
            { id: 'lainnya', name: 'Lainnya' }
        ]
    },
    {
        id: 'lainnya',
        name: 'Lainnya',
        subcategories: [
            { id: 'lainnya', name: 'Lainnya' }
        ]
    }
];

export const getCategoryName = (id) => {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : id;
};

export const getSubCategoryName = (categoryId, subId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return subId;
    const sub = cat.subcategories.find(s => s.id === subId);
    return sub ? sub.name : subId;
};
