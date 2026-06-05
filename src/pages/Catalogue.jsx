import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collections, categories } from "../data/collections";

export default function Catalogue() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [compareList, setCompareList] = useState([]);
  const [view, setView] = useState("grid");

  // Apply search filter to all collections first
  const searched = useMemo(() => {
    if (!search) return collections;
    const q = search.toLowerCase();
    return collections.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.blend.toLowerCase().includes(q) ||
        c.uses.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [search]);

  // When a specific category is selected, filter to just that category
  const filtered = useMemo(() => {
    if (activeCategory === "All") return searched;
    return searched.filter((c) => c.category === activeCategory);
  }, [searched, activeCategory]);

  // Group by category for the grouped view ("All" mode without search)
  const groupedByCategory = useMemo(() => {
    const groups = {};
    searched.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    // Preserve the canonical category order
    const orderedKeys = categories
      .filter((cat) => cat !== "All")
      .filter((cat) => groups[cat]);
    return orderedKeys.map((cat) => ({ name: cat, items: groups[cat] }));
  }, [searched]);

  const toggleCompare = (slug) => {
    setCompareList((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) return prev;
      return [...prev, slug];
    });
  };

  const compareItems = compareList
    .map((slug) => collections.find((c) => c.slug === slug))
    .filter(Boolean);

  const showGrouped = activeCategory === "All" && !search && view === "grid";

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="bg-[#081225] text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex flex-col">
            <h1 className="text-lg font-black tracking-wider text-[#d4af37] uppercase">
              Saikripa Textiles
            </h1>
            <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase mt-0.5">
              Full Catalogue
            </p>
          </Link>
          <Link
            to="/"
            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero strip */}
      <section className="bg-gradient-to-br from-[#020817] via-[#0b1748] to-[#172554] text-white px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">
            Saikripa Library
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-2xl">
            Browse by category, or see everything.
          </h2>
          <p className="mt-5 text-gray-300 max-w-2xl leading-relaxed">
            Saikripa fabrics organized by weave family — Gaberdine, 2/18 Matty,
            and PV Trovin. Search, compare up to three side-by-side, or click
            "See all" to open the full catalogue.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
          <input
            type="text"
            placeholder="Search by name, construction, use case..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition ${
                  activeCategory === cat
                    ? "bg-[#081225] text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Compare bar (sticky) */}
        {compareList.length > 0 && (
          <div className="sticky top-0 z-30 bg-[#081225] text-white rounded-2xl p-4 mb-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                Compare ({compareList.length}/3)
              </span>
              <div className="flex gap-2 flex-wrap">
                {compareItems.map((c) => (
                  <span
                    key={c.slug}
                    className="text-xs bg-white/10 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {c.title}
                    <button
                      onClick={() => toggleCompare(c.slug)}
                      className="text-white/60 hover:text-white font-bold"
                      aria-label={`Remove ${c.title}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setView(view === "compare" ? "grid" : "compare")}
                disabled={compareList.length < 2}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                  compareList.length < 2
                    ? "bg-white/5 text-gray-500 cursor-not-allowed"
                    : "bg-[#d4af37] text-[#081225] hover:bg-[#c49f2d]"
                }`}
              >
                {view === "compare" ? "Show Grid" : "Compare"}
              </button>
              <button
                onClick={() => {
                  setCompareList([]);
                  setView("grid");
                }}
                className="text-xs text-white/60 hover:text-white px-2"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Compare view */}
        {view === "compare" && compareItems.length >= 2 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `180px repeat(${compareItems.length}, minmax(220px, 1fr))`,
                }}
              >
                <div />
                {compareItems.map((c) => (
                  <div key={c.slug} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden">
                      <img
                        src={c.image}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-black text-[#081225] text-sm">{c.title}</h3>
                    <Link
                      to={`/catalogue/${c.slug}`}
                      className="text-[10px] text-[#c6a55c] font-bold hover:underline"
                    >
                      View details →
                    </Link>
                  </div>
                ))}

                {[
                  ["Category", "category"],
                  ["GSM", "gsm"],
                  ["Construction", "construction"],
                  ["Finish", "finish"],
                  ["MOQ", "moq"],
                  ["Shades", "colors"],
                  ["Best For", "uses"],
                ].map(([label, key]) => (
                  <React.Fragment key={key}>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest py-3 self-center">
                      {label}
                    </div>
                    {compareItems.map((c) => (
                      <div
                        key={c.slug + key}
                        className="bg-white rounded-xl px-4 py-3 border border-gray-100 text-sm font-semibold text-[#081225]"
                      >
                        {c[key]}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        ) : showGrouped ? (
          // GROUPED VIEW — when "All" is selected with no search
          <div className="space-y-12">
            {groupedByCategory.map((group) => (
              <section key={group.name}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-2xl font-black text-[#081225]">
                      {group.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "fabric" : "fabrics"}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveCategory(group.name)}
                    className="text-sm font-bold text-[#c6a55c] hover:underline"
                  >
                    See all →
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((c) => (
                    <FabricCard
                      key={c.slug}
                      item={c}
                      isCompared={compareList.includes(c.slug)}
                      onToggleCompare={() => toggleCompare(c.slug)}
                      onNavigate={() => navigate(`/catalogue/${c.slug}`)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          // FLAT GRID — when a specific category is selected or search is active
          <>
            <p className="text-sm text-gray-500 mb-4">
              {filtered.length}{" "}
              {filtered.length === 1 ? "fabric" : "fabrics"} found
              {activeCategory !== "All" && ` in ${activeCategory}`}
            </p>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
                No fabrics match your filters. Try clearing the search or category.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((c) => (
                  <FabricCard
                    key={c.slug}
                    item={c}
                    isCompared={compareList.includes(c.slug)}
                    onToggleCompare={() => toggleCompare(c.slug)}
                    onNavigate={() => navigate(`/catalogue/${c.slug}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer CTA */}
      <section className="bg-[#081225] text-white px-6 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-black mb-4">Need a custom shade?</h3>
          <p className="text-gray-300 mb-6">
            Bulk orders can be custom-dyed to your exact Pantone reference. Talk
            to our team for a quote.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://wa.me/918949881253"
              target="_blank"
              rel="noreferrer"
              className="bg-[#25d366] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#1ebe5d] transition"
            >
              💬 WhatsApp Inquiry
            </a>
            <Link
              to="/"
              className="border border-white/20 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Fabric Card (extracted as reusable component) ───────────────────────────
function FabricCard({ item, isCompared, onToggleCompare, onNavigate }) {
  return (
    <div className="group bg-white rounded-[24px] overflow-hidden border border-gray-100 hover:border-[#d4af37]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col">
      <button
        onClick={onNavigate}
        className="relative aspect-[4/3] bg-gray-100 overflow-hidden block w-full"
      >
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-[#081225]/80 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
            {item.category}
          </span>
        </div>
      </button>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex gap-2 mb-3 flex-wrap">
          <span className="bg-[#081225] text-white px-3 py-1 rounded-full text-[10px] font-bold">
            {item.gsm}
          </span>
          <span className="bg-[#d4af37]/15 text-[#7a6015] px-3 py-1 rounded-full text-[10px] font-bold">
            {item.construction}
          </span>
        </div>
        <h3 className="text-lg font-black text-[#081225] mb-2">{item.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed flex-grow">
          {item.description.substring(0, 100)}...
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onNavigate}
            className="bg-[#081225] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#0f1f63] transition"
          >
            View Details
          </button>
          <button
            onClick={onToggleCompare}
            className={`py-2.5 rounded-xl font-bold text-xs transition border ${
              isCompared
                ? "bg-[#d4af37] text-[#081225] border-[#d4af37]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#d4af37] hover:text-[#081225]"
            }`}
          >
            {isCompared ? "✓ Comparing" : "+ Compare"}
          </button>
        </div>
      </div>
    </div>
  );
}