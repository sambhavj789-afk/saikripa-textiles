import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import LuxuryTextileWebsite from "./App.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import FabricDetail from "./pages/FabricDetail.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SalesRecords from "./pages/SalesRecords";
import PurchaseRecords from "./pages/PurchaseRecords";
import Analytics from "./pages/Analytics";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LuxuryTextileWebsite />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/catalogue/:slug" element={<FabricDetail />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/sales" element={<SalesRecords />} />
        <Route path="/admin/purchases" element={<PurchaseRecords />} />
        <Route path="/admin/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
