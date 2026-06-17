import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const HomeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 4 4 5-5" />
  </svg>
);

const CartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const InsightsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6m0 0V5m0 8h6m-6 0H3m12 6v-4m0 0V5m0 8h6m-6 0h-2" />
  </svg>
);
const TagIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 9V4a1 1 0 011-1z" />
  </svg>
);
const StockIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m0-10l8-4M4 7v10l8 4" />
  </svg>
);
export default function AdminNav({ userEmail, className = "" }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", Icon: HomeIcon },
    { path: "/admin/sales", label: "Sales Records", Icon: ChartIcon },
    { path: "/admin/purchases", label: "Purchase Records", Icon: CartIcon },
    { path: "/admin/offers", label: "Offer Records", Icon: TagIcon },
    { path: "/admin/stock", label: "Stock Received", Icon: StockIcon },
    { path: "/admin/analytics", label: "Analytics", Icon: InsightsIcon },
  ];

  const drawer = (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99]"
        onClick={() => setOpen(false)}
      />
      <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#0a1124] border-r border-[#1a2233] text-[#e8edf5] shadow-2xl z-[100] overflow-y-auto">
        <div className="p-6 border-b border-[#1a2233]">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-base font-bold tracking-[0.2em] uppercase"
                style={{ background: "linear-gradient(135deg, #f4d77a 0%, #d4af3750%, #a8842c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              >
                Saikripa Textiles
              </h2>
              <p className="text-[10px] text-[#7a8499] tracking-[0.3em] uppercase mt-1 font-medium">
                Admin Panel
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#7a8499] hover:text-[#e8edf5] text-2xl leading-none w-8 h-8 flex items-center justify-center transition"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          {userEmail && (
            <p className="text-xs text-[#7a8499] mt-3 truncate">{userEmail}</p>
          )}
        </div>

        <div className="p-3 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.Icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-[#d4af37] text-[#020817]"
                    : "bg-[#020817] text-[#e8edf5] hover:bg-[#0e1730] border border-[#1a2233]"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#020817]" : "text-[#d4af37]"}`} />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#1a2233] space-y-2 mt-4">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full bg-[#020817] border border-[#1a2233] text-[#a8b0c0] py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider hover:border-[#d4af37]/40 hover:text-[#e8edf5] transition"
          >
            View Website
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-rose-500/10 border border-rose-500/30 text-rose-300 py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider hover:bg-rose-500/20 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center justify-center w-10 h-10 rounded-lg bg-[#0a1124] border border-[#1a2233] hover:border-[#d4af37]/50 text-[#e8edf5] transition flex-shrink-0 ${className}`}
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && createPortal(drawer, document.body)}
    </>
  );
}