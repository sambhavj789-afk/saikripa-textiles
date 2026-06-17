import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";
import Autocomplete from "../components/Autocomplete";

const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const SUPPLIERS = ["Suzuki", "Saileela"];
const FABRIC_QUALITIES = ["Superior Collection", "Gold Club", "Aura Plus", "Innova", "Milky Way", "Classic P 7200", "Victory", "Alpha Dyed", "Poly King", "Good Cut", "Fant", "Rages", "Chindi", "Dress Code"];

const emptyForm = () => ({
  bill_date: new Date().toISOString().split("T")[0],
  bill_number: "", party: "", quality: "", meter: "", plus: "", minus: "", amount: "", notes: "",
});

export default function PurchaseRecords() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/admin/login", { replace: true }); return; }
      setUserEmail(data.session.user.email);
      await fetchBills();
    };
    init();
  }, [navigate]);

  const fetchBills = async () => {
    setLoading(true);
    const { data, error: dbError } = await supabase.from("purchase_records").select("*").order("bill_date", { ascending: false });
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setBills(data || []);
  };

  const supplierOptions = useMemo(() => {
    const set = new Set(SUPPLIERS);
    bills.forEach((b) => b.party && set.add(b.party));
    return Array.from(set).sort();
  }, [bills]);

  const notesOptions = useMemo(() => Array.from(new Set(bills.map(b => b.notes).filter(Boolean))).sort(), [bills]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const resetForm = () => { setForm(emptyForm()); setEditingId(null); };

  const startEdit = (b) => {
    setForm({
      bill_date: b.bill_date, bill_number: b.bill_number, party: b.party, quality: b.quality,
      meter: String(b.meter), plus: b.plus ? String(b.plus) : "", minus: b.minus ? String(b.minus) : "",
      amount: String(b.amount), notes: b.notes || "",
    });
    setEditingId(b.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bill_number || !form.party || !form.quality || !form.meter || !form.amount) {
      alert("Please fill in Bill #, Party, Quality, Meter, and Amount."); return;
    }
    const payload = {
      bill_date: form.bill_date, bill_number: form.bill_number.trim(), party: form.party.trim(),
      quality: form.quality.trim(), meter: parseFloat(form.meter),
      plus: parseFloat(form.plus) || 0, minus: parseFloat(form.minus) || 0,
      amount: parseFloat(form.amount), notes: form.notes.trim() || null,
    };
    if (editingId) {
      const { error: dbError } = await supabase.from("purchase_records").update(payload).eq("id", editingId);
      if (dbError) { alert("Could not update: " + dbError.message); return; }
    } else {
      const { error: dbError } = await supabase.from("purchase_records").insert([payload]);
      if (dbError) { alert("Could not save: " + dbError.message); return; }
    }
    resetForm();
    setShowForm(false);
    fetchBills();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this purchase bill?")) return;
    const { error: dbError } = await supabase.from("purchase_records").delete().eq("id", id);
    if (dbError) { alert("Could not delete: " + dbError.message); return; }
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const filteredBills = bills
    .filter((b) => {
      if (partyFilter !== "all" && b.party !== partyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (b.party || "").toLowerCase().includes(q) || (b.bill_number || "").toLowerCase().includes(q) || (b.quality || "").toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case "date": valA = new Date(a.bill_date).getTime(); valB = new Date(b.bill_date).getTime(); break;
        case "bill": valA = parseInt(a.bill_number, 10) || 0; valB = parseInt(b.bill_number, 10) || 0; break;
        case "party": valA = (a.party || "").toLowerCase(); valB = (b.party || "").toLowerCase(); break;
        case "quality": valA = (a.quality || "").toLowerCase(); valB = (b.quality || "").toLowerCase(); break;
        case "amount": valA = Number(a.amount || 0); valB = Number(b.amount || 0); break;
        case "meter": valA = Number(a.meter || 0); valB = Number(b.meter || 0); break;
        default: return 0;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const totals = useMemo(() => ({
    bills: filteredBills.length,
    meter: filteredBills.reduce((s, b) => s + Number(b.meter || 0), 0),
    plus: filteredBills.reduce((s, b) => s + Number(b.plus || 0), 0),
    minus: filteredBills.reduce((s, b) => s + Number(b.minus || 0), 0),
    amount: filteredBills.reduce((s, b) => s + Number(b.amount || 0), 0),
  }), [filteredBills]);

  const inputCls = "w-full bg-[#020817] border border-[#1a2233] rounded-lg px-3 py-2 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition";
  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };
  const partyChips = ["all", ...supplierOptions];

  return (
    <div className="min-h-screen bg-[#020817] text-[#e8edf5] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-50" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 70%)" }} />

      <header className="relative border-b border-[#1a2233]/80 backdrop-blur-xl bg-[#020817]/80 sticky top-0 z-40">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-lg font-bold tracking-[0.2em] uppercase" style={{ background: "linear-gradient(135deg, #f4d77a 0%, #d4af3750%, #a8842c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Saikripa Textiles</h1>
          <p className="text-[10px] text-[#7a8499] tracking-[0.35em] uppercase mt-1 font-medium">Purchase Records</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#f4d77a] via-[#d4af37] to-[#a8842c]" />
            <div>
              <h2 className="text-4xl font-bold tracking-tight" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f4d77a 60%, #d4af37 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Purchase Records</h2>
              <p className="text-xs text-[#7a8499] mt-2 uppercase tracking-[0.25em] font-medium">Purchase bills — Plus = underweight · Minus = overweight</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition">
            {showForm ? "Close Form" : "+ New Purchase Bill"}
          </button>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm mb-4">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#0a1124] rounded-xl p-6 mb-6 border border-[#d4af37]/30" style={goldGlow}>
            <h3 className="font-bold text-white text-lg mb-5">{editingId ? "Edit Purchase Bill" : "New Purchase Bill"}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Date *"><input type="date" value={form.bill_date} onChange={(e) => handleChange("bill_date", e.target.value)} required className={inputCls + " [color-scheme:dark]"} /></Field>
              <Field label="Bill # *"><input type="text" value={form.bill_number} onChange={(e) => handleChange("bill_number", e.target.value)} placeholder="e.g. 2293" required className={inputCls} /></Field>
              <Field label="Party (Supplier) *"><Autocomplete value={form.party} onChange={(v) => handleChange("party", v)} suggestions={supplierOptions} placeholder="Suzuki / Saileela" required className={inputCls} /></Field>
              <Field label="Quality *"><Autocomplete value={form.quality} onChange={(v) => handleChange("quality", v)} suggestions={FABRIC_QUALITIES} placeholder="e.g. Superior Collection" required className={inputCls} /></Field>
              <Field label="Meter *"><input type="number" step="0.01" value={form.meter} onChange={(e) => handleChange("meter", e.target.value)} placeholder="0.00" required className={inputCls} /></Field>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.25em] mb-2 text-rose-300">Plus (+) — Underweight</label>
                <input type="number" step="0.01" value={form.plus} onChange={(e) => handleChange("plus", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.25em] mb-2 text-emerald-300">Minus (−) — Overweight</label>
                <input type="number" step="0.01" value={form.minus} onChange={(e) => handleChange("minus", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <Field label="Amount *"><input type="number" step="0.01" value={form.amount} onChange={(e) => handleChange("amount", e.target.value)} placeholder="0" required className={inputCls} /></Field>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Notes</label>
                <Autocomplete value={form.notes} onChange={(v) => handleChange("notes", v)} suggestions={notesOptions} placeholder="Optional" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition">{editingId ? "Update Bill" : "Save Bill"}</button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="bg-[#020817] border border-[#1a2233] text-[#a8b0c0] px-6 py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider hover:border-[#d4af37]/40 hover:text-[#e8edf5] transition">Cancel</button>
            </div>
          </form>
        )}

        <div className="bg-[#0a1124] rounded-xl p-4 mb-6 border border-[#1a2233] flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <input type="text" placeholder="Search by party, bill #, quality..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[200px] bg-[#020817] border border-[#1a2233] rounded-lg px-4 py-2.5 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition" />
          <div className="flex items-center gap-1 bg-[#020817] border border-[#1a2233] rounded-lg overflow-hidden">
            <span className="text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] px-3">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs font-bold py-2 pr-2 focus:outline-none bg-[#020817] text-[#e8edf5] cursor-pointer">
              <option value="date">Date</option><option value="bill">Bill #</option><option value="party">Party</option>
              <option value="quality">Quality</option><option value="meter">Meter</option><option value="amount">Amount</option>
            </select>
            <button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")} className="text-sm font-bold px-3 py-2 text-[#d4af37] hover:bg-[#0a1124] transition border-l border-[#1a2233]">{sortDir === "asc" ? "↑" : "↓"}</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {partyChips.map((p) => (
              <button key={p} onClick={() => setPartyFilter(p)} className={`px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition ${partyFilter === p ? "bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] shadow-[0_0_15px_rgba(212,175,55,0.3)]" : "bg-[#020817] border border-[#1a2233] text-[#7a8499] hover:text-[#e8edf5] hover:border-[#d4af37]/40"}`}>{p === "all" ? "All" : p}</button>
            ))}
          </div>
          <button onClick={fetchBills} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] whitespace-nowrap transition uppercase tracking-wider">Refresh</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <Tile label="Bills" value={totals.bills} />
          <Tile label="Total Meter" value={totals.meter.toFixed(2)} />
          <Tile label="Plus (Underweight)" value={totals.plus.toFixed(2)} color="text-rose-300" />
          <Tile label="Minus (Overweight)" value={totals.minus.toFixed(2)} color="text-emerald-300" />
          <Tile label="Total Amount" value={inr(totals.amount)} highlight />
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#7a8499]">Loading purchase records...</div>
        ) : filteredBills.length === 0 ? (
          <div className="bg-[#0a1124] rounded-xl p-12 text-center text-[#7a8499] border border-[#1a2233]">No purchase records match your filter.</div>
        ) : (
          <div className="bg-[#0a1124] rounded-xl border border-[#1a2233] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#020817] border-b border-[#1a2233]">
                  <tr>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Date</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Bill</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Party</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Quality</th>
                    <th className="text-right px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Meter</th>
                    <th className="text-right px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Rate</th>
                    <th className="text-right px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Plus (+)</th>
                    <th className="text-right px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Minus (−)</th>
                    <th className="text-right px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Amount</th>
                    <th className="text-center px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b) => (
                    <tr key={b.id} className="border-t border-[#1a2233] hover:bg-[#020817]/60 transition">
                      <td className="px-3 py-3 text-[#a8b0c0] whitespace-nowrap">{new Date(b.bill_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="px-3 py-3 font-semibold text-white">{b.bill_number}</td>
                      <td className="px-3 py-3 text-[#e8edf5]">{b.party}</td>
                      <td className="px-3 py-3 text-[#a8b0c0]">{b.quality}</td>
                      <td className="px-3 py-3 text-right font-mono text-[#a8b0c0]">{Number(b.meter).toFixed(2)}</td>
                      <td className="px-3 py-3 text-right font-mono text-[#a8b0c0]">{Number(b.meter) > 0 ? (Number(b.amount) / Number(b.meter)).toFixed(2) : "—"}</td>
                      <td className="px-3 py-3 text-right font-mono text-rose-300">{Number(b.plus) > 0 ? Number(b.plus).toFixed(2) : "—"}</td>
                      <td className="px-3 py-3 text-right font-mono text-emerald-300">{Number(b.minus) > 0 ? Number(b.minus).toFixed(2) : "—"}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-[#d4af37]">{inr(b.amount)}</td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <button onClick={() => startEdit(b)} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] mr-3 transition">Edit</button>
                        <button onClick={() => handleDelete(b.id)} className="text-xs font-medium text-rose-400 hover:text-rose-300 transition">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">{label}</label>
      {children}
    </div>
  );
}

function Tile({ label, value, highlight, color }) {
  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };
  if (highlight) {
    return (
      <div className="rounded-xl p-5 bg-gradient-to-br from-[#0d1530] to-[#0a1124] relative overflow-hidden" style={goldGlow}>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(212, 175, 55, 0.4) 0%, transparent 60%)" }} />
        <p className="text-[10px] text-[#d4af37]/70 uppercase tracking-[0.3em] font-medium relative">{label}</p>
        <p className="text-2xl font-bold text-[#d4af37] mt-3 tracking-tight relative">{value}</p>
      </div>
    );
  }
  return (
    <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
      <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-3 tracking-tight ${color || "text-white"}`}>{value}</p>
    </div>
  );
}