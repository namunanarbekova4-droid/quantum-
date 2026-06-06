"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: "FOUNDER" | "INVESTOR" | "EXECUTIVE";
  plan?: "trial" | "pro" | "max" | "premium";
}

export function DashboardLayout({ children, userName, userRole, plan }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#06040F] overflow-hidden">
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar plan={plan} />
      </div>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
            <Sidebar plan={plan} />
          </div>
        </>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex-shrink-0 flex items-center">
          <button
            className="lg:hidden p-4 text-text-secondary hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <TopBar userName={userName} userRole={userRole as "FOUNDER" | "INVESTOR" | "EXECUTIVE" | undefined} />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
