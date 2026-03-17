import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import useAuthStore from "../../auth/useAuthStore";
import { supabase } from "../../lib/supabaseClient";

// Import new components
import BuyerDetails from "../components/checkout/BuyerDetails";
import OrderConfirmation from "../components/checkout/OrderConfirmation";
import OrderSummary from "../components/checkout/OrderSummary";

export default function Checkout() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { selectedTickets, totalAmount, event } = location.state || { selectedTickets: {}, totalAmount: 0, event: null };

    const [sameAsBuyer, setSameAsBuyer] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedBank, setSelectedBank] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [eventData, setEventData] = useState(null);
    const [eventTax, setEventTax] = useState(null);
    const [eventPlatformFee, setEventPlatformFee] = useState(null);
    const [eventPaymentConfigs, setEventPaymentConfigs] = useState([]);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [showTermsToast, setShowTermsToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Auto-hide toast
    useEffect(() => {
        if (showTermsToast) {
            const timer = setTimeout(() => {
                setShowTermsToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showTermsToast]);


    // State for multiple ticket holders
    const [ticketHolders, setTicketHolders] = useState([]);

    // Initialize ticket holders based on selected tickets
    useEffect(() => {
        if (selectedTickets && ticketTypes.length > 0) {
            const holders = [];
            Object.entries(selectedTickets).forEach(([typeId, count]) => {
                const type = ticketTypes.find(t => t.id === typeId);
                for (let i = 0; i < count; i++) {
                    holders.push({
                        id: `${typeId}-${i}`, // Unique ID for key
                        ticketTypeId: typeId,
                        ticketName: type?.name || "Ticket",
                        index: i + 1,
                        full_name: i === 0 && holders.length === 0 ? (user?.full_name || "") : "", // Pre-fill first one if empty
                        email: i === 0 && holders.length === 0 ? (user?.email || "") : "",
                        phone: "",
                        birth_day: "1",
                        birth_month: "Januari",
                        birth_year: "2000",
                        gender: "Laki - Laki",
                        notes: "",
                        custom_responses: {}
                    });
                }
            });
            // Only set if empty (initial load) to avoid overwriting user input on re-renders if dependencies change unpredictably
            // However, we need to be careful. For now, simple initialization if length doesn't match total count.
            setTicketHolders(prev => {
                if (prev.length === 0) return holders;
                return prev;
            });
        }
    }, [selectedTickets, ticketTypes, user]);

    // Update first holder if "Same as Buyer" is toggled (Logic moved to BuyerDetails or handled here)
    // We'll handle "Copy Buyer Data" in the UI components for flexibility.

    useEffect(() => {
        if (!event) {
            navigate(`/event/${id}`);
            return;
        }

        const fetchTicketTypes = async () => {
            try {
                const { data, error } = await supabase
                    .from("ticket_types")
                    .select("*")
                    .eq("event_id", id);
                if (error) throw error;
                setTicketTypes(data || []);
            } catch (error) {
                console.error("Error fetching ticket types:", error);
            }
        };

        const fetchEventData = async () => {
            try {
                const { data, error } = await supabase
                    .from("events")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (error) throw error;
                setEventData(data);
            } catch (error) {
                console.error("Error fetching event data:", error);
            }
        };

        const fetchEventTax = async () => {
            try {
                const { data, error } = await supabase
                    .from("event_taxes")
                    .select("*")
                    .eq("event_id", id)
                    .maybeSingle();
                if (error) throw error;
                setEventTax(data);
            } catch (error) {
                console.error("Error fetching event tax:", error);
            }
        };

        const fetchEventPlatformFee = async () => {
            try {
                const { data, error } = await supabase
                    .from("event_platform_fees")
                    .select("*")
                    .eq("event_id", id)
                    .maybeSingle();
                if (error) throw error;
                setEventPlatformFee(data);
            } catch (error) {
                console.error("Error fetching event platform fee:", error);
            }
        };

        const fetchEventPaymentConfigs = async () => {
            try {
                const { data, error } = await supabase
                    .from("event_payment_configs")
                    .select("*")
                    .eq("event_id", id);
                if (error) throw error;
                setEventPaymentConfigs(data || []);
            } catch (error) {
                console.error("Error fetching event payment configs:", error);
            }
        };

        fetchTicketTypes();
        fetchEventData();
        fetchEventTax();
        fetchEventPlatformFee();
        fetchEventPaymentConfigs();
        window.scrollTo(0, 0);
    }, [id, navigate]);

    // Helper for POST redirection
    const postForm = (url, data) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;

        // Parse data if it's a string
        let params = data;
        if (typeof data === 'string') {
            try { params = JSON.parse(data); } catch (e) { console.error("Failed to parse redirectData", e); }
        }

        if (params && typeof params === 'object') {
            Object.keys(params).forEach(key => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = params[key];
                form.appendChild(input);
            });
        }

        document.body.appendChild(form);
        form.submit();
    };

    if (!event) return null;

    // Calculate Dynamic Platform Fee
    const getPlatformFee = () => {
        const baseFee = eventPlatformFee?.type === 'percentage'
            ? Math.round((totalAmount * (parseFloat(eventPlatformFee.value) || 0)) / 100)
            : (parseFloat(eventPlatformFee?.value) || 5000);

        let pMethodFee = 0;
        const config = eventPaymentConfigs.find(c => c.method_code === selectedBank);
        
        if (config) {
            pMethodFee = config.fee_type === 'percentage'
                ? Math.round((totalAmount * (parseFloat(config.fee_value) || 0)) / 100)
                : (parseFloat(config.fee_value) || 0);
        } else {
            // Fallback to defaults if no config found (older events)
            if (["BNI", "BRI", "MANDIRI"].includes(selectedBank)) pMethodFee = 5000;
            else if (selectedBank === "QRIS") pMethodFee = 3000;
            else if (["OVO", "SHOPEEPAY"].includes(selectedBank)) pMethodFee = 3500;
            else if (selectedBank === "LINKAJA") pMethodFee = 5000;
        }
        
        return baseFee + pMethodFee;
    };

    const currentPlatformFee = getPlatformFee();

    // Calculate Tax Amount
    const taxAmount = eventTax ? (
        eventTax.is_included
            ? 0 // Tax is already in the price
            : Math.round((totalAmount * (parseFloat(eventTax.value) || 0)) / 100)
    ) : 0;

    // Step 2 Validation: Check if all required fields are filled for ALL holders
    const isNextDisabled = !termsAgreed || ticketHolders.some(h => !h.full_name || !h.email || !h.phone);

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowTermsToast(true);
    };

    const handleApplyVoucher = async (code) => {
        if (!code) {
            setAppliedVoucher(null);
            return;
        }

        setVoucherLoading(true);
        console.log("[Voucher] Applying code:", code, "for event:", id);
        try {
            const response = await supabase.functions.invoke('redeem-voucher', {
                body: {
                    code: code,
                    event_id: id,
                    total_amount: totalAmount
                }
            });

            console.log("[Voucher] Full response:", response);

            if (response.error) {
                let errorMessage = "Gagal memvalidasi voucher";
                if (response.response) {
                    try {
                        const errorBody = await response.response.json();
                        errorMessage = errorBody.error || errorMessage;
                    } catch (e) {
                        console.error("[Voucher] Failed to parse error response:", e);
                    }
                }
                console.error("[Voucher] Error:", errorMessage);
                triggerToast(errorMessage);
                return;
            }

            console.log("[Voucher] Success:", response.data);
            setAppliedVoucher(response.data);
        } catch (error) {
            console.error("[Voucher] Exception:", error);
            triggerToast(error.message || "Gagal memvalidasi voucher");
        } finally {
            setVoucherLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        if (isNextDisabled) {
            setShowValidationErrors(true);
            if (!termsAgreed) {
                triggerToast("Harap setujui Syarat & Ketentuan untuk melanjutkan.");
            } else {
                triggerToast("Harap lengkapi data pengunjung (Nama, Email, dan No. HP).");
            }
            return;
        }

        let currentUser = user;
        if (!currentUser) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            currentUser = authUser;
        }

        if (!currentUser) {
            triggerToast("Sesi anda telah berakhir. Silakan login kembali.");
            return;
        }

        const bookingCode = `HT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const discountAmount = appliedVoucher?.discount_amount || 0;

        // Fee Structure
        const basePlatformFee = eventPlatformFee?.type === 'percentage'
            ? Math.round((totalAmount * (parseFloat(eventPlatformFee.value) || 0)) / 100)
            : (parseFloat(eventPlatformFee?.value) || 5000);

        let paymentFee = 0;
        const config = eventPaymentConfigs.find(c => c.method_code === selectedBank);

        if (config) {
            paymentFee = config.fee_type === 'percentage'
                ? Math.round((totalAmount * (parseFloat(config.fee_value) || 0)) / 100)
                : (parseFloat(config.fee_value) || 0);
        } else {
            if (["BNI", "BRI", "MANDIRI"].includes(selectedBank)) {
                paymentFee = 5000;
            } else if (selectedBank === "QRIS") {
                paymentFee = 3000;
            } else if (["OVO", "SHOPEEPAY"].includes(selectedBank)) {
                paymentFee = 3500;
            } else if (selectedBank === "LINKAJA") {
                paymentFee = 5000;
            }
        }

        const totalPlatformFee = basePlatformFee + paymentFee;
        const subtotal = Math.max(0, (Number(totalAmount) || 0) - (Number(discountAmount) || 0));
        const finalCalculatedTotal = Math.round(subtotal + totalPlatformFee + (Number(taxAmount) || 0));

        console.log("[Checkout] Fee breakdown:", {
            subtotal,
            totalPlatformFee,
            taxAmount,
            discountAmount,
            finalCalculatedTotal
        });

        if (isNaN(finalCalculatedTotal) || finalCalculatedTotal <= 0) {
            triggerToast("Nominal pembayaran tidak valid. Silakan coba lagi.");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    user_id: currentUser.id,
                    total: finalCalculatedTotal,
                    status: "pending",
                    booking_code: bookingCode,
                    voucher_id: appliedVoucher?.voucher_id || null,
                    discount_amount: discountAmount
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const ticketsToCreate = ticketHolders.map(holder => {
                const prefix = "HRT";
                const randomChars = [...Array(5)].map(() => Math.random().toString(36)[2]).join('').toUpperCase();
                const eventTitle = event?.title || eventData?.title || "EVENT";
                const cleanTitle = eventTitle.trim();
                const firstChar = cleanTitle.charAt(0).toUpperCase();
                const lastChar = cleanTitle.charAt(cleanTitle.length - 1).toUpperCase();
                const customQrCode = `${prefix}${randomChars}${firstChar}${lastChar}`;

                return {
                    order_id: order.id,
                    ticket_type_id: holder.ticketTypeId,
                    qr_code: customQrCode,
                    status: "unused",
                    full_name: holder.full_name,
                    email: holder.email,
                    phone: holder.phone,
                    gender: holder.gender,
                    birth_date: `${holder.birth_day} ${holder.birth_month} ${holder.birth_year}`,
                    notes: holder.notes,
                    custom_responses: holder.custom_responses
                };
            });

            const { error: ticketError } = await supabase
                .from("tickets")
                .insert(ticketsToCreate);

            if (ticketError) throw ticketError;

            // Route based on user requirement: BNI & BRI use create-va (SNAP), others use insert-transaction (Non-SNAP)
            const snapBanks = ["BNI", "BRI"];
            const isSnap = snapBanks.includes(selectedBank);
            const functionName = isSnap ? 'create-va' : 'insert-transaction';

            const payload = isSnap ? {
                bank_code: selectedBank,
                order_id: order.id,
                amount: finalCalculatedTotal
            } : {
                method: selectedBank,
                order_id: order.id,
                amount: finalCalculatedTotal,
                customer_name: ticketHolders[0].full_name,
                customer_email: ticketHolders[0].email,
                customer_phone: ticketHolders[0].phone
            };

            console.log(`[Checkout] Initiating ${isSnap ? 'SNAP' : 'Non-SNAP'} payment via ${functionName}...`);

            const { data: gatewayData, error: gatewayError } = await supabase.functions.invoke(functionName, {
                body: payload
            });

            if (gatewayError) {
                let detail = gatewayError.message;
                if (gatewayError.context && gatewayError.context.error) {
                    detail = `${gatewayError.context.error}\n${gatewayError.context.details || ''}`;
                }
                triggerToast("Gagal membuat pembayaran: " + detail);
                throw gatewayError;
            }

            if (gatewayData?.success) {
                const {
                    redirect_url,
                    redirect_data,
                    app_payment_url,
                    deeplink,
                    url_qris,
                    transaction_id
                } = gatewayData;

                // 1. Handle POST Redirect (e.g. LinkAja)
                if (redirect_url && redirect_data) {
                    postForm(redirect_url, redirect_data);
                    return;
                }

                // 2. Handle Simple Redirect (e.g. OVO)
                if (redirect_url) {
                    window.location.href = redirect_url;
                    return;
                }

                // 3. Handle App/Deeplink (e.g. ShopeePay)
                const appUrl = app_payment_url || deeplink;
                if (appUrl) {
                    window.location.href = appUrl;
                    return;
                }

                // 4. Handle QRIS (Stay on page or redirect to specialized status page)
                // For QRIS, we navigate to the payment status page where the QR is displayed
                navigate(`/payment/${transaction_id || order.id}`, {
                    state: {
                        total: finalCalculatedTotal,
                        selectedPayment: isSnap ? "snap" : "bayarind",
                        orderId: order.id,
                        eventTitle: eventData?.title || event.title,
                        visitorEmail: ticketHolders[0].email,
                        virtualAccountNo: gatewayData.va_number || url_qris || gatewayData.payment_code,
                        bankName: selectedBank,
                        expiredDate: gatewayData.expiry_date || gatewayData.expiredDate,
                        urlQris: url_qris
                    }
                });
            } else {
                throw new Error(gatewayData?.error || "Gagal mendapatkan data pembayaran");
            }

        } catch (error) {
            triggerToast("Error creating order: " + error.message);
            setLoading(false);
        }
    };

    const handleNextStep = () => {
        if (isNextDisabled) {
            setShowValidationErrors(true);
            if (!termsAgreed) {
                triggerToast("Harap setujui Syarat & Ketentuan untuk melanjutkan.");
            } else {
                triggerToast("Harap lengkapi data pengunjung (Nama, Email, dan No. HP).");
            }
            return;
        }
        setCurrentStep(2);
        window.scrollTo(0, 0);
    };

    const handlePrevStep = () => {
        setCurrentStep(1);
        window.scrollTo(0, 0);
    };

    return (
        <div className="bg-[#f8fafc] dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-100 relative">
            {/* Attractive Validation Toast */}
            <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${showTermsToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-slate-800 dark:border-slate-200">
                    <div className="bg-amber-500 rounded-full p-1.5 shrink-0 animate-pulse">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    {toastMessage}
                </div>
            </div>

            <Navbar alwaysScrolled={true} />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* STEPPER */}
                    <div className="flex items-center justify-center gap-6 mb-12">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= 1 ? 'bg-[#1a36c7] text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>1</div>
                            <span className={`font-black text-xs uppercase tracking-[0.15em] ${currentStep >= 1 ? 'text-[#1a36c7] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>Detail Pembeli</span>
                        </div>
                        <div className={`w-12 h-[2px] rounded-full transition-all duration-500 ${currentStep >= 2 ? 'bg-[#1a36c7]' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= 2 ? 'bg-[#1a36c7] text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>2</div>
                            <span className={`font-black text-xs uppercase tracking-[0.15em] ${currentStep >= 2 ? 'text-[#1a36c7] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>Konfirmasi</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: STEPS */}
                        <div className="lg:col-span-8 space-y-8">
                            {currentStep === 1 ? (
                                <BuyerDetails
                                    user={user}
                                    ticketHolders={ticketHolders}
                                    setTicketHolders={setTicketHolders}
                                    ticketTypes={ticketTypes}
                                    selectedTickets={selectedTickets}
                                    eventData={eventData}
                                    event={event}
                                    termsAgreed={termsAgreed}
                                    setTermsAgreed={setTermsAgreed}
                                    showValidationErrors={showValidationErrors}
                                />
                            ) : (
                                <OrderConfirmation
                                    ticketHolders={ticketHolders}
                                    selectedTickets={selectedTickets}
                                    ticketTypes={ticketTypes}
                                    totalAmount={totalAmount}
                                    platformFee={currentPlatformFee}
                                    taxAmount={taxAmount}
                                    eventTax={eventTax}
                                    eventPlatformFee={eventPlatformFee}
                                    appliedVoucher={appliedVoucher}
                                    selectedBank={selectedBank}
                                    setSelectedBank={setSelectedBank}
                                    eventPaymentConfigs={eventPaymentConfigs}
                                />
                            )}
                        </div>

                        {/* RIGHT COLUMN: SIDEBAR */}
                        <div className="lg:col-span-4">
                            <OrderSummary
                                event={event}
                                selectedTickets={selectedTickets}
                                ticketTypes={ticketTypes}
                                totalAmount={totalAmount}
                                platformFee={currentPlatformFee}
                                taxAmount={taxAmount}
                                eventTax={eventTax}
                                eventPlatformFee={eventPlatformFee}
                                currentStep={currentStep}
                                onNext={handleNextStep}
                                onPrev={handlePrevStep}
                                onPay={handleCreateOrder}
                                loading={loading}
                                isNextDisabled={currentStep === 2 && !selectedBank} // Disable button if at step 2 and no bank selected
                                appliedVoucher={appliedVoucher}
                                onApplyVoucher={handleApplyVoucher}
                                voucherLoading={voucherLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
