import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase env variables not set. Appointments will not be saved to the database.\n" +
    "Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// Supabase returns at most 1000 rows per request, so page through with
// .range() until a short page comes back. `build` must return a fresh query
// each call; "id" is added as a tie-breaker so pages don't overlap.
export async function fetchAll(build, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().order("id").range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < pageSize) return { data: rows, error: null };
  }
}
