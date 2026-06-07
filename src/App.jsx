import React, { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import AppointmentModal from "./components/AppointmentModal";
import { collections } from "./data/collections";

// ── Utility: lock/unlock body scroll ──────────────────────────────────────────
const lockScroll = () => (document.body.style.overflow = "hidden");
const unlockScroll = () => (document.body.style.overflow = "");

// ── Data ──────────────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: "Rakesh Sharma",
    role: "Principal, Delhi Public School, Jaipur",
    initials: "RS",
    text: "Saikripa Textiles has been our uniform fabric supplier for 6 years. The GSM consistency and color retention even after repeated washes is exceptional.",
  },
  {
    name: "Anjali Mehta",
    role: "Purchase Manager, Marriott Hotels, Mumbai",
    initials: "AM",
    text: "Gold Club fabric is our preferred choice for all housekeeping and front-desk uniforms. The lustrous finish and durability have exceeded expectations.",
  },
  {
    name: "Suresh Patel",
    role: "Wholesale Dealer, Surat",
    initials: "SP",
    text: "Best wholesale rates in Bhilwara. Sample dispatch within 48 hours and bulk orders always on time. Highly recommended for dealers across Gujarat.",
  },
];

const faqs = [
  {
    q: "What is the minimum order quantity?",
    a: "MOQ varies by collection — starting from 50 meters for select fabrics and 100 meters for our premium suiting range. Contact us for custom requirements.",
  },
  {
    q: "Do you dispatch fabric samples?",
    a: "Yes. We offer free sample swatches (up to 3 designs) with shipping charges. Samples are dispatched within 48 hours of order confirmation.",
  },
  {
    q: "What does 65/35 PV blend mean?",
    a: "65% Polyester and 35% Viscose. This blend provides the durability of polyester with the soft, breathable drape of viscose — ideal for uniform-grade suiting.",
  },
  {
    q: "Do you supply pan-India?",
    a: "Yes. We ship to all major cities and wholesale markets across India via reputed transport partners. Custom logistics arrangements available for large orders.",
  },
  {
    q: "Can you supply custom shade card colors?",
    a: "Yes, we offer dyeing for bulk orders with custom shades. Minimum quantity applies. Please share your Pantone or physical swatch reference.",
  },
];

const steps = [
  { icon: "📋", step: "01", title: "Browse Catalogue", desc: "Explore our premium fabric collections and GSM options online or request our physical shade card." },
  { icon: "💬", step: "02", title: "Request Quote", desc: "Share your requirements — quantity, fabric, color, and delivery timeline. We respond within 4 hours." },
  { icon: "📦", step: "03", title: "Sample Dispatch", desc: "Receive free fabric swatches within 48 hours to verify quality, color, and GSM before bulk order." },
  { icon: "🚚", step: "04", title: "Bulk Fulfillment", desc: "Place your bulk order with confidence. Pan-India delivery with real-time tracking and quality assurance." },
];

