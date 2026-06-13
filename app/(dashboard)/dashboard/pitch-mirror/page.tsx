"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import {
  Video, Mic, StopCircle, ChevronRight, RotateCcw,
  Copy, Check, Zap, TrendingUp, Award, Clock,
  AlertTriangle, Flame, Lightbulb, BarChart2, Star,
} from "lucide-react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Mode = "video" | "audio";
type Step = "setup" | "recording" | "analyzing" | "results";

interface SetupData {
  startupName: string;
  audienceType: string;
  pitchType: string;
  targetDuration: number;
  mode: Mode;
}

interface FillerCounts {
  um: number; uh: number; like: number; so: number; actually: number;
}

interface PitchFeedback {
  overall_score: number;
  grade: string;
  bottom_line: string;
  ready_to_pitch: boolean;
  clarity_score: number;
  confidence_score: number;
  storytelling_score: number;
  persuasion_score: number;
  energy_score: number;
  structure_score: number;
  data_score: number;
  pacing_score: number;
  hook_score: number;
  founder_presence_score: number;
  body_language: {
    confidence: number;
    eye_contact: number;
    movement_quality: number;
    gesture_effectiveness: number;
    nervous_signals: string[];
  };
  investor_reaction: {
    angel_investor: string;
    vc_partner: string;
    accelerator_judge: string;
    customer: string;
  };
  what_worked: Array<{ quote: string; why_it_worked: string }>;
  critical_problems: Array<{ quote: string; why: string; rewrite: string }>;
  missing_completely: string[];
  filler_words: FillerCounts;
  best_moment: string;
  worst_moment: string;
  killer_rewrite: { what_you_said: string; better_version: string };
  before_next_pitch: string[];
  investor_readiness: "NOT_READY" | "CLOSE" | "READY";
}

// ─── Speech recognition shim ──────────────────────────────────────────────────

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [j: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResult[];
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function countFillers(text: string): FillerCounts {
  const lower = text.toLowerCase();
  const count = (word: string) => {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    return (lower.match(re) ?? []).length;
  };
  return { um: count("um"), uh: count("uh"), like: count("like"), so: count("so"), actually: count("actually") };
}

function wordsPerMin(text: string, seconds: number): number {
  if (seconds < 1) return 0;
  return Math.round((text.trim().split(/\s+/).length / seconds) * 60);
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

function scoreColor(s: number) {
  if (s >= 90) return "#C9A84C";
  if (s >= 75) return "#7C3AED";
  if (s >= 60) return "#EAB308";
  return "#EF4444";
}

function gradeColor(g: string) {
  if (g === "A") return "text-[#C9A84C]";
  if (g === "B") return "text-[#7C3AED]";
  if (g === "C") return "text-yellow-400";
  return "text-red-400";
}

// ─── Circular gauge ───────────────────────────────────────────────────────────

function CircleGauge({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A1040" strokeWidth={size * 0.07} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={size * 0.07}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-black text-white" style={{ fontSize: size * 0.2 }}>{score}</span>
        </div>
      </div>
      {label && <span className="text-[#8B7CF8] text-xs text-center">{label}</span>}
    </div>
  );
}

// ─── Score mini card ──────────────────────────────────────────────────────────

function ScoreCard({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  return (
    <div className="p-4 rounded-xl border border-[#1A1040] bg-[#0F0A1F] flex flex-col items-center gap-2">
      <CircleGauge score={score} size={72} />
      <span className="text-[#8B7CF8] text-xs font-medium text-center">{label}</span>
    </div>
  );
}

// ─── Live metric bar ──────────────────────────────────────────────────────────

function LiveBar({ label, value, max = 100, color = "#7C3AED" }: { label: string; value: number; max?: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#8B7CF8]">{label}</span>
        <span className="text-white font-bold">{value}</span>
      </div>
      <div className="h-1.5 bg-[#1A1040] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

// ─── Coaching tip card ────────────────────────────────────────────────────────

const TIP_COLORS = {
  green: "border-green-500/40 bg-green-500/10 text-green-400",
  yellow: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  red: "border-red-500/40 bg-red-500/10 text-red-400",
  purple: "border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#8B7CF8]",
};

function CoachTip({ msg, variant }: { msg: string; variant: keyof typeof TIP_COLORS }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`p-3 rounded-xl border text-xs leading-relaxed ${TIP_COLORS[variant]}`}
    >
      {msg}
    </motion.div>
  );
}

// ─── Audio waveform ───────────────────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 24 });
  return (
    <div className="flex items-center gap-1 h-16 justify-center">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full"
          style={{ background: i % 3 === 0 ? "#C9A84C" : "#7C3AED" }}
          animate={active ? {
            height: ["8px", `${16 + Math.random() * 40}px`, "8px"],
          } : { height: "8px" }}
          transition={{ duration: 0.5 + Math.random() * 0.5, repeat: active ? Infinity : 0, delay: i * 0.04 }}
        />
      ))}
    </div>
  );
}

