import React, { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Chatbot from "./components/Chatbot";
import { collections } from "./data/collections";

// ── Custom Icons ─────────────────────────────────────────────────────────────
function Icon({ name, className = "w-8 h-8" }) {
  const icons = {
    factory: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V9l6 4V9l6 4V5l6 4v12H3z" />
        <rect x="6" y="15" width="2" height="3" fill="currentColor" />
        <rect x="11" y="15" width="2" height="3" fill="currentColor" />
        <rect x="16" y="15" width="2" height="3" fill="currentColor" />
      </svg>
    ),
    certified: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
      </svg>
    ),
    palette: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 17v.01M14 3h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    ),
    bolt: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    handshake: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11l-4 4-4-4m4-7v11M3 21h18" />
      </svg>
    ),
    globe: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    document: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    chat: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    package: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    truck: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 11-4 0 2 2 0 014 0zM20 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    check: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    phone: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    mail: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    pin: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    clock: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return icons[name] || null;
}

// ── Utility: lock/unlock body scroll ──────────────────────────────────────────
const lockScroll = () => (document.body.style.overflow = "hidden");
const unlockScroll = () => (document.body.style.overflow = "");

// ── Reusable: Gold gradient section divider ─────────────────────────────────
function GoldDivider({ position = "top" }) {
  const posCls = position === "top" ? "top-0" : "bottom-0";
  return (
    <div className={`absolute ${posCls} left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent pointer-events-none`} />
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: "Rakesh Sharma",
    role: "Principal, Delhi Public School, Jaipur",
    initials: "RS",
    meta: "Annual orders since 2018 · 8,000+ meters",
    text: "Saikripa Textiles has been our uniform fabric supplier for 6 years. The GSM consistency and color retention even after repeated washes is exceptional.",
  },
  {
    name: "Anjali Mehta",
    role: "Purchase Manager, Marriott Hotels, Mumbai",
    initials: "AM",
    meta: "Hospitality uniforms · 5,500 meters / quarter",
    text: "Gold Club fabric is our preferred choice for all housekeeping and front-desk uniforms. The lustrous finish and durability have exceeded expectations.",
  },
  {
    name: "Suresh Patel",
    role: "Wholesale Dealer, Surat",
    initials: "SP",
    meta: "Wholesale partner · 12,000+ meters / month",
    text: "Best wholesale rates in Bhilwara. Sample dispatch within 48 hours and bulk orders always on time. Highly recommended for dealers across Gujarat.",
  },
];

const faqs = [
  { q: "What is the minimum order quantity?", a: "MOQ varies by collection — starting from 50 meters for select fabrics and 100 meters for our premium suiting range. Contact us for custom requirements." },
  { q: "Do you dispatch fabric samples?", a: "Yes. We offer free sample swatches (up to 3 designs) with shipping charges. Samples are dispatched within 48 hours of order confirmation." },
  { q: "What does 65/35 PV blend mean?", a: "65% Polyester and 35% Viscose. This blend provides the durability of polyester with the soft, breathable drape of viscose — ideal for uniform-grade suiting." },
  { q: "Do you supply pan-India?", a: "Yes. We ship to all major cities and wholesale markets across India via reputed transport partners. Custom logistics arrangements available for large orders." },
  { q: "Can you supply custom shade card colors?", a: "Yes, we offer dyeing for bulk orders with custom shades. Minimum quantity applies. Please share your Pantone or physical swatch reference." },
];

const steps = [
  { iconName: "document", step: "01", title: "Browse Catalogue", desc: "Explore our premium fabric collections and GSM options online or request our physical shade card." },
  { iconName: "chat", step: "02", title: "Request Quote", desc: "Share your requirements — quantity, fabric, color, and delivery timeline. We respond within 4 hours." },
  { iconName: "package", step: "03", title: "Sample Dispatch", desc: "Receive free fabric swatches within 48 hours to verify quality, color, and GSM before bulk order." },
  { iconName: "truck", step: "04", title: "Bulk Fulfillment", desc: "Place your bulk order with confidence. Pan-India delivery with real-time tracking and quality assurance." },
];

