import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";
import Autocomplete from "../components/Autocomplete";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const QUALITIES = [
  "Superior Collection", "Gold Club", "Aura Plus", "Innova", "Milky Way",
  "Classic P 7200", "Victory", "Dyed Look", "Alpha Dyed", "Poly King", "Good Cut",
];

const monthLabel = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "";

const fmtNum = (n) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(n || 0);

// Shrinkage % = (process - finish) / process * 100
const shrink = (process, finish) => {
  const p = Number(process) || 0;
  const f = Number(finish) || 0;
  if (p === 0) return 0;
  return ((p - f) / p) * 100;
};

const emptyItem = () => ({ quality: "", process_rec: "", finish_rec: "" });

export default function StockReceived() {
  const navigate = useNavigate();
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    period_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [items, setItems] = useState([emptyItem()]);
  const [search, setSearch] = useState("");
  const [addingTo, setAddingTo] = useState(null); // month id we're adding to
  const [addRows, setAddRows] = useState([{ quality: "", process_rec: "", finish_rec: "" }]);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/admin/login", { replace: true }); return; }
      setUserEmail(data.session.user.email);
      await fetchMonths();
    };
    init();
  }, [navigate]);

  const fetchMonths = async () => {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("stock_received").select("*, stock_received_items(*)")
      .order("period_date", { ascending: true });
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setMonths(data || []);
  };

  const qualityOptions = useMemo(() => {
    const s = new Set(QUALITIES);
    months.forEach((m) => (m.stock_received_items || []).forEach((it) => it.quality && s.add(it.quality)));
    return Array.from(s).sort();
  }, [months]);

  const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

  const resetForm = () => {
    setForm({ period_date: new Date().toISOString().split("T")[0], notes: "" });
    setItems([emptyItem()]);
    setEditingId(null);
  };

  const handleFormChange = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const handleItemChange = (i, f, v) =>
    setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [f]: v } : it)));
  const addItem = () => setItems((p) => [...p, emptyItem()]);
  const removeItem = (i) => setItems((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

  const startEdit = (m) => {
    setForm({ period_date: m.period_date, notes: m.notes || "" });
    setItems((m.stock_received_items || []).map((it) => ({
      id: it.id,
      quality: it.quality || "",
      process_rec: String(it.process_rec ?? ""),
      finish_rec: String(it.finish_rec ?? ""),
    })));
    if ((m.stock_received_items || []).length === 0) setItems([emptyItem()]);
    setEditingId(m.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const validItems = items.filter((it) => it.quality && (it.process_rec || it.finish_rec));

    setSaving(true);
    try {
      const payload = {
        period_date: form.period_date || null,
        notes: form.notes.trim() || null,
      };

      let pid;
      if (editingId) {
        const { error: dbError } = await supabase.from("stock_received").update(payload).eq("id", editingId);
        if (dbError) { alert("Could not update: " + dbError.message); return; }
        pid = editingId;
        await supabase.from("stock_received_items").delete().eq("stock_received_id", pid);
      } else {
        const { data, error: dbError } = await supabase.from("stock_received").insert([payload]).select().single();
        if (dbError) { alert("Could not save: " + dbError.message); return; }
        pid = data.id;
      }

      const itemsPayload = validItems.map((it) => ({
        stock_received_id: pid,
        quality: it.quality.trim(),
        process_rec: num(it.process_rec),
        finish_rec: num(it.finish_rec),
      }));
      if (itemsPayload.length > 0) {
        const { error: itErr } = await supabase.from("stock_received_items").insert(itemsPayload);
        if (itErr) { alert("Month saved but lines failed: " + itErr.message); return; }
      }

      resetForm();
      setShowForm(false);
      fetchMonths();
    } finally {
      setSaving(false);
    }
  };
const submitAdd = async (month) => {
    if (saving) return;
    const valid = addRows.filter((r) => r.quality && (r.process_rec || r.finish_rec));
    if (valid.length === 0) { alert("Add at least one quality with an amount."); return; }

    setSaving(true);
    try {
      for (const r of valid) {
        const addP = num(r.process_rec);
        const addF = num(r.finish_rec);
        const existing = (month.stock_received_items || []).find(
          (it) => (it.quality || "").toLowerCase() === r.quality.trim().toLowerCase()
        );
        if (existing) {
          const { error: e } = await supabase.from("stock_received_items")
            .update({
              process_rec: Number(existing.process_rec || 0) + addP,
              finish_rec: Number(existing.finish_rec || 0) + addF,
            })
            .eq("id", existing.id);
          if (e) { alert("Could not update: " + e.message); return; }
          // update local copy so a second row targeting the same quality stacks correctly
          existing.process_rec = Number(existing.process_rec || 0) + addP;
          existing.finish_rec = Number(existing.finish_rec || 0) + addF;
        } else {
          const { data, error: e } = await supabase.from("stock_received_items").insert([{
            stock_received_id: month.id,
            quality: r.quality.trim(),
            process_rec: addP,
            finish_rec: addF,
          }]).select().single();
          if (e) { alert("Could not add: " + e.message); return; }
          // add to local copy so duplicates within this batch merge
          if (data) (month.stock_received_items = month.stock_received_items || []).push(data);
        }
      }
      setAddingTo(null);
      setAddRows([{ quality: "", process_rec: "", finish_rec: "" }]);
      fetchMonths();
    } finally {
      setSaving(false);
    }
  };
  const addAnotherAddRow = () => setAddRows((p) => [...p, { quality: "", process_rec: "", finish_rec: "" }]);
  const removeAddRow = (i) => setAddRows((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));
  const changeAddRow = (i, f, v) => setAddRows((p) => p.map((r, idx) => (idx === i ? { ...r, [f]: v } : r)));

  const handleDelete = async (id) => {
    if (!confirm("Delete this month and all its lines?")) return;
    const { error: dbError } = await supabase.from("stock_received").delete().eq("id", id);
    if (dbError) { alert("Could not delete: " + dbError.message); return; }
    setMonths((p) => p.filter((m) => m.id !== id));
  };

  const totalProcess = (m) => (m.stock_received_items || []).reduce((s, it) => s + Number(it.process_rec || 0), 0);
  const totalFinish = (m) => (m.stock_received_items || []).reduce((s, it) => s + Number(it.finish_rec || 0), 0);

  const filtered = months
    .filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        monthLabel(m.period_date).toLowerCase().includes(q) ||
        (m.stock_received_items || []).some((it) => (it.quality || "").toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case "date": valA = new Date(a.period_date).getTime(); valB = new Date(b.period_date).getTime(); break;
        case "process": valA = totalProcess(a); valB = totalProcess(b); break;
        case "finish": valA = totalFinish(a); valB = totalFinish(b); break;
        case "shrink": valA = shrink(totalProcess(a), totalFinish(a)); valB = shrink(totalProcess(b), totalFinish(b)); break;
        default: return 0;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const grandProcess = filtered.reduce((s, m) => s + totalProcess(m), 0);
  const grandFinish = filtered.reduce((s, m) => s + totalFinish(m), 0);
  const grandShrink = shrink(grandProcess, grandFinish);

  const inputCls = "w-full bg-[#020817] border border-[#1a2233] rounded-lg px-3 py-2 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition";
  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };

  // live preview totals for the form
  const formProcess = items.reduce((s, it) => s + num(it.process_rec), 0);
  const formFinish = items.reduce((s, it) => s + num(it.finish_rec), 0);

  const exportFileName = (ext) => `saikripa-stock-${new Date().toISOString().slice(0, 10)}.${ext}`;

  const exportToExcel = () => {
    if (filtered.length === 0) { alert("No records to export. Try clearing your filters."); return; }

    const rows = [];
    const merges = [];
    let r = 1; // row 0 = header

    // columns to merge per month:
    // 0 Month, 5 Month Total Process, 6 Month Total Finish, 7 Month Shrinkage %, 8 Notes
    const mergeCols = [0, 5, 6, 7, 8];

    filtered.forEach((m) => {
      const lines = m.stock_received_items || [];
      const tP = totalProcess(m);
      const tF = totalFinish(m);
      const n = Math.max(1, lines.length);
      const startRow = r;

      if (lines.length === 0) {
        rows.push({
          Month: monthLabel(m.period_date),
          Quality: "(no lines)",
          "Process Rec.": "", "Finish Rec.": "", "Shrinkage %": "",
          "Month Total Process": tP.toFixed(2),
          "Month Total Finish": tF.toFixed(2),
          "Month Shrinkage %": shrink(tP, tF).toFixed(2),
          Notes: m.notes || "",
        });
        r += 1;
      } else {
        lines.forEach((it) => {
          rows.push({
            Month: monthLabel(m.period_date),
            Quality: it.quality,
            "Process Rec.": Number(it.process_rec || 0).toFixed(2),
            "Finish Rec.": Number(it.finish_rec || 0).toFixed(2),
            "Shrinkage %": shrink(it.process_rec, it.finish_rec).toFixed(2),
            "Month Total Process": tP.toFixed(2),
            "Month Total Finish": tF.toFixed(2),
            "Month Shrinkage %": shrink(tP, tF).toFixed(2),
            Notes: m.notes || "",
          });
        });
        r += lines.length;
      }

      if (n > 1) {
        mergeCols.forEach((c) => {
          merges.push({ s: { r: startRow, c }, e: { r: startRow + n - 1, c } });
        });
      }
    });

    rows.push({
      Month: "GRAND TOTAL",
      Quality: filtered.length + " months",
      "Process Rec.": grandProcess.toFixed(2),
      "Finish Rec.": grandFinish.toFixed(2),
      "Shrinkage %": grandShrink.toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 25 }, { wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }];
    ws["!merges"] = merges;

    merges.forEach((mg) => {
      const addr = XLSX.utils.encode_cell({ r: mg.s.r, c: mg.s.c });
      if (ws[addr]) {
        ws[addr].s = { alignment: { horizontal: "center", vertical: "center" } };
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Received");
    XLSX.writeFile(wb, exportFileName("xlsx"));
  };

  const exportToPDF = () => {
    if (filtered.length === 0) { alert("No records to export. Try clearing your filters."); return; }
    const doc = new jsPDF("landscape");
    doc.setFontSize(14); doc.setTextColor(40, 40, 40);
    doc.text("SAIKRIPA TEXTILES — Stock Received", 14, 15);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}  |  ${filtered.length} months`, 14, 21);
    const body = [];
    filtered.forEach((m) => {
      const lines = m.stock_received_items || [];
      const tP = totalProcess(m);
      const tF = totalFinish(m);
      if (lines.length === 0) {
        body.push([monthLabel(m.period_date), "(no lines)", "", "", "", "", "", ""]);
      } else {
        lines.forEach((it, i) => {
          body.push([
            i === 0 ? monthLabel(m.period_date) : "",
            it.quality,
            fmtNum(it.process_rec),
            fmtNum(it.finish_rec),
            shrink(it.process_rec, it.finish_rec).toFixed(2) + "%",
            i === 0 ? fmtNum(tP) : "",
            i === 0 ? fmtNum(tF) : "",
            i === 0 ? shrink(tP, tF).toFixed(2) + "%" : "",
          ]);
        });
      }
    });
    autoTable(doc, {
      startY: 26,
      head: [["Month", "Quality", "Process", "Finish", "Shrink %", "Month Total Process", "Month Total Finish", "Month Shrink %"]],
      body,
      foot: [["GRAND TOTAL", filtered.length + " months",
        fmtNum(grandProcess), fmtNum(grandFinish),
        grandShrink.toFixed(2) + "%", "", "", ""]],
      headStyles: { fillColor: [212, 175, 55], textColor: [2, 8, 23], fontStyle: "bold", fontSize: 8 },
      footStyles: { fillColor: [10, 17, 36], textColor: [212, 175, 55], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" } },
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
          <p className="text-[10px] text-[#7a8499] tracking-[0.35em] uppercase mt-1 font-medium">Stock Received</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#f4d77a] via-[#d4af37] to-[#a8842c]" />
            <div>
              <h2 className="text-4xl font-bold tracking-tight" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f4d77a 60%, #d4af37 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Stock Received</h2>
              <p className="text-xs text-[#7a8499] mt-2 uppercase tracking-[0.25em] font-medium">Monthly process vs finish — shrinkage</p>
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
              {showForm ? "Close Form" : "+ New Month"}
            </button>
          </div>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm mb-4">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#0a1124] rounded-xl p-6 mb-6 border border-[#d4af37]/30" style={goldGlow}>
            <h3 className="font-bold text-white text-lg mb-5">{editingId ? "Edit Month" : "New Month"}</h3>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Month</label>
                <input type="date" value={form.period_date} onChange={(e) => handleFormChange("period_date", e.target.value)} className={inputCls + " [color-scheme:dark]"} />
                <p className="text-[10px] text-[#7a8499] mt-1">Pick any day in the month — display shows month &amp; year.</p>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => handleFormChange("notes", e.target.value)} placeholder="Optional" className={inputCls} />
              </div>
            </div>

            <div className="border-t border-[#1a2233] pt-5 mb-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">Quality lines</h4>
                <button type="button" onClick={addItem} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] transition uppercase tracking-wider">+ Add quality</button>
              </div>
              <div className="space-y-3">
                {items.map((it, idx) => {
                  const sh = shrink(it.process_rec, it.finish_rec);
                  return (
                    <div key={idx} className="bg-[#020817] border border-[#1a2233] rounded-lg p-4 grid sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Quality</label>
                        <Autocomplete value={it.quality} onChange={(v) => handleItemChange(idx, "quality", v)} suggestions={qualityOptions} placeholder="e.g. Superior Collection" className={inputCls} />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Process Rec.</label>
                        <input type="number" step="0.01" value={it.process_rec} onChange={(e) => handleItemChange(idx, "process_rec", e.target.value)} placeholder="0" className={inputCls} />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Finish Rec.</label>
                        <input type="number" step="0.01" value={it.finish_rec} onChange={(e) => handleItemChange(idx, "finish_rec", e.target.value)} placeholder="0" className={inputCls} />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <label className="block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2">Shrink</label>
                        <span className="text-sm font-mono text-[#d4af37]">{(it.process_rec || it.finish_rec) ? sh.toFixed(2) + "%" : "—"}</span>
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-rose-400 hover:text-rose-300 text-xl font-bold w-8 h-8 flex items-center justify-center" aria-label="Remove">×</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* live month total */}
            <div className="bg-gradient-to-br from-[#0d1530] to-[#0a1124] rounded-lg p-5 mt-5 mb-5 border border-[#d4af37]/30" style={goldGlow}>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7a8499] mb-1">Process Rec.</p>
                  <p className="text-xl font-bold text-white tracking-tight">{fmtNum(formProcess)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7a8499] mb-1">Finish Rec.</p>
                  <p className="text-xl font-bold text-white tracking-tight">{fmtNum(formFinish)}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37] mb-1">Shrinkage</p>
                  <p className="text-2xl font-bold text-[#d4af37] tracking-tight">{formProcess ? shrink(formProcess, formFinish).toFixed(2) + "%" : "—"}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Saving..." : (editingId ? "Update Month" : "Save Month")}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="bg-[#020817] border border-[#1a2233] text-[#a8b0c0] px-6 py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider hover:border-[#d4af37]/40 hover:text-[#e8edf5] transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="bg-[#0a1124] rounded-xl p-4 mb-6 border border-[#1a2233] flex gap-3 items-center flex-wrap">
          <input type="text" placeholder="Search by month or quality..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[200px] bg-[#020817] border border-[#1a2233] rounded-lg px-4 py-2.5 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition" />
          <div className="flex items-center gap-1 bg-[#020817] border border-[#1a2233] rounded-lg overflow-hidden">
            <span className="text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] px-3">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs font-bold py-2 pr-2 focus:outline-none bg-[#020817] text-[#e8edf5] cursor-pointer">
              <option value="date">Month</option>
              <option value="process">Process Rec.</option>
              <option value="finish">Finish Rec.</option>
              <option value="shrink">Shrinkage</option>
            </select>
            <button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")} className="text-sm font-bold px-3 py-2 text-[#d4af37] hover:bg-[#0a1124] transition border-l border-[#1a2233]" title={sortDir === "asc" ? "Ascending" : "Descending"}>
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <button onClick={fetchMonths} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] whitespace-nowrap transition uppercase tracking-wider">Refresh</button>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
              <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Total Process Rec.</p>
              <p className="text-3xl font-bold text-white mt-3 tracking-tight">{fmtNum(grandProcess)}</p>
            </div>
            <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
              <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Total Finish Rec.</p>
              <p className="text-3xl font-bold text-white mt-3 tracking-tight">{fmtNum(grandFinish)}</p>
            </div>
            <div className="rounded-xl p-5 bg-gradient-to-br from-[#0d1530] to-[#0a1124] relative overflow-hidden" style={goldGlow}>
              <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(212, 175, 55, 0.4) 0%, transparent 60%)" }} />
              <p className="text-[10px] text-[#d4af37]/70 uppercase tracking-[0.3em] font-medium relative">Overall Shrinkage</p>
              <p className="text-3xl font-bold text-[#d4af37] mt-3 tracking-tight relative">{grandShrink.toFixed(2)}%</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-[#7a8499]">Loading stock received...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#0a1124] rounded-xl p-12 text-center text-[#7a8499] border border-[#1a2233]">No stock received records yet.</div>
        ) : (
          <div className="bg-[#0a1124] rounded-xl border border-[#1a2233] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#020817] border-b border-[#1a2233]">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Month</th>
                    <th className="text-left px-4 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Quality</th>
                    <th className="text-right px-4 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Process Rec.</th>
                    <th className="text-right px-4 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Finish Rec.</th>
                    <th className="text-right px-4 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Shrinkage</th>
                    <th className="text-center px-4 py-3 font-bold text-[10px] text-[#7a8499] uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const lines = m.stock_received_items || [];
                    const tP = totalProcess(m);
                    const tF = totalFinish(m);
                    const rowCount = lines.length + 1; // +1 for total row
                    return (
                      <React.Fragment key={m.id}>
                        {lines.map((it, i) => (
                          <tr key={it.id} className="border-t border-[#1a2233] hover:bg-[#020817]/40 transition">
                            {i === 0 && (
                              <td rowSpan={rowCount} className="px-4 py-3 align-middle text-center font-bold text-white border-r border-[#1a2233] bg-[#020817]/30">
                                {monthLabel(m.period_date)}
                              </td>
                            )}
                            <td className="px-4 py-2.5 text-[#e8edf5]">{it.quality}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-[#a8b0c0]">{fmtNum(it.process_rec)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-[#a8b0c0]">{fmtNum(it.finish_rec)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-[#a8b0c0]">{shrink(it.process_rec, it.finish_rec).toFixed(2)}%</td>
                            {i === 0 && (
                              <td rowSpan={rowCount} className="px-4 py-3 align-middle text-center whitespace-nowrap border-l border-[#1a2233]">
                                <button onClick={() => { setAddingTo(addingTo === m.id ? null : m.id); setAddRows([{ quality: "", process_rec: "", finish_rec: "" }]); }} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 mr-3 transition">+ Add</button>
                                <button onClick={() => startEdit(m)} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] mr-3 transition">Edit</button>
                                <button onClick={() => handleDelete(m.id)} className="text-xs font-medium text-rose-400 hover:text-rose-300 transition">Delete</button>
                              </td>
                            )}
                          </tr>
                        ))}
                        <tr className="border-t-2 border-[#d4af37]/40 bg-[#0d1530]/40">
                          <td className="px-4 py-2.5 text-right text-[#d4af37] font-bold uppercase tracking-[0.2em] text-[11px]">Total</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-[#d4af37]">{fmtNum(tP)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-[#d4af37]">{fmtNum(tF)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-[#d4af37]">{shrink(tP, tF).toFixed(2)}%</td>
                          <td></td>
                        </tr>
                     {addingTo === m.id && (
                          <tr className="bg-[#020817]/80 border-t border-emerald-500/30">
                            <td></td>
                            <td colSpan={5} className="px-4 py-3">
                              <div className="space-y-2">
                                {addRows.map((r, ri) => (
                                  <div key={ri} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-5">
                                      <Autocomplete value={r.quality} onChange={(v) => changeAddRow(ri, "quality", v)} suggestions={qualityOptions} placeholder="Quality" className={inputCls} />
                                    </div>
                                    <div className="col-span-3">
                                      <input type="number" step="0.01" value={r.process_rec} onChange={(e) => changeAddRow(ri, "process_rec", e.target.value)} placeholder="+ Process" className={inputCls} />
                                    </div>
                                    <div className="col-span-3">
                                      <input type="number" step="0.01" value={r.finish_rec} onChange={(e) => changeAddRow(ri, "finish_rec", e.target.value)} placeholder="+ Finish" className={inputCls} />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                      {addRows.length > 1 && (
                                        <button onClick={() => removeAddRow(ri)} className="text-rose-400 hover:text-rose-300 text-lg font-bold" aria-label="Remove">×</button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between pt-1">
                                  <button onClick={addAnotherAddRow} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] transition uppercase tracking-wider">+ Add another quality</button>
                                  <div className="whitespace-nowrap">
                                    <button onClick={() => submitAdd(m)} disabled={saving} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 mr-3 transition uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">{saving ? "Saving..." : "Save"}</button>
                                    <button onClick={() => setAddingTo(null)} className="text-xs font-medium text-[#7a8499] hover:text-[#e8edf5] transition">Cancel</button>
                                  </div>
                                </div>
                              </div>
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