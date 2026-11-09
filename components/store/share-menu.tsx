"use client";

import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Facebook,
  Linkedin,
  Mail,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* -------------------------------------------------------------------------- */
/* Clipboard helper — works even without the modern API                       */
/* -------------------------------------------------------------------------- */

async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API (needs HTTPS / localhost + user gesture)
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }

  // Legacy fallback: textarea + execCommand
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Share menu                                                                 */
/* -------------------------------------------------------------------------- */

type ShareMenuProps = {
  url: string;
  title: string;
  /** Optional short description to append */
  text?: string;
  className?: string;
};

export function ShareMenu({ url, title, text, className }: ShareMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const shareText = text ? `${text}\n${title}` : title;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(shareText);

  const targets = [
    {
      label: "واتساپ",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`,
    },
    {
      label: "تلگرام",
      icon: Send,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "فیسبوک",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "لینکدین",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "ایمیل",
      icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
    },
    {
      label: "پیامک",
      icon: MessageSquare,
      href: `sms:?body=${encodeURIComponent(`${shareText}\n${url}`)}`,
    },
  ];

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      toast.success("لینک محصول کپی شد");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("کپی خودکار ممکن نیست — لینک را دستی انتخاب کنید");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({ title, text: shareText, url });
    } catch {
      /* user cancelled — silent */
    }
  };

  const canUseNative =
    mounted &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={className ?? "h-12 w-12 rounded-xl"}
          aria-label="اشتراک‌گذاری محصول"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          اشتراک‌گذاری
        </DropdownMenuLabel>

        {canUseNative && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Smartphone className="me-2 h-4 w-4" />
              اشتراک‌گذاری با دستگاه
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleCopy}>
          {copied ? (
            <Check className="me-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="me-2 h-4 w-4" />
          )}
          {copied ? "کپی شد" : "کپی لینک"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {targets.map(({ label, icon: Icon, href }) => (
          <DropdownMenuItem key={label} asChild>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <Icon className="me-2 h-4 w-4" />
              {label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
