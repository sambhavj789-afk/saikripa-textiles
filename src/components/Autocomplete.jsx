import React, { useState, useRef, useEffect } from "react";

/**
 * Autocomplete text input.
 * Type → see matching suggestions
 * ↑/↓ arrows → navigate
 * Enter or Tab → accept highlighted suggestion
 * Escape → close suggestions, keep typed text
 * Click → accept that suggestion
 */
export default function Autocomplete({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  required,
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Filter suggestions by what's typed (case-insensitive substring match)
  const matches = !value
    ? suggestions.slice(0, 8)
    : suggestions
        .filter((s) => s.toLowerCase().startsWith(value.toLowerCase()) && s !== value)
        .slice(0, 8);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Reset active highlight when matches change
  useEffect(() => {
    setActiveIdx(matches.length > 0 ? 0 : -1);
  }, [value, open]);

  const acceptSuggestion = (suggestion) => {
    onChange(suggestion);
    setOpen(false);
    setActiveIdx(-1);
  };

  const onKeyDown = (e) => {
    if (!open || matches.length === 0) {
      if (e.key === "ArrowDown") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (activeIdx >= 0) {
        e.preventDefault();
        acceptSuggestion(matches[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={className}
      />

      {open && matches.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {matches.map((m, i) => (
            <li
              key={m}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur before click registers
                acceptSuggestion(m);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-3 py-2 text-sm cursor-pointer transition ${
                i === activeIdx
                  ? "bg-[#d4af37]/15 text-[#081225] font-bold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {highlightMatch(m, value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Bolds the matching part of the suggestion for visual feedback
function highlightMatch(text, query) {
  if (!query) return text;
  if (!text.toLowerCase().startsWith(query.toLowerCase())) return text;
  return (
    <>
      <span className="font-black text-[#7a6015]">{text.slice(0, query.length)}</span>
      {text.slice(query.length)}
    </>
  );
}
