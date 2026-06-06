"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Loader2, Check, Bell, UserPlus } from "lucide-react";

const ALL_SKILLS = [
  "Engineering", "Design", "Marketing", "Sales", "Finance",
  "Operations", "Legal", "AI/ML", "Product", "Data", "DevOps", "Growth",
];

const STAGES = ["Idea", "Building MVP", "MVP Ready", "Revenue"];
const COMMITMENTS = ["Full-time", "Part-time", "Evenings/Weekends"];
const EQUITY_OPTIONS = ["50/50", "Negotiable", "Founder takes more"];
const WORK_STYLES = ["Move fast", "Methodical", "Structured"];

function SkillChip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        selected
          ? "bg-[#7C3AED] text-white border border-[#7C3AED]"
          : "bg-[#06040F] text-[#8B7CF8] border border-[#1A1040] hover:border-[#7C3AED]"
      }`}
    >
      {selected && <span className="mr-1">✓</span>}
      {label}
    </button>
  );
}

function RadioGroup({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === opt
              ? "bg-[#7C3AED] text-white border border-[#7C3AED]"
              : "bg-[#06040F] text-[#8B7CF8] border border-[#1A1040] hover:border-[#7C3AED]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function CofounderPage() {
  const [tab, setTab] = useState<"find" | "profile">("find");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [totalFounders, setTotalFounders] = useState(0);
  const [profile, setProfile] = useState({
    skills: [] as string[],
    neededSkills: [] as string[],
    ideaDescription: "",
    stage: "Idea",
    commitment: "Full-time",
    locationPref: "",
    equityExpectation: "Negotiable",
    workStyle: "Move fast",
  });

  useEffect(() => {
    fetch("/api/cofounder")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.totalFounders !== undefined) setTotalFounders(data.totalFounders);
        if (data?.profile) {
          setProfile({
            skills: data.profile.skills || [],
            neededSkills: data.profile.neededSkills || [],
            ideaDescription: data.profile.ideaDescription || "",
            stage: data.profile.stage || "Idea",
            commitment: data.profile.commitment || "Full-time",
            locationPref: data.profile.locationPref || "",
            equityExpectation: data.profile.equityExpectation || "Negotiable",
            workStyle: data.profile.workStyle || "Move fast",
          });
        }
      })
      .catch(() => {});
  }, []);

  function toggleSkill(skill: string, field: "skills" | "neededSkills") {
    setProfile(p => ({
      ...p,
      [field]: p[field].includes(skill) ? p[field].filter(s => s !== skill) : [...p[field], skill],
    }));
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await fetch("/api/cofounder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#A855F7]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Co-founder Match</h1>
            <p className="text-[#8B7CF8] text-sm mt-0.5">Find your ideal technical or business co-founder</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-1 mb-6 w-fit">
          {(["find", "profile"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? "bg-[#7C3AED] text-white" : "text-[#8B7CF8] hover:text-white"
              }`}
            >
              {t === "find" ? "Find Co-founder" : "My Profile"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "find" && (
            <motion.div
              key="find"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {/* Coming Soon State */}
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-12 text-center shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                {/* Person icon with gradient */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                  <UserPlus className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-white text-xl font-bold mb-3">Co-founder matching is warming up</h2>
                <p className="text-[#8B7CF8]/70 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                  Complete your profile and we&apos;ll notify you when compatible co-founders join Quantum.
                  We match on skills, stage, work style, and commitment level.
                </p>

                {/* Founders count */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full text-sm text-[#A855F7] mb-6">
                  <span className="w-2 h-2 bg-[#A855F7] rounded-full animate-pulse" />
                  {totalFounders > 0 ? `${totalFounders} founder${totalFounders !== 1 ? "s have" : " has"} joined this week` : "Be among the first founders to join"}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setTab("profile")}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-semibold rounded-lg transition-all"
                  >
                    Complete My Profile
                  </button>
                  <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1040] border border-[#7C3AED]/30 text-[#A855F7] font-medium rounded-lg hover:bg-[#7C3AED]/10 transition-all">
                    <Bell className="w-4 h-4" />
                    Notify Me When Live
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)] space-y-5">

                {/* Your Skills */}
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-2 uppercase tracking-wider">Your Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SKILLS.map(s => (
                      <SkillChip
                        key={s}
                        label={s}
                        selected={profile.skills.includes(s)}
                        onClick={() => toggleSkill(s, "skills")}
                      />
                    ))}
                  </div>
                </div>

                {/* Skills Needed */}
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-2 uppercase tracking-wider">Skills You Need in a Co-founder</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SKILLS.map(s => (
                      <SkillChip
                        key={s}
                        label={s}
                        selected={profile.neededSkills.includes(s)}
                        onClick={() => toggleSkill(s, "neededSkills")}
                      />
                    ))}
                  </div>
                </div>

                {/* Startup Idea */}
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">Startup Idea</label>
                  <textarea
                    value={profile.ideaDescription}
                    onChange={e => setProfile(p => ({ ...p, ideaDescription: e.target.value }))}
                    rows={3}
                    placeholder="Describe what you're building, the problem you're solving, and your vision..."
                    className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B7CF8]/30 focus:outline-none focus:border-[#7C3AED] resize-none"
                  />
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-2 uppercase tracking-wider">Stage</label>
                  <RadioGroup options={STAGES} value={profile.stage} onChange={v => setProfile(p => ({ ...p, stage: v }))} />
                </div>

                {/* Commitment */}
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-2 uppercase tracking-wider">Commitment</label>
                  <RadioGroup options={COMMITMENTS} value={profile.commitment} onChange={v => setProfile(p => ({ ...p, commitment: v }))} />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">Location Preference</label>
                  <input
                    value={profile.locationPref}
                    onChange={e => setProfile(p => ({ ...p, locationPref: e.target.value }))}
                    placeholder="e.g. Remote, San Francisco, London, Anywhere..."
                    className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#8B7CF8]/30 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                {/* Equity */}
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-2 uppercase tracking-wider">Equity Expectation</label>
                  <RadioGroup options={EQUITY_OPTIONS} value={profile.equityExpectation} onChange={v => setProfile(p => ({ ...p, equityExpectation: v }))} />
                </div>

                {/* Work Style */}
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-2 uppercase tracking-wider">Work Style</label>
                  <RadioGroup options={WORK_STYLES} value={profile.workStyle} onChange={v => setProfile(p => ({ ...p, workStyle: v }))} />
                </div>

                <button
                  onClick={saveProfile}
                  disabled={saving || !profile.ideaDescription}
                  className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                  {saving ? "Saving..." : saved ? "Profile Saved!" : "Save Profile"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
