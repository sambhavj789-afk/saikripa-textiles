import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCatalogue } from "../lib/catalogue";

// ── Reusable: Gold gradient section divider ─────────────────────────────────
function GoldDivider({ position = "top", strength = "30" }) {
  const posCls = position === "top" ? "top-0" : "bottom-0";
  return (
    <div className={`absolute ${posCls} left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/${strength} to-transparent pointer-events-none`} />
  );
}

export default function Catalogue() {
  const navigate = useNavigate();
  const { items: collections, categories } = useCatalogue();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [compareList, setCompareList] = useState([]);
  const [view, setView] = useState("grid");

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
  }, [search, collections]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return searched;
    return searched.filter((c) => c.category === activeCategory);
  }, [searched, activeCategory]);

  const groupedByCategory = useMemo(() => {
    const groups = {};
    searched.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    const orderedKeys = categories
      .filter((cat) => cat !== "All")
      .filter((cat) => groups[cat]);
    return orderedKeys.map((cat) => ({ name: cat, items: groups[cat] }));
  }, [searched, categories]);

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
    <div className="min-h-screen bg-[#020817] text-[#e8edf5]">
      {/* Header — matches homepage navbar style with gold gradient bottom line */}
      <header className="bg-[#020817]/90 backdrop-blur-xl sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex flex-col">
            <h1 className="text-lg font-black tracking-wider text-[#d4af37] uppercase">
              Saikripa Textiles
            </h1>
            <p className="text-[10px] text-[#7a8499] tracking-[0.25em] uppercase mt-0.5">
              Full Catalogue
            </p>
          </Link>
          <Link
            to="/"
            className="text-xs font-bold bg-[#0a1124] border border-[#1a2233] text-white hover:border-[#d4af37]/40 px-4 py-2 rounded-xl transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

     {/* Hero strip — gold dividers replace hard gray border */}
      <section className="relative bg-[#020817] px-6 py-16 overflow-hidden">
        <GoldDivider position="bottom" />
        {/* Blurred fabric texture — decorative depth, no content */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: "url('/new.jpg')", backgroundSize: "cover", backgroundPosition: "right center", filter: "blur(12px)" }} />
        {/* Decorative blurred gold orb cluster — top right */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0.04) 50%, transparent 75%)" }} />
        {/* Decorative blurred orb — mid right */}
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none opacity-60" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        {/* Bottom-left ambient warmth */}
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none opacity-40" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)" }} />
        {/* Decorative gold ring — top right corner */}
        <div className="absolute top-10 right-10 w-32 h-32 pointer-events-none opacity-20 hidden md:block">
          <div className="absolute inset-0 rounded-full border border-[#d4af37]/40"></div>
          <div className="absolute inset-3 rounded-full border border-[#d4af37]/30"></div>
          <div className="absolute inset-6 rounded-full border border-[#d4af37]/20"></div>
        </div>
        <div className="max-w-7xl mx-auto relative flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between">
          <div className="flex-1 min-w-0 max-w-3xl">
            <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">
              Saikripa Library
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-white">
              Premium suiting fabrics, manufactured in Bhilwara.
            </h2>
            <p className="mt-5 text-[#cbd5e1] leading-relaxed max-w-xl">
              Browse the complete Saikripa collection — Gaberdine, 2/18 Matty, PV Trovin, and more. Trusted by 1000+ buyers across India for consistent GSM, color fastness, and fast dispatch.
            </p>
          </div>

          {/* Quick stats — right side */}
          <div className="flex flex-col gap-3 w-full lg:w-[240px] flex-shrink-0 lg:ml-auto">
            <div className="relative bg-[#0a1124]/80 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl px-5 py-4 overflow-hidden" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.4), 0 0 30px rgba(212, 175, 55, 0.1)" }}>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
              <p className="text-[10px] text-[#d4af37]/80 font-bold uppercase tracking-[0.25em] mb-1.5">Collections</p>
              <p className="text-3xl font-black text-white leading-none">6</p>
              <p className="text-[11px] text-[#a8b0c0] mt-1.5 font-medium">Premium fabric families</p>
            </div>

            <div className="relative bg-[#0a1124]/80 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl px-5 py-4 overflow-hidden" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.4), 0 0 30px rgba(212, 175, 55, 0.1)" }}>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
              <p className="text-[10px] text-[#d4af37]/80 font-bold uppercase tracking-[0.25em] mb-1.5">Shades</p>
              <p className="text-3xl font-black text-white leading-none">350<span className="text-[#d4af37]">+</span></p>
              <p className="text-[11px] text-[#a8b0c0] mt-1.5 font-medium">Across all collections</p>
            </div>

            <div className="relative bg-[#0a1124]/80 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl px-5 py-4 overflow-hidden" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.4), 0 0 30px rgba(212, 175, 55, 0.1)" }}>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
              <p className="text-[10px] text-[#d4af37]/80 font-bold uppercase tracking-[0.25em] mb-1.5">Clients</p>
              <p className="text-3xl font-black text-white leading-none">1000<span className="text-[#d4af37]">+</span></p>
              <p className="text-[11px] text-[#a8b0c0] mt-1.5 font-medium">Wholesalers & institutions</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Filter bar */}
        <div className="bg-[#0a1124] rounded-2xl p-5 mb-6 border border-[#1a2233]">
          <input
            type="text"
            placeholder="Search by name, construction, use case..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#020817] border border-[#1a2233] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/20 transition"
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition ${
                  activeCategory === cat
                    ? "bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                    : "bg-[#020817] border border-[#1a2233] text-[#a8b0c0] hover:border-[#d4af37]/40 hover:text-[#d4af37]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Compare bar (sticky) */}
        {compareList.length > 0 && (
          <div className="sticky top-[88px] z-30 bg-[#0a1124] border border-[#d4af37]/30 rounded-2xl p-4 mb-6 flex items-center justify-between" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(212, 175, 55, 0.1)" }}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                Compare ({compareList.length}/3)
              </span>
              <div className="flex gap-2 flex-wrap">
                {compareItems.map((c) => (
                  <span
                    key={c.slug}
                    className="text-xs bg-[#020817] border border-[#1a2233] text-white px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {c.title}
                    <button
                      onClick={() => toggleCompare(c.slug)}
                      className="text-[#7a8499] hover:text-white font-bold"
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
                className={`text-xs font-bold px-4 py-2 rounded-xl transition uppercase tracking-wider ${
                  compareList.length < 2
                    ? "bg-[#020817] border border-[#1a2233] text-[#4a5568] cursor-not-allowed"
                    : "bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                }`}
              >
                {view === "compare" ? "Show Grid" : "Compare"}
              </button>
              <button
                onClick={() => {
                  setCompareList([]);
                  setView("grid");
                }}
                className="text-xs text-[#7a8499] hover:text-white px-2"
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
                  <div key={c.slug} className="bg-[#0a1124] rounded-2xl p-4 border border-[#1a2233] hover:border-[#d4af37]/30 transition">
                    <div className="aspect-square bg-[#020817] rounded-xl mb-3 overflow-hidden">
                      <img
                        src={c.image}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-black text-white text-sm">{c.title}</h3>
                    <Link
                      to={`/catalogue/${c.slug}`}
                      className="text-[10px] text-[#d4af37] font-bold hover:text-[#f4d77a]"
                    >
                      View details →
                    </Link>
                  </div>
                ))}

                {[
                  ["Category", "category"],
                  ["GSM", "gsm"],
                  ["Construction", "construction"],
                  ["MOQ", "moq"],
                  ["Shades", "colors"],
                ].map(([label, key]) => (
                  <React.Fragment key={key}>
                    <div className="text-xs font-bold text-[#d4af37] uppercase tracking-widest py-3 self-center">
                      {label}
                    </div>
                    {compareItems.map((c) => (
                      <div
                        key={c.slug + key}
                        className="bg-[#0a1124] rounded-xl px-4 py-3 border border-[#1a2233] text-sm font-semibold text-white"
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
          <div className="space-y-12">
            {groupedByCategory.map((group) => (
              <section key={group.name}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-2">
                      Collection
                    </p>
                    <h3 className="text-2xl font-black text-white">
                      {group.name}
                    </h3>
                    <p className="text-xs text-[#a8b0c0] mt-1 uppercase tracking-widest font-semibold">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "fabric" : "fabrics"}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveCategory(group.name)}
                    className="text-sm font-bold text-[#d4af37] hover:text-[#f4d77a] transition"
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
          <>
            <p className="text-sm text-[#cbd5e1] mb-4">
              <span className="text-white font-bold">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "fabric" : "fabrics"} found
              {activeCategory !== "All" && <span> in <span className="text-[#d4af37]">{activeCategory}</span></span>}
            </p>

            {filtered.length === 0 ? (
              <div className="bg-[#0a1124] rounded-2xl p-12 text-center text-[#cbd5e1] border border-[#1a2233]">
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

      {/* Footer CTA — gold dividers replace hard border */}
      <section className="relative bg-[#0a1124] px-6 py-16 overflow-hidden">
        <GoldDivider position="top" />
        <GoldDivider position="bottom" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none opacity-40" style={{ background: "radial-gradient(ellipse, rgba(212, 175, 55, 0.12) 0%, transparent 70%)" }} />
        <div className="max-w-3xl mx-auto text-center relative">
          <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">Custom Orders</p>
          <h3 className="text-3xl md:text-4xl font-black mb-4 text-white tracking-tight">Need a custom shade?</h3>
          <p className="text-[#cbd5e1] mb-7 leading-relaxed">
            Bulk orders can be custom-dyed to your exact Pantone reference. Talk
            to our team for a quote.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://wa.me/918949881253"
              target="_blank"
              rel="noreferrer"
              className="bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] px-7 py-3.5 rounded-xl font-bold text-sm hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-[1.02] transition uppercase tracking-wider"
            >
              WhatsApp Inquiry
            </a>
            <Link
              to="/"
              className="border border-[#1a2233] bg-[#020817] text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:border-[#d4af37]/40 transition uppercase tracking-wider"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Fabric Card ─────────────────────────────────────────────────────────────
function FabricCard({ item, isCompared, onToggleCompare, onNavigate }) {
  return (
    <div className={`group bg-[#0a1124] rounded-[24px] overflow-hidden border transition-all duration-300 flex flex-col ${
      isCompared
        ? "border-[#d4af37]/60 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
        : "border-[#1a2233] hover:border-[#d4af37]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
    }`}>
      <button
        onClick={onNavigate}
        className="relative aspect-[4/3] bg-[#020817] overflow-hidden block w-full"
      >
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-[#020817]/90 backdrop-blur border border-[#1a2233] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            {item.category}
          </span>
        </div>
      </button>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex gap-2 mb-3 flex-wrap">
          <span className="bg-[#020817] border border-[#1a2233] text-white px-3 py-1 rounded-full text-[10px] font-bold">
            {item.gsm}
          </span>
          <span className="bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] px-3 py-1 rounded-full text-[10px] font-bold">
            {item.construction}
          </span>
        </div>
        <h3 className="text-lg font-black text-white mb-2 group-hover:text-[#d4af37] transition-colors">{item.title}</h3>
        <p className="text-[#cbd5e1] text-sm leading-relaxed flex-grow">
          {item.description.substring(0, 100)}...
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onNavigate}
            className="bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] py-2.5 rounded-xl font-bold text-xs hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 uppercase tracking-wider"
          >
            View Details
          </button>
          <button
            onClick={onToggleCompare}
            className={`py-2.5 rounded-xl font-bold text-xs transition border uppercase tracking-wider ${
              isCompared
                ? "bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/40"
                : "bg-[#020817] text-[#a8b0c0] border-[#1a2233] hover:border-[#d4af37]/40 hover:text-[#d4af37]"
            }`}
          >
            {isCompared ? "✓ Comparing" : "+ Compare"}
          </button>
        </div>
      </div>
    </div>
  );
}