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

// Dev Pages
import DevDashboard from "./dev/pages/Dashboard";

// Guards
import CreatorGuard from "./guards/CreatorGuard";
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
        setChecking(true);
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            // Clean hash without leaving a '#'
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
          } else {
            setChecking(false);
          }
        } else {
          setChecking(false);
        }
      }
    };
    restoreSession();



    const checkRedirect = async (session) => {
      if (session?.user) {
        setChecking(true);
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const authMode = localStorage.getItem("auth_mode");

        if (!profile) {
          // If profile doesn't exist and they are registering
          if (authMode === "register") {
            const role = localStorage.getItem("auth_role") || "user";

            // Create profile
            const { error: createError } = await supabase.from("profiles").upsert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.nama || session.user.user_metadata?.full_name || "Google User",
              role: role,
            });

            if (!createError && role === "creator") {
              // Also create creator record
              await supabase.from("creators").insert({
                id: session.user.id,
                brand_name: session.user.user_metadata?.brand_name || "My Brand",
                verified: false
              });
            }

            localStorage.removeItem("auth_mode");
            localStorage.removeItem("auth_role");
            window.location.reload(); // Refresh to trigger redirect with profile
            return;
          } else {
            // Unregistered user trying to login
            logout();
            await supabase.auth.signOut();
            localStorage.removeItem("auth_mode");
            window.location.href = window.location.origin + "/masuk?error=unregistered";
            return;
          }
        }

        if (profile) {
          localStorage.removeItem("auth_mode");
          localStorage.removeItem("auth_role");

          const role = profile.role;

          // SYNC STORE
          login(session.user, session.access_token, role);

          const host = window.location.hostname;
          const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
          const port = window.location.port ? `:${window.location.port}` : "";
          const baseDomain = getBaseDomain();
          const isBaseDomain = host === baseDomain;
          const isCreatorSub = host.startsWith("creator.");
          const isDevSub = host.startsWith("dev.");

          // 🔄 CROSS-SUBDOMAIN REDIRECTION LOGIC
          // Rule: Only redirect if on the WRONG subdomain, OR if explicitly logging in/registering
          const shouldForceRedirect = authMode === "login" || authMode === "register";

          if (role === "creator") {
            if (isDevSub || (shouldForceRedirect && !isCreatorSub && !isBaseDomain)) {
              window.location.href = getSubdomainUrl("creator", isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
              return;
            }
          } else if (role === "developer") {
            if (isCreatorSub || (shouldForceRedirect && !isDevSub && !isBaseDomain)) {
              window.location.href = getSubdomainUrl("dev", isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
              return;
            }
          } else if (role === "user") {
            if (isCreatorSub || isDevSub) {
              window.location.href = getSubdomainUrl(null);
              return;
            }
          }
        }
      } else {
        // No session
        logout();
        setChecking(false);
      }
    };

    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkRedirect(session);
    });

    // 2. Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Only re-check if session actually changes or explicitly signs in/out
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        checkRedirect(session);
      }
    });

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
        <Route
          path="*"
          element={
            <CreatorGuard>
              <Routes>
                {/* 1. Event Specific Management (Dedicated Layout) */}
                <Route path="/manage/event/:id/*" element={
                  <EventManagementLayout>
                    <Routes>
                      <Route path="/" element={<CreatorEventDetail />} />
                      <Route path="/stats" element={<div className="p-10 font-bold text-2xl text-gray-800">Event Statistics (Work in Progress)</div>} />
                      <Route path="/additional-form" element={<div className="p-10 font-bold text-2xl text-gray-800">Additional Forms (Work in Progress)</div>} />
                      <Route path="/ticket-categories" element={<TicketCategories />} />
                      <Route path="/facilities" element={<div className="p-10 font-bold text-2xl text-gray-800">Event Facilities (Work in Progress)</div>} />
                      <Route path="/staff" element={<div className="p-10 font-bold text-2xl text-gray-800">Event Staff (Work in Progress)</div>} />
                      <Route path="/lineup" element={<div className="p-10 font-bold text-2xl text-gray-800">Lineup Management (Work in Progress)</div>} />
                      <Route path="/vouchers" element={<div className="p-10 font-bold text-2xl text-gray-800">Event Vouchers (Work in Progress)</div>} />
                      <Route path="/cash" element={<div className="p-10 font-bold text-2xl text-gray-800">Event Cash (Work in Progress)</div>} />
                      <Route path="/visitor-stats" element={<div className="p-10 font-bold text-2xl text-gray-800">Visitor Statistics (Work in Progress)</div>} />
                      <Route path="/visitors" element={<div className="p-10 font-bold text-2xl text-gray-800">Visitor List (Work in Progress)</div>} />
                      <Route path="/inactive-visitors" element={<div className="p-10 font-bold text-2xl text-gray-800">Inactive Visitors (Work in Progress)</div>} />
                      <Route path="/pos" element={<div className="p-10 font-bold text-2xl text-gray-800">Point Of Sales (Work in Progress)</div>} />
                      <Route path="/checkin-stats" element={<div className="p-10 font-bold text-2xl text-gray-800">Checkin Stats (Work in Progress)</div>} />
                      <Route path="/check-in" element={<div className="p-10 font-bold text-2xl text-gray-800">Check-In Management (Work in Progress)</div>} />
                      <Route path="/broadcast" element={<div className="p-10 font-bold text-2xl text-gray-800">Broadcast Email (Work in Progress)</div>} />
                    </Routes>
                  </EventManagementLayout>
                } />

                {/* 2. Standard Creator Portal (Main Layout) */}
                <Route path="*" element={
                  <CreatorLayout>
                    <Routes>
                      <Route path="/" element={<CreatorDashboard />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/tickets" element={<Tickets />} />
                      <Route path="/scan" element={<Scan />} />
                      <Route path="/staff" element={<div className="p-10 font-bold text-2xl text-gray-800">Staff Management (Work in Progress)</div>} />
                      <Route path="/vouchers" element={<div className="p-10 font-bold text-2xl text-gray-800">Voucher & Promotions (Work in Progress)</div>} />
                      <Route path="/cash" element={<div className="p-10 font-bold text-2xl text-gray-800">Cash & Financials (Work in Progress)</div>} />
                      <Route path="/reports" element={<div className="p-10 font-bold text-2xl text-gray-800">Data Recap & Reports (Work in Progress)</div>} />
                      <Route path="/security/password" element={<div className="p-10 font-bold text-2xl text-gray-800">Change Password (Work in Progress)</div>} />
                      <Route path="/security/tokens" element={<div className="p-10 font-bold text-2xl text-gray-800">Token Generator (Work in Progress)</div>} />
                      <Route path="/tools/bracelet-printing" element={<div className="p-10 font-bold text-2xl text-gray-800">Cetak Tiket Gelang (Work in Progress)</div>} />
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
                  <Route path="/creators" element={<div>Creator Management (Work in Progress)</div>} />
                  <Route path="/events" element={<div>Event Manager (Work in Progress)</div>} />
                  <Route path="/transactions" element={<div>Transactions (Work in Progress)</div>} />
                  <Route path="/fee" element={<div>Platform Fee (Work in Progress)</div>} />
                  <Route path="/withdrawals" element={<div>Withdrawals (Work in Progress)</div>} />
                  <Route path="/logs" element={<div>Audit Log (Work in Progress)</div>} />
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
        <Route path="/profile" element={<Profile />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/select-ticket/:id" element={<SelectTicket />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/payment/:id" element={<Payment />} />
        <Route path="/transaction-detail/:id" element={<TransactionDetail />} />
        <Route path="/become-creator" element={<BecomeCreator />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
