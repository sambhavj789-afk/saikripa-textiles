import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// Icon components — clean SVGs to replace emoji
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

const InsightsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6m0 0V5m0 8h6m-6 0H3m12 6v-4m0 0V5m0 8h6m-6 0h-2" />
  </svg>
);

const CartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ExternalIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export default function AdminNav({ userEmail, className = "" }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", Icon: HomeIcon, desc: "Appointments & overview" },
    { path: "/admin/sales", label: "Sales Records", Icon: ChartIcon, desc: "Bill log & sales" },
    { path: "/admin/purchases", label: "Purchase Records", Icon: CartIcon, desc: "Supplier bills" },
    { path: "/admin/analytics", label: "Analytics", Icon: InsightsIcon, desc: "Charts & insights" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex-shrink-0 ${className}`}
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-80 max-w-[85vw] h-full bg-[#081225] text-white flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black tracking-wider text-[#d4af37] uppercase">
                    Saikripa Textiles
                  </h2>
                  <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase mt-0.5">
                    Admin Panel
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/60 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
              {userEmail && (
                <p className="text-xs text-gray-400 mt-3 truncate">{userEmail}</p>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.Icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive
                        ? "bg-[#d4af37] text-[#081225]"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className={`text-[10px] uppercase tracking-widest ${isActive ? "text-[#081225]/70" : "text-gray-400"}`}>
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
              <Link
                to="/"
                className="flex items-center justify-center gap-2 w-full border border-white/20 text-white/80 py-2.5 rounded-xl font-bold text-xs hover:bg-white/10 transition"
              >
                <ExternalIcon className="w-3.5 h-3.5" />
                View Website
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full bg-red-500/10 border border-red-500/30 text-red-300 py-2.5 rounded-xl font-bold text-xs hover:bg-red-500/20 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}