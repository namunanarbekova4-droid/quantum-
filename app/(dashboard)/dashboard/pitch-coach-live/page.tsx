"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import {
  Mic, MicOff, StopCircle, RotateCcw, Copy, Check,
  AlertTriangle, Flame, Star, Zap, TrendingUp, Award,
  Clock, BarChart2, ChevronRight, History, Pause, Play,
  XCircle, CheckCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "setup" | "recording" | "analyzing" | "results";

interface SetupData {
  startupName: string;
  startupDescription: string;
  audienceType: string;
  targetDuration: number;
}

interface FillerCounts {
  um: number; uh: number; like: number; so: number; you_know: number;
}

interface Analysis {
  overall_score: number;
  grade: string;
  bottom_line: string;
  ready_to_pitch: boolean;
  what_worked: Array<{ moment: string; why: string }>;
  critical_problems: Array<{
    problem_name: string;
    severity: "HIGH" | "MEDIUM";
    what_you_said: string;
    why_its_weak: string;
    rewritten_version: string;
  }>;
  missing_completely: string[];
  filler_analysis: {
    total_count: number;
    per_minute: number;
    breakdown: FillerCounts;
    verdict: string;
  };
  pacing: {
    words_per_minute: number;
    verdict: "TOO_SLOW" | "PERFECT" | "TOO_FAST";
    slowest_section: string;
    fastest_section: string;
  };
  investor_reaction: string;
  the_killer_rewrite: string;
  before_next_pitch: string[];
}

interface HistorySession {
  id: string;
  startupName: string;
  audienceType: string;
  overallScore: number;
  grade: string;
  createdAt: string;
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
interface ISpeechRecognitionAlternative { transcript: string; confidence: number; }
interface ISpeechRecognitionResult {
  isFinal: boolean; length: number;
  [j: number]: ISpeechRecognitionAlternative;
}
interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResult[];
}
interface ISpeechRecognitionErrorEvent { error: string; }

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const FILLER_WORDS = ["um", "uh", "like", "so", "you know"];

function countFillers(text: string): FillerCounts {
  const lower = text.toLowerCase();
  const c = (w: string) => (lower.match(new RegExp(`\\b${w.replace(" ", "\\s+")}\\b`, "gi")) ?? []).length;
  return { um: c("um"), uh: c("uh"), like: c("like"), so: c("so"), you_know: c("you know") };
}

function totalFillers(f: FillerCounts) {
  return f.um + f.uh + f.like + f.so + f.you_know;
}

