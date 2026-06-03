"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { StrategicToolsHub } from "@/components/dashboard/StrategicToolsHub";
import { type Plan } from "@/lib/plans";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function ToolsPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [plan, setPlan] = useState<Plan>("FREE_TRIAL");

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.plan) setPlan(d.plan); });
  }, []);

  const role = ((session?.user as { role?: string })?.role ?? "FOUNDER") as "FOUNDER" | "INVESTOR" | "EXECUTIVE";

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <Wrench className="w-6 h-6 text-[#C9A84C]" />
          <div>
            <h1 className="text-2xl font-bold text-white">{t.nav.strategicTools}</h1>
            <p className="text-[#888] text-sm mt-0.5">{t.dashboard.subtitle}</p>
          </div>
        </div>
        <StrategicToolsHub role={role} plan={plan} />
      </motion.div>
    </div>
  );
}
