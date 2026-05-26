"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockRooms, mockDecisions } from "@/data/mock";
import { RiskGauge } from "@/components/ui/RiskGauge";
import Link from "next/link";

const roomMessages = [
  { id: 1, user: "Jordan Mehta", initials: "JM", content: "I've run the Series A analysis. The risk score is 44 — lower than I expected given market conditions.", time: "2:30 PM", isMe: false },
  { id: 2, user: "You", initials: "A", content: "Agreed. The recommendation is conditional — I think we need to close 2 more deals first to improve the metrics.", time: "2:32 PM", isMe: true },
  { id: 3, user: "Lisa Park", initials: "LP", content: "The confidence level at 77% makes sense. Waiting for the $800K pipeline to close is the right call.", time: "2:35 PM", isMe: false },
  { id: 4, user: "Jordan Mehta", initials: "JM", content: "Should we schedule the kickoff for the data room preparation? I think 3 weeks is doable.", time: "2:38 PM", isMe: false },
];

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const room = mockRooms.find((r) => r.id === id) ?? mockRooms[0];
  const sharedDecision = mockDecisions[4];
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(roomMessages);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages((prev) => [...prev, { id: prev.length + 1, user: "You", initials: "A", content: message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isMe: true }]);
    setMessage("");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#1a1a1a]">
        <Link href="/dashboard/rooms">
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Rooms</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-white">{room.name}</h1>
          <p className="text-xs text-text-secondary">{room.topic}</p>
        </div>
        <div className="flex items-center gap-2">
          {room.participants.map((p) => (
            <div key={p} className="w-7 h-7 bg-gold/20 border border-gold/30 rounded-full flex items-center justify-center text-xs font-bold text-gold" title={p}>
              {p.charAt(0)}
            </div>
          ))}
          <Badge variant="success">{room.participants.length} online</Badge>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-[#1a1a1a]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} gap-3`}>
                {!msg.isMe && (
                  <div className="w-7 h-7 bg-[#1a1a1a] rounded-full flex items-center justify-center text-xs font-bold text-text-secondary flex-shrink-0 mt-0.5">{msg.initials}</div>
                )}
                <div className={`max-w-[75%]`}>
                  {!msg.isMe && <p className="text-xs text-text-secondary mb-1">{msg.user}</p>}
                  <div className={`px-3 py-2.5 rounded-lg text-sm ${msg.isMe ? "bg-gold/10 border border-gold/20 text-white" : "bg-[#161616] border border-[#1a1a1a] text-text-secondary"}`}>
                    {msg.content}
                  </div>
                  <p className="text-xs text-text-muted mt-1 text-right">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-[#1a1a1a] flex gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Send a message..."
              className="flex-1 h-10 px-3 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 placeholder:text-[#444444] transition-all duration-200"
            />
            <Button size="sm" onClick={sendMessage} disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="w-80 flex-shrink-0 p-4 overflow-y-auto">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Shared Analysis</p>
          <Card className="p-4">
            <p className="text-xs text-text-secondary mb-3 leading-snug">{sharedDecision.title}</p>
            <div className="flex items-center justify-center py-4">
              <RiskGauge score={sharedDecision.riskScore} size="md" />
            </div>
            <div className="border-t border-[#1a1a1a] pt-3 mt-3">
              <Badge variant={sharedDecision.recommendation === "YES" ? "success" : sharedDecision.recommendation === "NO" ? "danger" : "warning"}>
                {sharedDecision.recommendation}
              </Badge>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed line-clamp-4">{(sharedDecision.report as { summary?: string })?.summary}</p>
            </div>
            <Link href={`/dashboard/decision/${sharedDecision.id}`}>
              <Button size="sm" variant="outline" className="w-full mt-3 gap-2">
                <BarChart2 className="w-3.5 h-3.5" /> View Full Analysis
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
