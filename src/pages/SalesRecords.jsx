import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";
import Autocomplete from "../components/Autocomplete";

const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);

const FABRIC_QUALITIES = [
  "Superior Collection", "Gold Club", "Aura Plus", "Innova", "Milky Way",
  "Classic P 7200", "Victory", "Alpha Dyed", "Poly King", "Good Cut",
  "Fant", "Rages", "Chindi",
];

const emptyItem = () => ({ 
  quality: "", meter: "", rate: "", amount: "", _touched: false,
  hsn_code: "5515", case_no: "", pcs: "1", cut_type: "Lump"
});

const emptyInvoiceFields = () => ({
  bill_type: "Original",
  buyer_gstin: "", buyer_pan: "", buyer_address: "", buyer_state_code: "",
  buyer_adhar: "", buyer_mobile: "", buyer_email: "", buyer_cin: "",
  agent_name: "", consignee_details: "",
  transport_name: "", transport_gstin: "", lr_no: "", lr_date: "", despatch_to: "",
  eway_bill_no: "", eway_bill_date: "", place_of_supply: "",
  cgst_percent: "0", sgst_percent: "0", igst_percent: "0",
  discount: "0", cartage: "0", insurance: "0", sp_pack_chg: "0", others: "0",
  round_off: "0", tcs: "0",
});

