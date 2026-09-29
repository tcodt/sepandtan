"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { PlanAccess } from "@/lib/types/access";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAccess: PlanAccess | null;
  nextAccess: PlanAccess | null;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmSwitchSheet({
  open,
  onOpenChange,
  currentAccess,
  nextAccess,
  onConfirm,
  isLoading,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg mx-auto">
        <DrawerHeader className="text-right">
          <DrawerTitle>تغییر برنامه فعال؟</DrawerTitle>
          <DrawerDescription className="text-right leading-relaxed">
            با فعال کردن این برنامه، برنامه فعلی شما از حالت فعال خارج می‌شود و
            فقط برای مشاهده در دسترس می‌ماند.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-3 text-sm">
          {currentAccess && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">برنامه فعلی</p>
              <p className="font-medium">{currentAccess.planTitle}</p>
            </div>
          )}
          {nextAccess && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs text-primary mb-1">برنامه جدید</p>
              <p className="font-medium">{nextAccess.planTitle}</p>
            </div>
          )}
        </div>

        <DrawerFooter className="gap-2">
          <Button onClick={onConfirm} disabled={isLoading} className="w-full">
            {isLoading ? "در حال تغییر..." : "تأیید و فعال‌سازی"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full" disabled={isLoading}>
              انصراف
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
