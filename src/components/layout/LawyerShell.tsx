"use client";

import { useState } from "react";

import { LawyerSidebar } from "@/components/layout/LawyerSidebar";
import { LawyerTopbar } from "@/components/layout/LawyerTopbar";

export function LawyerShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <LawyerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <LawyerTopbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
