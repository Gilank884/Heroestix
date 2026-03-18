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
    eventTax,
    eventPlatformFee,
    appliedVoucher,
    selectedBank,
    setSelectedBank,
    eventPaymentConfigs = []
}) {
    const discountAmount = appliedVoucher?.discount_amount || 0;
    const subtotalAfterDiscount = Math.max(0, totalAmount - discountAmount);
    const finalTotal = subtotalAfterDiscount + platformFee + taxAmount;

    // Filter banks based on DB config
    const banks = [
        { code: "BNI", name: "BNI", logo: "/Logo/bni.png" },
        { code: "BRI", name: "BRI", logo: "/Logo/bri.png" },
        { code: "MANDIRI", name: "MANDIRI", logo: "/Logo/mandiri.png" }
    ].filter(bank => {
        const config = eventPaymentConfigs.find(c => c.method_code === bank.code);
        return config ? config.is_enabled : true; // Default to true for older events
    });

    // Filter E-Wallets based on DB config
    const eWallets = [
        { code: "QRIS", name: "QRIS", logo: "/Logo/qris.jpg", type: "QR Code" },
        { code: "OVO", name: "OVO", logo: "/Logo/ovo.png", type: "E-Wallet" },
        { code: "LINKAJA", name: "LinkAja", logo: "/Logo/linkaja.png", type: "E-Wallet" },
        { code: "SHOPEEPAY", name: "ShopeePay", logo: "/Logo/shopeepay.png", type: "E-Wallet" }
    ].filter(method => {
        const config = eventPaymentConfigs.find(c => c.method_code === method.code);
        return config ? config.is_enabled : true; // Default to true for older events
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        Detail <span className="text-[#1a36c7] dark:text-blue-400">Pesanan</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 text-slate-400 dark:text-slate-500">
                        <HiClipboardCheck size={16} className="text-blue-500 dark:text-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Konfirmasi Data Sebelum Pembayaran</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Data Pengunjung Summary */}
                <div className="space-y-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">Informasi Pengunjung</h3>
                    <div className="space-y-6">
                        {ticketHolders.map((holder, index) => (
                            <div key={holder.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3 relative">
                                <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-[#1a36c7] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800">
                                    {holder.ticketName}
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Pengunjung {index + 1}</h4>
                                <div className="space-y-1 text-sm">
                                    <div>
                                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">Nama Lengkap</p>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{holder.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">Email</p>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{holder.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">Nomor Telepon</p>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{holder.phone}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tiket Summary */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">Rincian Tiket</h3>
                    <div className="space-y-3">
                        {Object.entries(selectedTickets).map(([typeId, count]) => {
                            const tt = ticketTypes?.find(t => t.id === typeId);
                            if (!count || !tt) return null;
                            return (
                                <div key={typeId} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">{count}x {tt.name}</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{rupiah(count * (tt.price_gross || tt.price))}</span>
                                </div>
                            );
                        })}

                        {discountAmount > 0 && (
                            <div className="flex justify-between items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-50 dark:border-slate-800">
                                <span>Diskon ({appliedVoucher.code})</span>
                                <span>-{rupiah(discountAmount)}</span>
                            </div>
                        )}

                        {eventTax && parseFloat(eventTax.value) > 0 && (
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400">Pajak Hiburan ({eventTax.value}%)</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{rupiah(taxAmount)}</span>
                            </div>
                        )}
                        {(() => {
                            const basePlatformFee = eventPlatformFee?.type === 'percentage'
                                ? Math.round((totalAmount * (parseFloat(eventPlatformFee.value) || 0)) / 100)
                                : (parseFloat(eventPlatformFee?.value) || 5000);

                            let paymentMethodFee = 0;
                            if (selectedBank) {
                                const config = eventPaymentConfigs.find(c => c.method_code === selectedBank);
                                if (config && parseFloat(config.fee_value) > 0) {
                                    paymentMethodFee = config.fee_type === 'percentage'
                                        ? Math.round((totalAmount * (parseFloat(config.fee_value)) / 100))
                                        : parseFloat(config.fee_value);
                                } else {
                                    if (["BNI", "BRI", "MANDIRI"].includes(selectedBank)) paymentMethodFee = 5000;
                                    else if (selectedBank === "QRIS") paymentMethodFee = 3000;
                                    else if (["OVO", "SHOPEEPAY"].includes(selectedBank)) paymentMethodFee = 3500;
                                    else if (selectedBank === "LINKAJA") paymentMethodFee = 5000;
                                }
                            }

                            return (
                                <>
                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {eventPlatformFee?.name || "Biaya Layanan Platform"}
                                        </span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {rupiah(basePlatformFee)}
                                        </span>
                                    </div>
                                    {paymentMethodFee > 0 && (
                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50 dark:border-slate-800 text-amber-600 dark:text-amber-400">
                                            <span className="font-medium">Biaya Metode Pembayaran</span>
                                            <span className="font-bold">{rupiah(paymentMethodFee)}</span>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Total Pembayaran</span>
                            <span className="text-xl font-black text-blue-600 dark:text-blue-400">{rupiah(finalTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metode Pembayaran Section */}
            <div className="space-y-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Virtual Account */}
                {banks.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#1a36c7] rounded-full"></span>
                            Virtual Account
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {banks.map((bank) => (
                                <button
                                    key={bank.code}
                                    onClick={() => setSelectedBank(bank.code)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedBank === bank.code
                                        ? "border-[#1a36c7] bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                                        }`}
                                >
                                    <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center border border-slate-100">
                                        <img src={bank.logo} alt={bank.name} className="max-h-full max-w-full object-contain" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{bank.name}</p>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">Virtual Account</p>
                                    </div>
                                    <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedBank === bank.code ? "bg-[#1a36c7] border-[#1a36c7]" : "border-slate-200 dark:border-slate-700"
                                        }`}>
                                        {selectedBank === bank.code && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* E-Wallet & QRIS */}
                {eWallets.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                            E-Wallet & QRIS
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {eWallets.map((method) => (
                                <button
                                    key={method.code}
                                    onClick={() => setSelectedBank(method.code)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedBank === method.code
                                        ? "border-[#1a36c7] bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                                        }`}
                                >
                                    <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center border border-slate-100">
                                        <img src={method.logo} alt={method.name} className="max-h-full max-w-full object-contain" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{method.name}</p>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{method.type}</p>
                                    </div>
                                    <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedBank === method.code ? "bg-[#1a36c7] border-[#1a36c7]" : "border-slate-200 dark:border-slate-700"
                                        }`}>
                                        {selectedBank === method.code && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    Dengan menekan tombol "Bayar Sekarang", Anda akan diarahkan ke halaman pembayaran aman.
                </p>
            </div>
        </div>
    );
}
