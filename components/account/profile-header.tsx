"use client";

import { Calendar, Mail, Phone } from "lucide-react";
import { useUserStore } from "@/lib/store/user-store";
import { AvatarUpload } from "./avatar-upload";
import { cn } from "@/lib/utils";

export function ProfileHeader() {
  const user = useUserStore((s) => s.user);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="flex flex-col items-center text-center gap-3 sm:gap-4 py-2">
      <AvatarUpload />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {user?.name || "کاربر سپندتن"}
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 mt-1">
          {user?.email && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>
          )}
          {user?.phone && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {user.phone}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
        <Calendar className="w-3.5 h-3.5" />
        <span>عضو از {memberSince}</span>
      </div>

      {user?.subscriptionStatus && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full font-medium",
              user.subscriptionStatus === "vip" &&
                "bg-amber-500/10 text-amber-500",
              user.subscriptionStatus === "ai_plan" &&
                "bg-blue-500/10 text-blue-500",
              user.subscriptionStatus === "coach_plan" &&
                "bg-emerald-500/10 text-emerald-500",
              (!user.subscriptionStatus ||
                user.subscriptionStatus === "free") &&
                "bg-muted text-muted-foreground",
            )}
          >
            {user.subscriptionStatus === "vip" && "⭐ VIP"}
            {user.subscriptionStatus === "ai_plan" && "🤖 پلن هوشمند"}
            {user.subscriptionStatus === "coach_plan" && "👨‍🏫 پلن مربی"}
            {(!user.subscriptionStatus || user.subscriptionStatus === "free") &&
              "رایگان"}
          </span>
        </div>
      )}
    </div>
  );
}
