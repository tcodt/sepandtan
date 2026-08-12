"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 2;
const ACCEPTED = "image/jpeg,image/png,image/webp";

export function AvatarUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [loading, setLoading] = useState(false);

  const initial = user?.name?.trim()?.charAt(0) || "ک";

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری مجاز است");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`حجم تصویر حداکثر ${MAX_SIZE_MB} مگابایت باشد`);
      return;
    }

    setLoading(true);

    try {
      // ==================== MOCK / LOCAL ====================
      // MVP: تبدیل به Base64 و ذخیره در Zustand
      // وقتی بک‌اند آماده شد:
      // const formData = new FormData();
      // formData.append("avatar", file);
      // const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
      // const { url } = await res.json();
      // updateProfile({ avatarUrl: url });
      // ======================================================

      const dataUrl = await readFileAsDataURL(file);
      updateProfile({ avatarUrl: dataUrl });
      toast.success("عکس پروفایل به‌روز شد");
    } catch {
      toast.error("آپلود تصویر ناموفق بود");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    updateProfile({ avatarUrl: undefined });
    toast.success("عکس پروفایل حذف شد");
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={cn(
            "relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20",
            "bg-primary/10 flex items-center justify-center",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            loading && "opacity-70",
          )}
          aria-label="تغییر عکس پروفایل"
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name || "پروفایل"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-primary">{initial}</span>
          )}

          <span className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            {loading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="absolute -bottom-1 -left-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background"
          aria-label="آپلود عکس"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          انتخاب عکس
        </Button>
        {user?.avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive gap-1"
            onClick={handleRemove}
            disabled={loading}
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        JPG، PNG یا WebP · حداکثر {MAX_SIZE_MB}MB
      </p>
    </div>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
