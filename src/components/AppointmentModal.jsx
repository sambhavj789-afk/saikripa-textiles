import React, { useState, useEffect } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────────
function buildWhatsAppUrl({ name, phone, city, state, appointmentType, date, time, notes }) {
  const dateStr = date.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const msg = [
    `📅 *New Appointment Request*`,
    ``,
    `👤 *Name:* ${name}`,
    `📞 *Phone:* ${phone}`,
    city ? `🏙️ *City:* ${city}` : "",
    state ? `🗺️ *State:* ${state}` : "",
    `🗂️ *Type:* ${appointmentType}`,
    `📆 *Date:* ${dateStr}`,
    `⏰ *Time:* ${time}`,
    notes ? `📝 *Notes:* ${notes}` : "",
    ``,
    `Please confirm this appointment. Thank you!`,
  ].filter(Boolean).join("\n");

  return `https://wa.me/918949881253?text=${encodeURIComponent(msg)}`;
}

// ── Mini Calendar ──────────────────────────────────────────────────────────────
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
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition font-bold text-lg"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="font-black text-[#081225] text-base">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition font-bold text-lg"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div
            key={d}
            className={`text-center text-[10px] font-black uppercase tracking-widest py-1 ${d === "Sun" ? "text-red-400" : "text-gray-400"}`}
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
                    ? "bg-gradient-to-br from-[#d4af37] to-[#aa8c2c] text-white shadow-[0_4px_12px_rgba(212,175,55,0.4)] scale-105"
                    : isToday(day)
                      ? "border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10"
                      : isDisabled(day)
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
                  }
                `}
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-3 text-center">
        ✦ Business hours: Mon–Sat · Sundays closed
      </p>
    </div>
  );
}

// ── Step Indicator ─────────────────────────────────────────────────────────────
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
                  ${done ? "bg-green-500 text-white" : active ? "bg-[#d4af37] text-[#081225]" : "bg-gray-100 text-gray-400"}
                `}
              >
                {done ? "✓" : idx}
              </div>
              <span
                className={`text-[9px] mt-1 font-bold uppercase tracking-widest transition-colors ${active ? "text-[#d4af37]" : done ? "text-green-500" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-1 mb-4 transition-all duration-500 ${done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
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
        preferred_date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
        preferred_time: selectedTime,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("⚠️ Could not save to database, but you can still notify us via WhatsApp.");
    }
    setWhatsappUrl(waUrl);
    setSubmitted(true);
  };

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : null;

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-[0_40px_120px_rgba(0,0,0,0.3)] text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#d4af37]/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#081225]/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-lg">
              ✅
            </div>
            <h3 className="text-2xl font-black text-[#081225] mb-1">Appointment Requested!</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Your appointment is saved. We'll confirm within <strong>4 business hours.</strong>
            </p>

            <div className="bg-[#f8f7f4] rounded-2xl p-5 mb-6 text-left space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">Booking Summary</p>
              {[
                ["👤", "Name", form.name],
                ["📅", "Date", dateLabel],
                ["⏰", "Time", selectedTime],
                ["🗂️", "Type", form.appointmentType],
              ].map(([icon, label, val]) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span>{icon}</span>
                  <span className="text-gray-400 w-12 flex-shrink-0">{label}</span>
                  <span className="font-bold text-[#081225]">{val}</span>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-orange-500 text-xs mb-4 bg-orange-50 rounded-xl p-3">{error}</p>
            )}

            <div className="flex flex-col gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25d366] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#1ebe5d] hover:scale-[1.02] transition-all duration-200"
              >
                💬 Notify via WhatsApp
              </a>
              <button
                onClick={onClose}
                className="text-gray-400 text-sm font-semibold hover:text-gray-600 transition py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[32px] shadow-[0_40px_120px_rgba(0,0,0,0.3)] overflow-hidden max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#c6a55c] font-bold uppercase tracking-widest">Saikripa Textiles</p>
            <h2 className="text-xl font-black text-[#081225]">Schedule a Meeting</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-lg flex items-center justify-center transition"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-8 py-6">
          <StepBar step={step} />

          {step === 1 && (
            <div>
              <h3 className="text-lg font-black text-[#081225] mb-1">Choose a Date</h3>
              <p className="text-sm text-gray-400 mb-5">Select your preferred date for the meeting</p>
              <div className="bg-[#f8f7f4] rounded-2xl p-5">
                <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
              </div>
              <button
                disabled={!selectedDate}
                onClick={() => setStep(2)}
                className={`mt-6 w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200
                  ${selectedDate
                    ? "bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#08102e] hover:shadow-[0_8px_24px_rgba(212,175,55,0.4)] hover:scale-[1.01]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {selectedDate ? `Continue — ${dateLabel} →` : "Select a date to continue"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#d4af37] font-semibold mb-4 transition">
                ← {dateLabel}
              </button>
              <h3 className="text-lg font-black text-[#081225] mb-1">Choose a Time Slot</h3>
              <p className="text-sm text-gray-400 mb-5">All times are in IST (India Standard Time)</p>

              <div className="grid grid-cols-3 gap-3">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3.5 rounded-2xl font-bold text-sm transition-all duration-150
                      ${selectedTime === slot
                        ? "bg-gradient-to-br from-[#d4af37] to-[#aa8c2c] text-white shadow-[0_4px_16px_rgba(212,175,55,0.4)] scale-105"
                        : "bg-[#f8f7f4] text-gray-700 hover:bg-[#d4af37]/10 hover:text-[#d4af37] border border-gray-100"
                      }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              <button
                disabled={!selectedTime}
                onClick={() => setStep(3)}
                className={`mt-6 w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200
                  ${selectedTime
                    ? "bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#08102e] hover:shadow-[0_8px_24px_rgba(212,175,55,0.4)] hover:scale-[1.01]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {selectedTime ? `Continue — ${selectedTime} →` : "Select a time slot"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#d4af37] font-semibold mb-4 transition">
                ← {dateLabel} · {selectedTime}
              </button>
              <h3 className="text-lg font-black text-[#081225] mb-1">Your Details</h3>
              <p className="text-sm text-gray-400 mb-5">We'll use this to confirm your appointment</p>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Email <span className="normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">City</label>
                    <input
                      type="text"
                      placeholder="Your city"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition bg-white"
                  >
                    <option value="">Select your state...</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Appointment Type *</label>
                  <select
                    value={form.appointmentType}
                    onChange={(e) => setForm({ ...form, appointmentType: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition bg-white"
                  >
                    <option value="">Select meeting type...</option>
                    {APPOINTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Additional Notes</label>
                  <textarea
                    placeholder="Fabric requirements, quantity, color preferences, or any specific agenda..."
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition resize-none"
                  />
                </div>

                <div className="flex items-center gap-4 bg-[#f8f7f4] rounded-2xl px-5 py-4 border border-gray-100">
                  <span className="text-2xl">📅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Your Slot</p>
                    <p className="text-sm font-black text-[#081225] truncate">{dateLabel} · {selectedTime}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-[#c6a55c] text-xs font-bold hover:underline flex-shrink-0">
                    Change
                  </button>
                </div>

                {error && (
                  <p className="text-red-500 text-xs bg-red-50 rounded-xl p-3">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                    ${submitting
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#081225] to-[#0f2060] text-white hover:shadow-[0_8px_30px_rgba(8,18,37,0.4)] hover:scale-[1.01]"
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
                    "📅 Confirm Appointment"
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
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