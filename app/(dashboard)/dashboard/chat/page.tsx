"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  messageType: string;
  stickerId: string | null;
  reactions: Record<string, string[]>;
  createdAt: string;
  user: { id: string; name: string | null; country: string | null };
}

// ─── Stickers ──────────────────────────────────────────────────────────────────

const STICKERS = [
  { id: "struggling",    emoji: "😤", label: "Struggling" },
  { id: "launching",     emoji: "🚀", label: "Launching!" },
  { id: "fundraising",   emoji: "💰", label: "Fundraising" },
  { id: "building3am",   emoji: "☕", label: "3am build" },
  { id: "foundpmf",      emoji: "🎯", label: "Found PMF!" },
  { id: "rejected",      emoji: "😭", label: "Rejected" },
  { id: "firstcustomer", emoji: "🏆", label: "1st customer!" },
  { id: "newidea",       emoji: "💡", label: "New idea!" },
];

const QUICK_EMOJIS = ["👍", "🔥", "💡", "🚀", "❤️"];

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

// ─── Reactions Bar ─────────────────────────────────────────────────────────────

function ReactionsBar({
  reactions,
  myId,
  messageId,
  onToggle,
}: {
  reactions: Record<string, string[]>;
  myId: string;
  messageId: string;
  onToggle: (messageId: string, emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);

  return (
    <div className="flex items-center flex-wrap gap-1 mt-1">
      {entries.map(([emoji, users]) => {
        const iMine = users.includes(myId);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(messageId, emoji)}
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all",
              iMine
                ? "bg-[#7C3AED]/30 border-[#7C3AED]/60 text-white"
                : "bg-[#1A1040] border-[#2D1B69]/50 text-[#8B7CF8] hover:border-[#7C3AED]/50"
            )}
          >
            <span>{emoji}</span>
            <span>{users.length}</span>
          </button>
        );
      })}

      {/* + button */}
      <div className="relative">
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="text-xs px-2 py-0.5 rounded-full border border-[#2D1B69]/50 bg-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/50 transition-all"
        >
          +
        </button>
        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.1 }}
              className="absolute bottom-full mb-1 left-0 z-20 flex gap-1 bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-1.5 shadow-xl"
            >
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    onToggle(messageId, e);
                    setPickerOpen(false);
                  }}
                  className="text-lg hover:scale-125 transition-transform"
                >
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Sticker Bubble ────────────────────────────────────────────────────────────

function StickerBubble({
  msg,
  isMine,
  myId,
  onToggleReaction,
}: {
  msg: ChatMessage;
  isMine: boolean;
  myId: string;
  onToggleReaction: (messageId: string, emoji: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}
    >
      <span className="text-xs text-[#8B7CF8]/60 px-1">
        {isMine ? "You" : (msg.user.name ?? "Founder")}
      </span>
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-5xl select-none"
      >
        {msg.message}
      </motion.div>
      <ReactionsBar
        reactions={msg.reactions}
        myId={myId}
        messageId={msg.id}
        onToggle={onToggleReaction}
      />
    </motion.div>
  );
}

// ─── Text Bubble ───────────────────────────────────────────────────────────────

