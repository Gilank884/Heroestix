import React from 'react';
import { Info, Settings } from 'lucide-react';

const PlatformFeeConfigurationSection = ({ platformFeeData, setPlatformFeeData }) => {
    return (
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-10 space-y-8 shadow-sm transition-all hover:border-slate-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1a36c7]">
                        <Settings size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Biaya Platform</h2>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Info className="text-[#1a36c7]" size={20} />
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Tentukan nama biaya dan nominal yang akan dikenakan kepada pembeli sebagai biaya platform/layanan.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-900 ml-1">Nama Biaya</label>
                        <input
                            type="text"
                            value={platformFeeData.name}
                            onChange={e => setPlatformFeeData({ ...platformFeeData, name: e.target.value })}
                            placeholder="Misal: Biaya Platform"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-900 ml-1">Tipe Biaya</label>
                        <div className="flex gap-4">
                            {['fixed', 'percentage'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPlatformFeeData({ ...platformFeeData, type })}
                                    className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all border-2 ${
                                        platformFeeData.type === type
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                    }`}
                                >
                                    {type === 'fixed' ? 'Nominal (Rp)' : 'Persentase (%)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-900 ml-1">
                            {platformFeeData.type === 'fixed' ? 'Nominal Biaya (Rp)' : 'Persentase Biaya (%)'}
                        </label>
                        <div className="relative">
                            {platformFeeData.type === 'fixed' && (
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">Rp</span>
                            )}
                            <input
                                type="number"
                                value={platformFeeData.value}
                                onChange={e => setPlatformFeeData({ ...platformFeeData, value: e.target.value })}
                                placeholder="0"
                                className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all text-xl ${
                                    platformFeeData.type === 'fixed' ? 'pl-16 pr-6' : 'px-6'
                                }`}
                            />
                            {platformFeeData.type === 'percentage' && (
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">%</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">Preview di Detail Pesanan</h4>
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-sm font-bold text-slate-900">
                                    {platformFeeData.name || 'Biaya Platform'}
                                </span>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {platformFeeData.type === 'fixed' ? 'Fixed Fee' : `Percentage Fee (${platformFeeData.value}%)`}
                                </p>
                            </div>
                            <span className="text-sm font-bold text-[#1a36c7]">
                                Rp {platformFeeData.type === 'fixed' 
                                    ? (parseInt(platformFeeData.value) || 0).toLocaleString('id-ID')
                                    : ((parseInt(platformFeeData.value) || 0) * 1000).toLocaleString('id-ID') + ' (Est.)'}
                            </span>
                        </div>
                        
                        <div className="pt-6 border-t border-slate-200">
                            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                                <span>* Biaya ini akan ditambahkan ke total pembayaran pembeli.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformFeeConfigurationSection;