function calcWPM(text: string, seconds: number): number {
  if (seconds < 1) return 0;
  return Math.round((text.trim().split(/\s+/).filter(Boolean).length / seconds) * 60);
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

function scoreColor(s: number) {
  if (s >= 70) return "#22C55E";
  if (s >= 55) return "#EAB308";
  return "#EF4444";
}

function gradeColor(g: string) {
  if (g === "A") return "text-green-400";
  if (g === "B") return "text-[#C9A84C]";
  if (g === "C") return "text-yellow-400";
  return "text-red-400";
}

function highlightFillers(text: string): React.ReactNode[] {
  const STRONG = ["revenue", "growth", "market", "customer", "million", "billion", "traction", "raise", "team", "solution", "problem"];
  const tokens = text.split(/(\s+)/);
  return tokens.map((token, i) => {
    const clean = token.toLowerCase().replace(/[^a-z\s]/g, "");
    if (FILLER_WORDS.some(f => clean === f || clean === f.replace(" ", ""))) {
      return <span key={i} className="text-red-400 font-semibold">{token}</span>;
    }
    if (STRONG.some(s => clean.includes(s))) {
      return <span key={i} className="text-[#C9A84C] font-semibold">{token}</span>;
    }
    return <span key={i}>{token}</span>;
  });
}

// ─── Quantum Atom ─────────────────────────────────────────────────────────────

function QuantumAtom() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-6">
      <div className="absolute inset-0 rounded-full logo-glow" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 rounded-full border border-[#C9A84C]/20 logo-orbit-1" />
      <div className="absolute inset-2 rounded-full border border-[#7C3AED]/20 logo-orbit-2" />
      <div className="absolute inset-4 rounded-full border border-[#8B7CF8]/20 logo-orbit-3" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-[#C9A84C] rounded-full flex items-center justify-center font-mono font-black text-[#06040F] text-sm shadow-[0_0_20px_rgba(201,168,76,0.5)]">
          Q
        </div>
      </div>
    </div>
  );
}

// ─── Circular gauge ───────────────────────────────────────────────────────────

function CircleGauge({ score, size = 140 }: { score: number; size?: number }) {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A1040" strokeWidth={size * 0.08} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-black text-white" style={{ fontSize: size * 0.22 }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, color, children }: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-5 mb-4">
      <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${color}`}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({ title, value, sub, color }: {
  title: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-[#06040F] border border-[#1A1040] rounded-xl p-3">
      <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider mb-1">{title}</p>
      <p className={`font-black text-lg leading-none ${color}`}>{value}</p>
      {sub && <p className="text-white/40 text-[10px] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({ data }: { data: number[] }) {
  const bars = data.length > 0 ? data : Array.from({ length: 20 }, () => 8);
  return (
    <div className="flex items-end gap-[3px] h-16 justify-center">
      {bars.slice(0, 20).map((v, i) => (
        <motion.div
          key={i}
          className="rounded-full flex-shrink-0"
          style={{
            background: i % 3 === 0 ? "#C9A84C" : "#7C3AED",
            width: "6px",
            minHeight: "4px",
          }}
          animate={{ height: `${Math.max(4, (v / 255) * 56)}px` }}
          transition={{ duration: 0.08, ease: "linear" }}
        />
      ))}
    </div>
  );
}

// ─── Coach Tip ────────────────────────────────────────────────────────────────

const TIP_STYLES = {
  green:  "border-green-500/40 bg-green-500/10 text-green-300",
  yellow: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  red:    "border-red-500/40 bg-red-500/10 text-red-300",
  purple: "border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#8B7CF8]",
  gold:   "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C]",
};

type TipVariant = keyof typeof TIP_STYLES;

interface CoachTipData { id: number; msg: string; variant: TipVariant; }

function CoachTipCard({ tip }: { tip: CoachTipData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className={`p-3 rounded-xl border text-xs leading-relaxed ${TIP_STYLES[tip.variant]}`}
    >
      {tip.msg}
    </motion.div>
  );
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onStart }: { onStart: (d: SetupData) => void }) {
  const [form, setForm] = useState<SetupData>({
    startupName: "",
    startupDescription: "",
    audienceType: "angel",
    targetDuration: 3,
  });
  const [error, setError] = useState("");
  const [permError, setPermError] = useState("");
  const [requesting, setRequesting] = useState(false);

  const AUDIENCES = [
    { value: "angel", label: "Angel Investor" },
    { value: "vc", label: "VC Fund" },
    { value: "competition", label: "Startup Competition" },
    { value: "accelerator", label: "Accelerator (YC, nFactorial, etc)" },
    { value: "customer", label: "Potential Customer" },
  ];

  async function handleStart() {
    if (!form.startupName.trim()) { setError("Please enter your startup name."); return; }
    if (!form.startupDescription.trim()) { setError("Please describe what your startup does."); return; }
    setError("");
    setRequesting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      onStart(form);
    } catch {
      setPermError("Microphone access is required. Please allow microphone in browser settings.");
    }
    setRequesting(false);
  }

  const SRAvailable = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED] transition-colors";
  const labelCls = "block text-xs font-medium text-[#8B7CF8] mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#06040F]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <QuantumAtom />
          <h1 className="text-3xl font-black text-white mb-2">Pitch Coach Live</h1>
          <p className="text-[#8B7CF8] text-sm">Speak your pitch. Get coached in real time.</p>
        </div>

        {!SRAvailable && (
          <div className="mb-5 p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-sm flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Your browser doesn&apos;t support live speech recognition.</p>
              <p className="text-yellow-300/70 text-xs">Please use Chrome, Edge, or Safari on desktop for the best experience.</p>
            </div>
          </div>
        )}

        <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 space-y-5 shadow-[0_0_40px_rgba(124,58,237,0.1)]">
          <div>
            <label className={labelCls}>Your startup name</label>
            <input
              value={form.startupName}
              onChange={e => setForm({ ...form, startupName: e.target.value })}
              placeholder="e.g. Quantum"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>What does your startup do?</label>
            <textarea
              value={form.startupDescription}
              onChange={e => setForm({ ...form, startupDescription: e.target.value })}
              placeholder="Describe in 2-3 sentences"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Who are you pitching to?</label>
            <select
              value={form.audienceType}
              onChange={e => setForm({ ...form, audienceType: e.target.value })}
              className={inputCls}
            >
              {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Pitch duration</label>
            <div className="flex gap-2">
              {[1, 3, 5].map(d => (
                <button
                  key={d}
                  onClick={() => setForm({ ...form, targetDuration: d })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors border ${
                    form.targetDuration === d
                      ? "bg-[#C9A84C] border-[#C9A84C] text-[#06040F]"
                      : "bg-[#06040F] border-[#1A1040] text-[#8B7CF8] hover:border-[#C9A84C]/40"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {permError && (
            <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs">
              {permError}
              <button onClick={() => setPermError("")} className="ml-2 underline">Retry</button>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={requesting}
            className="w-full h-12 bg-[#C9A84C] hover:bg-[#D4B85C] disabled:opacity-60 text-[#06040F] font-black rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {requesting ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-[#06040F]/40 border-t-[#06040F] rounded-full animate-spin" /> Requesting mic...</span>
            ) : (
              <><Mic className="w-4 h-4" /> Start Session <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Recording screen ─────────────────────────────────────────────────────────

interface RecordingProps {
  setup: SetupData;
  onDone: (transcript: string, duration: number, fillers: FillerCounts, wpm: number) => void;
  onBack: () => void;
}

function RecordingScreen({ setup, onDone, onBack }: RecordingProps) {
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(Array(20).fill(8));
  const [fillers, setFillers] = useState<FillerCounts>({ um: 0, uh: 0, like: 0, so: 0, you_know: 0 });
  const [wpm, setWpm] = useState(0);
  const [tips, setTips] = useState<CoachTipData[]>([]);
  const [tipIdRef] = useState({ v: 0 });
  const [browserOk] = useState(() => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const [noSpeechWarning, setNoSpeechWarning] = useState(false);

  const recRef = useRef<ISpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const transcriptRef = useRef("");
  const finalTextRef = useRef("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  // Refs to avoid stale closures in callbacks
  const pausedRef = useRef(false);
  const isActiveRef = useRef(true);
  const noSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targetSec = setup.targetDuration * 60;

  useEffect(() => {
    startSession();
    return cleanup;
  }, []); // eslint-disable-line

  // Keep pausedRef in sync
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Tip rotation
  useEffect(() => {
    const pool: CoachTipData[] = [
      { id: 0, msg: "✓ Keep that energy going.", variant: "green" },
      { id: 0, msg: "⚡ Speed up slightly — you're losing the room.", variant: "yellow" },
      { id: 0, msg: "⚠️ Too many filler words detected.", variant: "red" },
      { id: 0, msg: "💡 Add a specific number here. Investors trust data.", variant: "purple" },
      { id: 0, msg: "🎯 This is your strongest moment. Stay on this point.", variant: "gold" },
      { id: 0, msg: "⚠️ Get to the ask. Don't wait until the end.", variant: "red" },
      { id: 0, msg: "💡 Connect this to a real customer story.", variant: "purple" },
      { id: 0, msg: "✓ Strong conviction in your voice.", variant: "green" },
    ];
    const interval = setInterval(() => {
      const tip = pool[Math.floor(Math.random() * pool.length)];
      tipIdRef.v += 1;
      const newTip = { ...tip, id: tipIdRef.v };
      setTips(prev => [...prev.slice(-1), newTip]);
      setTimeout(() => {
        setTips(prev => prev.filter(t => t.id !== newTip.id));
      }, 8000);
    }, 20000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  // Show "no speech" warning after 15 seconds of silence
  useEffect(() => {
    noSpeechTimerRef.current = setTimeout(() => {
      if (transcriptRef.current.trim().length === 0) {
        setNoSpeechWarning(true);
      }
    }, 15000);
    return () => {
      if (noSpeechTimerRef.current) clearTimeout(noSpeechTimerRef.current);
    };
  }, []); // eslint-disable-line

  // Dismiss no-speech warning once words appear
  useEffect(() => {
    if (transcript.trim().length > 0) setNoSpeechWarning(false);
  }, [transcript]);

  async function startSession() {
    isActiveRef.current = true;

    // Web Audio for waveform
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextCtor();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(dataArr);
        setWaveformData(Array.from(dataArr).slice(0, 20));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      // waveform won't animate, recording still works
    }

    // Speech recognition
    if (!browserOk) return;
    const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    function startRecognition() {
      if (!isActiveRef.current) return;
      try {
        const rec = new SRClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        // iOS Safari: maxAlternatives = 1 improves reliability
        (rec as ISpeechRecognition & { maxAlternatives?: number }).maxAlternatives = 1;

        rec.onresult = (e: ISpeechRecognitionEvent) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
              finalTextRef.current += e.results[i][0].transcript + " ";
            } else {
              interim = e.results[i][0].transcript;
            }
          }
          const full = finalTextRef.current + interim;
          transcriptRef.current = full;
          setTranscript(full);
          setFillers(countFillers(full));
        };

        rec.onerror = (e: ISpeechRecognitionErrorEvent) => {
          if (e.error === "no-speech") return; // Continue — iOS fires this often
          // Other errors: don't stop recording
        };

        // CRITICAL for iOS: restart on end so continuous transcription works
        rec.onend = () => {
          if (isActiveRef.current && !pausedRef.current) {
            setTimeout(() => {
              if (isActiveRef.current && !pausedRef.current) {
                startRecognition();
              }
            }, 100);
          }
        };

        recRef.current = rec;
        rec.start();
      } catch { /* handled */ }
    }

    startRecognition();

    // Timer
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(e => e + 1);
      if (elapsedRef.current % 10 === 0) {
        setWpm(calcWPM(transcriptRef.current, elapsedRef.current));
      }
    }, 1000);
  }

  function cleanup() {
    isActiveRef.current = false;
    recRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => { /* ok */ });
  }

  function handleStop() {
    cleanup();
    const text = manualMode ? manualText : transcriptRef.current;
    const f = countFillers(text);
    const w = calcWPM(text, Math.max(1, elapsedRef.current));
    onDone(text, elapsedRef.current, f, w);
  }

  function togglePause() {
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
      // Restart recognition
      if (browserOk && !manualMode) {
        const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        try {
          const rec = new SRClass();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = "en-US";
          (rec as ISpeechRecognition & { maxAlternatives?: number }).maxAlternatives = 1;
          rec.onresult = (e: ISpeechRecognitionEvent) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
              if (e.results[i].isFinal) finalTextRef.current += e.results[i][0].transcript + " ";
              else interim = e.results[i][0].transcript;
            }
            const full = finalTextRef.current + interim;
            transcriptRef.current = full;
            setTranscript(full);
            setFillers(countFillers(full));
          };
          rec.onend = () => {
            if (isActiveRef.current && !pausedRef.current) {
              setTimeout(() => { if (isActiveRef.current && !pausedRef.current) rec.start(); }, 100);
            }
          };
          rec.onerror = (e: ISpeechRecognitionErrorEvent) => { if (e.error !== "no-speech") return; };
          recRef.current = rec;
          rec.start();
        } catch { /* ok */ }
      }
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(e => e + 1);
      }, 1000);
    } else {
      pausedRef.current = true;
      setPaused(true);
      recRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function switchToManual() {
    setManualMode(true);
    setNoSpeechWarning(false);
    // Keep waveform, stop recognition
    recRef.current?.stop();
  }

  const activeTranscript = manualMode ? manualText : transcript;
  const totalF = totalFillers(fillers);
  const paceVerdict = wpm === 0 ? "—" : wpm < 100 ? "TOO SLOW" : wpm > 170 ? "TOO FAST" : "PERFECT";
  const paceColor = wpm === 0 ? "text-white/40" : (wpm < 100 || wpm > 170) ? "text-red-400" : "text-green-400";
  const energy = wpm === 0 ? "—" : wpm > 140 ? "HIGH" : wpm > 110 ? "MEDIUM" : "LOW";
  const energyColor = energy === "HIGH" ? "text-green-400" : energy === "MEDIUM" ? "text-yellow-400" : "text-red-400";
  const timeProgress = Math.min(1, elapsed / Math.max(1, targetSec));
  const timeStatus = elapsed > targetSec * 1.1 ? "Running long" : elapsed < targetSec * 0.5 && elapsed > 20 ? "Too slow" : "On track";
  const canStop = activeTranscript.trim().split(/\s+/).filter(Boolean).length >= 10;

  if (!browserOk && !manualMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#06040F]">
        <div className="text-center max-w-sm">
          <MicOff className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2 text-lg">Speech recognition not available</p>
          <p className="text-[#8B7CF8] text-sm mb-2">Supported browsers: Chrome, Edge, Safari on desktop.</p>
          <p className="text-[#8B7CF8] text-sm mb-6">You can still get your pitch analyzed by typing or pasting it below.</p>
          <button
            onClick={() => setManualMode(true)}
            className="w-full h-12 bg-[#C9A84C] text-[#06040F] font-black rounded-xl text-sm mb-3"
          >
            Type / Paste My Pitch
          </button>
          <button onClick={onBack} className="text-[#8B7CF8] text-sm hover:text-white transition-colors">← Back to setup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06040F] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#1A1040] bg-[#0F0A1F] flex-shrink-0">
        <button onClick={onBack} className="text-[#8B7CF8] hover:text-white transition-colors text-sm">
          ← Back
        </button>
        <div className="flex items-center gap-2 flex-1">
          {manualMode ? (
            <span className="text-[#C9A84C] text-xs font-bold tracking-widest">TEXT MODE</span>
          ) : (
            <>
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-red-500"
                animate={{ opacity: paused ? 0.4 : [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-red-400 text-xs font-bold tracking-widest">{paused ? "PAUSED" : "LIVE"}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 font-mono">
          <span className="text-[#C9A84C] font-bold text-lg">{fmtTime(elapsed)}</span>
          <span className="text-white/30 text-sm"> / {fmtTime(targetSec)}</span>
        </div>
      </div>

      {/* No-speech warning banner */}
      <AnimatePresence>
        {noSpeechWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-yellow-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>No speech detected. Speak clearly into your microphone, or use text input.</span>
            </div>
            <button
              onClick={switchToManual}
              className="flex-shrink-0 px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold hover:bg-yellow-500/30 transition-colors"
            >
              Use Text Input
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* LEFT: waveform + transcript + controls */}
        <div className="flex-1 flex flex-col p-4 gap-4 lg:w-[55%]">
          {/* Waveform (always shown) */}
          {!manualMode && (
            <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-4 flex items-center justify-center" style={{ minHeight: 100 }}>
              <Waveform data={waveformData} />
            </div>
          )}

          {/* Manual text input OR live transcript */}
          {manualMode ? (
            <div className="flex-1 flex flex-col gap-2">
              <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider">
                Paste or type your pitch below
              </p>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                placeholder="Type or paste your pitch here..."
                className="flex-1 w-full px-4 py-3 rounded-2xl bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED] text-white text-sm leading-relaxed outline-none resize-none transition-colors placeholder-white/25"
                style={{ minHeight: 240 }}
              />
              <p className="text-white/30 text-xs">{manualText.trim().split(/\s+/).filter(Boolean).length} words</p>
            </div>
          ) : (
            <div
              ref={transcriptScrollRef}
              className="flex-1 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-4 overflow-y-auto"
              style={{ minHeight: 160, maxHeight: "calc(100vh - 340px)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider">Live Transcript</p>
                <button
                  onClick={switchToManual}
                  className="text-[10px] text-white/30 hover:text-[#8B7CF8] transition-colors underline"
                >
                  Switch to text input
                </button>
              </div>
              <div className="text-sm leading-relaxed">
                {transcript
                  ? highlightFillers(transcript)
                  : <span className="text-white/25 italic">Start speaking — your words appear here...</span>
                }
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!manualMode && (
              <button
                onClick={togglePause}
                className="w-12 h-12 rounded-full border border-[#1A1040] bg-[#0F0A1F] flex items-center justify-center text-[#8B7CF8] hover:text-white hover:border-[#7C3AED] transition-colors"
              >
                {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={handleStop}
              disabled={!canStop}
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-black rounded-xl transition-colors text-sm"
            >
              <StopCircle className="w-5 h-5" />
              {manualMode ? "Analyze My Pitch →" : "Stop & Analyze"}
            </button>
          </div>
          {!canStop && (
            <p className="text-white/30 text-xs text-center -mt-2">
              {manualMode
                ? "Please enter at least a few sentences."
                : "Keep speaking — more words needed for analysis."}
            </p>
          )}
        </div>

        {/* RIGHT: live metrics + tips */}
        <div className="lg:w-[45%] p-4 space-y-4 overflow-y-auto border-t lg:border-t-0 lg:border-l border-[#1A1040]">
          <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5" /> Live Coaching
          </p>

          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              title="Pace"
              value={wpm > 0 ? `${wpm} WPM` : "—"}
              sub={`Status: ${paceVerdict}`}
              color={paceColor}
            />
            <MetricCard
              title="Filler Words"
              value={String(totalF)}
              sub={totalF > 0 ? `um(${fillers.um}) uh(${fillers.uh}) like(${fillers.like})` : "Keep it up!"}
              color={totalF > 8 ? "text-red-400" : totalF > 3 ? "text-yellow-400" : "text-green-400"}
            />
            <MetricCard
              title="Energy"
              value={energy}
              sub="Based on pace"
              color={energyColor}
            />
            <div className="bg-[#06040F] border border-[#1A1040] rounded-xl p-3">
              <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider mb-1">Time Check</p>
              <div className="h-1.5 bg-[#1A1040] rounded-full overflow-hidden mb-1.5">
                <motion.div
                  className="h-full rounded-full bg-[#C9A84C]"
                  animate={{ width: `${timeProgress * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <p className={`text-xs font-bold ${elapsed > targetSec * 1.1 ? "text-red-400" : "text-green-400"}`}>
                {timeStatus}
              </p>
            </div>
          </div>

          <p className="text-white/30 text-[10px]">Ideal pace: 130–150 WPM · Ideal fillers: &lt;5 total</p>

          <div className="space-y-2 min-h-[80px]">
            <AnimatePresence>
              {tips.map(tip => <CoachTipCard key={tip.id} tip={tip} />)}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analyzing screen ─────────────────────────────────────────────────────────

function AnalyzingScreen() {
  const steps = ["Transcribing pitch...", "Detecting filler words...", "Analyzing structure...", "Scoring delivery...", "Generating brutal feedback..."];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone(p => Math.min(p + 1, steps.length)), 1100);
    return () => clearInterval(t);
  }, []); // eslint-disable-line
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#06040F]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
        <div className="w-16 h-16 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Pitch</h2>
        <p className="text-[#8B7CF8] text-sm mb-8">The harshest pitch coach in Silicon Valley is reviewing your pitch...</p>
        <div className="space-y-2 text-left">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all ${i < done ? "text-green-400" : "text-white/25"}`}>
              <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border ${i < done ? "border-green-500 bg-green-500/20" : "border-[#1A1040]"}`}>
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
  analysis, setup, sessionId, onRetry,
}: {
  analysis: Analysis; setup: SetupData; sessionId: string; onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const score = analysis.overall_score;

  const bannerCfg = score > 80
    ? { cls: "border-green-500/50 bg-green-500/10 text-green-300", msg: "Strong pitch. Almost investor-ready." }
    : score >= 70
    ? { cls: "border-blue-500/50 bg-blue-500/10 text-blue-300", msg: "Good foundation. Polish these details." }
    : score >= 55
    ? { cls: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300", msg: "Getting closer. Fix these issues first." }
    : { cls: "border-red-500/50 bg-red-500/10 text-red-300", msg: "This pitch needs major work before any investor meetings." };

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/pitch-coach-live");
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    setHistoryLoading(false);
  }

  function copyShare() {
    const text = `🎤 Pitch Score: ${score}/100 (${analysis.grade})\n${analysis.bottom_line}\n\nPracticed with Quantum Pitch Coach Live`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const chartData = history.map(h => ({
    name: new Date(h.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" }),
    score: h.overallScore,
  })).reverse();

  return (
    <div className="min-h-screen bg-[#06040F]">
      <div className="max-w-3xl mx-auto p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 p-5 rounded-2xl border mb-8 ${bannerCfg.cls}`}
          >
            {score >= 70 ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <p className="font-bold leading-snug">{bannerCfg.msg}</p>
          </motion.div>

          {/* SECTION 1: Verdict */}
          <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 mb-4 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="inline-block mb-4"
            >
              <CircleGauge score={score} size={150} />
            </motion.div>
            <div className="flex items-center justify-center gap-4 mb-3">
              <span className={`text-6xl font-black ${gradeColor(analysis.grade)}`}>{analysis.grade}</span>
              <span className={`px-4 py-1.5 rounded-full border text-sm font-bold ${
                analysis.ready_to_pitch
                  ? "border-green-500/50 bg-green-500/20 text-green-400"
                  : "border-red-500/50 bg-red-500/20 text-red-400"
              }`}>
                {analysis.ready_to_pitch ? "✓ Ready to Pitch" : "✗ Not Ready Yet"}
              </span>
            </div>
            <p className="text-white font-bold text-lg leading-snug max-w-xl mx-auto">{analysis.bottom_line}</p>
            <p className="text-[#8B7CF8] text-xs mt-2">{setup.startupName} · {setup.audienceType}</p>
          </div>

          {/* SECTION 2: Critical problems — ALWAYS FIRST */}
          {analysis.critical_problems?.length > 0 && (
            <Section title="What Needs Work" icon={<AlertTriangle className="w-4 h-4 text-red-400" />} color="text-red-400">
              <div className="space-y-4">
                {analysis.critical_problems.map((p, i) => (
                  <div key={i} className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-red-400 font-bold text-sm">{p.problem_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.severity === "HIGH"
                          ? "border-red-500/50 bg-red-500/20 text-red-400"
                          : "border-yellow-500/50 bg-yellow-500/20 text-yellow-400"
                      }`}>{p.severity}</span>
                    </div>
                    <p className="text-white/50 text-xs italic">What you said: &quot;{p.what_you_said}&quot;</p>
                    <p className="text-white/70 text-sm">{p.why_its_weak}</p>
                    <div className="pt-2 border-t border-red-500/20">
                      <p className="text-[#C9A84C] text-xs font-bold mb-1.5">→ Better version:</p>
                      <p className="text-[#C9A84C]/90 text-sm leading-relaxed">{p.rewritten_version}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION 3: What worked */}
          {analysis.what_worked?.length > 0 && (
            <Section title="What Landed Well" icon={<Star className="w-4 h-4 text-green-400" />} color="text-green-400">
              <div className="space-y-3">
                {analysis.what_worked.map((w, i) => (
                  <div key={i} className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                    <p className="text-green-300 text-sm italic mb-1">&quot;{w.moment}&quot;</p>
                    <p className="text-white/70 text-xs">{w.why}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION 4: Missing completely */}
          {analysis.missing_completely?.length > 0 && (
            <Section title="What You Never Said" icon={<XCircle className="w-4 h-4 text-orange-400" />} color="text-orange-400">
              <div className="flex flex-wrap gap-2">
                {analysis.missing_completely.map((item, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-300 text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION 5: Filler words */}
          {analysis.filler_analysis && (
            <Section title="Filler Words" icon={<Clock className="w-4 h-4 text-[#8B7CF8]" />} color="text-[#8B7CF8]">
              <div className="flex items-start gap-6 mb-4">
                <div>
                  <p className={`text-5xl font-black ${analysis.filler_analysis.total_count > 10 ? "text-red-400" : analysis.filler_analysis.total_count > 5 ? "text-yellow-400" : "text-green-400"}`}>
                    {analysis.filler_analysis.total_count}
                  </p>
                  <p className="text-white/40 text-xs mt-1">{analysis.filler_analysis.per_minute}/min</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(analysis.filler_analysis.breakdown ?? {}).map(([word, cnt]) => cnt > 0 && (
                    <span key={word} className="px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-medium">
                      {word.replace("_", " ")} ×{cnt as number}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-white/60 text-sm italic mb-3">{analysis.filler_analysis.verdict}</p>
              <p className="text-[#8B7CF8] text-xs p-3 rounded-lg border border-[#1A1040] bg-[#06040F]">
                💡 Replace filler words with silence. A pause is more powerful than &quot;um&quot;.
              </p>
            </Section>
          )}

          {/* SECTION 6: Pacing */}
          {analysis.pacing && (
            <Section title="Pacing Analysis" icon={<TrendingUp className="w-4 h-4 text-[#7C3AED]" />} color="text-[#7C3AED]">
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <p className={`text-5xl font-black ${analysis.pacing.verdict === "PERFECT" ? "text-green-400" : "text-yellow-400"}`}>
                    {analysis.pacing.words_per_minute}
                  </p>
                  <p className="text-white/40 text-xs mt-1">words per minute</p>
                </div>
                <div>
                  <span className={`px-3 py-1.5 rounded-full border text-sm font-bold ${
                    analysis.pacing.verdict === "PERFECT"
                      ? "border-green-500/50 bg-green-500/20 text-green-400"
                      : analysis.pacing.verdict === "TOO_FAST"
                      ? "border-red-500/50 bg-red-500/20 text-red-400"
                      : "border-yellow-500/50 bg-yellow-500/20 text-yellow-400"
                  }`}>{analysis.pacing.verdict.replace("_", " ")}</span>
                  <p className="text-white/30 text-xs mt-2">Ideal: 130–150 WPM</p>
                </div>
              </div>
              {/* Simple bar */}
              <div className="h-2 bg-[#1A1040] rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${analysis.pacing.verdict === "PERFECT" ? "bg-green-500" : "bg-yellow-500"}`}
                  style={{ width: `${Math.min(100, (analysis.pacing.words_per_minute / 200) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-white/50">
                <p>Slowest: {analysis.pacing.slowest_section}</p>
                <p>Fastest: {analysis.pacing.fastest_section}</p>
              </div>
            </Section>
          )}

          {/* SECTION 7: Investor reaction */}
          {analysis.investor_reaction && (
            <Section title="Investor Reaction" icon={<Zap className="w-4 h-4 text-[#7C3AED]" />} color="text-[#7C3AED]">
              <div className="p-4 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/5">
                <p className="text-white/80 text-sm leading-relaxed italic">&quot;{analysis.investor_reaction}&quot;</p>
              </div>
            </Section>
          )}

          {/* SECTION 8: Killer rewrite */}
          {analysis.the_killer_rewrite && (
            <Section title="How This 30 Seconds Should Sound" icon={<Flame className="w-4 h-4 text-[#C9A84C]" />} color="text-[#C9A84C]">
              <div className="p-4 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5">
                <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2">Quantum&apos;s rewrite:</p>
                <p className="text-white text-sm leading-relaxed">{analysis.the_killer_rewrite}</p>
              </div>
            </Section>
          )}

          {/* SECTION 9: Before next pitch */}
          {analysis.before_next_pitch?.length > 0 && (
            <Section title="Before Your Next Pitch" icon={<Award className="w-4 h-4 text-[#C9A84C]" />} color="text-[#C9A84C]">
              <ol className="space-y-3">
                {analysis.before_next_pitch.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C] text-xs font-black flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-white text-sm leading-relaxed">{item}</p>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-6">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-black rounded-xl transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" /> Practice Again →
            </button>
            <button
              onClick={copyShare}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#7C3AED]/40 text-[#8B7CF8] hover:bg-[#7C3AED]/10 transition-colors text-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Share My Score"}
            </button>
            <button
              onClick={() => { setShowHistory(h => !h); if (!showHistory) loadHistory(); }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#1A1040] text-[#8B7CF8]/60 hover:text-[#8B7CF8] hover:border-[#7C3AED]/30 transition-colors text-sm"
            >
              <History className="w-4 h-4" /> {showHistory ? "Hide History" : "View History"}
            </button>
          </div>

          {/* History panel */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-8"
              >
                <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-5">
                  <h3 className="text-[#C9A84C] text-sm font-bold mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" /> Past Sessions
                  </h3>
                  {historyLoading ? (
                    <div className="text-center py-8 text-[#8B7CF8] text-sm">Loading...</div>
                  ) : history.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-4">No previous sessions yet.</p>
                  ) : (
                    <>
                      {/* Chart */}
                      {chartData.length > 1 && (
                        <div className="mb-5 h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <XAxis dataKey="name" tick={{ fill: "#8B7CF8", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#8B7CF8", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                              <Tooltip
                                contentStyle={{ background: "#0F0A1F", border: "1px solid #1A1040", borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: "#8B7CF8" }}
                                itemStyle={{ color: "#C9A84C" }}
                              />
                              <Line type="monotone" dataKey="score" stroke="#C9A84C" strokeWidth={2} dot={{ fill: "#C9A84C", r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      {/* Session list */}
                      <div className="space-y-2">
                        {history.map(h => (
                          <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-[#1A1040] bg-[#06040F]">
                            <div>
                              <p className="text-white text-sm font-medium">{h.startupName}</p>
                              <p className="text-[#8B7CF8] text-xs">{new Date(h.createdAt).toLocaleDateString()} · {h.audienceType}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-black ${gradeColor(h.grade)}`}>{h.grade}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                h.overallScore >= 70 ? "bg-green-500/20 text-green-400" :
                                h.overallScore >= 55 ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-red-500/20 text-red-400"
                              }`}>{h.overallScore}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-white/20 text-xs pb-4">
            Session ID: {sessionId}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PitchCoachLivePage() {
  const { locale } = useLanguage();
  const [step, setStep] = useState<Step>("setup");
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [apiError, setApiError] = useState("");

  const handleStart = useCallback((data: SetupData) => {
    setSetup(data);
    setStep("recording");
    setApiError("");
  }, []);

  const handleRecordingDone = useCallback(async (
    t: string, d: number, f: FillerCounts, w: number
  ) => {
    // Validate transcript
    const wordCount = t.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 15) {
      setApiError(
        "No speech detected. Please speak clearly into your microphone or use the text input option."
      );
      setStep("setup");
      return;
    }

    setStep("analyzing");

    try {
      // Use /api/analyze-pitch for Gemini analysis; also save via /api/pitch-coach-live
      const res = await fetch("/api/analyze-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: t,
          startupName: setup?.startupName,
          startupDescription: setup?.startupDescription,
          audienceType: setup?.audienceType,
          targetDuration: setup?.targetDuration,
          language: locale === "ru" ? "Russian" : locale === "es" ? "Spanish" : locale === "zh" ? "Chinese" : "English",
        }),
      });

      const analysisData = await res.json();

      if (!res.ok) {
        const errMsg = analysisData.error ?? "";
        if (res.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("unavailable")) {
          setApiError("AI analysis temporarily unavailable. Please try again in a few minutes.");
        } else {
          setApiError("Analysis failed. Please try again.");
        }
        setStep("setup");
        return;
      }

      setAnalysis(analysisData);

      // Save session to DB in background (don't block results)
      fetch("/api/pitch-coach-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupName: setup?.startupName,
          startupDescription: setup?.startupDescription,
          audienceType: setup?.audienceType,
          targetDuration: setup?.targetDuration,
          actualDuration: d,
          transcript: t,
          wordCount,
          fillerWordCount: totalFillers(f),
          wordsPerMinute: w,
          locale,
        }),
      })
        .then(r => r.json())
        .then(saved => { if (saved?.id) setSessionId(saved.id); })
        .catch(() => { /* non-critical */ });

      setStep("results");
    } catch {
      setApiError("Connection error. Please check your internet and try again.");
      setStep("setup");
    }
  }, [setup, locale]);

  const handleRetry = useCallback(() => {
    setStep("setup");
    setAnalysis(null);
    setApiError("");
    setSessionId("");
  }, []);

  return (
    <div className="min-h-screen bg-[#06040F]">
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {apiError && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border border-red-500/40 bg-[#0F0A1F] text-red-400 text-sm flex items-center gap-2 shadow-xl">
                <AlertTriangle className="w-4 h-4" /> {apiError}
              </div>
            )}
            <SetupScreen onStart={handleStart} />
          </motion.div>
        )}
        {step === "recording" && setup && (
          <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {apiError && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border border-red-500/40 bg-[#0F0A1F] text-red-400 text-sm flex items-center gap-2 shadow-xl">
                <AlertTriangle className="w-4 h-4" /> {apiError}
              </div>
            )}
            <RecordingScreen
              setup={setup}
              onDone={handleRecordingDone}
              onBack={() => setStep("setup")}
            />
          </motion.div>
        )}
        {step === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnalyzingScreen />
          </motion.div>
        )}
        {step === "results" && analysis && setup && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultsScreen
              analysis={analysis}
              setup={setup}
              sessionId={sessionId}
              onRetry={handleRetry}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
