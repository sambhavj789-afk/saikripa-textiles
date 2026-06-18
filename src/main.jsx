import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./index.css";

// Keep admin pages out of search engines: add <meta name="robots" content=
// "noindex, nofollow"> while on any /admin route, and remove it elsewhere so
// the public marketing pages stay indexable.
function RobotsMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const isAdmin = pathname.startsWith("/admin");
    let tag = document.querySelector('meta[name="robots"]');
    if (isAdmin) {
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "robots");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", "noindex, nofollow");
    } else if (tag) {
      tag.remove();
    }
  }, [pathname]);
  return null;
}
import LuxuryTextileWebsite from "./App.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import FabricDetail from "./pages/FabricDetail.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SalesRecords from "./pages/SalesRecords";
import PurchaseRecords from "./pages/PurchaseRecords";
import StockReceived from "./pages/StockReceived";
import Analytics from "./pages/Analytics";
import BillExport from "./pages/BillExport";
import OfferRecords from "./pages/OfferRecords";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RobotsMeta />
      <Routes>
        <Route path="/" element={<LuxuryTextileWebsite />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/catalogue/:slug" element={<FabricDetail />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/sales" element={<SalesRecords />} />
        <Route path="/admin/sales/:id/bill" element={<BillExport />} />
        <Route path="/admin/purchases" element={<PurchaseRecords />} />
        <Route path="/admin/offers" element={<OfferRecords />} />
        <Route path="/admin/stock" element={<StockReceived />} />
        <Route path="/admin/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);