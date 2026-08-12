"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  };

  return (
    <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm">
      <textarea
        ref={textareaRef}
        dir="rtl"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="پیامت را بنویس..."
        rows={1}
        disabled={disabled}
        className={cn(
          "flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none text-right",
          "placeholder:text-muted-foreground max-h-30",
          "disabled:opacity-50",
        )}
      />
      <Button
        type="button"
        size="icon"
        className="rounded-xl shrink-0 h-10 w-10"
        disabled={disabled || !value.trim()}
        onClick={onSubmit}
      >
        {disabled ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowUp className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
