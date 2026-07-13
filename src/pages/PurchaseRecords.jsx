import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { fetchAllOptions, saveOptions, deleteOption } from "../lib/autocomplete";
import AdminNav from "../components/AdminNav";
import Autocomplete from "../components/Autocomplete";
import { useFinancialYear, applyFyRange } from "../context/FinancialYearContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const SUPPLIERS = ["Suzuki", "Saileela"];
const FABRIC_QUALITIES = ["Superior Collection", "Gold Club", "Aura Plus", "Innova", "Milky Way", "Classic P 7200", "Victory", "Alpha Dyed", "Poly King", "Good Cut", "Fant", "Rages", "Chindi", "Dress Code"];

const emptyForm = () => ({
  bill_date: new Date().toISOString().split("T")[0],
  bill_number: "", party: "", quality: "", meter: "", plus: "", minus: "", amount: "", notes: "",
});

export default function PurchaseRecords() {
  const navigate = useNavigate();
  const { range, label } = useFinancialYear();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [opts, setOpts] = useState({});

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/admin/login", { replace: true }); return; }
      setUserEmail(data.session.user.email);
      await fetchBills();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, range?.start, range?.end]);

  useEffect(() => { fetchAllOptions().then(setOpts); }, []);

  const persistOptions = async (category, values) => {
    const clean = await saveOptions(category, values);
    if (clean.length) setOpts((p) => ({ ...p, [category]: Array.from(new Set([...(p[category] || []), ...clean])) }));
  };
  const removeOption = async (category, value) => {
    await deleteOption(category, value);
    setOpts((p) => ({ ...p, [category]: (p[category] || []).filter((v) => v !== value) }));
  };

  const fetchBills = async () => {
    setLoading(true);
    const { data, error: dbError } = await applyFyRange(
      supabase.from("purchase_records").select("*").order("bill_date", { ascending: false }),
      "bill_date",
      range
    );
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setBills(data || []);
  };

  const supplierOptions = useMemo(() => {
    const set = new Set([...SUPPLIERS, ...(opts.party || [])]);
    bills.forEach((b) => b.party && set.add(b.party));
    return Array.from(set).sort();
  }, [bills, opts]);

  const qualityOptions = useMemo(() => {
    const set = new Set([...FABRIC_QUALITIES, ...(opts.quality || [])]);
    bills.forEach((b) => b.quality && set.add(b.quality));
    return Array.from(set).sort();
  }, [bills, opts]);

  const notesOptions = useMemo(() => Array.from(new Set([...(opts.notes || []), ...bills.map(b => b.notes).filter(Boolean)])).sort(), [bills, opts]);

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
    persistOptions("party", [form.party]);
    persistOptions("quality", [form.quality]);
    persistOptions("notes", [form.notes]);

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

  const exportFileName = (ext) => `saikripa-purchases-${new Date().toISOString().slice(0, 10)}.${ext}`;

  const exportToExcel = () => {
    if (filteredBills.length === 0) { alert("No purchases to export. Try clearing your filters."); return; }
    const rows = filteredBills.map((b) => ({
      Date: new Date(b.bill_date).toLocaleDateString("en-IN"),
      "Bill #": b.bill_number,
      Party: b.party,
      Quality: b.quality,
      Meter: Number(b.meter).toFixed(2),
      Rate: Number(b.meter) > 0 ? (Number(b.amount) / Number(b.meter)).toFixed(2) : "",
      "Plus (+)": Number(b.plus) > 0 ? Number(b.plus).toFixed(2) : "",
      "Minus (−)": Number(b.minus) > 0 ? Number(b.minus).toFixed(2) : "",
      Amount: Number(b.amount).toFixed(2),
      Notes: b.notes || "",
    }));
    rows.push({});
    rows.push({
      Date: "TOTAL", "Bill #": filteredBills.length + " bills",
      Meter: totals.meter.toFixed(2),
      "Plus (+)": totals.plus.toFixed(2),
      "Minus (−)": totals.minus.toFixed(2),
      Amount: totals.amount.toFixed(2),
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 13 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Records");
    XLSX.writeFile(wb, exportFileName("xlsx"));
  };

  const exportToPDF = () => {
    if (filteredBills.length === 0) { alert("No purchases to export. Try clearing your filters."); return; }
    const doc = new jsPDF("landscape");
    doc.setFontSize(14); doc.setTextColor(40, 40, 40);
    doc.text("SAIKRIPA TEXTILES — Purchase Records", 14, 15);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}  |  ${filteredBills.length} bills`, 14, 21);
    const body = filteredBills.map((b) => [
      new Date(b.bill_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }),
      b.bill_number, b.party, b.quality,
      Number(b.meter).toFixed(2),
      Number(b.meter) > 0 ? (Number(b.amount) / Number(b.meter)).toFixed(2) : "—",
      Number(b.plus) > 0 ? Number(b.plus).toFixed(2) : "—",
      Number(b.minus) > 0 ? Number(b.minus).toFixed(2) : "—",
      "Rs " + Number(b.amount).toFixed(2),
    ]);
    autoTable(doc, {
      startY: 26,
      head: [["Date", "Bill #", "Party", "Quality", "Meter", "Rate", "Plus", "Minus", "Amount"]],
      body,
      foot: [["", "TOTAL", filteredBills.length + " bills", "",
        totals.meter.toFixed(2), "",
        totals.plus.toFixed(2), totals.minus.toFixed(2),
        "Rs " + totals.amount.toFixed(2)]],
      headStyles: { fillColor: [212, 175, 55], textColor: [2, 8, 23], fontStyle: "bold", fontSize: 8 },
      footStyles: { fillColor: [10, 17, 36], textColor: [212, 175, 55], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
    doc.save(exportFileName("pdf"));
  };

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
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-[#7a8499] uppercase tracking-[0.25em] font-medium">Purchase bills — Plus = underweight · Minus = overweight</p>
                <span className="text-[10px] bg-[#d4af37]/15 text-[#d4af37] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#d4af37]/30 whitespace-nowrap">{label}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="bg-[#020817] border border-[#d4af37]/40 text-[#d4af37] px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#d4af37]/10 hover:border-[#d4af37]/60 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0l-4 4m4-4l4 4" />
                </svg>
                Export
                <svg className={`w-3 h-3 transition-transform ${exportOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 mt-1 w-44 bg-[#0a1124] border border-[#1a2233] rounded-lg shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => { setExportOpen(false); exportToExcel(); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#e8edf5] hover:bg-emerald-500/10 hover:text-emerald-300 transition flex items-center gap-2.5 border-b border-[#1a2233]"
                    >
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6 6M15 9l-6 6" />
                      </svg>
                      Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => { setExportOpen(false); exportToPDF(); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#e8edf5] hover:bg-rose-500/10 hover:text-rose-300 transition flex items-center gap-2.5"
                    >
                      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M9 14h6M9 18h4" />
                      </svg>
                      PDF (.pdf)
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition">
              {showForm ? "Close Form" : "+ New Purchase Bill"}
            </button>
          </div>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm mb-4">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#0a1124] rounded-xl p-6 mb-6 border border-[#d4af37]/30" style={goldGlow}>
            <h3 className="font-bold text-white text-lg mb-5">{editingId ? "Edit Purchase Bill" : "New Purchase Bill"}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Date"><input type="date" value={form.bill_date} onChange={(e) => handleChange("bill_date", e.target.value)} className={inputCls + " [color-scheme:dark]"} /></Field>
              <Field label="Bill #"><input type="text" value={form.bill_number} onChange={(e) => handleChange("bill_number", e.target.value)} placeholder="e.g. 2293" className={inputCls} /></Field>
              <Field label="Party (Supplier)"><Autocomplete value={form.party} onChange={(v) => handleChange("party", v)} suggestions={supplierOptions} removable={opts.party || []} onRemove={(v) => removeOption("party", v)} placeholder="Suzuki / Saileela" className={inputCls} /></Field>
              <Field label="Quality"><Autocomplete value={form.quality} onChange={(v) => handleChange("quality", v)} suggestions={qualityOptions} removable={opts.quality || []} onRemove={(v) => removeOption("quality", v)} placeholder="e.g. Superior Collection" className={inputCls} /></Field>
              <Field label="Meter"><input type="number" step="0.01" value={form.meter} onChange={(e) => handleChange("meter", e.target.value)} placeholder="0.00" className={inputCls} /></Field>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.25em] mb-2 text-rose-300">Plus (+) — Underweight</label>
                <input type="number" step="0.01" value={form.plus} onChange={(e) => handleChange("plus", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.25em] mb-2 text-emerald-300">Minus (−) — Overweight</label>
                <input type="number" step="0.01" value={form.minus} onChange={(e) => handleChange("minus", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <Field label="Amount"><input type="number" step="0.01" value={form.amount} onChange={(e) => handleChange("amount", e.target.value)} placeholder="0" className={inputCls} /></Field>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Notes</label>
                <Autocomplete value={form.notes} onChange={(v) => handleChange("notes", v)} suggestions={notesOptions} removable={opts.notes || []} onRemove={(v) => removeOption("notes", v)} placeholder="Optional" className={inputCls} />
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