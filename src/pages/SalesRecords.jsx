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

const FABRIC_QUALITIES = [
  "Superior Collection", "Gold Club", "Aura Plus", "Innova", "Milky Way",
  "Classic P 7200", "Victory", "Alpha Dyed", "Poly King", "Good Cut",
  "Fant", "Rages", "Chindi",
];

const emptyItem = () => ({ quality: "", meter: "", rate: "", amount: "", _touched: false });

export default function SalesRecords() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [expandedBill, setExpandedBill] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    bill_date: new Date().toISOString().split("T")[0],
    bill_number: "", party: "", sale_type: "Direct", agency_name: "", notes: "",
  });
  const [items, setItems] = useState([emptyItem()]);

  const [salesSearch, setSalesSearch] = useState("");
  const [saleTypeFilter, setSaleTypeFilter] = useState("all");
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
    const { data, error: dbError } = await supabase
      .from("sales_records").select("*, bill_items(*)")
      .order("bill_date", { ascending: false });
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setBills(data || []);
  };

  const partyOptions = useMemo(() => {
    const set = new Set();
    bills.forEach((b) => b.party && set.add(b.party));
    return Array.from(set).sort();
  }, [bills]);

  const agencyOptions = useMemo(() => {
    const set = new Set();
    bills.forEach((b) => b.agency_name && set.add(b.agency_name));
    return Array.from(set).sort();
  }, [bills]);

  const notesOptions = useMemo(() => {
    const set = new Set();
    bills.forEach((b) => b.notes && set.add(b.notes));
    return Array.from(set).sort();
  }, [bills]);

  const resetForm = () => {
    setForm({ bill_date: new Date().toISOString().split("T")[0], bill_number: "", party: "", sale_type: "Direct", agency_name: "", notes: "" });
    setItems([emptyItem()]);
    setEditingId(null);
  };

  const handleFormChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "amount") item._touched = true;
      if ((field === "meter" || field === "rate") && !item._touched) {
        const m = parseFloat(field === "meter" ? value : item.meter);
        const r = parseFloat(field === "rate" ? value : item.rate);
        if (!isNaN(m) && !isNaN(r) && m > 0 && r > 0) item.amount = (m * r).toFixed(2);
        else item.amount = "";
      }
      next[index] = item;
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);

  const startEdit = (bill) => {
    setForm({
      bill_date: bill.bill_date, bill_number: bill.bill_number, party: bill.party,
      sale_type: bill.sale_type, agency_name: bill.agency_name || "", notes: bill.notes || "",
    });
    setItems((bill.bill_items || []).map((it) => ({
      id: it.id, quality: it.quality, meter: String(it.meter),
      rate: String(it.rate), amount: String(it.amount), _touched: true,
    })));
    if ((bill.bill_items || []).length === 0) setItems([emptyItem()]);
    setEditingId(bill.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bill_number || !form.party) { alert("Please fill in Bill # and Party."); return; }
    const validItems = items.filter((it) => it.quality && it.meter && it.rate);
    if (validItems.length === 0) { alert("Please add at least one fabric line."); return; }

    const billPayload = {
      bill_date: form.bill_date, bill_number: form.bill_number.trim(),
      party: form.party.trim(), sale_type: form.sale_type,
      agency_name: form.sale_type === "Agency" ? form.agency_name.trim() || null : null,
      notes: form.notes.trim() || null,
    };

    let billId;
    if (editingId) {
      const { error: dbError } = await supabase.from("sales_records").update(billPayload).eq("id", editingId);
      if (dbError) { alert("Could not update: " + dbError.message); return; }
      billId = editingId;
      await supabase.from("bill_items").delete().eq("sales_record_id", billId);
    } else {
      const { data, error: dbError } = await supabase.from("sales_records").insert([billPayload]).select().single();
      if (dbError) { alert("Could not save: " + dbError.message); return; }
      billId = data.id;
    }

    const itemsPayload = validItems.map((it) => ({
      sales_record_id: billId, quality: it.quality.trim(),
      meter: parseFloat(it.meter), rate: parseFloat(it.rate),
      amount: parseFloat(it.amount) || parseFloat(it.meter) * parseFloat(it.rate),
    }));
    const { error: itemsError } = await supabase.from("bill_items").insert(itemsPayload);
    if (itemsError) { alert("Bill saved but items failed: " + itemsError.message); return; }

    resetForm();
    setShowForm(false);
    fetchBills();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this bill and all its line items?")) return;
    const { error: dbError } = await supabase.from("sales_records").delete().eq("id", id);
    if (dbError) { alert("Could not delete: " + dbError.message); return; }
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const filteredBills = bills
    .filter((b) => {
      if (saleTypeFilter !== "all" && b.sale_type !== saleTypeFilter) return false;
      if (salesSearch) {
        const q = salesSearch.toLowerCase();
        const inHeader = ((b.party || "").toLowerCase().includes(q) || (b.bill_number || "").toLowerCase().includes(q) || (b.agency_name || "").toLowerCase().includes(q));
        const inItems = (b.bill_items || []).some((it) => (it.quality || "").toLowerCase().includes(q));
        return inHeader || inItems;
      }
      return true;
    })
    .sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case "date": valA = new Date(a.bill_date).getTime(); valB = new Date(b.bill_date).getTime(); break;
        case "bill": valA = parseInt(a.bill_number, 10) || 0; valB = parseInt(b.bill_number, 10) || 0; break;
        case "party": valA = (a.party || "").toLowerCase(); valB = (b.party || "").toLowerCase(); break;
        case "agency": valA = (a.agency_name || "zzz").toLowerCase(); valB = (b.agency_name || "zzz").toLowerCase(); break;
        case "amount": valA = (a.bill_items || []).reduce((s, it) => s + Number(it.amount || 0), 0); valB = (b.bill_items || []).reduce((s, it) => s + Number(it.amount || 0), 0); break;
        case "meters": valA = (a.bill_items || []).reduce((s, it) => s + Number(it.meter || 0), 0); valB = (b.bill_items || []).reduce((s, it) => s + Number(it.meter || 0), 0); break;
        default: return 0;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const billTotal = (b) => (b.bill_items || []).reduce((sum, it) => sum + Number(it.amount || 0), 0);
  const billMeters = (b) => (b.bill_items || []).reduce((sum, it) => sum + Number(it.meter || 0), 0);
  const grandTotal = filteredBills.reduce((sum, b) => sum + billTotal(b), 0);
  const grandMeters = filteredBills.reduce((sum, b) => sum + billMeters(b), 0);
  const formTotal = items.reduce((sum, it) => { const a = parseFloat(it.amount); return sum + (isNaN(a) ? 0 : a); }, 0);

  const inputCls = "w-full bg-[#020817] border border-[#1a2233] rounded-lg px-3 py-2 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition";
  const innerInputCls = "w-full bg-[#020817] border border-[#1a2233] rounded-lg px-3 py-2 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition";
  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };

  return (
    <div className="min-h-screen bg-[#020817] text-[#e8edf5] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-50" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 70%)" }} />

      <header className="relative border-b border-[#1a2233]/80 backdrop-blur-xl bg-[#020817]/80 sticky top-0 z-40">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-lg font-bold tracking-[0.2em] uppercase" style={{ background: "linear-gradient(135deg, #f4d77a 0%, #d4af3750%, #a8842c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Saikripa Textiles
          </h1>
          <p className="text-[10px] text-[#7a8499] tracking-[0.35em] uppercase mt-1 font-medium">Sales Records</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-white">Sales Records</h2>
            <p className="text-xs text-[#7a8499] mt-2 uppercase tracking-[0.25em] font-medium">Bill log — multiple qualities per bill supported</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition"
          >
            {showForm ? "Close Form" : "+ New Sale Record"}
          </button>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm mb-4">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#0a1124] rounded-xl p-6 mb-6 border border-[#d4af37]/30" style={goldGlow}>
            <h3 className="font-bold text-white text-lg mb-5">{editingId ? "Edit Sales Record" : "New Sales Record"}</h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Date *</label>
                <input type="date" value={form.bill_date} onChange={(e) => handleFormChange("bill_date", e.target.value)} required className={inputCls + " [color-scheme:dark]"} />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Bill # *</label>
                <input type="text" value={form.bill_number} onChange={(e) => handleFormChange("bill_number", e.target.value)} placeholder="e.g. 1024" required className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Party *</label>
                <Autocomplete value={form.party} onChange={(v) => handleFormChange("party", v)} suggestions={partyOptions} placeholder="Buyer name / firm" required className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Sale Type *</label>
                <select value={form.sale_type} onChange={(e) => handleFormChange("sale_type", e.target.value)} className={inputCls + " cursor-pointer"}>
                  <option value="Direct">Direct</option>
                  <option value="Agency">Agency</option>
                </select>
              </div>
              {form.sale_type === "Agency" && (
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Agency Name</label>
                  <Autocomplete value={form.agency_name} onChange={(v) => handleFormChange("agency_name", v)} suggestions={agencyOptions} placeholder="Agent / agency" className={inputCls} />
                </div>
              )}
              <div className={form.sale_type === "Agency" ? "sm:col-span-4" : "sm:col-span-3"}>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Notes</label>
                <Autocomplete value={form.notes} onChange={(v) => handleFormChange("notes", v)} suggestions={notesOptions} placeholder="Optional — payment terms, delivery, etc." className={inputCls} />
              </div>
            </div>

            <div className="border-t border-[#1a2233] pt-5 mb-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">Fabrics on this bill</h4>
                <button type="button" onClick={addItem} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] transition uppercase tracking-wider">+ Add another fabric</button>
              </div>
              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="bg-[#020817] border border-[#1a2233] rounded-lg p-4 grid sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Quality *</label>
                      <Autocomplete value={it.quality} onChange={(v) => handleItemChange(idx, "quality", v)} suggestions={FABRIC_QUALITIES} placeholder="e.g. Superior Collection" className={innerInputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Meter *</label>
                      <input type="number" step="0.01" value={it.meter} onChange={(e) => handleItemChange(idx, "meter", e.target.value)} placeholder="0.00" className={innerInputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Rate *</label>
                      <input type="number" step="0.01" value={it.rate} onChange={(e) => handleItemChange(idx, "rate", e.target.value)} placeholder="0.00" className={innerInputCls} />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">
                        Amount {!it._touched && it.meter && it.rate && <span className="text-[#d4af37]/60 normal-case tracking-normal">(auto)</span>}
                      </label>
                      <input type="number" step="0.01" value={it.amount} onChange={(e) => handleItemChange(idx, "amount", e.target.value)} placeholder="0.00" className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition ${it._touched ? "bg-[#d4af37]/10 border border-[#d4af37]/60 text-[#f4d77a] focus:border-[#d4af37]" : "bg-[#020817] border border-[#1a2233] text-[#e8edf5] focus:border-[#d4af37]/60"}`} />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-rose-400 hover:text-rose-300 text-xl font-bold w-8 h-8 flex items-center justify-center" aria-label="Remove">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0d1530] to-[#0a1124] rounded-lg px-5 py-3 flex items-center justify-between mb-5 border border-[#d4af37]/30" style={goldGlow}>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">Bill Total</span>
              <span className="text-2xl font-bold text-[#d4af37] tracking-tight">{inr(formTotal)}</span>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition">
                {editingId ? "Update Bill" : "Save Bill"}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="bg-[#020817] border border-[#1a2233] text-[#a8b0c0] px-6 py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider hover:border-[#d4af37]/40 hover:text-[#e8edf5] transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Filter bar */}
        <div className="bg-[#0a1124] rounded-xl p-4 mb-6 border border-[#1a2233] flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <input type="text" placeholder="Search by party, bill #, quality, agency..." value={salesSearch} onChange={(e) => setSalesSearch(e.target.value)} className="flex-1 min-w-[200px] bg-[#020817] border border-[#1a2233] rounded-lg px-4 py-2.5 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition" />
          <div className="flex items-center gap-1 bg-[#020817] border border-[#1a2233] rounded-lg overflow-hidden">
            <span className="text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] px-3">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs font-bold py-2 pr-2 focus:outline-none bg-[#020817] text-[#e8edf5] cursor-pointer">
              <option value="date">Date</option>
              <option value="bill">Bill #</option>
              <option value="party">Party</option>
              <option value="agency">Agency</option>
              <option value="amount">Amount</option>
              <option value="meters">Meters</option>
            </select>
            <button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")} className="text-sm font-bold px-3 py-2 text-[#d4af37] hover:bg-[#0a1124] transition border-l border-[#1a2233]" title={sortDir === "asc" ? "Ascending" : "Descending"}>
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <div className="flex gap-2">
            {["all", "Direct", "Agency"].map((t) => (
              <button key={t} onClick={() => setSaleTypeFilter(t)} className={`px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition ${saleTypeFilter === t ? "bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] shadow-[0_0_15px_rgba(212,175,55,0.3)]" : "bg-[#020817] border border-[#1a2233] text-[#7a8499] hover:text-[#e8edf5] hover:border-[#d4af37]/40"}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={fetchBills} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] whitespace-nowrap transition uppercase tracking-wider">Refresh</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
            <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Bills</p>
            <p className="text-3xl font-bold text-white mt-3 tracking-tight">{filteredBills.length}</p>
          </div>
          <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
            <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Total Meters</p>
            <p className="text-3xl font-bold text-white mt-3 tracking-tight">{grandMeters.toFixed(2)}</p>
          </div>
          <div className="rounded-xl p-5 bg-gradient-to-br from-[#0d1530] to-[#0a1124] relative overflow-hidden" style={goldGlow}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(212, 175, 55, 0.4) 0%, transparent 60%)" }} />
            <p className="text-[10px] text-[#d4af37]/70 uppercase tracking-[0.3em] font-medium relative">Total Amount</p>
            <p className="text-3xl font-bold text-[#d4af37] mt-3 tracking-tight relative">{inr(grandTotal)}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#7a8499]">Loading sales records...</div>
        ) : filteredBills.length === 0 ? (
          <div className="bg-[#0a1124] rounded-xl p-12 text-center text-[#7a8499] border border-[#1a2233]">No sales records yet.</div>
        ) : (
          <div className="bg-[#0a1124] rounded-xl border border-[#1a2233] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#020817] border-b border-[#1a2233]">
                  <tr>
                    <th className="w-8"></th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Date</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Bill</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Party</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Agency / Direct</th>
                    <th className="text-center px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Fabrics</th>
                    <th className="text-right px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Meters</th>
                    <th className="text-right px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Amount</th>
                    <th className="text-center px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b, i) => {
                    const isOpen = expandedBill === b.id;
                    const itemCount = (b.bill_items || []).length;
                    return (
                      <React.Fragment key={b.id}>
                        <tr className={`border-t border-[#1a2233] hover:bg-[#020817]/60 transition cursor-pointer ${isOpen ? "bg-[#020817]/40" : ""}`} onClick={() => setExpandedBill(isOpen ? null : b.id)}>
                          <td className="px-3 py-3 text-center">
                            <svg className={`inline-block w-3 h-3 text-[#d4af37] transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </td>
                          <td className="px-3 py-3 text-[#a8b0c0] whitespace-nowrap">
                            {new Date(b.bill_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-3 py-3 font-semibold text-white">{b.bill_number}</td>
                          <td className="px-3 py-3 text-[#e8edf5]">{b.party}</td>
                          <td className="px-3 py-3">
                            {b.sale_type === "Agency" ? (
                              <div>
                                <span className="text-[10px] bg-[#d4af37]/15 text-[#d4af37] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider border border-[#d4af37]/30">Agency</span>
                                {b.agency_name && (<p className="text-xs text-[#7a8499] mt-1">{b.agency_name}</p>)}
                              </div>
                            ) : (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider border border-emerald-500/30">Direct</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center text-[#a8b0c0]">
                            {itemCount === 0 ? "—" : `${itemCount} ${itemCount === 1 ? "fabric" : "fabrics"}`}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-[#a8b0c0]">{billMeters(b).toFixed(2)}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-[#d4af37]">{inr(billTotal(b))}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => startEdit(b)} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] mr-3 transition">Edit</button>
                            <button onClick={() => handleDelete(b.id)} className="text-xs font-medium text-rose-400 hover:text-rose-300 transition">Delete</button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-[#020817]/60 border-t border-[#1a2233]">
                            <td colSpan={9} className="px-6 py-4">
                              {itemCount === 0 ? (
                                <p className="text-xs text-[#7a8499] italic">No fabric line items recorded.</p>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[#7a8499] uppercase tracking-[0.25em]">
                                      <th className="text-left font-medium py-2">Quality</th>
                                      <th className="text-right font-medium py-2">Meter</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {b.bill_items.map((it) => (
                                      <tr key={it.id} className="border-t border-[#1a2233]/60">
                                        <td className="py-2 text-[#e8edf5] font-semibold">{it.quality}</td>
                                        <td className="py-2 text-right font-mono text-[#a8b0c0]">{Number(it.meter).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                    <tr className="border-t-2 border-[#d4af37]/40">
                                      <td className="py-2 text-[#d4af37] font-bold uppercase tracking-[0.2em] text-[11px]">Total Amount</td>
                                      <td className="py-2 text-right font-mono font-bold text-[#d4af37]">{inr(billTotal(b))}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              )}
                              {b.notes && (
                                <div className="mt-3 text-xs text-[#a8b0c0] italic">
                                  <span className="font-bold not-italic text-[#7a8499] uppercase tracking-wider">Notes: </span>{b.notes}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}