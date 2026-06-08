"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Search, X, Pin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatUser {
  id: string;
  name: string | null;
  country: string | null;
  company?: string | null;
  createdAt?: string;
  streakDays?: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  messageType: string;
  stickerId: string | null;
  reactions: Record<string, string[]>;
  replyToId: string | null;
  isDeleted: boolean;
  createdAt: string;
  user: ChatUser;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

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

const QUICK_REACTIONS = ["👍", "🔥", "💡", "🚀", "❤️", "😂"];

const PINNED_MESSAGE = "Welcome to Founders Chat! 🚀 This is your global founder family. Share, support, and build together. For founders before the world believes.";

const COMMON_EMOJIS = ["😊","😂","🔥","💪","🎉","👋","❤️","🙌","😎","🚀","💡","🎯","💰","⚡","🏆","🙏","😅","🤔","💻","✅","🎸","🌟","🤝","😍","👏"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const COUNTRY_CODES: Record<string, string> = {
  "united states":"US","usa":"US","us":"US","united kingdom":"GB","uk":"GB",
  "canada":"CA","germany":"DE","france":"FR","spain":"ES","italy":"IT",
  "netherlands":"NL","russia":"RU","china":"CN","japan":"JP","south korea":"KR",
  "india":"IN","brazil":"BR","australia":"AU","mexico":"MX","argentina":"AR",
  "nigeria":"NG","kenya":"KE","south africa":"ZA","egypt":"EG","uae":"AE",
  "saudi arabia":"SA","israel":"IL","singapore":"SG","indonesia":"ID",
  "pakistan":"PK","bangladesh":"BD","ukraine":"UA","poland":"PL","sweden":"SE",
  "norway":"NO","denmark":"DK","finland":"FI","switzerland":"CH","austria":"AT",
  "belgium":"BE","portugal":"PT","turkey":"TR","iran":"IR","thailand":"TH",
  "vietnam":"VN","philippines":"PH","malaysia":"MY","colombia":"CO","chile":"CL",
  "peru":"PE","kazakhstan":"KZ",
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
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
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

function daysAgo(iso: string | undefined): string {
  if (!iso) return "?";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

const AVATAR_COLORS = [
  ["#7C3AED","#C9A84C"],["#A855F7","#E8C97A"],["#6D28D9","#F59E0B"],
  ["#8B5CF6","#D97706"],["#5B21B6","#FBBF24"],
];
function avatarColor(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#C9A84C]/40 text-white rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  user,
  size = 36,
  onClick,
  isOnline,
}: {
  user: ChatUser;
  size?: number;
  onClick?: () => void;
  isOnline?: boolean;
}) {
  const [bg, border] = avatarColor(user.id);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        onClick={onClick}
        className={cn("rounded-full flex items-center justify-center font-bold text-white select-none", onClick && "cursor-pointer hover:opacity-90 transition-opacity")}
        style={{
          width: size, height: size,
          fontSize: size * 0.36,
          background: `linear-gradient(135deg, ${bg}, ${border})`,
          boxShadow: `0 0 0 2px ${border}40`,
        }}
      >
        {initials(user.name)}
      </div>
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#06040F]" />
      )}
    </div>
  );
}

// ─── Profile Modal ─────────────────────────────────────────────────────────────

