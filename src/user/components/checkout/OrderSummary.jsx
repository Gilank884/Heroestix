import React from "react";
import { HiCalendar } from "react-icons/hi";

const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function OrderSummary({
    event,
    selectedTickets,
    ticketTypes,
    totalAmount,
    platformFee,
    taxAmount,
    eventTax,
    currentStep,
    onNext,
    onPrev,
    onPay,
    loading,
    isNextDisabled
}) {
    const finalTotal = currentStep === 1 ? totalAmount : totalAmount + platformFee + taxAmount;

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6 sticky top-28">
            <h2 className="text-xl font-bold">Detail Pesanan</h2>

            <div className="flex gap-4">
                <img
                    src={event.image || "https://via.placeholder.com/150"}
                    alt={event.title}
                    className="w-24 h-16 object-cover rounded-lg shadow-sm"
                />
                <div className="space-y-1">
                    <h3 className="font-bold text-sm leading-tight">{event.title}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <HiCalendar />
                        <span>{event.date}</span>
                    </div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Duds.Space</p>
                </div>
            </div>

            <hr className="border-slate-50" />

            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Tiket Dipesan</span>
                </div>
                <div className="space-y-2">
                    {selectedTickets && Object.entries(selectedTickets).map(([typeId, count]) => {
                        const tt = ticketTypes?.find(t => t.id === typeId);
                        if (!count || !tt) return null;
                        return (
                            <div key={typeId} className="flex items-center justify-between text-sm font-bold">
                                <span className="text-slate-600">{count}x {tt.name}</span>
                                <span className="text-slate-900">{rupiah(count * (tt.price_gross || tt.price))}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-slate-50">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="text-slate-900">{rupiah(totalAmount)}</span>
                </div>
                {currentStep === 2 && (
                    <>
                        {eventTax && parseFloat(eventTax.value) > 0 && (
                            <div className="flex items-center justify-between text-sm font-bold">
                                <span className="text-slate-600">Pajak Hiburan ({eventTax.value}%)</span>
                                <span className="text-slate-900">{rupiah(taxAmount)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-slate-600">Platform Fee</span>
                            <span className="text-slate-900">{rupiah(platformFee)}</span>
                        </div>
                    </>
                )}
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-slate-700">Punya kode diskon?</p>
                <button className="text-blue-700 font-bold text-[13px] hover:underline">Tambahkan</button>
            </div>

            <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <span className="font-bold text-slate-700">Total</span>
                    <span className="text-xl font-black text-slate-900">{rupiah(finalTotal)}</span>
                </div>

                <div className="space-y-3">
                    {currentStep === 1 ? (
                        <button
                            onClick={onNext}
                            disabled={isNextDisabled}
                            className="w-full bg-[#1b3bb6] hover:bg-[#16319c] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Konfirmasi Pesanan
                        </button>
                    ) : (
                        <>
                            <button
                                disabled={loading}
                                onClick={onPay}
                                className="w-full bg-[#1b3bb6] hover:bg-[#16319c] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                            >
                                {loading ? "Memproses..." : "Bayar Sekarang"}
                            </button>
                            <button
                                onClick={onPrev}
                                className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-bold transition-all hover:bg-slate-50"
                            >
                                Kembali Ke Detail Pembeli
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
