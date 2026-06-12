"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast { id: string; message: string; type: "success" | "error" | "info"; }
interface ToastContextType { toast: (message: string, type?: Toast["type"]) => void; }

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons  = { success: CheckCircle, error: AlertCircle, info: Info };
  const styles = {
    success: { border: "border-green-500/25", icon: "text-green-400", glow: "rgba(34,197,94,0.12)" },
    error:   { border: "border-red-500/25",   icon: "text-red-400",   glow: "rgba(239,68,68,0.12)" },
    info:    { border: "border-[#C9A84C]/25", icon: "text-[#C9A84C]", glow: "rgba(201,168,76,0.12)" },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = icons[t.type];
            const s = styles[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0,  scale: 1 }}
                exit={{    opacity: 0, y: 8,   scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "pointer-events-auto",
                  "flex items-center gap-3 px-4 py-3.5",
                  "bg-[#0F0A1F]/95 border rounded-xl",
                  "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
                  "backdrop-blur-sm min-w-[300px] max-w-[380px]",
                  s.border
                )}
                style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${s.glow.replace("0.12", "0.2")}, inset 0 1px 0 rgba(255,255,255,0.04)` }}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", s.icon)} />
                <span className="text-sm text-white flex-1 leading-snug">{t.message}</span>
                <button
                  onClick={() => remove(t.id)}
                  className="text-[#8B7CF8]/50 hover:text-white transition-colors ml-1 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
