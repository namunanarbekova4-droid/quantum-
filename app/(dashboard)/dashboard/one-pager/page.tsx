"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Copy, Check,
  ZoomIn, ZoomOut, Maximize2, Sun, Moon, Printer, ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { OnePagerDocument } from "@/app/api/one-pager/route";

interface FormState {
  startupName: string; tagline: string; problem: string;
  solution: string; targetMarket: string; businessModel: string;
  traction: string; team: string; amountRaising: string;
  useOfFunds: string; email: string; website: string;
}

// ─── Standalone HTML generator (for print popup) ─────────────────────────────
function buildPrintHTML(doc: OnePagerDocument, format: "A4" | "Letter", theme: "light" | "dark"): string {
  const isLight = theme === "light";
  const bg     = isLight ? "#FFFFFF" : "#0F0A1F";
  const text   = isLight ? "#1A1A1A" : "#FFFFFF";
  const sub    = isLight ? "#666666" : "#A89BC2";
  const border = isLight ? "#E8E8E8" : "rgba(124,58,237,0.25)";
  const accent = "#C9A84C";
  const hdrBg  = isLight ? "#1A1040" : "#0A0620";
  const cardBg = isLight ? "#F5F5F5" : "rgba(124,58,237,0.08)";
  const W = format === "A4" ? "210mm" : "8.5in";
  const H = format === "A4" ? "297mm" : "11in";

  const metricCards = doc.metrics.map(m => `
    <div style="background:${cardBg};border:1px solid ${border};border-radius:6px;padding:8px 6px;text-align:center;flex:1">
      <div style="font-size:22px;font-weight:900;color:${accent};line-height:1.1">${m.number}</div>
      <div style="font-size:8px;color:${sub};text-transform:uppercase;letter-spacing:0.1em;margin-top:3px">${m.label}</div>
    </div>`).join("");

  const teamRows = doc.team.map(m => `
    <div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:6px">
      <div style="width:24px;height:24px;border-radius:50%;background:${accent}22;border:1px solid ${accent}66;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span style="font-size:10px;font-weight:800;color:${accent}">${m.name.charAt(0)}</span>
      </div>
      <div>
        <div style="font-size:9.5px;font-weight:700;color:${text}">${m.name} <span style="color:${sub};font-weight:400">· ${m.role}</span></div>
        <div style="font-size:8.5px;color:${sub}">${m.bio}</div>
      </div>
    </div>`).join("");

  const label = (s: string) => `<div style="font-size:7.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:3px">${s}</div>
<div style="height:1px;background:${accent};opacity:0.5;margin-bottom:6px"></div>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#888;display:flex;justify-content:center;align-items:flex-start;min-height:100vh;padding:20px}
  @media print{
    body{background:white;padding:0}
    @page{size:${format === "A4" ? "A4" : "letter"} portrait;margin:0}
  }
</style>
</head><body>
<div id="doc" style="width:${W};min-height:${H};max-height:${H};background:${bg};font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;line-height:1.38;overflow:hidden;position:relative">

  <!-- HEADER BANNER -->
  <div style="background:${hdrBg};padding:14px 16px 12px;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:4px">
        <div style="width:32px;height:32px;border-radius:7px;background:${accent};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:15px;font-weight:900;color:#fff">${doc.company_name.charAt(0)}</span>
        </div>
        <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.02em">${doc.company_name}</span>
      </div>
      <div style="font-size:10px;color:${accent};font-style:italic;margin-left:41px">${doc.tagline}</div>
    </div>
    <div style="text-align:right;font-size:8.5px;color:#AAA;line-height:1.7;margin-top:4px">
      ${doc.contact.email ? `<div>${doc.contact.email}</div>` : ""}
      ${doc.contact.website ? `<div style="color:${accent}">${doc.contact.website}</div>` : ""}
    </div>
  </div>

  <!-- BODY -->
  <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:14px;padding:14px 16px 10px;height:calc(${H} - 112px);overflow:hidden">

    <!-- LEFT -->
    <div style="display:flex;flex-direction:column;gap:11px">
      <div>${label("Problem")}<div style="font-size:10px;color:${text};line-height:1.42">${doc.problem}</div></div>
      <div>${label("Solution")}<div style="font-size:10px;color:${text};line-height:1.42">${doc.solution}</div></div>
      <div>${label("Business Model")}<div style="font-size:10px;color:${text};line-height:1.42">${doc.business_model}</div></div>
      <div>${label("Market Size")}<div style="font-size:10px;color:${text};line-height:1.42">${doc.market_size}</div></div>
    </div>

    <!-- RIGHT -->
    <div style="display:flex;flex-direction:column;gap:11px">
      <div>
        ${label("Traction")}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">${metricCards}</div>
      </div>
      <div>${label("Team")}${teamRows}</div>
      <div style="margin-top:auto;background:${accent}16;border:1px solid ${accent}55;border-radius:7px;padding:9px 11px">
        <div style="font-size:7.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:3px">The Ask</div>
        <div style="font-size:20px;font-weight:900;color:${accent};margin-bottom:3px">${doc.ask_amount}</div>
        <div style="font-size:9px;color:${isLight ? "#555" : "#C4B5FD"}">${doc.ask_use}</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="position:absolute;bottom:0;left:0;right:0;padding:7px 16px;border-top:1px solid ${border};display:flex;justify-content:space-between;align-items:center;font-size:8px;color:${sub};background:${bg}">
    <span>${doc.contact.website}</span>
    <span style="color:${accent};font-weight:700;letter-spacing:0.07em">${doc.company_name.toUpperCase()} · CONFIDENTIAL</span>
    <span>${doc.contact.email}</span>
  </div>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
}

// ─── In-app document renderer ─────────────────────────────────────────────────
function DocumentRenderer({ doc, theme, format, docRef }: {
  doc: OnePagerDocument; theme: "light" | "dark"; format: "A4" | "Letter";
  docRef?: React.Ref<HTMLDivElement>;
}) {
  const isLight = theme === "light";
  const bg     = isLight ? "#FFFFFF" : "#0F0A1F";
  const text   = isLight ? "#1A1A1A" : "#FFFFFF";
  const sub    = isLight ? "#666666" : "#A89BC2";
  const border = isLight ? "#E8E8E8" : "rgba(124,58,237,0.25)";
  const accent = "#C9A84C";
  const hdrBg  = isLight ? "#1A1040" : "#0A0620";
  const cardBg = isLight ? "#F5F5F5" : "rgba(124,58,237,0.08)";
  const W = format === "A4" ? "210mm" : "8.5in";
  const H = format === "A4" ? "297mm" : "11in";

  const Label = ({ children }: { children: string }) => (
    <div>
      <p style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, marginBottom: 3 }}>
        {children}
      </p>
      <div style={{ height: 1, background: accent, opacity: 0.5, marginBottom: 6 }} />
    </div>
  );

  return (
    <div ref={docRef} id="one-pager-doc" style={{
      width: W, minHeight: H, maxHeight: H,
      background: bg, color: text,
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: 10, lineHeight: 1.38,
      display: "flex", flexDirection: "column",
      overflow: "hidden", boxSizing: "border-box", position: "relative",
    }}>
      {/* HEADER BANNER */}
      <div style={{ background: hdrBg, padding: "14px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{doc.company_name.charAt(0)}</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{doc.company_name}</span>
          </div>
          <div style={{ fontSize: 10, color: accent, fontStyle: "italic", marginLeft: 41 }}>{doc.tagline}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 8.5, color: "#AAA", lineHeight: 1.7, marginTop: 4 }}>
          {doc.contact.email && <div>{doc.contact.email}</div>}
          {doc.contact.website && <div style={{ color: accent }}>{doc.contact.website}</div>}
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14, padding: "14px 16px 10px", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11, minHeight: 0 }}>
          <div><Label>Problem</Label><p style={{ fontSize: 10, color: text, lineHeight: 1.42 }}>{doc.problem}</p></div>
          <div><Label>Solution</Label><p style={{ fontSize: 10, color: text, lineHeight: 1.42 }}>{doc.solution}</p></div>
          <div><Label>Business Model</Label><p style={{ fontSize: 10, color: text, lineHeight: 1.42 }}>{doc.business_model}</p></div>
          <div><Label>Market Size</Label><p style={{ fontSize: 10, color: text, lineHeight: 1.42 }}>{doc.market_size}</p></div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11, minHeight: 0 }}>
          <div>
            <Label>Traction</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {doc.metrics.map((m, i) => (
                <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 6, padding: "7px 5px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: accent, lineHeight: 1.1 }}>{m.number}</div>
                  <div style={{ fontSize: 8, color: sub, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Team</Label>
            {doc.team.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 7 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: accent + "22", border: `1px solid ${accent}66`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: accent }}>{m.name.charAt(0)}</span>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: text }}>{m.name} <span style={{ color: sub, fontWeight: 400 }}>· {m.role}</span></div>
                  <div style={{ fontSize: 8.5, color: sub }}>{m.bio}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto", background: accent + "16", border: `1px solid ${accent}55`, borderRadius: 7, padding: "9px 11px" }}>
            <p style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, marginBottom: 3 }}>The Ask</p>
            <div style={{ fontSize: 20, fontWeight: 900, color: accent, marginBottom: 3 }}>{doc.ask_amount}</div>
            <p style={{ fontSize: 9, color: isLight ? "#555" : "#C4B5FD" }}>{doc.ask_use}</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "7px 16px", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 8, color: sub, flexShrink: 0 }}>
        <span>{doc.contact.website}</span>
        <span style={{ color: accent, fontWeight: 700, letterSpacing: "0.07em" }}>{doc.company_name.toUpperCase()} · CONFIDENTIAL</span>
        <span>{doc.contact.email}</span>
      </div>
    </div>
  );
}

// ─── Setup form ───────────────────────────────────────────────────────────────
function SetupForm({ form, setForm, onGenerate, loading, error, fo }: {
  form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onGenerate: () => void; loading: boolean; error: string; fo: Record<string, string>;
}) {
  const F = (key: keyof FormState, label: string, placeholder: string, multi = false) => (
    <div>
      <label className="block text-[10px] font-bold text-[#8B7CF8] uppercase tracking-widest mb-1.5">{label}</label>
      {multi ? (
        <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder} rows={2}
          className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-lg px-3.5 py-2.5 text-white placeholder-white/20 resize-none outline-none text-sm" />
      ) : (
        <input type="text" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-lg px-3.5 py-2.5 text-white placeholder-white/20 outline-none text-sm" />
      )}
    </div>
  );

  const valid = form.startupName.trim().length > 0 && form.problem.trim().length > 8;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#C9A84C]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{fo.title}</h1>
          <p className="text-sm text-[#8B7CF8]">{fo.subtitle}</p>
        </div>
      </div>
      <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {F("startupName", fo.startupName, "Quantum AI")}
          {F("tagline", fo.tagline, "AI copilot for founders")}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {F("email", "Email", "hello@startup.com")}
          {F("website", "Website", "www.startup.com")}
        </div>
        {F("problem", fo.problem, "Founders waste 40% of their time on decisions without data.", true)}
        {F("solution", fo.solution, "AI platform that turns decisions into intelligence.", true)}
        <div className="grid grid-cols-2 gap-4">
          {F("targetMarket", fo.targetMarket, "Early-stage founders")}
          {F("amountRaising", fo.amountRaising, "$500K")}
        </div>
        {F("businessModel", fo.businessModel, "Freemium + $29/mo Pro")}
        {F("traction", fo.traction, "500+ users, 92% retention, $0 burn", true)}
        {F("team", fo.team, "Jane Doe, CEO — ex-Google. John Smith, CTO.", true)}
        {F("useOfFunds", fo.useOfFunds, "60% product, 30% growth, 10% ops")}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={onGenerate} disabled={!valid || loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${valid && !loading ? "bg-[#C9A84C] hover:bg-[#d4b660] text-[#06040F] shadow-[0_0_20px_rgba(201,168,76,0.25)]" : "bg-[#1A1040] text-[#444] cursor-not-allowed"}`}>
          {loading ? (<><div className="w-4 h-4 border-2 border-[#06040F]/30 border-t-[#06040F] rounded-full animate-spin" />{fo.generating}</>) : fo.generate}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OnePagerPage() {
  const { t, locale } = useLanguage();
  const fo = t.features.onePager as Record<string, string>;

  const [form, setForm] = useState<FormState>({
    startupName: "", tagline: "", problem: "", solution: "",
    targetMarket: "", businessModel: "", traction: "", team: "",
    amountRaising: "", useOfFunds: "", email: "", website: "",
  });
  const [doc, setDoc]         = useState<OnePagerDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [theme, setTheme]     = useState<"light" | "dark">("light");
  const [format, setFormat]   = useState<"A4" | "Letter">("A4");
  const [zoom, setZoom]       = useState(0.68);
  const [copied, setCopied]   = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/one-pager", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Generation failed");
      setDoc(data as OnePagerDocument);
    } catch (err) {
      setError((err as Error).message || (fo.errorGenerate ?? "Generation failed. Try again."));
    } finally { setLoading(false); }
  }, [form, locale, fo]);

  // Open new window with standalone HTML — bypasses iOS print block
  const openPrint = useCallback(() => {
    if (!doc) return;
    const html = buildPrintHTML(doc, format, "light");
    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups for this site to export."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }, [doc, format]);

  const copyText = useCallback(() => {
    if (!doc) return;
    const lines = [
      doc.company_name, doc.tagline,
      `${doc.contact.email} | ${doc.contact.website}`, "",
      "PROBLEM", doc.problem, "",
      "SOLUTION", doc.solution, "",
      "TRACTION", doc.metrics.map(m => `${m.number} ${m.label}`).join("  ·  "), "",
      "BUSINESS MODEL", doc.business_model, "",
      "MARKET", doc.market_size, "",
      "TEAM", doc.team.map(m => `${m.name} (${m.role}) — ${m.bio}`).join("\n"), "",
      "THE ASK", `${doc.ask_amount} — ${doc.ask_use}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [doc]);

  const zoomIn   = () => setZoom(z => Math.min(z + 0.08, 2));
  const zoomOut  = () => setZoom(z => Math.max(z - 0.08, 0.25));
  const fitWidth = () => setZoom(0.68);

  return (
    <div className="min-h-screen bg-[#06040F] p-5 lg:p-8">
      <AnimatePresence mode="wait">
        {!doc ? (
          <SetupForm key="setup" form={form} setForm={setForm} onGenerate={generate} loading={loading} error={error} fo={fo} />
        ) : (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">

            {/* Controls */}
            <div className="w-full max-w-4xl space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Back */}
                <button onClick={() => { setDoc(null); setError(""); }}
                  className="px-3 py-1.5 text-xs border border-[#1A1040] text-[#8B7CF8] hover:text-white rounded-lg transition-colors">
                  ← New
                </button>
                {/* Format */}
                <div className="flex bg-[#0F0A1F] border border-[#1A1040] rounded-lg overflow-hidden">
                  {(["A4", "Letter"] as const).map(f => (
                    <button key={f} onClick={() => setFormat(f)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${format === f ? "bg-[#C9A84C] text-[#06040F]" : "text-[#8B7CF8] hover:text-white"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                {/* Theme */}
                <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A1040] text-[#8B7CF8] hover:text-white rounded-lg transition-colors">
                  {theme === "light" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                  {theme === "light" ? "Dark" : "Light"}
                </button>
                {/* Zoom */}
                <div className="flex items-center gap-1 bg-[#0F0A1F] border border-[#1A1040] rounded-lg px-2 py-1">
                  <button onClick={zoomOut} className="p-1 text-[#8B7CF8] hover:text-white"><ZoomOut className="w-3.5 h-3.5" /></button>
                  <span className="text-xs text-[#8B7CF8] w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={zoomIn} className="p-1 text-[#8B7CF8] hover:text-white"><ZoomIn className="w-3.5 h-3.5" /></button>
                  <button onClick={fitWidth} className="p-1 text-[#8B7CF8] hover:text-white ml-0.5"><Maximize2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Copy text */}
                <button onClick={copyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A1040] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/40 rounded-lg transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? fo.copied : "Copy Text"}
                </button>
                {/* Export (new window) */}
                <button onClick={openPrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#C9A84C] hover:bg-[#d4b660] text-[#06040F] font-bold rounded-lg transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Export PDF / Print
                </button>
                <p className="text-[10px] text-[#8B7CF8]/50">Opens in new tab → Print → Save as PDF</p>
              </div>
            </div>

            {/* Document preview */}
            <div className="w-full overflow-x-auto flex justify-center pb-6">
              <div style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                boxShadow: "0 12px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
                borderRadius: 3,
                marginBottom: `calc((${zoom} - 1) * ${format === "A4" ? "297mm" : "11in"})`,
                flexShrink: 0,
              }}>
                <DocumentRenderer doc={doc} theme={theme} format={format} docRef={docRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