const whyUs = [
  { icon: "🏭", title: "Bhilwara Manufacturing", desc: "Direct from India's textile capital — zero middleman. You get factory prices with guaranteed quality." },
  { icon: "✅", title: "GSM Certified Quality", desc: "Every batch is tested for GSM accuracy, color fastness, and tensile strength before dispatch." },
  { icon: "🎨", title: "350+ Shade Options", desc: "Extensive shade cards across all collections. Custom dyeing available for bulk institutional orders." },
  { icon: "⚡", title: "48-Hour Sample Dispatch", desc: "One of the fastest sample turnaround times in Bhilwara — because your deadlines matter." },
  { icon: "🤝", title: "Wholesale Friendly", desc: "Flexible MOQ, competitive pricing, and dedicated account support for dealers and distributors." },
  { icon: "🌍", title: "Pan-India Supply", desc: "Trusted by 1000+ buyers from Surat to Chennai. Reliable logistics, on-time delivery, every time." },
];

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar({ hasBar, onBookAppointment }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const topOffset = hasBar ? "top-[36px]" : "top-0";
  const navLinks = ["Home", "Collections", "Why Us", "Process", "Contact"];

  return (
    <>
      <header
        className={`fixed ${topOffset} left-0 w-full z-50 backdrop-blur-2xl bg-[#081225]/80 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#home">
            <h1 className="text-xl font-black tracking-wider text-[#d4af37] uppercase leading-tight">
              Saikripa Textiles
            </h1>
            <p className="text-[10px] text-gray-400 tracking-[0.25em] uppercase">
              Premium Suiting House · Bhilwara
            </p>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm text-white/80 font-medium">
            {navLinks.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(" ", "-")}`}
                className="hover:text-[#d4af37] transition-colors duration-200"
              >
                {l}
              </a>
            ))}
            <a
              href="/catalogue"
              className="hover:text-[#d4af37] transition-colors duration-200"
            >
              Catalogue
            </a>
            <button
              onClick={onBookAppointment}
              className="ml-2 bg-[#d4af37] text-[#08102e] px-5 py-2 rounded-xl font-bold text-xs hover:bg-[#c49f2d] transition flex items-center gap-1.5"
            >
              📅 Book Appointment
            </button>
            <a
              href="https://wa.me/918949881253"
              target="_blank"
              rel="noreferrer"
              className="border border-white/20 text-white/80 px-4 py-2 rounded-xl font-bold text-xs hover:text-white hover:border-white/40 transition"
            >
              WhatsApp
            </a>
          </nav>

          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => { setMenuOpen(true); lockScroll(); }}
            aria-label="Open menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[70] flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setMenuOpen(false); unlockScroll(); }}
          />
          <div className="relative ml-auto w-72 h-full bg-[#081225] flex flex-col p-8 shadow-2xl">
            <button
              className="self-end text-white/60 hover:text-white mb-8 text-2xl"
              onClick={() => { setMenuOpen(false); unlockScroll(); }}
              aria-label="Close menu"
            >
              ×
            </button>
            <div className="mb-8">
              <p className="text-[#d4af37] font-black text-lg uppercase">Saikripa Textiles</p>
              <p className="text-gray-400 text-xs mt-1">Premium Suiting · Bhilwara</p>
            </div>
            <nav className="flex flex-col gap-5">
              {navLinks.map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(" ", "-")}`}
                  onClick={() => { setMenuOpen(false); unlockScroll(); }}
                  className="text-white/80 hover:text-[#d4af37] text-lg font-semibold transition"
                >
                  {l}
                </a>
              ))}
              <a
                href="/catalogue"
                className="text-white/80 hover:text-[#d4af37] text-lg font-semibold transition"
              >
                Catalogue
              </a>
            </nav>
            <div className="mt-auto space-y-3">
              <button
                onClick={() => { setMenuOpen(false); unlockScroll(); onBookAppointment(); }}
                className="flex items-center justify-center gap-2 w-full bg-[#d4af37] text-[#08102e] py-3 rounded-xl font-bold"
              >
                📅 Book Appointment
              </button>
              <a
                href="https://wa.me/918949881253"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25d366] text-white py-3 rounded-xl font-bold"
              >
                💬 WhatsApp Us
              </a>
              <a
                href="mailto:saikripatextiles58@gmail.com"
                className="flex items-center justify-center w-full border border-white/20 text-white py-3 rounded-xl font-semibold text-sm"
              >
                ✉ Email Inquiry
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ item, onClose }) {
  const imgs = item.images || [item.image];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    lockScroll();
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % imgs.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + imgs.length) % imgs.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      unlockScroll();
    };
  }, [onClose, imgs.length]);

  const next = () => setIdx((i) => (i + 1) % imgs.length);
  const prev = () => setIdx((i) => (i - 1 + imgs.length) % imgs.length);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-3xl rounded-[28px] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative bg-gray-100">
          <img
            src={imgs[idx]}
            alt={item.title}
            className="w-full max-h-[60vh] object-contain"
          />

          {imgs.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-[#081225] font-bold text-xl shadow-md"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-[#081225] font-bold text-xl shadow-md"
                aria-label="Next image"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {imgs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`w-2.5 h-2.5 rounded-full transition ${i === idx ? "bg-[#d4af37]" : "bg-white/70"}`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-white font-bold text-lg"
            aria-label="Close"
          >
            ×
          </button>
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="bg-[#081225] text-white px-3 py-1 rounded-full text-xs font-bold">{item.gsm}</span>
            <span className="bg-[#d4af37] text-[#081225] px-3 py-1 rounded-full text-xs font-bold">{item.blend}</span>
          </div>
        </div>
        <div className="p-8">
          <p className="text-xs text-[#c6a55c] font-bold uppercase tracking-widest mb-1">{item.category}</p>
          <h3 className="text-3xl font-black text-[#081225] mb-3">{item.title}</h3>
          <p className="text-gray-600 leading-relaxed mb-6">{item.description}</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              ["MOQ", item.moq],
              ["Available Colors", item.colors],
              ["Fabric Finish", item.finish],
              ["Best For", item.uses],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-[#081225]">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/918949881253?text=Hi, I'm interested in the ${item.title} (${item.gsm}, ${item.blend}). Please share pricing details.`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-[#25d366] text-white py-4 rounded-2xl font-bold text-center hover:bg-[#1ebe5d] transition"
            >
              💬 Inquire on WhatsApp
            </a>
            <a
              href={`mailto:saikripatextiles58@gmail.com?subject=Inquiry: ${item.title}&body=Hi, I am interested in ${item.title} (${item.gsm}, ${item.blend}). Kindly share pricing and availability.`}
              className="flex-1 border-2 border-[#081225] text-[#081225] py-4 rounded-2xl font-bold text-center hover:bg-[#081225] hover:text-white transition"
            >
              ✉ Email Inquiry
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-gray-50 transition"
        onClick={() => setOpen(!open)}
      >
        <span className="font-bold text-[#081225] pr-4">{q}</span>
        <span className={`text-[#d4af37] text-2xl font-bold flex-shrink-0 transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Contact Form ───────────────────────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", city: "", fabric: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.phone) return;
    const msg = `Hi, I'm ${form.name} from ${form.city}. I'm interested in: ${form.fabric || "General Inquiry"}. ${form.message}. My phone: ${form.phone}`;
    window.open(`https://wa.me/918949881253?text=${encodeURIComponent(msg)}`, "_blank");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-[32px] p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-2xl font-black text-[#081225] mb-2">Inquiry Sent!</h3>
        <p className="text-gray-500">You'll be redirected to WhatsApp. We respond within 4 hours on business days.</p>
        <button onClick={() => setSubmitted(false)} className="mt-6 text-[#c6a55c] font-bold text-sm hover:underline">
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100">
      <h3 className="text-2xl font-black text-[#081225] mb-1">Send an Inquiry</h3>
      <p className="text-gray-400 text-sm mb-6">We respond within 4 business hours</p>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Phone / WhatsApp *</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">City</label>
            <input
              type="text"
              placeholder="Your city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Fabric / Collection</label>
            <select
              value={form.fabric}
              onChange={(e) => setForm({ ...form, fabric: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition bg-white"
            >
              <option value="">Select a fabric</option>
              {collections.map((c) => <option key={c.title} value={c.title}>{c.title} ({c.gsm})</option>)}
              <option value="Shade Card Request">Shade Card Request</option>
              <option value="Custom Requirement">Custom Requirement</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Message</label>
          <textarea
            placeholder="Tell us your quantity, color requirements, or any specific needs..."
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition resize-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="w-full bg-[#081225] text-white py-4 rounded-2xl font-bold hover:bg-[#0f1f63] transition text-sm flex items-center justify-center gap-2"
        >
          💬 Send via WhatsApp
        </button>
        <p className="text-center text-xs text-gray-400">
          Or email directly:{" "}
          <a href="mailto:saikripatextiles58@gmail.com" className="text-[#c6a55c] hover:underline">
            saikripatextiles58@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

// ── Scroll to Top ──────────────────────────────────────────────────────────────
function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-24 right-5 z-50 bg-[#081225] text-[#d4af37] w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-lg hover:bg-[#0f1f63] transition"
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LuxuryTextileWebsite() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [barVisible, setBarVisible] = useState(true);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const navTopOffset = barVisible ? "pt-[100px]" : "pt-[72px]";

  const bestsellers = collections.filter((c) =>
    ["superior-collection", "gold-club", "aura-plus"].includes(c.slug)
  );

  useEffect(() => {
    AOS.init({
      duration: 500,
      once: true,
      easing: "ease-out",
      offset: 50,
    });
  }, []);

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden font-sans scroll-smooth">
      {/* Announcement Bar */}
      {barVisible && (
        <div className="fixed top-0 left-0 w-full z-[60] bg-[#d4af37] text-[#08102e] text-xs font-bold py-2 px-4 flex items-center justify-between">
          <span className="flex-1 text-center">
            🚚 Free Sample Dispatch Across India &nbsp;|&nbsp; Call: +91 89498 81253 &nbsp;|&nbsp; Mon–Sat 10AM–7PM
          </span>
          <button onClick={() => setBarVisible(false)} className="ml-4 text-[#08102e]/60 hover:text-[#08102e] text-xl leading-none">×</button>
        </div>
      )}

      <Navbar hasBar={barVisible} onBookAppointment={() => setAppointmentOpen(true)} />

      {/* ── HERO ── */}
      <section
        id="home"
        className={`relative min-h-screen flex items-center text-white px-6 overflow-hidden ${navTopOffset}`}
      >
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1640767760729-7bfb6ce43ad4?q=80&w=1600&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#040a1c]/75" />
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4af37]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/8 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center py-16 relative z-10">
          <div data-aos="fade-right">
            <div className="inline-flex px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[#d4af37] text-xs tracking-[0.2em] uppercase font-bold backdrop-blur mb-7">
              🏭 Bhilwara Premium Textile Manufacturer
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight">
              Premium Uniform Fabrics For Modern Institutions
            </h1>
            <p className="mt-7 text-lg text-gray-300 leading-relaxed max-w-xl">
              Trusted by 1000+ schools, corporates, hotels, and wholesalers across India.
              Direct factory pricing. 48-hour sample dispatch.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {["✅ GSM Certified", "📦 Pan-India Delivery", "🎨 350+ Shades", "⚡ 48hr Sample"].map((b) => (
                <span key={b} className="bg-white/5 border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-full">
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#collections" className="bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#08102e] px-8 py-4 rounded-2xl font-bold hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300">
                Explore Collections
              </a>
              <button
                onClick={() => setAppointmentOpen(true)}
                className="border border-[#d4af37]/40 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 transition-all duration-300 px-8 py-4 rounded-2xl font-semibold text-white backdrop-blur flex items-center gap-2"
              >
                📅 Book a Meeting
              </button>
              <a
                href="https://wa.me/918949881253"
                target="_blank"
                rel="noreferrer"
                className="border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 px-8 py-4 rounded-2xl font-semibold text-white backdrop-blur"
              >
                WhatsApp Inquiry
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block" data-aos="fade-left">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#d4af37]/20 to-[#0b1748]/30 blur-3xl rounded-[40px]" />
            <img
              src="/hero.jpg"
              alt="Premium folded suiting fabric rolls"
              className="relative rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.5)] w-full h-[620px] object-cover border border-white/10"
            />
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl px-5 py-4 shadow-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Current Bestseller</p>
              <p className="text-sm font-black text-[#081225]">Superior Collection</p>
              <p className="text-xs text-[#c6a55c] font-bold">380 GSM · 65/35 PV</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[#081225] py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            ["1000+", "Wholesale Clients"],
            ["380 GSM", "Premium Quality"],
            ["Pan India", "Supply Network"],
            ["350+", "Shade Options"],
          ].map(([val, label], i) => (
            <div key={label} data-aos="zoom-in">
              <h3 className="text-3xl md:text-4xl font-black text-[#d4af37]">{val}</h3>
              <p className="mt-2 text-xs text-gray-400 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COLLECTIONS (Bestsellers) ── */}
      <section id="collections" className="py-28 px-6 bg-[#f8f7f4]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14" data-aos="fade-up">
            <p className="uppercase tracking-[0.3em] text-xs text-[#c6a55c] font-bold mb-3">Bestsellers</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#081225] leading-tight">
              Our Most Trusted Fabrics
            </h2>
            <p className="mt-5 text-gray-500 leading-relaxed">
              The three collections our wholesale buyers reorder most — proven across schools, corporate uniforms, and hospitality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            {bestsellers.map((item, i) => (
              <div
                key={item.title}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className="group bg-white/80 backdrop-blur-xl rounded-[32px] overflow-hidden border border-gray-200/60 hover:border-[#d4af37]/30 hover:-translate-y-3 hover:shadow-[0_25px_70px_rgba(0,0,0,0.12)] transition-all duration-500 flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#081225]/80 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
                      {item.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-[#d4af37] text-[#081225] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      ★ Bestseller
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className="bg-[#081225] text-white px-3 py-1 rounded-full text-[10px] font-bold">{item.gsm}</span>
                    <span className="bg-[#d4af37]/15 text-[#7a6015] px-3 py-1 rounded-full text-[10px] font-bold">{item.blend}</span>
                  </div>
                  <h3 className="text-xl font-black text-[#081225] mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-grow">{item.description.substring(0, 90)}...</p>
                  <div className="mt-5 space-y-2">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="w-full bg-[#081225] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0f1f63] transition"
                    >
                      View Details
                    </button>
                    <a
                      href={`https://wa.me/918949881253?text=Hi, I'm interested in ${item.title} (${item.gsm}). Please share pricing.`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center w-full border border-[#25d366] text-[#1a9e4d] py-3 rounded-xl font-bold text-sm hover:bg-[#f0fdf5] transition"
                    >
                      💬 WhatsApp Quote
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center" data-aos="fade-up">
            <p className="text-gray-500 text-sm mb-4">
              Looking for Gaberdine, lightweight Trovin, or other Matty blends?
            </p>
            <a
              href="/catalogue"
              className="inline-flex items-center gap-2 bg-[#081225] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#0f1f63] transition shadow-lg"
            >
              📚 View Full Catalogue
            </a>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section id="why-us" className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="uppercase tracking-[0.3em] text-xs text-[#c6a55c] font-bold mb-3">Why Saikripa</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#081225] leading-tight">
              Why 1000+ Buyers Trust Us
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {whyUs.map((w, i) => (
              <div
                key={w.title}
                className="bg-[#f8f7f4] rounded-[24px] p-7 hover:shadow-[0_10px_40px_rgba(0,0,0,0.07)] transition-all duration-300 border border-gray-100 hover:border-[#d4af37]/30"
              >
                <div className="text-3xl mb-4">{w.icon}</div>
                <h3 className="text-lg font-black text-[#081225] mb-2">{w.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="relative py-28 px-6 bg-[#f8f7f4] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1705493253566-1522b9015c58?q=80&w=1600&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div data-aos="fade-up">
            <img
              src="https://images.unsplash.com/photo-1705493253566-1522b9015c58?q=80&w=1400&auto=format&fit=crop"
              alt="Saikripa Textiles Manufacturing"
              className="rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full border border-gray-100 hover:scale-[1.01] transition-all duration-500"
            />
          </div>
          <div data-aos="fade-up" data-aos-delay="100">
            <p className="uppercase tracking-[0.3em] text-xs text-[#c6a55c] font-bold mb-4">About Us</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#081225] leading-tight mb-7">
              Craftsmanship From The Heart of Bhilwara
            </h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              Saikripa Textiles is a Bhilwara-based premium suiting manufacturer supplying high-grade uniform fabrics to institutions, wholesalers, and corporate buyers across India. Our fabrics are engineered for consistency in GSM, color fastness, and durability.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              With over a decade of expertise and a strong supply chain rooted in Rajasthan's textile hub, we offer direct-factory pricing with the quality assurance of a trusted institution.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[["10+", "Years of Experience"], ["1000+", "Happy Clients"], ["6", "Premium Collections"], ["48hr", "Sample Dispatch"]].map(([val, label]) => (
                <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <p className="text-2xl font-black text-[#d4af37]">{val}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section id="process" className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="uppercase tracking-[0.3em] text-xs text-[#c6a55c] font-bold mb-3">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#081225] leading-tight">
              From Inquiry to Delivery
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-[#d4af37]/40 to-transparent z-0 -translate-y-1/2" />
                )}
                <div className="bg-[#f8f7f4] rounded-[24px] p-7 border border-gray-100 relative z-10 h-full">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <span className="text-4xl font-black text-[#d4af37]/30 block mb-1">{s.step}</span>
                  <h3 className="text-lg font-black text-[#081225] mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28 px-6 bg-[#081225]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14" data-aos="fade-up">
            <p className="uppercase tracking-[0.3em] text-xs text-[#c6a55c] font-bold mb-3">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-7">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                data-aos="zoom-in"
                className="bg-white/5 border border-white/10 rounded-[24px] p-7 hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-black text-sm flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-[#d4af37] text-sm">★</span>)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-xs text-[#c6a55c] font-bold mb-3">FAQ</p>
            <h2 className="text-4xl font-black text-[#081225]">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-28 px-6 bg-[#f8f7f4]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14" data-aos="fade-up">
            <p className="uppercase tracking-[0.3em] text-xs text-[#c6a55c] font-bold mb-3">Get In Touch</p>
            <h2 className="text-4xl md:text-5xl font-black text-[#081225]">Request Pricing or Samples</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Share your requirements and we'll respond with pricing, shade cards, and dispatch timelines within 4 hours.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <ContactForm />
            <div className="space-y-6">
              <div className="bg-white rounded-[24px] p-7 border border-gray-100 shadow-sm">
                <h3 className="font-black text-[#081225] mb-4 text-lg">Contact Information</h3>
                <div className="space-y-4">
                  {[
                    ["📞", "Phone / WhatsApp", "+91 89498 81253"],
                    ["✉️", "Email", "saikripatextiles58@gmail.com"],
                    ["📍", "Location", "38A, Marvel Square, Gandhinagar, Bhilwara, Rajasthan"],
                    ["⏰", "Business Hours", "Mon–Sat: 10:00 AM – 7:00 PM"],
                  ].map(([icon, label, value]) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">{label}</p>
                        <p className="text-[#081225] font-semibold text-sm mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#081225] rounded-[24px] p-7">
                <h3 className="font-black text-white mb-2">Need a Physical Shade Card?</h3>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                  Request our full shade card booklet with fabric swatches — dispatched to your address within 3–5 business days.
                </p>
                <a
                  href="https://wa.me/918949881253?text=Hi, I'd like to request a physical shade card booklet. Please share details."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#d4af37] text-[#081225] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#c49f2d] transition"
                >
                  🎨 Request Shade Card
                </a>
              </div>

              <div className="relative overflow-hidden rounded-[24px] p-7 border border-[#d4af37]/30"
                style={{
                  background: "linear-gradient(135deg, #f8f4e8 0%, #fdf9ee 50%, #fff8e1 100%)"
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 blur-3xl rounded-full pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#d4af37] flex items-center justify-center text-xl flex-shrink-0 shadow-lg">
                    📅
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-[#081225] mb-1">Schedule a Meeting</h3>
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                      Book a dedicated slot with our team — fabric demo, bulk pricing, or order discussion.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {["Mon – Sat", "10AM – 7PM", "Free Consultation"].map((tag) => (
                        <span key={tag} className="text-[10px] bg-[#d4af37]/15 text-[#7a6015] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => setAppointmentOpen(true)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#08102e] px-6 py-3 rounded-xl font-bold text-sm hover:shadow-[0_8px_24px_rgba(212,175,55,0.35)] hover:scale-[1.02] transition-all duration-200"
                    >
                      📅 Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#020817] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-black text-[#d4af37] uppercase mb-2">Saikripa Textiles</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-5">
                Premium uniform suiting manufacturer from Bhilwara, Rajasthan. Direct factory pricing with pan-India supply.
              </p>
              <div className="flex gap-3">
                <a href="https://wa.me/918949881253" target="_blank" rel="noreferrer" className="bg-[#25d366]/10 border border-[#25d366]/20 text-[#25d366] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#25d366]/20 transition">
                  💬 WhatsApp
                </a>
                <a href="mailto:saikripatextiles58@gmail.com" className="bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition">
                  ✉ Email
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Collections</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {collections.map((c) => (
                  <li key={c.title}>
                    <button onClick={() => setSelectedItem(c)} className="hover:text-[#d4af37] transition text-left">
                      {c.title}
                    </button>
                  </li>
                ))}
                <li className="pt-2 border-t border-white/10 mt-2">
                  <a href="/catalogue" className="text-[#d4af37] font-bold hover:underline">
                    View Full Catalogue →
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>+91 89498 81253</li>
                <li>saikripatextiles58@gmail.com</li>
                <li>38A, Marvel Square, Ground Floor, Gandhinagar</li>
                <li>Bhilwara, Rajasthan</li>
                <li className="text-gray-500 text-xs mt-3">Mon–Sat: 10AM – 7PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">© 2025 Saikripa Textiles. All rights reserved.</p>
            <p className="text-gray-600 text-xs">Premium Suiting Manufacturer · Bhilwara, India</p>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp Float ── */}
      <a
        href="https://wa.me/918949881253"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 bg-[#25d366] text-white w-14 h-14 rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        aria-label="WhatsApp"
      >
        💬
      </a>

      <ScrollToTop />

      {selectedItem && <ProductModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {appointmentOpen && <AppointmentModal onClose={() => setAppointmentOpen(false)} />}
    </div>
  );
}