import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider dir="rtl" defaultOpen={true}>
        <SidebarTrigger size={"default"} className="absolute top-4 left-10" />
        {children}
      </SidebarProvider>
    </div>
  );
}
