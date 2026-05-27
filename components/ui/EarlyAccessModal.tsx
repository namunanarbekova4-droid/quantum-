"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EarlyAccessModalProps {
  onClose: () => void;
}

export function EarlyAccessModal({ onClose }: EarlyAccessModalProps) {
  const [activated, setActivated] = useState(false);
  const [loading, setLoading] = useState(false);

  const activate = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setActivated(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative bg-[#111111] border border-[#1a1a1a] rounded-xl p-8 max-w-md w-full shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[#555555] hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {!activated ? (
            <motion.div key="activate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-gold" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Welcome to Quantum Early Access</h2>
              <p className="text-sm text-[#888888] leading-relaxed mb-6">
                You&apos;re getting complimentary access while Quantum evolves. Help us build the future of decision intelligence.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Full access to all premium features",
                  "Help shape the product roadmap",
                  "Priority access to future releases",
                  "Founding member status",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-sm text-white">
                    <div className="w-4 h-4 bg-gold/20 border border-gold/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-gold" />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>
              <Button loading={loading} onClick={activate} className="w-full mb-3">
                Activate Free Access
              </Button>
              <button onClick={onClose} className="w-full text-sm text-[#555555] hover:text-[#888888] transition-colors py-2">
                Maybe later
              </button>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
              <div className="w-14 h-14 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-7 h-7 text-gold" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Access Activated</h2>
              <p className="text-sm text-[#888888] leading-relaxed mb-6">
                You now have complimentary access to all Quantum features during Early Access.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full text-sm text-gold font-medium mb-8">
                <Star className="w-3.5 h-3.5" />
                Founding Member
              </div>
              <Button onClick={onClose} className="w-full">
                Start Using Quantum
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