export default function SalesRecords() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [expandedBill, setExpandedBill] = useState(null);
  const [showInvoiceFields, setShowInvoiceFields] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    bill_date: new Date().toISOString().split("T")[0],
    bill_number: "", party: "", sale_type: "Direct", agency_name: "", notes: "",
    ...emptyInvoiceFields(),
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
    setForm({
      bill_date: new Date().toISOString().split("T")[0],
      bill_number: "", party: "", sale_type: "Direct", agency_name: "", notes: "",
      ...emptyInvoiceFields(),
    });
    setItems([emptyItem()]);
    setEditingId(null);
    setShowInvoiceFields(false);
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

  const num = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  // Live calculations
  const formSubtotal = items.reduce((sum, it) => sum + num(it.amount), 0);
  const cgstAmount = (formSubtotal * num(form.cgst_percent)) / 100;
  const sgstAmount = (formSubtotal * num(form.sgst_percent)) / 100;
  const igstAmount = (formSubtotal * num(form.igst_percent)) / 100;
  const totalGst = cgstAmount + sgstAmount + igstAmount;
  const formFinalTotal = 
    formSubtotal
    - num(form.discount)
    + num(form.cartage)
    + num(form.insurance)
    + num(form.sp_pack_chg)
    + num(form.others)
    + totalGst
    - num(form.tcs)
    + num(form.round_off);

  const startEdit = (bill) => {
    setForm({
      bill_date: bill.bill_date,
      bill_number: bill.bill_number,
      party: bill.party,
      sale_type: bill.sale_type,
      agency_name: bill.agency_name || "",
      notes: bill.notes || "",
      bill_type: bill.bill_type || "Original",
      buyer_gstin: bill.buyer_gstin || "",
      buyer_pan: bill.buyer_pan || "",
      buyer_address: bill.buyer_address || "",
      buyer_state_code: bill.buyer_state_code || "",
      buyer_adhar: bill.buyer_adhar || "",
      buyer_mobile: bill.buyer_mobile || "",
      buyer_email: bill.buyer_email || "",
      buyer_cin: bill.buyer_cin || "",
      agent_name: bill.agent_name || "",
      consignee_details: bill.consignee_details || "",
      transport_name: bill.transport_name || "",
      transport_gstin: bill.transport_gstin || "",
      lr_no: bill.lr_no || "",
      lr_date: bill.lr_date || "",
      despatch_to: bill.despatch_to || "",
      eway_bill_no: bill.eway_bill_no || "",
      eway_bill_date: bill.eway_bill_date || "",
      place_of_supply: bill.place_of_supply || "",
      cgst_percent: String(bill.cgst_percent ?? 0),
      sgst_percent: String(bill.sgst_percent ?? 0),
      igst_percent: String(bill.igst_percent ?? 0),
      discount: String(bill.discount ?? 0),
      cartage: String(bill.cartage ?? 0),
      insurance: String(bill.insurance ?? 0),
      sp_pack_chg: String(bill.sp_pack_chg ?? 0),
      others: String(bill.others ?? 0),
      round_off: String(bill.round_off ?? 0),
      tcs: String(bill.tcs ?? 0),
    });
    setItems((bill.bill_items || []).map((it) => ({
      id: it.id,
      quality: it.quality,
      meter: String(it.meter),
      rate: String(it.rate),
      amount: String(it.amount),
      _touched: true,
      hsn_code: it.hsn_code || "5515",
      case_no: it.case_no || "",
      pcs: String(it.pcs ?? 1),
      cut_type: it.cut_type || "Lump",
    })));
    if ((bill.bill_items || []).length === 0) setItems([emptyItem()]);
    setEditingId(bill.id);
    setShowForm(true);
    const hasInvoiceData = bill.buyer_gstin || bill.transport_name || 
      Number(bill.cgst_percent) > 0 || Number(bill.sgst_percent) > 0 || Number(bill.igst_percent) > 0 ||
      Number(bill.discount) > 0;
    setShowInvoiceFields(!!hasInvoiceData);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bill_number || !form.party) { alert("Please fill in Bill # and Party."); return; }
    const validItems = items.filter((it) => it.quality && it.meter && it.rate);
    if (validItems.length === 0) { alert("Please add at least one fabric line."); return; }

    const subtotal = validItems.reduce((s, it) => 
      s + (parseFloat(it.amount) || parseFloat(it.meter) * parseFloat(it.rate)), 0);
    const cgst = (subtotal * num(form.cgst_percent)) / 100;
    const sgst = (subtotal * num(form.sgst_percent)) / 100;
    const igst = (subtotal * num(form.igst_percent)) / 100;
    const final = subtotal - num(form.discount) + num(form.cartage) + num(form.insurance)
      + num(form.sp_pack_chg) + num(form.others) + cgst + sgst + igst
      - num(form.tcs) + num(form.round_off);

    const billPayload = {
      bill_date: form.bill_date,
      bill_number: form.bill_number.trim(),
      party: form.party.trim(),
      sale_type: form.sale_type,
      agency_name: form.sale_type === "Agency" ? (form.agency_name.trim() || null) : null,
      notes: form.notes.trim() || null,
      bill_type: form.bill_type || "Original",
      buyer_gstin: form.buyer_gstin.trim() || null,
      buyer_pan: form.buyer_pan.trim() || null,
      buyer_address: form.buyer_address.trim() || null,
      buyer_state_code: form.buyer_state_code.trim() || null,
      buyer_adhar: form.buyer_adhar.trim() || null,
      buyer_mobile: form.buyer_mobile.trim() || null,
      buyer_email: form.buyer_email.trim() || null,
      buyer_cin: form.buyer_cin.trim() || null,
      agent_name: form.agent_name.trim() || null,
      consignee_details: form.consignee_details.trim() || null,
      transport_name: form.transport_name.trim() || null,
      transport_gstin: form.transport_gstin.trim() || null,
      lr_no: form.lr_no.trim() || null,
      lr_date: form.lr_date || null,
      despatch_to: form.despatch_to.trim() || null,
      eway_bill_no: form.eway_bill_no.trim() || null,
      eway_bill_date: form.eway_bill_date || null,
      place_of_supply: form.place_of_supply.trim() || null,
      cgst_percent: num(form.cgst_percent),
      sgst_percent: num(form.sgst_percent),
      igst_percent: num(form.igst_percent),
      discount: num(form.discount),
      cartage: num(form.cartage),
      insurance: num(form.insurance),
      sp_pack_chg: num(form.sp_pack_chg),
      others: num(form.others),
      round_off: num(form.round_off),
      tcs: num(form.tcs),
      subtotal,
      final_total: final,
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
      sales_record_id: billId,
      quality: it.quality.trim(),
      meter: parseFloat(it.meter),
      rate: parseFloat(it.rate),
      amount: parseFloat(it.amount) || parseFloat(it.meter) * parseFloat(it.rate),
      hsn_code: it.hsn_code || "5515",
      case_no: it.case_no || null,
      pcs: parseInt(it.pcs, 10) || 1,
      cut_type: it.cut_type || "Lump",
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

  const handleExport = (bill) => {
    window.open(`/admin/sales/${bill.id}/bill`, "_blank");
  };

  const billFinalTotal = (b) => {
    if (b.final_total && Number(b.final_total) > 0) return Number(b.final_total);
    return (b.bill_items || []).reduce((sum, it) => sum + Number(it.amount || 0), 0);
  };

  const billSubtotal = (b) => (b.bill_items || []).reduce((sum, it) => sum + Number(it.amount || 0), 0);
  const billMeters = (b) => (b.bill_items || []).reduce((sum, it) => sum + Number(it.meter || 0), 0);

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
        case "amount": valA = billFinalTotal(a); valB = billFinalTotal(b); break;
        case "meters": valA = billMeters(a); valB = billMeters(b); break;
        default: return 0;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const grandTotal = filteredBills.reduce((sum, b) => sum + billFinalTotal(b), 0);
  const grandSubtotal = filteredBills.reduce((sum, b) => sum + billSubtotal(b), 0);
  const grandMeters = filteredBills.reduce((sum, b) => sum + billMeters(b), 0);

  const inputCls = "w-full bg-[#020817] border border-[#1a2233] rounded-lg px-3 py-2 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition";
  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };

  return (
    <div className="min-h-screen bg-[#020817] text-[#e8edf5] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-50" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 70%)" }} />

      <header className="relative border-b border-[#1a2233]/80 backdrop-blur-xl bg-[#020817]/80 sticky top-0 z-40">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-lg font-bold tracking-[0.2em] uppercase" style={{ background: "linear-gradient(135deg, #f4d77a 0%, #d4af37 50%, #a8842c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Saikripa Textiles
          </h1>
          <p className="text-[10px] text-[#7a8499] tracking-[0.35em] uppercase mt-1 font-medium">Sales Records</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-white">Sales Records</h2>
            <p className="text-xs text-[#7a8499] mt-2 uppercase tracking-[0.25em] font-medium">Bill log — supports GST invoice export</p>
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
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">
                  Party * <span className="text-[#d4af37]/60 normal-case tracking-normal text-[10px]">(auto-fills past buyer details)</span>
                </label>
                <Autocomplete 
                  value={form.party} 
                  onChange={(v) => {
                    handleFormChange("party", v);
                    // Auto-fill buyer details from most recent bill for this party
                    const matchingBill = bills.find((b) => 
                      (b.party || "").toLowerCase() === v.toLowerCase() && 
                      (b.buyer_gstin || b.buyer_pan || b.buyer_address)
                    );
                    if (matchingBill) {
                      setForm((prev) => ({
                        ...prev,
                        party: v,
                        buyer_gstin: matchingBill.buyer_gstin || prev.buyer_gstin,
                        buyer_pan: matchingBill.buyer_pan || prev.buyer_pan,
                        buyer_address: matchingBill.buyer_address || prev.buyer_address,
                        buyer_state_code: matchingBill.buyer_state_code || prev.buyer_state_code,
                        buyer_adhar: matchingBill.buyer_adhar || prev.buyer_adhar,
                        buyer_mobile: matchingBill.buyer_mobile || prev.buyer_mobile,
                        buyer_email: matchingBill.buyer_email || prev.buyer_email,
                        buyer_cin: matchingBill.buyer_cin || prev.buyer_cin,
                        agent_name: matchingBill.agent_name || prev.agent_name,
                        consignee_details: matchingBill.consignee_details || prev.consignee_details,
                        place_of_supply: matchingBill.place_of_supply || prev.place_of_supply,
                      }));
                      // Auto-open invoice section if we filled anything
                      if (matchingBill.buyer_gstin || matchingBill.buyer_address) {
                        setShowInvoiceFields(true);
                      }
                    }
                  }} 
                  suggestions={partyOptions} 
                  placeholder="Buyer name / firm" 
                  required 
                  className={inputCls} 
                />
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
                      <Autocomplete value={it.quality} onChange={(v) => handleItemChange(idx, "quality", v)} suggestions={FABRIC_QUALITIES} placeholder="e.g. Superior Collection" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Meter *</label>
                      <input type="number" step="0.01" value={it.meter} onChange={(e) => handleItemChange(idx, "meter", e.target.value)} placeholder="0.00" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Rate *</label>
                      <input type="number" step="0.01" value={it.rate} onChange={(e) => handleItemChange(idx, "rate", e.target.value)} placeholder="0.00" className={inputCls} />
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

                    {showInvoiceFields && (
                      <>
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">HSN Code</label>
                          <input type="text" value={it.hsn_code} onChange={(e) => handleItemChange(idx, "hsn_code", e.target.value)} placeholder="5515" className={inputCls} />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Case No.</label>
                          <input type="text" value={it.case_no} onChange={(e) => handleItemChange(idx, "case_no", e.target.value)} placeholder="e.g. 469" className={inputCls} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Pcs</label>
                          <input type="number" value={it.pcs} onChange={(e) => handleItemChange(idx, "pcs", e.target.value)} placeholder="1" className={inputCls} />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Cut Type</label>
                          <select value={it.cut_type} onChange={(e) => handleItemChange(idx, "cut_type", e.target.value)} className={inputCls + " cursor-pointer"}>
                            <option value="Lump">Lump</option>
                            <option value="Roll">Roll</option>
                            <option value="Piece">Piece</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Collapsible Invoice Details */}
            <div className="border-t border-[#1a2233] mt-5 pt-5">
              <button
                type="button"
                onClick={() => setShowInvoiceFields(!showInvoiceFields)}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    Invoice Details
                    <span className="text-[10px] text-[#d4af37]/70 font-normal normal-case tracking-normal">(Optional — for printable GST bill)</span>
                  </h4>
                  <p className="text-xs text-[#7a8499] mt-1">Buyer GSTIN, transport, GST %, discount, etc.</p>
                </div>
                <svg className={`w-5 h-5 text-[#d4af37] transition-transform duration-200 ${showInvoiceFields ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showInvoiceFields && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Bill Type</label>
                    <div className="flex flex-wrap gap-2">
                      {["Original", "Duplicate", "Triplicate", "Transport Copy"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleFormChange("bill_type", t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition ${
                            form.bill_type === t
                              ? "bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                              : "bg-[#020817] border border-[#1a2233] text-[#7a8499] hover:text-[#e8edf5] hover:border-[#d4af37]/40"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.3em] mb-3">Buyer Details</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Buyer GSTIN</label><input type="text" value={form.buyer_gstin} onChange={(e) => handleFormChange("buyer_gstin", e.target.value)} placeholder="e.g. 24AEFPB8781G1ZJ" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Buyer PAN</label><input type="text" value={form.buyer_pan} onChange={(e) => handleFormChange("buyer_pan", e.target.value)} placeholder="e.g. AEFPB8781G" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">State Code</label><input type="text" value={form.buyer_state_code} onChange={(e) => handleFormChange("buyer_state_code", e.target.value)} placeholder="e.g. 24" className={inputCls} /></div>
                      <div className="sm:col-span-2 lg:col-span-3"><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Buyer Address</label><input type="text" value={form.buyer_address} onChange={(e) => handleFormChange("buyer_address", e.target.value)} placeholder="Full address with city, state" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Buyer Mobile</label><input type="text" value={form.buyer_mobile} onChange={(e) => handleFormChange("buyer_mobile", e.target.value)} placeholder="10-digit number" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Buyer Email</label><input type="email" value={form.buyer_email} onChange={(e) => handleFormChange("buyer_email", e.target.value)} placeholder="buyer@example.com" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Aadhar</label><input type="text" value={form.buyer_adhar} onChange={(e) => handleFormChange("buyer_adhar", e.target.value)} placeholder="Optional" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Buyer CIN</label><input type="text" value={form.buyer_cin} onChange={(e) => handleFormChange("buyer_cin", e.target.value)} placeholder="Corporate ID (optional)" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Agent</label><input type="text" value={form.agent_name} onChange={(e) => handleFormChange("agent_name", e.target.value)} placeholder="Agent name" className={inputCls} /></div>
                      <div className="sm:col-span-2 lg:col-span-3"><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Consignee Details (Ship To)</label><textarea value={form.consignee_details} onChange={(e) => handleFormChange("consignee_details", e.target.value)} placeholder="Ship-to address, name, contact — type 'Same as Buyer' if applicable" rows={3} className={inputCls + " resize-none"} /></div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.3em] mb-3">Despatch & Transport</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Despatch To</label><input type="text" value={form.despatch_to} onChange={(e) => handleFormChange("despatch_to", e.target.value)} placeholder="e.g. Ankleshwar" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Place of Supply</label><input type="text" value={form.place_of_supply} onChange={(e) => handleFormChange("place_of_supply", e.target.value)} placeholder="e.g. Ankleshwar" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Transport Name</label><input type="text" value={form.transport_name} onChange={(e) => handleFormChange("transport_name", e.target.value)} placeholder="Transport company" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Transport GSTIN</label><input type="text" value={form.transport_gstin} onChange={(e) => handleFormChange("transport_gstin", e.target.value)} placeholder="Transport GSTIN" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Lr No.</label><input type="text" value={form.lr_no} onChange={(e) => handleFormChange("lr_no", e.target.value)} placeholder="e.g. BHL/TP/1140" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Lr Date</label><input type="date" value={form.lr_date} onChange={(e) => handleFormChange("lr_date", e.target.value)} className={inputCls + " [color-scheme:dark]"} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Eway Bill No.</label><input type="text" value={form.eway_bill_no} onChange={(e) => handleFormChange("eway_bill_no", e.target.value)} placeholder="Eway bill number" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Eway Bill Date</label><input type="date" value={form.eway_bill_date} onChange={(e) => handleFormChange("eway_bill_date", e.target.value)} className={inputCls + " [color-scheme:dark]"} /></div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.3em] mb-3">GST & Adjustments</p>
                    <p className="text-xs text-[#7a8499] mb-3 italic">For inter-state sales (different state from yours), use IGST. For intra-state, use CGST + SGST.</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">CGST %</label><input type="number" step="0.01" value={form.cgst_percent} onChange={(e) => handleFormChange("cgst_percent", e.target.value)} placeholder="0" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">SGST %</label><input type="number" step="0.01" value={form.sgst_percent} onChange={(e) => handleFormChange("sgst_percent", e.target.value)} placeholder="0" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">IGST %</label><input type="number" step="0.01" value={form.igst_percent} onChange={(e) => handleFormChange("igst_percent", e.target.value)} placeholder="e.g. 5" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Discount ₹</label><input type="number" step="0.01" value={form.discount} onChange={(e) => handleFormChange("discount", e.target.value)} placeholder="0" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Cartage ₹</label><input type="number" step="0.01" value={form.cartage} onChange={(e) => handleFormChange("cartage", e.target.value)} placeholder="0" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Insurance ₹</label><input type="number" step="0.01" value={form.insurance} onChange={(e) => handleFormChange("insurance", e.target.value)} placeholder="0" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Sp. Pack Chg. ₹</label><input type="number" step="0.01" value={form.sp_pack_chg} onChange={(e) => handleFormChange("sp_pack_chg", e.target.value)} placeholder="0" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Others ₹</label><input type="number" step="0.01" value={form.others} onChange={(e) => handleFormChange("others", e.target.value)} placeholder="0" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Round Off ₹</label><input type="number" step="0.01" value={form.round_off} onChange={(e) => handleFormChange("round_off", e.target.value)} placeholder="0" className={inputCls} /></div>
                      <div><label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">TCS ₹</label><input type="number" step="0.01" value={form.tcs} onChange={(e) => handleFormChange("tcs", e.target.value)} placeholder="0" className={inputCls} /></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live totals strip */}
            <div className="bg-gradient-to-br from-[#0d1530] to-[#0a1124] rounded-lg p-5 mt-5 mb-5 border border-[#d4af37]/30" style={goldGlow}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7a8499] mb-1">Subtotal</p>
                  <p className="text-xl font-bold text-white tracking-tight">{inr(formSubtotal)}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37] mb-1">Final Total (Customer Pays)</p>
                  <p className="text-2xl font-bold text-[#d4af37] tracking-tight">{inr(formFinalTotal)}</p>
                </div>
              </div>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
            <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Bills</p>
            <p className="text-3xl font-bold text-white mt-3 tracking-tight">{filteredBills.length}</p>
          </div>
          <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
            <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Total Meters</p>
            <p className="text-3xl font-bold text-white mt-3 tracking-tight">{grandMeters.toFixed(2)}</p>
          </div>
          <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
            <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Subtotal</p>
            <p className="text-2xl font-bold text-white mt-3 tracking-tight">{inr(grandSubtotal)}</p>
          </div>
          <div className="rounded-xl p-5 bg-gradient-to-br from-[#0d1530] to-[#0a1124] relative overflow-hidden" style={goldGlow}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(212, 175, 55, 0.4) 0%, transparent 60%)" }} />
            <p className="text-[10px] text-[#d4af37]/70 uppercase tracking-[0.3em] font-medium relative">Total Revenue</p>
            <p className="text-2xl font-bold text-[#d4af37] mt-3 tracking-tight relative">{inr(grandTotal)}</p>
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
                  {filteredBills.map((b) => {
                    const isOpen = expandedBill === b.id;
                    const itemCount = (b.bill_items || []).length;
                    const subtotal = billSubtotal(b);
                    const finalTotal = billFinalTotal(b);
                    const hasAdjustments = Math.abs(finalTotal - subtotal) > 0.01;
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
                          <td className="px-3 py-3 text-right font-mono">
                            <p className="font-bold text-[#d4af37]">{inr(finalTotal)}</p>
                            {hasAdjustments && (
                              <p className="text-[10px] text-[#7a8499] mt-0.5">sub: {inr(subtotal)}</p>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleExport(b)} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 mr-3 transition">Export</button>
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
                                      <th className="text-right font-medium py-2">Rate</th>
                                      <th className="text-right font-medium py-2">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {b.bill_items.map((it) => (
                                      <tr key={it.id} className="border-t border-[#1a2233]/60">
                                        <td className="py-2 text-[#e8edf5] font-semibold">{it.quality}</td>
                                        <td className="py-2 text-right font-mono text-[#a8b0c0]">{Number(it.meter).toFixed(2)}</td>
                                        <td className="py-2 text-right font-mono text-[#a8b0c0]">{Number(it.rate).toFixed(2)}</td>
                                        <td className="py-2 text-right font-mono text-[#a8b0c0]">{inr(it.amount)}</td>
                                      </tr>
                                    ))}
                                    <tr className="border-t-2 border-[#1a2233]">
                                      <td colSpan={3} className="py-2 text-[#7a8499] font-bold uppercase tracking-[0.2em] text-[11px] text-right">Subtotal</td>
                                      <td className="py-2 text-right font-mono font-bold text-white">{inr(subtotal)}</td>
                                    </tr>
                                    {hasAdjustments && (
                                      <>
                                        {Number(b.discount) > 0 && <tr><td colSpan={3} className="py-1 text-rose-300/80 text-right text-[11px]">− Discount</td><td className="py-1 text-right font-mono text-rose-300">{inr(b.discount)}</td></tr>}
                                        {Number(b.cartage) > 0 && <tr><td colSpan={3} className="py-1 text-emerald-300/80 text-right text-[11px]">+ Cartage</td><td className="py-1 text-right font-mono text-emerald-300">{inr(b.cartage)}</td></tr>}
                                        {Number(b.insurance) > 0 && <tr><td colSpan={3} className="py-1 text-emerald-300/80 text-right text-[11px]">+ Insurance</td><td className="py-1 text-right font-mono text-emerald-300">{inr(b.insurance)}</td></tr>}
                                        {Number(b.cgst_percent) > 0 && <tr><td colSpan={3} className="py-1 text-emerald-300/80 text-right text-[11px]">+ CGST {b.cgst_percent}%</td><td className="py-1 text-right font-mono text-emerald-300">{inr(subtotal * b.cgst_percent / 100)}</td></tr>}
                                        {Number(b.sgst_percent) > 0 && <tr><td colSpan={3} className="py-1 text-emerald-300/80 text-right text-[11px]">+ SGST {b.sgst_percent}%</td><td className="py-1 text-right font-mono text-emerald-300">{inr(subtotal * b.sgst_percent / 100)}</td></tr>}
                                        {Number(b.igst_percent) > 0 && <tr><td colSpan={3} className="py-1 text-emerald-300/80 text-right text-[11px]">+ IGST {b.igst_percent}%</td><td className="py-1 text-right font-mono text-emerald-300">{inr(subtotal * b.igst_percent / 100)}</td></tr>}
                                        {Number(b.tcs) > 0 && <tr><td colSpan={3} className="py-1 text-rose-300/80 text-right text-[11px]">− TCS</td><td className="py-1 text-right font-mono text-rose-300">{inr(b.tcs)}</td></tr>}
                                        {Number(b.round_off) !== 0 && <tr><td colSpan={3} className="py-1 text-[#7a8499] text-right text-[11px]">± Round Off</td><td className="py-1 text-right font-mono text-[#d4af37]">{inr(b.round_off)}</td></tr>}
                                      </>
                                    )}
                                    <tr className="border-t-2 border-[#d4af37]/40">
                                      <td colSpan={3} className="py-2 text-[#d4af37] font-bold uppercase tracking-[0.2em] text-[11px] text-right">Final Total</td>
                                      <td className="py-2 text-right font-mono font-bold text-[#d4af37]">{inr(finalTotal)}</td>
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