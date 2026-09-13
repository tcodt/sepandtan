"use client";

import { Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle?: string;
  nextTitle?: string;
  loading?: boolean;
  allowed?: boolean;
  onConfirm: () => void;
};

export function PlanSwitchConfirmSheet({
  open,
  onOpenChange,
  currentTitle,
  nextTitle,
  loading,
  allowed = true,
  onConfirm,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg mx-auto">
        <DrawerHeader className="text-right">
          <DrawerTitle>فعال کردن این برنامه؟</DrawerTitle>
          <DrawerDescription className="text-sm leading-relaxed space-y-2 text-right">
            <span className="block">
              برنامه فعلی
              {currentTitle ? (
                <>
                  {" "}
                  («<span className="text-foreground">{currentTitle}</span>»)
                </>
              ) : null}{" "}
              آرشیو می‌شه. برنامه انتخاب‌شده فعال می‌شه و داشبورد، تمرین امروز و
              تغذیه بر اساس اون تغییر می‌کنه. داده‌های قبلی پاک نمی‌شن.
            </span>
            {nextTitle && (
              <span className="block text-muted-foreground">
                برنامه جدید:{" "}
                <span className="text-foreground font-medium">{nextTitle}</span>
              </span>
            )}
            {!allowed && (
              <span className="block text-amber-600 dark:text-amber-400 text-xs">
                برای سوییچ برنامه باید اشتراکت را ارتقا بدهی.
              </span>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
          <Button
            size="lg"
            className="flex-1 h-12 font-semibold"
            disabled={loading || !allowed}
            onClick={onConfirm}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال تغییر...
              </>
            ) : (
              "بله، فعال کن"
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
