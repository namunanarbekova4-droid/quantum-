"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Lock, ChevronRight, Crown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  is_vip: boolean;
  member_count: number;
  isMember: boolean;
}

export default function CommunityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community/groups");
      if (res.ok) setGroups(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    if (joining) return;
    setJoining(group.id);
    try {
      const action = group.isMember ? "leave" : "join";
      const res = await fetch(`/api/community/groups/${group.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast(group.isMember ? `Left ${group.name}` : `Joined ${group.name}!`, "success");
        await fetchGroups();
      }
    } finally {
      setJoining(null);
    }
  };

  const publicGroups = groups.filter((g) => !g.is_vip);
  const vipGroups = groups.filter((g) => g.is_vip);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Community</h1>
        <p className="text-text-secondary mt-1">Connect with founders, investors, and executives.</p>
      </motion.div>

      <Section title="Open Communities" groups={publicGroups} joining={joining} onJoin={handleJoin} onNavigate={(id) => router.push(`/dashboard/community/${id}`)} />
      <Section title="VIP Communities" groups={vipGroups} joining={joining} onJoin={handleJoin} onNavigate={(id) => router.push(`/dashboard/community/${id}`)} vip />
    </div>
  );
}

function Section({
  title, groups, joining, onJoin, onNavigate, vip = false,
}: {
  title: string;
  groups: Group[];
  joining: string | null;
  onJoin: (e: React.MouseEvent, g: Group) => void;
  onNavigate: (id: string) => void;
  vip?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {vip && <Crown className="w-4 h-4 text-gold" />}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className="text-xs text-text-secondary bg-[#1a1a1a] px-2 py-0.5 rounded">{groups.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group, i) => (
          <GroupCard key={group.id} group={group} index={i} joining={joining} onJoin={onJoin} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function GroupCard({
  group, index, joining, onJoin, onNavigate,
}: {
  group: Group;
  index: number;
  joining: string | null;
  onJoin: (e: React.MouseEvent, g: Group) => void;
  onNavigate: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className={cn(
          "p-5 cursor-pointer hover:border-gold/30 transition-all duration-200 group relative",
          group.isMember && "border-gold/20"
        )}
        onClick={() => onNavigate(group.id)}
      >
        {group.is_vip && (
          <div className="absolute top-3 right-3">
            <Lock className="w-3.5 h-3.5 text-gold" />
          </div>
        )}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded bg-gold/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-gold" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white group-hover:text-gold transition-colors truncate">{group.name}</h3>
            <span className="text-xs text-text-secondary">{group.category}</span>
          </div>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed mb-4 line-clamp-2">{group.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <Users className="w-3 h-3" />
            <span>{group.member_count.toLocaleString()} members</span>
          </div>
          <button
            onClick={(e) => onJoin(e, group)}
            disabled={joining === group.id}
            className={cn(
              "text-xs px-3 py-1.5 rounded border transition-all duration-200 font-medium",
              group.isMember
                ? "border-[#2a2a2a] text-text-secondary hover:border-danger/40 hover:text-danger"
                : "border-gold/40 text-gold hover:bg-gold/10"
            )}
          >
            {joining === group.id ? "..." : group.isMember ? "Leave" : "Join"}
          </button>
        </div>
        {group.isMember && (
          <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
            <span className="text-xs text-gold">Member</span>
            <ChevronRight className="w-3 h-3 text-text-secondary" />
          </div>
        )}
      </Card>
    </motion.div>
  );
}
