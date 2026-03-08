import React from 'react';
import { Info } from 'lucide-react';

const TaxConfigurationSection = ({ taxData, setTaxData }) => {
    return (
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-10 space-y-8 shadow-sm transition-all hover:border-slate-200">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Pajak Hiburan</h2>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Info className="text-[#1a36c7]" size={20} />
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Pajak hiburan adalah pajak yang dikenakan oleh pemerintah daerah atas penyelenggaraan berbagai jenis kegiatan hiburan.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-900">Persentase Pajak</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={taxData.value}
                                onChange={e => setTaxData({ ...taxData, value: e.target.value })}
                                placeholder="0"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all text-xl"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">%</span>
                        </div>
                    </div>

                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                            <p className="text-sm text-slate-600 font-medium">Perhitungan pajak pada detail pesanan dihitung berdasarkan subtotal tiket yang dibeli.</p>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                            <p className="text-sm text-slate-600 font-medium">Pendapatan pajak hiburan akan masuk ke total pendapatan dari event ini.</p>
                        </li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">Tampilan Detail Pesanan</h4>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6">
                        <h5 className="font-bold text-slate-900">Detail Pesanan</h5>

                        <div className="flex gap-4">
                            <div className="w-20 aspect-video bg-slate-200 rounded-lg shrink-0 animate-pulse" />
                            <div className="space-y-2 flex-1 pt-1">
                                <div className="h-3 w-3/4 bg-slate-200 rounded-full animate-pulse" />
                                <div className="h-2 w-1/2 bg-slate-200 rounded-full animate-pulse" />
                                <div className="h-2 w-2/3 bg-slate-200 rounded-full animate-pulse opacity-50" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-200 space-y-4">
                            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                                <span>1 Tickets Booked</span>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <span className="text-xs font-medium text-slate-500">Subtotal</span>
                                <span className="text-xs font-bold text-slate-900">Rp 100.000</span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-bold text-slate-900 transition-all">Tax</span>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Entertainment Tax</p>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 transition-all">
                                        Rp {((parseFloat(taxData.value) || 0) * 1000).toLocaleString('id-ID')}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between opacity-50">
                                    <div className="space-y-0.5">
                                        <span className="text-xs font-medium text-slate-500">Internet Fee</span>
                                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider italic">Platform Fee</p>
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 italic">Rp x.xxx</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-2">
                                <span className="text-xs font-medium text-slate-500">Total</span>
                                <span className="text-xs font-medium text-slate-500 italic text-right">Rp xxx.xxx</span>
                            </div>

                            <button disabled className="w-full bg-slate-200 py-4 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">
                                Bayar Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxConfigurationSection;
