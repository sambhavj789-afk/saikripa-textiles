import React, { useState, useEffect } from "react";

// ── Constants ───────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM",
];

const APPOINTMENT_TYPES = [
  "Bulk Order Discussion",
  "Fabric Sampling Session",
  "Shade Card Presentation",
  "Pricing & MOQ Enquiry",
  "Factory / Showroom Visit",
  "General Business Meeting",
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Other / Outside India",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function buildWhatsAppUrl({ name, phone, city, state, appointmentType, date, time, notes }) {
  const dateStr = date.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const msg = [
    `*New Appointment Request*`,
    ``,
    `*Name:* ${name}`,
    `*Phone:* ${phone}`,
    city ? `*City:* ${city}` : "",
    state ? `*State:* ${state}` : "",
    `*Type:* ${appointmentType}`,
    `*Date:* ${dateStr}`,
    `*Time:* ${time}`,
    notes ? `*Notes:* ${notes}` : "",
    ``,
    `Please confirm this appointment. Thank you!`,
  ].filter(Boolean).join("\n");

  return `https://wa.me/918949881253?text=${encodeURIComponent(msg)}`;
}

// ── Mini Calendar ───────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const isDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < today || d.getDay() === 0;
  };

  const isSelected = (day) =>
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getFullYear() === viewYear;

  const isToday = (day) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7a8499] hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition font-bold text-lg"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="font-black text-white text-base">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7a8499] hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition font-bold text-lg"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div
            key={d}
            className={`text-center text-[10px] font-black uppercase tracking-widest py-1 ${d === "Sun" ? "text-rose-400/70" : "text-[#7a8499]"}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {day ? (
              <button
                disabled={isDisabled(day)}
                onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
                className={`w-full h-full rounded-xl text-sm font-bold transition-all duration-150
                  ${isSelected(day)
                    ? "bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] shadow-[0_4px_16px_rgba(212,175,55,0.4)] scale-105"
                    : isToday(day)
                      ? "border border-[#d4af37]/60 text-[#d4af37] hover:bg-[#d4af37]/10"
                      : isDisabled(day)
                        ? "text-[#3a4458] cursor-not-allowed"
                        : "text-[#a8b0c0] hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
                  }
                `}
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[#7a8499] mt-3 text-center tracking-widest uppercase">
        Business hours · Mon–Sat · Sundays closed
      </p>
    </div>
  );
}

// ── Step Indicator ──────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ["Pick Date", "Pick Time", "Your Details"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = step === idx;
        const done = step > idx;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300
                  ${done
                    ? "bg-[#d4af37] text-[#020817]"
                    : active
                      ? "bg-[#d4af37] text-[#020817] shadow-[0_0_20px_rgba(212,175,55,0.5)]"
                      : "bg-[#020817] border border-[#1a2233] text-[#7a8499]"}
                `}
              >
                {done ? "✓" : idx}
              </div>
              <span
                className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest transition-colors ${active ? "text-[#d4af37]" : done ? "text-[#d4af37]/70" : "text-[#7a8499]"}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-px mx-1 mb-4 transition-all duration-500 ${done ? "bg-[#d4af37]" : "bg-[#1a2233]"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────
export default function AppointmentModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    appointmentType: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.appointmentType) {
      setError("Please fill in your name, phone, and appointment type.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const waUrl = buildWhatsAppUrl({ ...form, date: selectedDate, time: selectedTime });

    const response = await fetch("http://localhost:3000/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        city: form.city || null,
        state: form.state || null,
        appointment_type: form.appointmentType,
        preferred_date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`,
        preferred_time: selectedTime,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Could not save to database, but you can still notify us via WhatsApp.");
    } else {
      const data = await response.json();
      console.log("Appointment booked with calendar event:", data.appointment?.google_event_id);
    }
    setWhatsappUrl(waUrl);
    setSubmitted(true);
  };

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : null;

  const inputCls = "w-full bg-[#020817] border border-[#1a2233] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/20 transition";

  // ── Success screen ──
  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-[#0a1124] border border-[#1a2233] w-full max-w-md rounded-[32px] p-10 shadow-[0_40px_120px_rgba(0,0,0,0.6)] text-center relative overflow-hidden my-auto">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#d4af37]/15 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#d4af37]/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]" style={{ boxShadow: "0 0 40px rgba(212, 175, 55, 0.3)" }}>
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Appointment Requested!</h3>
            <p className="text-[#a8b0c0] text-sm mb-6 leading-relaxed">
              Your appointment is saved. We'll confirm within <strong className="text-white">4 business hours.</strong>
            </p>

            <div className="bg-[#020817] border border-[#1a2233] rounded-2xl p-5 mb-6 text-left space-y-3">
              <p className="text-[10px] text-[#7a8499] uppercase tracking-widest font-bold mb-3">Booking Summary</p>
              {[
                ["Name", form.name],
                ["Date", dateLabel],
                ["Time", selectedTime],
                ["Type", form.appointmentType],
              ].map(([label, val]) => (
                <div key={label} className="flex items-start gap-3 text-sm">
                  <span className="text-[10px] text-[#7a8499] w-12 flex-shrink-0 uppercase tracking-widest font-bold mt-0.5">{label}</span>
                  <span className="font-bold text-white">{val}</span>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-amber-300 text-xs mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">{error}</p>
            )}

            <div className="flex flex-col gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] py-4 rounded-2xl font-bold text-sm hover:shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:scale-[1.02] transition-all duration-200 uppercase tracking-wider"
              >
                Notify via WhatsApp →
              </a>
              <button
                onClick={onClose}
                className="text-[#7a8499] text-sm font-semibold hover:text-white transition py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main booking flow ──
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0a1124] border border-[#1a2233] w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[32px] shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden max-h-[95vh] overflow-y-auto my-auto">
        <div className="sticky top-0 z-10 bg-[#0a1124] border-b border-[#1a2233] px-8 py-5 flex items-center justify-between backdrop-blur-xl">
          <div>
            <p className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.25em]">Saikripa Textiles</p>
            <h2 className="text-xl font-black text-white mt-1">Schedule a Meeting</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#020817] border border-[#1a2233] hover:border-[#d4af37]/40 text-[#7a8499] hover:text-white font-bold text-lg flex items-center justify-center transition"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-8 py-6">
          <StepBar step={step} />

          {step === 1 && (
            <div>
              <h3 className="text-lg font-black text-white mb-1">Choose a Date</h3>
              <p className="text-sm text-[#7a8499] mb-5">Select your preferred date for the meeting</p>
              <div className="bg-[#020817] border border-[#1a2233] rounded-2xl p-5">
                <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
              </div>
              <button
                disabled={!selectedDate}
                onClick={() => setStep(2)}
                className={`mt-6 w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 uppercase tracking-wider
                  ${selectedDate
                    ? "bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] hover:shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:scale-[1.01]"
                    : "bg-[#020817] border border-[#1a2233] text-[#4a5568] cursor-not-allowed"
                  }`}
              >
                {selectedDate ? `Continue — ${dateLabel} →` : "Select a date to continue"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-[#7a8499] hover:text-[#d4af37] font-semibold mb-4 transition">
                ← {dateLabel}
              </button>
              <h3 className="text-lg font-black text-white mb-1">Choose a Time Slot</h3>
              <p className="text-sm text-[#7a8499] mb-5">All times are in IST (India Standard Time)</p>

              <div className="grid grid-cols-3 gap-3">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3.5 rounded-2xl font-bold text-sm transition-all duration-150
                      ${selectedTime === slot
                        ? "bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] shadow-[0_4px_16px_rgba(212,175,55,0.4)] scale-105"
                        : "bg-[#020817] border border-[#1a2233] text-[#a8b0c0] hover:border-[#d4af37]/40 hover:text-[#d4af37]"
                      }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              <button
                disabled={!selectedTime}
                onClick={() => setStep(3)}
                className={`mt-6 w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 uppercase tracking-wider
                  ${selectedTime
                    ? "bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] hover:shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:scale-[1.01]"
                    : "bg-[#020817] border border-[#1a2233] text-[#4a5568] cursor-not-allowed"
                  }`}
              >
                {selectedTime ? `Continue — ${selectedTime} →` : "Select a time slot"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-[#7a8499] hover:text-[#d4af37] font-semibold mb-4 transition">
                ← {dateLabel} · {selectedTime}
              </button>
              <h3 className="text-lg font-black text-white mb-1">Your Details</h3>
              <p className="text-sm text-[#7a8499] mb-5">We'll use this to confirm your appointment</p>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">
                      Email <span className="normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">City</label>
                    <input
                      type="text"
                      placeholder="Your city"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className={inputCls + " cursor-pointer"}
                  >
                    <option value="">Select your state...</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">Appointment Type *</label>
                  <select
                    value={form.appointmentType}
                    onChange={(e) => setForm({ ...form, appointmentType: e.target.value })}
                    className={inputCls + " cursor-pointer"}
                  >
                    <option value="">Select meeting type...</option>
                    {APPOINTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">Additional Notes</label>
                  <textarea
                    placeholder="Fabric requirements, quantity, color preferences, or any specific agenda..."
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className={inputCls + " resize-none"}
                  />
                </div>

                <div className="flex items-center gap-4 bg-[#020817] border border-[#d4af37]/30 rounded-2xl px-5 py-4" style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.08)" }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#020817]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#7a8499] uppercase tracking-widest font-bold">Your Slot</p>
                    <p className="text-sm font-black text-white truncate mt-0.5">{dateLabel} · {selectedTime}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-[#d4af37] text-xs font-bold hover:text-[#f4d77a] flex-shrink-0 uppercase tracking-wider">
                    Change
                  </button>
                </div>

                {error && (
                  <p className="text-rose-300 text-xs bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-wider
                    ${submitting
                      ? "bg-[#020817] border border-[#1a2233] text-[#4a5568] cursor-not-allowed"
                      : "bg-gradient-to-br from-[#f4d77a] via-[#d4af37] to-[#a8842c] text-[#020817] hover:shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:scale-[1.01]"
                    }`}
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving Appointment...
                    </>
                  ) : (
                    "Confirm Appointment →"
                  )}
                </button>

                <p className="text-center text-xs text-[#7a8499]">
                  Your data is securely stored. We'll confirm via WhatsApp within 4 business hours.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}