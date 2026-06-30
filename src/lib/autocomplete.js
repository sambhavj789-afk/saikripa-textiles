import { supabase } from "./supabase";

// Shared autocomplete master list. One table keyed by (category, value).
// Lets any typed value persist across sessions/devices and across record types,
// independent of whether the parent record/row was fully saved.
// Categories: "quality" | "party" | "agency" | "notes" | "mill" | "category"

export async function fetchAllOptions() {
  const { data, error } = await supabase.from("autocomplete_options").select("category, value");
  if (error) return {};
  const map = {};
  (data || []).forEach((r) => {
    if (!r.value) return;
    (map[r.category] = map[r.category] || []).push(r.value);
  });
  return map;
}

export async function saveOptions(category, values) {
  const clean = [...new Set((values || []).map((v) => (v || "").trim()).filter(Boolean))];
  if (!clean.length) return clean;
  try {
    await supabase
      .from("autocomplete_options")
      .upsert(clean.map((value) => ({ category, value })), { onConflict: "category,value", ignoreDuplicates: true });
  } catch {
    /* table may not exist yet — non-fatal, autofill still works from records */
  }
  return clean;
}
