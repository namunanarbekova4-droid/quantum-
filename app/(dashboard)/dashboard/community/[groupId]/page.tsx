"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Lock, Users, Pin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  reactions?: { emoji: string; user_id: string }[];
}

interface Group {
  id: string;
  name: string;
  description: string;
  is_vip: boolean;
  member_count: number;
  isMember: boolean;
}

const EMOJIS = ["👍", "🔥", "💡", "🎯", "✅"];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [emojiTarget, setEmojiTarget] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!groupId) return;
    fetchGroup();
    fetchMessages();
    setupRealtime();
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const fetchGroup = async () => {
    const res = await fetch(`/api/community/groups/${groupId}`);
    if (res.ok) setGroup(await res.json());
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/groups/${groupId}/messages?limit=50`);
      if (res.ok) setMessages(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase.channel(`community:${groupId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "community_messages",
        filter: `group_id=eq.${groupId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.user_id !== session?.user?.id) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const name = payload.user_name as string;
        if (name && name !== session?.user?.name) {
          setTypingUsers((prev) => prev.includes(name) ? prev : [...prev, name]);
          setTimeout(() => setTypingUsers((prev) => prev.filter((n) => n !== name)), 3000);
        }
      })
      .subscribe();
    channelRef.current = channel;
  };

  const handleTyping = () => {
    if (!channelRef.current || !session?.user?.name) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { user_name: session.user.name } });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      group_id: groupId,
      user_id: session?.user?.id || "",
      user_name: session?.user?.name || "You",
      content,
      is_pinned: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/community/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const real = await res.json();
        setMessages((prev) => prev.map((m) => m.id === optimistic.id ? real : m));
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const pinned = messages.filter((m) => m.is_pinned);

  if (!group && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-secondary">Group not found.</p>
      </div>
    );
  }

  if (group?.is_vip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-gold" />
        </div>
        <h2 className="text-xl font-bold text-white">VIP Community</h2>
        <p className="text-text-secondary max-w-sm">This community is available to Max & Premium plan members. Upgrade to unlock access.</p>
        <Button onClick={() => router.push("/pricing")}>Upgrade to Max</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] bg-[#080808] flex-shrink-0">
        <button onClick={() => router.back()} className="p-1.5 rounded hover:bg-[#111111] transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">{group?.name || "Loading..."}</h1>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Users className="w-3 h-3" />
            <span>{group?.member_count || 0} members</span>
          </div>
        </div>
      </div>

      {/* Pinned messages */}
      {pinned.length > 0 && (
        <div className="border-b border-[#1a1a1a] bg-[#0d0d0d] flex-shrink-0">
          <button
            onClick={() => setPinnedOpen((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 w-full text-left"
          >
            <Pin className="w-3 h-3 text-gold" />
            <span className="text-xs text-gold font-medium">{pinned.length} pinned message{pinned.length > 1 ? "s" : ""}</span>
            <ChevronDown className={cn("w-3 h-3 text-text-secondary ml-auto transition-transform", !pinnedOpen && "-rotate-90")} />
          </button>
          <AnimatePresence>
            {pinnedOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                {pinned.map((m) => (
                  <div key={m.id} className="px-4 py-2 text-xs text-text-secondary border-t border-[#1a1a1a]">
                    <span className="text-gold font-medium">{m.user_name}: </span>{m.content}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center">
              <Users className="w-5 h-5 text-text-secondary" />
            </div>
            <p className="text-text-secondary text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.user_id === session?.user?.id}
              showEmojiPicker={emojiTarget === msg.id}
              onEmojiToggle={() => setEmojiTarget((prev) => prev === msg.id ? null : msg.id)}
              index={i}
            />
          ))
        )}
        {typingUsers.length > 0 && (
          <div className="text-xs text-text-secondary italic px-2">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1a1a1a] bg-[#080808] flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-[#111111] border border-[#1a1a1a] rounded text-sm text-white placeholder-text-secondary px-3 py-2.5 focus:outline-none focus:border-gold/40 transition-colors max-h-32"
            style={{ minHeight: 42 }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded bg-gold text-[#080808] hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, isOwn, showEmojiPicker, onEmojiToggle, index }: {
  msg: Message;
  isOwn: boolean;
  showEmojiPicker: boolean;
  onEmojiToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.2) }}
      className={cn("flex gap-2.5 group", isOwn && "flex-row-reverse")}
    >
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
        isOwn ? "bg-gold/20 text-gold" : "bg-[#1a1a1a] text-white"
      )}>
        {getInitials(msg.user_name)}
      </div>
      <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
        <div className="flex items-center gap-2 mb-1">
          {!isOwn && <span className="text-xs font-medium text-white">{msg.user_name}</span>}
          <span className="text-xs text-text-secondary">{formatTime(msg.created_at)}</span>
        </div>
        <div className={cn(
          "px-3 py-2 rounded text-sm text-white leading-relaxed",
          isOwn ? "bg-gold/15 border border-gold/20" : "bg-[#111111] border border-[#1a1a1a]"
        )}>
          {msg.content}
        </div>
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEmojiToggle} className="text-xs text-text-secondary hover:text-white px-1 py-0.5 rounded hover:bg-[#1a1a1a]">
            +😊
          </button>
          {showEmojiPicker && (
            <div className="flex gap-1 bg-[#111111] border border-[#1a1a1a] rounded px-2 py-1">
              {EMOJIS.map((e) => (
                <button key={e} className="text-sm hover:scale-125 transition-transform" onClick={onEmojiToggle}>{e}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
