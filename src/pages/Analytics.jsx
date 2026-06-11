import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";

const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const inrShort = (n) => {
  if (!n) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};

const STACK_COLORS = ["#d4af37", "#7a8499", "#a8842c", "#34d399", "#60a5fa", "#f59e0b", "#a855f7", "#ec4899", "#10b981", "#3b82f6"];

const BREAKDOWN_MAP = {
  agency: { by: "quality", label: "Fabric" },
  party: { by: "quality", label: "Fabric" },
  fabric: { by: "party", label: "Party" },
};

export default function Analytics() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const [measure, setMeasure] = useState("revenue");
  const [groupBy, setGroupBy] = useState("monthly");
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [fabricFilter, setFabricFilter] = useState("all");
  const [saleTypeFilter, setSaleTypeFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [partyFilter, setPartyFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (partyFilter !== "all" || agencyFilter !== "all") setGroupBy("fabric");
  }, [partyFilter, agencyFilter]);

  useEffect(() => {
    if (saleTypeFilter === "Direct" && agencyFilter !== "all") setAgencyFilter("all");
  }, [saleTypeFilter]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/admin/login", { replace: true }); return; }
      setUserEmail(data.session.user.email);
      await fetchData();
    };
    init();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error: dbError } = await supabase.from("sales_records").select("*, bill_items(*)").order("bill_date", { ascending: true });
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setBills(data || []);
  };

  const allRows = useMemo(() => {
    const r = [];
    bills.forEach((b) => {
      (b.bill_items || []).forEach((it) => {
        r.push({
          bill_id: b.id, bill_date: b.bill_date, bill_number: b.bill_number,
          party: b.party, sale_type: b.sale_type, agency_name: b.agency_name,
          quality: it.quality, meter: Number(it.meter || 0), amount: Number(it.amount || 0),
        });
      });
    });
    return r;
  }, [bills]);

  const fabricOptions = useMemo(() => Array.from(new Set(allRows.map(r => r.quality).filter(Boolean))).sort(), [allRows]);
  const agencyOptions = useMemo(() => Array.from(new Set(bills.filter(b => b.sale_type === "Agency" && b.agency_name).map(b => b.agency_name))).sort(), [bills]);
  const partyOptions = useMemo(() => Array.from(new Set(bills.map(b => b.party).filter(Boolean))).sort(), [bills]);

  const filteredRows = useMemo(() => allRows.filter(r => {
    if (fabricFilter !== "all" && r.quality !== fabricFilter) return false;
    if (saleTypeFilter !== "all" && r.sale_type !== saleTypeFilter) return false;
    if (agencyFilter !== "all" && r.agency_name !== agencyFilter) return false;
    if (partyFilter !== "all" && r.party !== partyFilter) return false;
    if (fromDate && r.bill_date < fromDate) return false;
    if (toDate && r.bill_date > toDate) return false;
    return true;
  }), [allRows, fabricFilter, saleTypeFilter, agencyFilter, partyFilter, fromDate, toDate]);

  const getRowKey = (r, gb) => {
    const d = new Date(r.bill_date);
    switch (gb) {
      case "daily": return r.bill_date;
      case "monthly": return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      case "yearly": return String(d.getFullYear());
      case "fabric": return r.quality || "Unknown";
      case "agency": return r.sale_type === "Direct" ? "Direct (no agency)" : (r.agency_name || "Unknown");
      case "party": return r.party || "Unknown";
      default: return "all";
    }
  };

  const getRowLabel = (r, gb) => {
    const d = new Date(r.bill_date);
    switch (gb) {
      case "daily": return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      case "monthly": return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      case "yearly": return String(d.getFullYear());
      case "agency": return r.sale_type === "Direct" ? "Direct" : (r.agency_name || "Unknown");
      default: return getRowKey(r, gb);
    }
  };

  const breakdownConfig = BREAKDOWN_MAP[groupBy];
  const useBreakdown = !!breakdownConfig && showBreakdown;

  const chartData = useMemo(() => {
    if (useBreakdown) {
      const groupMap = {};
      filteredRows.forEach((r) => {
        const key = getRowKey(r, groupBy);
        const label = getRowLabel(r, groupBy);
        const bdKey = r[breakdownConfig.by] || "Unknown";
        const val = r[measure === "revenue" ? "amount" : measure === "meters" ? "meter" : null];
        if (!groupMap[key]) groupMap[key] = { key, label, _total: 0, _billSet: new Set() };
        if (measure === "bills") {
          if (!groupMap[key][bdKey]) groupMap[key][bdKey] = new Set();
          groupMap[key][bdKey].add(r.bill_id);
          groupMap[key]._billSet.add(r.bill_id);
        } else {
          groupMap[key][bdKey] = (groupMap[key][bdKey] || 0) + val;
          groupMap[key]._total += val;
        }
      });
      Object.values(groupMap).forEach((g) => {
        if (measure === "bills") {
          Object.keys(g).forEach((k) => { if (g[k] instanceof Set) g[k] = g[k].size; });
          g._total = g._billSet.size;
        }
        delete g._billSet;
      });
      let arr = Object.values(groupMap);
      arr.sort((a, b) => b._total - a._total);
      if (arr.length > 12) arr = arr.slice(0, 12);
      const bdTotals = {};
      arr.forEach((g) => Object.keys(g).forEach((k) => { if (k !== "key" && k !== "label" && k !== "_total") bdTotals[k] = (bdTotals[k] || 0) + g[k]; }));
      let bdKeys = Object.keys(bdTotals).sort((a, b) => bdTotals[b] - bdTotals[a]);
      if (bdKeys.length > 8) {
        const top8 = bdKeys.slice(0, 8);
        const others = bdKeys.slice(8);
        arr = arr.map((g) => {
          let othersSum = 0;
          others.forEach((k) => { othersSum += g[k] || 0; delete g[k]; });
          if (othersSum > 0) g["Others"] = othersSum;
          return g;
        });
        bdKeys = [...top8, "Others"];
      }
      arr.forEach((g) => bdKeys.forEach((k) => { if (!(k in g)) g[k] = 0; }));
      return { arr, bdKeys };
    }
    const map = {};
    filteredRows.forEach((r) => {
      const key = getRowKey(r, groupBy);
      const label = getRowLabel(r, groupBy);
      if (!map[key]) map[key] = { key, label, revenue: 0, meters: 0, bills: new Set() };
      map[key].revenue += r.amount;
      map[key].meters += r.meter;
      map[key].bills.add(r.bill_id);
    });
    let arr = Object.values(map).map((m) => ({ key: m.key, label: m.label, revenue: m.revenue, meters: m.meters, bills: m.bills.size }));
    const isTime = groupBy === "daily" || groupBy === "monthly" || groupBy === "yearly";
    if (isTime) arr.sort((a, b) => a.key.localeCompare(b.key));
    else {
      arr.sort((a, b) => b[measure] - a[measure]);
      if (arr.length > 15) {
        const top = arr.slice(0, 15);
        const others = arr.slice(15).reduce((acc, x) => ({ key: "_other", label: `Others (${arr.length - 15})`, revenue: acc.revenue + x.revenue, meters: acc.meters + x.meters, bills: acc.bills + x.bills }), { revenue: 0, meters: 0, bills: 0 });
        arr = [...top, others];
      }
    }
    return arr;
  }, [filteredRows, groupBy, measure, useBreakdown, breakdownConfig]);

  const totals = useMemo(() => {
    const billSet = new Set();
    let revenue = 0, meters = 0;
    filteredRows.forEach((r) => { revenue += r.amount; meters += r.meter; billSet.add(r.bill_id); });
    return { revenue, meters, bills: billSet.size };
  }, [filteredRows]);

  const isTimeChart = groupBy === "daily" || groupBy === "monthly" || groupBy === "yearly";
  const measureLabel = measure === "revenue" ? "Revenue" : measure === "meters" ? "Meters" : "Bills";
  const tooltipFormatter = (value) => measure === "revenue" ? inr(value) : measure === "meters" ? `${Number(value).toFixed(2)} m` : `${value} bills`;
  const yAxisFormatter = measure === "revenue" ? inrShort : undefined;

  const resetFilters = () => {
    setMeasure("revenue"); setGroupBy("monthly"); setShowBreakdown(true);
    setFabricFilter("all"); setSaleTypeFilter("all"); setAgencyFilter("all");
    setPartyFilter("all"); setFromDate(""); setToDate("");
  };

  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };
  const selectCls = "w-full bg-[#020817] border border-[#1a2233] rounded-lg px-3 py-2 text-sm text-[#e8edf5] focus:outline-none focus:border-[#d4af37]/60 transition cursor-pointer";

  if (loading) return <div className="min-h-screen bg-[#020817] flex items-center justify-center"><p className="text-[#7a8499]">Loading analytics...</p></div>;

  return (
    <div className="min-h-screen bg-[#020817] text-[#e8edf5] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-50" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 70%)" }} />

      <header className="relative border-b border-[#1a2233]/80 backdrop-blur-xl bg-[#020817]/80 sticky top-0 z-40">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-[0.2em] uppercase" style={{ background: "linear-gradient(135deg, #f4d77a 0%, #d4af3750%, #a8842c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Saikripa Textiles</h1>
            <p className="text-[10px] text-[#7a8499] tracking-[0.35em] uppercase mt-1 font-medium">Analytics</p>
          </div>
          <button onClick={fetchData} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] uppercase tracking-wider transition">Refresh</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="mb-8">
          <h2 className="text-4xl font-bold tracking-tight text-white">Business Analytics</h2>
          <p className="text-xs text-[#7a8499] mt-2 uppercase tracking-[0.25em] font-medium">Use the controls below to slice your data</p>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm mb-4">{error}</div>}

        {bills.length === 0 ? (
          <div className="bg-[#0a1124] rounded-xl p-12 text-center text-[#7a8499] border border-[#1a2233]">No sales records yet.</div>
        ) : (
          <>
            <div className="bg-[#0a1124] rounded-xl p-5 mb-5 border border-[#1a2233]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Filters</h3>
                <button onClick={resetFilters} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] uppercase tracking-wider transition">Reset all</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Show">
                  <select value={measure} onChange={(e) => setMeasure(e.target.value)} className={selectCls}>
                    <option value="revenue">Revenue</option>
                    <option value="meters">Meters Sold</option>
                    <option value="bills">Number of Bills</option>
                  </select>
                </Field>
                <Field label="Group by">
                  <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className={selectCls}>
                    <optgroup label="Time"><option value="daily">Daily</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></optgroup>
                    <optgroup label="Category"><option value="fabric">By Fabric</option><option value="agency">By Agency</option><option value="party">By Party</option></optgroup>
                  </select>
                </Field>
                <Field label="Fabric">
                  <select value={fabricFilter} onChange={(e) => setFabricFilter(e.target.value)} className={selectCls}>
                    <option value="all">All Fabrics</option>
                    {fabricOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Sale Type">
                  <select value={saleTypeFilter} onChange={(e) => setSaleTypeFilter(e.target.value)} className={selectCls}>
                    <option value="all">All</option>
                    <option value="Direct">Direct only</option>
                    <option value="Agency">Agency only</option>
                  </select>
                </Field>
                {partyFilter === "all" && saleTypeFilter !== "Direct" && (
                  <Field label="Agency">
                    <select value={agencyFilter} onChange={(e) => setAgencyFilter(e.target.value)} className={selectCls}>
                      <option value="all">All Agencies</option>
                      {agencyOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </Field>
                )}
                {agencyFilter === "all" && (
                  <Field label="Party">
                    <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)} className={selectCls}>
                      <option value="all">All Parties</option>
                      {partyOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="From Date">
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={selectCls + " [color-scheme:dark]"} />
                </Field>
                <Field label="To Date">
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={selectCls + " [color-scheme:dark]"} />
                </Field>
              </div>
              {breakdownConfig && (
                <div className="mt-4 pt-4 border-t border-[#1a2233] flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showBreakdown} onChange={(e) => setShowBreakdown(e.target.checked)} className="w-4 h-4 accent-[#d4af37]" />
                    <span className="text-sm font-bold text-white">Break down by {breakdownConfig.label}</span>
                    <span className="text-xs text-[#7a8499]">(see what each {groupBy === "agency" ? "agency" : groupBy === "party" ? "party" : "fabric"} contains)</span>
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl p-5 bg-gradient-to-br from-[#0d1530] to-[#0a1124] relative overflow-hidden" style={goldGlow}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(212, 175, 55, 0.4) 0%, transparent 60%)" }} />
                <p className="text-[10px] text-[#d4af37]/70 uppercase tracking-[0.3em] font-medium relative">Total Revenue</p>
                <p className="text-3xl font-bold text-[#d4af37] mt-3 tracking-tight relative">{inr(totals.revenue)}</p>
              </div>
              <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
                <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Total Meters</p>
                <p className="text-3xl font-bold text-white mt-3 tracking-tight">{totals.meters.toFixed(2)}</p>
              </div>
              <div className="bg-[#0a1124] rounded-xl p-5 border border-[#1a2233]">
                <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.3em] font-medium">Bills</p>
                <p className="text-3xl font-bold text-white mt-3 tracking-tight">{totals.bills}</p>
              </div>
            </div>

            <div className="bg-[#0a1124] rounded-xl p-6 border border-[#1a2233]">
              <div className="mb-4">
                <h3 className="font-bold text-white text-lg">{measureLabel} {isTimeChart ? "Over Time" : `by ${groupBy === "fabric" ? "Fabric" : groupBy === "agency" ? "Agency" : "Party"}`}{useBreakdown && <span className="text-[#7a8499] font-normal"> · stacked by {breakdownConfig.label}</span>}</h3>
                <p className="text-[10px] text-[#7a8499] uppercase tracking-[0.25em] font-medium mt-1">
                  {useBreakdown ? `${chartData.arr.length} groups · ${chartData.bdKeys.length} segments` : `${chartData.length} data points${!isTimeChart && chartData.length >= 15 ? " · top 15 + others" : ""}`}
                </p>
              </div>
              {useBreakdown ? (
                chartData.arr.length === 0 ? <div className="py-16 text-center text-[#7a8499] text-sm">No data matches your filters.</div> : (
                  <ResponsiveContainer width="100%" height={Math.max(400, chartData.arr.length * 45)}>
                    <BarChart data={chartData.arr} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2233" />
                      <XAxis type="number" stroke="#7a8499" style={{ fontSize: 11 }} tickFormatter={yAxisFormatter} />
                      <YAxis dataKey="label" type="category" stroke="#7a8499" style={{ fontSize: 11 }} width={150} />
                      <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: 12, border: "1px solid #1a2233", backgroundColor: "#0a1124", color: "#e8edf5" }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: "#a8b0c0" }} />
                      {chartData.bdKeys.map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={STACK_COLORS[i % STACK_COLORS.length]} />)}
                    </BarChart>
                  </ResponsiveContainer>
                )
              ) : chartData.length === 0 ? <div className="py-16 text-center text-[#7a8499] text-sm">No data matches your filters.</div>
                : isTimeChart ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2233" />
                      <XAxis dataKey="label" stroke="#7a8499" style={{ fontSize: 11 }} />
                      <YAxis stroke="#7a8499" style={{ fontSize: 11 }} tickFormatter={yAxisFormatter} />
                      <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: 12, border: "1px solid #1a2233", backgroundColor: "#0a1124", color: "#e8edf5" }} />
                      <Line type="monotone" dataKey={measure} stroke="#d4af37" strokeWidth={3} dot={{ fill: "#d4af37", r: 4 }} activeDot={{ r: 7 }} name={measureLabel} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 35)}>
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2233" />
                      <XAxis type="number" stroke="#7a8499" style={{ fontSize: 11 }} tickFormatter={yAxisFormatter} />
                      <YAxis dataKey="label" type="category" stroke="#7a8499" style={{ fontSize: 11 }} width={150} />
                      <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: 12, border: "1px solid #1a2233", backgroundColor: "#0a1124", color: "#e8edf5" }} />
                      <Bar dataKey={measure} fill="#d4af37" radius={[0, 8, 8, 0]} name={measureLabel} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </div>

            {(useBreakdown ? chartData.arr.length > 0 : chartData.length > 0) && (
              <div className="bg-[#0a1124] rounded-xl p-6 mt-5 border border-[#1a2233]">
                <h3 className="font-bold text-white text-lg mb-3">Data Behind the Chart</h3>
                <div className="overflow-x-auto">
                  {useBreakdown ? (
                    <table className="w-full text-sm">
                      <thead className="text-[#7a8499] uppercase tracking-[0.25em] text-xs">
                        <tr className="border-b border-[#1a2233]">
                          <th className="text-left font-medium py-2">{groupBy === "fabric" ? "Fabric" : groupBy === "agency" ? "Agency" : "Party"}</th>
                          {chartData.bdKeys.map((k) => <th key={k} className="text-right font-medium py-2 px-2 whitespace-nowrap">{k}</th>)}
                          <th className="text-right font-medium py-2 px-2 text-[#d4af37]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.arr.map((row, i) => (
                          <tr key={i} className="border-b border-[#1a2233]/60 hover:bg-[#020817]/40">
                            <td className="py-2 font-semibold text-[#e8edf5]">{row.label}</td>
                            {chartData.bdKeys.map((k) => (
                              <td key={k} className="py-2 text-right font-mono text-[#a8b0c0] px-2">{row[k] === 0 ? "—" : (measure === "revenue" ? inr(row[k]) : measure === "meters" ? Number(row[k]).toFixed(2) : row[k])}</td>
                            ))}
                            <td className="py-2 text-right font-mono font-bold text-[#d4af37] px-2">{measure === "revenue" ? inr(row._total) : measure === "meters" ? Number(row._total).toFixed(2) : row._total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-[#7a8499] uppercase tracking-[0.25em] text-xs">
                        <tr className="border-b border-[#1a2233]">
                          <th className="text-left font-medium py-2">{isTimeChart ? "Period" : "Item"}</th>
                          <th className="text-right font-medium py-2">Revenue</th>
                          <th className="text-right font-medium py-2">Meters</th>
                          <th className="text-right font-medium py-2">Bills</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((d, i) => (
                          <tr key={i} className="border-b border-[#1a2233]/60 hover:bg-[#020817]/40">
                            <td className="py-2 font-semibold text-[#e8edf5]">{d.label}</td>
                            <td className="py-2 text-right font-mono text-[#a8b0c0]">{inr(d.revenue)}</td>
                            <td className="py-2 text-right font-mono text-[#a8b0c0]">{d.meters.toFixed(2)}</td>
                            <td className="py-2 text-right font-mono text-[#a8b0c0]">{d.bills}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
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