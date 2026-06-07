import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";

const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const inrShort = (n) => {
  if (!n) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};

// Color palette for stacked segments — readable on white, enough distinct colors
const STACK_COLORS = [
  "#d4af37", "#081225", "#7a6015", "#c6a55c", "#0f1f63",
  "#25d366", "#1ebe5d", "#aa8c2c", "#0a163d", "#b8943a",
  "#5d4a10", "#e5c462", "#1a3380", "#8ba43f", "#cc6633",
];

// Which "Group by" values support a fabric/party breakdown
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

  // Auto-switch Group by when a specific party or agency is selected
  useEffect(() => {
    if (partyFilter !== "all" || agencyFilter !== "all") {
      setGroupBy("fabric");
    }
  }, [partyFilter, agencyFilter]);
  // Reset agency filter when switching to Direct-only mode (agencies don't apply)
  useEffect(() => {
    if (saleTypeFilter === "Direct" && agencyFilter !== "all") {
      setAgencyFilter("all");
    }
  }, [saleTypeFilter]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setUserEmail(data.session.user.email);
      await fetchData();
    };
    init();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("sales_records")
      .select("*, bill_items(*)")
      .order("bill_date", { ascending: true });
    setLoading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setBills(data || []);
  };

  const allRows = useMemo(() => {
    const r = [];
    bills.forEach((b) => {
      (b.bill_items || []).forEach((it) => {
        r.push({
          bill_id: b.id,
          bill_date: b.bill_date,
          bill_number: b.bill_number,
          party: b.party,
          sale_type: b.sale_type,
          agency_name: b.agency_name,
          quality: it.quality,
          meter: Number(it.meter || 0),
          amount: Number(it.amount || 0),
        });
      });
    });
    return r;
  }, [bills]);

  const fabricOptions = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => r.quality && set.add(r.quality));
    return Array.from(set).sort();
  }, [allRows]);

  const agencyOptions = useMemo(() => {
    const set = new Set();
    bills.forEach((b) => {
      if (b.sale_type === "Agency" && b.agency_name) set.add(b.agency_name);
    });
    return Array.from(set).sort();
  }, [bills]);

  const partyOptions = useMemo(() => {
    const set = new Set();
    bills.forEach((b) => b.party && set.add(b.party));
    return Array.from(set).sort();
  }, [bills]);

  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      if (fabricFilter !== "all" && r.quality !== fabricFilter) return false;
      if (saleTypeFilter !== "all" && r.sale_type !== saleTypeFilter) return false;
      if (agencyFilter !== "all" && r.agency_name !== agencyFilter) return false;
      if (partyFilter !== "all" && r.party !== partyFilter) return false;
      if (fromDate && r.bill_date < fromDate) return false;
      if (toDate && r.bill_date > toDate) return false;
      return true;
    });
  }, [allRows, fabricFilter, saleTypeFilter, agencyFilter, partyFilter, fromDate, toDate]);

  // Map row to its "key" given the current groupBy
  const getRowKey = (r, gb) => {
    const d = new Date(r.bill_date);
    switch (gb) {
      case "daily": return r.bill_date;
      case "monthly": return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      case "yearly": return String(d.getFullYear());
      case "fabric": return r.quality || "Unknown";
      case "agency":
        if (r.sale_type === "Direct") return "Direct (no agency)";
        return r.agency_name || "Unknown";
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
      case "agency":
        if (r.sale_type === "Direct") return "Direct";
        return r.agency_name || "Unknown";
      default: return getRowKey(r, gb);
    }
  };

  // Stacked breakdown chart data — only when groupBy is categorical AND showBreakdown is on
  const breakdownConfig = BREAKDOWN_MAP[groupBy];
  const useBreakdown = !!breakdownConfig && showBreakdown;

  const chartData = useMemo(() => {
    if (useBreakdown) {
      // Build a row per group key with one column per breakdown value
      // e.g. { key: "AgencyA", label: "AgencyA", "Superior": 12000, "Gold Club": 8000, _total: 20000 }
      const groupMap = {};
      filteredRows.forEach((r) => {
        const key = getRowKey(r, groupBy);
        const label = getRowLabel(r, groupBy);
        const bdKey = r[breakdownConfig.by] || "Unknown";
        const val = r[measure === "revenue" ? "amount" : measure === "meters" ? "meter" : null];
        if (!groupMap[key]) {
          groupMap[key] = { key, label, _total: 0, _billSet: new Set() };
        }
        if (measure === "bills") {
          // For bill count, dedupe bills first
          if (!groupMap[key][bdKey]) groupMap[key][bdKey] = new Set();
          groupMap[key][bdKey].add(r.bill_id);
          groupMap[key]._billSet.add(r.bill_id);
        } else {
          groupMap[key][bdKey] = (groupMap[key][bdKey] || 0) + val;
          groupMap[key]._total += val;
        }
      });

      // Finalize bill counts (sets → numbers)
      Object.values(groupMap).forEach((g) => {
        if (measure === "bills") {
          Object.keys(g).forEach((k) => {
            if (g[k] instanceof Set) g[k] = g[k].size;
          });
          g._total = g._billSet.size;
        }
        delete g._billSet;
      });

      let arr = Object.values(groupMap);
      arr.sort((a, b) => b._total - a._total);

      // Cap to top 12 groups (so stacked legend stays readable)
      if (arr.length > 12) {
        const top = arr.slice(0, 12);
        arr = top;
      }

      // Collect all breakdown keys present, sort by total contribution
      const bdTotals = {};
      arr.forEach((g) => {
        Object.keys(g).forEach((k) => {
          if (k === "key" || k === "label" || k === "_total") return;
          bdTotals[k] = (bdTotals[k] || 0) + g[k];
        });
      });
      let bdKeys = Object.keys(bdTotals).sort((a, b) => bdTotals[b] - bdTotals[a]);

      // Cap to top 8 breakdown segments + Others
      if (bdKeys.length > 8) {
        const top8 = bdKeys.slice(0, 8);
        const others = bdKeys.slice(8);
        arr = arr.map((g) => {
          let othersSum = 0;
          others.forEach((k) => {
            othersSum += g[k] || 0;
            delete g[k];
          });
          if (othersSum > 0) g["Others"] = othersSum;
          return g;
        });
        bdKeys = [...top8, "Others"];
      }

      // Ensure every bar has zero for missing keys (recharts needs all keys present)
      arr.forEach((g) => {
        bdKeys.forEach((k) => {
          if (!(k in g)) g[k] = 0;
        });
      });

      return { arr, bdKeys };
    }

    // Original aggregation (no breakdown) — same as before
    const map = {};
    filteredRows.forEach((r) => {
      const key = getRowKey(r, groupBy);
      const label = getRowLabel(r, groupBy);
      if (!map[key]) {
        map[key] = { key, label, revenue: 0, meters: 0, bills: new Set() };
      }
      map[key].revenue += r.amount;
      map[key].meters += r.meter;
      map[key].bills.add(r.bill_id);
    });

    let arr = Object.values(map).map((m) => ({
      key: m.key,
      label: m.label,
      revenue: m.revenue,
      meters: m.meters,
      bills: m.bills.size,
    }));

    const isTime = groupBy === "daily" || groupBy === "monthly" || groupBy === "yearly";
    if (isTime) {
      arr.sort((a, b) => a.key.localeCompare(b.key));
    } else {
      arr.sort((a, b) => b[measure] - a[measure]);
      if (arr.length > 15) {
        const top = arr.slice(0, 15);
        const others = arr.slice(15).reduce(
          (acc, x) => ({
            key: "_other",
            label: `Others (${arr.length - 15})`,
            revenue: acc.revenue + x.revenue,
            meters: acc.meters + x.meters,
            bills: acc.bills + x.bills,
          }),
          { revenue: 0, meters: 0, bills: 0 }
        );
        arr = [...top, others];
      }
    }
    return arr;
  }, [filteredRows, groupBy, measure, useBreakdown, breakdownConfig]);

  const totals = useMemo(() => {
    const billSet = new Set();
    let revenue = 0;
    let meters = 0;
    filteredRows.forEach((r) => {
      revenue += r.amount;
      meters += r.meter;
      billSet.add(r.bill_id);
    });
    return { revenue, meters, bills: billSet.size };
  }, [filteredRows]);

  const isTimeChart = groupBy === "daily" || groupBy === "monthly" || groupBy === "yearly";
  const measureLabel = measure === "revenue" ? "Revenue" : measure === "meters" ? "Meters" : "Bills";
  const tooltipFormatter = (value) => {
    if (measure === "revenue") return inr(value);
    if (measure === "meters") return `${Number(value).toFixed(2)} m`;
    return `${value} bills`;
  };
  const yAxisFormatter = measure === "revenue" ? inrShort : undefined;

  const resetFilters = () => {
    setMeasure("revenue");
    setGroupBy("monthly");
    setShowBreakdown(true);
    setFabricFilter("all");
    setSaleTypeFilter("all");
    setAgencyFilter("all");
    setPartyFilter("all");
    setFromDate("");
    setToDate("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <header className="bg-[#081225] text-white py-5 shadow-lg relative">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-wider text-[#d4af37] uppercase">
              Saikripa Textiles
            </h1>
            <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase mt-0.5">
              Analytics
            </p>
          </div>
          <button
            onClick={fetchData}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-[#081225]">Business Analytics</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
            Use the controls below to slice your data
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm mb-4">{error}</div>
        )}

        {bills.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
            No sales records yet. Add some bills first to see analytics.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-5 mb-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-[#081225] uppercase tracking-wide">Filters</h3>
                <button onClick={resetFilters} className="text-xs font-bold text-[#c6a55c] hover:underline">Reset all</button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Show">
                  <select value={measure} onChange={(e) => setMeasure(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] bg-white font-semibold">
                    <option value="revenue">Revenue</option>
                    <option value="meters">Meters Sold</option>
                    <option value="bills">Number of Bills</option>
                  </select>
                </Field>

                <Field label="Group by">
                  <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] bg-white font-semibold">
                    <optgroup label="Time">
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </optgroup>
                    <optgroup label="Category">
                      <option value="fabric">By Fabric</option>
                      <option value="agency">By Agency</option>
                      <option value="party">By Party</option>
                    </optgroup>
                  </select>
                </Field>

                <Field label="Fabric">
                  <select value={fabricFilter} onChange={(e) => setFabricFilter(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] bg-white">
                    <option value="all">All Fabrics</option>
                    {fabricOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>

                <Field label="Sale Type">
                  <select value={saleTypeFilter} onChange={(e) => setSaleTypeFilter(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] bg-white">
                    <option value="all">All</option>
                    <option value="Direct">Direct only</option>
                    <option value="Agency">Agency only</option>
                  </select>
                </Field>

                {partyFilter === "all" && saleTypeFilter !== "Direct" && (
                  <Field label="Agency">
                    <select value={agencyFilter} onChange={(e) => setAgencyFilter(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] bg-white">
                      <option value="all">All Agencies</option>
                      {agencyOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </Field>
                )}

                {agencyFilter === "all" && (
                  <Field label="Party">
                    <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] bg-white">
                      <option value="all">All Parties</option>
                      {partyOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                )}

                <Field label="From Date">
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] bg-white" />
                </Field>

                <Field label="To Date">
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37] bg-white" />
                </Field>
              </div>

              {/* Breakdown toggle — only show when groupBy supports it */}
              {breakdownConfig && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBreakdown}
                      onChange={(e) => setShowBreakdown(e.target.checked)}
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                    <span className="text-sm font-bold text-[#081225]">
                      Break down by {breakdownConfig.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      (see what each {groupBy === "agency" ? "agency" : groupBy === "party" ? "party" : "fabric"} contains)
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <SummaryTile label="Total Revenue" value={inr(totals.revenue)} highlight />
              <SummaryTile label="Total Meters" value={totals.meters.toFixed(2)} />
              <SummaryTile label="Bills" value={totals.bills.toString()} />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="mb-4">
                <h3 className="font-black text-[#081225] text-base">
                  {measureLabel} {isTimeChart ? "Over Time" : `by ${groupBy === "fabric" ? "Fabric" : groupBy === "agency" ? "Agency" : "Party"}`}
                  {useBreakdown && <span className="text-gray-400 font-normal"> · stacked by {breakdownConfig.label}</span>}
                </h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">
                  {useBreakdown
                    ? `${chartData.arr.length} ${chartData.arr.length === 1 ? "group" : "groups"} · ${chartData.bdKeys.length} ${breakdownConfig.label.toLowerCase()} segments`
                    : `${chartData.length} ${chartData.length === 1 ? "data point" : "data points"}${!isTimeChart && chartData.length >= 15 ? " · top 15 + others combined" : ""}`}
                </p>
              </div>

              {useBreakdown ? (
                chartData.arr.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 text-sm">No data matches your filters.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(400, chartData.arr.length * 45)}>
                    <BarChart data={chartData.arr} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" style={{ fontSize: 11 }} tickFormatter={yAxisFormatter} />
                      <YAxis dataKey="label" type="category" stroke="#6b7280" style={{ fontSize: 11 }} width={150} />
                      <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {chartData.bdKeys.map((k, i) => (
                        <Bar key={k} dataKey={k} stackId="a" fill={STACK_COLORS[i % STACK_COLORS.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )
              ) : chartData.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">No data matches your filters. Try resetting some.</div>
              ) : isTimeChart ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: 11 }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: 11 }} tickFormatter={yAxisFormatter} />
                    <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                    <Line type="monotone" dataKey={measure} stroke="#d4af37" strokeWidth={3} dot={{ fill: "#d4af37", r: 4 }} activeDot={{ r: 7 }} name={measureLabel} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 35)}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: 11 }} tickFormatter={yAxisFormatter} />
                    <YAxis dataKey="label" type="category" stroke="#6b7280" style={{ fontSize: 11 }} width={150} />
                    <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                    <Bar dataKey={measure} fill="#d4af37" radius={[0, 8, 8, 0]} name={measureLabel} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Data table — handles both modes */}
            {(useBreakdown ? chartData.arr.length > 0 : chartData.length > 0) && (
              <div className="bg-white rounded-2xl p-6 mt-5 border border-gray-100">
                <h3 className="font-black text-[#081225] text-base mb-3">Data Behind the Chart</h3>
                <div className="overflow-x-auto">
                  {useBreakdown ? (
                    <table className="w-full text-sm">
                      <thead className="text-gray-400 uppercase tracking-widest text-xs">
                        <tr className="border-b border-gray-100">
                          <th className="text-left font-bold py-2">{groupBy === "fabric" ? "Fabric" : groupBy === "agency" ? "Agency" : "Party"}</th>
                          {chartData.bdKeys.map((k) => (
                            <th key={k} className="text-right font-bold py-2 px-2 whitespace-nowrap">{k}</th>
                          ))}
                          <th className="text-right font-bold py-2 px-2 bg-[#fff8e1]/40">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.arr.map((row, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 font-bold text-[#081225]">{row.label}</td>
                            {chartData.bdKeys.map((k) => (
                              <td key={k} className="py-2 text-right font-mono text-gray-700 px-2">
                                {row[k] === 0 ? "—" : (measure === "revenue" ? inr(row[k]) : measure === "meters" ? Number(row[k]).toFixed(2) : row[k])}
                              </td>
                            ))}
                            <td className="py-2 text-right font-mono font-bold text-[#7a6015] px-2 bg-[#fff8e1]/40">
                              {measure === "revenue" ? inr(row._total) : measure === "meters" ? Number(row._total).toFixed(2) : row._total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-gray-400 uppercase tracking-widest text-xs">
                        <tr className="border-b border-gray-100">
                          <th className="text-left font-bold py-2">{isTimeChart ? "Period" : "Item"}</th>
                          <th className="text-right font-bold py-2">Revenue</th>
                          <th className="text-right font-bold py-2">Meters</th>
                          <th className="text-right font-bold py-2">Bills</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((d, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 font-bold text-[#081225]">{d.label}</td>
                            <td className="py-2 text-right font-mono text-gray-700">{inr(d.revenue)}</td>
                            <td className="py-2 text-right font-mono text-gray-700">{d.meters.toFixed(2)}</td>
                            <td className="py-2 text-right font-mono text-gray-700">{d.bills}</td>
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
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</label>
      {children}
    </div>
  );
}

function SummaryTile({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? "border-[#d4af37]/30 bg-[#fff8e1]/30" : "border-gray-100 bg-white"}`}>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{label}</p>
      <p className={`text-xl font-black mt-1 ${highlight ? "text-[#7a6015]" : "text-[#081225]"}`}>{value}</p>
    </div>
  );
}