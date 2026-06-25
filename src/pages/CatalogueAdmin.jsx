import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminNav from "../components/AdminNav";
import Autocomplete from "../components/Autocomplete";
import ImageCropModal from "../components/ImageCropModal";

const CATEGORY_SUGGESTIONS = ["Gaberdine", "2/18 Matty", "PV Trovin"];

// All catalogue cards use the shared branded cover (same as the existing
// fabrics). Uploaded photos are the shade gallery shown on the detail page.
const SHARED_COVER = "/catalogue/cover.jpg";

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyForm = () => ({
  slug: "",
  title: "",
  gsm: "",
  gsm_value: "",
  blend: "",
  construction: "",
  category: "",
  moq: "150 meters",
  colors: "",
  finish: "Lustrous finish",
  uses: "School, Corporate, Hospital & Police Uniforms",
  description: "",
  long_description: "",
  images: [],
  sort_order: "",
});

export default function CatalogueAdmin() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [cropQueue, setCropQueue] = useState([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [editIdx, setEditIdx] = useState(null);
  const [editSrc, setEditSrc] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/admin/login", { replace: true }); return; }
      setUserEmail(data.session.user.email);
      await fetchRows();
    };
    init();
  }, [navigate]);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("catalogue")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setRows(data || []);
  };

  const categoryOptions = useMemo(() => {
    const set = new Set(CATEGORY_SUGGESTIONS);
    rows.forEach((r) => r.category && set.add(r.category));
    return Array.from(set).sort();
  }, [rows]);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setSlugEdited(false);
  };

  const startEdit = (r) => {
    setForm({
      slug: r.slug || "",
      title: r.title || "",
      gsm: r.gsm || "",
      gsm_value: r.gsm_value == null ? "" : String(r.gsm_value),
      blend: r.blend || "",
      construction: r.construction || "",
      category: r.category || "",
      moq: r.moq || "150 meters",
      colors: r.colors || "",
      finish: r.finish || "Lustrous finish",
      uses: r.uses || "",
      description: r.description || "",
      long_description: r.long_description || "",
      images: (Array.isArray(r.images) ? r.images : []).filter((u) => u !== SHARED_COVER),
      sort_order: r.sort_order == null ? "" : String(r.sort_order),
    });
    setEditingId(r.id);
    setSlugEdited(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onTitleChange = (v) => {
    setForm((p) => ({ ...p, title: v, slug: slugEdited ? p.slug : slugify(v) }));
  };

  // Selecting files opens the crop modal (one image at a time) instead of
  // uploading immediately, so each can be auto/manually cropped first.
  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (files.length === 0) return;
    setCropQueue(files);
    setCropIndex(0);
  };

  const uploadOne = async (data, nameBase) => {
    const folder = slugify(form.slug || form.title) || "misc";
    const safe = (nameBase || "image").replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${folder}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from("catalogue")
      .upload(path, data, { upsert: true, cacheControl: "3600", contentType: data.type || "image/jpeg" });
    if (upErr) { alert("Upload failed: " + upErr.message); return null; }
    const { data: pub } = supabase.storage.from("catalogue").getPublicUrl(path);
    return pub?.publicUrl || null;
  };

  const advanceCrop = () => {
    setCropIndex((i) => {
      const next = i + 1;
      if (next >= cropQueue.length) { setCropQueue([]); return 0; }
      return next;
    });
  };

  const handleCropConfirm = async (blob) => {
    setUploading(true);
    try {
      const file = cropQueue[cropIndex];
      const base = (file?.name || "image").replace(/\.[^.]+$/, "") + ".jpg";
      const url = await uploadOne(blob, base);
      if (url) setForm((p) => ({ ...p, images: [...p.images, url] }));
    } finally {
      setUploading(false);
      advanceCrop();
    }
  };

  const handleUseFull = async () => {
    setUploading(true);
    try {
      const file = cropQueue[cropIndex];
      const url = await uploadOne(file, file?.name);
      if (url) setForm((p) => ({ ...p, images: [...p.images, url] }));
    } finally {
      setUploading(false);
      advanceCrop();
    }
  };

  const removeImage = (idx) => setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  // Re-crop an already-uploaded shade photo.
  const onEditImage = (idx) => { setEditIdx(idx); setEditSrc(form.images[idx]); };
  const closeEdit = () => { setEditIdx(null); setEditSrc(null); };
  const handleEditConfirm = async (blob) => {
    if (editIdx === null) return;
    setUploading(true);
    try {
      const url = await uploadOne(blob, `edit-${Date.now()}.jpg`);
      if (url) setForm((p) => ({ ...p, images: p.images.map((u, i) => (i === editIdx ? url : u)) }));
    } finally {
      setUploading(false);
      closeEdit();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const base = slugify(form.slug || form.title);
    if (!form.title.trim() || !base) { alert("Please enter a fabric name (Title)."); return; }
    // Auto-make the web address unique for new items so duplicate names never error.
    let slug = base;
    if (!editingId) {
      const taken = new Set(rows.map((r) => r.slug));
      let n = 2;
      while (taken.has(slug)) slug = `${base}-${n++}`;
    }
    setSaving(true);
    try {
      const payload = {
        slug,
        title: form.title.trim(),
        gsm: form.gsm.trim() || null,
        gsm_value: form.gsm_value === "" ? null : parseInt(form.gsm_value, 10),
        blend: form.blend.trim() || null,
        construction: (form.construction.trim() || form.blend.trim()) || null,
        category: form.category.trim() || null,
        moq: form.moq.trim() || null,
        colors: form.colors.trim() || null,
        finish: form.finish.trim() || null,
        uses: form.uses.trim() || null,
        description: form.description.trim() || null,
        long_description: form.long_description.trim() || null,
        image: SHARED_COVER,
        images: [SHARED_COVER, ...form.images.filter((u) => u !== SHARED_COVER)],
        sort_order: form.sort_order === "" ? rows.length + 1 : parseInt(form.sort_order, 10),
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error: dbError } = await supabase.from("catalogue").update(payload).eq("id", editingId);
        if (dbError) { alert("Could not update: " + dbError.message); return; }
      } else {
        const { error: dbError } = await supabase.from("catalogue").insert([payload]);
        if (dbError) { alert("Could not save: " + dbError.message); return; }
      }
      resetForm();
      setShowForm(false);
      fetchRows();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r) => {
    if (!confirm(`Delete "${r.title}" from the catalogue? This removes it from the website.`)) return;
    const { error: dbError } = await supabase.from("catalogue").delete().eq("id", r.id);
    if (dbError) { alert("Could not delete: " + dbError.message); return; }
    setRows((p) => p.filter((x) => x.id !== r.id));
  };

  const inputCls = "w-full bg-[#020817] border border-[#1a2233] rounded-lg px-3 py-2 text-sm text-[#e8edf5] placeholder-[#4a5568] focus:outline-none focus:border-[#d4af37]/60 transition";
  const labelCls = "block text-[10px] font-medium text-[#7a8499] uppercase tracking-[0.25em] mb-2";
  const goldGlow = { boxShadow: "0 0 40px rgba(212, 175, 55, 0.08), inset 0 0 0 1px rgba(212, 175, 55, 0.3)" };

  return (
    <div className="min-h-screen bg-[#020817] text-[#e8edf5] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-50" style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 70%)" }} />

      <header className="relative border-b border-[#1a2233]/80 backdrop-blur-xl bg-[#020817]/80 sticky top-0 z-40">
        <AdminNav userEmail={userEmail} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-lg font-bold tracking-[0.2em] uppercase" style={{ background: "linear-gradient(135deg, #f4d77a 0%, #d4af37 50%, #a8842c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Saikripa Textiles</h1>
          <p className="text-[10px] text-[#7a8499] tracking-[0.35em] uppercase mt-1 font-medium">Catalogue Manager</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#f4d77a] via-[#d4af37] to-[#a8842c]" />
            <div>
              <h2 className="text-4xl font-bold tracking-tight leading-[1.2] pb-1" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f4d77a 60%, #d4af37 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Catalogue</h2>
              <p className="text-xs text-[#7a8499] mt-2 uppercase tracking-[0.25em] font-medium">Fabrics shown on the public website</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition">
            {showForm ? "Close Form" : "+ New Catalogue Item"}
          </button>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm mb-4">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#0a1124] rounded-xl p-6 mb-6 border border-[#d4af37]/30" style={goldGlow}>
            <h3 className="font-bold text-white text-lg mb-1">{editingId ? "Edit Catalogue Item" : "New Catalogue Item"}</h3>
            <p className="text-xs text-[#7a8499] mb-5">Add the fabric <span className="text-[#a8b0c0]">name</span> and some <span className="text-[#a8b0c0]">images</span> — everything else is optional. The web address is created for you automatically.</p>

            {/* Images */}
            <div className="mb-6">
              <label className={labelCls}>Shade Photos <span className="text-[#d4af37]/60 normal-case tracking-normal">(shown on the fabric page)</span></label>
              <div className="flex flex-wrap gap-3 mb-2">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative group w-28 h-28 rounded-lg overflow-hidden border border-[#1a2233] bg-[#020817]">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                      <button type="button" onClick={() => onEditImage(idx)} className="text-[10px] text-[#d4af37] font-bold uppercase tracking-wider hover:text-[#f4d77a]">Edit</button>
                      <button type="button" onClick={() => removeImage(idx)} className="text-[10px] text-rose-400 font-bold uppercase tracking-wider hover:text-rose-300">Remove</button>
                    </div>
                  </div>
                ))}
                <label className="w-28 h-28 rounded-lg border-2 border-dashed border-[#1a2233] hover:border-[#d4af37]/50 flex flex-col items-center justify-center cursor-pointer text-[#7a8499] hover:text-[#d4af37] transition text-center px-2">
                  <span className="text-2xl leading-none">+</span>
                  <span className="text-[10px] uppercase tracking-wider mt-1">{uploading ? "Uploading…" : "Add image"}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} disabled={uploading} />
                </label>
              </div>
              <p className="text-[10px] text-[#7a8499]">The catalogue cover uses the standard Saikripa cover, same as the other fabrics.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="sm:col-span-4">
                <label className={labelCls}>Fabric Name (Title)</label>
                <input type="text" value={form.title} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. Superior Collection" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>GSM <span className="text-[#d4af37]/60 normal-case tracking-normal">(weight)</span></label>
                <input type="number" value={form.gsm_value} onChange={(e) => { const v = e.target.value; setForm((p) => ({ ...p, gsm_value: v, gsm: v ? `${v} GSM` : "" })); }} placeholder="e.g. 380" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Category</label>
                <Autocomplete value={form.category} onChange={(v) => set("category", v)} suggestions={categoryOptions} placeholder="e.g. 2/18 Matty" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Order on site <span className="text-[#d4af37]/60 normal-case tracking-normal">(optional)</span></label>
                <input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} placeholder="auto" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Blend</label>
                <input type="text" value={form.blend} onChange={(e) => set("blend", e.target.value)} placeholder="e.g. 65/35 PV" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Construction <span className="text-[#d4af37]/60 normal-case tracking-normal">(defaults to blend)</span></label>
                <input type="text" value={form.construction} onChange={(e) => set("construction", e.target.value)} placeholder="e.g. 2/30×300 ROTO POLY" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>MOQ</label>
                <input type="text" value={form.moq} onChange={(e) => set("moq", e.target.value)} placeholder="150 meters" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Shades</label>
                <input type="text" value={form.colors} onChange={(e) => set("colors", e.target.value)} placeholder="e.g. 60+ shades" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Finish</label>
                <input type="text" value={form.finish} onChange={(e) => set("finish", e.target.value)} placeholder="Lustrous finish" className={inputCls} />
              </div>
              <div className="sm:col-span-4">
                <label className={labelCls}>Uses</label>
                <input type="text" value={form.uses} onChange={(e) => set("uses", e.target.value)} placeholder="School, Corporate, Hospital & Police Uniforms" className={inputCls} />
              </div>
              <div className="sm:col-span-4">
                <label className={labelCls}>Short Description <span className="text-[#d4af37]/60 normal-case tracking-normal">(card preview)</span></label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="One or two lines shown on the catalogue card." className={inputCls + " resize-none"} />
              </div>
              <div className="sm:col-span-4">
                <label className={labelCls}>Long Description <span className="text-[#d4af37]/60 normal-case tracking-normal">(detail page)</span></label>
                <textarea value={form.long_description} onChange={(e) => set("long_description", e.target.value)} rows={4} placeholder="Full description shown on the fabric detail page." className={inputCls + " resize-none"} />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving || uploading} className="bg-gradient-to-br from-[#d4af37] to-[#a8842c] text-[#020817] px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Saving…" : (editingId ? "Update Item" : "Save Item")}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="bg-[#020817] border border-[#1a2233] text-[#a8b0c0] px-6 py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider hover:border-[#d4af37]/40 hover:text-[#e8edf5] transition">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12 text-[#7a8499]">Loading catalogue…</div>
        ) : rows.length === 0 ? (
          <div className="bg-[#0a1124] rounded-xl p-12 text-center text-[#7a8499] border border-[#1a2233]">
            No catalogue items yet. If you just set up the database, click “+ New Catalogue Item”. <br />
            <span className="text-[10px] uppercase tracking-wider">(If your fabrics are missing, run supabase/catalogue_setup.sql in Supabase.)</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rows.map((r) => {
              const thumb = r.image || SHARED_COVER;
              return (
              <div key={r.id} onClick={() => startEdit(r)} className="bg-[#0a1124] rounded-xl border border-[#1a2233] overflow-hidden hover:border-[#d4af37]/40 transition cursor-pointer group">
                <div className="aspect-[4/3] bg-[#020817] overflow-hidden">
                  {thumb ? <img src={thumb} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /> : <div className="w-full h-full flex items-center justify-center text-[#4a5568] text-xs">No image</div>}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {r.category && <span className="text-[10px] bg-[#020817] border border-[#1a2233] text-[#a8b0c0] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{r.category}</span>}
                    {r.gsm && <span className="text-[10px] bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 px-2 py-0.5 rounded-full font-bold">{r.gsm}</span>}
                  </div>
                  <h3 className="font-bold text-white group-hover:text-[#d4af37] transition-colors">{r.title}</h3>
                  <p className="text-xs text-[#7a8499] mt-1">{r.colors || ""}</p>
                  <div className="flex gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => startEdit(r)} className="text-xs font-medium text-[#d4af37] hover:text-[#f4d77a] transition">Edit</button>
                    <button onClick={() => handleDelete(r)} className="text-xs font-medium text-rose-400 hover:text-rose-300 transition">Delete</button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {cropQueue.length > 0 && cropIndex < cropQueue.length && (
          <ImageCropModal
            file={cropQueue[cropIndex]}
            index={cropIndex}
            total={cropQueue.length}
            busy={uploading}
            onConfirm={handleCropConfirm}
            onUseFull={handleUseFull}
            onCancel={advanceCrop}
          />
        )}

        {editIdx !== null && editSrc && (
          <ImageCropModal
            srcUrl={editSrc}
            title="Edit shade photo"
            showUseFull={false}
            index={0}
            total={1}
            busy={uploading}
            onConfirm={handleEditConfirm}
            onUseFull={closeEdit}
            onCancel={closeEdit}
          />
        )}
      </main>
    </div>
  );
}
