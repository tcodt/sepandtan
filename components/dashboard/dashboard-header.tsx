"use client";

import { useUserStore } from "@/lib/store/user-store";
import { ModeToggle } from "@/components/common/mode-toggle";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Flame } from "lucide-react";
import Link from "next/link";
import { LogoutDialog } from "../common/logout-dialog";

export function DashboardHeader() {
  const { user } = useUserStore();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user?.avatarUrl}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <Flame className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">
              سلام {user?.name?.split(" ")[0] || "ورزشکار"} 👋
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              داشبورد سپندتن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/settings">
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
          <LogoutDialog>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive rounded-lg w-auto px-1 py-0.5"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </Button>
          </LogoutDialog>
        </div>
      </div>
    </header>
  );
}
