"use client";

import Link from "next/link";
import {
  SquarePen,
  History,
  House,
  LayoutDashboard,
  Dumbbell,
  Store,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";
import { LogoutDialog } from "../common/logout-dialog";

// ==================== MOCK HISTORY ====================
const chatHistory = [
  { id: "1", title: "برنامه فیتنس شخصی" },
  { id: "2", title: "تغذیه برای ورزشکاران" },
  { id: "3", title: "تمرینات خانگی" },
  { id: "4", title: "کاهش وزن سالم" },
  { id: "5", title: "تقویت عضلات شکم" },
];
// ======================================================

const navLinks = [
  { href: "/", label: "خانه", icon: House },
  { href: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/workouts", label: "حرکات", icon: Dumbbell },
  { href: "/store", label: "فروشگاه", icon: Store },
  { href: "/account", label: "حساب کاربری", icon: User },
  { href: "/settings", label: "تنظیمات", icon: Settings },
];

type AiSidebarProps = {
  activeChatId?: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
};

export function AiSidebar({
  activeChatId,
  onNewChat,
  onSelectChat,
}: AiSidebarProps) {
  const user = useUserStore((s) => s.user);

  return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      className="border-l border-border"
    >
      <SidebarHeader className="gap-2 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onNewChat}
              className="w-full justify-start gap-2 rounded-xl border border-border bg-background hover:bg-muted"
            >
              <SquarePen className="w-4 h-4 text-primary" />
              <span className="font-medium">گفتگوی جدید</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent
        className="overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch
          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-slate-100"
      >
        {/* تاریخچه */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-xs">
            <History className="w-3.5 h-3.5 text-primary" />
            تاریخچه چت‌ها
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatHistory.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "rounded-lg text-sm",
                      activeChatId === chat.id && "bg-primary/10 text-primary",
                    )}
                  >
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* لینک‌های سریع */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">دسترسی سریع</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild className="rounded-lg">
                      <Link href={link.href}>
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="rounded-xl border border-border bg-background p-3 space-y-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name ?? "کاربر سپندتن"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email ?? user?.phone ?? "مهمان"}
            </p>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <LogoutDialog>
                <SidebarMenuButton className="text-destructive hover:text-destructive rounded-lg">
                  <LogOut className="w-4 h-4" />
                  <span>خروج</span>
                </SidebarMenuButton>
              </LogoutDialog>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
