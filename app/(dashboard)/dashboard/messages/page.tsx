"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, Search } from "lucide-react";

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  otherUser: { id: string; name: string; image?: string } | null;
  lastMessage: { content: string; created_at: string; sender_id: string } | null;
  unreadCount: number;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) setConversations(await res.json());
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-text-secondary mt-1">Direct messages with other members.</p>
      </motion.div>

      {/* Search to start new conversation */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members to message..."
          className="w-full bg-[#111111] border border-[#1a1a1a] rounded pl-9 pr-4 py-2.5 text-sm text-white placeholder-text-secondary focus:outline-none focus:border-gold/40 transition-colors"
        />
      </div>

      {/* Conversations list */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-text-secondary" />
          </div>
          <p className="text-text-secondary text-sm">No conversations yet. Search for a member to start chatting.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => router.push(`/dashboard/messages/${conv.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded hover:bg-[#111111] transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-sm font-semibold text-gold flex-shrink-0">
                  {conv.otherUser?.name ? getInitials(conv.otherUser.name) : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">{conv.otherUser?.name || "Unknown"}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {conv.unreadCount > 0 && (
                        <span className="text-xs bg-gold text-[#080808] font-semibold px-1.5 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                      <span className="text-xs text-text-secondary">{timeAgo(conv.last_message_at)}</span>
                    </div>
                  </div>
                  {conv.lastMessage && (
                    <p className="text-xs text-text-secondary truncate mt-0.5">{conv.lastMessage.content}</p>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
