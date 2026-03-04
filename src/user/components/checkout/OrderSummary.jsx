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
    isNextDisabled,
    appliedVoucher,
    onApplyVoucher,
    voucherLoading
}) {
    const discountAmount = appliedVoucher?.discount_amount || 0;
    const subtotalAfterDiscount = Math.max(0, totalAmount - discountAmount);
    const finalTotal = currentStep === 1
        ? subtotalAfterDiscount
        : subtotalAfterDiscount + platformFee + taxAmount;

    const [voucherCode, setVoucherCode] = React.useState("");
    const [showVoucherInput, setShowVoucherInput] = React.useState(false);

    const handleApply = () => {
        if (!voucherCode.trim()) return;
        onApplyVoucher(voucherCode);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 sticky top-28">
            <h2 className="text-xl font-bold dark:text-white">Detail Pesanan</h2>

            <div className="flex gap-4">
                <img
                    src={event.image || "https://via.placeholder.com/150"}
                    alt={event.title}
                    className="w-24 h-16 object-cover rounded-lg shadow-sm"
                />
                <div className="space-y-1">
                    <h3 className="font-bold text-sm leading-tight dark:text-white">{event.title}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                        <HiCalendar />
                        <span>{event.date}</span>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Duds.Space</p>
                </div>
            </div>

            <hr className="border-slate-50 dark:border-slate-800" />

            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Tiket Dipesan</span>
                </div>
                <div className="space-y-2">
                    {selectedTickets && Object.entries(selectedTickets).map(([typeId, count]) => {
                        const tt = ticketTypes?.find(t => t.id === typeId);
                        if (!count || !tt) return null;
                        return (
                            <div key={typeId} className="flex items-center justify-between text-sm font-bold">
                                <span className="text-slate-600 dark:text-slate-300">{count}x {tt.name}</span>
                                <span className="text-slate-900 dark:text-white">{rupiah(count * (tt.price_gross || tt.price))}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
                    <span className="text-slate-900 dark:text-white">{rupiah(totalAmount)}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <span>Diskon ({appliedVoucher.code})</span>
                        <span>-{rupiah(discountAmount)}</span>
                    </div>
                )}

                {currentStep === 2 && (
                    <>
                        {eventTax && parseFloat(eventTax.value) > 0 && (
                            <div className="flex items-center justify-between text-sm font-bold">
                                <span className="text-slate-600 dark:text-slate-300">Pajak Hiburan ({eventTax.value}%)</span>
                                <span className="text-slate-900 dark:text-white">{rupiah(taxAmount)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-slate-600 dark:text-slate-300">Platform Fee</span>
                            <span className="text-slate-900 dark:text-white">{rupiah(platformFee)}</span>
                        </div>
                    </>
                )}
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Punya kode diskon?</p>
                    {!showVoucherInput && !appliedVoucher && (
                        <button
                            onClick={() => setShowVoucherInput(true)}
                            className="text-blue-700 dark:text-blue-400 font-bold text-[13px] hover:underline"
                        >
                            Tambahkan
                        </button>
                    )}
                </div>

                {(showVoucherInput || appliedVoucher) && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ketik kode voucher..."
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            disabled={voucherLoading || !!appliedVoucher}
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold uppercase focus:border-blue-500 dark:focus:border-blue-400 outline-none dark:text-white disabled:opacity-50"
                        />
                        {appliedVoucher ? (
                            <button
                                onClick={() => {
                                    onApplyVoucher(null);
                                    setVoucherCode("");
                                    setShowVoucherInput(false);
                                }}
                                className="px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            >
                                Hapus
                            </button>
                        ) : (
                            <button
                                onClick={handleApply}
                                disabled={voucherLoading || !voucherCode.trim()}
                                className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {voucherLoading ? "..." : "Terapkan"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Total</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{rupiah(finalTotal)}</span>
                </div>

                <div className="space-y-3">
                    {currentStep === 1 ? (
                        <button
                            onClick={onNext}
                            disabled={isNextDisabled}
                            className="w-full bg-[#1b3bb6] hover:bg-[#16319c] dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 dark:shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Konfirmasi Pesanan
                        </button>
                    ) : (
                        <>
                            <button
                                disabled={loading || isNextDisabled}
                                onClick={onPay}
                                className="w-full bg-[#1b3bb6] hover:bg-[#16319c] dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 dark:shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Memproses..." : "Bayar Sekarang"}
                            </button>
                            {currentStep === 2 && isNextDisabled && (
                                <p className="text-[10px] text-center text-red-500 font-bold uppercase tracking-tight animate-pulse">
                                    Silakan pilih metode pembayaran
                                </p>
                            )}
                            <button
                                onClick={onPrev}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-4 rounded-xl font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
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