function Bubble({
  msg,
  isMine,
  showHeader,
  myId,
  onToggleReaction,
}: {
  msg: ChatMessage;
  isMine: boolean;
  showHeader: boolean;
  myId: string;
  onToggleReaction: (messageId: string, emoji: string) => void;
}) {
  if (msg.messageType === "sticker") {
    return (
      <StickerBubble
        msg={msg}
        isMine={isMine}
        myId={myId}
        onToggleReaction={onToggleReaction}
      />
    );
  }

  const flag = countryFlag(msg.user.country);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", isMine ? "flex-row-reverse" : "flex-row")}
    >
      {!isMine && <Avatar user={msg.user} />}
      <div className={cn("max-w-[72%] space-y-0.5", isMine && "items-end flex flex-col")}>
        {showHeader && (
          <div className={cn("flex items-center gap-2 px-1", isMine ? "justify-end" : "justify-start")}>
            {!isMine && (
              <span className="text-xs font-semibold text-white">
                {msg.user.name ?? "Founder"}
              </span>
            )}
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
              ? "bg-[#7C3AED] text-white rounded-tr-sm"
              : "bg-[#1A1040] text-[#E8E6FF] border border-[#2D1B69]/50 rounded-tl-sm"
          )}
        >
          {msg.message}
        </div>
        <span className={cn("text-[10px] text-[#555] px-1", isMine && "text-right")}>
          {timeLabel(msg.createdAt)}
        </span>
        <ReactionsBar
          reactions={msg.reactions}
          myId={myId}
          messageId={msg.id}
          onToggle={onToggleReaction}
        />
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
  const [stickerOpen, setStickerOpen] = useState(false);
  const [welcomed, setWelcomed] = useState(true); // true = already welcomed (don't show)
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);

  // Check localStorage for welcome state
  useEffect(() => {
    const key = "quantum-chat-welcomed";
    const seen = localStorage.getItem(key);
    if (!seen) setWelcomed(false);
  }, []);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = await res.json();
      const msgs: ChatMessage[] = data.messages ?? [];
      setMessages(msgs);
      setOnlineCount(data.onlineCount ?? 1);
      if (!silent) setLoading(false);
      if (msgs.length !== lastCountRef.current) {
        lastCountRef.current = msgs.length;
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      }
    } catch {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(false); }, [fetchMessages]);
  useEffect(() => {
    const id = setInterval(() => fetchMessages(true), 3000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  const handleSend = async (opts?: { messageType?: string; stickerId?: string; message?: string }) => {
    const text = opts?.message ?? input.trim();
    if (!text || sending) return;
    if (!opts?.message) setInput("");
    setSending(true);
    setStickerOpen(false);

    // Mark welcomed on first send
    const key = "quantum-chat-welcomed";
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setWelcomed(true);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messageType: opts?.messageType ?? "text",
          stickerId: opts?.stickerId ?? null,
        }),
      });
      if (res.ok) await fetchMessages(true);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSendSticker = (sticker: (typeof STICKERS)[number]) => {
    handleSend({ messageType: "sticker", stickerId: sticker.id, message: sticker.emoji });
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...m.reactions };
        const users = reactions[emoji] ? [...reactions[emoji]] : [];
        if (users.includes(myId)) {
          const next = users.filter((u) => u !== myId);
          if (next.length === 0) delete reactions[emoji];
          else reactions[emoji] = next;
        } else {
          reactions[emoji] = [...users, myId];
        }
        return { ...m, reactions };
      })
    );

    await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji }),
    });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Has the user ever sent a message? (check local messages list)
  const userHasSentMessage = messages.some((m) => m.userId === myId);
  const showWelcomeBanner = !welcomed && !userHasSentMessage;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#06040F]">
      {/* ── Header ── */}
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
          <span className="font-semibold">{onlineCount} online</span>
        </div>
      </div>

      {/* ── Messages ── */}
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
        ) : (
          <>
            {/* Welcome system message */}
            {showWelcomeBanner && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <div className="bg-[#1A1040]/60 border border-[#2D1B69]/40 text-[#8B7CF8] text-sm text-center rounded-2xl px-5 py-3 max-w-sm leading-relaxed">
                  Welcome to Founders Chat 🚀 — You&apos;re now part of a global community of founders. Be kind. Share openly. Build together.
                </div>
              </motion.div>
            )}

            {messages.length === 0 && !showWelcomeBanner ? (
              <div className="flex items-center justify-center h-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 max-w-xs"
                >
                  <div className="text-5xl">🚀</div>
                  <h3 className="text-lg font-bold text-white">Be the first to say hello!</h3>
                  <p className="text-sm text-[#8B7CF8]/80 leading-relaxed">
                    This is where founders from around the world connect, share wins, ask questions, and support each other.
                  </p>
                </motion.div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => {
                  const prev = messages[i - 1];
                  const showHeader =
                    !prev ||
                    prev.userId !== msg.userId ||
                    new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
                  return (
                    <Bubble
                      key={msg.id}
                      msg={msg}
                      isMine={msg.userId === myId}
                      showHeader={showHeader}
                      myId={myId}
                      onToggleReaction={handleToggleReaction}
                    />
                  );
                })}
              </AnimatePresence>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Sticker Picker ── */}
      <AnimatePresence>
        {stickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-2 bg-[#0F0A1F] border-t border-[#1A1040] flex-shrink-0"
          >
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-3 pb-1">
              {STICKERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSendSticker(s)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#1A1040] transition-colors group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{s.emoji}</span>
                  <span className="text-[10px] text-[#8B7CF8]/70 text-center leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Bar ── */}
      <div className="px-4 py-3 border-t border-[#1A1040] bg-[#0F0A1F] flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#06040F] border border-[#1A1040] rounded-2xl px-3 py-2.5 focus-within:border-[#7C3AED]/50 transition-colors">
          {/* Sticker toggle */}
          <button
            onClick={() => setStickerOpen((o) => !o)}
            className={cn(
              "text-lg flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all",
              stickerOpen ? "bg-[#7C3AED]/30 text-[#A855F7]" : "text-[#555] hover:text-[#8B7CF8]"
            )}
            title="Stickers"
          >
            🎭
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message founders..."
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#444] outline-none"
          />

          {/* Send button */}
          <button
            onClick={() => handleSend()}
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
        <p className="text-[10px] text-[#333] text-center mt-1.5">
          Press Enter to send · {input.length}/500
        </p>
      </div>
    </div>
  );
}
