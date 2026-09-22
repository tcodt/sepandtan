"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  onApply: () => void | Promise<void>;
  disabled?: boolean;
  durationWeeks: number;
};

export function ApplyWeekButton({ onApply, disabled, durationWeeks }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled}
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">اعمال این هفته روی کل برنامه</span>
          <span className="sm:hidden">اعمال هفته</span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>اعمال الگوی هفته؟</AlertDialogTitle>
          <AlertDialogDescription className="text-right leading-relaxed">
            همین ۷ روز روی کل {durationWeeks.toLocaleString("fa-IR")} هفته
            برنامه تکرار می‌شود و سپس ذخیره خواهد شد.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2 sm:gap-2 rtl:flex-row-reverse">
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              void onApply();
            }}
          >
            اعمال کن
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
