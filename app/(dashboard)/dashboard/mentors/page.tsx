"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, Star, ChevronRight, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Mentor {
  id: string;
  full_name: string;
  expertise: string;
  industry: string;
  years_experience: number;
  session_count: number;
  response_rate: number;
  avgRating: number;
  reviewCount: number;
  biography: string;
}

const INDUSTRIES = ["All", "Technology", "Finance", "Healthcare", "Real Estate", "Energy", "Other"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn("w-3 h-3", s <= Math.round(rating) ? "text-gold fill-gold" : "text-[#333]")} />
      ))}
      <span className="text-xs text-text-secondary ml-1">{rating > 0 ? rating.toFixed(1) : "New"}</span>
    </div>
  );
}

export default function MentorsPage() {
  const router = useRouter();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState("All");

  useEffect(() => {
    fetchMentors();
  }, [industry]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const url = industry && industry !== "All" ? `/api/mentors?industry=${encodeURIComponent(industry)}` : "/api/mentors";
      const res = await fetch(url);
      if (res.ok) setMentors(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Mentor Connect</h1>
          <p className="text-text-secondary mt-1">Get insights from experienced operators and investors.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/mentors/apply")}>
          Become a Mentor
        </Button>
      </motion.div>

      {/* Industry filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
        {INDUSTRIES.map((ind) => (
          <button
            key={ind}
            onClick={() => setIndustry(ind)}
            className={cn(
              "text-xs px-3 py-1.5 rounded border transition-all",
              industry === ind ? "border-gold/40 text-gold bg-gold/10" : "border-[#1a1a1a] text-text-secondary hover:border-[#2a2a2a] hover:text-white"
            )}
          >
            {ind}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mentors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-text-secondary" />
          </div>
          <p className="text-white font-medium">No mentors available yet</p>
          <p className="text-text-secondary text-sm">Be the first to apply as a mentor.</p>
          <Button onClick={() => router.push("/dashboard/mentors/apply")}>Apply as Mentor</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor, i) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="p-5 hover:border-gold/30 transition-all cursor-pointer group"
                onClick={() => router.push(`/dashboard/mentors/${mentor.id}`)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-sm font-bold text-gold flex-shrink-0">
                    {mentor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-gold transition-colors truncate">{mentor.full_name}</h3>
                    <p className="text-xs text-text-secondary truncate">{mentor.expertise}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <StarRating rating={mentor.avgRating} />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-[#0d0d0d] rounded p-2 text-center">
                    <div className="text-sm font-bold text-white">{mentor.years_experience || 0}</div>
                    <div className="text-xs text-text-secondary">Years Exp.</div>
                  </div>
                  <div className="bg-[#0d0d0d] rounded p-2 text-center">
                    <div className="text-sm font-bold text-white">{mentor.session_count}</div>
                    <div className="text-xs text-text-secondary">Sessions</div>
                  </div>
                </div>

                {mentor.industry && (
                  <span className="text-xs border border-[#2a2a2a] text-text-secondary px-2 py-0.5 rounded">{mentor.industry}</span>
                )}

                <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
                  <span className="text-xs text-gold font-medium">Request Insight</span>
                  <ChevronRight className="w-3 h-3 text-text-secondary" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
