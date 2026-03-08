import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

const GeneralInfoSection = ({ eventData, setEventData, previewUrl, handleFileChange }) => {
    return (
        <div className="space-y-10">
            {/* Banner Section */}
            <div className="space-y-4">
                <label className="text-sm font-bold text-slate-900">Banner Utama</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                                relative aspect-video w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2
                                ${previewUrl ? 'border-transparent' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-[#1a36c7]'}
                            `}
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/banner:opacity-100 transition-all flex items-center justify-center">
                                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 border border-white/20">
                                            <Upload size={14} /> Ganti Visual
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-50">
                                        <ImageIcon size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-[#1a36c7] uppercase tracking-widest">Pilih Banner Utama</p>
                                </>
                            )}
                        </label>
                    </div>
                    <div className="space-y-2 py-2">
                        <ul className="text-[11px] text-slate-500 space-y-1.5 font-medium list-disc pl-4">
                            <li>Ukuran 1440 x 810px</li>
                            <li>Besar file tidak lebih dari 5MB</li>
                            <li>Hanya mendukung format JPG/JPEG/PNG</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Nama Event */}
            <div className="space-y-4">
                <label className="text-sm font-bold text-slate-900">Nama Event</label>
                <div className="relative">
                    <input
                        type="text"
                        maxLength={100}
                        value={eventData.title}
                        onChange={e => setEventData({
                            ...eventData,
                            title: e.target.value
                        })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 focus:border-[#1a36c7] transition-all"
                        placeholder="Nama Event"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        {eventData.title?.length || 0} / 100
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralInfoSection;
