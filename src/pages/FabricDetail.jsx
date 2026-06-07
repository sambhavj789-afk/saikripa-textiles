import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { collections, getCollectionBySlug } from "../data/collections";

export default function FabricDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const item = getCollectionBySlug(slug);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setImgIdx(0);
  }, [slug]);

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] p-6">
        <div className="text-center">
          <p className="text-gray-400 mb-3 text-sm uppercase tracking-widest font-bold">
            Fabric Not Found
          </p>
          <h1 className="text-2xl font-black text-[#081225] mb-6">
            We couldn't find that fabric.
          </h1>
          <Link
            to="/catalogue"
            className="bg-[#081225] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#0f1f63] transition inline-block"
          >
            ← Back to catalogue
          </Link>
        </div>
      </div>
    );
  }

  const imgs = item.images || [item.image];
  const related = collections
    .filter((c) => c.slug !== item.slug && c.category === item.category)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="bg-[#081225] text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex flex-col">
            <h1 className="text-lg font-black tracking-wider text-[#d4af37] uppercase">
              Saikripa Textiles
            </h1>
            <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase mt-0.5">
              Fabric Detail
            </p>
          </Link>
          <div className="flex gap-3">
            <Link
              to="/catalogue"
              className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition"
            >
              ← Catalogue
            </Link>
            <Link
              to="/"
              className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-6 text-xs text-gray-500 flex items-center gap-2">
        <Link to="/" className="hover:text-[#c6a55c]">Home</Link>
        <span>›</span>
        <Link to="/catalogue" className="hover:text-[#c6a55c]">Catalogue</Link>
        <span>›</span>
        <span className="text-[#081225] font-bold">{item.title}</span>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image gallery */}
          <div>
            <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden relative aspect-[4/3] flex items-center justify-center">
              <img
                src={imgs[imgIdx]}
                alt={item.title}
                className="w-full h-full object-contain"
              />
              {imgs.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setImgIdx((i) => (i - 1 + imgs.length) % imgs.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-[#081225] font-bold text-xl shadow-md"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % imgs.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-[#081225] font-bold text-xl shadow-md"
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
                    className={`aspect-square rounded-xl border-2 overflow-hidden bg-gray-100 transition ${
                      imgIdx === i ? "border-[#d4af37]" : "border-transparent hover:border-gray-300"
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
            <p className="uppercase tracking-[0.3em] text-xs text-[#c6a55c] font-bold mb-3">
              {item.category}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-[#081225] leading-tight mb-4">
              {item.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className="bg-[#081225] text-white px-3 py-1.5 rounded-full text-xs font-bold">
                {item.gsm}
              </span>
              <span className="bg-[#d4af37]/15 text-[#7a6015] px-3 py-1.5 rounded-full text-xs font-bold">
                {item.blend}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold">
                {item.finish}
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              {item.longDescription || item.description}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                ["MOQ", item.moq],
                ["Available Shades", item.colors],
                ["Fabric Finish", item.finish],
                ["Best For", item.uses],
              ].map(([label, value]) => (
                <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                    {label}
                  </p>
                  <p className="text-sm font-bold text-[#081225]">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/918949881253?text=Hi, I'm interested in ${item.title} (${item.gsm}, ${item.blend}). Please share pricing details.`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-[#25d366] text-white py-4 rounded-2xl font-bold text-center hover:bg-[#1ebe5d] transition"
              >
                💬 WhatsApp Inquiry
              </a>
              <a
                href={`mailto:saikripatextiles58@gmail.com?subject=Inquiry: ${item.title}&body=Hi, I am interested in ${item.title} (${item.gsm}, ${item.blend}). Kindly share pricing and availability.`}
                className="flex-1 border-2 border-[#081225] text-[#081225] py-4 rounded-2xl font-bold text-center hover:bg-[#081225] hover:text-white transition"
              >
                ✉ Email Inquiry
              </a>
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Free swatch samples · 48-hour dispatch · Pan-India delivery
            </p>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-black text-[#081225] mb-6">
              Other fabrics in {item.category}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => navigate(`/catalogue/${c.slug}`)}
                  className="text-left bg-white rounded-[24px] overflow-hidden border border-gray-100 hover:border-[#d4af37]/40 hover:shadow-lg transition group"
                >
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex gap-2 mb-2">
                      <span className="bg-[#081225] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {c.gsm}
                      </span>
                      <span className="bg-[#d4af37]/15 text-[#7a6015] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {c.blend}
                      </span>
                    </div>
                    <h3 className="font-black text-[#081225]">{c.title}</h3>
                    <p className="text-xs text-[#c6a55c] font-bold mt-2">View details →</p>
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
