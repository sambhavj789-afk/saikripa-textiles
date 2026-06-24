import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { collections as STATIC_COLLECTIONS } from "../data/collections";

// Map a Supabase `catalogue` row to the shape the UI already expects
// (camelCase keys matching src/data/collections.js).
export const mapRow = (r) => {
  const imgs = Array.isArray(r.images) ? r.images.filter(Boolean) : [];
  const cover = r.image || imgs[0] || "";
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    gsm: r.gsm || "",
    gsmValue: r.gsm_value ?? 0,
    blend: r.blend || "",
    construction: r.construction || r.blend || "",
    images: imgs.length ? imgs : cover ? [cover] : [],
    image: cover,
    category: r.category || "",
    moq: r.moq || "150 meters",
    colors: r.colors || "",
    finish: r.finish || "Lustrous finish",
    uses: r.uses || "",
    description: r.description || "",
    longDescription: r.long_description || "",
  };
};

// Fetch the catalogue from Supabase. Falls back to the bundled static list
// if the table is empty, missing, or unreachable — so the public site always
// renders something.
export async function fetchCatalogue() {
  try {
    const { data, error } = await supabase
      .from("catalogue")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return STATIC_COLLECTIONS;
    return data.map(mapRow);
  } catch {
    return STATIC_COLLECTIONS;
  }
}

// React hook: renders instantly with the static list, then swaps in the live
// Supabase data once it loads. Derives the category filter list from the data.
export function useCatalogue() {
  const [items, setItems] = useState(STATIC_COLLECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchCatalogue().then((rows) => {
      if (!alive) return;
      setItems(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(items.map((i) => i.category).filter(Boolean))),
  ];

  return { items, categories, loading };
}
