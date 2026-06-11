import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";

// Premium dark palette
// Page:       #020817  (deep blue-black)
// Card:       #0a1124  (subtle lift from page)
// Card hover: #0e1730  
// Border:     #1a2233  (subtle, almost invisible)
// Gold:       #d4af37// Text:       #e8edf5  (off-white with cool tint)
// Muted:      #7a8499  (blue-gray secondary)

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
  confirmed: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
  cancelled: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
  completed: "bg-sky-500/10 text-sky-300 border border-sky-500/30",
};

const PhoneIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.28a2 2 0 011.94 1.515l.7 2.793a2 2 0 01-.45 1.95l-1.27 1.27a16 16 0 006.586 6.586l1.27-1.27a2 2 0 011.95-.45l2.793.7A2 2 0 0121 18.72V21a2 2 0 01-2 2A18 18 0 013 5z" />
  </svg>
);
const MailIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const PinIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9c0 6-7 13-7 13s-7-7-7-13a7 7 0 0114 0z" />
  </svg>
);
const CalendarIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const TagIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 7v6.586a1 1 0 00.293.707l9.414 9.414a1 1 0 001.414 0l6.586-6.586a1 1 0 000-1.414L11.293 6.293A1 1 0 0010.586 6H4a1 1 0 00-1 1z" />
  </svg>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

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

 const handleDelete = async (id, name) => {
    if (!confirm(`Permanently delete appointment for ${name}? This cannot be undone.`)) return;
    
    // First fetch the appointment to get its calendar event ID
    const appt = appointments.find((a) => a.id === id);
    
    // Delete from Google Calendar if there's an event ID
    if (appt?.google_event_id) {
      try {
        await fetch(`http://localhost:3000/api/calendar/${appt.google_event_id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("Calendar event delete failed (will still remove from DB):", err);
      }
    }
    
    // Then delete from Supabase
    const { error: dbError } = await supabase.from("appointments").delete().eq("id", id);
    if (dbError) {
      alert("Could not delete: " + dbError.message);
      return;
    }
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAppts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAppts.map((a) => a.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Permanently delete ${ids.length} appointment${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    const { error: dbError } = await supabase.from("appointments").delete().in("id", ids);
    if (dbError) {
      alert("Could not delete: " + dbError.message);
      return;
    }
    setAppointments((prev) => prev.filter((a) => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
  };

  const filteredAppts = appointments.filter((a) => {
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

  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };

  return (
    <div className="min-h-screen bg-[#020817] text-[#e8edf5] relative overflow-x-hidden">
      {/* Ambient gold glow accent in top-right */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 70%)",
        }}
      />

      <header className="relative border-b border-[#1a2233]/80 backdrop-blur-xl bg-[#020817]/80 sticky top-0 z-40">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1
            className="text-lg font-bold tracking-[0.2em] uppercase"
            style={{ background: "linear-gradient(135deg, #f4d77a 0%, #d4af3750%, #a8842c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            Saikripa Textiles
          </h1>
          <p className="text-[10px] text-[#7a8499] tracking-[0.35em] uppercase mt-1 font-medium">
            Admin Dashboard
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-white">Appointments</h2>
            <p className="text-xs text-[#7a8499] mt-2 uppercase tracking-[0.25em] font-medium">
              Booking requests from the website
            </p>
          </div>
          {filteredAppts.length > 0 && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-[#7a8499] cursor-pointer uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredAppts.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[#d4af37]"
                />
                Select All ({filteredAppts.length})
              </label>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="bg-rose-500/10 border border-rose-500/40 text-rose-300 px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wider hover:bg-rose-500/20 hover:border-rose-500/60 transition"
                >
                  Delete Selected ({selectedIds.size})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats — Total tile is hero with gold glow */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <div className="rounded-xl p-5 bg-gradient-to-br from-[#0d1530] to-[#0a1124] relative overflow-hidden" style={goldGlow}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(212, 175, 55, 0.4) 0%, transparent 60%)" }} />
            <p className="text-[10px] text-[#d4af37]/70 uppercase tracking-[0.3em] font-medium relative">Total</p>
            <p className="text-4xl font-bold text-[#d4af37] mt-3 relative tracking-tight">{counts.total}</p>
          </div>
          {[
            ["Pending", counts.pending, "text-amber-300"],
            ["Confirmed", counts.confirmed, "text-emerald-300"],
            ["Completed", counts.completed, "text-sky-300"],
            ["Cancelled", counts.cancelled, "text-rose-300"],
          ].map(([label, val, color]) => (
            <div key={label} className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233] hover:border-[#1a2233] transition">
              <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">
                {label}
              </p>
              <p className={`text-4xl font-bold ${color} mt-3 tracking-tight`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-[#0a1124] rounded-xl p-4 mb-6 border border-[#1a2233] flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, phone, city, state, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#020817] border border-[#1a2233] rounded-lg px-4 py-2.5 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 focus:bg-[#020817] transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition ${
                  filter === s
                    ? "bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                    : "bg-[#020817] border border-[#1a2233] text-[#7a8499] hover:text-[#e8edf5] hover:border-[#d4af37]/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAppointments}
            className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] whitespace-nowrap transition uppercase tracking-wider"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm">{error}</div>
        ) : loading ? (
          <div className="text-center py-12 text-[#7a8499]">Loading appointments...</div>
        ) : filteredAppts.length === 0 ? (
          <div className="bg-[#0a1124] rounded-xl p-12 text-center text-[#7a8499] border border-[#1a2233]">
            No appointments match this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppts.map((a) => (
              <div
                key={a.id}
                className={`relative rounded-xl p-5 border transition-all duration-300 hover:-translate-y-0.5 ${
                  selectedIds.has(a.id)
                    ? "bg-gradient-to-br from-[#0e1730] to-[#0a1124] border-[#d4af37]/50"
                    : "bg-[#0a1124] border-[#1a2233] hover:border-[#d4af37]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="mt-1.5 w-4 h-4 accent-[#d4af37] cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-white text-lg truncate">
                          {a.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${
                            STATUS_STYLES[a.status] || "bg-[#1a2233] text-[#7a8499] border border-[#1a2233]"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                        <div className="text-[#a8b0c0] flex items-center gap-2">
                          <PhoneIcon className="w-3.5 h-3.5 text-[#d4af37]/70 flex-shrink-0" />
                          <a href={`tel:${a.phone}`} className="hover:text-[#d4af37] transition">{a.phone}</a>
                        </div>
                        {a.email && (
                          <div className="text-[#a8b0c0] truncate flex items-center gap-2">
                            <MailIcon className="w-3.5 h-3.5 text-[#d4af37]/70 flex-shrink-0" />
                            <a href={`mailto:${a.email}`} className="hover:text-[#d4af37] truncate transition">{a.email}</a>
                          </div>
                        )}
                        {(a.city || a.state) && (
                          <div className="text-[#a8b0c0] flex items-center gap-2">
                            <PinIcon className="w-3.5 h-3.5 text-[#d4af37]/70 flex-shrink-0" />
                            {[a.city, a.state].filter(Boolean).join(", ")}
                          </div>
                        )}
                        <div className="text-[#a8b0c0] flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#d4af37]/70 flex-shrink-0" />
                          {a.preferred_date} · {a.preferred_time}
                        </div>
                        <div className="text-[#a8b0c0] sm:col-span-2 lg:col-span-2 flex items-center gap-2">
                          <TagIcon className="w-3.5 h-3.5 text-[#d4af37]/70 flex-shrink-0" />
                          {a.appointment_type}
                        </div>
                      </div>
                      {a.notes && (
                        <div className="mt-3 bg-[#020817]/60 border border-[#1a2233] rounded-lg p-3 text-xs text-[#a8b0c0] leading-relaxed">
                          <span className="font-medium text-[#7a8499] uppercase tracking-wider text-[10px]">Notes</span>
                          <p className="mt-1">{a.notes}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-[#4a5568] mt-3 uppercase tracking-wider">
                        Booked {new Date(a.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-44 flex-shrink-0">
                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                      className="bg-[#020817] border border-[#1a2233] text-[#e8edf5] rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#d4af37]/60 transition cursor-pointer"
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
                      className="text-center bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] text-xs font-bold uppercase tracking-wider py-2 rounded-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition"
                    >
                      WhatsApp
                    </a>
                    <button
                      onClick={() => handleDelete(a.id, a.name)}
                      className="text-center bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium uppercase tracking-wider py-2 rounded-lg hover:bg-rose-500/20 transition"
                    >
                      Delete
                    </button>
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