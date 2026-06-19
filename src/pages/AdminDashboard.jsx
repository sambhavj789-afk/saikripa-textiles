import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";

// Map admin emails to display names
const ADMIN_NAMES = {
  "sambhavg789@gmail.com": "Sambhav",
  "rucheetpatil@gmail.com": "Rucheet",
  "jainaabhas96@gmail.com": "Aabhas",
};

const getDisplayName = (email) => {
  if (!email) return "";
  if (ADMIN_NAMES[email]) return ADMIN_NAMES[email];
  const username = email.split("@")[0];
  return username.charAt(0).toUpperCase() + username.slice(1);
};

const ChartIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 4 4 5-5" />
  </svg>
);
const CartIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const InsightsIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6m0 0V5m0 8h6m-6 0H3m12 6v-4m0 0V5m0 8h6m-6 0h-2" />
  </svg>
);
const TagIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 9V4a1 1 0 011-1z" />
  </svg>
);
const StockIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m0-10l8-4M4 7v10l8 4" />
  </svg>
);

const inr = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [stats, setStats] = useState({ salesRevenue: 0, purchasesTotal: 0, loading: true });

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setUserEmail(data.session.user.email);
      await fetchStats();
    };
    init();
  }, [navigate]);

  const fetchStats = async () => {
    // Fetch sales records with bill_items to compute total revenue.
    // Revenue matches the Sales Records page: use the stored final_total
    // (includes GST, charges, discount, TCS, round-off) and fall back to the
    // line-item subtotal only when final_total is missing.
    const { data: salesData } = await supabase
      .from("sales_records")
      .select("id, final_total, bill_items(amount)");

    const salesRevenue =
      salesData?.reduce((sum, b) => {
        const subtotal = b.bill_items?.reduce((s, it) => s + Number(it.amount || 0), 0) || 0;
        const finalTotal = b.final_total && Number(b.final_total) > 0 ? Number(b.final_total) : subtotal;
        return sum + finalTotal;
      }, 0) || 0;

    // Fetch purchase records and sum their amounts (matches Purchase Records page Total Amount)
    const { data: purchaseData } = await supabase
      .from("purchase_records")
      .select("amount");

    const purchasesTotal = purchaseData?.reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;

    setStats({ salesRevenue, purchasesTotal, loading: false });
  };

  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };

  const tiles = [
    {
      to: "/admin/sales",
      label: "Sales Records",
      desc: "View, add, and manage customer bills",
      Icon: ChartIcon,
    },
    {
      to: "/admin/purchases",
      label: "Purchase Records",
      desc: "Track inventory and supplier purchases",
      Icon: CartIcon,
    },
    {
      to: "/admin/offers",
      label: "Offer Records",
      desc: "Mill offers, shades & grey receipts",
      Icon: TagIcon,
    },
    {
      to: "/admin/stock",
      label: "Stock Received",
      desc: "Monthly process vs finish — shrinkage",
      Icon: StockIcon,
    },
    {
      to: "/admin/analytics",
      label: "Analytics",
      desc: "Revenue, trends, and business insights",
      Icon: InsightsIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[#020817] text-[#e8edf5] relative overflow-x-hidden">
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 70%)",
        }}
      />

      <header className="relative border-b border-[#1a2233]/80 backdrop-blur-xl bg-[#020817]/80 sticky top-0 z-40">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1
            className="text-lg font-bold tracking-[0.2em] uppercase"
            style={{
              background:
                "linear-gradient(135deg, #f4d77a 0%, #d4af37 50%, #a8842c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Saikripa Textiles
          </h1>
          <p className="text-[10px] text-[#7a8499] tracking-[0.35em] uppercase mt-1 font-medium">
            Admin Dashboard
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        {/* Welcome */}
        <div className="mb-10 flex items-center gap-4">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#f4d77a] via-[#d4af37] to-[#a8842c]" />
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-white">
              Welcome back{userEmail ? "," : ""} <span style={{ background: "linear-gradient(135deg, #f4d77a 0%, #d4af37 60%, #a8842c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{userEmail ? getDisplayName(userEmail) : ""}</span>
            </h2>
            <p className="text-xs text-[#7a8499] mt-2 uppercase tracking-[0.25em] font-medium">
              {userEmail || "Loading..."}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          <div
            className="rounded-xl p-6 bg-gradient-to-br from-[#0d1530] to-[#0a1124] relative overflow-hidden"
            style={goldGlow}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at top right, rgba(212, 175, 55, 0.4) 0%, transparent 60%)",
              }}
            />
            <p className="text-[10px] text-[#d4af37]/70 uppercase tracking-[0.3em] font-medium relative">
              Total Revenue
            </p>
            <p className="text-3xl font-bold text-[#d4af37] mt-3 tracking-tight relative">
              {stats.loading ? "—" : inr(stats.salesRevenue)}
            </p>
          </div>
          <div className="bg-[#0a1124] rounded-xl p-6 border border-[#1a2233]">
            <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">
              Total Gray Purchased
            </p>
            <p className="text-3xl font-bold text-white mt-3 tracking-tight">
              {stats.loading ? "—" : inr(stats.purchasesTotal)}
            </p>
          </div>
        </div>

        {/* Navigation tiles */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-1">
            Quick Access
          </h3>
          <p className="text-xs text-[#7a8499] uppercase tracking-[0.2em] font-medium">
            Jump to any section
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tiles.map(({ to, label, desc, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group relative bg-[#0a1124] border border-[#1a2233] rounded-xl p-6 hover:border-[#d4af37]/50 hover:bg-[#0e1730] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.4),0_0_30px_rgba(212,175,55,0.15)]"
            >
              <div className="w-12 h-12 rounded-lg bg-[#020817] border border-[#1a2233] flex items-center justify-center text-[#d4af37] mb-4 group-hover:border-[#d4af37]/40 transition">
                <Icon className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1 group-hover:text-[#d4af37] transition">
                {label}
              </h4>
              <p className="text-xs text-[#7a8499] leading-relaxed">{desc}</p>
              <span className="absolute top-6 right-6 text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity text-xl">
                →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}