import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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
import DevLayout from "./dev/layouts/DevLayout";

// Creator Pages
import CreatorDashboard from "./creator/pages/Dashboard";
import CreatorDaftar from "./creator/pages/Daftar";

// Dev Pages
import DevDashboard from "./dev/pages/Dashboard";

// Guards
import CreatorGuard from "./guards/CreatorGuard";
import DevGuard from "./guards/DevGuard";

// New User Pages
import BecomeCreator from "./user/pages/BecomeCreator";



export default function App() {
  const [subdomain, setSubdomain] = useState(null);

  useEffect(() => {
    const host = window.location.hostname;
    if (host.startsWith("creator.")) {
      setSubdomain("creator");
    } else if (host.startsWith("dev.")) {
      setSubdomain("dev");
    } else {
      setSubdomain("user");
    }
  }, []);

  if (subdomain === null) return null;

  if (subdomain === "creator") {
    return (
      <Routes>
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/daftar" element={<CreatorDaftar />} />
        <Route
          path="*"
          element={
            <CreatorGuard>
              <CreatorLayout>
                <Routes>
                  <Route path="/" element={<CreatorDashboard />} />
                  <Route path="/events" element={<div>Event Management (Work in Progress)</div>} />
                  <Route path="/tickets" element={<div>Ticket Management (Work in Progress)</div>} />
                  <Route path="/sales" element={<div>Sales (Work in Progress)</div>} />
                  <Route path="/scan" element={<div>QR Scanner (Work in Progress)</div>} />
                  <Route path="/finance" element={<div>Finance (Work in Progress)</div>} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </CreatorLayout>
            </CreatorGuard>
          }
        />
      </Routes>
    );
  }

  if (subdomain === "dev") {
    return (
      <Routes>
        <Route path="/masuk" element={<Masuk />} />
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
  );
}
