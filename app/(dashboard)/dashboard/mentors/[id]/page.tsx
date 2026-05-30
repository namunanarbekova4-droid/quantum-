"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MessageSquare, Activity, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Mentor {
  id: string;
  full_name: string;
  expertise: string;
  industry: string;
  years_experience: number;
  session_count: number;
  response_rate: number;
  biography: string;
  why_mentor: string;
  linkedin_url: string;
  avgRating: number;
  reviewCount: number;
  reviews: Review[];
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn(cls, s <= Math.round(rating) ? "text-gold fill-gold" : "text-[#333]")} />
      ))}
    </div>
  );
}

export default function MentorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMentor();
  }, [id]);

  const fetchMentor = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mentors/${id}`);
      if (res.ok) setMentor(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!mentor) return;
    setRequesting(true);
    try {
      const res = await fetch("/api/mentor-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentor_id: mentor.id, message }),
      });
      if (res.ok) {
        toast("Mentor insight request sent!", "success");
        setShowModal(false);
        setMessage("");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to send request", "error");
      }
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-text-secondary">Mentor not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Mentors
      </button>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center text-xl font-bold text-gold flex-shrink-0">
              {mentor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">{mentor.full_name}</h1>
              <p className="text-text-secondary mt-1">{mentor.expertise}</p>
              {mentor.industry && (
                <span className="inline-block mt-2 text-xs border border-[#2a2a2a] text-text-secondary px-2 py-0.5 rounded">{mentor.industry}</span>
              )}
            </div>
            <Button onClick={() => setShowModal(true)}>Request Mentor Insight</Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#1a1a1a]">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{mentor.years_experience || 0}</div>
              <div className="text-xs text-text-secondary">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{mentor.session_count}</div>
              <div className="text-xs text-text-secondary">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{mentor.response_rate}%</div>
              <div className="text-xs text-text-secondary">Response Rate</div>
            </div>
          </div>

          {mentor.avgRating > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <StarRating rating={mentor.avgRating} size="md" />
              <span className="text-sm text-white font-medium">{mentor.avgRating.toFixed(1)}</span>
              <span className="text-xs text-text-secondary">({mentor.reviewCount} review{mentor.reviewCount !== 1 ? "s" : ""})</span>
            </div>
          )}
        </Card>
      </motion.div>

      {mentor.biography && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-white mb-3">About</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{mentor.biography}</p>
        </Card>
      )}

      {mentor.why_mentor && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-white mb-3">Why I Mentor</h2>
          <p className="text-sm text-text-secondary leading-relaxed italic">&ldquo;{mentor.why_mentor}&rdquo;</p>
        </Card>
      )}

      {mentor.reviews && mentor.reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Reviews</h2>
          <div className="space-y-3">
            {mentor.reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-text-secondary">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                {review.comment && <p className="text-sm text-text-secondary">{review.comment}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Request modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Request Mentor Insight</h3>
            <p className="text-text-secondary text-sm mb-4">Send a request to <span className="text-white">{mentor.full_name}</span>. Include context about your situation.</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your situation and what insights you're looking for..."
              rows={4}
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded text-sm text-white placeholder-text-secondary px-3 py-2.5 focus:outline-none focus:border-gold/40 transition-colors resize-none mb-4"
            />
            <div className="flex items-center gap-3">
              <Button onClick={submitRequest} disabled={requesting} className="flex-1">
                {requesting ? "Sending..." : "Send Request"}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
