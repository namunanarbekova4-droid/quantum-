"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/i18n";

interface DM {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DMPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const [messages, setMessages] = useState<DM[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [otherName, setOtherName] = useState("Conversation");

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages();
    setupRealtime();
    return () => { channelRef.current?.unsubscribe(); };
  }, [conversationId]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (res.ok) {
        const data: DM[] = await res.json();
        setMessages(data);
        if (data.length > 0) {
          const other = data.find((m) => m.sender_id !== session?.user?.id);
          if (other) setOtherName(other.sender_name);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase.channel(`dm:${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as DM;
        if (newMsg.sender_id !== session?.user?.id) {
          setMessages((prev) => prev.find((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
          if (!otherName || otherName === "Conversation") setOtherName(newMsg.sender_name);
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

    const optimistic: DM = {
      id: `opt-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: session?.user?.id || "",
      sender_name: session?.user?.name || "You",
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] bg-[#080808] flex-shrink-0">
        <button onClick={() => router.back()} className="p-1.5 rounded hover:bg-[#111111] transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-semibold text-gold">
          {getInitials(otherName)}
        </div>
        <h1 className="text-sm font-semibold text-white">{otherName}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-text-secondary">
            {t.messages.noMessagesYet}
          </div>
        ) : messages.map((msg, i) => {
          const isOwn = msg.sender_id === session?.user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.01, 0.15) }}
              className={cn("flex gap-2.5", isOwn && "flex-row-reverse")}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                isOwn ? "bg-gold/20 text-gold" : "bg-[#1a1a1a] text-white"
              )}>
                {getInitials(msg.sender_name)}
              </div>
              <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
                <div className="flex items-center gap-2 mb-1">
                  {!isOwn && <span className="text-xs font-medium text-white">{msg.sender_name}</span>}
                  <span className="text-xs text-text-secondary">{formatTime(msg.created_at)}</span>
                </div>
                <div className={cn(
                  "px-3 py-2 rounded text-sm text-white",
                  isOwn ? "bg-gold/15 border border-gold/20" : "bg-[#111111] border border-[#1a1a1a]"
                )}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          );
        })}
        {typingUsers.length > 0 && (
          <div className="text-xs text-text-secondary italic px-2">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? t.messages.isTyping : t.messages.areTyping} {t.messages.typingSuffix}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[#1a1a1a] bg-[#080808] flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder={t.messages.typeMessage}
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