const whyUs = [
  { iconName: "factory", title: "Bhilwara Manufacturing", desc: "Direct from India's textile capital — zero middleman. You get factory prices with guaranteed quality." },
  { iconName: "certified", title: "GSM Certified Quality", desc: "Every batch is tested for GSM accuracy, color fastness, and tensile strength before dispatch." },
  { iconName: "palette", title: "350+ Shade Options", desc: "Extensive shade cards across all collections. Custom dyeing available for bulk institutional orders." },
  { iconName: "bolt", title: "48-Hour Sample Dispatch", desc: "One of the fastest sample turnaround times in Bhilwara — because your deadlines matter." },
  { iconName: "handshake", title: "Wholesale Friendly", desc: "Flexible MOQ, competitive pricing, and dedicated account support for dealers and distributors." },
  { iconName: "globe", title: "Pan-India Supply", desc: "Trusted by 1000+ buyers from Surat to Chennai. Reliable logistics, on-time delivery, every time." },
];

// ── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ end, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(end * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar({ hasBar }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const topOffset = hasBar ? "top-[36px]" : "top-0";
  const navLinks = ["Home", "Collections", "About", "Process", "Contact"];

  return (
    <>
      <header className={`fixed ${topOffset} left-0 w-full z-50 backdrop-blur-2xl bg-[#020817]/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)]`}>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#home">
            <h1 className="text-xl font-black tracking-wider text-[#d4af37] uppercase leading-tight">
              Saikripa Textiles
            </h1>
            <p className="text-[10px] text-[#7a8499] tracking-[0.25em] uppercase">
              Premium Suiting House · Bhilwara
            </p>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm text-white/80 font-medium">
            {navLinks.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`} className="hover:text-[#d4af37] transition-colors duration-200">
                {l}
              </a>
            ))}
            <a href="/catalogue" className="hover:text-[#d4af37] transition-colors duration-200">Catalogue</a>
          </nav>

          <button className="md:hidden text-white focus:outline-none" onClick={() => { setMenuOpen(true); lockScroll(); }} aria-label="Open menu">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[70] flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setMenuOpen(false); unlockScroll(); }} />
          <div className="relative ml-auto w-72 h-full bg-[#0a1124] border-l border-[#1a2233] flex flex-col p-8 shadow-2xl">
            <button className="self-end text-white/60 hover:text-white mb-8 text-2xl" onClick={() => { setMenuOpen(false); unlockScroll(); }} aria-label="Close menu">×</button>
            <div className="mb-8">
              <p className="text-[#d4af37] font-black text-lg uppercase">Saikripa Textiles</p>
              <p className="text-[#7a8499] text-xs mt-1">Premium Suiting · Bhilwara</p>
            </div>
            <nav className="flex flex-col gap-5">
              {navLinks.map((l) => (
                <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`} onClick={() => { setMenuOpen(false); unlockScroll(); }} className="text-white/80 hover:text-[#d4af37] text-lg font-semibold transition">{l}</a>
              ))}
              <a href="/catalogue" className="text-white/80 hover:text-[#d4af37] text-lg font-semibold transition">Catalogue</a>
            </nav>
            <div className="mt-auto space-y-3">
              <a href="https://wa.me/918949881253" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] py-3 rounded-xl font-bold">WhatsApp Us</a>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=saikripatextiles58@gmail.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full border border-[#d4af37]/40 bg-[#d4af37]/10 text-white py-3 rounded-xl font-bold">Email</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ item, onClose }) {
  const allImgs = item.images || [item.image];
  const imgs = allImgs.length > 1 ? allImgs.slice(1) : allImgs;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    lockScroll();
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % imgs.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + imgs.length) % imgs.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); unlockScroll(); };
  }, [onClose, imgs.length]);

  const next = () => setIdx((i) => (i + 1) % imgs.length);
  const prev = () => setIdx((i) => (i - 1 + imgs.length) % imgs.length);

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#0a1124] border border-[#1a2233] w-full max-w-3xl rounded-[28px] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative bg-[#020817]">
          <img src={imgs[idx]} alt={item.title} className="w-full max-h-[60vh] object-contain" />
          {imgs.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#0a1124]/90 hover:bg-[#0a1124] border border-[#1a2233] rounded-full w-10 h-10 flex items-center justify-center text-[#d4af37] font-bold text-xl shadow-md" aria-label="Previous image">‹</button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#0a1124]/90 hover:bg-[#0a1124] border border-[#1a2233] rounded-full w-10 h-10 flex items-center justify-center text-[#d4af37] font-bold text-xl shadow-md" aria-label="Next image">›</button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {imgs.map((_, i) => (<button key={i} onClick={() => setIdx(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === idx ? "bg-[#d4af37]" : "bg-white/40"}`} aria-label={`Go to image ${i + 1}`} />))}
              </div>
            </>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 bg-[#0a1124]/90 border border-[#1a2233] rounded-full w-9 h-9 flex items-center justify-center text-white hover:border-[#d4af37]/40 font-bold text-lg" aria-label="Close">×</button>
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="bg-[#0a1124]/90 backdrop-blur border border-[#1a2233] text-white px-3 py-1 rounded-full text-xs font-bold">{item.gsm}</span>
            <span className="bg-[#d4af37] text-[#020817] px-3 py-1 rounded-full text-xs font-bold">{item.blend}</span>
          </div>
        </div>
        <div className="p-8">
          <p className="text-xs text-[#d4af37] font-bold uppercase tracking-widest mb-1">{item.category}</p>
          <h3 className="text-3xl font-black text-white mb-3">{item.title}</h3>
          <p className="text-[#cbd5e1] leading-relaxed mb-6">{item.description}</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[["MOQ", item.moq], ["Available Colors", item.colors], ["Fabric Finish", item.finish], ["Best For", item.uses]].map(([label, value]) => (
              <div key={label} className="bg-[#020817] border border-[#1a2233] rounded-2xl p-4">
                <p className="text-xs text-[#7a8499] uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={`https://wa.me/918949881253?text=Hi, I'm interested in the ${item.title} (${item.gsm}, ${item.blend}). Please share pricing details.`} target="_blank" rel="noreferrer" className="flex-1 bg-[#d4af37] text-[#020817] py-4 rounded-2xl font-bold text-center hover:bg-[#c49f2d] transition">Inquire on WhatsApp</a>
            <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=saikripatextiles58@gmail.com&su=${encodeURIComponent(`Inquiry: ${item.title}`)}&body=${encodeURIComponent(`Hi, I am interested in ${item.title} (${item.gsm}, ${item.blend}). Kindly share pricing and availability.`)}`} target="_blank" rel="noreferrer" className="flex-1 border-2 border-[#d4af37] text-[#d4af37] py-4 rounded-2xl font-bold text-center hover:bg-[#d4af37] hover:text-[#020817] transition">Email Inquiry</a>
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
    <div className="border border-[#1a2233] rounded-2xl overflow-hidden bg-[#0a1124] hover:border-[#d4af37]/30 transition">
      <button className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#0e1730] transition" onClick={() => setOpen(!open)}>
        <span className="font-bold text-white pr-4">{q}</span>
        <span className={`text-[#d4af37] text-xl font-light flex-shrink-0 transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-6 py-5 bg-[#020817] border-t border-[#1a2233]">
          <p className="text-[#cbd5e1] leading-relaxed">{a}</p>
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

  const inputCls = "w-full bg-[#020817] border border-[#1a2233] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37] transition";

  if (submitted) {
    return (
      <div className="bg-[#0a1124] border border-[#1a2233] rounded-[32px] p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]" style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.2)" }}>
          <Icon name="check" className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">Inquiry Sent!</h3>
        <p className="text-[#cbd5e1]">You'll be redirected to WhatsApp. We respond within 4 hours on business days.</p>
        <button onClick={() => setSubmitted(false)} className="mt-6 text-[#d4af37] font-bold text-sm hover:underline">Submit another inquiry</button>
      </div>
    );
  }

  return (
    <div className="bg-[#0a1124] border border-[#1a2233] rounded-[32px] p-8">
      <h3 className="text-2xl font-black text-white mb-1">Send an Inquiry</h3>
      <p className="text-[#cbd5e1] text-sm mb-6">We respond within 4 business hours</p>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#7a8499] uppercase tracking-widest mb-1">Full Name *</label>
            <input type="text" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#7a8499] uppercase tracking-widest mb-1">Phone / WhatsApp *</label>
            <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#7a8499] uppercase tracking-widest mb-1">City</label>
            <input type="text" placeholder="Your city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#7a8499] uppercase tracking-widest mb-1">Fabric / Collection</label>
            <select value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} className={inputCls + " cursor-pointer"}>
              <option value="">Select a fabric</option>
              {collections.map((c) => <option key={c.title} value={c.title}>{c.title} ({c.gsm})</option>)}
              <option value="Shade Card Request">Shade Card Request</option>
              <option value="Custom Requirement">Custom Requirement</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#7a8499] uppercase tracking-widest mb-1">Message</label>
          <textarea placeholder="Tell us your quantity, color requirements, or any specific needs..." rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls + " resize-none"} />
        </div>
        <button onClick={handleSubmit} className="w-full bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] py-4 rounded-2xl font-bold hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-[1.01] transition-all duration-300 text-sm flex items-center justify-center gap-2">
          Send via WhatsApp
        </button>
        <p className="text-center text-xs text-[#7a8499]">
          Or email directly: <a href="https://mail.google.com/mail/?view=cm&fs=1&to=saikripatextiles58@gmail.com" target="_blank" rel="noreferrer" className="text-[#d4af37] hover:underline">saikripatextiles58@gmail.com</a>
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
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-24 right-5 z-50 bg-[#0a1124] border border-[#d4af37]/40 text-[#d4af37] w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-lg hover:bg-[#0e1730] transition" aria-label="Back to top">↑</button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LuxuryTextileWebsite() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [barVisible, setBarVisible] = useState(true);
  const navTopOffset = barVisible ? "pt-[100px]" : "pt-[72px]";

  const bestsellers = collections.filter((c) => ["superior-collection", "gold-club", "aura-plus"].includes(c.slug));

  useEffect(() => {
    AOS.init({ duration: 500, once: true, easing: "ease-out", offset: 50 });
  }, []);

  return (
    <div className="bg-[#020817] text-[#e8edf5] overflow-x-hidden font-sans scroll-smooth">
      {/* Announcement Bar */}
      {barVisible && (
        <div className="fixed top-0 left-0 w-full z-[60] border-b border-[#1a2233] text-[#e8edf5] text-xs py-2.5 px-4 flex items-center justify-between" style={{ background: "linear-gradient(180deg, #1a1308 0%, #0a0d1e 100%)" }}>
          <span className="flex-1 text-center tracking-wider">
            <span className="text-[#f5f0e1] font-bold">Free Sample Dispatch</span>
            <span className="text-[#f5f0e1]/40 mx-3">·</span>
            <span className="text-[#f5f0e1] font-medium">+91 89498 81253</span>
            <span className="text-[#f5f0e1]/40 mx-3">·</span>
            <span className="text-[#f5f0e1]/80">Mon–Sat 10AM–7PM</span>
          </span>
          <button onClick={() => setBarVisible(false)} className="ml-4 text-[#7a8499] hover:text-white text-xl leading-none">×</button>
        </div>
      )}

      <Navbar hasBar={barVisible} />

      {/* ── HERO ── */}
      <section id="home" className={`relative min-h-screen flex items-center text-white px-6 overflow-hidden ${navTopOffset}`}>
        {/* Clean solid dark base */}
        <div className="absolute inset-0 z-0 bg-[#020817]" />
        {/* Single diffuse gold halo behind image side — no visible edges */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[900px] h-[900px] bg-[#d4af37]/10 blur-[200px] rounded-full pointer-events-none" />
        {/* Soft corner warmth bottom-left */}
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-[#d4af37]/5 blur-[180px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center py-16 relative z-10">
          <div data-aos="fade-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] text-xs tracking-[0.2em] uppercase font-bold backdrop-blur mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
              Bhilwara Premium Textile Manufacturer
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight text-white">
              Premium Uniform Fabrics For Modern Institutions
            </h1>
            <p className="mt-7 text-lg text-[#cbd5e1] leading-relaxed max-w-xl">
              Trusted by 1000+ schools, corporates, hotels, and wholesalers across India. Direct factory pricing. 48-hour sample dispatch.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {["GSM Certified", "Pan-India Delivery", "350+ Shades", "48hr Sample"].map((b) => (
                <span key={b} className="inline-flex items-center gap-2 bg-[#0a1124] border border-[#1a2233] text-[#a8b0c0] text-xs px-3 py-1.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-[#d4af37]"></span>
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#collections" className="bg-gradient-to-r from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] px-8 py-4 rounded-2xl font-bold hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300">Explore Collections</a>
              <a href="https://wa.me/918949881253" target="_blank" rel="noreferrer" className="border border-[#1a2233] bg-[#0a1124] hover:bg-[#0e1730] transition-all duration-300 px-8 py-4 rounded-2xl font-semibold text-white">WhatsApp Inquiry</a>
            </div>
          </div>

          <div className="relative hidden lg:block" data-aos="fade-left">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/10 blur-3xl rounded-[40px]" />
            <img src="/new.jpg" alt="Premium suiting fabric texture" className="relative rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_80px_rgba(212,175,55,0.15)] w-full h-[620px] object-cover border border-[#1a2233]" />
            <a href="#collections" className="absolute -bottom-6 -left-6 bg-[#0a1124]/95 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl px-6 py-5 hover:border-[#d4af37]/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212, 175, 55, 0.2)" }}>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse"></span>
                <p className="text-[9px] text-[#d4af37]/80 font-bold uppercase tracking-[0.3em]">Current Bestseller</p>
              </div>
              <p className="text-base font-black text-white group-hover:text-[#d4af37] transition-colors mb-1.5">Superior Collection →</p>
              <p className="text-[11px] text-[#d4af37]/80 font-medium tracking-wider">380 GSM · 65/35 PV</p>
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative bg-[#0a1124] py-14">
        <GoldDivider position="top" />
        <GoldDivider position="bottom" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { num: 1000, suffix: "+", label: "Wholesale Clients" },
            { num: 380, suffix: " GSM", label: "Premium Quality" },
            { text: "Pan India", label: "Supply Network" },
            { num: 350, suffix: "+", label: "Shade Options" },
          ].map((stat) => (
            <div key={stat.label} data-aos="zoom-in">
              <h3 className="text-3xl md:text-4xl font-black text-[#d4af37]">
                {stat.text ? stat.text : <Counter end={stat.num} suffix={stat.suffix} />}
              </h3>
              <p className="mt-2 text-xs text-[#a8b0c0] uppercase tracking-widest font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COLLECTIONS (Bestsellers) ── */}
      <section id="collections" className="relative py-28 px-6 bg-[#020817]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14" data-aos="fade-up">
            <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">Bestsellers</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">Our Most Trusted Fabrics</h2>
            <p className="mt-5 text-[#cbd5e1] leading-relaxed">The three collections our wholesale buyers reorder most — proven across schools, corporate uniforms, and hospitality.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            {bestsellers.map((item, i) => (
              <div key={item.title} data-aos="fade-up" data-aos-delay={i * 100}>
              <div onClick={() => setSelectedItem(item)} className="bestseller-card group relative bg-[#0a1124] rounded-[32px] overflow-hidden border border-[#1a2233] flex flex-col cursor-pointer h-full">
                <div className="relative aspect-[4/3] bg-[#020817] flex items-center justify-center overflow-hidden">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover bestseller-img" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#020817]/90 backdrop-blur border border-[#1a2233] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">{item.category}</span>
                  </div>
                  {i === 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-[#d4af37] text-[#020817] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)]">★ Top Pick</span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className="bg-[#020817] border border-[#1a2233] text-white px-3 py-1 rounded-full text-[10px] font-bold">{item.gsm}</span>
                    <span className="bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] px-3 py-1 rounded-full text-[10px] font-bold">{item.blend}</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
                  <p className="text-[#a8b0c0] text-sm leading-relaxed flex-grow">{item.description.substring(0, 90)}...</p>
                  <div className="mt-5 space-y-2">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }} className="w-full bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] py-3 rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300">View Details</button>
                    <a onClick={(e) => e.stopPropagation()} href={`https://wa.me/918949881253?text=Hi, I'm interested in ${item.title} (${item.gsm}). Please share pricing.`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full border border-[#d4af37]/40 text-[#d4af37] py-3 rounded-xl font-bold text-sm hover:bg-[#d4af37]/10 transition">WhatsApp Quote</a>
                  </div>
                </div>
              </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center" data-aos="fade-up">
            <a href="/catalogue" className="group inline-flex items-center gap-3 bg-[#0a1124] border border-[#d4af37]/30 text-white px-8 py-5 rounded-2xl font-bold hover:border-[#d4af37]/60 hover:bg-[#0e1730] transition">
              <span className="text-left">
                <span className="block text-sm">View All Collections</span>
                <span className="block text-[10px] text-[#7a8499] font-medium uppercase tracking-widest mt-0.5">Gaberdine, Trovin, Matty &amp; more</span>
              </span>
              <span className="text-[#d4af37] group-hover:translate-x-1 transition-transform text-lg">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section id="why-us" className="relative py-28 px-6 bg-[#0a1124]">
        <GoldDivider position="top" />
        <GoldDivider position="bottom" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">Why Saikripa</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">Why 1000+ Buyers Trust Us</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {whyUs.map((w) => (
              <div key={w.title} className="bg-[#020817] rounded-[24px] p-7 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-300 border border-[#1a2233] hover:border-[#d4af37]/40">
                <div className="text-[#d4af37] mb-4 w-12 h-12 rounded-xl bg-[#020817] border border-[#1a2233] flex items-center justify-center">
                  <Icon name={w.iconName} className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">{w.title}</h3>
                <p className="text-[#cbd5e1] text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="relative py-28 px-6 bg-[#020817] overflow-hidden">
        {/* Subtle gold ambient lighting */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-40" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] pointer-events-none opacity-30" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)" }} />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div data-aos="fade-up" className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#d4af37]/15 to-transparent blur-3xl rounded-[40px] pointer-events-none" />
            <img src="https://images.unsplash.com/photo-1705493253566-1522b9015c58?q=80&w=1400&auto=format&fit=crop" alt="Saikripa Textiles Manufacturing" className="relative rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full border border-[#1a2233] hover:scale-[1.01] transition-all duration-500" />
          </div>

          <div data-aos="fade-up" data-aos-delay="100">
            <div className="flex items-center gap-3 mb-4">
              <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold">About Us</p>
              <span className="w-1 h-1 rounded-full bg-[#d4af37]/50"></span>
              <p className="uppercase tracking-[0.3em] text-xs text-[#a8b0c0] font-bold">Since 2014</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mb-7">Manufacturers Of Uniform Suitings From Bhilwara</h2>

            <p className="text-[#cbd5e1] leading-relaxed mb-5">
              We're manufacturers in the field of uniform suitings — based in Bhilwara, Rajasthan's textile capital. Every fabric leaves our facility built on a simple promise: <span className="text-white font-semibold">qualitative products that don't compromise on standards</span>.
            </p>

            <p className="text-[#cbd5e1] leading-relaxed mb-8">
              We offer the full range — from premium suiting at 380 GSM down to budget-friendly options — so every institution, wholesaler, and dealer can find something that fits their order. And we stand behind every meter we ship.
            </p>

            {/* Our promises — replaces generic stat tiles */}
            <div className="space-y-3 mb-8">
              {[
                { title: "Colors That Stay True", desc: "Our shades won't fade — washed, worn, or weather-tested." },
                { title: "Solidity Built To Last", desc: "GSM and weave integrity remain the same, forever." },
                { title: "Fast, Reliable Dispatch", desc: "Samples in 48 hours. Bulk orders shipped on time, pan-India." },
              ].map((p) => (
                <div key={p.title} className="relative bg-[#0a1124] rounded-2xl px-5 py-4 border border-[#1a2233] hover:border-[#d4af37]/40 transition overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#f4d77a] via-[#d4af37] to-[#a8842c]" />
                  <p className="text-sm font-black text-white mb-1 pl-2">{p.title}</p>
                  <p className="text-xs text-[#a8b0c0] leading-relaxed pl-2">{p.desc}</p>
                </div>
              ))}
            </div>

            {/* Compact stat strip */}
            <div className="grid grid-cols-3 gap-3">
              {[["12+", "Years"], ["1000+", "Clients"], ["6", "Collections"]].map(([val, label]) => (
                <div key={label} className="bg-[#0a1124] rounded-2xl p-3 border border-[#1a2233] text-center hover:border-[#d4af37]/30 transition">
                  <p className="text-xl font-black text-[#d4af37]">{val}</p>
                  <p className="text-[10px] text-[#a8b0c0] mt-0.5 font-semibold uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section id="process" className="relative py-28 px-6 bg-[#0a1124]">
        <GoldDivider position="top" />
        <GoldDivider position="bottom" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">From Inquiry to Delivery</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-[3.75rem] left-full w-full h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent z-0 pointer-events-none" />
                )}
                <div className="bg-[#020817] rounded-[24px] p-7 border border-[#1a2233] relative z-10 h-full hover:border-[#d4af37]/40 transition overflow-hidden">
                  <span className="absolute -top-2 -right-2 text-7xl font-black text-[#d4af37]/10 leading-none select-none pointer-events-none">{s.step}</span>
                  <div className="text-[#d4af37] mb-3 w-12 h-12 rounded-xl bg-[#020817] border border-[#1a2233] flex items-center justify-center relative z-10">
                    <Icon name={s.iconName} className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 relative z-10">{s.title}</h3>
                  <p className="text-[#cbd5e1] text-sm leading-relaxed relative z-10">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative py-28 px-6 bg-[#020817]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14" data-aos="fade-up">
            <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">What Our Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-7">
            {testimonials.map((t) => (
              <div key={t.name} data-aos="zoom-in" className="bg-[#0a1124] border border-[#1a2233] rounded-[24px] p-7 hover:border-[#d4af37]/40 transition relative overflow-hidden">
                <span className="absolute top-2 right-4 text-7xl text-[#d4af37]/10 font-serif leading-none select-none pointer-events-none">"</span>
                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="w-11 h-11 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-black text-sm flex-shrink-0">{t.initials}</div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <p className="text-[#7a8499] text-xs">{t.role}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#d4af37]/70 font-medium tracking-widest mb-3 relative uppercase">{t.meta}</p>
                <div className="flex gap-0.5 mb-4 relative">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-[#d4af37] text-sm">★</span>)}
                </div>
                <p className="text-[#cbd5e1] text-sm leading-relaxed relative">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative py-28 px-6 bg-[#0a1124]">
        <GoldDivider position="top" />
        <GoldDivider position="bottom" />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">FAQ</p>
            <h2 className="text-4xl font-black text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">{faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}</div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="relative py-28 px-6 bg-[#020817]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14" data-aos="fade-up">
            <p className="uppercase tracking-[0.3em] text-xs text-[#d4af37] font-bold mb-3">Get In Touch</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">Request Pricing or Samples</h2>
            <p className="mt-4 text-[#cbd5e1] max-w-xl mx-auto">Share your requirements and we'll respond with pricing, shade cards, and dispatch timelines within 4 hours.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <ContactForm />
            <div className="space-y-6">
              <div className="bg-[#0a1124] rounded-[24px] p-7 border border-[#1a2233]">
                <h3 className="font-black text-white mb-5 text-lg">Contact Information</h3>
                <div className="space-y-4">
                  {[
                    { iconName: "phone", label: "Phone / WhatsApp", value: "+91 89498 81253" },
                    { iconName: "mail", label: "Email", value: "saikripatextiles58@gmail.com" },
                    { iconName: "pin", label: "Location", value: "Marvel Square, 38-A, opposite Shiv Charan Mathur House, Gandhi Nagar, Bhilwara, Rajasthan 311001" },
                    { iconName: "clock", label: "Business Hours", value: "Mon–Sat: 10:00 AM – 7:00 PM" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#020817] border border-[#1a2233] flex items-center justify-center text-[#d4af37] flex-shrink-0">
                        <Icon name={c.iconName} className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-[#7a8499] uppercase tracking-wide font-bold">{c.label}</p>
                        <p className="text-white font-semibold text-sm mt-0.5">{c.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0a1124] rounded-[24px] p-7 border border-[#1a2233]">
                <h3 className="font-black text-white mb-2">Need a Physical Shade Card?</h3>
                <p className="text-[#cbd5e1] text-sm mb-5 leading-relaxed">Request our full shade card booklet with fabric swatches — dispatched to your address within 3–5 business days.</p>
                <a href="https://wa.me/918949881253?text=Hi, I'd like to request a physical shade card booklet. Please share details." target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] px-6 py-3 rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300">Request Shade Card</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative bg-[#0a1124] text-white py-16 px-6">
        <GoldDivider position="top" />
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-black text-[#d4af37] uppercase mb-2">Saikripa Textiles</h3>
              <p className="text-[#cbd5e1] text-sm leading-relaxed max-w-xs mb-5">Premium uniform suiting manufacturer from Bhilwara, Rajasthan. Direct factory pricing with pan-India supply.</p>
              <div className="flex gap-3">
                <a href="https://wa.me/918949881253" target="_blank" rel="noreferrer" className="bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#d4af37]/20 transition">WhatsApp</a>
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=saikripatextiles58@gmail.com" target="_blank" rel="noreferrer" className="bg-[#0a1124] border border-[#1a2233] text-[#a8b0c0] px-4 py-2 rounded-xl text-xs font-bold hover:border-[#d4af37]/40 transition">Email</a>
              </div>
            </div>
            <div>
              <h4 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Collections</h4>
              <ul className="space-y-2 text-[#a8b0c0] text-sm">
                {collections.map((c) => (
                  <li key={c.title}><button onClick={() => setSelectedItem(c)} className="hover:text-[#d4af37] transition text-left">{c.title}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Contact</h4>
              <ul className="space-y-2 text-[#a8b0c0] text-sm">
                <li>+91 89498 81253</li>
                <li>saikripatextiles58@gmail.com</li>
                <li>Marvel Square, 38-A</li>
                <li>opposite Shiv Charan Mathur House</li>
                <li>Gandhi Nagar, Bhilwara</li>
                <li>Rajasthan 311001</li>
                <li className="pt-1">
                  <a href="https://maps.app.goo.gl/pps1Wfq2oJKSfkdk6" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#d4af37] font-bold text-xs hover:underline">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Get Directions →
                  </a>
                </li>
                <li className="text-[#7a8499] text-xs mt-3">Mon–Sat: 10AM – 7PM</li>
              </ul>
            </div>
          </div>
          <div className="relative pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent pointer-events-none" />
            <p className="text-[#7a8499] text-xs">© 2025 Saikripa Textiles. All rights reserved.</p>
            <p className="text-[#7a8499] text-xs">Premium Suiting Manufacturer · Bhilwara, India</p>
          </div>
        </div>
      </footer>

      <ScrollToTop />

      {/* ── Chatbot (replaces WhatsApp Float + Book Appointment) ── */}
      <Chatbot />

      {selectedItem && <ProductModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}