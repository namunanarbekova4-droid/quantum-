"use client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function RoomPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/rooms">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Rooms
          </Button>
        </Link>
      </div>
      <Card className="p-16 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">Room not found</h2>
        <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
          This room doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <div className="mt-6">
          <Link href="/dashboard/rooms">
            <Button variant="outline" size="sm">Back to Rooms</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
