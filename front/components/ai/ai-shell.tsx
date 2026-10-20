"use client";

import { useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AiSidebar } from "./ai-sidebar";
import { AiChat } from "./ai-chat";
import { Menu } from "lucide-react";

export function AiShell() {
  const [chatId, setChatId] = useState<string | null>("new");

  const handleNewChat = () => {
    setChatId(`new-${Date.now()}`);
  };

  const handleSelectChat = (id: string) => {
    setChatId(id);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full">
        <AiSidebar
          activeChatId={chatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
        />

        <SidebarInset className="flex flex-col min-w-0">
          {/* Mobile: Sidebar Trigger */}
          <div className="md:hidden flex items-center gap-2 border-b border-border px-3 h-12 shrink-0 bg-background/80 backdrop-blur-sm">
            <SidebarTrigger>
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <span className="text-sm font-medium text-foreground">
              چت هوشمند
            </span>
            <div className="flex-1" />
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-[8px] text-primary font-bold">AI</span>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <AiChat chatId={chatId} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
