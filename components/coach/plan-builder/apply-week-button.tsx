"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  onApply: () => void;
  disabled?: boolean;
};

export function ApplyWeekButton({ onApply, disabled }: Props) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={() => {
        onApply();
        toast.success("این هفته روی کل برنامه اعمال شد");
      }}
      disabled={disabled}
    >
      <Copy className="w-4 h-4" />
      <span className="hidden sm:inline">اعمال این هفته روی کل برنامه</span>
      <span className="sm:hidden">اعمال هفته</span>
    </Button>
  );
}
