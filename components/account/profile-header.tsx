"use client";

import { UserRound } from "lucide-react";
import { useUserStore } from "@/lib/store/user-store";
import { AvatarUpload } from "./avatar-upload";

export function ProfileHeader() {
  const user = useUserStore((s) => s.user);

  return (
    <div className="flex flex-col items-center text-center gap-3 py-2">
      <AvatarUpload />

      <div>
        <h2 className="text-lg font-bold text-foreground">
          {user?.name || "کاربر سپندتن"}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user?.email || user?.phone || "—"}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <UserRound className="w-3.5 h-3.5" />
        عضو از{" "}
        {user?.createdAt
          ? new Date(user.createdAt).toLocaleDateString("fa-IR")
          : "—"}
      </div>
    </div>
  );
}
