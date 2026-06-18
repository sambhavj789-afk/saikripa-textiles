import React, { useState, useEffect, useRef } from "react";

const WHATSAPP_NUMBER = "918949881253";
const WHATSAPP_URL = (msg) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

const FLOWS = {
  start: {
    botMsg: "Namaste 🙏 I'm the Saikripa Assistant — here to help you with fabric inquiries.\n\nWhat can I help you with today?",
    options: [
      { label: "🧵 Browse Fabrics", next: "fabrics" },
      { label: "💰 Pricing & MOQ", next: "pricing" },
      { label: "📦 Request a Sample", next: "sample" },
      { label: "🏬 Visit Our Shop", next: "visit" },
      { label: "💬 Other Questions", next: "other" },
    ],
  },
  fabrics: {
    botMsg: "We have 6 premium collections, all manufactured in Bhilwara 🏭\n\nOur bestsellers:\n• Superior Collection — 380 GSM, 65/35 PV\n• Gold Club — 340 GSM, premium suiting\n• Aura Plus — soft, durable, vibrant shades\n\nWould you like to see the full catalog or get details on a specific fabric?",
    options: [
      { label: "💬 Get Full Catalog on WhatsApp", action: "whatsapp", message: "Hi, I'd like to see your full fabric catalog. Please share details." },
      { label: "💬 Ask About Specific Fabric", action: "whatsapp", message: "Hi, I'd like details on: ___ (please specify fabric name)" },
      { label: "🔙 Back to Menu", next: "start" },
    ],
  },
  pricing: {
    botMsg: "Here's a quick overview 💰\n\n• MOQ: 150m across our fabrics\n• Pricing depends on fabric, quantity, and shade\n• Direct factory pricing — no middleman\n• Bulk discounts available on 500m+ orders\n\nFor an accurate quote, please share your requirement on WhatsApp.",
    options: [
      { label: "💬 Get a Detailed Quote", action: "whatsapp", message: "Hi, I'd like a price quote.\nFabric: ___\nQuantity: ___ meters\nCity: ___" },
      { label: "🔙 Back to Menu", next: "start" },
    ],
  },
  sample: {
    botMsg: "Free fabric samples — dispatched within 48 hours! 📦\n\nYou can request up to 3 design swatches. Please share:\n\n• Your name & city\n• Fabrics you'd like to sample\n• Delivery address\n\nWe'll dispatch within 2 business days.",
    options: [
      { label: "💬 Request Sample on WhatsApp", action: "whatsapp", message: "Hi, I'd like to request fabric samples.\nName: ___\nCity: ___\nFabrics interested in: ___\nDelivery address: ___" },
      { label: "🔙 Back to Menu", next: "start" },
    ],
  },
  visit: {
    botMsg: "We'd love to host you at our shop! 🏬\n\n📍 Marvel Square, 38-A\nopposite Shiv Charan Mathur House\nGandhi Nagar, Bhilwara, Rajasthan 311001\n\n🕙 Mon–Sat: 10:00 AM – 7:00 PM\n📞 +91 89498 81253\n\nPlease WhatsApp or call us before visiting so we can have the right samples ready.",
    options: [
      { label: "📍 Get Directions", action: "link", url: "https://maps.app.goo.gl/pps1Wfq2oJKSfkdk6" },
      { label: "💬 WhatsApp Before Visiting", action: "whatsapp", message: "Hi, I'd like to visit your shop in Bhilwara. When would be a good time?\nI'm interested in: ___" },
      { label: "🔙 Back to Menu", next: "start" },
    ],
  },
  other: {
    botMsg: "Sure! For any other questions, the fastest way is to message us directly on WhatsApp. Our team responds within 4 hours on business days (Mon–Sat 10–7).\n\nYou can also email saikripatextiles58@gmail.com",
    options: [
      { label: "💬 Chat on WhatsApp", action: "whatsapp", message: "Hi, I have a question about Saikripa Textiles fabrics." },
      { label: "🔙 Back to Menu", next: "start" },
    ],
  },
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState("start");
  const [showOptions, setShowOptions] = useState(true);
  const [typing, setTyping] = useState(false);
  const [userInput, setUserInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ from: "bot", text: FLOWS.start.botMsg }]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showOptions, typing]);

  const handleUserInput = () => {
    const text = userInput.trim();
    if (!text) return;
    setUserInput("");
    setMessages((m) => [...m, { from: "user", text }]);
    setShowOptions(false);
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const lower = text.toLowerCase();
      let reply = "";

      if (lower.includes("price") || lower.includes("cost") || lower.includes("rate") || lower.includes("moq")) {
        reply = "For pricing details 💰\n\n• MOQ is 150m for our fabrics\n• Pricing depends on fabric, quantity & shade\n• Bulk discounts on 500m+ orders\n\nFor an accurate quote, please WhatsApp us!";
      } else if (lower.includes("sample")) {
        reply = "We dispatch free fabric samples within 48 hours! 📦\n\nShare your name, city, and fabrics you'd like on WhatsApp and we'll send swatches right away.";
      } else if (lower.includes("fabric") || lower.includes("collection") || lower.includes("gsm")) {
        reply = "We have 6 premium collections 🧵\n\n• Superior Collection — 380 GSM, 65/35 PV\n• Gold Club — 340 GSM premium suiting\n• Aura Plus — soft, durable, vibrant shades\n\nWould you like the full catalog on WhatsApp?";
      } else if (lower.includes("address") || lower.includes("location") || lower.includes("shop") || lower.includes("visit")) {
        reply = "Our shop is at 📍\n\nMarvel Square, 38-A\nGandhi Nagar, Bhilwara, Rajasthan 311001\n\nMon–Sat: 10AM – 7PM\nCall: +91 89498 81253";
      } else if (lower.includes("delivery") || lower.includes("ship") || lower.includes("dispatch")) {
        reply = "We offer Pan-India delivery! 📦\n\n• Sample dispatch: within 48 hours\n• Bulk orders: 5–7 business days\n• We ship across all Indian states";
      } else if (lower.includes("whatsapp") || lower.includes("contact") || lower.includes("call") || lower.includes("phone")) {
        reply = "You can reach us at 📞\n\nWhatsApp: +91 89498 81253\nEmail: saikripatextiles58@gmail.com\n\nMon–Sat: 10AM – 7PM";
      } else {
        reply = "Thanks for your question! 🙏\n\nFor the best answer, please WhatsApp us at +91 89498 81253 — our team responds within 4 hours on business days.";
      }

      setMessages((m) => [...m, { from: "bot", text: reply }]);
      setShowOptions(true);
    }, 700);
  };

  const handleOption = (option) => {
    setMessages((m) => [...m, { from: "user", text: option.label }]);
    setShowOptions(false);
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      if (option.action === "whatsapp") {
        window.open(WHATSAPP_URL(option.message), "_blank");
        setMessages((m) => [...m, { from: "bot", text: "Opening WhatsApp for you 💬\n\nIf nothing opened, please call +91 89498 81253 directly. Is there anything else I can help with?" }]);
        setStep("start");
        setShowOptions(true);
      } else if (option.action === "link") {
        window.open(option.url, "_blank");
        setMessages((m) => [...m, { from: "bot", text: "Opening Google Maps for directions 📍\n\nAnything else I can help with?" }]);
        setShowOptions(true);
      } else if (option.next) {
        const nextFlow = FLOWS[option.next];
        setMessages((m) => [...m, { from: "bot", text: nextFlow.botMsg }]);
        setStep(option.next);
        setShowOptions(true);
      }
    }, 600);
  };

  const currentOptions = FLOWS[step]?.options || [];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 group"
          aria-label="Open chat assistant"
        >
          <span
            className="hidden group-hover:flex bg-[#0a1124] border border-[#d4af37]/40 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap items-center gap-2"
            style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.4), 0 0 20px rgba(212, 175, 55, 0.15)" }}
          >
            <span>Need help? Chat with us</span>
            <span className="text-[#d4af37]">→</span>
          </span>
          <span className="relative bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] w-14 h-14 rounded-full shadow-[0_4px_20px_rgba(212,175,55,0.5)] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-300">
            <span className="absolute inset-0 rounded-full bg-[#d4af37]/30 animate-ping pointer-events-none"></span>
            <svg className="w-7 h-7 relative" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[380px] max-w-[400px] h-[calc(100vh-5rem)] sm:h-[580px] sm:max-h-[80vh] bg-[#0a1124] border border-[#d4af37]/30 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(212,175,55,0.15)] flex flex-col overflow-hidden animate-slideUp">
          <div className="bg-gradient-to-r from-[#f4d77a] via-[#d4af37] to-[#a8842c] px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#020817]/20 backdrop-blur border border-[#020817]/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#020817]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="font-black text-[#020817] text-sm leading-tight">Saikripa Assistant</p>
                <p className="text-[10px] text-[#020817]/80 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#020817] animate-pulse"></span>
                  Online · Replies in seconds
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-[#020817] hover:bg-[#020817]/10 w-8 h-8 rounded-full flex items-center justify-center transition" aria-label="Close chat">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#020817]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} animate-fadeInUp`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line leading-relaxed ${msg.from === "user" ? "bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] font-medium rounded-br-sm" : "bg-[#0a1124] border border-[#1a2233] text-[#e8edf5] rounded-bl-sm"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-[#0a1124] border border-[#1a2233] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
          </div>

          {showOptions && currentOptions.length > 0 && !typing && (
            <div className="border-t border-[#1a2233] bg-[#0a1124] p-3 space-y-2 max-h-[240px] overflow-y-auto flex-shrink-0">
              {currentOptions.map((opt, i) => (
                <button key={i} onClick={() => handleOption(opt)} className="w-full text-left bg-[#020817] border border-[#1a2233] hover:border-[#d4af37]/50 hover:bg-[#0e1730] text-[#e8edf5] hover:text-[#d4af37] text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition flex items-center justify-between gap-2">
                  <span>{opt.label}</span>
                  <span className="text-[#d4af37] flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-[#1a2233] bg-[#020817] px-3 py-3 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleUserInput(); }}
              placeholder="Type your question..."
              className="flex-1 bg-[#0a1124] border border-[#1a2233] text-[#e8edf5] text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#d4af37] placeholder-[#7a8499]"
            />
            <button onClick={handleUserInput} className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}