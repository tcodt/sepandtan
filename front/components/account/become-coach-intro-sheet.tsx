"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Users,
  Wallet,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue?: () => void;
};

const benefits = [
  {
    icon: LayoutDashboard,
    title: "پنل اختصاصی مربی",
    desc: "داشبورد، هنرجویان، درخواست‌ها و ساخت برنامه",
  },
  {
    icon: Users,
    title: "جذب و مدیریت هنرجو",
    desc: "درخواست‌ها را بپذیر و پیشرفت آن‌ها را دنبال کن",
  },
  {
    icon: FileText,
    title: "ساخت برنامه هفتگی",
    desc: "برنامه تمرینی و تغذیه اختصاصی بساز و منتشر کن",
  },
  {
    icon: Wallet,
    title: "کمیسیون ۲۰ تا ۲۵٪",
    desc: "از هر برنامه فعال هنرجو سهم دریافت کن",
  },
];

export function BecomeCoachIntroSheet({
  open,
  onOpenChange,
  onContinue,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "rounded-t-3xl overflow-y-auto p-4 md:p-8",
          // Mobile: bottom sheet look
          "h-[70vh] rounded-t-3xl",
          // Desktop: right-side panel look
          "md:h-full md:w-120 md:max-w-full md:rounded-none md:rounded-l-3xl",
        )}
      >
        <SheetHeader className="text-right space-y-2 pb-2">
          <SheetTitle className="text-xl font-bold">پنل مربی سپندتن</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            حسابت رو به یک پنل حرفه‌ای مربیگری ارتقا بده و از دانش و تجربه‌ات
            درآمد کسب کن.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">
              کمیسیون شفاف ۲۰ تا ۲۵ درصد
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            از هر برنامه فعال که به هنرجو اختصاص می‌دی، سهم دریافت می‌کنی.
          </p>
        </div>

        <SheetFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            className="w-full h-11 font-semibold"
            onClick={() => {
              onOpenChange(false);
              onContinue?.();
            }}
          >
            متوجه شدم، ادامه بده
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            بعداً
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
