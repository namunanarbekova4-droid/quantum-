"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, BookmarkPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

export default function DecisionPage() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="border-b border-[#1a1a1a] px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 opacity-40 cursor-not-allowed"
          onClick={() => toast("Sharing is coming soon.", "info")}
        >
          <Share2 className="w-4 h-4" /> Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 opacity-40 cursor-not-allowed"
          onClick={() => toast("Saving is coming soon.", "info")}
        >
          <BookmarkPlus className="w-4 h-4" /> Save
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-16">
            <FileText className="w-10 h-10 text-[#333333] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Decision not found</h2>
            <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto leading-relaxed">
              This decision doesn&apos;t exist or hasn&apos;t been analyzed yet.
            </p>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/history")}>
              View History
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
