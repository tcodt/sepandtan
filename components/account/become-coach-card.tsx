"use client";

import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Users,
  Wallet,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserStore } from "@/lib/store/user-store";
import { canRequestProfessionalRole } from "@/lib/role-lock";
import { setRoleFlowIntent } from "@/lib/auth/resolve-post-auth-path";

export function BecomeCoachCard() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  const handleStart = () => {
    if (!user) {
      toast.error("ابتدا وارد حساب شو");
      router.push("/login");
      return;
    }

    // اگر قبلاً درخواست coach داده و pending است
    if (
      user.role === "coach" &&
      user.roleStatus &&
      user.roleStatus !== "approved"
    ) {
      router.push("/role-pending?type=coach");
      return;
    }

    if (user.role === "coach" && user.roleStatus === "approved") {
      router.push("/coach");
      return;
    }

    const gate = canRequestProfessionalRole(user, "coach");
    if (!gate.ok) {
      toast.error(gate.message);
      return;
    }

    setRoleFlowIntent("coach-apply");
    router.push("/role/coach-apply?from=account");
  };

  return (
    <Card className="border-primary/20 bg-linear-to-br from-primary/10 via-background/40 to-emerald-500/5 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              می‌خوای مربی شی؟
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              با پنل اختصاصی مربی، هنرجو جذب کن و از کمیسیون برنامه‌ها درآمد
              داشته باش.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
            <Users className="w-3.5 h-3.5" />
            مدیریت هنرجو
          </span>
          <span className="inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
            <Wallet className="w-3.5 h-3.5" />
            کمیسیون شفاف
          </span>
          <span className="inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
            <LayoutDashboard className="w-3.5 h-3.5" />
            پنل اختصاصی
          </span>
        </div>

        <Button
          type="button"
          className="w-full h-11 font-semibold gap-2"
          onClick={handleStart}
        >
          شروع مسیر مربیگری
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
