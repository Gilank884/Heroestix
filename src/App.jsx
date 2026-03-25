import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import ScrollToTop from "./components/ScrollToTop";

// User Pages
import Home from "./user/pages/Home";
import AboutUsPage from "./user/pages/about-us";
import Error from "./user/pages/Error";
import Daftar from "./user/pages/Daftar";
import Profile from "./user/pages/Profile"
import Masuk from "./user/pages/Masuk"
import EventDetail from "./user/pages/EventDetail";
import SelectTicket from "./user/pages/SelectTicket";
import Checkout from "./user/pages/Checkout";
import Payment from "./user/pages/Payment";
import TransactionDetail from "./user/pages/TransactionDetail";
import PaymentReceipt from "./user/pages/PaymentReceipt";
import PaymentStatus from "./user/pages/PaymentStatus";
import PaymentSuccess from "./user/pages/PaymentSuccess";
import PaymentPending from "./user/pages/PaymentPending";
import PaymentFailed from "./user/pages/PaymentFailed";
import MockBayarind from "./user/pages/MockBayarind"; // Mock Import
import CreatorPage from "./user/pages/CreatorPage";
import ResetPassword from "./user/pages/ResetPassword";
import TicketValidation from "./user/pages/TicketValidation";

import PrivacyPolicy from "./user/pages/PrivacyPolicy";
import TermsOfService from "./user/pages/TermsOfService";
import AcceptInvite from "./pages/AcceptInvite";

// Layouts
import CreatorLayout from "./creator/layouts/CreatorLayout";
import EventManagementLayout from "./creator/layouts/EventManagementLayout";
import DevLayout from "./dev/layouts/DevLayout";

// Creator Pages
import CreatorDashboard from "./creator/pages/Dashboard";
import CreatorDaftar from "./creator/pages/Daftar";
import Events from "./creator/pages/Events";
import CreatorEventDetail from "./creator/pages/EventDetail"; // Renamed to avoid conflict with user-side EventDetail
import Tickets from "./creator/pages/Tickets";
import Scan from "./creator/pages/Scan";
import TicketCategories from "./creator/pages/TicketCategories";
import Visitors from "./creator/pages/Visitors";
import Overview from "./creator/pages/Overview";
import Withdrawals from "./creator/pages/Withdrawals";
import EventSalesReport from "./creator/pages/EventSalesReport";
import EventWithdrawals from "./creator/pages/EventWithdrawals";
import EventValidationStats from "./creator/pages/EventValidationStats";
import EventCheckIn from "./creator/pages/EventCheckIn";
import EventCash from "./creator/pages/EventCash";
import AdditionalForm from "./creator/pages/AdditionalForm";
import CreateEvent from "./creator/pages/CreateEvent";
import EventVouchers from "./creator/pages/EventVouchers";
import VoucherDetail from "./creator/pages/VoucherDetail";
import CreateTicket from "./creator/pages/CreateTicket";
import TicketDetail from "./creator/pages/TicketDetail";
import CreatorProfile from "./creator/pages/Profile";
import CreatorWithdrawalDetail from "./creator/pages/WithdrawalDetail";
import RequestWithdrawal from "./creator/pages/RequestWithdrawal";
import EventRequestWithdrawal from "./creator/pages/EventRequestWithdrawal";
import EventStaff from "./creator/pages/EventStaff";
import SalesDetail from "./creator/pages/SalesDetail";
import PublicScan from "./creator/pages/PublicScan";

// Dev Pages
import DevDashboard from "./dev/pages/Dashboard";
import DevCreators from "./dev/pages/Creators";
import DevCreatorDetail from "./dev/pages/CreatorDetail";
import DevEvents from "./dev/pages/Events";
import DevEventConfig from "./dev/pages/EventConfig";
import DevCash from "./dev/pages/Cash";
import DevWithdrawals from "./dev/pages/Withdrawals";
import DevWithdrawalDetail from "./dev/pages/WithdrawalDetail";
import DevDocuments from "./dev/pages/Documents";
import DevEventCashDetail from "./dev/pages/EventCashDetail";
import DevProfitBreakdown from "./dev/pages/ProfitBreakdown";
import DevTransactions from "./dev/pages/Transactions";
import CreatorCustomOrder from "./creator/pages/CustomOrder";
import DevCustomOrders from "./dev/pages/CustomOrders";



// Guards
import CreatorGuard from "./guards/CreatorGuard";
import StaffGuard from "./components/StaffGuard";
import DevGuard from "./guards/DevGuard";
import useAuthStore from "./auth/useAuthStore";

