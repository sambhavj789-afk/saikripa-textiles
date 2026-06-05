import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Auth guard + initial fetch
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setUserEmail(data.session.user.email);
      await fetchAppointments();
    };
    init();
  }, [navigate]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setAppointments(data || []);
  };

  const updateStatus = async (id, status) => {
    const { error: dbError } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (dbError) {
      alert("Could not update: " + dbError.message);
      return;
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const filtered = appointments.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (a.name || "").toLowerCase().includes(q) ||
        (a.phone || "").toLowerCase().includes(q) ||
        (a.city || "").toLowerCase().includes(q) ||
        (a.state || "").toLowerCase().includes(q) ||
        (a.appointment_type || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = appointments.reduce(
    (acc, a) => {
      acc.total++;
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
  );

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="bg-[#081225] text-white px-6 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-wider text-[#d4af37] uppercase">
              Saikripa Textiles
            </h1>
            <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase mt-0.5">
              Admin Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:inline">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            ["Total", counts.total, "text-[#081225]"],
            ["Pending", counts.pending, "text-yellow-600"],
            ["Confirmed", counts.confirmed, "text-green-600"],
            ["Completed", counts.completed, "text-blue-600"],
            ["Cancelled", counts.cancelled, "text-red-600"],
          ].map(([label, val, color]) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                {label}
              </p>
              <p className={`text-2xl font-black ${color} mt-1`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            type="text"
            placeholder="Search by name, phone, city, state, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]"
          />
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition ${
                  filter === s
                    ? "bg-[#081225] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAppointments}
            className="text-xs font-bold text-[#c6a55c] hover:underline whitespace-nowrap"
          >
            ↻ Refresh
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading appointments...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
            No appointments match this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-black text-[#081225] text-base truncate">
                        {a.name}
                      </h3>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${STATUS_STYLES[a.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {a.status}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                      <div className="text-gray-600">
                        📞 <a href={`tel:${a.phone}`} className="hover:text-[#c6a55c]">{a.phone}</a>
                      </div>
                      {a.email && (
                        <div className="text-gray-600 truncate">
                          ✉️ <a href={`mailto:${a.email}`} className="hover:text-[#c6a55c]">{a.email}</a>
                        </div>
                      )}
                      {(a.city || a.state) && (
                        <div className="text-gray-600">
                          📍 {[a.city, a.state].filter(Boolean).join(", ")}
                        </div>
                      )}
                      <div className="text-gray-600">
                        📅 {a.preferred_date} · {a.preferred_time}
                      </div>
                      <div className="text-gray-600 sm:col-span-2 lg:col-span-2">
                        🗂️ {a.appointment_type}
                      </div>
                    </div>
                    {a.notes && (
                      <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed">
                        <span className="font-bold text-gray-500">Notes:</span> {a.notes}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2">
                      Booked: {new Date(a.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-44 flex-shrink-0">
                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#d4af37] bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <a
                      href={`https://wa.me/${a.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center bg-[#25d366] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#1ebe5d] transition"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
