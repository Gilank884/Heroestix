import React from "react";
import { HiClipboardCheck } from "react-icons/hi";

const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function OrderConfirmation({
    ticketHolders,
    selectedTickets,
    ticketTypes,
    totalAmount,
    platformFee,
    taxAmount,
    eventTax
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        Detail <span className="text-[#1a36c7]">Pesanan</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                        <HiClipboardCheck size={16} className="text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Konfirmasi Data Sebelum Pembayaran</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Data Pengunjung Summary */}
                {/* Data Pengunjung Summary */}
                <div className="space-y-6">
                    <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2">Informasi Pengunjung</h3>
                    <div className="space-y-6">
                        {ticketHolders.map((holder, index) => (
                            <div key={holder.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 relative">
                                <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-[#1a36c7] bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                    {holder.ticketName}
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm">Pengunjung {index + 1}</h4>
                                <div className="space-y-1 text-sm">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Nama Lengkap</p>
                                        <p className="font-semibold text-slate-800">{holder.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Email</p>
                                        <p className="font-semibold text-slate-800">{holder.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Nomor Telepon</p>
                                        <p className="font-semibold text-slate-800">{holder.phone}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tiket Summary */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2">Rincian Tiket</h3>
                    <div className="space-y-3">
                        {Object.entries(selectedTickets).map(([typeId, count]) => {
                            const tt = ticketTypes?.find(t => t.id === typeId);
                            if (!count || !tt) return null;
                            return (
                                <div key={typeId} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 font-medium">{count}x {tt.name}</span>
                                    <span className="font-bold text-slate-900">{rupiah(count * (tt.price_gross || tt.price))}</span>
                                </div>
                            );
                        })}
                        {eventTax && parseFloat(eventTax.value) > 0 && (
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50">
                                <span className="text-slate-500">Pajak Hiburan ({eventTax.value}%)</span>
                                <span className="font-bold text-slate-800">{rupiah(taxAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50">
                            <span className="text-slate-500">Platform Fee</span>
                            <span className="font-bold text-slate-800">{rupiah(platformFee)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span className="font-bold text-slate-800">Total Pembayaran</span>
                            <span className="text-xl font-black text-blue-600">{rupiah(totalAmount + platformFee + taxAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-800 font-medium">
                    Dengan menekan tombol "Bayar Sekarang", Anda akan diarahkan ke halaman pembayaran aman.
                </p>
            </div>
        </div>
    );
}