// New User Pages
import BecomeCreator from "./user/pages/BecomeCreator";
import { getBaseDomain, getSubdomainUrl } from "./lib/navigation";




export default function App() {
  const [subdomain, setSubdomain] = useState(null);

  useEffect(() => {
    const host = window.location.hostname;
    const baseDomain = getBaseDomain();

    if (host.startsWith("creator.")) {
      setSubdomain("creator");
    } else if (host.startsWith("dev.")) {
      setSubdomain("dev");
    } else {
      setSubdomain("user");
    }
  }, []);


  const { login, logout, setChecking } = useAuthStore();

  useEffect(() => {
    // 🔗 Restore Session from Hash (Cross-Subdomain Bridge for Localhost)
    const restoreSession = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token=") && hash.includes("refresh_token=")) {
        console.log("Found session tokens in URL hash, attempting to restore session...");
        setChecking(true);
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const type = params.get("type");
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            console.log("Session restored successfully from hash. Type:", type);
            if (type === "recovery") {
              console.log("Recovery session detected in restoreSession, NOT clearing hash to allow onAuthStateChange to catch it.");
              return true;
            }
            // Clean hash without leaving a '#' for normal sessions
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
            return true; // Signal success
          } else {
            console.error("Error restoring session from hash:", error.message);
          }
        }
      }
      return false;
    };



    const checkRedirect = async (session) => {
      if (session?.user) {
        console.log("Active session found for user:", session.user.id);

        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          setChecking(true);
        }

        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, tanggal_lahir")
            .eq("id", session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("[checkRedirect] Error fetching profile:", profileError.message);
            throw profileError;
          }

          console.log("[checkRedirect] Profile data retrieved:", profile);

          const authMode = localStorage.getItem("auth_mode");
          const isExplicitAuth = !!authMode;

          if (!profile && !profileError) {
            // If profile doesn't exist, sign out and send to login to ensure consistency
            logout();
            await supabase.auth.signOut();
            localStorage.removeItem("auth_mode");
            window.location.href = window.location.origin + "/masuk?error=unregistered";
            return;
          } else if (profile) {
            const host = window.location.hostname;
            const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
            const port = window.location.port ? `:${window.location.port}` : "";
            const baseDomain = getBaseDomain();
            const isBaseDomain = host === baseDomain;
            const isCreatorSub = host.startsWith("creator.");
            const isDevSub = host.startsWith("dev.");
            const isAuthPath = window.location.pathname === "/masuk" || window.location.pathname === "/daftar";

            const authMode = localStorage.getItem("auth_mode");
            const isExplicitAuth = !!authMode;



            localStorage.removeItem("auth_mode");
            localStorage.removeItem("auth_role");

            let role = profile.role;

            // NEW: Support for legacy/mismatched roles. 
            // If the user reports 'user' but they are on a portal subdomain, double check the database.
            if (role === "user" && (isCreatorSub || isDevSub)) {
              try {
                const tableCheck = isCreatorSub ? "creators" : "developers";
                const { data: hasRecord } = await supabase.from(tableCheck).select("id").eq("id", session.user.id).maybeSingle();
                if (hasRecord) {
                  console.log(`[checkRedirect] Auto-promoting user to ${isCreatorSub ? 'creator' : 'developer'} based on existence in ${tableCheck} table.`);
                  role = isCreatorSub ? "creator" : "developer";
                  // Sync the profile role in DB too so it doesn't repeat
                  await supabase.from("profiles").update({ role }).eq("id", session.user.id);
                }
              } catch (e) {
                console.warn("[checkRedirect] Failed to check for role promotion:", e);
              }
            }

            login(session.user, session.access_token, role);

            console.log(`[checkRedirect] Role: ${role}, Subdomain: ${isCreatorSub ? "creator" : (isDevSub ? "dev" : "base")}, Path: ${window.location.pathname}, ExplicitAuth: ${isExplicitAuth}`);

            if (role === "creator") {
              const isCreatorGateway = authMode === "creator";
              // Rule: Redirect to portal if (fresh login via creator gateway) OR (on dev sub) OR (on base sub AND trying to access auth paths AND used creator gateway)
              const needsPortal = (isExplicitAuth && isCreatorGateway) || isDevSub || (isBaseDomain && isAuthPath && isCreatorGateway);

              if (needsPortal) {
                const target = getSubdomainUrl("creator", isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
                const targetOrigin = new URL(target).origin;
                if (window.location.origin !== targetOrigin) {
                  console.log("[checkRedirect] Redirecting creator to portal. Reason: Gateway=" + authMode);
                  window.location.href = target;
                  return;
                }
              }

              // Special Case: Creator logged in via User gateway but is currently on a portal subdomain
              if (authMode === "user" && (isCreatorSub || isDevSub)) {
                console.log("[checkRedirect] Creator via User gateway detected on subdomain. Redirecting to base domain.");
                const target = getSubdomainUrl(null, isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
                window.location.href = target;
                return;
              }

              // If we are on creator sub and somehow hit an auth path, send to dashboard
              if (isCreatorSub && isAuthPath) {
                console.log("[checkRedirect] Already on creator sub but on auth path, sending home...");
                window.location.href = "/";
                return;
              }
            } else if (role === "developer") {
              const isDevGateway = authMode === "developer";
              const needsPortal = (isExplicitAuth && isDevGateway) || isCreatorSub || (isBaseDomain && isAuthPath && isDevGateway);

              if (needsPortal) {
                const target = getSubdomainUrl("dev", isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
                const targetOrigin = new URL(target).origin;
                if (window.location.origin !== targetOrigin) {
                  console.log("[checkRedirect] Redirecting developer to portal. Reason: Gateway=" + authMode);
                  window.location.href = target;
                  return;
                }
              }

              // Special Case: Developer logged in via User gateway but is currently on a portal subdomain
              if (authMode === "user" && (isCreatorSub || isDevSub)) {
                console.log("[checkRedirect] Developer via User gateway detected on subdomain. Redirecting to base domain.");
                const target = getSubdomainUrl(null, isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
                window.location.href = target;
                return;
              }

              if (isDevSub && isAuthPath) {
                console.log("[checkRedirect] Already on dev sub but on auth path, sending home...");
                window.location.href = "/";
                return;
              }
            }

            // Universal Fallback: If any authenticated user is on an auth path on the base domain, 
            // and hasn't been redirected to a portal, send them home.
            if (isBaseDomain && isAuthPath) {
              console.log("[checkRedirect] Authenticated user on auth path (base domain). Redirecting to home.");
              window.location.href = "/";
              return;
            }
          }
        } finally {
          setChecking(false);
        }
      } else {
        logout();
        setChecking(false);
      }
    };

    // 1. Listen for changes FIRST (to catch INITIAL_SESSION or sign-ins)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth State Change:", event);
      const isRecovery = event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && window.location.hash.includes("type=recovery"));

      if (isRecovery && window.location.pathname !== "/reset-password") {
        console.log("Password recovery event detected, redirecting to /reset-password");
        window.location.href = window.location.origin + "/reset-password" + window.location.hash;
        return;
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        checkRedirect(session);
      }
    });

    // 2. Initial Hash Sync & Session Check
    const initAuth = async () => {
      const restored = await restoreSession();
      if (!restored) {
        // Redundant with onAuthStateChange INITIAL_SESSION, but good for safety
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // checkRedirect(session); // Let the listener handle it to avoid duplicate calls
        } else {
          setChecking(false);
        }
      }
    };

    initAuth();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (subdomain === null) return null;

  if (subdomain === "creator") {
    return (
      <Routes>
        <Route path="/masuk" element={<Masuk role="creator" />} />
        <Route path="/daftar" element={<CreatorDaftar />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/check-in/:eventId/:token" element={<Navigate to={`/scan-tiket/${window.location.pathname.split('/')[2]}/${window.location.pathname.split('/')[3]}`} replace />} />
        <Route path="/scan-tiket/:eventId/:token" element={<PublicScan />} />

        {/* Event Management Routes - Protected by StaffGuard (allows both creators and staff tokens) */}
        <Route path="/manage/event/:id/*" element={
          <StaffGuard>
            <EventManagementLayout>
              <Routes>
                <Route path="/" element={<CreatorEventDetail />} />
                <Route path="/ticket-categories" element={<TicketCategories />} />
                <Route path="/ticket-categories/create" element={<CreateTicket />} />
                <Route path="/ticket-categories/:ticketId/edit" element={<TicketDetail />} />
                <Route path="/visitors" element={<Visitors />} />
                <Route path="/check-in-stats" element={<EventValidationStats />} />
                <Route path="/check-in" element={<EventCheckIn />} />
                <Route path="/vouchers" element={<EventVouchers />} />
                <Route path="/vouchers/:voucherId/edit" element={<VoucherDetail />} />
                <Route path="/staff" element={<EventStaff />} />
                <Route path="/sales-report" element={<EventSalesReport />} />
                <Route path="/sales-report/:ticketId" element={<SalesDetail />} />
                <Route path="/withdrawals" element={<EventWithdrawals />} />
                <Route path="/withdrawals/:id" element={<CreatorWithdrawalDetail />} />
                <Route path="/withdrawals/request" element={<EventRequestWithdrawal />} />
                <Route path="/custom-order" element={<CreatorCustomOrder />} />
                <Route path="/additional-form" element={<AdditionalForm />} />
              </Routes>
            </EventManagementLayout>
          </StaffGuard>
        } />

        {/* All Other Creator Routes - Protected by CreatorGuard (requires authentication) */}
        <Route
          path="*"
          element={
            <CreatorGuard>
              <Routes>
                <Route path="*" element={
                  <CreatorLayout>
                    <Routes>
                      <Route path="/" element={<CreatorDashboard />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/events/create" element={<CreateEvent />} />
                      <Route path="/tickets" element={<Tickets />} />
                      <Route path="/scan" element={<Scan />} />
                      <Route path="/staff" element={<div className="p-10 font-medium text-2xl text-gray-800">Staff Management (Work in Progress)</div>} />
                      <Route path="/vouchers" element={<div className="p-10 font-medium text-2xl text-gray-800">Voucher & Promotions (Work in Progress)</div>} />
                      <Route path="/sales-report" element={<Overview />} />
                      <Route path="/withdrawals" element={<Withdrawals />} />
                      <Route path="/withdrawals/:id" element={<CreatorWithdrawalDetail />} />
                      <Route path="/withdrawals/request" element={<RequestWithdrawal />} />
                      <Route path="/reports" element={<div className="p-10 font-medium text-2xl text-gray-800">Data Recap & Reports (Work in Progress)</div>} />
                      <Route path="/security/password" element={<div className="p-10 font-medium text-2xl text-gray-800">Change Password (Work in Progress)</div>} />
                      <Route path="/security/tokens" element={<div className="p-10 font-medium text-2xl text-gray-800">Token Generator (Work in Progress)</div>} />
                      <Route path="/tools/bracelet-printing" element={<div className="p-10 font-medium text-2xl text-gray-800">Cetak Tiket Gelang (Work in Progress)</div>} />
                      <Route path="/profile" element={<CreatorProfile />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </CreatorLayout>
                } />
              </Routes>
            </CreatorGuard>
          }
        />
      </Routes>
    );
  }

  if (subdomain === "dev") {
    return (
      <Routes>
        <Route path="/masuk" element={<Masuk role="developer" />} />
        <Route path="/daftar" element={<div>Dev Registration Not Allowed</div>} />
        <Route
          path="*"
          element={
            <DevGuard>
              <DevLayout>
                <Routes>
                  <Route path="/" element={<DevDashboard />} />
                  <Route path="/creators" element={<DevCreators />} />
                  <Route path="/creators/:id" element={<DevCreatorDetail />} />
                  <Route path="/events" element={<DevEvents />} />
                  <Route path="/events/:eventId/config" element={<DevEventConfig />} />
                  <Route path="/cash" element={<DevCash />} />
                  <Route path="/cash/:eventId" element={<DevEventCashDetail />} />
                  <Route path="/cash/breakdown" element={<DevProfitBreakdown />} />
                  <Route path="/cash/:eventId/breakdown" element={<DevProfitBreakdown />} />
                  <Route path="/withdrawals" element={<DevWithdrawals />} />
                  <Route path="/withdrawals/:id" element={<DevWithdrawalDetail />} />
                  <Route path="/transactions" element={<DevTransactions />} />
                  <Route path="/documents" element={<DevDocuments />} />
                  <Route path="/custom-orders" element={<DevCustomOrders />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </DevLayout>
            </DevGuard>
          }
        />
      </Routes>
    );
  }



  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/daftar" element={<Daftar />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/error" element={<Error />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/select-ticket/:id" element={<SelectTicket />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/payment/:id" element={<Payment />} />
        <Route path="/payment/status/:id" element={<PaymentStatus />} />
        <Route path="/payment/success/:id" element={<PaymentSuccess />} />
        <Route path="/payment/pending/:id" element={<PaymentPending />} />
        <Route path="/payment/failed/:id" element={<PaymentFailed />} />
        <Route path="/payment/receipt" element={<PaymentReceipt />} />
        <Route path="/payment/mock-bayarind" element={<MockBayarind />} />
        <Route path="/transaction-detail/:id" element={<TransactionDetail />} />
        <Route path="/become-creator" element={<BecomeCreator />} />
        <Route path="/creator/:id" element={<CreatorPage />} />
        <Route path="/check-in/:eventId/:token" element={<Navigate to={`/scan-tiket/${window.location.pathname.split('/')[2]}/${window.location.pathname.split('/')[3]}`} replace />} />
        <Route path="/scan-tiket/:eventId/:token" element={<PublicScan />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/validasi-tiket" element={<TicketValidation />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
