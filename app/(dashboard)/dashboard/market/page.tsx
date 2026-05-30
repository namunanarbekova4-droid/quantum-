"use client";
import { motion } from "framer-motion";
import { Globe, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/lib/i18n";

export default function MarketPage() {
  const { toast } = useToast();
  const { t } = useLanguage();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">{t.market.title}</h1>
        <p className="text-text-secondary mt-1">{t.market.subtitle}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-12">
        <Card className="p-16 text-center">
          <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Globe className="w-7 h-7 text-gold" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">{t.market.feedBeingConfigured}</h2>
          <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
            {t.market.feedDesc}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <span className="inline-block px-4 py-1.5 border border-[#2a2a2a] text-xs text-[#555555] rounded-full">
              {t.market.comingSoon}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => toast(t.market.notifyToast, "info")}
            >
              <Zap className="w-3.5 h-3.5" /> {t.market.notifyMe}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
