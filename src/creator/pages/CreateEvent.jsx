import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { HiChevronRight, HiChevronLeft, HiArrowLeft } from 'react-icons/hi';
import { INDONESIA_REGIONS } from '../../constants/locations';
import useAuthStore from '../../auth/useAuthStore';
import GeneralInfoSection from '../components/create-event/GeneralInfoSection';
import TaxConfigurationSection from '../components/create-event/TaxConfigurationSection';
import DateTimeLocationSection from '../components/create-event/DateTimeLocationSection';

const CreateEvent = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const creatorId = user?.id;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [brandName, setBrandName] = useState('');
    const [bannerFile, setBannerFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [eventData, setEventData] = useState(() => {
        const saved = localStorage.getItem('heroestix_event_draft');
        return saved ? JSON.parse(saved) : {
            title: '',
            description: '',
            location: '',
            event_date: '',
            event_time: '',
            event_end_date: '',
            event_end_time: '',
            poster_url: '',
            category: '',
            sub_category: '',
            province: '',
            regency: '',
            detail_address: '',
            gmaps_link: ''
        };
    });

    const [ticketData, setTicketData] = useState(() => {
        const saved = localStorage.getItem('heroestix_ticket_draft');
        return saved ? JSON.parse(saved) : {
            name: 'Normal Ticket',
            price: '',
            quota: '',
            start_date: '',
            end_date: '',
        };
    });

    const [taxData, setTaxData] = useState(() => {
        const saved = localStorage.getItem('heroestix_tax_draft');
        return saved ? JSON.parse(saved) : {
            name: 'Pajak Hiburan',
            type: 'percentage',
            value: '',
            is_included: false
        };
    });

    useEffect(() => {
        localStorage.setItem('heroestix_event_draft', JSON.stringify(eventData));
    }, [eventData]);

    useEffect(() => {
        localStorage.setItem('heroestix_ticket_draft', JSON.stringify(ticketData));
    }, [ticketData]);

    useEffect(() => {
        localStorage.setItem('heroestix_tax_draft', JSON.stringify(taxData));
    }, [taxData]);

    useEffect(() => {
        if (creatorId) {
            const fetchBrand = async () => {
                const { data } = await supabase
                    .from('creators')
                    .select('brand_name')
                    .eq('id', creatorId)
                    .single();
                if (data) setBrandName(data.brand_name);
            };
            fetchBrand();
        }
    }, [creatorId]);

    const safeFileName = (text) => text?.toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '') || 'unnamed';

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const uploadBanner = async () => {
        if (!bannerFile) return null;

        const eoPath = safeFileName(brandName);
        const eventPath = safeFileName(eventData.title);
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${eoPath}/${eventPath}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('banners')
            .upload(filePath, bannerFile);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('banners')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async () => {
        if (!ticketData.name || !ticketData.price || !ticketData.quota) {
            alert('Harap lengkapi data tiket utama.');
            return;
        }
        setLoading(true);
        try {
            // 1. Upload Banner
            const posterUrl = await uploadBanner();

            // 2. Create Event
            const { province, regency, detail_address, gmaps_link, event_end_date, event_end_time, slug, ...insertData } = eventData;

            // Consolidate location
            const consolidatedLocation = `${detail_address || ''}, ${regency || ''}, ${province || ''}`.replace(/^, |, $/g, '').trim();

            const { data: event, error: eventError } = await supabase
                .from('events')
                .insert({
                    ...insertData,
                    location: consolidatedLocation || eventData.location,
                    provinsi: province,
                    kabupaten: regency,
                    poster_url: posterUrl,
                    creator_id: creatorId,
                    status: 'active'
                })
                .select()
                .single();

            if (eventError) throw eventError;

            // 3. Create First Ticket
            const grossValue = parseInt(ticketData.price) || 0;
            const netValue = Math.round(grossValue * (1 + (parseFloat(taxData.value) || 0) / 100) + 8500);

            const { error: ticketError } = await supabase
                .from('ticket_types')
                .insert({
                    ...ticketData,
                    event_id: event.id,
                    price: grossValue,
                    price_gross: grossValue,
                    price_net: netValue,
                    quota: parseInt(ticketData.quota),
                    sold: 0,
                    status: 'active'
                });

            if (ticketError) throw ticketError;

            // 4. Create Tax (if configured)
            if (taxData.name && taxData.value) {
                const { error: taxError } = await supabase
                    .from('event_taxes')
                    .insert({
                        event_id: event.id,
                        name: taxData.name,
                        type: taxData.type,
                        value: parseFloat(taxData.value),
                        is_included: taxData.is_included
                    });
                if (taxError) throw taxError;
            }

            // 5. Clear Drafts
            localStorage.removeItem('heroestix_event_draft');
            localStorage.removeItem('heroestix_ticket_draft');
            localStorage.removeItem('heroestix_tax_draft');

            // Success redirect to management
            navigate(`/manage/event/${event.id}/ticket-categories`);

        } catch (error) {
            alert('Error creating event: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (!num && num !== 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseNumber = (str) => {
        return str.replace(/\./g, '');
    };

    const handlePriceChange = (e) => {
        const val = parseNumber(e.target.value);
        if (/^\d*$/.test(val)) {
            setTicketData({ ...ticketData, price: val });
        }
    };

    const handleQuotaChange = (e) => {
        const val = parseNumber(e.target.value);
        if (/^\d*$/.test(val)) {
            setTicketData({ ...ticketData, quota: val });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Alert */}
            <div className="bg-white border-l-4 border-blue-600 p-4 rounded-xl shadow-sm flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-black text-slate-400">i</span>
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-900">Informasi</h4>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">Setiap event yang dibuat akan direview oleh tim Heroestix sebelum dipublikasikan.</p>
                </div>
            </div>

            {/* Title Section */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest"
                >
                    <HiArrowLeft size={16} /> Kembali
                </button>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#1a36c7]">Progress Setup</p>
                        <p className="text-xs font-bold text-slate-500">{step === 1 ? 'Informasi Umum' : 'Konfigurasi Tiket'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                {/* Section Header */}
                <div className="px-10 py-6 border-b border-slate-100 bg-white">
                    <h2 className="text-xl font-bold text-slate-900">{step === 1 ? 'Informasi Umum' : 'Detail Tiket'}</h2>
                </div>

                {/* Content */}
                <div className="p-10 space-y-10">
                    {step === 1 ? (
                        <div className="space-y-10">
                            <GeneralInfoSection
                                eventData={eventData}
                                setEventData={setEventData}
                                previewUrl={previewUrl}
                                handleFileChange={handleFileChange}
                            />

                            <TaxConfigurationSection
                                taxData={taxData}
                                setTaxData={setTaxData}
                            />

                            <DateTimeLocationSection
                                eventData={eventData}
                                setEventData={setEventData}
                                INDONESIA_REGIONS={INDONESIA_REGIONS}
                            />
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
                            {/* Ticket Info */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nama Kategori Tiket Utama</label>
                                <input
                                    type="text"
                                    value={ticketData.name}
                                    onChange={e => setTicketData({ ...ticketData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all text-lg"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Harga Tiket (IDR)</label>
                                    <div className="relative">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                                        <input
                                            type="text"
                                            value={formatNumber(ticketData.price)}
                                            onChange={handlePriceChange}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Sektor / Kuota</label>
                                    <input
                                        type="text"
                                        value={formatNumber(ticketData.quota)}
                                        onChange={handleQuotaChange}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Sales Period */}
                            <div className="bg-slate-50 rounded-[2.5rem] p-10 space-y-6 border border-slate-100">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#1a36c7] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1a36c7]" />
                                    Periode Penjualan Inventory
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inisialisasi Sales</label>
                                        <input
                                            type="date"
                                            value={ticketData.start_date}
                                            onChange={e => setTicketData({ ...ticketData, start_date: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 font-medium text-slate-900 focus:border-[#1a36c7] outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Terminasi Sales</label>
                                        <input
                                            type="date"
                                            value={ticketData.end_date}
                                            onChange={e => setTicketData({ ...ticketData, end_date: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 font-medium text-slate-900 focus:border-[#1a36c7] outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-10 border-t border-slate-50 bg-white flex items-center justify-between">
                    {step === 2 ? (
                        <button
                            disabled={loading}
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            <HiChevronLeft size={20} /> Edit Detail Operasional
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        disabled={loading}
                        onClick={step === 1 ? () => {
                            if (!bannerFile || !eventData.title || !eventData.event_date) {
                                alert('Harap lengkapi metrik operation utama dan unggah banner visual.');
                                return;
                            }
                            setStep(2);
                        } : handleSubmit}
                        className="flex items-center gap-3 bg-[#1a36c7] text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#152ba3] transition-all shadow-2xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Processing Operation...' : (step === 1 ? 'Konfigurasi Tiket' : 'Deploy & Activate Now')}
                        {step === 1 && <HiChevronRight size={20} />}
                    </button>
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] py-8">
                &copy; 2025 Heroestix Core Command. Secure Cloud Architecture.
            </p>
        </div >
    );
};

export default CreateEvent;
