"use client";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/lib/i18n";

export default function RoomsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.rooms.title}</h1>
          <p className="text-text-secondary mt-1">{t.rooms.subtitle}</p>
        </div>
        <Button
          onClick={() => toast("Private Rooms are coming soon. You'll be notified when this feature is available.", "info")}
          className="gap-2"
        >
          <Lock className="w-4 h-4" /> {t.rooms.createRoom}
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-12">
        <Card className="p-16 text-center">
          <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-gold" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Your confidential decision rooms will appear here</h2>
          <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
            Private Rooms allow you to collaborate on high-stakes decisions with trusted advisors in a secure, end-to-end encrypted space.
          </p>
          <div className="mt-8">
            <span className="inline-block px-4 py-1.5 border border-[#2a2a2a] text-xs text-[#555555] rounded-full">
              Coming soon
            </span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
