import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { HiX, HiChevronRight, HiChevronLeft, HiPlus, HiTrash } from 'react-icons/hi';
import { Upload, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';

const CreateEventModal = ({ isOpen, onClose, creatorId, onRefresh, navigate }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [brandName, setBrandName] = useState('');
    const [bannerFile, setBannerFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        location: '',
        event_date: '',
        event_time: '',
        poster_url: '',
        category: '',
        sub_category: '',
    });

    const [ticketData, setTicketData] = useState({
        name: 'Normal Ticket',
        price: '',
        quota: '',
        start_date: '',
        end_date: '',
    });

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

    const slugify = (text) => text?.toLowerCase()
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

        const eoSlug = slugify(brandName);
        const eventSlug = slugify(eventData.title);
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${eoSlug}/${eventSlug}/${fileName}`;

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
            const { data: event, error: eventError } = await supabase
                .from('events')
                .insert({
                    ...eventData,
                    poster_url: posterUrl,
                    creator_id: creatorId,
                    status: 'active'
                })
                .select()
                .single();

            if (eventError) throw eventError;

            // 3. Create First Ticket
            const { error: ticketError } = await supabase
                .from('ticket_types')
                .insert({
                    ...ticketData,
                    event_id: event.id,
                    price: parseInt(ticketData.price),
                    quota: parseInt(ticketData.quota),
                    sold: 0,
                    status: 'active'
                });

            if (ticketError) throw ticketError;

            if (onRefresh) onRefresh();
            onClose();

            // Redirect to ticket categories page
            if (navigate) {
                navigate(`/manage/event/${event.id}/ticket-categories`);
            }
            // Reset states
            setStep(1);
            setBannerFile(null);
            setPreviewUrl(null);
            setEventData({
                title: '',
                description: '',
                location: '',
                event_date: '',
                event_time: '',
                poster_url: '',
                category: '',
                sub_category: '',
            });
            setTicketData({
                name: 'Normal Ticket',
                price: '',
                quota: '',
                start_date: '',
                end_date: '',
            });
        } catch (error) {
            alert('Error creating event: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Buat <span className="text-[#1a36c7]">Event Baru</span></h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Langkah {step} dari 2: {step === 1 ? 'Detail Operasional' : 'Kategori Tiket'}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                        <HiX size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Judul Event</label>
                                <input
                                    type="text"
                                    value={eventData.title}
                                    onChange={e => setEventData({ ...eventData, title: e.target.value })}
                                    placeholder="Contoh: Heroic Fun Run 2025"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Tanggal Pelaksanaan</label>
                                    <input
                                        type="date"
                                        value={eventData.event_date}
                                        onChange={e => setEventData({ ...eventData, event_date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Waktu (WIB)</label>
                                    <input
                                        type="time"
                                        value={eventData.event_time}
                                        onChange={e => setEventData({ ...eventData, event_time: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Lokasi / Venue</label>
                                <input
                                    type="text"
                                    value={eventData.location}
                                    onChange={e => setEventData({ ...eventData, location: e.target.value })}
                                    placeholder="Nama gedung, lapangan, atau alamat"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Kategori Event</label>
                                    <div className="relative">
                                        <select
                                            value={eventData.category}
                                            onChange={e => setEventData({ ...eventData, category: e.target.value, sub_category: '' })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 appearance-none focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                                        >
                                            <option value="">Pilih Kategori</option>
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Sub Kategori</label>
                                    <div className="relative">
                                        <select
                                            value={eventData.sub_category}
                                            onChange={e => setEventData({ ...eventData, sub_category: e.target.value })}
                                            disabled={!eventData.category}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 appearance-none focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Pilih Sub Kategori</option>
                                            {eventData.category && CATEGORIES.find(c => c.id === eventData.category)?.subcategories.map(sub => (
                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Banner Event (Rasio 16:9)</label>
                                <div className="relative group/banner">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="banner-upload"
                                    />
                                    <label
                                        htmlFor="banner-upload"
                                        className={`
                                            relative aspect-video w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3
                                            ${previewUrl ? 'border-transparent' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#1a36c7]'}
                                        `}
                                    >
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-all flex items-center justify-center">
                                                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-xs uppercase flex items-center gap-2">
                                                        <Upload size={14} /> Ganti Banner
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm">
                                                    <ImageIcon size={24} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-slate-600">Pilih atau Seret Gambar</p>
                                                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">Format PNG, JPG (Maks. 5MB)</p>
                                                </div>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Nama Kategori Tiket</label>
                                <input
                                    type="text"
                                    value={ticketData.name}
                                    onChange={e => setTicketData({ ...ticketData, name: e.target.value })}
                                    placeholder="Contoh: Normal Ticket"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Harga (IDR)</label>
                                    <input
                                        type="number"
                                        value={ticketData.price}
                                        onChange={e => setTicketData({ ...ticketData, price: e.target.value })}
                                        placeholder="0"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Kuota</label>
                                    <input
                                        type="number"
                                        value={ticketData.quota}
                                        onChange={e => setTicketData({ ...ticketData, quota: e.target.value })}
                                        placeholder="100"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Periode Penjualan Tiket</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Mulai Penjualan</label>
                                        <input
                                            type="date"
                                            value={ticketData.start_date}
                                            onChange={e => setTicketData({ ...ticketData, start_date: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-[#1a36c7] outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Selesai Penjualan</label>
                                        <input
                                            type="date"
                                            value={ticketData.end_date}
                                            onChange={e => setTicketData({ ...ticketData, end_date: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-[#1a36c7] outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-slate-50 bg-white flex items-center justify-between">
                    {step === 2 ? (
                        <button
                            disabled={loading}
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            <HiChevronLeft size={18} /> Kembali ke Detail
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        disabled={loading}
                        onClick={step === 1 ? () => {
                            if (!bannerFile || !eventData.title || !eventData.event_date) {
                                alert('Harap lengkapi semua data event dan unggah banner.');
                                return;
                            }
                            setStep(2);
                        } : handleSubmit}
                        className="flex items-center gap-2 bg-[#1a36c7] text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#152ba3] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Sedang Menyimpan...' : (step === 1 ? 'Konfigurasi Tiket' : 'Simpan & Rilis Event')}
                        {step === 1 && <HiChevronRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateEventModal;
