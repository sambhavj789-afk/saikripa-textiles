import { createContext, useContext, useState } from "react";

// Indian financial year: 1 April → 31 March of the next year.
// A FY is labelled by its STARTING calendar year, e.g. 2026 = 1 Apr 2026 → 31 Mar 2027.

const STORAGE_KEY = "saikripa_fy";

const FinancialYearContext = createContext(null);

// The financial year that today falls in.
export const currentFinancialYear = () => {
  const now = new Date();
  // getMonth() is 0-indexed; 3 = April. Jan–Mar belong to the previous FY.
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

// Apply the selected FY's date range to a Supabase query on `column`.
// When range is null ("All Years") the query is returned untouched.
export const applyFyRange = (query, column, range) =>
  range ? query.gte(column, range.start).lt(column, range.end) : query;

export function FinancialYearProvider({ children }) {
  const [fy, setFyState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "all") return "all";
    const n = parseInt(saved, 10);
    return Number.isFinite(n) ? n : currentFinancialYear();
  });

  const setFy = (val) => {
    setFyState(val);
    localStorage.setItem(STORAGE_KEY, String(val));
  };

  // Selectable years: current FY back to 2020.
  const cur = currentFinancialYear();
  const years = [];
  for (let y = cur; y >= 2020; y--) years.push(y);

  // Date range for the selected FY (end is exclusive: 1 Apr of the next year).
  const range =
    fy === "all" ? null : { start: `${fy}-04-01`, end: `${fy + 1}-04-01` };

  const label =
    fy === "all" ? "All Years" : `FY ${fy}–${String((fy + 1) % 100).padStart(2, "0")}`;

  return (
    <FinancialYearContext.Provider value={{ fy, setFy, years, range, label }}>
      {children}
    </FinancialYearContext.Provider>
  );
}

export function useFinancialYear() {
  const ctx = useContext(FinancialYearContext);
  if (!ctx) throw new Error("useFinancialYear must be used within FinancialYearProvider");
  return ctx;
}
