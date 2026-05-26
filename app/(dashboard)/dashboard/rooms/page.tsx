"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Lock, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { mockRooms } from "@/data/mock";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default function RoomsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomTopic, setRoomTopic] = useState("");

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Private Decision Rooms</h1>
          <p className="text-text-secondary mt-1">Your confidential space for collaborative decisions.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Room
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockRooms.map((room) => (
          <Link key={room.id} href={`/dashboard/rooms/${room.id}`}>
            <Card hover className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">{room.name}</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-snug">{room.topic}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Users className="w-3.5 h-3.5" /> {room.participants.length} members
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <MessageSquare className="w-3.5 h-3.5" /> {room.messageCount} messages
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-text-secondary">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(room.lastActivity)}</span>
                  </div>
                </div>
                <Badge variant="success">{room.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </motion.div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Private Room" size="sm">
        <div className="p-6 space-y-4">
          <Input label="Room Name" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. Q3 Strategic Planning" />
          <Input label="Topic (optional)" value={roomTopic} onChange={(e) => setRoomTopic(e.target.value)} placeholder="e.g. Expansion strategy review" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Privacy Level</label>
            <select className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200">
              <option>Invite Only</option>
              <option>Team Access</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => setCreateOpen(false)} disabled={!roomName.trim()} className="flex-1">Create Room</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
