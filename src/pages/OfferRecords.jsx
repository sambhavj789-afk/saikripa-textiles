import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";
import Autocomplete from "../components/Autocomplete";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

const MILLS = ["Sangam", "Saileela", "SSPL"];
const QUALITIES = [
  "Superior Collection", "Gold Club", "Aura Plus", "Innova", "Milky Way",
  "Classic P 7200", "Victory", "Alpha Dyed", "Poly King", "Good Cut",
  "2/30*2/30 PV",
];

const emptyShade = () => ({ shade: "", quantity: "", grey_rec: "", not_rec_pct: "" });

export default function OfferRecords() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [expanded, setExpanded] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    offer_date: new Date().toISOString().split("T")[0],
    offer_no: "", mill: "", quality: "", rate: "", weight: "", notes: "",
  });
  const [shades, setShades] = useState([emptyShade()]);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/admin/login", { replace: true }); return; }
      setUserEmail(data.session.user.email);
      await fetchOffers();
    };
    init();
  }, [navigate]);

  const fetchOffers = async () => {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("offer_records").select("*, offer_shades(*)")
      .order("offer_date", { ascending: false });
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setOffers(data || []);
  };

  const millOptions = useMemo(() => {
    const s = new Set(MILLS);
    offers.forEach((o) => o.mill && s.add(o.mill));
    return Array.from(s).sort();
  }, [offers]);

  const qualityOptions = useMemo(() => {
    const s = new Set(QUALITIES);
    offers.forEach((o) => o.quality && s.add(o.quality));
    return Array.from(s).sort();
  }, [offers]);

  const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

  const resetForm = () => {
    setForm({
      offer_date: new Date().toISOString().split("T")[0],
      offer_no: "", mill: "", quality: "", rate: "", weight: "", notes: "",
    });
    setShades([emptyShade()]);
    setEditingId(null);
  };

  const handleFormChange = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const handleShadeChange = (i, f, v) =>
    setShades((p) => p.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)));
  const addShade = () => setShades((p) => [...p, emptyShade()]);
  const removeShade = (i) => setShades((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

  const startEdit = (o) => {
    setForm({
      offer_date: o.offer_date,
      offer_no: o.offer_no,
      mill: o.mill || "",
      quality: o.quality || "",
      rate: String(o.rate ?? ""),
      weight: o.weight || "",
      notes: o.notes || "",
    });
    setShades((o.offer_shades || []).map((s) => ({
      id: s.id,
      shade: s.shade || "",
      quantity: String(s.quantity ?? ""),
      grey_rec: s.grey_rec == null ? "" : String(s.grey_rec),
      not_rec_pct: String(s.not_rec_pct ?? ""),
    })));
    if ((o.offer_shades || []).length === 0) setShades([emptyShade()]);
    setEditingId(o.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.offer_no) { alert("Please fill in Offer No."); return; }
    const validShades = shades.filter((s) => s.shade || s.quantity);
    if (validShades.length === 0) { alert("Please add at least one shade line."); return; }

    setSaving(true);
    try {
      const offerPayload = {
        offer_date: form.offer_date || null,
        offer_no: form.offer_no.trim(),
        mill: form.mill.trim() || null,
        quality: form.quality.trim() || null,
        rate: num(form.rate),
        weight: form.weight.trim() || null,
        notes: form.notes.trim() || null,
      };

      let offerId;
      if (editingId) {
        const { error: dbError } = await supabase.from("offer_records").update(offerPayload).eq("id", editingId);
        if (dbError) { alert("Could not update: " + dbError.message); return; }
        offerId = editingId;
        await supabase.from("offer_shades").delete().eq("offer_record_id", offerId);
      } else {
        const { data, error: dbError } = await supabase.from("offer_records").insert([offerPayload]).select().single();
        if (dbError) { alert("Could not save: " + dbError.message); return; }
        offerId = data.id;
      }

      const shadesPayload = validShades.map((s) => ({
        offer_record_id: offerId,
        shade: s.shade.trim() || null,
        quantity: num(s.quantity),
        grey_rec: s.grey_rec === "" ? null : num(s.grey_rec),
        not_rec_pct: num(s.not_rec_pct),
      }));
      const { error: shErr } = await supabase.from("offer_shades").insert(shadesPayload);
      if (shErr) { alert("Offer saved but shades failed: " + shErr.message); return; }

      resetForm();
      setShowForm(false);
      fetchOffers();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this offer and all its shade lines?")) return;
    const { error: dbError } = await supabase.from("offer_records").delete().eq("id", id);
    if (dbError) { alert("Could not delete: " + dbError.message); return; }
    setOffers((p) => p.filter((o) => o.id !== id));
  };

  const offerQty = (o) => (o.offer_shades || []).reduce((s, x) => s + Number(x.quantity || 0), 0);
  const offerGrey = (o) => (o.offer_shades || []).reduce((s, x) => s + Number(x.grey_rec || 0), 0);
  const offerNotRec = (o) => (o.offer_shades || []).reduce((s, x) => s + (Number(x.quantity || 0) * Number(x.not_rec_pct || 0)) / 100, 0);

  const filtered = offers
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (o.offer_no || "").toLowerCase().includes(q) ||
        (o.mill || "").toLowerCase().includes(q) ||
        (o.quality || "").toLowerCase().includes(q) ||
        (o.offer_shades || []).some((s) => (s.shade || "").toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case "date": valA = new Date(a.offer_date).getTime(); valB = new Date(b.offer_date).getTime(); break;
        case "offer": valA = parseInt(a.offer_no, 10) || 0; valB = parseInt(b.offer_no, 10) || 0; break;
        case "mill": valA = (a.mill || "").toLowerCase(); valB = (b.mill || "").toLowerCase(); break;
        case "quality": valA = (a.quality || "").toLowerCase(); valB = (b.quality || "").toLowerCase(); break;
        case "qty": valA = offerQty(a); valB = offerQty(b); break;
        default: return 0;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const grandQty = filtered.reduce((s, o) => s + offerQty(o), 0);
  const grandGrey = filtered.reduce((s, o) => s + offerGrey(o), 0);
  const grandNotRec = filtered.reduce((s, o) => s + offerNotRec(o), 0);

  const inputCls = "w-full bg-[#020817] border border-[#1a2233] rounded-lg px-3 py-2 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition";
  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };

  const exportFileName = (ext) => `saikripa-offers-${new Date().toISOString().slice(0, 10)}.${ext}`;

  const exportToExcel = () => {
    if (filtered.length === 0) { alert("No offers to export. Try clearing your filters."); return; }

    const rows = [];
    const merges = [];          // cell merge ranges
    let r = 1;                  // data starts at row 1 (row 0 = header)

    // columns that should merge vertically per offer (by 0-based column index)
    // 0 Date, 1 Offer No., 2 Mill, 3 Quality, 4 @ (Rate), 5 Weight,
    // 10 Total Quantity, 11 Total Grey Rec., 12 Notes
    const mergeCols = [0, 1, 2, 3, 4, 5, 10, 11, 12];

    filtered.forEach((o) => {
      const shadesList = o.offer_shades || [];
      const n = Math.max(1, shadesList.length);
      const startRow = r;

      if (shadesList.length === 0) {
        rows.push({
          Date: fmtDate(o.offer_date),
          "Offer No.": o.offer_no,
          Mill: o.mill || "",
          Quality: o.quality || "",
          "@ (Rate)": o.rate ? Number(o.rate).toFixed(2) : "",
          Weight: o.weight || "",
          Shade: "", Quantity: "", "Grey Rec.": "", "Not Rec. (%)": "",
          "Total Quantity": offerQty(o).toFixed(2),
          "Total Grey Rec.": offerGrey(o).toFixed(2),
          Notes: o.notes || "",
        });
        r += 1;
      } else {
        shadesList.forEach((s) => {
          rows.push({
            Date: fmtDate(o.offer_date),
            "Offer No.": o.offer_no,
            Mill: o.mill || "",
            Quality: o.quality || "",
            "@ (Rate)": o.rate ? Number(o.rate).toFixed(2) : "",
            Weight: o.weight || "",
            Shade: s.shade || "",
            Quantity: Number(s.quantity || 0).toFixed(2),
            "Grey Rec.": s.grey_rec == null ? "" : Number(s.grey_rec).toFixed(2),
            "Not Rec. (%)": Number(s.not_rec_pct || 0).toFixed(2),
            "Total Quantity": offerQty(o).toFixed(2),
            "Total Grey Rec.": offerGrey(o).toFixed(2),
            Notes: o.notes || "",
          });
        });
        r += shadesList.length;
      }

      // if this offer spans more than one row, merge its offer-level columns
      if (n > 1) {
        mergeCols.forEach((c) => {
          merges.push({ s: { r: startRow, c }, e: { r: startRow + n - 1, c } });
        });
      }
    });

    rows.push({});
    rows.push({
      Date: "TOTAL", "Offer No.": filtered.length + " offers",
      Quantity: grandQty.toFixed(2),
      "Grey Rec.": grandGrey.toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 11 }, { wch: 12 }, { wch: 22 }, { wch: 9 }, { wch: 10 }, { wch: 10 }, { wch: 11 }, { wch: 11 }, { wch: 12 }, { wch: 13 }, { wch: 13 }, { wch: 30 }];
    ws["!merges"] = merges;

    // Center text (horizontal + vertical) in every merged cell's anchor cell
    merges.forEach((m) => {
      const addr = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
      if (ws[addr]) {
        ws[addr].s = {
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Offer Records");
    XLSX.writeFile(wb, exportFileName("xlsx"));
  };

  const exportToPDF = () => {
    if (filtered.length === 0) { alert("No offers to export. Try clearing your filters."); return; }
    const doc = new jsPDF("landscape");
    doc.setFontSize(14); doc.setTextColor(40, 40, 40);
    doc.text("SAIKRIPA TEXTILES — Offer Records", 14, 15);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}  |  ${filtered.length} offers`, 14, 21);
    const body = filtered.map((o) => [
      fmtDate(o.offer_date),
      o.offer_no,
      o.mill || "",
      o.quality || "",
      o.rate ? Number(o.rate).toFixed(2) : "—",
      o.weight || "",
      (o.offer_shades || []).length + " shades",
      offerQty(o).toFixed(0),
      offerGrey(o).toFixed(1),
    ]);
    autoTable(doc, {
      startY: 26,
      head: [["Date", "Offer No.", "Mill", "Quality", "@", "Weight", "Shades", "Total Qty", "Grey Rec."]],
      body,
      foot: [["", "TOTAL", filtered.length + " offers", "", "", "", "",
        grandQty.toFixed(0), grandGrey.toFixed(1)]],
      headStyles: { fillColor: [212, 175, 55], textColor: [2, 8, 23], fontStyle: "bold", fontSize: 8 },
      footStyles: { fillColor: [10, 17, 36], textColor: [212, 175, 55], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 4: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" } },
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
          <h1 className="text-lg font-bold tracking-[0.2em] uppercase" style={{ background: "linear-gradient(135deg, #f4d77a 0%, #d4af37 50%, #a8842c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Saikripa Textiles
          </h1>
          <p className="text-[10px] text-[#7a8499] tracking-[0.35em] uppercase mt-1 font-medium">Offer Records</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#f4d77a] via-[#d4af37] to-[#a8842c]" />
            <div>
              <h2 className="text-4xl font-bold tracking-tight" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f4d77a 60%, #d4af37 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Offer Records</h2>
              <p className="text-xs text-[#7a8499] mt-2 uppercase tracking-[0.25em] font-medium">Mill offers, shades & grey receipts</p>
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
              {showForm ? "Close Form" : "+ New Offer"}
            </button>
          </div>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm mb-4">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#0a1124] rounded-xl p-6 mb-6 border border-[#d4af37]/30" style={goldGlow}>
            <h3 className="font-bold text-white text-lg mb-5">{editingId ? "Edit Offer" : "New Offer"}</h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Date</label>
                <input type="date" value={form.offer_date} onChange={(e) => handleFormChange("offer_date", e.target.value)} className={inputCls + " [color-scheme:dark]"} />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Offer No. *</label>
                <input type="text" value={form.offer_no} onChange={(e) => handleFormChange("offer_no", e.target.value)} placeholder="e.g. 140732" required className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Mill</label>
                <Autocomplete value={form.mill} onChange={(v) => handleFormChange("mill", v)} suggestions={millOptions} placeholder="e.g. Sangam" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Quality</label>
                <Autocomplete value={form.quality} onChange={(v) => handleFormChange("quality", v)} suggestions={qualityOptions} placeholder="e.g. Superior Collection" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">@ (Rate)</label>
                <input type="number" step="0.01" value={form.rate} onChange={(e) => handleFormChange("rate", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Weight</label>
                <input type="text" value={form.weight} onChange={(e) => handleFormChange("weight", e.target.value)} placeholder="e.g. 370gm" className={inputCls} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => handleFormChange("notes", e.target.value)} placeholder="Optional" className={inputCls} />
              </div>
            </div>

            <div className="border-t border-[#1a2233] pt-5 mb-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">Shades on this offer</h4>
                <button type="button" onClick={addShade} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] transition uppercase tracking-wider">+ Add shade</button>
              </div>
              <div className="space-y-3">
                {shades.map((s, idx) => (
                  <div key={idx} className="bg-[#020817] border border-[#1a2233] rounded-lg p-4 grid sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Shade</label>
                      <input type="text" value={s.shade} onChange={(e) => handleShadeChange(idx, "shade", e.target.value)} placeholder="e.g. 3472" className={inputCls} />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Quantity</label>
                      <input type="number" step="0.01" value={s.quantity} onChange={(e) => handleShadeChange(idx, "quantity", e.target.value)} placeholder="0" className={inputCls} />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Grey Rec.</label>
                      <input type="number" step="0.01" value={s.grey_rec} onChange={(e) => handleShadeChange(idx, "grey_rec", e.target.value)} placeholder="blank if none" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Not Rec.(%)</label>
                      <input type="number" step="0.01" value={s.not_rec_pct} onChange={(e) => handleShadeChange(idx, "not_rec_pct", e.target.value)} placeholder="0.00" className={inputCls} />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {shades.length > 1 && (
                        <button type="button" onClick={() => removeShade(idx)} className="text-rose-400 hover:text-rose-300 text-xl font-bold w-8 h-8 flex items-center justify-center" aria-label="Remove">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={saving} className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Saving..." : (editingId ? "Update Offer" : "Save Offer")}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="bg-[#020817] border border-[#1a2233] text-[#a8b0c0] px-6 py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider hover:border-[#d4af37]/40 hover:text-[#e8edf5] transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="bg-[#0a1124] rounded-xl p-4 mb-6 border border-[#1a2233] flex gap-3 items-center flex-wrap">
          <input type="text" placeholder="Search by offer no, mill, quality, shade..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[200px] bg-[#020817] border border-[#1a2233] rounded-lg px-4 py-2.5 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition" />
          <div className="flex items-center gap-1 bg-[#020817] border border-[#1a2233] rounded-lg overflow-hidden">
            <span className="text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] px-3">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs font-bold py-2 pr-2 focus:outline-none bg-[#020817] text-[#e8edf5] cursor-pointer">
              <option value="date">Date</option>
              <option value="offer">Offer No.</option>
              <option value="mill">Mill</option>
              <option value="quality">Quality</option>
              <option value="qty">Quantity</option>
            </select>
            <button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")} className="text-sm font-bold px-3 py-2 text-[#d4af37] hover:bg-[#0a1124] transition border-l border-[#1a2233]" title={sortDir === "asc" ? "Ascending" : "Descending"}>
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <button onClick={fetchOffers} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] whitespace-nowrap transition uppercase tracking-wider">Refresh</button>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
              <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Total Quantity</p>
              <p className="text-3xl font-bold text-white mt-3 tracking-tight">{grandQty.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
              <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Total Grey Rec.</p>
              <p className="text-3xl font-bold text-white mt-3 tracking-tight">{grandGrey.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</p>
            </div>
            <div className="rounded-xl p-5 bg-gradient-to-br from-[#0d1530] to-[#0a1124] relative overflow-hidden" style={goldGlow}>
              <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(212, 175, 55, 0.4) 0%, transparent 60%)" }} />
              <p className="text-[10px] text-[#d4af37]/70 uppercase tracking-[0.3em] font-medium relative">Total Not Received</p>
              <p className="text-3xl font-bold text-[#d4af37] mt-3 tracking-tight relative">{grandNotRec.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-[#7a8499]">Loading offer records...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#0a1124] rounded-xl p-12 text-center text-[#7a8499] border border-[#1a2233]">No offer records yet.</div>
        ) : (
          <div className="bg-[#0a1124] rounded-xl border border-[#1a2233] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#020817] border-b border-[#1a2233]">
                  <tr>
                    <th className="w-8"></th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Date</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Offer No.</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Mill</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Quality</th>
                    <th className="text-right px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">@</th>
                    <th className="text-left px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Weight</th>
                    <th className="text-center px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Shades</th>
                    <th className="text-right px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Qty</th>
                    <th className="text-center px-3 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const isOpen = expanded === o.id;
                    const shadeCount = (o.offer_shades || []).length;
                    return (
                      <React.Fragment key={o.id}>
                        <tr className={`border-t border-[#1a2233] hover:bg-[#020817]/60 transition cursor-pointer ${isOpen ? "bg-[#020817]/40" : ""}`} onClick={() => setExpanded(isOpen ? null : o.id)}>
                          <td className="px-3 py-3 text-center">
                            <svg className={`inline-block w-3 h-3 text-[#d4af37] transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </td>
                          <td className="px-3 py-3 text-[#a8b0c0] whitespace-nowrap">{fmtDate(o.offer_date)}</td>
                          <td className="px-3 py-3 font-semibold text-white">{o.offer_no}</td>
                          <td className="px-3 py-3 text-[#e8edf5]">{o.mill}</td>
                          <td className="px-3 py-3 text-[#e8edf5]">{o.quality}</td>
                          <td className="px-3 py-3 text-right font-mono text-[#a8b0c0]">{o.rate ? Number(o.rate).toFixed(2) : ""}</td>
                          <td className="px-3 py-3 text-[#a8b0c0]">{o.weight}</td>
                          <td className="px-3 py-3 text-center text-[#a8b0c0]">{shadeCount}</td>
                          <td className="px-3 py-3 text-right font-mono text-[#a8b0c0]">{offerQty(o).toFixed(0)}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => startEdit(o)} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] mr-3 transition">Edit</button>
                            <button onClick={() => handleDelete(o.id)} className="text-xs font-medium text-rose-400 hover:text-rose-300 transition">Delete</button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-[#020817]/60 border-t border-[#1a2233]">
                            <td colSpan={10} className="px-6 py-4">
                              {shadeCount === 0 ? (
                                <p className="text-xs text-[#7a8499] italic">No shade lines.</p>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[#7a8499] uppercase tracking-[0.25em]">
                                      <th className="text-left font-medium py-2">Shade</th>
                                      <th className="text-right font-medium py-2">Quantity</th>
                                      <th className="text-right font-medium py-2">Grey Rec.</th>
                                      <th className="text-right font-medium py-2">Not Rec.(%)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {o.offer_shades.map((s) => (
                                      <tr key={s.id} className="border-t border-[#1a2233]/60">
                                        <td className="py-2 text-[#e8edf5] font-semibold">{s.shade}</td>
                                        <td className="py-2 text-right font-mono text-[#a8b0c0]">{Number(s.quantity).toFixed(0)}</td>
                                        <td className="py-2 text-right font-mono text-[#a8b0c0]">{s.grey_rec == null ? "—" : Number(s.grey_rec).toFixed(1)}</td>
                                        <td className={`py-2 text-right font-mono ${Number(s.not_rec_pct) < 0 ? "text-emerald-300" : "text-rose-300/80"}`}>{Number(s.not_rec_pct).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                    <tr className="border-t-2 border-[#d4af37]/40">
                                      <td className="py-2 text-[#d4af37] font-bold uppercase tracking-[0.2em] text-[11px]">Total</td>
                                      <td className="py-2 text-right font-mono font-bold text-[#d4af37]">{offerQty(o).toFixed(0)}</td>
                                      <td className="py-2 text-right font-mono font-bold text-[#d4af37]">{offerGrey(o).toFixed(1)}</td>
                                      <td></td>
                                    </tr>
                                  </tbody>
                                </table>
                              )}
                              {o.notes && (
                                <div className="mt-3 text-xs text-[#a8b0c0] italic">
                                  <span className="font-bold not-italic text-[#7a8499] uppercase tracking-wider">Notes: </span>{o.notes}
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