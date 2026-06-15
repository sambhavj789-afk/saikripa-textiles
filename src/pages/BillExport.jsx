import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const numberToWords = (num) => {
  if (num === 0) return "ZERO";
  const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " HUNDRED" + (n % 100 ? " " + inWords(n % 100) : "");
    return "";
  };
  const integer = Math.floor(num);
  const decimal = Math.round((num - integer) * 100);
  let result = "";
  const crore = Math.floor(integer / 10000000);
  const lakh = Math.floor((integer % 10000000) / 100000);
  const thousand = Math.floor((integer % 100000) / 1000);
  const rest = integer % 1000;
  if (crore) result += inWords(crore) + " CRORE ";
  if (lakh) result += inWords(lakh) + " LAKH ";
  if (thousand) result += inWords(thousand) + " THOUSAND ";
  if (rest) result += inWords(rest);
  result = result.trim();
  if (decimal > 0) result += " AND " + inWords(decimal) + " PAISE";
  return result + " ONLY";
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

const fmtMoney = (n) => {
  if (!n && n !== 0) return "";
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

// show a tax % with two decimals (e.g. "5.00 %"); blank when zero/absent
const fmtPct = (p) => (Number(p) > 0 ? `${Number(p).toFixed(2)} %` : " %");

const BUSINESS_GSTIN = "08ACNPG4471G1ZH";
const BUSINESS_PAN = "ACNPG4471G";
const BUSINESS_TIN = "CIN";

export default function BillExport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBill = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) { navigate("/admin/login"); return; }
      const { data, error: dbError } = await supabase
        .from("sales_records")
        .select("*, bill_items(*)")
        .eq("id", id)
        .single();
      if (dbError) { setError(dbError.message); setLoading(false); return; }
      setBill(data);
      setLoading(false);
    };
    fetchBill();
  }, [id, navigate]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>Loading bill...</div>;
  if (error) return <div style={{ padding: 40, color: "red", fontFamily: "Arial" }}>Error: {error}</div>;
  if (!bill) return <div style={{ padding: 40, fontFamily: "Arial" }}>Bill not found</div>;

  const items = bill.bill_items || [];
  const subtotal = Number(bill.subtotal) || items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const cgst = (subtotal * Number(bill.cgst_percent || 0)) / 100;
  const sgst = (subtotal * Number(bill.sgst_percent || 0)) / 100;
  const igst = (subtotal * Number(bill.igst_percent || 0)) / 100;
  const totalGst = cgst + sgst + igst;

  // --- Net Amount & Round-off computed properly for GST bills ---
  // (previously this fell back to just `subtotal`, ignoring GST/charges)
  const charges =
    (Number(bill.cartage) || 0) +
    (Number(bill.insurance) || 0) +
    (Number(bill.sp_pack_chg) || 0) +
    (Number(bill.others) || 0);
  const grossTotal =
    subtotal - (Number(bill.discount) || 0) + charges + totalGst + (Number(bill.tcs) || 0);
  const finalTotal = Number(bill.final_total) || Math.round(grossTotal);
  const roundOff =
    bill.round_off != null ? Number(bill.round_off) : finalTotal - grossTotal;

  const totalMeters = items.reduce((s, it) => s + Number(it.meter || 0), 0);
  const totalPcs = items.reduce((s, it) => s + Number(it.pcs || 0), 0);

  const ackNo = `1${Date.now().toString().slice(-14)}`;
  const ackDate = fmtDate(bill.created_at || bill.bill_date);
  const irn = `${(bill.id || '').replace(/-/g, '').toLowerCase()}${"0".repeat(Math.max(0, 64 - ((bill.id || '').replace(/-/g, '').length || 0)))}`.slice(0, 64);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 5mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .bill-page { box-shadow: none !important; margin: 0 !important; border: 1px solid #000 !important; }
        }
        body { margin: 0; background: #f5f5f5; font-family: Arial, Helvetica, sans-serif; }
        .bill-page {
          width: 210mm;
          min-height: 290mm;
          margin: 12px auto;
          background: white;
          color: #000;
          font-size: 8pt;
          line-height: 1.2;
          box-shadow: 0 0 12px rgba(0,0,0,0.15);
          box-sizing: border-box;
          border: 1px solid #000;
        }
        .bill-page table { border-collapse: collapse; width: 100%; }
        .items-table { 
          table-layout: fixed !important; 
          width: 100% !important;
          display: table !important;
          min-width: 100% !important;
        }
        .items-table colgroup { display: table-column-group !important; }
        .items-table tbody, .items-table thead { width: 100% !important; }
        .bill-page td, .bill-page th { padding: 2px 5px; vertical-align: top; }
        .grid, .grid td, .grid th { border: 1px solid #000; }
        .b-bot { border-bottom: 1px solid #000; }
        .b-top { border-top: 1px solid #000; }
        .b-right { border-right: 1px solid #000; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        .checkbox { display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 4px; vertical-align: middle; text-align: center; line-height: 8px; font-size: 8pt; background: white; }
        .checked { background: #000; color: white; }
        .strip { background: #d0d0d0; font-weight: bold; }
        .buyer-tbl td { padding: 4px 4px !important; line-height: 1.35; }
        .gst-tbl td { padding-top: 3px !important; padding-bottom: 3px !important; }
        .xsmall { font-size: 7pt; }
        .small { font-size: 7.5pt; }
        .pad { padding: 5px 8px; }
      `}</style>

      <div className="no-print" style={{ position: "sticky", top: 0, background: "#020817", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.3)", zIndex: 100 }}>
        <button onClick={() => window.close()} style={{ background: "transparent", color: "#a8b0c0", border: "1px solid #1a2233", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase" }}>← Close</button>
        <h2 style={{ color: "#d4af37", fontSize: 14, fontWeight: "bold", letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>Bill · SL/{bill.bill_number}</h2>
        <button onClick={() => window.print()} style={{ background: "linear-gradient(135deg, #f4d77a, #d4af37, #a8842c)", color: "#020817", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase" }}>🖨 Print Bill</button>
      </div>

      <div className="bill-page">

        {/* ── HEADER: checkbox row + company + GSTIN grid; QR box is ONE tall cell spanning the right from the checkbox row down (single left border) ── */}
        <table className="grid" style={{ fontSize: "7.5pt", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "33%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "29%" }} />
            <col style={{ width: "17%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={4} className="xsmall" style={{ padding: "3px 8px" }}>
                {["Orignal", "Duplicate", "Triplicate", "Transport Copy"].map((t) => {
                  const isChecked = (t === "Orignal" && bill.bill_type === "Original") || bill.bill_type === t;
                  return (
                    <span key={t} style={{ marginRight: 18 }}>
                      <span className={`checkbox ${isChecked ? "checked" : ""}`}>{isChecked ? "✓" : ""}</span>
                      {t}
                    </span>
                  );
                })}
              </td>
              {/* Empty QR box — spans from the checkbox row down through the ACK row */}
              <td rowSpan={5} style={{ textAlign: "center", verticalAlign: "middle" }}></td>
            </tr>
            <tr>
              <td colSpan={4} style={{ padding: "4px 8px" }}>
                <h1 style={{ fontSize: 16, fontWeight: "bold", margin: "0 0 1px 0", lineHeight: 1.1 }}>SAIKRIPA TEXTILES</h1>
                <p className="xsmall" style={{ margin: "1px 0" }}>38-A, GROUND FLOOR, MARVEL SQUARE, GANDHI NAGAR</p>
                <p className="xsmall" style={{ margin: "1px 0" }}><strong>BHILWARA</strong>, State Code:08, State :Rajasthan, Country: INDIA</p>
                <p className="xsmall" style={{ margin: "1px 0" }}>Phone:-,,(M)8949881253, Email: saikripatextiles58@gmail.com</p>
              </td>
            </tr>
            <tr>
              <td className="bold">GSTIN</td>
              <td>: {BUSINESS_GSTIN}</td>
              <td className="bold">CIN</td>
              <td>:</td>
            </tr>
            <tr>
              <td className="bold">TIN</td>
              <td>: {BUSINESS_TIN}</td>
              <td className="bold">PAN</td>
              <td>:- {BUSINESS_PAN}</td>
            </tr>
            <tr>
              <td className="bold">ACK NO.</td>
              <td>: {ackNo}</td>
              <td className="bold">ACK DATE</td>
              <td>: {ackDate}</td>
            </tr>
            <tr>
              <td className="bold">IRN</td>
              <td colSpan={4} style={{ wordBreak: "break-all" }}>: {irn}</td>
            </tr>
          </tbody>
        </table>

        {/* ── TAX INVOICE TITLE STRIP ── */}
        <div className="strip center bold" style={{ fontSize: 11, padding: "4px 0", letterSpacing: 3, borderBottom: "1px solid #000" }}>TAX INVOICE</div>
        <div className="strip center bold xsmall" style={{ padding: "2px 0", letterSpacing: 1, borderBottom: "1px solid #000" }}>FINISH FABRIC SALES (GSTIN BILLING)</div>

        {/* ── BUYER + INVOICE DETAILS ── */}
        <table>
          <tbody>
            <tr>
              <td className="strip center" style={{ width: "55%", borderRight: "1px solid #000", borderBottom: "1px solid #000", padding: 3 }}>Details of Buyer (Billed To)</td>
              <td className="strip center" style={{ width: "45%", borderBottom: "1px solid #000", padding: 3 }}>Invoice Details</td>
            </tr>
            <tr>
              {/* LEFT: Buyer freeform */}
              <td style={{ verticalAlign: "top", padding: 5, borderRight: "1px solid #000" }}>
                <table className="buyer-tbl" style={{ fontSize: "8pt", width: "100%" }}>
                  <colgroup>
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "43%" }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="bold">M/s:</td>
                      <td className="bold" colSpan={3}>{bill.party}</td>
                    </tr>
                    {bill.buyer_address && (
                      <tr>
                        <td></td>
                        <td colSpan={3}>{bill.buyer_address}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="bold">Mob.</td>
                      <td className="bold">{bill.buyer_mobile || ""}</td>
                      <td className="bold">Email</td>
                      <td>{bill.buyer_email || ""}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td className="bold">StateCode</td>
                      <td><span className="bold">{bill.buyer_state_code || ""}</span> &nbsp; INDIA</td>
                    </tr>
                    <tr>
                      <td className="bold">Adhar</td>
                      <td>{bill.buyer_adhar || ""}</td>
                      <td className="bold">PAN</td>
                      <td className="bold">{bill.buyer_pan || ""}</td>
                    </tr>
                    <tr>
                      <td className="bold">GSTN</td>
                      <td className="bold">{bill.buyer_gstin || ""}</td>
                      <td className="bold">CIN</td>
                      <td>{bill.buyer_cin || ""}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="strip center b-top" style={{ marginTop: 8, padding: "2px 0", fontSize: "8pt" }}>Agent Details</div>
                <p className="bold" style={{ margin: "3px 0 0 0", fontSize: "8pt", paddingLeft: 4 }}>● {bill.agent_name || ""}</p>
              </td>

              {/* RIGHT: Invoice details */}
              <td style={{ verticalAlign: "top", padding: 5 }}>
                <table style={{ fontSize: "8pt" }}>
                  <tbody>
                    <tr>
                      <td className="bold" style={{ width: "35%" }}>Invoice No</td>
                      <td>:- <span className="bold" style={{ fontSize: "10pt" }}>SL/{bill.bill_number}</span></td>
                    </tr>
                    <tr>
                      <td className="bold">InvoiceDate</td>
                      <td>:- {fmtDate(bill.bill_date)}</td>
                    </tr>
                    <tr>
                      <td className="bold">Indent No</td>
                      <td>:- 0 <span style={{ marginLeft: 30 }} className="bold">Date</span> :- {fmtDate(bill.bill_date)}</td>
                    </tr>
                    <tr>
                      <td className="bold">Due Date:</td>
                      <td>:- {fmtDate(bill.bill_date)} <span style={{ marginLeft: 12 }} className="bold">IS RCM:- NO</span></td>
                    </tr>
                  </tbody>
                </table>

                <div className="strip center b-top" style={{ marginTop: 8, padding: "2px 0", fontSize: "8pt" }}>Details of Consignee (Ship To)</div>
                <p className="bold" style={{ margin: "3px 0 0 0", fontSize: "8.5pt", paddingLeft: 4 }}>Same as Buyer</p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── ITEMS TABLE ── */}
        <div style={{ width: "100%", display: "block" }}>
        <table className="grid items-table" style={{ borderTop: "1px solid #000", width: "100%", maxWidth: "none" }}>
          <colgroup>
            <col style={{ width: "7%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>
          <thead>
            <tr style={{ fontSize: "7.5pt" }}>
              <th>Caseno</th>
              <th style={{ textAlign: "left" }}>Description</th>
              <th>HSN</th>
              <th>Des No</th>
              <th>Cut</th>
              <th>Pcs</th>
              <th>Quantity Unit</th>
              <th>Rate</th>
              <th>Amount(Rs.)</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "8pt" }}>
            {items.map((it, i) => (
              <tr key={it.id || i}>
                <td className="center">{it.case_no || ""}</td>
                <td>{it.quality}</td>
                <td className="center">{it.hsn_code || "5515"}</td>
                <td className="center">WHITE</td>
                <td className="center">{it.cut_type || "Lump"}</td>
                <td className="center">{it.pcs || 1}</td>
                <td className="right">{Number(it.meter).toFixed(2)} Mtrs</td>
                <td className="right">{fmtMoney(it.rate)}</td>
                <td className="right">{fmtMoney(it.amount)}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ height: 15 }}>
                <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
              </tr>
            ))}
            <tr className="bold">
              <td className="center">{items.length}</td>
              <td></td>
              <td></td>
              <td className="center">Total</td>
              <td></td>
              <td className="center">{totalPcs}</td>
              <td className="right">{totalMeters.toFixed(2)}</td>
              <td></td>
              <td className="right">{fmtMoney(subtotal)}</td>
            </tr>

            {/* ── Bank details (cols 1-4) + GST (cols 5-9) merged into the items grid so every divider is a real column border running unbroken to the bottom ── */}
            <tr>
              <td colSpan={4} rowSpan={14} style={{ padding: 0, verticalAlign: "top" }}>
                <div className="strip center" style={{ padding: 3, borderBottom: "1px solid #000", fontSize: "9pt" }}>Bank Details</div>
                <table style={{ tableLayout: "fixed", width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", verticalAlign: "middle", padding: "6px 6px", textAlign: "center" }}>
                        <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "9pt", textAlign: "left" }}>UPI</p>
                        <img src="/QR.jpeg" alt="UPI QR Code" style={{ width: 135, height: 135, border: "1px solid #000", display: "block", margin: "0 auto", objectFit: "contain" }} />
                      </td>
                      <td style={{ verticalAlign: "middle", padding: "6px 6px", fontSize: "8pt" }}>
                        <p className="bold center" style={{ margin: "2px 0" }}>BANK OF BARODA</p>
                        <p className="center" style={{ margin: "2px 0" }}>25790200000435</p>
                        <p className="center" style={{ margin: "2px 0" }}>BARB0SSIBHI</p>
                        <p className="center" style={{ margin: "2px 0" }}>SSI</p>
                        <p className="bold center" style={{ margin: "8px 0 2px 0" }}>SAI KRIPA TEXTILES</p>
                        <p className="center" style={{ margin: 0, fontSize: "7pt" }}>saikripatextiles@barodampey</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ borderTop: "1px solid #000", padding: "6px 8px", fontSize: "9pt", fontWeight: "bold", lineHeight: 1.45 }}>
                  Note :- GARMENT बनाने के पहले <span style={{ fontWeight: "bold" }}>FABRICS</span> सभी प्रकार से <span style={{ fontWeight: "bold" }}>CHECK</span> कर लें। I <span style={{ fontWeight: "bold" }}>GARMENT/LUMP CUTTING</span> हो जाने के बाद हमारी किसी भी प्रकार की कोई जवाबदारी नहीं रहेगी।
                </div>
              </td>
              {/* Less row → cols 5-9 (Less line attaches to Add, so border-bottom hidden) */}
              <td className="bold" style={{ borderBottom: "hidden" }}>Less</td>
              <td colSpan={2} className="bold" style={{ borderBottom: "hidden" }}>Discount Comm.</td>
              <td className="right" style={{ borderBottom: "hidden" }}></td>
              <td className="right" style={{ borderBottom: "hidden" }}>{Number(bill.discount) > 0 ? fmtMoney(bill.discount) : ""}</td>
            </tr>
            <tr>
              <td className="bold" rowSpan={4} style={{ verticalAlign: "top" }}>Add</td>
              <td colSpan={2}>Cartage</td>
              <td className="right"></td>
              <td className="right">{Number(bill.cartage) > 0 ? fmtMoney(bill.cartage) : ""}</td>
            </tr>
            <tr>
              <td colSpan={2}>Insurance</td>
              <td className="right"></td>
              <td className="right">{Number(bill.insurance) > 0 ? fmtMoney(bill.insurance) : ""}</td>
            </tr>
            <tr>
              <td colSpan={2}>Sp.Pack Chg.</td>
              <td className="right"></td>
              <td className="right">{Number(bill.sp_pack_chg) > 0 ? fmtMoney(bill.sp_pack_chg) : ""}</td>
            </tr>
            <tr>
              <td colSpan={2}>Others</td>
              <td className="right"></td>
              <td className="right">{Number(bill.others) > 0 ? fmtMoney(bill.others) : ""}</td>
            </tr>
            <tr className="bold">
              <td colSpan={4}>GST Apllicable Amount</td>
              <td className="right">{fmtMoney(subtotal)}</td>
            </tr>
            <tr>
              <td className="bold" rowSpan={4} style={{ verticalAlign: "middle" }}><span style={{ display: "block" }}>OUT</span><span style={{ display: "block" }}>TAX</span></td>
              <td colSpan={2}>CGST</td>
              <td className="right">{fmtPct(bill.cgst_percent)}</td>
              <td className="right">{cgst > 0 ? fmtMoney(cgst) : ""}</td>
            </tr>
            <tr>
              <td colSpan={2}>SGST</td>
              <td className="right">{fmtPct(bill.sgst_percent)}</td>
              <td className="right">{sgst > 0 ? fmtMoney(sgst) : ""}</td>
            </tr>
            <tr>
              <td colSpan={2}>IGST</td>
              <td className="right">{fmtPct(bill.igst_percent)}</td>
              <td className="right">{igst > 0 ? fmtMoney(igst) : ""}</td>
            </tr>
            <tr>
              <td colSpan={2}>CESS</td>
              <td className="right"> %</td>
              <td className="right"></td>
            </tr>
            <tr className="bold">
              <td colSpan={4}>Total GST Value</td>
              <td className="right">{totalGst > 0 ? fmtMoney(totalGst) : ""}</td>
            </tr>
            <tr>
              <td colSpan={3}>TCS</td>
              <td className="right"> %</td>
              <td className="right">{Number(bill.tcs) || 0}</td>
            </tr>
            <tr className="bold">
              <td colSpan={4}>Round of</td>
              <td className="right">{fmtMoney(roundOff)}</td>
            </tr>
            <tr className="bold" style={{ fontSize: "9pt" }}>
              <td colSpan={4}>Net Amount (R/O)</td>
              <td className="right">₹ {fmtMoney(finalTotal)}</td>
            </tr>
          </tbody>
        </table>
        </div>

        {/* ── AMOUNT IN WORDS ── */}
        <div style={{ padding: "4px 8px", fontSize: "8.5pt", fontWeight: "bold", borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
          RUPEES :- {numberToWords(Math.round(finalTotal))}
        </div>

        {/* ── DESPATCH + EWAY ── */}
        <table style={{ marginTop: "-1px", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "55%" }} />
            <col style={{ width: "45%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="strip center" style={{ width: "55%", borderRight: "1px solid #000", borderBottom: "1px solid #000", padding: 3, fontSize: "8.5pt" }}>Despatch Details</td>
              <td className="strip center" style={{ width: "45%", borderBottom: "1px solid #000", padding: 3, fontSize: "8.5pt" }}>Insurance & Eway Details</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: "top", padding: 5, borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                <table style={{ fontSize: "8pt" }}>
                  <tbody>
                    <tr>
                      <td className="bold" style={{ width: "35%" }}>Despatch To</td>
                      <td>{bill.despatch_to || ""}</td>
                    </tr>
                    <tr>
                      <td className="bold">Transport Name</td>
                      <td>{bill.transport_name || ""}</td>
                    </tr>
                    <tr>
                      <td className="bold">GSTIN</td>
                      <td>{bill.transport_gstin || ""}</td>
                    </tr>
                    <tr>
                      <td className="bold">Lr No.</td>
                      <td>{bill.lr_no || ""}</td>
                    </tr>
                    <tr>
                      <td className="bold">Lr Date</td>
                      <td>{bill.lr_date ? fmtDate(bill.lr_date) : ""}<span style={{ marginLeft: 20 }} className="bold">DocThru.</span> {bill.agent_name ? "Agent" : ""}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ verticalAlign: "top", padding: 5, borderBottom: "1px solid #000" }}>
                <table style={{ fontSize: "8pt" }}>
                  <tbody>
                    <tr>
                      <td className="bold" style={{ width: "40%" }}>Insured By</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="bold">Pol. No.</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="bold">Place Of Supply</td>
                      <td>{bill.place_of_supply || ""}</td>
                    </tr>
                    <tr>
                      <td className="bold">Eway Bill No</td>
                      <td>{bill.eway_bill_no || ""}</td>
                    </tr>
                    <tr>
                      <td className="bold">Eway Bill Date</td>
                      <td>{bill.eway_bill_date ? fmtDate(bill.eway_bill_date) : ""}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── TERMS + SIGNATORY ── */}
        <table>
          <tbody>
            <tr>
              <td style={{ width: "65%", verticalAlign: "top", fontSize: "7.5pt", padding: "5px 8px" }}>
                <p className="bold" style={{ margin: 0 }}>Terms & Conditions :-</p>
                <p style={{ margin: "2px 0" }}>1.Payment should be made by a/c payee Cheques/Drafts only.</p>
                <p style={{ margin: "2px 0" }}>2.Goods once sold will not be taken back.</p>
                <p style={{ margin: "2px 0" }}>3.Interest will be charged @ 24% P.A. after due date.</p>
                <p style={{ margin: "2px 0" }}>4 SUBJECT TO BHILWARA JURISDICTION ONLY</p>
              </td>
              <td style={{ width: "35%", verticalAlign: "top", padding: "5px 8px" }}>
                <p className="bold center" style={{ margin: 0, fontSize: "9pt" }}>For :   SAIKRIPA TEXTILES</p>
                <div style={{ height: 45 }}></div>
                <p className="center" style={{ margin: 0, fontSize: "8pt" }}>Auth. Signatory</p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── FOOTER BAR ── */}
        <table style={{ fontSize: "7.5pt" }}>
          <tbody>
            <tr>
              <td style={{ width: "33%", padding: "3px 8px" }}><span className="bold">ADMIN</span> <br /><span className="bold">Prepared By..........</span></td>
              <td style={{ width: "34%", padding: "3px 8px" }} className="center"><span className="bold">E. & O.E.</span></td>
              <td style={{ width: "33%", padding: "3px 8px" }} className="right"></td>
            </tr>
            <tr>
              <td colSpan={3} className="center" style={{ fontSize: "8pt", padding: "7px 0", borderTop: "1px solid #000" }}>
                WE &nbsp;&nbsp; RUN &nbsp;&nbsp; ON &nbsp;&nbsp; TEX &nbsp;&nbsp; ERP 8.5
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}