function ProfileModal({
  user,
  onClose,
  onSendMessage,
  chatT,
}: {
  user: ChatUser;
  onClose: () => void;
  onSendMessage: (u: ChatUser) => void;
  chatT: Record<string, string>;
}) {
  const [bg, border] = avatarColor(user.id);
  const flag = countryFlag(user.country);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)" }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm"
          style={{
            background: "#0F0A1F",
            border: "1px solid #7C3AED",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 0 40px #7C3AED30",
          }}
        >
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-[#555] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>

          {/* Avatar large */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${bg}, ${border})`, boxShadow: `0 0 0 3px ${border}60` }}
            >
              {initials(user.name)}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{user.name ?? "Founder"}</h2>
              <span className="inline-block mt-1 text-xs font-semibold bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5 rounded-full">
                Founder
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-2.5 mb-5">
            {user.country && (
              <div className="flex items-center gap-2 text-sm text-[#E8E6FF]">
                <span className="text-base">{flag}</span>
                <span>{user.country}</span>
              </div>
            )}
            {user.createdAt && (
              <div className="flex items-center gap-2 text-sm text-[#8B7CF8]">
                <span>📅</span>
                <span>{chatT.member_since} {daysAgo(user.createdAt)}</span>
              </div>
            )}
            {user.company && (
              <div className="flex items-center gap-2 text-sm text-[#E8E6FF]">
                <span>🚀</span>
                <span className="font-medium">{user.company}</span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 text-center bg-[#1A1040] border border-[#2D1B69]/50 rounded-xl py-2.5 px-1">
              <p className="text-lg font-bold text-[#C9A84C]">{user.streakDays ?? 0}</p>
              <p className="text-[10px] text-[#8B7CF8] mt-0.5">🔥 {chatT.streak_days}</p>
            </div>
            <div className="flex-1 text-center bg-[#1A1040] border border-[#2D1B69]/50 rounded-xl py-2.5 px-1">
              <p className="text-lg font-bold text-[#C9A84C]">—</p>
              <p className="text-[10px] text-[#8B7CF8] mt-0.5">💬 {chatT.messages_sent}</p>
            </div>
            <div className="flex-1 text-center bg-[#1A1040] border border-[#2D1B69]/50 rounded-xl py-2.5 px-1">
              <p className="text-lg font-bold text-[#C9A84C]">—</p>
              <p className="text-[10px] text-[#8B7CF8] mt-0.5">⚡ {chatT.tools_used}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => { onSendMessage(user); onClose(); }}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-[#06040F] transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #C9A84C, #E8C97A)" }}
            >
              {chatT.send_message}
            </button>
            <a
              href="/dashboard/leaderboard"
              className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all hover:opacity-90"
              style={{ background: "rgba(124,58,237,0.2)", color: "#A855F7", border: "1px solid #7C3AED40" }}
            >
              {chatT.view_leaderboard}
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Reactions Bar ─────────────────────────────────────────────────────────────

function ReactionsBar({
  reactions, myId, messageId, onToggle,
}: {
  reactions: Record<string, string[]>;
  myId: string;
  messageId: string;
  onToggle: (id: string, emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(reactions).filter(([, u]) => u.length > 0);
  if (entries.length === 0 && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] text-[#555] hover:text-[#8B7CF8] transition-colors mt-0.5 px-1"
      >
        +
      </button>
    );
  }
  return (
    <div className="flex items-center flex-wrap gap-1 mt-1">
      {entries.map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onToggle(messageId, emoji)}
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all",
            users.includes(myId)
              ? "bg-[#C9A84C]/20 border-[#C9A84C]/60 text-white"
              : "bg-[#1A1040] border-[#2D1B69]/50 text-[#8B7CF8] hover:border-[#7C3AED]/50"
          )}
          title={users.join(", ")}
        >
          <span>{emoji}</span>
          <span>{users.length}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs px-2 py-0.5 rounded-full border border-[#2D1B69]/50 bg-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/50 transition-all"
        >
          +
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.1 }}
              className="absolute bottom-full mb-1 left-0 z-20 flex gap-1 bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-1.5 shadow-xl"
            >
              {QUICK_REACTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => { onToggle(messageId, e); setOpen(false); }}
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

// ─── Message Context Menu ───────────────────────────────────────────────────────

function MessageMenu({
  isMine,
  onDelete,
  onCopy,
  onReply,
  onClose,
}: {
  isMine: boolean;
  onDelete?: () => void;
  onCopy: () => void;
  onReply: () => void;
  onClose: () => void;
  chatT: Record<string, string>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.1 }}
      className="absolute z-30 min-w-[140px] rounded-xl overflow-hidden shadow-2xl"
      style={{ background: "#0F0A1F", border: "1px solid #2D1B69" }}
      onMouseLeave={onClose}
    >
      <button
        onClick={() => { onReply(); onClose(); }}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#E8E6FF] hover:bg-[#1A1040] transition-colors text-left"
      >
        ↩️ <span>Reply</span>
      </button>
      <button
        onClick={() => { onCopy(); onClose(); }}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#E8E6FF] hover:bg-[#1A1040] transition-colors text-left"
      >
        📋 <span>Copy text</span>
      </button>
      {isMine && onDelete && (
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-[#1A1040] transition-colors text-left"
        >
          🗑️ <span>Delete message</span>
        </button>
      )}
    </motion.div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  onConfirm,
  onCancel,
  chatT,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  chatT: Record<string, string>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="mt-1 flex items-center gap-2 text-xs bg-[#1A1040] border border-red-500/30 rounded-xl px-3 py-2"
    >
      <span className="text-[#E8E6FF]">{chatT.confirm_delete}</span>
      <button onClick={onConfirm} className="text-red-400 font-semibold hover:text-red-300 transition-colors">{chatT.yes_delete}</button>
      <button onClick={onCancel} className="text-[#555] hover:text-[#8B7CF8] transition-colors">{chatT.cancel}</button>
    </motion.div>
  );
}

// ─── Reply Quote ───────────────────────────────────────────────────────────────

function ReplyQuote({ msg }: { msg: ChatMessage }) {
  return (
    <div className="mb-1 px-2 py-1 rounded-lg border-l-2 border-[#C9A84C] bg-[#1A1040]/60 max-w-full overflow-hidden">
      <p className="text-[10px] font-semibold text-[#C9A84C] mb-0.5">{msg.user.name ?? "Founder"}</p>
      <p className="text-xs text-[#8B7CF8] italic truncate">{msg.message.slice(0, 60)}{msg.message.length > 60 ? "…" : ""}</p>
    </div>
  );
}

// ─── Bubble ─────────────────────────────────────────────────────────────────────

function Bubble({
  msg, isMine, showHeader, myId, onToggleReaction, onAvatarClick,
  onReply, onDelete, searchQuery, replyMsg, chatT,
}: {
  msg: ChatMessage;
  isMine: boolean;
  showHeader: boolean;
  myId: string;
  onToggleReaction: (id: string, emoji: string) => void;
  onAvatarClick: (u: ChatUser) => void;
  onReply: (m: ChatMessage) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  replyMsg?: ChatMessage;
  chatT: Record<string, string>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(true);
  };

  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => setMenuOpen(true), 500);
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  const copyText = () => {
    navigator.clipboard.writeText(msg.message).catch(() => {});
  };

  if (msg.isDeleted) {
    return (
      <div className={cn("flex gap-3", isMine ? "flex-row-reverse" : "flex-row")}>
        {!isMine && <div className="w-9 flex-shrink-0" />}
        <p className="text-xs italic text-[#555] px-2 py-1">{chatT.message_deleted}</p>
      </div>
    );
  }

  if (msg.messageType === "sticker") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}
      >
        <span className="text-xs text-[#8B7CF8]/60 px-1">{isMine ? "You" : (msg.user.name ?? "Founder")}</span>
        <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.4, delay: 0.1 }} className="text-5xl select-none">
          {msg.message}
        </motion.div>
        <ReactionsBar reactions={msg.reactions} myId={myId} messageId={msg.id} onToggle={onToggleReaction} />
      </motion.div>
    );
  }

  const flag = countryFlag(msg.user.country);
  const menuSide = isMine ? "right-0" : "left-0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3", isMine ? "flex-row-reverse" : "flex-row")}
    >
      {!isMine && (
        <Avatar user={msg.user} size={36} onClick={() => onAvatarClick(msg.user)} />
      )}

      <div className={cn("max-w-[72%] space-y-0.5 relative", isMine && "items-end flex flex-col")}>
        {showHeader && !isMine && (
          <div className="flex items-center gap-2 px-1">
            <button onClick={() => onAvatarClick(msg.user)} className="text-xs font-semibold text-white hover:underline">
              {msg.user.name ?? "Founder"}
            </button>
            <span className="text-[10px] bg-[#7C3AED]/30 text-[#A855F7] px-1.5 py-0.5 rounded font-medium">Founder</span>
            <span className="text-base leading-none">{flag}</span>
          </div>
        )}

        {/* Reply quote if applicable */}
        {replyMsg && <ReplyQuote msg={replyMsg} />}

        {/* Bubble */}
        <div
          className="relative"
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed cursor-default select-text",
              isMine
                ? "bg-[#7C3AED] text-white rounded-tr-sm"
                : "bg-[#1A1040] text-[#E8E6FF] border border-[#2D1B69]/50 rounded-tl-sm"
            )}
          >
            {searchQuery
              ? highlight(msg.message, searchQuery)
              : msg.message}
          </div>

          {/* Context menu */}
          <AnimatePresence>
            {menuOpen && (
              <div className={cn("absolute top-full mt-1", menuSide)}>
                <MessageMenu
                  isMine={isMine}
                  onDelete={isMine ? () => setConfirmDelete(true) : undefined}
                  onCopy={copyText}
                  onReply={() => onReply(msg)}
                  onClose={() => setMenuOpen(false)}
                  chatT={chatT}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        <span className={cn("text-[10px] text-[#555] px-1 group-hover:opacity-100", isMine && "text-right")}>
          {timeLabel(msg.createdAt)}
        </span>

        <ReactionsBar reactions={msg.reactions} myId={myId} messageId={msg.id} onToggle={onToggleReaction} />

        {/* Delete confirmation */}
        <AnimatePresence>
          {confirmDelete && (
            <DeleteConfirm
              onConfirm={() => { onDelete(msg.id); setConfirmDelete(false); }}
              onCancel={() => setConfirmDelete(false)}
              chatT={chatT}
            />
          )}
        </AnimatePresence>
      </div>

      {isMine && (
        <Avatar user={msg.user} size={36} />
      )}
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function FoundersChatPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const myId = session?.user?.id ?? "";
  const chatT = (t as unknown as { chat: Record<string, string> }).chat;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Reply
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  // Profile modal
  const [profileUser, setProfileUser] = useState<ChatUser | null>(null);

  // New messages button
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  // Pagination
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/chat${params.toString() ? `?${params}` : ""}`);
      if (!res.ok) return;
      const data = await res.json();
      const msgs: ChatMessage[] = data.messages ?? [];
      if (!silent) setLoading(false);
      setOnlineCount(data.onlineCount ?? 1);
      setHasMore(msgs.length >= 50);

      if (msgs.length !== lastCountRef.current) {
        const wasAtBottom = atBottom;
        lastCountRef.current = msgs.length;
        setMessages(msgs);
        if (wasAtBottom || !silent) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        } else {
          setShowNewMsg(true);
        }
      } else if (!silent) {
        setMessages(msgs);
      }
    } catch {
      if (!silent) setLoading(false);
    }
  }, [searchQuery, atBottom]);

  useEffect(() => { fetchMessages(false); }, [fetchMessages]);
  useEffect(() => {
    if (!searchQuery) {
      const id = setInterval(() => fetchMessages(true), 3000);
      return () => clearInterval(id);
    }
  }, [fetchMessages, searchQuery]);

  // ── Scroll tracking ──────────────────────────────────────────────────────────

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(bottom);
    if (bottom) setShowNewMsg(false);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMsg(false);
  };

  // ── Load more ────────────────────────────────────────────────────────────────

  const loadMore = async () => {
    if (!messages.length || loadingMore) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0].createdAt;
      const res = await fetch(`/api/chat?before=${encodeURIComponent(oldest)}`);
      if (!res.ok) return;
      const data = await res.json();
      const older: ChatMessage[] = data.messages ?? [];
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length >= 50);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Send ─────────────────────────────────────────────────────────────────────

  const handleSend = async (opts?: { messageType?: string; stickerId?: string; message?: string }) => {
    const text = opts?.message ?? input.trim();
    if (!text || sending) return;
    if (!opts?.message) setInput("");
    setSending(true);
    setStickerOpen(false);
    setEmojiOpen(false);

    localStorage.setItem("quantum-chat-welcomed", "1");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messageType: opts?.messageType ?? "text",
          stickerId: opts?.stickerId ?? null,
          replyToId: replyTo?.id ?? null,
        }),
      });
      if (res.ok) {
        setReplyTo(null);
        await fetchMessages(true);
        lastCountRef.current = 0; // force scroll
        await fetchMessages(true);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSendSticker = (s: (typeof STICKERS)[number]) => {
    handleSend({ messageType: "sticker", stickerId: s.id, message: s.emoji });
  };

  // ── Reactions ────────────────────────────────────────────────────────────────

  const handleToggleReaction = async (messageId: string, emoji: string) => {
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

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isDeleted: true } : m));
    await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", messageId }),
    });
  };

  // ── Keys ─────────────────────────────────────────────────────────────────────

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setReplyTo(null);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const welcomed = typeof window !== "undefined" ? localStorage.getItem("quantum-chat-welcomed") : "1";
  const userHasSentMessage = messages.some((m) => m.userId === myId);
  const showWelcomeBanner = !welcomed && !userHasSentMessage;
  const filteredMessages = searchQuery
    ? messages.filter((m) => m.message.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;
  const msgMap = Object.fromEntries(messages.map((m) => [m.id, m]));

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#06040F]">
      {/* ── Pinned Message ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-4 py-2 border-b text-xs"
        style={{ background: "#0A0720", borderColor: "#C9A84C30" }}
      >
        <Pin className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
        <span className="text-[#C9A84C] font-semibold mr-1">{chatT?.pinned_message ?? "Pinned message"}</span>
        <span className="text-[#8B7CF8]/70 truncate">{PINNED_MESSAGE}</span>
      </motion.div>

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSearchOpen((o) => !o); if (searchOpen) setSearchQuery(""); }}
            className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", searchOpen ? "bg-[#7C3AED]/30 text-[#A855F7]" : "text-[#555] hover:text-white")}
          >
            <Search className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-[#C9A84C]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse inline-block" />
            <span className="font-semibold">{onlineCount} {chatT?.online_now ?? "online"}</span>
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-b border-[#1A1040] bg-[#0F0A1F] flex-shrink-0"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <Search className="w-4 h-4 text-[#555] flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={chatT?.search_messages ?? "Search messages..."}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#444] outline-none"
              />
              {searchQuery && (
                <span className="text-[10px] text-[#8B7CF8]">
                  {filteredMessages.length} {chatT?.results_found ?? "results"}
                </span>
              )}
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-[#555] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {/* Load more */}
        {hasMore && !searchQuery && (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-[#8B7CF8] hover:text-white border border-[#2D1B69]/50 rounded-full px-4 py-1.5 transition-colors"
            >
              {loadingMore ? "Loading…" : (chatT?.load_earlier ?? "Load earlier messages")}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#7C3AED]/20 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6 text-[#7C3AED] animate-pulse" />
              </div>
              <p className="text-sm text-[#8B7CF8]">Loading messages…</p>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            {searchQuery ? (
              <div className="text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-sm text-[#8B7CF8]">{chatT?.no_results ?? "No messages found"}</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 max-w-xs px-4"
              >
                {/* Floating rocket */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="text-6xl"
                  style={{ filter: "drop-shadow(0 0 12px #C9A84C60)" }}
                >
                  🚀
                </motion.div>
                <h3 className="text-lg font-bold text-white">{chatT?.welcome_title ?? "Welcome to Founders Chat"}</h3>
                <p className="text-sm text-[#8B7CF8]/80 leading-relaxed">
                  {chatT?.welcome_sub ?? "You are one of the first founders here."}<br />
                  {chatT?.welcome_cta ?? "Say hello to the community 👋"}
                </p>
                <button
                  onClick={() => {
                    const name = session?.user?.name ?? "founder";
                    const company = (session?.user as Record<string, unknown>)?.company as string ?? "my startup";
                    setInput(`Hey founders! 👋 I'm ${name} building ${company}. Excited to be here!`);
                    inputRef.current?.focus();
                  }}
                  className="px-6 py-3 rounded-2xl font-bold text-sm text-[#06040F] transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #E8C97A)" }}
                >
                  {chatT?.say_hello ?? "Say Hello 👋"}
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <>
            {showWelcomeBanner && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                <div className="bg-[#1A1040]/60 border border-[#2D1B69]/40 text-[#8B7CF8] text-sm text-center rounded-2xl px-5 py-3 max-w-sm leading-relaxed">
                  Welcome to Founders Chat 🚀 — You&apos;re now part of a global community of founders. Be kind. Share openly. Build together.
                </div>
              </motion.div>
            )}
            <AnimatePresence initial={false}>
              {filteredMessages.map((msg, i) => {
                const prev = filteredMessages[i - 1];
                const showHeader =
                  !prev || prev.userId !== msg.userId ||
                  new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
                const replyMsg = msg.replyToId ? msgMap[msg.replyToId] : undefined;
                return (
                  <Bubble
                    key={msg.id}
                    msg={msg}
                    isMine={msg.userId === myId}
                    showHeader={showHeader}
                    myId={myId}
                    onToggleReaction={handleToggleReaction}
                    onAvatarClick={(u) => setProfileUser(u)}
                    onReply={(m) => { setReplyTo(m); inputRef.current?.focus(); }}
                    onDelete={handleDelete}
                    searchQuery={searchQuery}
                    replyMsg={replyMsg}
                    chatT={chatT ?? {}}
                  />
                );
              })}
            </AnimatePresence>
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── New messages button ── */}
      <AnimatePresence>
        {showNewMsg && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
          >
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-xl transition-all"
              style={{ background: "#7C3AED", color: "white" }}
            >
              <ChevronDown className="w-4 h-4" />
              {chatT?.new_messages ?? "New messages ↓"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reply bar ── */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-t flex-shrink-0"
            style={{ borderColor: "#C9A84C40", background: "#0A0720" }}
          >
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-0.5 h-8 rounded-full bg-[#C9A84C] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#C9A84C]">{chatT?.replying_to ?? "Replying to"} {replyTo.user.name ?? "Founder"}</p>
                <p className="text-xs text-[#555] truncate">{replyTo.message.slice(0, 60)}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-[#555] hover:text-white transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ── Emoji Picker ── */}
      <AnimatePresence>
        {emojiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-2 bg-[#0F0A1F] border-t border-[#1A1040] flex-shrink-0"
          >
            <div className="flex flex-wrap gap-1.5 pt-3 pb-1">
              {COMMON_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { setInput((v) => v + e); setEmojiOpen(false); inputRef.current?.focus(); }}
                  className="text-xl hover:scale-125 transition-transform w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#1A1040]"
                >
                  {e}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Bar ── */}
      <div className="px-4 py-3 border-t border-[#1A1040] bg-[#0F0A1F] flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#06040F] border border-[#1A1040] rounded-2xl px-3 py-2.5 focus-within:border-[#7C3AED]/50 transition-colors">
          {/* Emoji toggle */}
          <button
            onClick={() => { setEmojiOpen((o) => !o); setStickerOpen(false); }}
            className={cn("text-lg flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all", emojiOpen ? "bg-[#7C3AED]/30 text-[#A855F7]" : "text-[#555] hover:text-[#8B7CF8]")}
            title="Emoji"
          >
            😊
          </button>

          {/* Sticker toggle */}
          <button
            onClick={() => { setStickerOpen((o) => !o); setEmojiOpen(false); }}
            className={cn("text-lg flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all", stickerOpen ? "bg-[#7C3AED]/30 text-[#A855F7]" : "text-[#555] hover:text-[#8B7CF8]")}
            title="Stickers"
          >
            🎭
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            onKeyDown={handleKey}
            placeholder="Message founders..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#444] outline-none"
          />

          {/* Char counter */}
          {input.length > 400 && (
            <span className={cn("text-[10px] flex-shrink-0", input.length >= 500 ? "text-red-400" : "text-[#8B7CF8]")}>
              {500 - input.length}
            </span>
          )}

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
        {input.length <= 400 && (
          <p className="text-[10px] text-[#333] text-center mt-1.5">Press Enter to send</p>
        )}
      </div>

      {/* ── Profile Modal ── */}
      <AnimatePresence>
        {profileUser && (
          <ProfileModal
            user={profileUser}
            onClose={() => setProfileUser(null)}
            onSendMessage={(u) => {
              setInput(`@${u.name ?? "Founder"} `);
              inputRef.current?.focus();
            }}
            chatT={chatT ?? {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
