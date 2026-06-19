"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Copy, Check,
  ZoomIn, ZoomOut, Maximize2, Sun, Moon, Printer,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { OnePagerDocument } from "@/app/api/one-pager/route";

// ─── Form state ──────────────────────────────────────────────────────────────
interface FormState {
  startupName: string; tagline: string; problem: string;
  solution: string; targetMarket: string; businessModel: string;
  traction: string; team: string; amountRaising: string;
  useOfFunds: string; email: string; website: string;
}

// ─── Document renderer ───────────────────────────────────────────────────────
function AccentLine({ accent }: { accent: string }) {
  return <div style={{ height: 1, background: accent, margin: "6px 0", opacity: 0.6 }} />;
}

function SectionLabel({ children, accent }: { children: string; accent: string }) {
  return (
    <p style={{
      fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color: accent, marginBottom: 4,
    }}>
      {children}
    </p>
  );
}

function DocumentRenderer({
  doc,
  theme,
  format,
  docRef,
}: {
  doc: OnePagerDocument;
  theme: "light" | "dark";
  format: "A4" | "Letter";
  docRef?: React.Ref<HTMLDivElement>;
}) {
  const isLight = theme === "light";
  const bg      = isLight ? "#FFFFFF" : "#0F0A1F";
  const text     = isLight ? "#1A1A1A" : "#FFFFFF";
  const sub      = isLight ? "#555555" : "#A89BC2";
  const border   = isLight ? "#E5E5E5" : "rgba(124,58,237,0.2)";
  const accent   = "#C9A84C";
  const cardBg   = isLight ? "#F8F8F8" : "rgba(124,58,237,0.06)";

  const W = format === "A4" ? "210mm" : "8.5in";
  const H = format === "A4" ? "297mm" : "11in";
  const PAD = "14mm";

  return (
    <div
      ref={docRef}
      id="one-pager-doc"
      style={{
        width: W, minHeight: H, maxHeight: H,
        padding: PAD,
        background: bg, color: text,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: 10, lineHeight: 1.38,
        display: "flex", flexDirection: "column",
        overflow: "hidden", boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: accent, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 12 }}>
                {doc.company_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: text, letterSpacing: "-0.02em" }}>
              {doc.company_name}
            </span>
          </div>
          <p style={{ fontSize: 10, color: sub, fontStyle: "italic", marginLeft: 36 }}>
            {doc.tagline}
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: 9, color: sub, lineHeight: 1.6 }}>
          {doc.contact.email && <div>{doc.contact.email}</div>}
          {doc.contact.website && <div style={{ color: accent }}>{doc.contact.website}</div>}
        </div>
      </div>

      <div style={{ height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, marginBottom: 12 }} />

      {/* ── BODY: 2-column grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.55fr 1fr",
        gap: 14,
        flex: 1,
        minHeight: 0,
      }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>

          {/* Problem */}
          <div>
            <SectionLabel accent={accent}>Problem</SectionLabel>
            <AccentLine accent={accent} />
            <p style={{ fontSize: 10, color: text, lineHeight: 1.4 }}>{doc.problem}</p>
          </div>

          {/* Solution */}
          <div>
            <SectionLabel accent={accent}>Solution</SectionLabel>
            <AccentLine accent={accent} />
            <p style={{ fontSize: 10, color: text, lineHeight: 1.4 }}>{doc.solution}</p>
          </div>

          {/* Business Model */}
          <div>
            <SectionLabel accent={accent}>Business Model</SectionLabel>
            <AccentLine accent={accent} />
            <p style={{ fontSize: 10, color: text, lineHeight: 1.4 }}>{doc.business_model}</p>
          </div>

          {/* Market */}
          <div>
            <SectionLabel accent={accent}>Market Size</SectionLabel>
            <AccentLine accent={accent} />
            <p style={{ fontSize: 10, color: text, lineHeight: 1.4 }}>{doc.market_size}</p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>

          {/* Metrics 2×2 */}
          <div>
            <SectionLabel accent={accent}>Traction</SectionLabel>
            <AccentLine accent={accent} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {doc.metrics.map((m, i) => (
                <div key={i} style={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 6, padding: "6px 8px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: accent, lineHeight: 1.1 }}>
                    {m.number}
                  </div>
                  <div style={{ fontSize: 8, color: sub, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <SectionLabel accent={accent}>Team</SectionLabel>
            <AccentLine accent={accent} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {doc.team.map((member, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: accent + "22",
                    border: `1px solid ${accent}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: accent }}>
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: text }}>
                      {member.name} <span style={{ color: sub, fontWeight: 400 }}>· {member.role}</span>
                    </div>
                    <div style={{ fontSize: 8.5, color: sub }}>{member.bio}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ask */}
          <div style={{
            background: accent + "12",
            border: `1px solid ${accent}55`,
            borderRadius: 6, padding: "8px 10px",
            marginTop: "auto",
          }}>
            <SectionLabel accent={accent}>The Ask</SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 800, color: accent, marginBottom: 2 }}>
              {doc.ask_amount}
            </div>
            <p style={{ fontSize: 9, color: isLight ? "#444" : "#C4B5FD" }}>{doc.ask_use}</p>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: 10,
        paddingTop: 6,
        borderTop: `1px solid ${border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 8, color: sub,
      }}>
        <span>{doc.contact.website}</span>
        <span style={{ color: accent, fontWeight: 600, letterSpacing: "0.06em" }}>
          {doc.company_name.toUpperCase()} · CONFIDENTIAL
        </span>
        <span>{doc.contact.email}</span>
      </div>
    </div>
  );
}

// ─── Setup form ──────────────────────────────────────────────────────────────
function SetupForm({
  form, setForm, onGenerate, loading, error, fo,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onGenerate: () => void;
  loading: boolean;
  error: string;
  fo: Record<string, string>;
}) {
  const F = (key: keyof FormState, label: string, placeholder: string, multi = false) => (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8B7CF8", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </label>
      {multi ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={2}
          className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-lg px-3.5 py-2.5 text-white placeholder-white/25 resize-none outline-none transition-colors text-sm"
        />
      ) : (
        <input
          type="text"
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-lg px-3.5 py-2.5 text-white placeholder-white/25 outline-none transition-colors text-sm"
        />
      )}
    </div>
  );

  const valid = form.startupName.trim().length > 0 && form.problem.trim().length > 10;

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
          {F("email", "Contact Email", "hello@startup.com")}
          {F("website", "Website", "www.startup.com")}
        </div>
        {F("problem", fo.problem, "Founders waste 40% of their time on decisions without data.", true)}
        {F("solution", fo.solution, "AI platform that turns decisions into actionable intelligence.", true)}
        <div className="grid grid-cols-2 gap-4">
          {F("targetMarket", fo.targetMarket, "Early-stage founders globally")}
          {F("amountRaising", fo.amountRaising, "$500K")}
        </div>
        {F("businessModel", fo.businessModel, "Freemium + $29/mo Pro subscription")}
        {F("traction", fo.traction, "500+ users, 13 tools, 92% retention, $0 burn", true)}
        {F("team", fo.team, "Jane Doe, CEO — ex-Google PM. John Smith, CTO — built 3 startups.", true)}
        {F("useOfFunds", fo.useOfFunds, "60% product, 30% growth, 10% ops")}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={onGenerate}
          disabled={!valid || loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            valid && !loading
              ? "bg-[#C9A84C] hover:bg-[#d4b660] text-[#06040F] shadow-[0_0_20px_rgba(201,168,76,0.25)]"
              : "bg-[#1A1040] text-[#444] cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#06040F]/30 border-t-[#06040F] rounded-full animate-spin" />
              {fo.generating}
            </>
          ) : fo.generate}
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
  const [zoom, setZoom]       = useState(0.72);
  const [copied, setCopied]   = useState(false);

  const docRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/one-pager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Generation failed");
      setDoc(data as OnePagerDocument);
    } catch (err) {
      setError((err as Error).message || (fo.errorGenerate ?? "Generation failed. Try again."));
    } finally {
      setLoading(false);
    }
  }, [form, locale, fo]);

  // ── PDF via print ──
  const downloadPDF = useCallback(() => {
    if (!docRef.current) return;
    const orig = { theme, zoom };
    // Switch to light for print
    setTheme("light");
    setZoom(1);
    setTimeout(() => {
      window.print();
      setTheme(orig.theme as "light" | "dark");
      setZoom(orig.zoom);
    }, 200);
  }, [theme, zoom]);

  // ── PNG via canvas ──
  const downloadPNG = useCallback(() => {
    // No html2canvas installed — export via print dialog (user can save as PDF/image)
    window.print();
  }, []);

  // ── Copy text ──
  const copyText = useCallback(() => {
    if (!doc) return;
    const text = [
      `${doc.company_name}`,
      `${doc.tagline}`,
      `${doc.contact.email} | ${doc.contact.website}`,
      ``,
      `PROBLEM`,
      doc.problem,
      ``,
      `SOLUTION`,
      doc.solution,
      ``,
      `TRACTION`,
      doc.metrics.map(m => `${m.number} ${m.label}`).join("  ·  "),
      ``,
      `BUSINESS MODEL`,
      doc.business_model,
      ``,
      `MARKET`,
      doc.market_size,
      ``,
      `TEAM`,
      doc.team.map(m => `${m.name} (${m.role}) — ${m.bio}`).join("\n"),
      ``,
      `THE ASK`,
      `${doc.ask_amount} — ${doc.ask_use}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [doc]);

  // ── Zoom helpers ──
  const zoomIn  = () => setZoom(z => Math.min(z + 0.1, 2));
  const zoomOut = () => setZoom(z => Math.max(z - 0.1, 0.3));
  const fitWidth = () => setZoom(0.72);

  return (
    <>
      {/* Print-only stylesheet */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #one-pager-print-wrapper { display: block !important; }
          #one-pager-doc {
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            transform: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
          }
          @page { margin: 0; size: A4; }
        }
        #one-pager-print-wrapper { display: none; }
      `}</style>

      {/* Hidden print target */}
      {doc && (
        <div id="one-pager-print-wrapper">
          <DocumentRenderer doc={doc} theme="light" format={format} />
        </div>
      )}

      <div className="min-h-screen bg-[#06040F] p-5 lg:p-8">
        <AnimatePresence mode="wait">
          {!doc ? (
            <SetupForm
              key="setup"
              form={form}
              setForm={setForm}
              onGenerate={generate}
              loading={loading}
              error={error}
              fo={fo}
            />
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5"
            >
              {/* ── Controls bar ── */}
              <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3">
                {/* Left: back + format + theme */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => { setDoc(null); setError(""); }}
                    className="px-3 py-1.5 text-xs border border-[#1A1040] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/40 rounded-lg transition-colors"
                  >
                    ← {fo.generate?.replace("→", "").trim() ? "New" : "New"}
                  </button>

                  {/* Format toggle */}
                  <div className="flex bg-[#0F0A1F] border border-[#1A1040] rounded-lg overflow-hidden">
                    {(["A4", "Letter"] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          format === f ? "bg-[#C9A84C] text-[#06040F]" : "text-[#8B7CF8] hover:text-white"
                        }`}
                      >{f}</button>
                    ))}
                  </div>

                  {/* Theme toggle */}
                  <button
                    onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A1040] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/40 rounded-lg transition-colors"
                  >
                    {theme === "light" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                    {theme === "light" ? "Dark" : "Light"}
                  </button>
                </div>

                {/* Center: zoom */}
                <div className="flex items-center gap-1 bg-[#0F0A1F] border border-[#1A1040] rounded-lg px-2 py-1">
                  <button onClick={zoomOut} className="p-1 text-[#8B7CF8] hover:text-white transition-colors">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-[#8B7CF8] w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={zoomIn} className="p-1 text-[#8B7CF8] hover:text-white transition-colors">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={fitWidth} className="p-1 text-[#8B7CF8] hover:text-white transition-colors ml-1">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Right: export */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyText}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A1040] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/40 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? fo.copied : "Copy Text"}
                  </button>
                  <button
                    onClick={downloadPNG}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A1040] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/40 rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / PNG
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#C9A84C] hover:bg-[#d4b660] text-[#06040F] font-bold rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </div>

              {/* ── Document preview canvas ── */}
              <div
                className="w-full overflow-auto flex items-start justify-center"
                style={{ minHeight: "70vh" }}
              >
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top center",
                    boxShadow: "0 8px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
                    borderRadius: 4,
                    marginBottom: `calc((${zoom} - 1) * ${format === "A4" ? "297mm" : "11in"})`,
                  }}
                >
                  <DocumentRenderer
                    doc={doc}
                    theme={theme}
                    format={format}
                    docRef={docRef}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
