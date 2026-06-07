import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already logged in, skip straight to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message || "Login failed. Check your credentials.");
      return;
    }

    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020817] via-[#0b1748] to-[#172554] p-4">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4af37]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-wider text-[#d4af37] uppercase">
            Saikripa Textiles
          </h1>
          <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase mt-1">
            Admin Portal
          </p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.3)]">
          <h2 className="text-2xl font-black text-[#081225] mb-1">Sign In</h2>
          <p className="text-gray-400 text-sm mb-6">
            Access your appointments dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@saikripa.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                ${loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#081225] to-[#0f2060] text-white hover:shadow-[0_8px_30px_rgba(8,18,37,0.4)] hover:scale-[1.01]"
                }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <a
            href="/"
            className="block text-center text-gray-400 hover:text-[#c6a55c] text-xs mt-6 transition"
          >
            ← Back to website
          </a>
        </div>
      </div>
    </div>
  );
}
