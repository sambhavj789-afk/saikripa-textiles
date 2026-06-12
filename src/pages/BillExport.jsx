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
  const finalTotal = Number(bill.final_total) || subtotal;
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

        {/* ── TOP: Bill type checkboxes (left) + QR code (right) ── */}
        <table className="b-bot">
          <tbody>
            <tr>
              <td style={{ width: "72%", padding: "6px 8px", verticalAlign: "top" }}>
                <div className="xsmall" style={{ marginBottom: 6 }}>
                  {["Orignal", "Duplicate", "Triplicate", "Transport Copy"].map((t) => {
                    // sample uses "Orignal" (typo) — match exactly. Compare to actual bill_type ("Original")
                    const isChecked = (t === "Orignal" && bill.bill_type === "Original") || bill.bill_type === t;
                    return (
                      <span key={t} style={{ marginRight: 18 }}>
                        <span className={`checkbox ${isChecked ? "checked" : ""}`}>{isChecked ? "✓" : ""}</span>
                        {t}
                      </span>
                    );
                  })}
                </div>
                <h1 style={{ fontSize: 16, fontWeight: "bold", margin: "0 0 1px 0", lineHeight: 1.1 }}>SAIKRIPA TEXTILES</h1>
                <p className="xsmall" style={{ margin: "1px 0" }}>38-A, GROUND FLOOR, MARVEL SQUARE</p>
                <p className="xsmall" style={{ margin: "1px 0" }}>GANDHI NAGAR</p>
                <p className="xsmall" style={{ margin: "5px 0 1px 0" }}><strong>BHILWARA</strong>,State Code:08, State :Rajasthan,Country: INDIA</p>
                <p className="xsmall" style={{ margin: "1px 0" }}>Phone:-,,(M)8949881253, Email: saikripatextiles58@gmail.com</p>
              </td>
              <td style={{ width: "28%", padding: "6px 8px", verticalAlign: "top", textAlign: "right" }}>
                <div style={{ display: "inline-block", width: 95, height: 95, border: "1px solid #000", textAlign: "center", lineHeight: "93px", fontSize: 7 }}>QR</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── GSTIN/TIN/ACK/IRN GRID ── */}
        <table className="grid" style={{ fontSize: "7.5pt" }}>
          <tbody>
            <tr>
              <td className="bold" style={{ width: "10%" }}>GSTIN</td>
              <td style={{ width: "40%" }}>: {BUSINESS_GSTIN}</td>
              <td className="bold" style={{ width: "10%" }}>CIN</td>
              <td style={{ width: "40%" }}>:</td>
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
              <td colSpan={3} style={{ wordBreak: "break-all" }}>: {irn}</td>
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
                <table style={{ fontSize: "8pt" }}>
                  <tbody>
                    <tr>
                      <td className="bold" style={{ width: 40 }}>M/s:</td>
                      <td className="bold">{bill.party}</td>
                    </tr>
                    {bill.buyer_address && (
                      <tr>
                        <td></td>
                        <td>{bill.buyer_address}</td>
                      </tr>
                    )}
                    {bill.buyer_mobile && (
                      <tr>
                        <td className="bold">Mob.</td>
                        <td>{bill.buyer_mobile}<span style={{ marginLeft: 30 }} className="bold">Email</span></td>
                      </tr>
                    )}
                    {bill.buyer_state_code && (
                      <tr>
                        <td></td>
                        <td><span className="bold">StateCode</span> &nbsp; <span className="bold">{bill.buyer_state_code}</span> &nbsp; INDIA</td>
                      </tr>
                    )}
                    <tr>
                      <td className="bold">Adhar</td>
                      <td>
                        {bill.buyer_adhar || ""}
                        <span style={{ marginLeft: 30 }} className="bold">PAN</span>
                        <span style={{ marginLeft: 10 }} className="bold">{bill.buyer_pan || ""}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="bold">GSTN</td>
                      <td>
                        {bill.buyer_gstin || ""}
                        <span style={{ marginLeft: 30 }} className="bold">CIN</span>
                      </td>
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
        <table className="grid" style={{ borderTop: "1px solid #000" }}>
          <thead>
            <tr style={{ fontSize: "7.5pt" }}>
              <th style={{ width: "6%" }}>Caseno</th>
              <th style={{ width: "22%", textAlign: "left" }}>Description</th>
              <th style={{ width: "8%" }}>HSN</th>
              <th style={{ width: "7%" }}>Des No</th>
              <th style={{ width: "6%" }}>Cut</th>
              <th style={{ width: "5%" }}>Pcs</th>
              <th style={{ width: "15%" }}>Quantity Unit</th>
              <th style={{ width: "11%" }}>Rate</th>
              <th style={{ width: "14%" }}>Amount(Rs.)</th>
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
              <td>{items.length}</td>
              <td colSpan={3}></td>
              <td className="right">Total</td>
              <td className="center">{totalPcs}</td>
              <td className="right">{totalMeters.toFixed(2)}</td>
              <td></td>
              <td className="right">{fmtMoney(subtotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── BANK DETAILS + GST ── */}
        <table>
          <tbody>
            <tr>
              {/* LEFT: Bank Details */}
              <td style={{ width: "55%", verticalAlign: "top", borderRight: "1px solid #000" }}>
                <div className="strip center" style={{ padding: 3, borderBottom: "1px solid #000", fontSize: "9pt" }}>Bank Details</div>
                <div style={{ padding: 6 }}>
                  <table>
                    <tbody>
                      <tr>
                        <td style={{ width: "40%", verticalAlign: "top" }}>
                          <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "8pt" }}>UPI</p>
                          <div style={{ width: 90, height: 90, border: "1px solid #000", textAlign: "center", lineHeight: "88px", fontSize: 7 }}>QR CODE</div>
                        </td>
                        <td style={{ verticalAlign: "top", paddingLeft: 10, fontSize: "8pt" }}>
                          <p className="bold center" style={{ margin: "10px 0 4px 0" }}>BANK OF BARODA</p>
                          <p className="center" style={{ margin: "3px 0" }}>25790200000435</p>
                          <p className="center" style={{ margin: "3px 0" }}>BARB0SSIBHI</p>
                          <p className="center" style={{ margin: "3px 0" }}>SSI</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="bold center" style={{ margin: "6px 0 0 0", fontSize: "8pt" }}>SAI KRIPA TEXTILES</p>
                  <p className="center" style={{ margin: 0, fontSize: "7pt" }}>saikripatextiles@barodampey</p>
                </div>
              </td>

              {/* RIGHT: GST table */}
              <td style={{ width: "45%", verticalAlign: "top" }}>
                <table className="grid" style={{ fontSize: "8pt" }}>
                  <tbody>
                    <tr>
                      <td className="bold" style={{ width: "15%" }}>Less</td>
                      <td className="bold" style={{ width: "40%" }}>Discount Comm.</td>
                      <td style={{ width: "15%" }} className="right"></td>
                      <td style={{ width: "30%" }} className="right">{Number(bill.discount) > 0 ? fmtMoney(bill.discount) : ""}</td>
                    </tr>
                    <tr>
                      <td className="bold" rowSpan={4} style={{ verticalAlign: "top" }}>Add</td>
                      <td>Cartage</td>
                      <td className="right"></td>
                      <td className="right">{Number(bill.cartage) > 0 ? fmtMoney(bill.cartage) : ""}</td>
                    </tr>
                    <tr>
                      <td>Insurance</td>
                      <td className="right"></td>
                      <td className="right">{Number(bill.insurance) > 0 ? fmtMoney(bill.insurance) : ""}</td>
                    </tr>
                    <tr>
                      <td>Sp.Pack Chg.</td>
                      <td className="right"></td>
                      <td className="right">{Number(bill.sp_pack_chg) > 0 ? fmtMoney(bill.sp_pack_chg) : ""}</td>
                    </tr>
                    <tr>
                      <td>Others</td>
                      <td className="right"></td>
                      <td className="right">{Number(bill.others) > 0 ? fmtMoney(bill.others) : ""}</td>
                    </tr>
                    <tr className="bold">
                      <td colSpan={3}>GST Apllicable Amount</td>
                      <td className="right">{fmtMoney(subtotal)}</td>
                    </tr>
                    <tr>
                      <td className="bold" rowSpan={2} style={{ verticalAlign: "middle" }}><span style={{ display: "block" }}>OUT</span><span style={{ display: "block" }}>TAX</span></td>
                      <td>CGST</td>
                      <td className="right">{Number(bill.cgst_percent) > 0 ? `${bill.cgst_percent}` : ""} %</td>
                      <td className="right">{cgst > 0 ? fmtMoney(cgst) : ""}</td>
                    </tr>
                    <tr>
                      <td>SGST</td>
                      <td className="right">{Number(bill.sgst_percent) > 0 ? `${bill.sgst_percent}` : ""} %</td>
                      <td className="right">{sgst > 0 ? fmtMoney(sgst) : ""}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td>IGST</td>
                      <td className="right">{Number(bill.igst_percent) > 0 ? bill.igst_percent : ""} %</td>
                      <td className="right">{igst > 0 ? fmtMoney(igst) : ""}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td>CESS</td>
                      <td className="right">%</td>
                      <td className="right"></td>
                    </tr>
                    <tr className="bold">
                      <td colSpan={3}>Total GST Value</td>
                      <td className="right">{totalGst > 0 ? fmtMoney(totalGst) : ""}</td>
                    </tr>
                    <tr>
                      <td colSpan={2}>TCS</td>
                      <td className="right">%</td>
                      <td className="right">{Number(bill.tcs) || 0}</td>
                    </tr>
                    <tr>
                      <td colSpan={3}>Round of</td>
                      <td className="right">{fmtMoney(bill.round_off || 0)}</td>
                    </tr>
                    <tr className="bold" style={{ fontSize: "9pt" }}>
                      <td colSpan={3}>Net Amount (R/O)</td>
                      <td className="right">₹ {fmtMoney(finalTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── HINDI NOTE (below bank details, full width) ── */}
        <div style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "5px 8px", fontSize: "7.5pt", fontWeight: "bold", lineHeight: 1.5 }}>
          Note :- GARMENT बनाने के पहले <span style={{ fontWeight: "bold" }}>FABRICS</span> सभी प्रकार से <span style={{ fontWeight: "bold" }}>CHECK</span> कर लें। I <span style={{ fontWeight: "bold" }}>GARMENT/LUMP CUTTING</span> हो जाने के बाद हमारी किसी भी प्रकार की कोई जवाबदारी नहीं रहेगी।
        </div>

        {/* ── AMOUNT IN WORDS ── */}
        <div style={{ padding: "4px 8px", fontSize: "8.5pt", fontWeight: "bold", borderBottom: "1px solid #000" }}>
          RUPEES :- {numberToWords(Math.round(finalTotal))}
        </div>

        {/* ── DESPATCH + EWAY ── */}
        <table>
          <tbody>
            <tr>
              <td className="strip center" style={{ width: "55%", borderRight: "1px solid #000", borderBottom: "1px solid #000", padding: 3, fontSize: "8.5pt" }}>Despatch Details</td>
              <td className="strip center" style={{ width: "45%", borderBottom: "1px solid #000", padding: 3, fontSize: "8.5pt" }}>Insurance & Eway Details</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: "top", padding: 5, borderRight: "1px solid #000" }}>
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
              <td style={{ verticalAlign: "top", padding: 5 }}>
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
        <table style={{ borderTop: "1px solid #000" }}>
          <tbody>
            <tr>
              <td style={{ width: "65%", verticalAlign: "top", fontSize: "7.5pt", padding: "5px 8px", borderRight: "1px solid #000" }}>
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
        <table style={{ borderTop: "1px solid #000", fontSize: "7.5pt" }}>
          <tbody>
            <tr>
              <td style={{ width: "33%", padding: "3px 8px" }}><span className="bold">ADMIN</span> <br /><span className="bold">Prepared By..........</span></td>
              <td style={{ width: "34%", padding: "3px 8px" }} className="center"><span className="bold">E. & O.E.</span></td>
              <td style={{ width: "33%", padding: "3px 8px" }} className="right"></td>
            </tr>
            <tr>
              <td colSpan={3} className="center" style={{ fontSize: "7pt", padding: "3px 0", borderTop: "1px solid #000" }}>
                WE &nbsp;&nbsp; RUN &nbsp;&nbsp; ON &nbsp;&nbsp; TEX &nbsp;&nbsp; ERP 8.5
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}