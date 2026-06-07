import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";
import Autocomplete from "../components/Autocomplete";

const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

// Suppliers seed list — edit to add more
const SUPPLIERS = ["Suzuki", "Saileela"];

// Fabric qualities — same list as Sales Records
const FABRIC_QUALITIES = [
  "Superior Collection",
  "Gold Club",
  "Aura Plus",
  "Innova",
  "Milky Way",
  "Classic P 7200",
  "Victory",
  "Alpha Dyed",
  "Poly King",
  "Good Cut",
  "Fant",
  "Rages",
  "Chindi",
  "Dress Code",
];

const emptyForm = () => ({
  bill_date: new Date().toISOString().split("T")[0],
  bill_number: "",
  party: "",
  quality: "",
  meter: "",
  plus: "",
  minus: "",
  amount: "",
  notes: "",
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
      if (!data.session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setUserEmail(data.session.user.email);
      await fetchBills();
    };
    init();
  }, [navigate]);

  const fetchBills = async () => {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("purchase_records")
      .select("*")
      .order("bill_date", { ascending: false });
    setLoading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setBills(data || []);
  };

  // Autocomplete suggestion lists — seeded + grown from data
  const supplierOptions = useMemo(() => {
    const set = new Set(SUPPLIERS);
    bills.forEach((b) => b.party && set.add(b.party));
    return Array.from(set).sort();
  }, [bills]);

  const notesOptions = useMemo(() => {
    const set = new Set();
    bills.forEach((b) => b.notes && set.add(b.notes));
    return Array.from(set).sort();
  }, [bills]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const startEdit = (b) => {
    setForm({
      bill_date: b.bill_date,
      bill_number: b.bill_number,
      party: b.party,
      quality: b.quality,
      meter: String(b.meter),
      plus: b.plus ? String(b.plus) : "",
      minus: b.minus ? String(b.minus) : "",
      amount: String(b.amount),
      notes: b.notes || "",
    });
    setEditingId(b.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bill_number || !form.party || !form.quality || !form.meter || !form.amount) {
      alert("Please fill in Bill #, Party, Quality, Meter, and Amount.");
      return;
    }

    const payload = {
      bill_date: form.bill_date,
      bill_number: form.bill_number.trim(),
      party: form.party.trim(),
      quality: form.quality.trim(),
      meter: parseFloat(form.meter),
      plus: parseFloat(form.plus) || 0,
      minus: parseFloat(form.minus) || 0,
      amount: parseFloat(form.amount),
      notes: form.notes.trim() || null,
    };

    if (editingId) {
      const { error: dbError } = await supabase
        .from("purchase_records")
        .update(payload)
        .eq("id", editingId);
      if (dbError) {
        alert("Could not update: " + dbError.message);
        return;
      }
    } else {
      const { error: dbError } = await supabase
        .from("purchase_records")
        .insert([payload]);
      if (dbError) {
        alert("Could not save: " + dbError.message);
        return;
      }
    }

    resetForm();
    setShowForm(false);
    fetchBills();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this purchase bill? This cannot be undone.")) return;
    const { error: dbError } = await supabase.from("purchase_records").delete().eq("id", id);
    if (dbError) {
      alert("Could not delete: " + dbError.message);
      return;
    }
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const filteredBills = bills
    .filter((b) => {
      if (partyFilter !== "all" && b.party !== partyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (b.party || "").toLowerCase().includes(q) ||
          (b.bill_number || "").toLowerCase().includes(q) ||
          (b.quality || "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case "date":
          valA = new Date(a.bill_date).getTime();
          valB = new Date(b.bill_date).getTime();
          break;
        case "bill":
          valA = parseInt(a.bill_number, 10) || 0;
          valB = parseInt(b.bill_number, 10) || 0;
          break;
        case "party":
          valA = (a.party || "").toLowerCase();
          valB = (b.party || "").toLowerCase();
          break;
        case "quality":
          valA = (a.quality || "").toLowerCase();
          valB = (b.quality || "").toLowerCase();
          break;
        case "amount":
          valA = Number(a.amount || 0);
          valB = Number(b.amount || 0);
          break;
        case "meter":
          valA = Number(a.meter || 0);
          valB = Number(b.meter || 0);
          break;
        default:
          return 0;
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

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37]";

  // Available party filter options (Suppliers + "all")
  const partyChips = ["all", ...supplierOptions];

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <header className="bg-[#081225] text-white py-5 shadow-lg relative">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-lg font-black tracking-wider text-[#d4af37] uppercase">
            Saikripa Textiles
          </h1>
          <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase mt-0.5">
            Purchase Records
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#081225]">Purchase Records</h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
              Purchase bills from suppliers — Plus = underweight · Minus = overweight
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-[#d4af37] text-[#081225] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#c49f2d] transition shadow"
          >
            {showForm ? "Close Form" : "+ New Purchase Bill"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm mb-4">{error}</div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 mb-6 border border-[#d4af37]/30 shadow-lg">
            <h3 className="font-black text-[#081225] mb-4">
              {editingId ? "Edit Purchase Bill" : "New Purchase Bill"}
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date *</label>
                <input type="date" value={form.bill_date} onChange={(e) => handleChange("bill_date", e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Bill # *</label>
                <input type="text" value={form.bill_number} onChange={(e) => handleChange("bill_number", e.target.value)} placeholder="e.g. 2293" required className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Party (Supplier) *</label>
                <Autocomplete value={form.party} onChange={(v) => handleChange("party", v)} suggestions={supplierOptions} placeholder="Suzuki / Saileela" required className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Quality *</label>
                <Autocomplete value={form.quality} onChange={(v) => handleChange("quality", v)} suggestions={FABRIC_QUALITIES} placeholder="e.g. Superior Collection" required className={inputCls} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Meter *</label>
                <input type="number" step="0.01" value={form.meter} onChange={(e) => handleChange("meter", e.target.value)} placeholder="0.00" required className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Plus (+) — underweight</label>
                <input type="number" step="0.01" value={form.plus} onChange={(e) => handleChange("plus", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Minus (−) — overweight</label>
                <input type="number" step="0.01" value={form.minus} onChange={(e) => handleChange("minus", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Amount *</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => handleChange("amount", e.target.value)} placeholder="0" required className={inputCls} />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Notes</label>
                <Autocomplete value={form.notes} onChange={(v) => handleChange("notes", v)} suggestions={notesOptions} placeholder="Optional" className={inputCls} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className="bg-[#081225] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f1f63] transition">
                {editingId ? "Update Bill" : "Save Bill"}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <input type="text" placeholder="Search by party, bill #, quality..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]" />
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs font-bold py-2 pr-2 focus:outline-none bg-white text-[#081225]">
              <option value="date">Date</option>
              <option value="bill">Bill #</option>
              <option value="party">Party</option>
              <option value="quality">Quality</option>
              <option value="meter">Meter</option>
              <option value="amount">Amount</option>
            </select>
            <button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")} className="text-sm font-bold px-3 py-2 text-[#081225] hover:bg-gray-100 transition border-l border-gray-200">
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {partyChips.map((p) => (
              <button key={p} onClick={() => setPartyFilter(p)} className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition ${partyFilter === p ? "bg-[#081225] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
          <button onClick={fetchBills} className="text-xs font-bold text-[#c6a55c] hover:underline whitespace-nowrap">Refresh</button>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <SummaryTile label="Bills" value={totals.bills} />
          <SummaryTile label="Total Meter" value={totals.meter.toFixed(2)} />
          <SummaryTile label="Plus (Underweight)" value={totals.plus.toFixed(2)} colorClass="text-red-600" />
          <SummaryTile label="Minus (Overweight)" value={totals.minus.toFixed(2)} colorClass="text-green-600" />
          <SummaryTile label="Total Amount" value={inr(totals.amount)} highlight />
        </div>

        {/* Bills table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading purchase records...</div>
        ) : filteredBills.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
            No purchase records match your filter. Click "+ New Purchase Bill" to add one.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#081225] text-white">
                  <tr>
                    <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider">Bill</th>
                    <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider">Party</th>
                    <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider">Quality</th>
                    <th className="text-right px-3 py-3 font-bold text-xs uppercase tracking-wider">Meter</th>
                    <th className="text-right px-3 py-3 font-bold text-xs uppercase tracking-wider">Plus (+)</th>
                    <th className="text-right px-3 py-3 font-bold text-xs uppercase tracking-wider">Minus (−)</th>
                    <th className="text-right px-3 py-3 font-bold text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b, i) => (
                    <tr key={b.id} className={`border-t border-gray-100 hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(b.bill_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-3 py-3 font-bold text-[#081225]">{b.bill_number}</td>
                      <td className="px-3 py-3 text-[#081225]">{b.party}</td>
                      <td className="px-3 py-3 text-gray-700">{b.quality}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-700">{Number(b.meter).toFixed(2)}</td>
                      <td className="px-3 py-3 text-right font-mono text-red-500">
                        {Number(b.plus) > 0 ? Number(b.plus).toFixed(2) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-green-600">
                        {Number(b.minus) > 0 ? Number(b.minus).toFixed(2) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-[#081225]">{inr(b.amount)}</td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <button onClick={() => startEdit(b)} className="text-xs font-bold text-[#c6a55c] hover:underline mr-3">Edit</button>
                        <button onClick={() => handleDelete(b.id)} className="text-xs font-bold text-red-500 hover:underline">Delete</button>
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

function SummaryTile({ label, value, highlight, colorClass }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? "border-[#d4af37]/30 bg-[#fff8e1]/30" : "border-gray-100 bg-white"}`}>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{label}</p>
      <p className={`text-xl font-black mt-1 ${highlight ? "text-[#7a6015]" : colorClass || "text-[#081225]"}`}>
        {value}
      </p>
    </div>
  );
}