// ─── Investor readiness badge ─────────────────────────────────────────────────

function ReadinessBadge({ status, tl }: { status: string; tl: Record<string, string> }) {
  const cfg = {
    READY:     { color: "bg-green-500/20 border-green-500/50 text-green-400",  label: tl.ready },
    CLOSE:     { color: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400", label: tl.close },
    NOT_READY: { color: "bg-red-500/20 border-red-500/50 text-red-400",        label: tl.notReady },
  }[status] ?? { color: "bg-[#7C3AED]/20 border-[#7C3AED]/50 text-[#8B7CF8]", label: status };
  return (
    <span className={`px-4 py-1.5 rounded-full border text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
  );
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({ tl, onStart }: { tl: Record<string, string>; onStart: (d: SetupData) => void }) {
  const [form, setForm] = useState<SetupData>({
    startupName: "",
    audienceType: "angel",
    pitchType: "fundraising",
    targetDuration: 3,
    mode: "video",
  });
  const [error, setError] = useState("");

  function submit() {
    if (!form.startupName.trim()) { setError("Please enter your startup name."); return; }
    onStart(form);
  }

  const audiences = tl.audiences ? JSON.parse(tl.audiences as unknown as string) :
    { angel: "Angel Investor", vc: "VC Fund", accelerator: "Accelerator", competition: "Startup Competition", customer: "Customer", university: "University Program" };

  const pitchTypes = tl.pitchTypes ? JSON.parse(tl.pitchTypes as unknown as string) :
    { fundraising: "Fundraising", sales: "Sales", demo: "Product Demo", competition: "Competition Pitch", elevator: "Elevator Pitch" };

  const durations = [
    { val: 1, label: "1 min" },
    { val: 3, label: "3 min" },
    { val: 5, label: "5 min" },
    { val: 10, label: "10 min" },
  ];

  const selectCls = "w-full h-10 px-3 rounded-xl text-sm text-white outline-none transition-colors bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]";
  const labelCls = "block text-xs font-medium text-[#8B7CF8] mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{tl.title}</h1>
          <p className="text-[#8B7CF8] text-sm">{tl.subtitle}</p>
        </div>

        <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 space-y-5 shadow-[0_0_40px_rgba(124,58,237,0.1)]">
          {/* Startup name */}
          <div>
            <label className={labelCls}>{tl.startupName}</label>
            <input
              value={form.startupName}
              onChange={(e) => setForm({ ...form, startupName: e.target.value })}
              placeholder="e.g. Quantum"
              className="w-full h-10 px-3 rounded-xl text-sm text-white placeholder-white/30 outline-none bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED] transition-colors"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          {/* Audience */}
          <div>
            <label className={labelCls}>{tl.audience}</label>
            <select value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })} className={selectCls}>
              {Object.entries(audiences as Record<string, string>).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Pitch type */}
          <div>
            <label className={labelCls}>{tl.pitchType}</label>
            <select value={form.pitchType} onChange={(e) => setForm({ ...form, pitchType: e.target.value })} className={selectCls}>
              {Object.entries(pitchTypes as Record<string, string>).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className={labelCls}>{tl.duration}</label>
            <div className="flex gap-2">
              {durations.map((d) => (
                <button
                  key={d.val}
                  onClick={() => setForm({ ...form, targetDuration: d.val })}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${
                    form.targetDuration === d.val
                      ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                      : "bg-[#06040F] border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className={labelCls}>{tl.mode}</label>
            <div className="grid grid-cols-2 gap-3">
              {(["video", "audio"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, mode: m })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.mode === m
                      ? "border-[#7C3AED] bg-[#7C3AED]/10"
                      : "border-[#1A1040] bg-[#06040F] hover:border-[#7C3AED]/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {m === "video" ? <Video className="w-4 h-4 text-[#7C3AED]" /> : <Mic className="w-4 h-4 text-[#C9A84C]" />}
                    <span className="text-white text-sm font-semibold">
                      {m === "video" ? tl.modeVideo : tl.modeAudio}
                    </span>
                  </div>
                  <p className="text-[#8B7CF8] text-xs">
                    {m === "video" ? tl.modeVideoDesc : tl.modeAudioDesc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submit}
            className="w-full h-12 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-black rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {tl.start} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Recording screen ─────────────────────────────────────────────────────────

interface RecordingProps {
  setup: SetupData;
  tl: Record<string, string>;
  onDone: (transcript: string, duration: number, fillers: FillerCounts, wpm: number) => void;
}

function RecordingScreen({ setup, tl, onDone }: RecordingProps) {
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [browserOk, setBrowserOk] = useState(true);
  const [permissionErr, setPermissionErr] = useState("");
  const [liveMetrics, setLiveMetrics] = useState({ clarity: 60, confidence: 60, engagement: 60 });
  const [tips, setTips] = useState<Array<{ id: number; msg: string; variant: keyof typeof TIP_COLORS }>>([]);
  const [tipId, setTipId] = useState(0);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const transcriptRef = useRef("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const SRClass = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

  useEffect(() => {
    if (!SRClass) { setBrowserOk(false); return; }
    startSession();
    return () => { stopSession(false); };
  }, []); // eslint-disable-line

  async function startSession() {
    // Camera
    if (setup.mode === "video") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      } catch {
        setPermissionErr(tl.cameraPermissionDenied);
      }
    }

    if (!SRClass) return;

    try {
      const rec = new SRClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      let finalText = "";

      rec.onresult = (e: ISpeechRecognitionEvent) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) { finalText += e.results[i][0].transcript + " "; }
          else { interim = e.results[i][0].transcript; }
        }
        const full = finalText + interim;
        transcriptRef.current = full;
        setTranscript(full);
      };

      rec.onerror = (e: ISpeechRecognitionErrorEvent) => {
        if (e.error === "not-allowed") setPermissionErr(tl.permissionDenied);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed((p) => p + 1);
        // Update live metrics every 5s
        if (elapsedRef.current % 5 === 0) {
          const wc = transcriptRef.current.trim().split(/\s+/).length;
          const wpm = wordsPerMin(transcriptRef.current, elapsedRef.current);
          setLiveMetrics({
            clarity: Math.min(95, 40 + Math.min(wc, 50)),
            confidence: Math.min(95, 45 + (wpm > 100 && wpm < 180 ? 30 : 10)),
            engagement: Math.min(95, 50 + Math.min(wc / 2, 35)),
          });
        }
        // Coaching tips every 20s
        if (elapsedRef.current % 20 === 0 && elapsedRef.current > 0) {
          addTip();
        }
      }, 1000);
    } catch {
      setPermissionErr(tl.permissionDenied);
    }
  }

  const TIPS_POOL: Array<{ msg: string; variant: keyof typeof TIP_COLORS }> = [
    { msg: "Strong delivery. Keep that energy.", variant: "green" },
    { msg: "Slow down slightly — let key points breathe.", variant: "yellow" },
    { msg: "Investors want numbers. Add a metric here.", variant: "purple" },
    { msg: "Avoid apologetic language. Own your conviction.", variant: "red" },
    { msg: "Great storytelling momentum.", variant: "green" },
    { msg: "Connect the problem to YOUR personal story.", variant: "purple" },
    { msg: "You're losing pace. Shorten your sentences.", variant: "yellow" },
    { msg: "Speak as if the deal is already done.", variant: "green" },
  ];

  function addTip() {
    const tip = TIPS_POOL[Math.floor(Math.random() * TIPS_POOL.length)];
    const id = tipId + 1;
    setTipId(id);
    setTips((prev) => [...prev.slice(-1), { ...tip, id }]);
  }

  function stopSession(save = true) {
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    if (save) {
      const fillers = countFillers(transcriptRef.current);
      const wpm = wordsPerMin(transcriptRef.current, elapsedRef.current);
      onDone(transcriptRef.current, elapsedRef.current, fillers, wpm);
    }
  }

  const fillerCount = Object.values(countFillers(transcript)).reduce((a, b) => a + b, 0);
  const wpm = wordsPerMin(transcript, elapsed);
  const pace = wpm < 90 ? tl.paceToSlow : wpm > 170 ? tl.paceFast : tl.paceStrong;
  const paceColor = wpm < 90 || wpm > 170 ? "text-yellow-400" : "text-green-400";

  if (!browserOk) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">{tl.browserUnsupported}</p>
          <Link href="/dashboard" className="text-[#8B7CF8] text-sm hover:text-white">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06040F] p-4 lg:p-8">
      {permissionErr && (
        <div className="mb-4 p-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {permissionErr}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 h-full max-w-6xl mx-auto">
        {/* Left — camera / waveform + transcript */}
        <div className="flex-1 space-y-4">
          {/* Preview */}
          <div className="relative bg-[#0F0A1F] border border-[#1A1040] rounded-2xl overflow-hidden" style={{ minHeight: 280 }}>
            {setup.mode === "video" ? (
              <video ref={videoRef} muted className="w-full h-full object-cover" style={{ minHeight: 280 }} />
            ) : (
              <div className="flex items-center justify-center" style={{ minHeight: 280 }}>
                <Waveform active={isRecording} />
              </div>
            )}
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90">
                <motion.div
                  className="w-2 h-2 rounded-full bg-white"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-white text-xs font-bold">{tl.recording}</span>
              </div>
            )}
            {/* Timer */}
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-mono font-bold">
              {fmtTime(elapsed)}
            </div>
          </div>

          {/* Transcript */}
          <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-4" style={{ minHeight: 100 }}>
            <p className="text-[#8B7CF8] text-xs font-semibold mb-2 uppercase tracking-wider">{tl.transcriptLabel}</p>
            <p className="text-white text-sm leading-relaxed">
              {transcript || <span className="text-white/30">{tl.waitingToSpeak}</span>}
            </p>
          </div>

          {/* Stop button */}
          <button
            onClick={() => stopSession(true)}
            disabled={!isRecording || transcript.trim().length < 20}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B85C] disabled:opacity-40 text-[#06040F] font-black rounded-xl transition-colors text-sm"
          >
            <StopCircle className="w-5 h-5" /> {tl.stopRecording}
          </button>
        </div>

        {/* Right — live metrics */}
        <div className="w-full lg:w-72 space-y-4">
          <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-4">
            <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5" /> {tl.liveCoaching}
            </p>
            <div className="space-y-3">
              <LiveBar label={tl.liveClarityScore} value={liveMetrics.clarity} color="#7C3AED" />
              <LiveBar label={tl.liveConfidenceScore} value={liveMetrics.confidence} color="#C9A84C" />
              <LiveBar label={tl.liveEngagement} value={liveMetrics.engagement} color="#22C55E" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-[#06040F] text-center">
                <p className="text-[#8B7CF8]">{tl.livePace}</p>
                <p className={`font-bold ${paceColor}`}>{pace}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#06040F] text-center">
                <p className="text-[#8B7CF8]">{tl.liveFillers}</p>
                <p className={`font-bold ${fillerCount > 5 ? "text-red-400" : "text-green-400"}`}>{fillerCount}</p>
              </div>
            </div>
          </div>

          {/* Coaching tips */}
          <div className="space-y-2">
            <AnimatePresence>
              {tips.map((tip) => (
                <CoachTip key={tip.id} msg={tip.msg} variant={tip.variant} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analyzing screen ─────────────────────────────────────────────────────────

function AnalyzingScreen({ tl }: { tl: Record<string, string> }) {
  const steps = [tl.clarity, tl.confidence, tl.storytelling, tl.energy, tl.persuasion];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone((p) => Math.min(p + 1, steps.length)), 1200);
    return () => clearInterval(t);
  }, []); // eslint-disable-line
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
        <div className="w-20 h-20 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Listening for weak moments…</h2>
        <p className="text-[#8B7CF8] text-sm mb-8">{tl.analyzingDesc || "Scoring your delivery and finding what landed."}</p>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-colors ${i < done ? "text-green-400" : "text-[#8B7CF8]/40"}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${i < done ? "border-green-500 bg-green-500/20" : "border-[#1A1040]"}`}>
                {i < done && <Check className="w-2.5 h-2.5" />}
              </div>
              {s}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  feedback, setup, tl, onRetry,
}: {
  feedback: PitchFeedback;
  setup: SetupData;
  tl: Record<string, string>;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyShare() {
    const text = `Pitch Score: ${feedback.overall_score}/100 (${feedback.grade})\n${feedback.bottom_line}\nqsmart.tech`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const scoreItems = [
    { label: tl.clarity, score: feedback.clarity_score },
    { label: tl.confidence, score: feedback.confidence_score },
    { label: tl.storytelling, score: feedback.storytelling_score },
    { label: tl.energy, score: feedback.energy_score },
    { label: tl.persuasion, score: feedback.persuasion_score },
    { label: tl.structure, score: feedback.structure_score },
  ];

  const investorItems = [
    { key: "angel_investor", label: tl.angelInvestor, text: feedback.investor_reaction?.angel_investor },
    { key: "vc_partner", label: tl.vcPartner, text: feedback.investor_reaction?.vc_partner },
    { key: "accelerator_judge", label: tl.acceleratorJudge, text: feedback.investor_reaction?.accelerator_judge },
    { key: "customer", label: tl.customer, text: feedback.investor_reaction?.customer },
  ];

  const score = feedback.overall_score;
  const bannerClass = score >= 75
    ? "border-green-500/50 bg-green-500/10 text-green-400"
    : score >= 60
    ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
    : "border-red-500/50 bg-red-500/10 text-red-400";
  const bannerIcon = score >= 75
    ? <Star className="w-5 h-5 flex-shrink-0" />
    : score >= 60
    ? <AlertTriangle className="w-5 h-5 flex-shrink-0" />
    : <AlertTriangle className="w-5 h-5 flex-shrink-0" />;

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Bottom Line banner — top of page */}
        {feedback.bottom_line && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 p-5 rounded-2xl border mb-8 ${bannerClass}`}
          >
            {bannerIcon}
            <p className="text-lg font-bold leading-snug">{feedback.bottom_line}</p>
          </motion.div>
        )}

        {/* Overall score */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="inline-block"
          >
            <CircleGauge score={feedback.overall_score} size={160} />
          </motion.div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className={`text-5xl font-black ${gradeColor(feedback.grade)}`}>{feedback.grade}</span>
            <ReadinessBadge status={feedback.investor_readiness} tl={tl} />
          </div>
          <p className="text-[#8B7CF8] text-sm mt-2">{setup.startupName} · {setup.pitchType} · {tl[setup.audienceType] ?? setup.audienceType}</p>
        </div>

        {/* 6 score cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {scoreItems.map((s) => <ScoreCard key={s.label} {...s} />)}
        </div>

        {/* Best / Worst */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl border border-green-500/30 bg-green-500/5">
            <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5" /> {tl.bestMoment}
            </p>
            <p className="text-white text-sm leading-relaxed">{feedback.best_moment}</p>
          </div>
          <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/5">
            <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {tl.worstMoment}
            </p>
            <p className="text-white text-sm leading-relaxed">{feedback.worst_moment}</p>
          </div>
        </div>

        {/* Critical problems */}
        {feedback.critical_problems?.length > 0 && (
          <Section title="Critical Problems" icon={<AlertTriangle className="w-4 h-4 text-red-400" />} color="text-red-400">
            <div className="space-y-4">
              {feedback.critical_problems.map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-red-500/30 bg-red-500/8 space-y-2">
                  <p className="text-red-300/80 text-sm italic">"{item.quote}"</p>
                  <p className="text-white/60 text-xs">{item.why}</p>
                  <div className="pt-2 border-t border-red-500/20">
                    <p className="text-[#C9A84C] text-xs font-semibold mb-1">→ Say this instead</p>
                    <p className="text-[#C9A84C]/90 text-sm">{item.rewrite}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Missing completely */}
        {feedback.missing_completely?.length > 0 && (
          <Section title="Missing Completely" icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />} color="text-yellow-400">
            <div className="flex flex-wrap gap-2">
              {feedback.missing_completely.map((item, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm">{item}</span>
              ))}
            </div>
          </Section>
        )}

        {/* What worked */}
        {feedback.what_worked?.length > 0 && (
          <Section title="What Worked" icon={<Star className="w-4 h-4 text-[#C9A84C]" />} color="text-[#C9A84C]">
            <div className="space-y-3">
              {feedback.what_worked.map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                  <p className="text-green-300 text-sm font-medium italic mb-1">"{item.quote}"</p>
                  <p className="text-white/70 text-xs leading-relaxed">{item.why_it_worked}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Killer rewrite */}
        {feedback.killer_rewrite?.what_you_said && (
          <Section title={tl.killerRewrite ?? "Killer Rewrite"} icon={<Zap className="w-4 h-4 text-[#C9A84C]" />} color="text-[#C9A84C]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <p className="text-red-400 text-xs font-semibold mb-2">{tl.whatYouSaid ?? "What You Said"}</p>
                <p className="text-white/70 text-sm italic">"{feedback.killer_rewrite.what_you_said}"</p>
              </div>
              <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                <p className="text-green-400 text-xs font-semibold mb-2">{tl.betterVersion ?? "Better Version"}</p>
                <p className="text-green-300 text-sm">"{feedback.killer_rewrite.better_version}"</p>
              </div>
            </div>
          </Section>
        )}

        {/* Investor reactions */}
        <Section title={tl.investorReactions ?? "Investor Reactions"} icon={<TrendingUp className="w-4 h-4 text-[#7C3AED]" />} color="text-[#7C3AED]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {investorItems.map((inv) => inv.text && (
              <div key={inv.key} className="p-4 rounded-xl border border-[#1A1040] bg-[#06040F]">
                <p className="text-[#C9A84C] text-xs font-semibold mb-2">{inv.label}</p>
                <p className="text-white/80 text-sm leading-relaxed">"{inv.text}"</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Body language */}
        {setup.mode === "video" && feedback.body_language && (
          <Section title={tl.bodyLanguage ?? "Body Language"} icon={<BarChart2 className="w-4 h-4 text-[#7C3AED]" />} color="text-[#7C3AED]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <ScoreCard label={tl.confidence ?? "Confidence"} score={feedback.body_language.confidence} />
              <ScoreCard label={tl.eyeContact ?? "Eye Contact"} score={feedback.body_language.eye_contact} />
              <ScoreCard label={tl.movement ?? "Movement"} score={feedback.body_language.movement_quality} />
              <ScoreCard label={tl.gestures ?? "Gestures"} score={feedback.body_language.gesture_effectiveness} />
            </div>
            {feedback.body_language.nervous_signals?.length > 0 && (
              <div>
                <p className="text-[#8B7CF8] text-xs font-semibold mb-2">{tl.nervousSignals ?? "Nervous Signals"}</p>
                <div className="flex flex-wrap gap-2">
                  {feedback.body_language.nervous_signals.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Filler words */}
        <Section title={tl.fillerWords ?? "Filler Words"} icon={<Clock className="w-4 h-4 text-[#8B7CF8]" />} color="text-[#8B7CF8]">
          <div className="flex flex-wrap gap-3">
            {Object.entries(feedback.filler_words ?? {}).map(([word, cnt]) => (
              <div key={word} className={`px-4 py-2 rounded-xl border text-sm font-bold ${
                (cnt as number) > 3 ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-[#1A1040] bg-[#06040F] text-[#8B7CF8]"
              }`}>
                "{word}" × {cnt as number}
              </div>
            ))}
          </div>
        </Section>

        {/* Before next pitch */}
        <Section title="Before Your Next Pitch" icon={<Award className="w-4 h-4 text-[#C9A84C]" />} color="text-[#C9A84C]">
          <ol className="space-y-3">
            {(feedback.before_next_pitch ?? []).map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C] text-xs font-black flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-white text-sm leading-relaxed">{item}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={copyShare}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Locked in." : tl.shareCard}
          </button>
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl transition-colors text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" /> {tl.tryAgain}
          </button>
        </div>

        {/* Previous sessions link */}
        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-[#8B7CF8]/50 text-xs hover:text-[#8B7CF8] transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-5 mb-4 shadow-[0_0_20px_rgba(124,58,237,0.08)]">
      <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${color}`}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PitchMirrorPage() {
  const { t, locale } = useLanguage();
  const pm = ((t.features as unknown) as Record<string, Record<string, string>>).pitchMirror ?? {};

  // Parse nested objects that got stringified in translations
  const tl: Record<string, string> = { ...pm };
  if (typeof pm.audiences === "object") tl.audiences = JSON.stringify(pm.audiences);
  if (typeof pm.pitchTypes === "object") tl.pitchTypes = JSON.stringify(pm.pitchTypes);
  if (typeof pm.durations === "object") tl.durations = JSON.stringify(pm.durations);

  const [step, setStep] = useState<Step>("setup");
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [fillers, setFillers] = useState<FillerCounts>({ um: 0, uh: 0, like: 0, so: 0, actually: 0 });
  const [wpm, setWpm] = useState(0);
  const [feedback, setFeedback] = useState<PitchFeedback | null>(null);
  const [apiError, setApiError] = useState("");

  const handleStart = useCallback((data: SetupData) => {
    setSetup(data);
    setStep("recording");
  }, []);

  const handleRecordingDone = useCallback(async (
    t: string, d: number, f: FillerCounts, w: number
  ) => {
    setTranscript(t);
    setDuration(d);
    setFillers(f);
    setWpm(w);
    setStep("analyzing");

    try {
      const res = await fetch("/api/pitch-mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupName: setup?.startupName,
          audienceType: setup?.audienceType,
          pitchType: setup?.pitchType,
          targetDuration: setup?.targetDuration,
          actualDuration: d,
          mode: setup?.mode,
          transcript: t,
          fillerWords: f,
          wordsPerMinute: w,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? "Analysis didn't land. Check your connection and try again."); setStep("setup"); return; }
      setFeedback(data.feedback);
      setStep("results");
    } catch {
      setApiError("Quantum hit a snag. Try again — we'll get it right.");
      setStep("setup");
    }
  }, [setup, locale]);

  const handleRetry = useCallback(() => {
    setStep("setup");
    setFeedback(null);
    setTranscript("");
    setApiError("");
  }, []);

  return (
    <div className="min-h-screen bg-[#06040F]">
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {apiError && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border border-red-500/40 bg-[#0F0A1F] text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {apiError}
              </div>
            )}
            <SetupScreen tl={tl} onStart={handleStart} />
          </motion.div>
        )}
        {step === "recording" && setup && (
          <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RecordingScreen setup={setup} tl={tl} onDone={handleRecordingDone} />
          </motion.div>
        )}
        {step === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnalyzingScreen tl={tl} />
          </motion.div>
        )}
        {step === "results" && feedback && setup && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultsScreen feedback={feedback} setup={setup} tl={tl} onRetry={handleRetry} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
