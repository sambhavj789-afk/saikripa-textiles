import React, { useEffect, useRef, useState } from "react";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const MIN = 0.05; // smallest crop (5% of image)

// Auto-detect the colored-swatch (shade) region by finding the bounding box of
// saturated pixels — white margins, paper, and black text are ignored. Returns
// a normalised {x,y,w,h} or null if it can't find a confident region.
function detectShades(img) {
  try {
    const maxW = 340;
    const scale = Math.min(1, maxW / img.naturalWidth);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const colCount = new Array(w).fill(0);
    const rowCount = new Array(h).fill(0);
    let total = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const sat = mx === 0 ? 0 : (mx - mn) / mx;
        if (sat > 0.28 && mx > 45) { colCount[x]++; rowCount[y]++; total++; }
      }
    }
    if (total < w * h * 0.008) return null; // not enough colour to be a shade card
    const colT = Math.max(1, h * 0.04);
    const rowT = Math.max(1, w * 0.04);
    let x0 = 0; while (x0 < w && colCount[x0] < colT) x0++;
    let x1 = w - 1; while (x1 > x0 && colCount[x1] < colT) x1--;
    let y0 = 0; while (y0 < h && rowCount[y0] < rowT) y0++;
    let y1 = h - 1; while (y1 > y0 && rowCount[y1] < rowT) y1--;
    if (x1 - x0 < w * 0.1 || y1 - y0 < h * 0.1) return null;
    const padX = w * 0.012, padY = h * 0.012;
    x0 = Math.max(0, x0 - padX); x1 = Math.min(w - 1, x1 + padX);
    y0 = Math.max(0, y0 - padY); y1 = Math.min(h - 1, y1 + padY);
    return { x: x0 / w, y: y0 / h, w: (x1 - x0) / w, h: (y1 - y0) / h };
  } catch {
    return null;
  }
}

export default function ImageCropModal({ file, srcUrl, title = "Crop image", showUseFull = true, index, total, busy, onConfirm, onUseFull, onCancel }) {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [autoFound, setAutoFound] = useState(null); // null=pending, true/false after load
  const imgRef = useRef(null);
  const drag = useRef(null);
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    setAutoFound(null);
    setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
    if (file) {
      const url = URL.createObjectURL(file);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    }
    setSrc(srcUrl || null);
  }, [file, srcUrl]);

  const onImgLoad = (e) => {
    const detected = detectShades(e.target);
    if (detected) { setCrop(detected); setAutoFound(true); }
    else setAutoFound(false);
  };

  const startDrag = (e, mode, handle) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = imgRef.current.getBoundingClientRect();
    drag.current = { mode, handle, sx: e.clientX, sy: e.clientY, crop: { ...crop }, rect };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
  };

  const onMove = (e) => {
    const dctx = drag.current;
    if (!dctx) return;
    const dxN = (e.clientX - dctx.sx) / dctx.rect.width;
    const dyN = (e.clientY - dctx.sy) / dctx.rect.height;
    let { x, y, w, h } = dctx.crop;
    if (dctx.mode === "move") {
      x = clamp(x + dxN, 0, 1 - w);
      y = clamp(y + dyN, 0, 1 - h);
    } else {
      let left = x, top = y, right = x + w, bottom = y + h;
      if (dctx.handle.includes("w")) left = clamp(x + dxN, 0, right - MIN);
      if (dctx.handle.includes("e")) right = clamp(x + w + dxN, left + MIN, 1);
      if (dctx.handle.includes("n")) top = clamp(y + dyN, 0, bottom - MIN);
      if (dctx.handle.includes("s")) bottom = clamp(y + h + dyN, top + MIN, 1);
      x = left; y = top; w = right - left; h = bottom - top;
    }
    setCrop({ x, y, w, h });
  };

  const endDrag = () => {
    drag.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", endDrag);
  };

  const doConfirm = () => {
    const img = imgRef.current;
    if (!img) return;
    const sx = crop.x * img.naturalWidth;
    const sy = crop.y * img.naturalHeight;
    const sw = crop.w * img.naturalWidth;
    const sh = crop.h * img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw));
    canvas.height = Math.max(1, Math.round(sh));
    const ctx = canvas.getContext("2d");
    try {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/jpeg", 0.9);
    } catch {
      alert("Couldn't process this image (browser security). Try removing it and uploading the photo again.");
    }
  };

  const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  const handlePos = {
    nw: { left: "-6px", top: "-6px", cursor: "nwse-resize" },
    n: { left: "calc(50% - 6px)", top: "-6px", cursor: "ns-resize" },
    ne: { right: "-6px", top: "-6px", cursor: "nesw-resize" },
    e: { right: "-6px", top: "calc(50% - 6px)", cursor: "ew-resize" },
    se: { right: "-6px", bottom: "-6px", cursor: "nwse-resize" },
    s: { left: "calc(50% - 6px)", bottom: "-6px", cursor: "ns-resize" },
    sw: { left: "-6px", bottom: "-6px", cursor: "nesw-resize" },
    w: { left: "-6px", top: "calc(50% - 6px)", cursor: "ew-resize" },
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onPointerDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (e.target === e.currentTarget && downOnBackdrop.current) onCancel(); }}
    >
      <div className="bg-[#0a1124] border border-[#d4af37]/30 rounded-2xl p-5 max-w-3xl w-full max-h-[92vh] overflow-y-auto" style={{ boxShadow: "0 0 40px rgba(212,175,55,0.12)" }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-white text-base">{title}{total > 1 ? ` (${index + 1} of ${total})` : ""}</h3>
            <p className="text-xs text-[#7a8499] mt-0.5">
              {autoFound === null && "Scanning for the shades…"}
              {autoFound === true && "Auto-cropped to the shades — drag the box to adjust."}
              {autoFound === false && "Drag the box to crop, or use the full image."}
            </p>
          </div>
          <span className="text-[10px] text-[#d4af37] uppercase tracking-wider font-bold truncate max-w-[40%]">{file?.name}</span>
        </div>

        <div className="flex justify-center bg-[#020817] rounded-xl p-2 mb-4 overflow-hidden">
          <div className="relative inline-block select-none" style={{ touchAction: "none" }}>
            {src && (
              <img ref={imgRef} src={src} alt="" crossOrigin={file ? undefined : "anonymous"} onLoad={onImgLoad} draggable={false} className="block max-h-[60vh] max-w-full" />
            )}
            {/* crop box */}
            <div
              className="absolute border-2 border-[#d4af37] cursor-move"
              style={{
                left: `${crop.x * 100}%`, top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`, height: `${crop.h * 100}%`,
                boxShadow: "0 0 0 9999px rgba(2,8,23,0.55)", touchAction: "none",
              }}
              onPointerDown={(e) => startDrag(e, "move")}
            >
              {handles.map((hd) => (
                <div
                  key={hd}
                  onPointerDown={(e) => startDrag(e, "resize", hd)}
                  style={{ position: "absolute", width: "12px", height: "12px", background: "#d4af37", borderRadius: "2px", ...handlePos[hd] }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="bg-[#020817] border border-[#1a2233] text-[#a8b0c0] px-4 py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider hover:border-[#d4af37]/40 hover:text-[#e8edf5] transition disabled:opacity-50">
            Skip
          </button>
          {showUseFull && (
            <button type="button" onClick={onUseFull} disabled={busy} className="bg-[#020817] border border-[#d4af37]/40 text-[#d4af37] px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#d4af37]/10 transition disabled:opacity-50">
              Use full image
            </button>
          )}
          <button type="button" onClick={doConfirm} disabled={busy} className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition disabled:opacity-50">
            {busy ? "Saving…" : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
