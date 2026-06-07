"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string | null; country: string | null };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const COUNTRY_CODES: Record<string, string> = {
  "united states": "US", "usa": "US", "us": "US",
  "united kingdom": "GB", "uk": "GB",
  "canada": "CA", "germany": "DE", "france": "FR",
  "spain": "ES", "italy": "IT", "netherlands": "NL",
  "russia": "RU", "china": "CN", "japan": "JP",
  "south korea": "KR", "india": "IN", "brazil": "BR",
  "australia": "AU", "mexico": "MX", "argentina": "AR",
  "nigeria": "NG", "kenya": "KE", "south africa": "ZA",
  "egypt": "EG", "uae": "AE", "saudi arabia": "SA",
  "israel": "IL", "singapore": "SG", "indonesia": "ID",
  "pakistan": "PK", "bangladesh": "BD", "ukraine": "UA",
  "poland": "PL", "sweden": "SE", "norway": "NO",
  "denmark": "DK", "finland": "FI", "switzerland": "CH",
  "austria": "AT", "belgium": "BE", "portugal": "PT",
  "turkey": "TR", "iran": "IR", "thailand": "TH",
  "vietnam": "VN", "philippines": "PH", "malaysia": "MY",
  "colombia": "CO", "chile": "CL", "peru": "PE",
  "kazakhstan": "KZ",
};

function countryFlag(country: string | null): string {
  if (!country) return "🌍";
  const key = country.toLowerCase().trim();
  const code = key.length === 2 ? key.toUpperCase() : (COUNTRY_CODES[key] ?? "");
  if (!code || code.length !== 2) return "🌍";
  return (
    String.fromCodePoint(0x1f1e6 + code.charCodeAt(0) - 65) +
    String.fromCodePoint(0x1f1e6 + code.charCodeAt(1) - 65)
  );
}

function initials(name: string | null): string {
  if (!name) return "F";
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// avatar palette — stable per userId
const AVATAR_COLORS = [
  ["#7C3AED", "#C9A84C"],
  ["#A855F7", "#E8C97A"],
  ["#6D28D9", "#F59E0B"],
  ["#8B5CF6", "#D97706"],
  ["#5B21B6", "#FBBF24"],
];
function avatarColor(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: ChatMessage["user"] }) {
  const [bg, border] = avatarColor(user.id);
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white select-none"
      style={{ background: bg, boxShadow: `0 0 0 2px ${border}40` }}
    >
      {initials(user.name)}
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────

function Bubble({
  msg,
  isMine,
  showHeader,
}: {
  msg: ChatMessage;
  isMine: boolean;
  showHeader: boolean;
}) {
  const flag = countryFlag(msg.user.country);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3", isMine ? "flex-row-reverse" : "flex-row")}
    >
      {!isMine && <Avatar user={msg.user} />}
      <div className={cn("max-w-[72%] space-y-1", isMine && "items-end flex flex-col")}>
        {showHeader && (
          <div className={cn("flex items-center gap-2 px-1", isMine ? "justify-end" : "justify-start")}>
            <span className="text-xs font-semibold text-white">
              {isMine ? "You" : (msg.user.name ?? "Founder")}
            </span>
            <span className="text-[10px] bg-[#7C3AED]/30 text-[#A855F7] px-1.5 py-0.5 rounded font-medium">
              Founder
            </span>
            <span className="text-base leading-none">{flag}</span>
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isMine
              ? "bg-[#7C3AED]/80 text-white rounded-tr-sm"
              : "bg-[#1A1040] text-[#E8E6FF] border border-[#2D1B69]/50 rounded-tl-sm"
          )}
        >
          {msg.message}
        </div>
        <span className={cn("text-[10px] text-[#555] px-1", isMine && "text-right")}>
          {timeLabel(msg.createdAt)}
        </span>
      </div>
      {isMine && <Avatar user={msg.user} />}
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FoundersChatPage() {
  const { data: session } = useSession();
  const myId = session?.user?.id ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
      setOnlineCount(data.onlineCount ?? 1);
      if (!silent) setLoading(false);
      // scroll to bottom only when new messages arrive
      if (data.messages?.length !== lastCountRef.current) {
        lastCountRef.current = data.messages?.length ?? 0;
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      }
    } catch {
      if (!silent) setLoading(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    fetchMessages(false);
  }, [fetchMessages]);

  // polling every 3 s
  useEffect(() => {
    const id = setInterval(() => fetchMessages(true), 3000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) await fetchMessages(true);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#06040F]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A1040] bg-[#0F0A1F] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-[#A855F7]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Founders Chat</p>
            <p className="text-xs text-[#8B7CF8]/70">Global founder community</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#C9A84C]">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold">{onlineCount} online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#7C3AED]/20 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6 text-[#7C3AED] animate-pulse" />
              </div>
              <p className="text-sm text-[#8B7CF8]">Loading messages…</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 max-w-xs"
            >
              <div className="text-5xl">👋</div>
              <h3 className="text-lg font-bold text-white">Be the first to say hi</h3>
              <p className="text-sm text-[#8B7CF8]/80 leading-relaxed">
                This is where founders from around the world connect, share wins, ask questions, and support each other.
              </p>
            </motion.div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showHeader = !prev || prev.userId !== msg.userId ||
                new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
              return (
                <Bubble
                  key={msg.id}
                  msg={msg}
                  isMine={msg.userId === myId}
                  showHeader={showHeader}
                />
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1A1040] bg-[#0F0A1F] flex-shrink-0">
        <div className="flex items-center gap-3 bg-[#06040F] border border-[#1A1040] rounded-2xl px-4 py-2.5 focus-within:border-[#7C3AED]/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Share something with fellow founders…"
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#444] outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
              input.trim() && !sending
                ? "bg-[#C9A84C] hover:bg-[#d4b660] text-[#06040F]"
                : "bg-[#1A1040] text-[#444]"
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-[#333] text-center mt-1.5">Press Enter to send · {input.length}/500</p>
      </div>
    </div>
  );
}
