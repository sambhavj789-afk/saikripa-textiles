import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCatalogue } from "../lib/catalogue";

export default function FabricDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { items: collections, loading } = useCatalogue();
  const item = collections.find((c) => c.slug === slug);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setImgIdx(0);
  }, [slug]);

  if (!item && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020817] p-6">
        <p className="text-[#7a8499] text-sm uppercase tracking-widest font-bold">Loading…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020817] p-6">
        <div className="text-center">
          <p className="text-[#7a8499] mb-3 text-sm uppercase tracking-widest font-bold">
            Fabric Not Found
          </p>
          <h1 className="text-2xl font-black text-white mb-6">
            We couldn't find that fabric.
          </h1>
          <Link
            to="/catalogue"
            className="bg-[#d4af37] text-[#020817] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#c49f2d] transition inline-block uppercase tracking-wider"
          >
            ← Back to catalogue
          </Link>
        </div>
      </div>
    );
  }

  const allImgs = item.images || [item.image];
  // Skip the first image (cover/logo) — show only fabric photos in detail view
  const imgs = allImgs.length > 1 ? allImgs.slice(1) : allImgs;
  const related = collections
    .filter((c) => c.slug !== item.slug && c.category === item.category)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#020817] text-[#e8edf5]">
      {/* Header */}
      <header className="bg-[#020817] border-b border-[#1a2233] sticky top-0 z-30 backdrop-blur-xl bg-opacity-90">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex flex-col">
            <h1 className="text-lg font-black tracking-wider text-[#d4af37] uppercase">
              Saikripa Textiles
            </h1>
            <p className="text-[10px] text-[#7a8499] tracking-[0.25em] uppercase mt-0.5">
              Fabric Detail
            </p>
          </Link>
          <div className="flex gap-3">
            <Link
              to="/catalogue"
              className="text-xs font-bold bg-[#0a1124] border border-[#1a2233] text-white hover:border-[#d4af37]/40 px-4 py-2 rounded-xl transition"
            >
              ← Catalogue
            </Link>
            <Link
              to="/"
              className="text-xs font-bold bg-[#0a1124] border border-[#1a2233] text-white hover:border-[#d4af37]/40 px-4 py-2 rounded-xl transition"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-6 text-xs text-[#7a8499] flex items-center gap-2">
        <Link to="/" className="hover:text-[#d4af37] transition">Home</Link>
        <span>›</span>
        <Link to="/catalogue" className="hover:text-[#d4af37] transition">Catalogue</Link>
        <span>›</span>
        <span className="text-white font-bold">{item.title}</span>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image gallery */}
          <div>
            <div className="bg-[#0a1124] rounded-[24px] border border-[#1a2233] overflow-hidden relative">
              <img
                src={imgs[imgIdx]}
                alt={item.title}
                className="w-full h-auto block"
              />
              {imgs.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setImgIdx((i) => (i - 1 + imgs.length) % imgs.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#0a1124]/90 hover:bg-[#0a1124] border border-[#1a2233] hover:border-[#d4af37]/40 rounded-full w-10 h-10 flex items-center justify-center text-[#d4af37] font-bold text-xl shadow-md transition"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % imgs.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#0a1124]/90 hover:bg-[#0a1124] border border-[#1a2233] hover:border-[#d4af37]/40 rounded-full w-10 h-10 flex items-center justify-center text-[#d4af37] font-bold text-xl shadow-md transition"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {imgs.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {imgs.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`aspect-square rounded-xl border-2 overflow-hidden bg-[#020817] transition ${
                      imgIdx === i ? "border-[#d4af37]" : "border-[#1a2233] hover:border-[#d4af37]/40"
                    }`}
                  >
                    <img src={src} alt={`${item.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">
              {item.category}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              {item.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className="bg-[#020817] border border-[#1a2233] text-white px-3 py-1.5 rounded-full text-xs font-bold">
                {item.gsm}
              </span>
              <span className="bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] px-3 py-1.5 rounded-full text-xs font-bold">
                {item.blend}
              </span>
              <span className="bg-[#020817] border border-[#1a2233] text-[#a8b0c0] px-3 py-1.5 rounded-full text-xs font-bold">
                {item.finish}
              </span>
            </div>

            <p className="text-[#a8b0c0] leading-relaxed mb-6">
              {item.longDescription || item.description}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                ["MOQ", item.moq],
                ["Available Shades", item.colors],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#0a1124] rounded-2xl p-4 border border-[#1a2233]">
                  <p className="text-[10px] text-[#7a8499] uppercase tracking-widest font-bold mb-1">
                    {label}
                  </p>
                  <p className="text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/918949881253?text=Hi, I'm interested in ${item.title} (${item.gsm}, ${item.blend}). Please share pricing details.`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] py-4 rounded-2xl font-bold text-center hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-[1.01] transition uppercase tracking-wider text-sm"
              >
                WhatsApp Inquiry
              </a>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=saikripatextiles58@gmail.com&su=${encodeURIComponent(`Inquiry: ${item.title}`)}&body=${encodeURIComponent(`Hi, I am interested in ${item.title} (${item.gsm}, ${item.blend}). Kindly share pricing and availability.`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 border border-[#1a2233] bg-[#0a1124] text-white py-4 rounded-2xl font-bold text-center hover:border-[#d4af37]/40 transition uppercase tracking-wider text-sm"
              >
                Email Inquiry
              </a>
            </div>

            <p className="text-xs text-[#7a8499] mt-4 text-center uppercase tracking-widest">
              Free swatch samples · 48-hour dispatch · Pan-India delivery
            </p>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <div className="mb-6">
              <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-2">Related</p>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Other fabrics in {item.category}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => navigate(`/catalogue/${c.slug}`)}
                  className="text-left bg-[#0a1124] rounded-[24px] overflow-hidden border border-[#1a2233] hover:border-[#d4af37]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="relative aspect-[4/3] bg-[#020817] overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.title}
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex gap-2 mb-3">
                      <span className="bg-[#020817] border border-[#1a2233] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {c.gsm}
                      </span>
                      <span className="bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {c.blend}
                      </span>
                    </div>
                    <h3 className="font-black text-white group-hover:text-[#d4af37] transition-colors">{c.title}</h3>
                    <p className="text-xs text-[#d4af37] font-bold mt-2 uppercase tracking-wider">View details →</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}