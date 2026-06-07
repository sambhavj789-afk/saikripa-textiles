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
    bill_number: "",
    party: "",
    sale_type: "Direct",
    agency_name: "",
    notes: "",
  });
  const [items, setItems] = useState([emptyItem()]);

  const [salesSearch, setSalesSearch] = useState("");
  const [saleTypeFilter, setSaleTypeFilter] = useState("all");
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
      .from("sales_records")
      .select("*, bill_items(*)")
      .order("bill_date", { ascending: false });
    setLoading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
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
    setForm({
      bill_date: new Date().toISOString().split("T")[0],
      bill_number: "",
      party: "",
      sale_type: "Direct",
      agency_name: "",
      notes: "",
    });
    setItems([emptyItem()]);
    setEditingId(null);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === "amount") {
        item._touched = true;
      }

      if ((field === "meter" || field === "rate") && !item._touched) {
        const m = parseFloat(field === "meter" ? value : item.meter);
        const r = parseFloat(field === "rate" ? value : item.rate);
        if (!isNaN(m) && !isNaN(r) && m > 0 && r > 0) {
          item.amount = (m * r).toFixed(2);
        } else {
          item.amount = "";
        }
      }

      next[index] = item;
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => {
    setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const startEdit = (bill) => {
    setForm({
      bill_date: bill.bill_date,
      bill_number: bill.bill_number,
      party: bill.party,
      sale_type: bill.sale_type,
      agency_name: bill.agency_name || "",
      notes: bill.notes || "",
    });
    setItems(
      (bill.bill_items || []).map((it) => ({
        id: it.id,
        quality: it.quality,
        meter: String(it.meter),
        rate: String(it.rate),
        amount: String(it.amount),
        _touched: true,
      }))
    );
    if ((bill.bill_items || []).length === 0) setItems([emptyItem()]);
    setEditingId(bill.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bill_number || !form.party) {
      alert("Please fill in Bill # and Party.");
      return;
    }
    const validItems = items.filter((it) => it.quality && it.meter && it.rate);
    if (validItems.length === 0) {
      alert("Please add at least one fabric line with Quality, Meter, and Rate.");
      return;
    }

    const billPayload = {
      bill_date: form.bill_date,
      bill_number: form.bill_number.trim(),
      party: form.party.trim(),
      sale_type: form.sale_type,
      agency_name: form.sale_type === "Agency" ? form.agency_name.trim() || null : null,
      notes: form.notes.trim() || null,
    };

    let billId;
    if (editingId) {
      const { error: dbError } = await supabase
        .from("sales_records")
        .update(billPayload)
        .eq("id", editingId);
      if (dbError) {
        alert("Could not update bill: " + dbError.message);
        return;
      }
      billId = editingId;
      await supabase.from("bill_items").delete().eq("sales_record_id", billId);
    } else {
      const { data, error: dbError } = await supabase
        .from("sales_records")
        .insert([billPayload])
        .select()
        .single();
      if (dbError) {
        alert("Could not save bill: " + dbError.message);
        return;
      }
      billId = data.id;
    }

    const itemsPayload = validItems.map((it) => ({
      sales_record_id: billId,
      quality: it.quality.trim(),
      meter: parseFloat(it.meter),
      rate: parseFloat(it.rate),
      amount: parseFloat(it.amount) || parseFloat(it.meter) * parseFloat(it.rate),
    }));

    const { error: itemsError } = await supabase.from("bill_items").insert(itemsPayload);
    if (itemsError) {
      alert("Bill saved but items failed: " + itemsError.message);
      return;
    }

    resetForm();
    setShowForm(false);
    fetchBills();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this bill and all its line items? This cannot be undone.")) return;
    const { error: dbError } = await supabase.from("sales_records").delete().eq("id", id);
    if (dbError) {
      alert("Could not delete: " + dbError.message);
      return;
    }
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const filteredBills = bills
    .filter((b) => {
      if (saleTypeFilter !== "all" && b.sale_type !== saleTypeFilter) return false;
      if (salesSearch) {
        const q = salesSearch.toLowerCase();
        const inHeader = (
          (b.party || "").toLowerCase().includes(q) ||
          (b.bill_number || "").toLowerCase().includes(q) ||
          (b.agency_name || "").toLowerCase().includes(q)
        );
        const inItems = (b.bill_items || []).some((it) =>
          (it.quality || "").toLowerCase().includes(q)
        );
        return inHeader || inItems;
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
        case "agency":
          valA = (a.agency_name || "zzz").toLowerCase();
          valB = (b.agency_name || "zzz").toLowerCase();
          break;
        case "amount":
          valA = (a.bill_items || []).reduce((s, it) => s + Number(it.amount || 0), 0);
          valB = (b.bill_items || []).reduce((s, it) => s + Number(it.amount || 0), 0);
          break;
        case "meters":
          valA = (a.bill_items || []).reduce((s, it) => s + Number(it.meter || 0), 0);
          valB = (b.bill_items || []).reduce((s, it) => s + Number(it.meter || 0), 0);
          break;
        default:
          return 0;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const billTotal = (b) => (b.bill_items || []).reduce((sum, it) => sum + Number(it.amount || 0), 0);
  const billMeters = (b) => (b.bill_items || []).reduce((sum, it) => sum + Number(it.meter || 0), 0);
  const grandTotal = filteredBills.reduce((sum, b) => sum + billTotal(b), 0);
  const grandMeters = filteredBills.reduce((sum, b) => sum + billMeters(b), 0);
  const formTotal = items.reduce((sum, it) => {
    const a = parseFloat(it.amount);
    return sum + (isNaN(a) ? 0 : a);
  }, 0);

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37]";
  const innerInputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] bg-white";

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <header className="bg-[#081225] text-white py-5 shadow-lg relative">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-lg font-black tracking-wider text-[#d4af37] uppercase">
            Saikripa Textiles
          </h1>
          <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase mt-0.5">
            Sales Records
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#081225]">Sales Records</h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
              Bill log — multiple qualities per bill supported
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-[#d4af37] text-[#081225] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#c49f2d] transition shadow"
          >
            {showForm ? "Close Form" : "+ New Sale Record"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm mb-4">{error}</div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 mb-6 border border-[#d4af37]/30 shadow-lg">
            <h3 className="font-black text-[#081225] mb-4">
              {editingId ? "Edit Sales Record" : "New Sales Record"}
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date *</label>
                <input type="date" value={form.bill_date} onChange={(e) => handleFormChange("bill_date", e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Bill # *</label>
                <input type="text" value={form.bill_number} onChange={(e) => handleFormChange("bill_number", e.target.value)} placeholder="e.g. 1024" required className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Party *</label>
                <Autocomplete value={form.party} onChange={(v) => handleFormChange("party", v)} suggestions={partyOptions} placeholder="Buyer name / firm" required className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Sale Type *</label>
                <select value={form.sale_type} onChange={(e) => handleFormChange("sale_type", e.target.value)} className={inputCls + " bg-white"}>
                  <option value="Direct">Direct</option>
                  <option value="Agency">Agency</option>
                </select>
              </div>
              {form.sale_type === "Agency" && (
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Agency Name</label>
                  <Autocomplete value={form.agency_name} onChange={(v) => handleFormChange("agency_name", v)} suggestions={agencyOptions} placeholder="Agent / agency" className={inputCls} />
                </div>
              )}
              <div className={form.sale_type === "Agency" ? "sm:col-span-4" : "sm:col-span-3"}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Notes</label>
                <Autocomplete value={form.notes} onChange={(v) => handleFormChange("notes", v)} suggestions={notesOptions} placeholder="Optional — payment terms, delivery, etc." className={inputCls} />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 mb-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-black text-[#081225] uppercase tracking-wide">Fabrics on this bill</h4>
                <button type="button" onClick={addItem} className="text-xs font-bold text-[#c6a55c] hover:text-[#7a6015] hover:underline">+ Add another fabric</button>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 grid sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Quality *</label>
                      <Autocomplete value={it.quality} onChange={(v) => handleItemChange(idx, "quality", v)} suggestions={FABRIC_QUALITIES} placeholder="e.g. Superior Collection" className={innerInputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Meter *</label>
                      <input type="number" step="0.01" value={it.meter} onChange={(e) => handleItemChange(idx, "meter", e.target.value)} placeholder="0.00" className={innerInputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Rate *</label>
                      <input type="number" step="0.01" value={it.rate} onChange={(e) => handleItemChange(idx, "rate", e.target.value)} placeholder="0.00" className={innerInputCls} />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                        Amount {!it._touched && it.meter && it.rate && <span className="font-normal normal-case text-gray-400 tracking-normal">(auto)</span>}
                      </label>
                      <input type="number" step="0.01" value={it.amount} onChange={(e) => handleItemChange(idx, "amount", e.target.value)} placeholder="0.00" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] ${it._touched ? "border-[#d4af37] bg-[#fff8e1]" : "border-gray-200 bg-white"}`} />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 text-xl font-bold w-8 h-8 flex items-center justify-center" aria-label="Remove fabric">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#081225] text-white rounded-xl px-5 py-3 flex items-center justify-between mb-5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Bill Total</span>
              <span className="text-xl font-black">{inr(formTotal)}</span>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-[#081225] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f1f63] transition">
                {editingId ? "Update Bill" : "Save Bill"}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <input type="text" placeholder="Search by party, bill #, quality, agency..." value={salesSearch} onChange={(e) => setSalesSearch(e.target.value)} className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]" />
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs font-bold py-2 pr-2 focus:outline-none bg-white text-[#081225]">
              <option value="date">Date</option>
              <option value="bill">Bill #</option>
              <option value="party">Party</option>
              <option value="agency">Agency</option>
              <option value="amount">Amount</option>
              <option value="meters">Meters</option>
            </select>
            <button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")} className="text-sm font-bold px-3 py-2 text-[#081225] hover:bg-gray-100 transition border-l border-gray-200" title={sortDir === "asc" ? "Ascending" : "Descending"}>
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <div className="flex gap-2">
            {["all", "Direct", "Agency"].map((t) => (
              <button key={t} onClick={() => setSaleTypeFilter(t)} className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition ${saleTypeFilter === t ? "bg-[#081225] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={fetchBills} className="text-xs font-bold text-[#c6a55c] hover:underline whitespace-nowrap">Refresh</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Bills</p>
            <p className="text-2xl font-black text-[#081225] mt-1">{filteredBills.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Meters</p>
            <p className="text-2xl font-black text-[#081225] mt-1">{grandMeters.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#d4af37]/30 bg-[#fff8e1]/30">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Amount</p>
            <p className="text-2xl font-black text-[#7a6015] mt-1">{inr(grandTotal)}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading sales records...</div>
        ) : filteredBills.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
            No sales records yet. Click "+ New Sale Record" to add the first one.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#081225] text-white">
                  <tr>
                    <th className="w-8"></th>
                    <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider">Bill</th>
                    <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider">Party</th>
                    <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider">Agency / Direct</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider">Fabrics</th>
                    <th className="text-right px-3 py-3 font-bold text-xs uppercase tracking-wider">Meters</th>
                    <th className="text-right px-3 py-3 font-bold text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b, i) => {
                    const isOpen = expandedBill === b.id;
                    const itemCount = (b.bill_items || []).length;
                    return (
                      <React.Fragment key={b.id}>
                        <tr className={`border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer ${i % 2 === 1 ? "bg-gray-50/40" : ""}`} onClick={() => setExpandedBill(isOpen ? null : b.id)}>
                          <td className="px-3 py-3 text-center">
                            <svg className={`inline-block w-3 h-3 text-[#081225] transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </td>
                          <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                            {new Date(b.bill_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-3 py-3 font-bold text-[#081225]">{b.bill_number}</td>
                          <td className="px-3 py-3 text-[#081225]">{b.party}</td>
                          <td className="px-3 py-3">
                            {b.sale_type === "Agency" ? (
                              <div>
                                <span className="text-[10px] bg-[#d4af37]/15 text-[#7a6015] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Agency</span>
                                {b.agency_name && (<p className="text-xs text-gray-500 mt-1">{b.agency_name}</p>)}
                              </div>
                            ) : (
                              <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Direct</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600">
                            {itemCount === 0 ? "—" : `${itemCount} ${itemCount === 1 ? "fabric" : "fabrics"}`}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-gray-700">{billMeters(b).toFixed(2)}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-[#081225]">{inr(billTotal(b))}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => startEdit(b)} className="text-xs font-bold text-[#c6a55c] hover:underline mr-3">Edit</button>
                            <button onClick={() => handleDelete(b.id)} className="text-xs font-bold text-red-500 hover:underline">Delete</button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-[#fff8e1]/30 border-t border-gray-100">
                            <td colSpan={9} className="px-6 py-4">
                              {itemCount === 0 ? (
                                <p className="text-xs text-gray-400 italic">No fabric line items recorded for this bill.</p>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-gray-400 uppercase tracking-widest">
                                      <th className="text-left font-bold py-2">Quality</th>
                                      <th className="text-right font-bold py-2">Meter</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {b.bill_items.map((it) => (
                                      <tr key={it.id} className="border-t border-gray-200/60">
                                        <td className="py-2 text-[#081225] font-semibold">{it.quality}</td>
                                        <td className="py-2 text-right font-mono text-gray-700">{Number(it.meter).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                    <tr className="border-t-2 border-[#d4af37]/40">
                                      <td className="py-2 text-[#7a6015] font-black uppercase tracking-wider text-[11px]">Total Amount</td>
                                      <td className="py-2 text-right font-mono font-black text-[#7a6015]">{inr(billTotal(b))}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              )}
                              {b.notes && (
                                <div className="mt-3 text-xs text-gray-500 italic">
                                  <span className="font-bold not-italic text-gray-400 uppercase tracking-wider">Notes: </span>
                                  {b.notes}
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